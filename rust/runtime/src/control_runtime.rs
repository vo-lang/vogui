use std::collections::{BTreeMap, BTreeSet};

use vogui_protocol::v2::{NodeId, UiRootId, UiSessionId};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ControlRuntimeConfig {
    pub max_roving_groups: usize,
    pub max_items_per_group: usize,
    pub max_dialogs: usize,
    pub max_virtual_collections: usize,
    pub max_measurements_per_collection: usize,
    pub max_popups: usize,
    pub max_focus_scopes: usize,
}

impl Default for ControlRuntimeConfig {
    fn default() -> Self {
        Self {
            max_roving_groups: 1024,
            max_items_per_group: 100_000,
            max_dialogs: 64,
            max_virtual_collections: 256,
            max_measurements_per_collection: 100_000,
            max_popups: 256,
            max_focus_scopes: 256,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RovingAxis {
    Horizontal,
    Vertical,
    Both,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RovingItem {
    pub node: NodeId,
    pub disabled: bool,
    pub row: u32,
    pub column: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RovingMove {
    pub focused: NodeId,
    pub wrapped: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum FocusDirection {
    Previous,
    Next,
    Up,
    Down,
    Left,
    Right,
    First,
    Last,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct DialogDescriptor {
    pub root: UiRootId,
    pub dialog: NodeId,
    pub initial_focus: NodeId,
    pub return_focus: NodeId,
    pub dismiss_on_escape: bool,
    pub modal: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct DialogClose {
    pub dialog: NodeId,
    pub restore_focus: Option<NodeId>,
    pub root_remains_inert: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct VirtualCollectionDescriptor {
    pub root: UiRootId,
    pub node: NodeId,
    pub item_count: u64,
    pub estimated_item_extent: u32,
    pub overscan: u32,
    pub revision: u64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct VirtualWindow {
    pub revision: u64,
    pub first: u64,
    pub count: u32,
    pub before_extent: u64,
    pub after_extent: u64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PopupPlacement {
    Top,
    Bottom,
    Left,
    Right,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct PopupDescriptor {
    pub root: UiRootId,
    pub popup: NodeId,
    pub anchor: NodeId,
    pub preferred: PopupPlacement,
    pub offset: i32,
    pub flip: bool,
    pub shift: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct PopupGeometry {
    pub rect: Rect,
    pub placement: PopupPlacement,
    pub clipped: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct FocusScopeDescriptor {
    pub root: UiRootId,
    pub scope: NodeId,
    pub initial_focus: Option<NodeId>,
    pub return_focus: Option<NodeId>,
    pub trap: bool,
    pub restore: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FocusScopeSnapshot {
    pub descriptor: FocusScopeDescriptor,
    pub focusables: Vec<NodeId>,
    pub focused: Option<NodeId>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct FocusScopeClose {
    pub scope: NodeId,
    pub restore_focus: Option<NodeId>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ControlRuntimeError {
    InvalidConfig,
    WrongSession,
    InvalidIdentity,
    Capacity,
    UnknownControl,
    DuplicateControl,
    ItemCapacity,
    DuplicateItem,
    NoFocusableItem,
    DialogOrder,
    RevisionMismatch,
    InvalidMeasurement,
    ArithmeticOverflow,
    InvalidGeometry,
}

#[derive(Clone, Debug)]
struct RovingGroup {
    axis: RovingAxis,
    wrap: bool,
    items: Vec<RovingItem>,
    focused: Option<NodeId>,
}

#[derive(Clone, Debug)]
struct VirtualCollection {
    descriptor: VirtualCollectionDescriptor,
    measurements: BTreeMap<u64, u32>,
}

pub struct ControlRuntime {
    session: UiSessionId,
    config: ControlRuntimeConfig,
    roving: BTreeMap<(UiRootId, NodeId), RovingGroup>,
    dialogs: Vec<DialogDescriptor>,
    virtual_collections: BTreeMap<(UiRootId, NodeId), VirtualCollection>,
    popups: BTreeMap<(UiRootId, NodeId), PopupDescriptor>,
    focus_scopes: Vec<FocusScopeSnapshot>,
}

impl ControlRuntime {
    pub fn new(
        session: UiSessionId,
        config: ControlRuntimeConfig,
    ) -> Result<Self, ControlRuntimeError> {
        if !session.is_valid()
            || config.max_roving_groups == 0
            || config.max_items_per_group == 0
            || config.max_dialogs == 0
            || config.max_virtual_collections == 0
            || config.max_measurements_per_collection == 0
            || config.max_popups == 0
            || config.max_focus_scopes == 0
        {
            return Err(ControlRuntimeError::InvalidConfig);
        }
        Ok(Self {
            session,
            config,
            roving: BTreeMap::new(),
            dialogs: Vec::new(),
            virtual_collections: BTreeMap::new(),
            popups: BTreeMap::new(),
            focus_scopes: Vec::new(),
        })
    }

    pub const fn session(&self) -> UiSessionId {
        self.session
    }

    pub fn upsert_roving_group(
        &mut self,
        root: UiRootId,
        group: NodeId,
        axis: RovingAxis,
        wrap: bool,
        items: Vec<RovingItem>,
        preferred_focus: Option<NodeId>,
    ) -> Result<NodeId, ControlRuntimeError> {
        self.validate_root_node(root, group)?;
        if items.is_empty() || items.len() > self.config.max_items_per_group {
            return Err(ControlRuntimeError::ItemCapacity);
        }
        if !self.roving.contains_key(&(root, group))
            && self.roving.len() == self.config.max_roving_groups
        {
            return Err(ControlRuntimeError::Capacity);
        }
        let mut identities = BTreeSet::new();
        for item in &items {
            self.validate_item(*item)?;
            if !identities.insert(item.node) {
                return Err(ControlRuntimeError::DuplicateItem);
            }
        }
        let focused = preferred_focus
            .filter(|node| {
                items
                    .iter()
                    .any(|item| item.node == *node && !item.disabled)
            })
            .or_else(|| {
                self.roving
                    .get(&(root, group))
                    .and_then(|current| current.focused)
                    .filter(|node| {
                        items
                            .iter()
                            .any(|item| item.node == *node && !item.disabled)
                    })
            })
            .or_else(|| {
                items
                    .iter()
                    .find(|item| !item.disabled)
                    .map(|item| item.node)
            })
            .ok_or(ControlRuntimeError::NoFocusableItem)?;
        self.roving.insert(
            (root, group),
            RovingGroup {
                axis,
                wrap,
                items,
                focused: Some(focused),
            },
        );
        Ok(focused)
    }

    pub fn move_roving_focus(
        &mut self,
        root: UiRootId,
        group: NodeId,
        direction: FocusDirection,
    ) -> Result<RovingMove, ControlRuntimeError> {
        let state = self
            .roving
            .get_mut(&(root, group))
            .ok_or(ControlRuntimeError::UnknownControl)?;
        let current = state
            .focused
            .and_then(|node| state.items.iter().position(|item| item.node == node))
            .ok_or(ControlRuntimeError::NoFocusableItem)?;
        if !direction_allowed(state.axis, direction) {
            return Ok(RovingMove {
                focused: state.items[current].node,
                wrapped: false,
            });
        }
        let (next, wrapped) = find_roving_target(state, current, direction)?;
        state.focused = Some(state.items[next].node);
        Ok(RovingMove {
            focused: state.items[next].node,
            wrapped,
        })
    }

    pub fn remove_roving_group(
        &mut self,
        root: UiRootId,
        group: NodeId,
    ) -> Result<(), ControlRuntimeError> {
        self.roving
            .remove(&(root, group))
            .map(|_| ())
            .ok_or(ControlRuntimeError::UnknownControl)
    }

    pub fn open_dialog(
        &mut self,
        descriptor: DialogDescriptor,
    ) -> Result<NodeId, ControlRuntimeError> {
        self.validate_root_node(descriptor.root, descriptor.dialog)?;
        if descriptor.initial_focus.is_valid() {
            self.validate_node(descriptor.initial_focus)?;
        }
        if descriptor.return_focus.is_valid() {
            self.validate_node(descriptor.return_focus)?;
        }
        if self
            .dialogs
            .iter()
            .any(|dialog| dialog.root == descriptor.root && dialog.dialog == descriptor.dialog)
        {
            return Err(ControlRuntimeError::DuplicateControl);
        }
        if self.dialogs.len() == self.config.max_dialogs {
            return Err(ControlRuntimeError::Capacity);
        }
        self.dialogs.push(descriptor);
        Ok(if descriptor.initial_focus.is_valid() {
            descriptor.initial_focus
        } else {
            descriptor.dialog
        })
    }

    pub fn close_dialog(
        &mut self,
        root: UiRootId,
        dialog: NodeId,
    ) -> Result<DialogClose, ControlRuntimeError> {
        let top = self
            .dialogs
            .last()
            .copied()
            .ok_or(ControlRuntimeError::UnknownControl)?;
        if top.root != root || top.dialog != dialog {
            return Err(ControlRuntimeError::DialogOrder);
        }
        self.dialogs.pop();
        Ok(DialogClose {
            dialog,
            restore_focus: top.return_focus.is_valid().then_some(top.return_focus),
            root_remains_inert: self
                .dialogs
                .iter()
                .any(|current| current.root == root && current.modal),
        })
    }

    pub fn escape_dialog(&self, root: UiRootId) -> Option<NodeId> {
        self.dialogs
            .iter()
            .rev()
            .find(|dialog| dialog.root == root && dialog.dismiss_on_escape)
            .map(|dialog| dialog.dialog)
    }

    pub fn root_is_inert(&self, root: UiRootId, node: NodeId) -> bool {
        self.dialogs
            .iter()
            .rev()
            .find(|dialog| dialog.root == root && dialog.modal)
            .map(|dialog| dialog.dialog != node)
            .unwrap_or(false)
    }

    pub fn upsert_virtual_collection(
        &mut self,
        descriptor: VirtualCollectionDescriptor,
    ) -> Result<(), ControlRuntimeError> {
        self.validate_root_node(descriptor.root, descriptor.node)?;
        if descriptor.item_count == 0
            || descriptor.estimated_item_extent == 0
            || descriptor.revision == 0
        {
            return Err(ControlRuntimeError::InvalidIdentity);
        }
        let key = (descriptor.root, descriptor.node);
        if !self.virtual_collections.contains_key(&key)
            && self.virtual_collections.len() == self.config.max_virtual_collections
        {
            return Err(ControlRuntimeError::Capacity);
        }
        match self.virtual_collections.get_mut(&key) {
            Some(collection) => {
                if descriptor.revision <= collection.descriptor.revision {
                    return Err(ControlRuntimeError::RevisionMismatch);
                }
                collection.descriptor = descriptor;
                collection
                    .measurements
                    .retain(|index, _| *index < descriptor.item_count);
            }
            None => {
                self.virtual_collections.insert(
                    key,
                    VirtualCollection {
                        descriptor,
                        measurements: BTreeMap::new(),
                    },
                );
            }
        }
        Ok(())
    }

    pub fn record_item_measurement(
        &mut self,
        root: UiRootId,
        collection: NodeId,
        revision: u64,
        index: u64,
        extent: u32,
    ) -> Result<(), ControlRuntimeError> {
        let state = self
            .virtual_collections
            .get_mut(&(root, collection))
            .ok_or(ControlRuntimeError::UnknownControl)?;
        if revision != state.descriptor.revision {
            return Err(ControlRuntimeError::RevisionMismatch);
        }
        if index >= state.descriptor.item_count || extent == 0 {
            return Err(ControlRuntimeError::InvalidMeasurement);
        }
        if !state.measurements.contains_key(&index)
            && state.measurements.len() == self.config.max_measurements_per_collection
        {
            return Err(ControlRuntimeError::Capacity);
        }
        state.measurements.insert(index, extent);
        Ok(())
    }

    pub fn virtual_window(
        &self,
        root: UiRootId,
        collection: NodeId,
        scroll_offset: u64,
        viewport_extent: u32,
    ) -> Result<VirtualWindow, ControlRuntimeError> {
        if viewport_extent == 0 {
            return Err(ControlRuntimeError::InvalidGeometry);
        }
        let state = self
            .virtual_collections
            .get(&(root, collection))
            .ok_or(ControlRuntimeError::UnknownControl)?;
        let mut offset = 0_u64;
        let mut first = 0_u64;
        while first < state.descriptor.item_count {
            let extent = item_extent(state, first);
            if offset
                .checked_add(u64::from(extent))
                .ok_or(ControlRuntimeError::ArithmeticOverflow)?
                > scroll_offset
            {
                break;
            }
            offset += u64::from(extent);
            first += 1;
        }
        first = first.saturating_sub(u64::from(state.descriptor.overscan));
        let before_extent = collection_extent(state, 0, first)?;
        let visible_end = scroll_offset
            .checked_add(u64::from(viewport_extent))
            .ok_or(ControlRuntimeError::ArithmeticOverflow)?;
        let mut end = first;
        let mut cursor = before_extent;
        while end < state.descriptor.item_count && cursor < visible_end {
            cursor = cursor
                .checked_add(u64::from(item_extent(state, end)))
                .ok_or(ControlRuntimeError::ArithmeticOverflow)?;
            end += 1;
        }
        end = end
            .checked_add(u64::from(state.descriptor.overscan))
            .unwrap_or(u64::MAX)
            .min(state.descriptor.item_count);
        let total = collection_extent(state, 0, state.descriptor.item_count)?;
        let after_start = collection_extent(state, 0, end)?;
        Ok(VirtualWindow {
            revision: state.descriptor.revision,
            first,
            count: u32::try_from(end - first)
                .map_err(|_| ControlRuntimeError::ArithmeticOverflow)?,
            before_extent,
            after_extent: total - after_start,
        })
    }

    pub fn upsert_popup(&mut self, descriptor: PopupDescriptor) -> Result<(), ControlRuntimeError> {
        self.validate_root_node(descriptor.root, descriptor.popup)?;
        self.validate_node(descriptor.anchor)?;
        let key = (descriptor.root, descriptor.popup);
        if !self.popups.contains_key(&key) && self.popups.len() == self.config.max_popups {
            return Err(ControlRuntimeError::Capacity);
        }
        self.popups.insert(key, descriptor);
        Ok(())
    }

    pub fn place_popup(
        &self,
        root: UiRootId,
        popup: NodeId,
        anchor: Rect,
        popup_size: (u32, u32),
        viewport: Rect,
    ) -> Result<PopupGeometry, ControlRuntimeError> {
        if anchor.width == 0
            || anchor.height == 0
            || popup_size.0 == 0
            || popup_size.1 == 0
            || viewport.width == 0
            || viewport.height == 0
        {
            return Err(ControlRuntimeError::InvalidGeometry);
        }
        let descriptor = self
            .popups
            .get(&(root, popup))
            .ok_or(ControlRuntimeError::UnknownControl)?;
        let preferred = popup_rect(*descriptor, anchor, popup_size)?;
        let (placement, mut rect) = if descriptor.flip && !contains_rect(viewport, preferred) {
            let mut flipped = *descriptor;
            flipped.preferred = opposite(descriptor.preferred);
            let candidate = popup_rect(flipped, anchor, popup_size)?;
            if visible_area(viewport, candidate) > visible_area(viewport, preferred) {
                (flipped.preferred, candidate)
            } else {
                (descriptor.preferred, preferred)
            }
        } else {
            (descriptor.preferred, preferred)
        };
        if descriptor.shift {
            rect = shift_into(rect, viewport);
        }
        Ok(PopupGeometry {
            rect,
            placement,
            clipped: !contains_rect(viewport, rect),
        })
    }

    pub fn open_focus_scope(
        &mut self,
        descriptor: FocusScopeDescriptor,
        focusables: Vec<NodeId>,
    ) -> Result<Option<NodeId>, ControlRuntimeError> {
        self.validate_root_node(descriptor.root, descriptor.scope)?;
        if self.focus_scopes.iter().any(|scope| {
            scope.descriptor.root == descriptor.root && scope.descriptor.scope == descriptor.scope
        }) {
            return Err(ControlRuntimeError::DuplicateControl);
        }
        if self.focus_scopes.len() == self.config.max_focus_scopes {
            return Err(ControlRuntimeError::Capacity);
        }
        let focusables = self.validate_focusables(focusables)?;
        if descriptor
            .initial_focus
            .is_some_and(|node| !focusables.contains(&node))
            || descriptor.return_focus.is_some_and(|node| !node.is_valid())
        {
            return Err(ControlRuntimeError::InvalidIdentity);
        }
        let focused = descriptor
            .initial_focus
            .or_else(|| focusables.first().copied());
        self.focus_scopes.push(FocusScopeSnapshot {
            descriptor,
            focusables,
            focused,
        });
        Ok(focused)
    }

    pub fn update_focus_scope(
        &mut self,
        root: UiRootId,
        scope: NodeId,
        focusables: Vec<NodeId>,
    ) -> Result<Option<NodeId>, ControlRuntimeError> {
        let focusables = self.validate_focusables(focusables)?;
        let state = self
            .focus_scopes
            .iter_mut()
            .find(|state| state.descriptor.root == root && state.descriptor.scope == scope)
            .ok_or(ControlRuntimeError::UnknownControl)?;
        state.focused = state
            .focused
            .filter(|node| focusables.contains(node))
            .or_else(|| focusables.first().copied());
        state.focusables = focusables;
        Ok(state.focused)
    }

    pub fn move_focus_scope(
        &mut self,
        root: UiRootId,
        scope: NodeId,
        direction: FocusDirection,
    ) -> Result<Option<NodeId>, ControlRuntimeError> {
        let state = self
            .focus_scopes
            .iter_mut()
            .find(|state| state.descriptor.root == root && state.descriptor.scope == scope)
            .ok_or(ControlRuntimeError::UnknownControl)?;
        if state.focusables.is_empty() {
            state.focused = None;
            return Ok(None);
        }
        let current = state
            .focused
            .and_then(|node| {
                state
                    .focusables
                    .iter()
                    .position(|candidate| *candidate == node)
            })
            .unwrap_or(0);
        let next = match direction {
            FocusDirection::First => 0,
            FocusDirection::Last => state.focusables.len() - 1,
            FocusDirection::Previous | FocusDirection::Up | FocusDirection::Left => {
                if current == 0 {
                    if state.descriptor.trap {
                        state.focusables.len() - 1
                    } else {
                        return Ok(None);
                    }
                } else {
                    current - 1
                }
            }
            FocusDirection::Next | FocusDirection::Down | FocusDirection::Right => {
                if current + 1 == state.focusables.len() {
                    if state.descriptor.trap {
                        0
                    } else {
                        return Ok(None);
                    }
                } else {
                    current + 1
                }
            }
        };
        state.focused = Some(state.focusables[next]);
        Ok(state.focused)
    }

    pub fn close_focus_scope(
        &mut self,
        root: UiRootId,
        scope: NodeId,
    ) -> Result<FocusScopeClose, ControlRuntimeError> {
        let index = self
            .focus_scopes
            .iter()
            .rposition(|state| state.descriptor.root == root && state.descriptor.scope == scope)
            .ok_or(ControlRuntimeError::UnknownControl)?;
        if self.focus_scopes[index + 1..]
            .iter()
            .any(|state| state.descriptor.root == root)
        {
            return Err(ControlRuntimeError::DialogOrder);
        }
        let state = self.focus_scopes.remove(index);
        Ok(FocusScopeClose {
            scope,
            restore_focus: if state.descriptor.restore {
                state.descriptor.return_focus
            } else {
                None
            },
        })
    }

    pub fn active_focus_scope(&self, root: UiRootId) -> Option<&FocusScopeSnapshot> {
        self.focus_scopes
            .iter()
            .rev()
            .find(|state| state.descriptor.root == root)
    }

    pub fn detach_root(&mut self, root: UiRootId) {
        self.roving.retain(|(candidate, _), _| *candidate != root);
        self.dialogs.retain(|dialog| dialog.root != root);
        self.virtual_collections
            .retain(|(candidate, _), _| *candidate != root);
        self.popups.retain(|(candidate, _), _| *candidate != root);
        self.focus_scopes
            .retain(|scope| scope.descriptor.root != root);
    }

    fn validate_root_node(&self, root: UiRootId, node: NodeId) -> Result<(), ControlRuntimeError> {
        if !root.is_valid() || !node.is_valid() {
            return Err(ControlRuntimeError::WrongSession);
        }
        Ok(())
    }

    fn validate_item(&self, item: RovingItem) -> Result<(), ControlRuntimeError> {
        self.validate_node(item.node)
    }

    fn validate_focusables(
        &self,
        focusables: Vec<NodeId>,
    ) -> Result<Vec<NodeId>, ControlRuntimeError> {
        if focusables.len() > self.config.max_items_per_group {
            return Err(ControlRuntimeError::ItemCapacity);
        }
        let mut unique = BTreeSet::new();
        for node in &focusables {
            self.validate_node(*node)?;
            if !unique.insert(*node) {
                return Err(ControlRuntimeError::DuplicateItem);
            }
        }
        Ok(focusables)
    }

    fn validate_node(&self, node: NodeId) -> Result<(), ControlRuntimeError> {
        if !node.is_valid() {
            return Err(ControlRuntimeError::InvalidIdentity);
        }
        Ok(())
    }
}

fn direction_allowed(axis: RovingAxis, direction: FocusDirection) -> bool {
    matches!(direction, FocusDirection::First | FocusDirection::Last)
        || matches!(axis, RovingAxis::Both)
        || matches!(
            (axis, direction),
            (
                RovingAxis::Horizontal,
                FocusDirection::Previous
                    | FocusDirection::Next
                    | FocusDirection::Left
                    | FocusDirection::Right
            ) | (
                RovingAxis::Vertical,
                FocusDirection::Previous
                    | FocusDirection::Next
                    | FocusDirection::Up
                    | FocusDirection::Down
            )
        )
}

fn find_roving_target(
    state: &RovingGroup,
    current: usize,
    direction: FocusDirection,
) -> Result<(usize, bool), ControlRuntimeError> {
    if matches!(direction, FocusDirection::First | FocusDirection::Last) {
        let iterator: Box<dyn Iterator<Item = usize>> = if direction == FocusDirection::First {
            Box::new(0..state.items.len())
        } else {
            Box::new((0..state.items.len()).rev())
        };
        return iterator
            .into_iter()
            .find(|index| !state.items[*index].disabled)
            .map(|index| (index, false))
            .ok_or(ControlRuntimeError::NoFocusableItem);
    }
    let forward = matches!(
        direction,
        FocusDirection::Next | FocusDirection::Right | FocusDirection::Down
    );
    let current_item = state.items[current];
    let mut best: Option<(usize, u64)> = None;
    for (index, item) in state.items.iter().enumerate() {
        if item.disabled || index == current {
            continue;
        }
        let eligible = match direction {
            FocusDirection::Up => item.row < current_item.row,
            FocusDirection::Down => item.row > current_item.row,
            FocusDirection::Left => item.column < current_item.column,
            FocusDirection::Right => item.column > current_item.column,
            FocusDirection::Previous => index < current,
            FocusDirection::Next => index > current,
            FocusDirection::First | FocusDirection::Last => false,
        };
        if !eligible {
            continue;
        }
        let distance = u64::from(current_item.row.abs_diff(item.row))
            + u64::from(current_item.column.abs_diff(item.column))
            + u64::try_from(current.abs_diff(index)).unwrap_or(u64::MAX);
        if best.map(|(_, value)| distance < value).unwrap_or(true) {
            best = Some((index, distance));
        }
    }
    if let Some((index, _)) = best {
        return Ok((index, false));
    }
    if !state.wrap {
        return Ok((current, false));
    }
    let candidate = if forward {
        state.items.iter().position(|item| !item.disabled)
    } else {
        state.items.iter().rposition(|item| !item.disabled)
    }
    .ok_or(ControlRuntimeError::NoFocusableItem)?;
    Ok((candidate, candidate != current))
}

fn item_extent(collection: &VirtualCollection, index: u64) -> u32 {
    collection
        .measurements
        .get(&index)
        .copied()
        .unwrap_or(collection.descriptor.estimated_item_extent)
}

fn collection_extent(
    collection: &VirtualCollection,
    start: u64,
    end: u64,
) -> Result<u64, ControlRuntimeError> {
    let mut total = 0_u64;
    for index in start..end {
        total = total
            .checked_add(u64::from(item_extent(collection, index)))
            .ok_or(ControlRuntimeError::ArithmeticOverflow)?;
    }
    Ok(total)
}

fn popup_rect(
    descriptor: PopupDescriptor,
    anchor: Rect,
    popup_size: (u32, u32),
) -> Result<Rect, ControlRuntimeError> {
    let width = i64::from(popup_size.0);
    let height = i64::from(popup_size.1);
    let anchor_x = i64::from(anchor.x);
    let anchor_y = i64::from(anchor.y);
    let anchor_width = i64::from(anchor.width);
    let anchor_height = i64::from(anchor.height);
    let offset = i64::from(descriptor.offset);
    let (x, y) = match descriptor.preferred {
        PopupPlacement::Top => (
            anchor_x + (anchor_width - width) / 2,
            anchor_y - height - offset,
        ),
        PopupPlacement::Bottom => (
            anchor_x + (anchor_width - width) / 2,
            anchor_y + anchor_height + offset,
        ),
        PopupPlacement::Left => (
            anchor_x - width - offset,
            anchor_y + (anchor_height - height) / 2,
        ),
        PopupPlacement::Right => (
            anchor_x + anchor_width + offset,
            anchor_y + (anchor_height - height) / 2,
        ),
    };
    Ok(Rect {
        x: i32::try_from(x).map_err(|_| ControlRuntimeError::ArithmeticOverflow)?,
        y: i32::try_from(y).map_err(|_| ControlRuntimeError::ArithmeticOverflow)?,
        width: popup_size.0,
        height: popup_size.1,
    })
}

fn opposite(placement: PopupPlacement) -> PopupPlacement {
    match placement {
        PopupPlacement::Top => PopupPlacement::Bottom,
        PopupPlacement::Bottom => PopupPlacement::Top,
        PopupPlacement::Left => PopupPlacement::Right,
        PopupPlacement::Right => PopupPlacement::Left,
    }
}

fn contains_rect(outer: Rect, inner: Rect) -> bool {
    i64::from(inner.x) >= i64::from(outer.x)
        && i64::from(inner.y) >= i64::from(outer.y)
        && i64::from(inner.x) + i64::from(inner.width)
            <= i64::from(outer.x) + i64::from(outer.width)
        && i64::from(inner.y) + i64::from(inner.height)
            <= i64::from(outer.y) + i64::from(outer.height)
}

fn visible_area(outer: Rect, inner: Rect) -> u64 {
    let left = i64::from(outer.x).max(i64::from(inner.x));
    let top = i64::from(outer.y).max(i64::from(inner.y));
    let right = (i64::from(outer.x) + i64::from(outer.width))
        .min(i64::from(inner.x) + i64::from(inner.width));
    let bottom = (i64::from(outer.y) + i64::from(outer.height))
        .min(i64::from(inner.y) + i64::from(inner.height));
    u64::try_from((right - left).max(0)).unwrap_or(0)
        * u64::try_from((bottom - top).max(0)).unwrap_or(0)
}

fn shift_into(mut rect: Rect, viewport: Rect) -> Rect {
    let max_x = i64::from(viewport.x) + i64::from(viewport.width) - i64::from(rect.width);
    let max_y = i64::from(viewport.y) + i64::from(viewport.height) - i64::from(rect.height);
    rect.x = i32::try_from(
        i64::from(rect.x).clamp(i64::from(viewport.x), max_x.max(i64::from(viewport.x))),
    )
    .unwrap_or(viewport.x);
    rect.y = i32::try_from(
        i64::from(rect.y).clamp(i64::from(viewport.y), max_y.max(i64::from(viewport.y))),
    )
    .unwrap_or(viewport.y);
    rect
}

#[cfg(test)]
mod tests {
    use super::*;
    use vogui_protocol::v2::Handle;

    fn handle(index: u32) -> Handle {
        Handle {
            index,
            generation: 1,
        }
    }

    #[test]
    fn roving_focus_skips_disabled_items_and_wraps_deterministically() {
        let root = handle(2);
        let group = handle(3);
        let mut controls = ControlRuntime::new(handle(1), ControlRuntimeConfig::default()).unwrap();
        let first = controls
            .upsert_roving_group(
                root,
                group,
                RovingAxis::Horizontal,
                true,
                vec![
                    RovingItem {
                        node: handle(10),
                        disabled: false,
                        row: 0,
                        column: 0,
                    },
                    RovingItem {
                        node: handle(11),
                        disabled: true,
                        row: 0,
                        column: 1,
                    },
                    RovingItem {
                        node: handle(12),
                        disabled: false,
                        row: 0,
                        column: 2,
                    },
                ],
                None,
            )
            .unwrap();
        assert_eq!(first, handle(10));
        assert_eq!(
            controls
                .move_roving_focus(root, group, FocusDirection::Right)
                .unwrap(),
            RovingMove {
                focused: handle(12),
                wrapped: false,
            }
        );
        assert_eq!(
            controls
                .move_roving_focus(root, group, FocusDirection::Right)
                .unwrap(),
            RovingMove {
                focused: handle(10),
                wrapped: true,
            }
        );
    }

    #[test]
    fn modal_dialog_stack_controls_inertness_and_focus_restore_order() {
        let root = handle(2);
        let mut controls = ControlRuntime::new(handle(1), ControlRuntimeConfig::default()).unwrap();
        let first = DialogDescriptor {
            root,
            dialog: handle(10),
            initial_focus: handle(11),
            return_focus: handle(12),
            dismiss_on_escape: true,
            modal: true,
        };
        let second = DialogDescriptor {
            root,
            dialog: handle(20),
            initial_focus: handle(21),
            return_focus: handle(22),
            dismiss_on_escape: true,
            modal: true,
        };
        controls.open_dialog(first).unwrap();
        controls.open_dialog(second).unwrap();
        assert!(controls.root_is_inert(root, first.dialog));
        assert_eq!(
            controls.close_dialog(root, first.dialog),
            Err(ControlRuntimeError::DialogOrder)
        );
        let close = controls.close_dialog(root, second.dialog).unwrap();
        assert_eq!(close.restore_focus, Some(handle(22)));
        assert!(close.root_remains_inert);
        assert!(!controls.root_is_inert(root, first.dialog));
    }
}
