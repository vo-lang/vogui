use std::{
    collections::BTreeMap,
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc::{self, Receiver, SyncSender, TryRecvError, TrySendError},
        Arc,
    },
};

use objc2::{
    define_class, msg_send, rc::Retained, runtime::AnyObject, DefinedClass, MainThreadMarker,
    MainThreadOnly,
};
use objc2_app_kit::{
    NSAccessibility, NSAccessibilityButtonRole, NSAccessibilityCellRole,
    NSAccessibilityCheckBoxRole, NSAccessibilityComboBoxRole, NSAccessibilityElement,
    NSAccessibilityGroupRole, NSAccessibilityHelpTagRole, NSAccessibilityImageRole,
    NSAccessibilityLinkRole, NSAccessibilityListRole, NSAccessibilityMenuItemRole,
    NSAccessibilityMenuRole, NSAccessibilityOutlineRole, NSAccessibilityPopUpButtonRole,
    NSAccessibilityProgressIndicatorRole, NSAccessibilityRadioButtonRole, NSAccessibilityRole,
    NSAccessibilityRowRole, NSAccessibilityScrollAreaRole, NSAccessibilitySliderRole,
    NSAccessibilityStaticTextRole, NSAccessibilityTabGroupRole, NSAccessibilityTableRole,
    NSAccessibilityTextFieldRole,
};
use objc2_foundation::{NSArray, NSPoint, NSRect, NSSize, NSString};
use vogui_protocol::v2::{NodeId, UiRootId};
use vogui_runtime::semantics::{SemanticAction, SemanticRole};

use crate::{
    MacOsAccessibilitySink, NativeAccessibilityError, NativeAccessibilityNode,
    NativeAccessibilityTree,
};

const ERROR_WRONG_THREAD: u32 = 100;
const ERROR_INVALID_HOST: u32 = 101;
const ERROR_INVALID_GEOMETRY: u32 = 102;
const ERROR_INVALID_TREE: u32 = 103;
const ERROR_ACTION_OVERFLOW: u32 = 104;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct AppKitFrameTransform {
    /// Logical source units per AppKit point.
    pub logical_units_per_point: f64,
    /// Height of the dedicated UiRoot host in AppKit points.
    pub host_height_points: f64,
    /// Vogui layout coordinates start at the top-left when this is true.
    pub source_is_top_left: bool,
}

impl Default for AppKitFrameTransform {
    fn default() -> Self {
        Self {
            logical_units_per_point: 1_000.0,
            host_height_points: 0.0,
            source_is_top_left: true,
        }
    }
}

impl AppKitFrameTransform {
    fn validate(self) -> Result<Self, NativeAccessibilityError> {
        if !self.logical_units_per_point.is_finite()
            || self.logical_units_per_point <= 0.0
            || !self.host_height_points.is_finite()
            || self.host_height_points < 0.0
        {
            return Err(error(
                ERROR_INVALID_GEOMETRY,
                "invalid AppKit frame transform",
            ));
        }
        Ok(self)
    }

    fn rect(self, node: &NativeAccessibilityNode) -> Result<NSRect, NativeAccessibilityError> {
        let unit = self.logical_units_per_point;
        let x = f64::from(node.x_milli) / unit;
        let source_y = f64::from(node.y_milli) / unit;
        let width = f64::from(node.width_milli) / unit;
        let height = f64::from(node.height_milli) / unit;
        if width < 0.0 || height < 0.0 {
            return Err(error(
                ERROR_INVALID_GEOMETRY,
                "negative accessibility bounds",
            ));
        }
        let y = if self.source_is_top_left {
            self.host_height_points - source_y - height
        } else {
            source_y
        };
        if !x.is_finite() || !y.is_finite() || !width.is_finite() || !height.is_finite() {
            return Err(error(
                ERROR_INVALID_GEOMETRY,
                "non-finite accessibility bounds",
            ));
        }
        Ok(NSRect::new(NSPoint::new(x, y), NSSize::new(width, height)))
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppKitAccessibilityAction {
    pub root: UiRootId,
    pub tree_revision: u64,
    pub semantic_revision: u64,
    pub node: NodeId,
    pub action: SemanticAction,
    pub value: Vec<u8>,
}

pub struct AppKitAccessibilityActionReceiver {
    receiver: Receiver<AppKitAccessibilityAction>,
    overflowed: Arc<AtomicBool>,
}

impl AppKitAccessibilityActionReceiver {
    pub fn try_recv(&self) -> Result<Option<AppKitAccessibilityAction>, NativeAccessibilityError> {
        if self.overflowed.swap(false, Ordering::AcqRel) {
            return Err(error(
                ERROR_ACTION_OVERFLOW,
                "AppKit accessibility action channel overflowed",
            ));
        }
        match self.receiver.try_recv() {
            Ok(action) => Ok(Some(action)),
            Err(TryRecvError::Empty) => Ok(None),
            Err(TryRecvError::Disconnected) => Ok(None),
        }
    }
}

#[derive(Clone)]
struct ElementIdentity {
    root: UiRootId,
    tree_revision: u64,
    semantic_revision: u64,
    node: NodeId,
}

struct AppKitElementIvars {
    identity: ElementIdentity,
    allowed_actions: Vec<SemanticAction>,
    sender: SyncSender<AppKitAccessibilityAction>,
    overflowed: Arc<AtomicBool>,
    generation_enabled: Arc<AtomicBool>,
}

define_class!(
    #[unsafe(super(NSAccessibilityElement))]
    #[name = "VoguiAccessibilityElement"]
    #[thread_kind = MainThreadOnly]
    #[ivars = AppKitElementIvars]
    struct AppKitSemanticElement;

    impl AppKitSemanticElement {
        #[unsafe(method(accessibilityPerformPress))]
        fn accessibility_perform_press(&self) -> bool {
            self.enqueue(SemanticAction::Press, Vec::new())
        }

        #[unsafe(method(accessibilityPerformIncrement))]
        fn accessibility_perform_increment(&self) -> bool {
            self.enqueue(SemanticAction::Increment, Vec::new())
        }

        #[unsafe(method(accessibilityPerformDecrement))]
        fn accessibility_perform_decrement(&self) -> bool {
            self.enqueue(SemanticAction::Decrement, Vec::new())
        }

        #[unsafe(method(accessibilityPerformCancel))]
        fn accessibility_perform_cancel(&self) -> bool {
            self.enqueue(SemanticAction::Dismiss, Vec::new())
        }

        #[unsafe(method(accessibilityPerformShowMenu))]
        fn accessibility_perform_show_menu(&self) -> bool {
            self.enqueue(SemanticAction::Expand, Vec::new())
        }
    }
);

impl AppKitSemanticElement {
    fn new(
        mtm: MainThreadMarker,
        identity: ElementIdentity,
        allowed_actions: Vec<SemanticAction>,
        sender: SyncSender<AppKitAccessibilityAction>,
        overflowed: Arc<AtomicBool>,
        generation_enabled: Arc<AtomicBool>,
    ) -> Retained<Self> {
        let this = mtm.alloc().set_ivars(AppKitElementIvars {
            identity,
            allowed_actions,
            sender,
            overflowed,
            generation_enabled,
        });
        // SAFETY: NSAccessibilityElement has a valid NSObject-style init method
        // and `this` was allocated on the AppKit main thread.
        unsafe { msg_send![super(this), init] }
    }

    fn enqueue(&self, action: SemanticAction, value: Vec<u8>) -> bool {
        let ivars = self.ivars();
        if !ivars.generation_enabled.load(Ordering::Acquire)
            || !ivars.allowed_actions.contains(&action)
        {
            return false;
        }
        let action = AppKitAccessibilityAction {
            root: ivars.identity.root,
            tree_revision: ivars.identity.tree_revision,
            semantic_revision: ivars.identity.semantic_revision,
            node: ivars.identity.node,
            action,
            value,
        };
        match ivars.sender.try_send(action) {
            Ok(()) => true,
            Err(TrySendError::Full(_)) => {
                ivars.overflowed.store(true, Ordering::Release);
                false
            }
            Err(TrySendError::Disconnected(_)) => false,
        }
    }
}

pub struct AppKitAccessibilityTransaction {
    root: Retained<AppKitSemanticElement>,
    nodes: BTreeMap<NodeId, Retained<AppKitSemanticElement>>,
    generation_enabled: Arc<AtomicBool>,
}

pub struct AppKitAccessibilitySink {
    host: Retained<AnyObject>,
    sender: SyncSender<AppKitAccessibilityAction>,
    overflowed: Arc<AtomicBool>,
    transform: AppKitFrameTransform,
    current: Option<AppKitAccessibilityTransaction>,
    visible: bool,
    closed: bool,
}

impl AppKitAccessibilitySink {
    /// Creates a sink for a dedicated AppKit accessibility host object.
    ///
    /// The host must implement `setAccessibilityChildren:` and be owned by the
    /// caller for at least as long as this sink. All methods must run on the
    /// process main thread.
    pub fn new(
        host: Retained<AnyObject>,
        max_pending_actions: usize,
        transform: AppKitFrameTransform,
    ) -> Result<(Self, AppKitAccessibilityActionReceiver), NativeAccessibilityError> {
        require_main_thread()?;
        if max_pending_actions == 0 {
            return Err(error(
                ERROR_ACTION_OVERFLOW,
                "accessibility action capacity must be positive",
            ));
        }
        transform.validate()?;
        // SAFETY: `host` is a live Objective-C object. Querying selector
        // support does not mutate it.
        let responds: bool = unsafe {
            msg_send![&*host, respondsToSelector: objc2::sel!(setAccessibilityChildren:)]
        };
        if !responds {
            return Err(error(
                ERROR_INVALID_HOST,
                "AppKit host lacks setAccessibilityChildren:",
            ));
        }
        let (sender, receiver) = mpsc::sync_channel(max_pending_actions);
        let overflowed = Arc::new(AtomicBool::new(false));
        Ok((
            Self {
                host,
                sender,
                overflowed: Arc::clone(&overflowed),
                transform,
                current: None,
                visible: false,
                closed: false,
            },
            AppKitAccessibilityActionReceiver {
                receiver,
                overflowed,
            },
        ))
    }

    pub fn set_frame_transform(
        &mut self,
        transform: AppKitFrameTransform,
    ) -> Result<(), NativeAccessibilityError> {
        require_main_thread()?;
        self.transform = transform.validate()?;
        Ok(())
    }

    /// Routes actions that AppKit adapters surface outside the standard
    /// press/increment/decrement/cancel selectors.
    pub fn dispatch_action(&self, node: NodeId, action: SemanticAction, value: Vec<u8>) -> bool {
        let Some(current) = self.current.as_ref() else {
            return false;
        };
        let Some(element) = current.nodes.get(&node) else {
            return false;
        };
        element.enqueue(action, value)
    }

    fn attach_root(&self, root: Option<&Retained<AppKitSemanticElement>>) {
        let roots = match root {
            Some(root) => NSArray::from_slice(&[root.as_ref()]),
            None => NSArray::<AppKitSemanticElement>::new(),
        };
        // SAFETY: Constructor verified the dedicated host responds to this
        // selector. The NSArray and every retained child remain live for the
        // duration of the message.
        unsafe {
            let _: () = msg_send![&*self.host, setAccessibilityChildren: &*roots];
        }
    }
}

impl MacOsAccessibilitySink for AppKitAccessibilitySink {
    type Transaction = AppKitAccessibilityTransaction;

    fn stage(
        &mut self,
        desired: &NativeAccessibilityTree,
    ) -> Result<Self::Transaction, NativeAccessibilityError> {
        let mtm = require_main_thread()?;
        if self.closed {
            return Err(error(ERROR_INVALID_HOST, "AppKit sink is closed"));
        }
        if !desired.nodes.contains_key(&desired.root) {
            return Err(error(
                ERROR_INVALID_TREE,
                "accessibility root node is missing",
            ));
        }
        let generation_enabled = Arc::new(AtomicBool::new(false));
        let mut nodes = BTreeMap::new();
        for node in desired.nodes.values() {
            let element = AppKitSemanticElement::new(
                mtm,
                ElementIdentity {
                    root: desired.root_owner,
                    tree_revision: desired.tree_revision,
                    semantic_revision: desired.semantic_revision,
                    node: node.node,
                },
                node.actions.clone(),
                self.sender.clone(),
                Arc::clone(&self.overflowed),
                Arc::clone(&generation_enabled),
            );
            configure_element(&element, node, self.transform)?;
            nodes.insert(node.node, element);
        }
        for node in desired.nodes.values() {
            let element = nodes
                .get(&node.node)
                .ok_or_else(|| error(ERROR_INVALID_TREE, "staged node disappeared"))?;
            let mut children = Vec::with_capacity(node.children.len());
            for child_id in &node.children {
                let child = nodes
                    .get(child_id)
                    .ok_or_else(|| error(ERROR_INVALID_TREE, "accessibility child is missing"))?;
                children.push(child.clone());
                // SAFETY: Both objects are live AppKit accessibility elements
                // in the same staged generation.
                unsafe {
                    child.setAccessibilityParent(Some(element.as_ref()));
                }
            }
            let array = NSArray::from_retained_slice(&children);
            // SAFETY: The array contains only NSAccessibilityElement
            // subclasses and therefore satisfies the untyped AppKit property.
            unsafe {
                element.setAccessibilityChildren(Some(array.cast_unchecked::<AnyObject>()));
            }
        }
        let root = nodes
            .get(&desired.root)
            .cloned()
            .ok_or_else(|| error(ERROR_INVALID_TREE, "accessibility root node is missing"))?;
        // SAFETY: The dedicated host remains retained by this sink.
        unsafe {
            root.setAccessibilityParent(Some(&self.host));
        }
        Ok(AppKitAccessibilityTransaction {
            root,
            nodes,
            generation_enabled,
        })
    }

    fn apply(&mut self, transaction: Self::Transaction) -> Result<(), NativeAccessibilityError> {
        require_main_thread()?;
        if self.closed {
            return Err(error(ERROR_INVALID_HOST, "AppKit sink is closed"));
        }
        if let Some(current) = self.current.as_ref() {
            current.generation_enabled.store(false, Ordering::Release);
        }
        if self.visible {
            self.attach_root(Some(&transaction.root));
        }
        self.current = Some(transaction);
        Ok(())
    }

    fn set_actions_enabled(&mut self, enabled: bool) {
        if let Some(current) = self.current.as_ref() {
            current
                .generation_enabled
                .store(enabled && !self.closed, Ordering::Release);
        }
    }

    fn set_tree_visible(&mut self, visible: bool) {
        if require_main_thread().is_err() || self.closed {
            return;
        }
        self.visible = visible;
        self.attach_root(if visible {
            self.current.as_ref().map(|current| &current.root)
        } else {
            None
        });
    }

    fn close(&mut self) {
        if require_main_thread().is_err() || self.closed {
            return;
        }
        if let Some(current) = self.current.as_ref() {
            current.generation_enabled.store(false, Ordering::Release);
        }
        self.attach_root(None);
        self.current = None;
        self.visible = false;
        self.closed = true;
    }
}

fn configure_element(
    element: &AppKitSemanticElement,
    node: &NativeAccessibilityNode,
    transform: AppKitFrameTransform,
) -> Result<(), NativeAccessibilityError> {
    element.setAccessibilityElement(true);
    element.setAccessibilityRole(Some(appkit_role(node.role)));
    element.setAccessibilityFrameInParentSpace(transform.rect(node)?);
    let identifier = NSString::from_str(&format!(
        "vogui-node-{}-{}",
        node.node.index, node.node.generation
    ));
    element.setAccessibilityIdentifier(Some(&identifier));
    let label = string_or_none(&node.label);
    element.setAccessibilityLabel(label.as_deref());
    element.setAccessibilityTitle(label.as_deref());
    let description = string_or_none(&node.description);
    element.setAccessibilityHelp(description.as_deref());
    let value = string_or_none(&node.value);
    element.setAccessibilityValueDescription(value.as_deref());
    if let Some(value) = value.as_deref() {
        // SAFETY: NSString is an Objective-C object accepted by the
        // id-typed accessibility value property.
        unsafe {
            element.setAccessibilityValue(Some(value));
        }
    }
    element.setAccessibilityEnabled(!node.states.disabled);
    if let Some(selected) = node.states.selected {
        element.setAccessibilitySelected(selected);
    }
    if let Some(expanded) = node.states.expanded {
        element.setAccessibilityExpanded(expanded);
    }
    element.setAccessibilityRequired(node.states.required);
    Ok(())
}

fn string_or_none(value: &str) -> Option<Retained<NSString>> {
    (!value.is_empty()).then(|| NSString::from_str(value))
}

fn appkit_role(role: SemanticRole) -> &'static NSAccessibilityRole {
    // SAFETY: AppKit exports these process-lifetime role NSString constants.
    unsafe {
        match role {
            SemanticRole::Text | SemanticRole::Label | SemanticRole::LiveRegion => {
                NSAccessibilityStaticTextRole
            }
            SemanticRole::Image => NSAccessibilityImageRole,
            SemanticRole::Button | SemanticRole::Switch => NSAccessibilityButtonRole,
            SemanticRole::Link => NSAccessibilityLinkRole,
            SemanticRole::TextField => NSAccessibilityTextFieldRole,
            SemanticRole::Checkbox => NSAccessibilityCheckBoxRole,
            SemanticRole::Radio => NSAccessibilityRadioButtonRole,
            SemanticRole::Slider => NSAccessibilitySliderRole,
            SemanticRole::ComboBox => NSAccessibilityComboBoxRole,
            SemanticRole::ListBox => NSAccessibilityPopUpButtonRole,
            SemanticRole::Option | SemanticRole::ListItem => NSAccessibilityCellRole,
            SemanticRole::Progress => NSAccessibilityProgressIndicatorRole,
            SemanticRole::Tab | SemanticRole::TabList | SemanticRole::TabPanel => {
                NSAccessibilityTabGroupRole
            }
            SemanticRole::Dialog | SemanticRole::Tooltip => NSAccessibilityHelpTagRole,
            SemanticRole::Menu => NSAccessibilityMenuRole,
            SemanticRole::MenuItem => NSAccessibilityMenuItemRole,
            SemanticRole::List => NSAccessibilityListRole,
            SemanticRole::Table => NSAccessibilityTableRole,
            SemanticRole::Row => NSAccessibilityRowRole,
            SemanticRole::Cell => NSAccessibilityCellRole,
            SemanticRole::Tree | SemanticRole::TreeItem => NSAccessibilityOutlineRole,
            SemanticRole::ScrollView => NSAccessibilityScrollAreaRole,
            SemanticRole::Form | SemanticRole::Group => NSAccessibilityGroupRole,
        }
    }
}

fn require_main_thread() -> Result<MainThreadMarker, NativeAccessibilityError> {
    MainThreadMarker::new().ok_or_else(|| {
        error(
            ERROR_WRONG_THREAD,
            "AppKit accessibility must run on the process main thread",
        )
    })
}

fn error(code: u32, diagnostic: &str) -> NativeAccessibilityError {
    NativeAccessibilityError {
        code,
        diagnostic: diagnostic.as_bytes().to_vec(),
        platform_may_be_partially_visible: false,
    }
}
