use std::collections::{BTreeMap, BTreeSet, VecDeque};

pub use vogui_protocol::v2::{NodeId, UiRootId};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum SemanticRole {
    Text,
    Image,
    Button,
    Link,
    TextField,
    Checkbox,
    Switch,
    Radio,
    Slider,
    ComboBox,
    ListBox,
    Option,
    Form,
    Label,
    Progress,
    Tab,
    TabList,
    TabPanel,
    Dialog,
    Tooltip,
    Menu,
    MenuItem,
    List,
    ListItem,
    Table,
    Row,
    Cell,
    Tree,
    TreeItem,
    ScrollView,
    Group,
    LiveRegion,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum SemanticAction {
    Press,
    Focus,
    Blur,
    Increment,
    Decrement,
    SetValue,
    Expand,
    Collapse,
    Dismiss,
    ScrollForward,
    ScrollBackward,
}

#[derive(Clone, Copy, Debug, Default, Eq, Ord, PartialEq, PartialOrd)]
pub struct SemanticStates {
    pub disabled: bool,
    pub checked: Option<bool>,
    pub selected: Option<bool>,
    pub expanded: Option<bool>,
    pub busy: bool,
    pub invalid: bool,
    pub read_only: bool,
    pub required: bool,
}

#[derive(Clone, Copy, Debug, Default, Eq, Ord, PartialEq, PartialOrd)]
pub struct SemanticBounds {
    pub x_milli: i32,
    pub y_milli: i32,
    pub width_milli: i32,
    pub height_milli: i32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SemanticNode {
    pub node: NodeId,
    pub role: SemanticRole,
    pub label: String,
    pub description: String,
    pub value: String,
    pub locale: String,
    pub bounds: SemanticBounds,
    pub states: SemanticStates,
    pub actions: BTreeSet<SemanticAction>,
    pub relations: BTreeSet<NodeId>,
    pub children: Vec<NodeId>,
    pub focus_order: Option<i32>,
    pub live: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SemanticSnapshot {
    pub root: UiRootId,
    pub tree_revision: u64,
    pub semantic_revision: u64,
    pub root_node: NodeId,
    pub nodes: Vec<SemanticNode>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct SemanticConfig {
    pub max_nodes: usize,
    pub max_actions_per_node: usize,
    pub max_relations_per_node: usize,
    pub max_string_bytes: usize,
    pub max_action_queue: usize,
}

impl Default for SemanticConfig {
    fn default() -> Self {
        Self {
            max_nodes: 100_000,
            max_actions_per_node: 32,
            max_relations_per_node: 64,
            max_string_bytes: 1024 * 1024,
            max_action_queue: 1024,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum SemanticError {
    InvalidConfig,
    WrongRoot,
    StaleTreeRevision,
    SemanticRevision,
    NodeCapacity,
    StringCapacity,
    ActionCapacity,
    RelationCapacity,
    DuplicateNode,
    MissingRoot,
    UnknownNode,
    InvalidTree,
    MissingAccessibleName,
    UnsupportedAction,
    ActionQueueCapacity,
    ActionSequence,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SemanticActionRequest {
    pub sequence: u64,
    pub root: UiRootId,
    pub tree_revision: u64,
    pub semantic_revision: u64,
    pub node: NodeId,
    pub action: SemanticAction,
    pub value: Vec<u8>,
}

#[derive(Clone)]
pub struct SemanticTree {
    root: UiRootId,
    config: SemanticConfig,
    tree_revision: u64,
    semantic_revision: u64,
    root_node: Option<NodeId>,
    nodes: BTreeMap<NodeId, SemanticNode>,
    actions: VecDeque<SemanticActionRequest>,
    last_action_sequence: u64,
}

impl SemanticTree {
    pub fn new(root: UiRootId, config: SemanticConfig) -> Result<Self, SemanticError> {
        if !root.is_valid()
            || config.max_nodes == 0
            || config.max_actions_per_node == 0
            || config.max_relations_per_node == 0
            || config.max_string_bytes == 0
            || config.max_action_queue == 0
        {
            return Err(SemanticError::InvalidConfig);
        }
        Ok(Self {
            root,
            config,
            tree_revision: 0,
            semantic_revision: 0,
            root_node: None,
            nodes: BTreeMap::new(),
            actions: VecDeque::new(),
            last_action_sequence: 0,
        })
    }

    pub const fn tree_revision(&self) -> u64 {
        self.tree_revision
    }

    pub const fn semantic_revision(&self) -> u64 {
        self.semantic_revision
    }

    pub fn replace(&mut self, snapshot: SemanticSnapshot) -> Result<(), SemanticError> {
        if snapshot.root != self.root {
            return Err(SemanticError::WrongRoot);
        }
        if snapshot.tree_revision < self.tree_revision {
            return Err(SemanticError::StaleTreeRevision);
        }
        if snapshot.semantic_revision <= self.semantic_revision {
            return Err(SemanticError::SemanticRevision);
        }
        if snapshot.nodes.len() > self.config.max_nodes {
            return Err(SemanticError::NodeCapacity);
        }
        let mut nodes = BTreeMap::new();
        for node in snapshot.nodes {
            validate_node(&node, self.config)?;
            if nodes.insert(node.node, node).is_some() {
                return Err(SemanticError::DuplicateNode);
            }
        }
        validate_tree(snapshot.root_node, &nodes)?;
        self.nodes = nodes;
        self.root_node = Some(snapshot.root_node);
        self.tree_revision = snapshot.tree_revision;
        self.semantic_revision = snapshot.semantic_revision;
        Ok(())
    }

    pub fn snapshot(&self) -> Option<SemanticSnapshot> {
        Some(SemanticSnapshot {
            root: self.root,
            tree_revision: self.tree_revision,
            semantic_revision: self.semantic_revision,
            root_node: self.root_node?,
            nodes: self.nodes.values().cloned().collect(),
        })
    }

    pub fn focus_order(&self) -> Vec<NodeId> {
        let mut focusable = self
            .nodes
            .values()
            .filter_map(|node| {
                node.focus_order
                    .map(|order| (order, node.node.index, node.node))
            })
            .collect::<Vec<_>>();
        focusable.sort();
        focusable.into_iter().map(|(_, _, node)| node).collect()
    }

    pub fn submit_action(&mut self, request: SemanticActionRequest) -> Result<(), SemanticError> {
        if request.root != self.root
            || request.tree_revision != self.tree_revision
            || request.semantic_revision != self.semantic_revision
        {
            return Err(SemanticError::StaleTreeRevision);
        }
        if request.sequence <= self.last_action_sequence {
            return Err(SemanticError::ActionSequence);
        }
        let node = self
            .nodes
            .get(&request.node)
            .ok_or(SemanticError::UnknownNode)?;
        if !node.actions.contains(&request.action) {
            return Err(SemanticError::UnsupportedAction);
        }
        if self.actions.len() == self.config.max_action_queue {
            return Err(SemanticError::ActionQueueCapacity);
        }
        self.last_action_sequence = request.sequence;
        self.actions.push_back(request);
        Ok(())
    }

    pub fn poll_action(&mut self) -> Option<SemanticActionRequest> {
        self.actions.pop_front()
    }
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum ControlKind {
    Text,
    RichText,
    Image,
    Icon,
    Button,
    Link,
    TextField,
    PasswordField,
    TextArea,
    Checkbox,
    Switch,
    RadioGroup,
    Slider,
    Select,
    ListBox,
    ComboBox,
    Form,
    Label,
    Help,
    Error,
    Progress,
    Spinner,
    Tabs,
    Disclosure,
    Accordion,
    Dialog,
    Drawer,
    Tooltip,
    Popover,
    Menu,
    ContextMenu,
    List,
    Table,
    Tree,
    ScrollView,
    VirtualCollection,
    Portal,
    Overlay,
    Toast,
    FocusScope,
    LiveRegion,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum KeyboardPolicy {
    None,
    Activate,
    TextEdit,
    Toggle,
    ArrowValue,
    RovingHorizontal,
    RovingVertical,
    Dialog,
    Menu,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ControlContract {
    pub role: SemanticRole,
    pub keyboard: KeyboardPolicy,
    pub requires_name: bool,
    pub focusable: bool,
    pub establishes_focus_scope: bool,
    pub renderer_owns_measurement: bool,
}

pub fn control_contract(kind: ControlKind) -> ControlContract {
    use ControlKind as C;
    use KeyboardPolicy as K;
    use SemanticRole as R;
    match kind {
        C::Text | C::RichText | C::Help | C::Error => contract(R::Text, K::None, false, false),
        C::Image | C::Icon => contract(R::Image, K::None, true, false),
        C::Button => contract(R::Button, K::Activate, true, true),
        C::Link => contract(R::Link, K::Activate, true, true),
        C::TextField | C::PasswordField | C::TextArea => {
            contract(R::TextField, K::TextEdit, true, true)
        }
        C::Checkbox => contract(R::Checkbox, K::Toggle, true, true),
        C::Switch => contract(R::Switch, K::Toggle, true, true),
        C::RadioGroup => contract(R::Radio, K::RovingVertical, true, true),
        C::Slider => contract(R::Slider, K::ArrowValue, true, true),
        C::Select | C::ComboBox => contract(R::ComboBox, K::RovingVertical, true, true),
        C::ListBox => contract(R::ListBox, K::RovingVertical, true, true),
        C::Form => contract(R::Form, K::None, false, false),
        C::Label => contract(R::Label, K::None, false, false),
        C::Progress | C::Spinner => contract(R::Progress, K::None, true, false),
        C::Tabs => contract(R::TabList, K::RovingHorizontal, true, true),
        C::Disclosure | C::Accordion => contract(R::Group, K::Toggle, true, true),
        C::Dialog | C::Drawer => scoped(R::Dialog, K::Dialog),
        C::Tooltip => contract(R::Tooltip, K::None, true, false),
        C::Popover | C::Overlay | C::Portal => contract(R::Group, K::None, false, false),
        C::Menu | C::ContextMenu => scoped(R::Menu, K::Menu),
        C::List | C::VirtualCollection => measured(R::List, K::RovingVertical),
        C::Table => measured(R::Table, K::RovingVertical),
        C::Tree => measured(R::Tree, K::RovingVertical),
        C::ScrollView => measured(R::ScrollView, K::None),
        C::Toast | C::LiveRegion => contract(R::LiveRegion, K::None, true, false),
        C::FocusScope => scoped(R::Group, K::None),
    }
}

fn contract(
    role: SemanticRole,
    keyboard: KeyboardPolicy,
    requires_name: bool,
    focusable: bool,
) -> ControlContract {
    ControlContract {
        role,
        keyboard,
        requires_name,
        focusable,
        establishes_focus_scope: false,
        renderer_owns_measurement: false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn handle(index: u32) -> NodeId {
        NodeId {
            index,
            generation: 1,
        }
    }

    fn node(id: u32, role: SemanticRole, label: &str, children: Vec<NodeId>) -> SemanticNode {
        SemanticNode {
            node: handle(id),
            role,
            label: label.to_owned(),
            description: String::new(),
            value: String::new(),
            locale: "en-US".to_owned(),
            bounds: SemanticBounds::default(),
            states: SemanticStates::default(),
            actions: BTreeSet::new(),
            relations: BTreeSet::new(),
            children,
            focus_order: None,
            live: false,
        }
    }

    #[test]
    fn semantic_replace_is_atomic_and_rejects_disconnected_trees() {
        let root = handle(1);
        let mut tree = SemanticTree::new(root, SemanticConfig::default()).unwrap();
        tree.replace(SemanticSnapshot {
            root,
            tree_revision: 1,
            semantic_revision: 1,
            root_node: handle(2),
            nodes: vec![node(2, SemanticRole::Button, "save", Vec::new())],
        })
        .unwrap();

        let error = tree
            .replace(SemanticSnapshot {
                root,
                tree_revision: 2,
                semantic_revision: 2,
                root_node: handle(3),
                nodes: vec![
                    node(3, SemanticRole::Group, "", Vec::new()),
                    node(4, SemanticRole::Text, "", Vec::new()),
                ],
            })
            .unwrap_err();
        assert_eq!(error, SemanticError::InvalidTree);
        let last_good = tree.snapshot().unwrap();
        assert_eq!(last_good.tree_revision, 1);
        assert_eq!(last_good.nodes[0].label, "save");
    }

    #[test]
    fn action_admission_checks_identity_capability_and_sequence() {
        let root = handle(1);
        let button = handle(2);
        let mut semantic_node = node(2, SemanticRole::Button, "save", Vec::new());
        semantic_node.actions.insert(SemanticAction::Press);
        let mut tree = SemanticTree::new(root, SemanticConfig::default()).unwrap();
        tree.replace(SemanticSnapshot {
            root,
            tree_revision: 3,
            semantic_revision: 4,
            root_node: button,
            nodes: vec![semantic_node],
        })
        .unwrap();

        let request = SemanticActionRequest {
            sequence: 1,
            root,
            tree_revision: 3,
            semantic_revision: 4,
            node: button,
            action: SemanticAction::Press,
            value: Vec::new(),
        };
        tree.submit_action(request.clone()).unwrap();
        assert_eq!(
            tree.submit_action(request),
            Err(SemanticError::ActionSequence)
        );
        let mut unsupported = tree.poll_action().unwrap();
        unsupported.sequence = 2;
        unsupported.action = SemanticAction::Dismiss;
        assert_eq!(
            tree.submit_action(unsupported),
            Err(SemanticError::UnsupportedAction)
        );
    }

    #[test]
    fn control_contracts_encode_keyboard_focus_and_measurement_ownership() {
        let text = control_contract(ControlKind::TextField);
        assert_eq!(text.role, SemanticRole::TextField);
        assert_eq!(text.keyboard, KeyboardPolicy::TextEdit);
        assert!(text.focusable);
        assert!(!text.renderer_owns_measurement);

        let dialog = control_contract(ControlKind::Dialog);
        assert_eq!(dialog.keyboard, KeyboardPolicy::Dialog);
        assert!(dialog.establishes_focus_scope);

        let collection = control_contract(ControlKind::VirtualCollection);
        assert!(collection.renderer_owns_measurement);
    }
}

fn scoped(role: SemanticRole, keyboard: KeyboardPolicy) -> ControlContract {
    ControlContract {
        establishes_focus_scope: true,
        ..contract(role, keyboard, true, true)
    }
}

fn measured(role: SemanticRole, keyboard: KeyboardPolicy) -> ControlContract {
    ControlContract {
        renderer_owns_measurement: true,
        ..contract(role, keyboard, true, true)
    }
}

fn validate_node(node: &SemanticNode, config: SemanticConfig) -> Result<(), SemanticError> {
    if !node.node.is_valid() {
        return Err(SemanticError::UnknownNode);
    }
    if node.label.len() + node.description.len() + node.value.len() + node.locale.len()
        > config.max_string_bytes
    {
        return Err(SemanticError::StringCapacity);
    }
    if node.actions.len() > config.max_actions_per_node {
        return Err(SemanticError::ActionCapacity);
    }
    if node.relations.len() > config.max_relations_per_node {
        return Err(SemanticError::RelationCapacity);
    }
    if requires_accessible_name(node.role) && node.label.trim().is_empty() {
        return Err(SemanticError::MissingAccessibleName);
    }
    if node.bounds.width_milli < 0 || node.bounds.height_milli < 0 {
        return Err(SemanticError::InvalidTree);
    }
    Ok(())
}

fn validate_tree(
    root: NodeId,
    nodes: &BTreeMap<NodeId, SemanticNode>,
) -> Result<(), SemanticError> {
    if !nodes.contains_key(&root) {
        return Err(SemanticError::MissingRoot);
    }
    let mut seen = BTreeSet::new();
    let mut pending = vec![root];
    while let Some(node) = pending.pop() {
        if !seen.insert(node) {
            return Err(SemanticError::InvalidTree);
        }
        let record = nodes.get(&node).ok_or(SemanticError::UnknownNode)?;
        for relation in &record.relations {
            if !nodes.contains_key(relation) {
                return Err(SemanticError::UnknownNode);
            }
        }
        for child in record.children.iter().rev() {
            if !nodes.contains_key(child) {
                return Err(SemanticError::UnknownNode);
            }
            pending.push(*child);
        }
    }
    if seen.len() != nodes.len() {
        return Err(SemanticError::InvalidTree);
    }
    Ok(())
}

fn requires_accessible_name(role: SemanticRole) -> bool {
    matches!(
        role,
        SemanticRole::Image
            | SemanticRole::Button
            | SemanticRole::Link
            | SemanticRole::TextField
            | SemanticRole::Checkbox
            | SemanticRole::Switch
            | SemanticRole::Radio
            | SemanticRole::Slider
            | SemanticRole::ComboBox
            | SemanticRole::ListBox
            | SemanticRole::Option
            | SemanticRole::Progress
            | SemanticRole::Tab
            | SemanticRole::Dialog
            | SemanticRole::Tooltip
            | SemanticRole::Menu
            | SemanticRole::MenuItem
            | SemanticRole::TreeItem
            | SemanticRole::LiveRegion
    )
}
