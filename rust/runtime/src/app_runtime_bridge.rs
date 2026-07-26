use std::collections::BTreeMap;

use vo_app_runtime::{
    decode_envelope, AppMessageKind, AppSession, CallerEndpointHandle, EndpointChannelBinding,
    LaneLimits, PlatformCompletionOutcome, PlatformRequest, PlatformRequestKind,
    PlatformRequestScope, SessionHandle, SurfaceHandle, ViewHandle, WindowHandle,
};
use vogui_protocol::v2::{
    decode_ui_return, encode_packet, encode_ui_command, DecodedUiReturn, MessageKind, PacketHeader,
    UiCommandEncodeError, UiCommandOutcomeWire, UiCommandWire, UiRootId, UiSessionId,
};

use crate::async_runtime::{
    EffectCompletion, EffectExecutor, EffectOutcome, EffectRequest, EffectScope,
};
use crate::command::{UiCommand, UiCommandOutcome, UiCoordinateSpace, UiMeasurement};
use crate::{PresentationBatch, UiReturn};

const FRAMEWORK_LANE_OWNER: &str = "vogui";

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct PlatformEffectBinding {
    pub request_kind: PlatformRequestKind,
    pub max_payload_bytes: usize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AppRuntimeBridgeError {
    InvalidConfig,
    DuplicateKind,
    UnknownKind,
    WrongExecutor,
    WrongScope,
    PayloadCapacity,
    PendingCapacity,
    DuplicateEffect,
    UnknownCompletion,
    SequenceExhausted,
    AppSession(String),
}

pub struct AppRuntimeEffectBridge {
    session: SessionHandle,
    session_epoch: u64,
    caller: CallerEndpointHandle,
    sequence: u64,
    max_pending: usize,
    pending_epochs: BTreeMap<u64, u64>,
    bindings: BTreeMap<String, PlatformEffectBinding>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AppRuntimeUiLaneError {
    AppSession(String),
    AppEnvelope,
    Protocol(vogui_protocol::v2::UiReturnDecodeError),
    ProtocolEncode(vogui_protocol::v2::DecodeError),
    CommandEncode(UiCommandEncodeError),
    WrongUiSession,
    SequenceExhausted,
}

pub struct AppRuntimeUiLane {
    binding: EndpointChannelBinding,
    ui_session: UiSessionId,
    next_presentation_sequence: u64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u8)]
pub enum UiSurfaceControlAction {
    Attach = 1,
    Detach = 2,
}

impl AppRuntimeUiLane {
    pub fn open(
        session: &AppSession,
        ui_session: UiSessionId,
    ) -> Result<Self, AppRuntimeUiLaneError> {
        if !ui_session.is_valid() {
            return Err(AppRuntimeUiLaneError::WrongUiSession);
        }
        let binding = session
            .open_host_framework_channel_for(
                FRAMEWORK_LANE_OWNER,
                LaneLimits {
                    max_packet_bytes: 2 * 1024 * 1024,
                    max_messages: 1024,
                    max_bytes: 8 * 1024 * 1024,
                },
            )
            .map_err(AppRuntimeUiLaneError::AppSession)?;
        Ok(Self {
            binding,
            ui_session,
            next_presentation_sequence: 1,
        })
    }

    pub const fn binding(&self) -> EndpointChannelBinding {
        self.binding
    }

    pub fn publish(
        &mut self,
        session: &AppSession,
        batch: &PresentationBatch,
    ) -> Result<(), AppRuntimeUiLaneError> {
        let next_sequence = self
            .next_presentation_sequence
            .checked_add(1)
            .ok_or(AppRuntimeUiLaneError::SequenceExhausted)?;
        let (kind, root, ui_root_epoch, app_code_epoch, revision, payload) = match batch {
            PresentationBatch::Patch {
                root,
                ui_root_epoch,
                app_code_epoch,
                new_revision,
                bytes,
                ..
            } => (
                MessageKind::UiPatch,
                *root,
                *ui_root_epoch,
                *app_code_epoch,
                *new_revision,
                bytes.as_slice(),
            ),
            PresentationBatch::SnapshotRequired {
                root,
                ui_root_epoch,
                app_code_epoch,
                revision,
                bytes,
            } => (
                MessageKind::UiSnapshot,
                *root,
                *ui_root_epoch,
                *app_code_epoch,
                *revision,
                bytes.as_slice(),
            ),
        };
        let packet = encode_packet(
            PacketHeader {
                kind,
                ui_session: self.ui_session,
                ui_root: root,
                ui_root_epoch,
                app_code_epoch,
                revision,
                sequence: self.next_presentation_sequence,
                payload_len: 0,
            },
            payload,
        )
        .map_err(AppRuntimeUiLaneError::ProtocolEncode)?;
        session
            .publish_host_framework_payload_for(FRAMEWORK_LANE_OWNER, &packet)
            .map_err(AppRuntimeUiLaneError::AppSession)?;
        self.next_presentation_sequence = next_sequence;
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn publish_surface_control(
        &mut self,
        session: &AppSession,
        action: UiSurfaceControlAction,
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        window: WindowHandle,
        view: ViewHandle,
        surface: SurfaceHandle,
        z_order: i32,
        input_policy: u8,
    ) -> Result<(), AppRuntimeUiLaneError> {
        if ui_root_epoch == 0
            || app_code_epoch == 0
            || !window.is_valid()
            || !view.is_valid()
            || !surface.is_valid()
            || input_policy == 0
        {
            return Err(AppRuntimeUiLaneError::WrongUiSession);
        }
        let next_sequence = self
            .next_presentation_sequence
            .checked_add(1)
            .ok_or(AppRuntimeUiLaneError::SequenceExhausted)?;
        let mut payload = Vec::with_capacity(38);
        payload.push(action as u8);
        put_app_handle(
            &mut payload,
            self.binding.session.index,
            self.binding.session.generation,
        );
        put_app_handle(&mut payload, window.index, window.generation);
        put_app_handle(&mut payload, view.index, view.generation);
        put_app_handle(&mut payload, surface.index, surface.generation);
        payload.extend_from_slice(&z_order.to_le_bytes());
        payload.push(input_policy);
        debug_assert_eq!(payload.len(), 38);
        let packet = encode_packet(
            PacketHeader {
                kind: MessageKind::UiSurfaceControl,
                ui_session: self.ui_session,
                ui_root: root,
                ui_root_epoch,
                app_code_epoch,
                revision: 0,
                sequence: self.next_presentation_sequence,
                payload_len: 0,
            },
            &payload,
        )
        .map_err(AppRuntimeUiLaneError::ProtocolEncode)?;
        session
            .publish_host_framework_payload_for(FRAMEWORK_LANE_OWNER, &packet)
            .map_err(AppRuntimeUiLaneError::AppSession)?;
        self.next_presentation_sequence = next_sequence;
        Ok(())
    }

    pub fn publish_command(
        &self,
        session: &AppSession,
        command: &UiCommand,
    ) -> Result<(), AppRuntimeUiLaneError> {
        let packet = encode_ui_command(
            PacketHeader {
                kind: MessageKind::UiCommand,
                ui_session: self.ui_session,
                ui_root: command.root,
                ui_root_epoch: command.ui_root_epoch,
                app_code_epoch: command.app_code_epoch,
                revision: command.min_applied_revision,
                sequence: command.command_id,
                payload_len: 0,
            },
            UiCommandWire {
                request_id: command.command_id,
                target: command.target,
                expected_binding_generation: command.expected_binding_generation,
                deadline_millis: command.deadline_millis,
                kind: &command.kind,
                payload: &command.payload,
            },
        )
        .map_err(AppRuntimeUiLaneError::CommandEncode)?;
        session
            .publish_host_framework_payload_for(FRAMEWORK_LANE_OWNER, &packet)
            .map_err(AppRuntimeUiLaneError::AppSession)
    }

    pub fn poll_return(
        &self,
        session: &AppSession,
    ) -> Result<Option<UiReturn>, AppRuntimeUiLaneError> {
        let Some(packet) = session
            .take_inbound_host_framework_packet_for(FRAMEWORK_LANE_OWNER)
            .map_err(AppRuntimeUiLaneError::AppSession)?
        else {
            return Ok(None);
        };
        let (envelope, payload) =
            decode_envelope(&packet.bytes).map_err(|_| AppRuntimeUiLaneError::AppEnvelope)?;
        if envelope.message_kind != AppMessageKind::FrameworkPayload {
            return Err(AppRuntimeUiLaneError::AppEnvelope);
        }
        let (header, value) = decode_ui_return(payload).map_err(AppRuntimeUiLaneError::Protocol)?;
        if header.ui_session != self.ui_session {
            return Err(AppRuntimeUiLaneError::WrongUiSession);
        }
        let value = match value {
            DecodedUiReturn::ApplyAck => UiReturn::ApplyAck {
                root: header.ui_root,
                ui_root_epoch: header.ui_root_epoch,
                app_code_epoch: header.app_code_epoch,
                revision: header.revision,
                sequence: header.sequence,
            },
            DecodedUiReturn::Event {
                event_token,
                payload,
            } => UiReturn::Event {
                root: header.ui_root,
                ui_root_epoch: header.ui_root_epoch,
                app_code_epoch: header.app_code_epoch,
                applied_revision: header.revision,
                event_token,
                sequence: header.sequence,
                payload: payload.to_vec(),
            },
            DecodedUiReturn::CommandResult {
                command_id,
                outcome,
            } => UiReturn::CommandResult {
                root: header.ui_root,
                ui_root_epoch: header.ui_root_epoch,
                app_code_epoch: header.app_code_epoch,
                command_id,
                sequence: header.sequence,
                outcome: map_command_outcome(outcome),
            },
        };
        Ok(Some(value))
    }
}

fn put_app_handle(output: &mut Vec<u8>, index: u32, generation: u32) {
    output.extend_from_slice(&index.to_le_bytes());
    output.extend_from_slice(&generation.to_le_bytes());
}

fn map_command_outcome(outcome: UiCommandOutcomeWire) -> UiCommandOutcome {
    match outcome {
        UiCommandOutcomeWire::Executed => UiCommandOutcome::Executed,
        UiCommandOutcomeWire::Measured(measurement) => UiCommandOutcome::Measured(UiMeasurement {
            target: measurement.target,
            binding_generation: measurement.binding_generation,
            metrics_revision: measurement.metrics_revision,
            layout_revision: measurement.layout_revision,
            coordinate_space: match measurement.coordinate_space {
                1 => UiCoordinateSpace::CssViewport,
                _ => return UiCommandOutcome::Failed,
            },
            x_milli: measurement.x_milli,
            y_milli: measurement.y_milli,
            width_milli: measurement.width_milli,
            height_milli: measurement.height_milli,
        }),
        UiCommandOutcomeWire::StaleBinding => UiCommandOutcome::StaleBinding,
        UiCommandOutcomeWire::DeadlineExpired => UiCommandOutcome::DeadlineExpired,
        UiCommandOutcomeWire::FutureRevision => UiCommandOutcome::FutureRevision,
        UiCommandOutcomeWire::Capacity
        | UiCommandOutcomeWire::Unsupported
        | UiCommandOutcomeWire::RendererUnavailable => UiCommandOutcome::Failed,
    }
}

impl AppRuntimeEffectBridge {
    pub fn new(
        session: SessionHandle,
        session_epoch: u64,
        caller: CallerEndpointHandle,
        max_pending: usize,
        bindings: Vec<(String, PlatformEffectBinding)>,
    ) -> Result<Self, AppRuntimeBridgeError> {
        if !session.is_valid()
            || session_epoch == 0
            || !caller.is_valid()
            || max_pending == 0
            || bindings.is_empty()
        {
            return Err(AppRuntimeBridgeError::InvalidConfig);
        }
        let mut by_kind = BTreeMap::new();
        for (kind, binding) in bindings {
            if kind.is_empty()
                || binding.max_payload_bytes == 0
                || by_kind.insert(kind, binding).is_some()
            {
                return Err(AppRuntimeBridgeError::DuplicateKind);
            }
        }
        Ok(Self {
            session,
            session_epoch,
            caller,
            sequence: 0,
            max_pending,
            pending_epochs: BTreeMap::new(),
            bindings: by_kind,
        })
    }

    pub fn lower(
        &mut self,
        effect: &EffectRequest,
        scope: PlatformRequestScope,
    ) -> Result<PlatformRequest, AppRuntimeBridgeError> {
        if effect.executor != EffectExecutor::PlatformRequest {
            return Err(AppRuntimeBridgeError::WrongExecutor);
        }
        validate_scope(effect.scope, scope)?;
        let binding = self
            .bindings
            .get(&effect.kind)
            .ok_or(AppRuntimeBridgeError::UnknownKind)?;
        if effect.payload.len() > binding.max_payload_bytes {
            return Err(AppRuntimeBridgeError::PayloadCapacity);
        }
        let sequence = self
            .sequence
            .checked_add(1)
            .ok_or(AppRuntimeBridgeError::SequenceExhausted)?;
        self.sequence = sequence;
        Ok(PlatformRequest {
            session: self.session,
            session_epoch: self.session_epoch,
            caller: self.caller,
            request_id: effect.effect_id,
            sequence,
            kind: binding.request_kind,
            scope,
            deadline_millis: effect.deadline_millis,
            payload: effect.payload.clone(),
        })
    }

    pub fn dispatch(
        &mut self,
        session: &AppSession,
        effect: &EffectRequest,
        scope: PlatformRequestScope,
    ) -> Result<(), AppRuntimeBridgeError> {
        if self.pending_epochs.len() == self.max_pending {
            return Err(AppRuntimeBridgeError::PendingCapacity);
        }
        if self.pending_epochs.contains_key(&effect.effect_id) {
            return Err(AppRuntimeBridgeError::DuplicateEffect);
        }
        let request = self.lower(effect, scope)?;
        session
            .submit_host_platform_request(request)
            .map_err(AppRuntimeBridgeError::AppSession)?;
        self.pending_epochs
            .insert(effect.effect_id, effect.app_code_epoch);
        Ok(())
    }

    pub fn poll_completion(
        &mut self,
        session: &AppSession,
    ) -> Result<Option<EffectCompletion>, AppRuntimeBridgeError> {
        let Some(completion) = session
            .poll_host_platform_completion(self.caller)
            .map_err(AppRuntimeBridgeError::AppSession)?
        else {
            return Ok(None);
        };
        let app_code_epoch = self
            .pending_epochs
            .remove(&completion.request_id)
            .ok_or(AppRuntimeBridgeError::UnknownCompletion)?;
        let outcome = match completion.outcome {
            PlatformCompletionOutcome::Completed => EffectOutcome::Completed(completion.payload),
            PlatformCompletionOutcome::Denied
            | PlatformCompletionOutcome::Unsupported
            | PlatformCompletionOutcome::Failed => EffectOutcome::Failed(completion.payload),
            PlatformCompletionOutcome::Cancelled | PlatformCompletionOutcome::SessionClosed => {
                EffectOutcome::Cancelled
            }
            PlatformCompletionOutcome::TimedOut => EffectOutcome::TimedOut,
        };
        Ok(Some(EffectCompletion {
            effect_id: completion.request_id,
            app_code_epoch,
            outcome,
        }))
    }
}

fn validate_scope(
    effect: EffectScope,
    platform: PlatformRequestScope,
) -> Result<(), AppRuntimeBridgeError> {
    let matches = match effect {
        EffectScope::App => matches!(platform, PlatformRequestScope::Session),
        EffectScope::UiRoot(_) | EffectScope::Scope { .. } | EffectScope::Node { .. } => {
            !matches!(platform, PlatformRequestScope::Session)
        }
    };
    if matches {
        Ok(())
    } else {
        Err(AppRuntimeBridgeError::WrongScope)
    }
}
