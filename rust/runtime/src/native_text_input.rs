use crate::input::{
    RendererInputError, RendererInputState, SyntheticInput, TextControlId, TextEditEvent,
    TextReplacementRange, TextSelection,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TextCaretRect {
    pub x_milli: i32,
    pub y_milli: i32,
    pub width_milli: u32,
    pub height_milli: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NativeTextInputDescriptor {
    pub control: TextControlId,
    pub text: String,
    pub selection: TextSelection,
    pub replacement: TextReplacementRange,
    pub caret: TextCaretRect,
    pub secure: bool,
    pub multiline: bool,
    pub input_purpose: u32,
    pub locale: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum NativeTextInputEvent {
    Replace {
        text: String,
        selection: TextSelection,
        replacement: TextReplacementRange,
    },
    CompositionStart {
        replacement: TextReplacementRange,
    },
    CompositionUpdate {
        text: String,
        replacement: TextReplacementRange,
    },
    CompositionCommit {
        text: String,
        selection: TextSelection,
        replacement: TextReplacementRange,
    },
    CompositionCancel,
    SelectionChanged(TextSelection),
}

pub trait NativeTextInputAdapter {
    type Error;

    fn activate(&mut self, descriptor: &NativeTextInputDescriptor) -> Result<(), Self::Error>;
    fn update_surrounding_text(
        &mut self,
        text: &str,
        selection: TextSelection,
        acknowledged_edit_sequence: u64,
    ) -> Result<(), Self::Error>;
    fn update_caret(&mut self, caret: TextCaretRect) -> Result<(), Self::Error>;
    fn cancel_composition(&mut self) -> Result<(), Self::Error>;
    fn deactivate(&mut self) -> Result<(), Self::Error>;
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum NativeTextInputError<E> {
    Renderer(RendererInputError),
    Platform(E),
    InvalidDescriptor,
    NoActiveControl,
    WrongControl,
}

impl<E> From<RendererInputError> for NativeTextInputError<E> {
    fn from(error: RendererInputError) -> Self {
        Self::Renderer(error)
    }
}

pub struct NativeTextInputBridge<P> {
    platform: P,
    active: Option<NativeTextInputDescriptor>,
}

impl<P: NativeTextInputAdapter> NativeTextInputBridge<P> {
    pub const fn new(platform: P) -> Self {
        Self {
            platform,
            active: None,
        }
    }

    pub fn platform(&self) -> &P {
        &self.platform
    }

    pub fn platform_mut(&mut self) -> &mut P {
        &mut self.platform
    }

    pub fn activate(
        &mut self,
        input: &RendererInputState,
        mut descriptor: NativeTextInputDescriptor,
    ) -> Result<(), NativeTextInputError<P::Error>> {
        if descriptor.caret.width_milli == 0
            || descriptor.caret.height_milli == 0
            || descriptor.input_purpose > 16
        {
            return Err(NativeTextInputError::InvalidDescriptor);
        }
        let snapshot = input.text_control_snapshot(descriptor.control)?;
        descriptor.text = snapshot.text;
        descriptor.selection = snapshot.selection;
        if let Some(active) = &self.active {
            if active.control != descriptor.control {
                self.platform
                    .deactivate()
                    .map_err(NativeTextInputError::Platform)?;
            }
        }
        self.platform
            .activate(&descriptor)
            .map_err(NativeTextInputError::Platform)?;
        self.active = Some(descriptor);
        Ok(())
    }

    pub fn apply_model(
        &mut self,
        input: &RendererInputState,
        control: TextControlId,
    ) -> Result<(), NativeTextInputError<P::Error>> {
        self.require_active(control)?;
        let snapshot = input.text_control_snapshot(control)?;
        self.platform
            .update_surrounding_text(&snapshot.text, snapshot.selection, snapshot.last_model_ack)
            .map_err(NativeTextInputError::Platform)?;
        if let Some(active) = &mut self.active {
            active.text = snapshot.text;
            active.selection = snapshot.selection;
        }
        Ok(())
    }

    pub fn update_caret(
        &mut self,
        control: TextControlId,
        caret: TextCaretRect,
    ) -> Result<(), NativeTextInputError<P::Error>> {
        self.require_active(control)?;
        if caret.width_milli == 0 || caret.height_milli == 0 {
            return Err(NativeTextInputError::InvalidDescriptor);
        }
        self.platform
            .update_caret(caret)
            .map_err(NativeTextInputError::Platform)?;
        self.active.as_mut().unwrap().caret = caret;
        Ok(())
    }

    pub fn dispatch(
        &mut self,
        input: &mut RendererInputState,
        control: TextControlId,
        event: NativeTextInputEvent,
    ) -> Result<Option<TextEditEvent>, NativeTextInputError<P::Error>> {
        self.require_active(control)?;
        let result = match event {
            NativeTextInputEvent::Replace {
                text,
                selection,
                replacement,
            } => Some(input.local_edit(control, text, selection, replacement)?),
            NativeTextInputEvent::CompositionStart { replacement } => {
                Some(input.composition_start(control, replacement)?)
            }
            NativeTextInputEvent::CompositionUpdate { text, replacement } => {
                Some(input.composition_update(control, text, replacement)?)
            }
            NativeTextInputEvent::CompositionCommit {
                text,
                selection,
                replacement,
            } => Some(input.composition_commit(control, text, selection, replacement)?),
            NativeTextInputEvent::CompositionCancel => {
                input.composition_cancel(control)?;
                None
            }
            NativeTextInputEvent::SelectionChanged(selection) => {
                let snapshot = input.text_control_snapshot(control)?;
                Some(input.local_edit(
                    control,
                    snapshot.text,
                    selection,
                    TextReplacementRange {
                        start: selection.anchor.min(selection.focus),
                        end: selection.anchor.max(selection.focus),
                    },
                )?)
            }
        };
        if let Some(active) = &mut self.active {
            let snapshot = input.text_control_snapshot(control)?;
            active.text = snapshot.text;
            active.selection = snapshot.selection;
        }
        Ok(result)
    }

    pub fn cancel_from_model(
        &mut self,
        input: &mut RendererInputState,
        control: TextControlId,
    ) -> Result<SyntheticInput, NativeTextInputError<P::Error>> {
        self.require_active(control)?;
        self.platform
            .cancel_composition()
            .map_err(NativeTextInputError::Platform)?;
        Ok(input.composition_cancel(control)?)
    }

    pub fn deactivate(
        &mut self,
        input: &mut RendererInputState,
        control: TextControlId,
    ) -> Result<Option<SyntheticInput>, NativeTextInputError<P::Error>> {
        self.require_active(control)?;
        self.platform
            .deactivate()
            .map_err(NativeTextInputError::Platform)?;
        self.active = None;
        Ok(input.detach_text_control(control)?)
    }

    pub fn suspend(
        &mut self,
        input: &mut RendererInputState,
    ) -> Result<Vec<SyntheticInput>, NativeTextInputError<P::Error>> {
        if self.active.take().is_some() {
            self.platform
                .deactivate()
                .map_err(NativeTextInputError::Platform)?;
        }
        Ok(input.suspend())
    }

    fn require_active(&self, control: TextControlId) -> Result<(), NativeTextInputError<P::Error>> {
        match &self.active {
            Some(active) if active.control == control => Ok(()),
            Some(_) => Err(NativeTextInputError::WrongControl),
            None => Err(NativeTextInputError::NoActiveControl),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::input::{RendererInputConfig, TextControlSnapshot};
    use vogui_protocol::v2::Handle;

    #[derive(Default)]
    struct Platform {
        activations: Vec<NativeTextInputDescriptor>,
        deactivations: usize,
        composition_cancels: usize,
    }

    impl NativeTextInputAdapter for Platform {
        type Error = ();

        fn activate(&mut self, descriptor: &NativeTextInputDescriptor) -> Result<(), Self::Error> {
            self.activations.push(descriptor.clone());
            Ok(())
        }

        fn update_surrounding_text(
            &mut self,
            _text: &str,
            _selection: TextSelection,
            _acknowledged_edit_sequence: u64,
        ) -> Result<(), Self::Error> {
            Ok(())
        }

        fn update_caret(&mut self, _caret: TextCaretRect) -> Result<(), Self::Error> {
            Ok(())
        }

        fn cancel_composition(&mut self) -> Result<(), Self::Error> {
            self.composition_cancels += 1;
            Ok(())
        }

        fn deactivate(&mut self) -> Result<(), Self::Error> {
            self.deactivations += 1;
            Ok(())
        }
    }

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
    fn bridge_uses_renderer_state_as_activation_authority_and_routes_composition() {
        let mut input = RendererInputState::new(handle(1), RendererInputConfig::default()).unwrap();
        let control = control();
        input
            .attach_text_control(
                control,
                "authoritative".to_owned(),
                TextSelection {
                    anchor: 13,
                    focus: 13,
                },
            )
            .unwrap();
        let mut bridge = NativeTextInputBridge::new(Platform::default());
        bridge
            .activate(
                &input,
                NativeTextInputDescriptor {
                    control,
                    text: "stale".to_owned(),
                    selection: TextSelection {
                        anchor: 0,
                        focus: 0,
                    },
                    replacement: TextReplacementRange { start: 0, end: 0 },
                    caret: TextCaretRect {
                        x_milli: 1,
                        y_milli: 2,
                        width_milli: 3,
                        height_milli: 4,
                    },
                    secure: false,
                    multiline: false,
                    input_purpose: 0,
                    locale: "en-US".to_owned(),
                },
            )
            .unwrap();
        assert_eq!(bridge.platform().activations[0].text, "authoritative");
        bridge
            .dispatch(
                &mut input,
                control,
                NativeTextInputEvent::CompositionStart {
                    replacement: TextReplacementRange { start: 13, end: 13 },
                },
            )
            .unwrap();
        bridge.cancel_from_model(&mut input, control).unwrap();
        let TextControlSnapshot { composition, .. } = input.text_control_snapshot(control).unwrap();
        assert_eq!(composition, crate::input::CompositionState::Inactive);
        assert_eq!(bridge.platform().composition_cancels, 1);
    }

    #[test]
    fn suspend_deactivates_platform_once_and_clears_active_control() {
        let mut input = RendererInputState::new(handle(1), RendererInputConfig::default()).unwrap();
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
        let mut bridge = NativeTextInputBridge::new(Platform::default());
        let descriptor = NativeTextInputDescriptor {
            control,
            text: String::new(),
            selection: TextSelection {
                anchor: 0,
                focus: 0,
            },
            replacement: TextReplacementRange { start: 0, end: 0 },
            caret: TextCaretRect {
                x_milli: 0,
                y_milli: 0,
                width_milli: 1,
                height_milli: 1,
            },
            secure: false,
            multiline: false,
            input_purpose: 0,
            locale: "und".to_owned(),
        };
        bridge.activate(&input, descriptor).unwrap();
        bridge.suspend(&mut input).unwrap();
        bridge.suspend(&mut input).unwrap();
        assert_eq!(bridge.platform().deactivations, 1);
        assert_eq!(
            bridge.apply_model(&input, control),
            Err(NativeTextInputError::NoActiveControl)
        );
    }
}
