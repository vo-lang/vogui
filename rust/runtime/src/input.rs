use std::collections::BTreeMap;

use vogui_protocol::v2::{Handle, NodeId, UiRootId, UiSessionId};

#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct TextControlId {
    pub session: UiSessionId,
    pub root: UiRootId,
    pub node: NodeId,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TextSelection {
    pub anchor: u32,
    pub focus: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TextReplacementRange {
    pub start: u32,
    pub end: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CompositionState {
    Inactive,
    Active {
        text: String,
        replacement: TextReplacementRange,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TextEditEvent {
    pub control: TextControlId,
    pub edit_sequence: u64,
    pub text: String,
    pub selection: TextSelection,
    pub composition: CompositionState,
    pub replacement: TextReplacementRange,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TextModelApply {
    Applied {
        text: String,
        acknowledged_sequence: u64,
    },
    DeferredForComposition {
        acknowledged_sequence: u64,
    },
    IgnoredStale {
        acknowledged_sequence: u64,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TextControlSnapshot {
    pub control: TextControlId,
    pub text: String,
    pub selection: TextSelection,
    pub composition: CompositionState,
    pub last_edit_sequence: u64,
    pub last_model_ack: u64,
}

#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct PointerId {
    pub device: Handle,
    pub contact: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PointerRoute {
    Captured { root: UiRootId, node: NodeId },
    Hit { root: UiRootId, node: NodeId },
    Unhandled,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum SyntheticInput {
    PointerCancel {
        pointer: PointerId,
        root: UiRootId,
        node: NodeId,
    },
    KeyRelease {
        physical_key: u32,
        root: UiRootId,
        node: NodeId,
    },
    CompositionCancel {
        control: TextControlId,
        edit_sequence: u64,
    },
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RendererInputConfig {
    pub max_text_controls: usize,
    pub max_text_bytes: usize,
    pub max_pointer_captures: usize,
    pub max_pressed_keys: usize,
    pub max_focus_scopes: usize,
}

impl Default for RendererInputConfig {
    fn default() -> Self {
        Self {
            max_text_controls: 1024,
            max_text_bytes: 1024 * 1024,
            max_pointer_captures: 64,
            max_pressed_keys: 512,
            max_focus_scopes: 64,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RendererInputError {
    InvalidConfig,
    WrongSession,
    InvalidIdentity,
    TextControlCapacity,
    TextCapacity,
    UnknownTextControl,
    EditSequence,
    InvalidTextOffset,
    InvalidComposition,
    PointerCaptureCapacity,
    UnknownPointerCapture,
    KeyCapacity,
    FocusScopeCapacity,
    FocusScopeMismatch,
}

#[derive(Debug)]
struct TextControlState {
    text: String,
    selection: TextSelection,
    composition: CompositionState,
    last_edit_sequence: u64,
    last_model_ack: u64,
    deferred_model: Option<(String, u64)>,
}

pub struct RendererInputState {
    session: UiSessionId,
    config: RendererInputConfig,
    text_controls: BTreeMap<TextControlId, TextControlState>,
    pointer_captures: BTreeMap<PointerId, (UiRootId, NodeId)>,
    pressed_keys: BTreeMap<u32, (UiRootId, NodeId)>,
    focus_scopes: Vec<(UiRootId, NodeId)>,
    focused: Option<(UiRootId, NodeId)>,
}

impl RendererInputState {
    pub fn new(
        session: UiSessionId,
        config: RendererInputConfig,
    ) -> Result<Self, RendererInputError> {
        if !session.is_valid()
            || config.max_text_controls == 0
            || config.max_text_bytes == 0
            || config.max_pointer_captures == 0
            || config.max_pressed_keys == 0
            || config.max_focus_scopes == 0
        {
            return Err(RendererInputError::InvalidConfig);
        }
        Ok(Self {
            session,
            config,
            text_controls: BTreeMap::new(),
            pointer_captures: BTreeMap::new(),
            pressed_keys: BTreeMap::new(),
            focus_scopes: Vec::new(),
            focused: None,
        })
    }

    pub fn attach_text_control(
        &mut self,
        control: TextControlId,
        text: String,
        selection: TextSelection,
    ) -> Result<(), RendererInputError> {
        self.validate_control(control)?;
        validate_text_state(&text, selection, self.config.max_text_bytes)?;
        if !self.text_controls.contains_key(&control)
            && self.text_controls.len() == self.config.max_text_controls
        {
            return Err(RendererInputError::TextControlCapacity);
        }
        self.text_controls.insert(
            control,
            TextControlState {
                text,
                selection,
                composition: CompositionState::Inactive,
                last_edit_sequence: 0,
                last_model_ack: 0,
                deferred_model: None,
            },
        );
        Ok(())
    }

    pub fn detach_text_control(
        &mut self,
        control: TextControlId,
    ) -> Result<Option<SyntheticInput>, RendererInputError> {
        let state = self
            .text_controls
            .remove(&control)
            .ok_or(RendererInputError::UnknownTextControl)?;
        Ok(
            matches!(state.composition, CompositionState::Active { .. }).then_some(
                SyntheticInput::CompositionCancel {
                    control,
                    edit_sequence: state.last_edit_sequence,
                },
            ),
        )
    }

    pub fn local_edit(
        &mut self,
        control: TextControlId,
        text: String,
        selection: TextSelection,
        replacement: TextReplacementRange,
    ) -> Result<TextEditEvent, RendererInputError> {
        validate_text_state(&text, selection, self.config.max_text_bytes)?;
        validate_range(&text, replacement)?;
        let state = self
            .text_controls
            .get(&control)
            .ok_or(RendererInputError::UnknownTextControl)?;
        let edit_sequence = state
            .last_edit_sequence
            .checked_add(1)
            .ok_or(RendererInputError::EditSequence)?;
        let state = self.text_controls.get_mut(&control).unwrap();
        state.text = text.clone();
        state.selection = selection;
        state.last_edit_sequence = edit_sequence;
        Ok(TextEditEvent {
            control,
            edit_sequence,
            text,
            selection,
            composition: state.composition.clone(),
            replacement,
        })
    }

    pub fn composition_start(
        &mut self,
        control: TextControlId,
        replacement: TextReplacementRange,
    ) -> Result<TextEditEvent, RendererInputError> {
        let state = self
            .text_controls
            .get(&control)
            .ok_or(RendererInputError::UnknownTextControl)?;
        if !matches!(state.composition, CompositionState::Inactive) {
            return Err(RendererInputError::InvalidComposition);
        }
        validate_range(&state.text, replacement)?;
        self.set_composition(control, String::new(), replacement)
    }

    pub fn composition_update(
        &mut self,
        control: TextControlId,
        text: String,
        replacement: TextReplacementRange,
    ) -> Result<TextEditEvent, RendererInputError> {
        if text.len() > self.config.max_text_bytes {
            return Err(RendererInputError::TextCapacity);
        }
        let state = self
            .text_controls
            .get(&control)
            .ok_or(RendererInputError::UnknownTextControl)?;
        if !matches!(state.composition, CompositionState::Active { .. }) {
            return Err(RendererInputError::InvalidComposition);
        }
        validate_range(&state.text, replacement)?;
        self.set_composition(control, text, replacement)
    }

    pub fn composition_commit(
        &mut self,
        control: TextControlId,
        text: String,
        selection: TextSelection,
        replacement: TextReplacementRange,
    ) -> Result<TextEditEvent, RendererInputError> {
        let state = self
            .text_controls
            .get(&control)
            .ok_or(RendererInputError::UnknownTextControl)?;
        if !matches!(state.composition, CompositionState::Active { .. }) {
            return Err(RendererInputError::InvalidComposition);
        }
        validate_text_state(&text, selection, self.config.max_text_bytes)?;
        validate_range(&text, replacement)?;
        let edit_sequence = state
            .last_edit_sequence
            .checked_add(1)
            .ok_or(RendererInputError::EditSequence)?;
        let state = self.text_controls.get_mut(&control).unwrap();
        state.text = text.clone();
        state.selection = selection;
        state.composition = CompositionState::Inactive;
        state.last_edit_sequence = edit_sequence;
        state.deferred_model = None;
        Ok(TextEditEvent {
            control,
            edit_sequence,
            text,
            selection,
            composition: CompositionState::Inactive,
            replacement,
        })
    }

    pub fn composition_cancel(
        &mut self,
        control: TextControlId,
    ) -> Result<SyntheticInput, RendererInputError> {
        let state = self
            .text_controls
            .get_mut(&control)
            .ok_or(RendererInputError::UnknownTextControl)?;
        if !matches!(state.composition, CompositionState::Active { .. }) {
            return Err(RendererInputError::InvalidComposition);
        }
        state.composition = CompositionState::Inactive;
        if let Some((text, acknowledged_sequence)) = state.deferred_model.take() {
            state.text = text;
            state.last_model_ack = acknowledged_sequence;
            let end = state.text.len() as u32;
            state.selection = TextSelection {
                anchor: end,
                focus: end,
            };
        }
        Ok(SyntheticInput::CompositionCancel {
            control,
            edit_sequence: state.last_edit_sequence,
        })
    }

    pub fn apply_model_text(
        &mut self,
        control: TextControlId,
        text: String,
        selection: TextSelection,
        acknowledged_sequence: u64,
    ) -> Result<TextModelApply, RendererInputError> {
        validate_text_state(&text, selection, self.config.max_text_bytes)?;
        let state = self
            .text_controls
            .get_mut(&control)
            .ok_or(RendererInputError::UnknownTextControl)?;
        if acknowledged_sequence < state.last_model_ack
            || acknowledged_sequence < state.last_edit_sequence
        {
            return Ok(TextModelApply::IgnoredStale {
                acknowledged_sequence,
            });
        }
        if matches!(state.composition, CompositionState::Active { .. }) {
            state.deferred_model = Some((text, acknowledged_sequence));
            return Ok(TextModelApply::DeferredForComposition {
                acknowledged_sequence,
            });
        }
        state.text = text.clone();
        state.selection = selection;
        state.last_model_ack = acknowledged_sequence;
        Ok(TextModelApply::Applied {
            text,
            acknowledged_sequence,
        })
    }

    pub fn text_control_snapshot(
        &self,
        control: TextControlId,
    ) -> Result<TextControlSnapshot, RendererInputError> {
        let state = self
            .text_controls
            .get(&control)
            .ok_or(RendererInputError::UnknownTextControl)?;
        Ok(TextControlSnapshot {
            control,
            text: state.text.clone(),
            selection: state.selection,
            composition: state.composition.clone(),
            last_edit_sequence: state.last_edit_sequence,
            last_model_ack: state.last_model_ack,
        })
    }

    pub fn capture_pointer(
        &mut self,
        pointer: PointerId,
        root: UiRootId,
        node: NodeId,
    ) -> Result<(), RendererInputError> {
        validate_pointer(pointer, root, node)?;
        if !self.pointer_captures.contains_key(&pointer)
            && self.pointer_captures.len() == self.config.max_pointer_captures
        {
            return Err(RendererInputError::PointerCaptureCapacity);
        }
        self.pointer_captures.insert(pointer, (root, node));
        Ok(())
    }

    pub fn release_pointer(&mut self, pointer: PointerId) -> Result<(), RendererInputError> {
        self.pointer_captures
            .remove(&pointer)
            .ok_or(RendererInputError::UnknownPointerCapture)?;
        Ok(())
    }

    pub fn route_pointer(
        &self,
        pointer: PointerId,
        hit_path_front_to_back: &[(UiRootId, NodeId)],
    ) -> PointerRoute {
        if let Some((root, node)) = self.pointer_captures.get(&pointer) {
            return PointerRoute::Captured {
                root: *root,
                node: *node,
            };
        }
        hit_path_front_to_back
            .first()
            .map_or(PointerRoute::Unhandled, |(root, node)| PointerRoute::Hit {
                root: *root,
                node: *node,
            })
    }

    pub fn push_focus_scope(
        &mut self,
        root: UiRootId,
        node: NodeId,
    ) -> Result<(), RendererInputError> {
        if !root.is_valid() || !node.is_valid() {
            return Err(RendererInputError::InvalidIdentity);
        }
        if self.focus_scopes.len() == self.config.max_focus_scopes {
            return Err(RendererInputError::FocusScopeCapacity);
        }
        self.focus_scopes.push((root, node));
        self.focused = Some((root, node));
        Ok(())
    }

    pub fn pop_focus_scope(
        &mut self,
        root: UiRootId,
        node: NodeId,
    ) -> Result<(), RendererInputError> {
        if self.focus_scopes.last().copied() != Some((root, node)) {
            return Err(RendererInputError::FocusScopeMismatch);
        }
        self.focus_scopes.pop();
        self.focused = self.focus_scopes.last().copied();
        Ok(())
    }

    pub fn focus(&mut self, root: UiRootId, node: NodeId) -> Result<(), RendererInputError> {
        if !root.is_valid() || !node.is_valid() {
            return Err(RendererInputError::InvalidIdentity);
        }
        if let Some((scope_root, _)) = self.focus_scopes.last() {
            if *scope_root != root {
                return Err(RendererInputError::FocusScopeMismatch);
            }
        }
        self.focused = Some((root, node));
        Ok(())
    }

    pub const fn focused(&self) -> Option<(UiRootId, NodeId)> {
        self.focused
    }

    pub fn press_key(&mut self, physical_key: u32) -> Result<(), RendererInputError> {
        let focused = self.focused.ok_or(RendererInputError::InvalidIdentity)?;
        if !self.pressed_keys.contains_key(&physical_key)
            && self.pressed_keys.len() == self.config.max_pressed_keys
        {
            return Err(RendererInputError::KeyCapacity);
        }
        self.pressed_keys.insert(physical_key, focused);
        Ok(())
    }

    pub fn release_key(&mut self, physical_key: u32) {
        self.pressed_keys.remove(&physical_key);
    }

    pub fn suspend(&mut self) -> Vec<SyntheticInput> {
        let mut synthetic = Vec::new();
        for (pointer, (root, node)) in std::mem::take(&mut self.pointer_captures) {
            synthetic.push(SyntheticInput::PointerCancel {
                pointer,
                root,
                node,
            });
        }
        for (physical_key, (root, node)) in std::mem::take(&mut self.pressed_keys) {
            synthetic.push(SyntheticInput::KeyRelease {
                physical_key,
                root,
                node,
            });
        }
        for (control, state) in &mut self.text_controls {
            if matches!(state.composition, CompositionState::Active { .. }) {
                state.composition = CompositionState::Inactive;
                state.deferred_model = None;
                synthetic.push(SyntheticInput::CompositionCancel {
                    control: *control,
                    edit_sequence: state.last_edit_sequence,
                });
            }
        }
        synthetic
    }

    pub fn close_root(&mut self, root: UiRootId) -> Vec<SyntheticInput> {
        let pointers = self
            .pointer_captures
            .iter()
            .filter_map(|(pointer, (capture_root, node))| {
                (*capture_root == root).then_some((*pointer, *node))
            })
            .collect::<Vec<_>>();
        let mut synthetic = Vec::new();
        for (pointer, node) in pointers {
            self.pointer_captures.remove(&pointer);
            synthetic.push(SyntheticInput::PointerCancel {
                pointer,
                root,
                node,
            });
        }
        let keys = self
            .pressed_keys
            .iter()
            .filter_map(|(key, (key_root, node))| (*key_root == root).then_some((*key, *node)))
            .collect::<Vec<_>>();
        for (physical_key, node) in keys {
            self.pressed_keys.remove(&physical_key);
            synthetic.push(SyntheticInput::KeyRelease {
                physical_key,
                root,
                node,
            });
        }
        let controls = self
            .text_controls
            .keys()
            .filter(|control| control.root == root)
            .copied()
            .collect::<Vec<_>>();
        for control in controls {
            if let Ok(Some(cancel)) = self.detach_text_control(control) {
                synthetic.push(cancel);
            }
        }
        self.focus_scopes
            .retain(|(scope_root, _)| *scope_root != root);
        if self
            .focused
            .is_some_and(|(focus_root, _)| focus_root == root)
        {
            self.focused = self.focus_scopes.last().copied();
        }
        synthetic
    }

    fn set_composition(
        &mut self,
        control: TextControlId,
        text: String,
        replacement: TextReplacementRange,
    ) -> Result<TextEditEvent, RendererInputError> {
        let state = self.text_controls.get_mut(&control).unwrap();
        let edit_sequence = state
            .last_edit_sequence
            .checked_add(1)
            .ok_or(RendererInputError::EditSequence)?;
        state.last_edit_sequence = edit_sequence;
        state.composition = CompositionState::Active { text, replacement };
        Ok(TextEditEvent {
            control,
            edit_sequence,
            text: state.text.clone(),
            selection: state.selection,
            composition: state.composition.clone(),
            replacement,
        })
    }

    fn validate_control(&self, control: TextControlId) -> Result<(), RendererInputError> {
        if control.session != self.session || !control.root.is_valid() || !control.node.is_valid() {
            return Err(RendererInputError::WrongSession);
        }
        Ok(())
    }
}

fn validate_text_state(
    text: &str,
    selection: TextSelection,
    max_text_bytes: usize,
) -> Result<(), RendererInputError> {
    if text.len() > max_text_bytes
        || !valid_offset(text, selection.anchor)
        || !valid_offset(text, selection.focus)
    {
        return Err(RendererInputError::InvalidTextOffset);
    }
    Ok(())
}

fn validate_range(text: &str, range: TextReplacementRange) -> Result<(), RendererInputError> {
    if range.start > range.end || !valid_offset(text, range.start) || !valid_offset(text, range.end)
    {
        return Err(RendererInputError::InvalidTextOffset);
    }
    Ok(())
}

fn valid_offset(text: &str, offset: u32) -> bool {
    usize::try_from(offset)
        .ok()
        .is_some_and(|offset| offset <= text.len() && text.is_char_boundary(offset))
}

fn validate_pointer(
    pointer: PointerId,
    root: UiRootId,
    node: NodeId,
) -> Result<(), RendererInputError> {
    if !pointer.device.is_valid()
        || pointer.contact == u32::MAX
        || !root.is_valid()
        || !node.is_valid()
    {
        return Err(RendererInputError::InvalidIdentity);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn handle(index: u32) -> Handle {
        Handle {
            index,
            generation: 1,
        }
    }

    fn control() -> TextControlId {
        TextControlId {
            session: handle(1),
            root: handle(2),
            node: handle(3),
        }
    }

    #[test]
    fn model_updates_are_deferred_during_ime_composition_and_applied_on_cancel() {
        let mut input = RendererInputState::new(handle(1), RendererInputConfig::default()).unwrap();
        let control = control();
        input
            .attach_text_control(
                control,
                "ab".to_owned(),
                TextSelection {
                    anchor: 2,
                    focus: 2,
                },
            )
            .unwrap();
        input
            .composition_start(control, TextReplacementRange { start: 2, end: 2 })
            .unwrap();
        assert_eq!(
            input
                .apply_model_text(
                    control,
                    "server".to_owned(),
                    TextSelection {
                        anchor: 6,
                        focus: 6,
                    },
                    1,
                )
                .unwrap(),
            TextModelApply::DeferredForComposition {
                acknowledged_sequence: 1
            }
        );
        assert_eq!(input.text_control_snapshot(control).unwrap().text, "ab");

        input.composition_cancel(control).unwrap();
        let snapshot = input.text_control_snapshot(control).unwrap();
        assert_eq!(snapshot.text, "server");
        assert_eq!(snapshot.last_model_ack, 1);
        assert_eq!(snapshot.composition, CompositionState::Inactive);
    }

    #[test]
    fn suspend_releases_pointer_key_and_composition_ownership_once() {
        let mut input = RendererInputState::new(handle(1), RendererInputConfig::default()).unwrap();
        let root = handle(2);
        let node = handle(3);
        let pointer = PointerId {
            device: handle(4),
            contact: 5,
        };
        input.capture_pointer(pointer, root, node).unwrap();
        input.push_focus_scope(root, node).unwrap();
        input.press_key(30).unwrap();
        let control = control();
        input
            .attach_text_control(
                control,
                String::new(),
                TextSelection {
                    anchor: 0,
                    focus: 0,
                },
            )
            .unwrap();
        input
            .composition_start(control, TextReplacementRange { start: 0, end: 0 })
            .unwrap();

        let synthetic = input.suspend();
        assert!(synthetic.iter().any(|item| matches!(
            item,
            SyntheticInput::PointerCancel { pointer: value, .. } if *value == pointer
        )));
        assert!(synthetic.iter().any(|item| matches!(
            item,
            SyntheticInput::KeyRelease {
                physical_key: 30,
                ..
            }
        )));
        assert!(synthetic.iter().any(|item| matches!(
            item,
            SyntheticInput::CompositionCancel { control: value, .. } if *value == control
        )));
        assert!(input.suspend().is_empty());
        assert_eq!(input.route_pointer(pointer, &[]), PointerRoute::Unhandled);
    }
}
