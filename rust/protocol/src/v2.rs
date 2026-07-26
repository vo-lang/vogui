use crate::generated;

pub use generated::{
    FrameworkPacketCodecError as DecodeError, FrameworkPacketHeader as PacketHeader,
    GenerationalHandle as Handle, MessageKind, HEADER_BYTES, MAX_PACKET_BYTES,
};

pub type UiSessionId = Handle;
pub type UiRootId = Handle;
pub type NodeId = Handle;
pub type EventToken = Handle;
pub type NodeRef = Handle;

pub fn decode_packet(bytes: &[u8]) -> Result<(PacketHeader, &[u8]), DecodeError> {
    generated::decode_framework_packet(bytes)
}

pub fn encode_packet(mut header: PacketHeader, payload: &[u8]) -> Result<Vec<u8>, DecodeError> {
    header.payload_len = u32::try_from(payload.len()).map_err(|_| DecodeError::LengthOverflow)?;
    generated::encode_framework_packet(header, payload)
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiCommandOutcomeWire {
    Executed,
    Measured(UiMeasurementWire),
    StaleBinding,
    DeadlineExpired,
    FutureRevision,
    Capacity,
    Unsupported,
    RendererUnavailable,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiMeasurementWire {
    pub target: NodeRef,
    pub binding_generation: u32,
    pub metrics_revision: u64,
    pub layout_revision: u64,
    pub coordinate_space: u8,
    pub x_milli: i64,
    pub y_milli: i64,
    pub width_milli: i64,
    pub height_milli: i64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DecodedUiReturn<'a> {
    ApplyAck,
    Event {
        event_token: EventToken,
        payload: &'a [u8],
    },
    CommandResult {
        command_id: u64,
        outcome: UiCommandOutcomeWire,
    },
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiReturnDecodeError {
    Packet(DecodeError),
    UnexpectedKind,
    InvalidPayload,
    TrailingBytes,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiCommandEncodeError {
    Packet(DecodeError),
    InvalidIdentity,
    InvalidKind,
    PayloadTooLarge,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiCommandWire<'a> {
    pub request_id: u64,
    pub target: NodeRef,
    pub expected_binding_generation: u32,
    pub deadline_millis: u64,
    pub kind: &'a str,
    pub payload: &'a [u8],
}

pub fn encode_ui_command(
    mut header: PacketHeader,
    command: UiCommandWire<'_>,
) -> Result<Vec<u8>, UiCommandEncodeError> {
    if header.kind != MessageKind::UiCommand
        || header.sequence == 0
        || command.request_id == 0
        || !command.target.is_valid()
        || command.expected_binding_generation == 0
    {
        return Err(UiCommandEncodeError::InvalidIdentity);
    }
    if command.kind.is_empty() || command.kind.len() > u16::MAX as usize {
        return Err(UiCommandEncodeError::InvalidKind);
    }
    let payload_len =
        u32::try_from(command.payload.len()).map_err(|_| UiCommandEncodeError::PayloadTooLarge)?;
    let total_len = 8_usize
        .checked_add(8)
        .and_then(|value| value.checked_add(4))
        .and_then(|value| value.checked_add(8))
        .and_then(|value| value.checked_add(2))
        .and_then(|value| value.checked_add(command.kind.len()))
        .and_then(|value| value.checked_add(4))
        .and_then(|value| value.checked_add(command.payload.len()))
        .ok_or(UiCommandEncodeError::PayloadTooLarge)?;
    if total_len > MAX_PACKET_BYTES.saturating_sub(HEADER_BYTES) {
        return Err(UiCommandEncodeError::PayloadTooLarge);
    }
    let mut payload = Vec::with_capacity(total_len);
    payload.extend_from_slice(&command.request_id.to_le_bytes());
    payload.extend_from_slice(&command.target.index.to_le_bytes());
    payload.extend_from_slice(&command.target.generation.to_le_bytes());
    payload.extend_from_slice(&command.expected_binding_generation.to_le_bytes());
    payload.extend_from_slice(&command.deadline_millis.to_le_bytes());
    payload.extend_from_slice(&(command.kind.len() as u16).to_le_bytes());
    payload.extend_from_slice(command.kind.as_bytes());
    payload.extend_from_slice(&payload_len.to_le_bytes());
    payload.extend_from_slice(command.payload);
    header.payload_len = 0;
    encode_packet(header, &payload).map_err(UiCommandEncodeError::Packet)
}

pub fn decode_ui_return(
    bytes: &[u8],
) -> Result<(PacketHeader, DecodedUiReturn<'_>), UiReturnDecodeError> {
    let (header, payload) = decode_packet(bytes).map_err(UiReturnDecodeError::Packet)?;
    let value = match header.kind {
        MessageKind::UiApplyAck if payload.is_empty() => DecodedUiReturn::ApplyAck,
        MessageKind::UiEvent => decode_event(payload)?,
        MessageKind::UiCommandResult => decode_command_result(payload)?,
        MessageKind::UiApplyAck => return Err(UiReturnDecodeError::TrailingBytes),
        _ => return Err(UiReturnDecodeError::UnexpectedKind),
    };
    Ok((header, value))
}

fn decode_event(payload: &[u8]) -> Result<DecodedUiReturn<'_>, UiReturnDecodeError> {
    let mut reader = Reader::new(payload);
    let event_token = reader.handle()?;
    let _node = reader.handle()?;
    let event_type = reader.u8()?;
    let payload_kind = reader.u8()?;
    let compatible = match payload_kind {
        1 => event_type == 1,
        2 => {
            reader.u64()?;
            reader.string()?;
            reader.u32()?;
            reader.u32()?;
            reader.boolean()?;
            event_type == 2
        }
        3 => {
            reader.string()?;
            reader.string()?;
            for _ in 0..5 {
                reader.boolean()?;
            }
            matches!(event_type, 3 | 4)
        }
        4 => {
            reader.boolean()?;
            reader.optional_handle()?;
            matches!(event_type, 5 | 6)
        }
        5 => {
            reader.u32()?;
            reader.string()?;
            reader.i32()?;
            reader.i32()?;
            reader.i32()?;
            reader.u32()?;
            matches!(event_type, 7 | 8)
        }
        6 => {
            let count = reader.u32()? as usize;
            if count > 128 {
                return Err(UiReturnDecodeError::InvalidPayload);
            }
            for _ in 0..count {
                reader.string()?;
            }
            reader.i32()?;
            reader.i32()?;
            matches!(event_type, 9..=12)
        }
        _ => return Err(UiReturnDecodeError::InvalidPayload),
    };
    if !compatible {
        return Err(UiReturnDecodeError::InvalidPayload);
    }
    reader.finish()?;
    Ok(DecodedUiReturn::Event {
        event_token,
        payload: &payload[16..],
    })
}

fn decode_command_result(payload: &[u8]) -> Result<DecodedUiReturn<'_>, UiReturnDecodeError> {
    let mut reader = Reader::new(payload);
    let command_id = reader.u64()?;
    let outcome = match reader.u8()? {
        1 => UiCommandOutcomeWire::Executed,
        2 => UiCommandOutcomeWire::Measured(UiMeasurementWire {
            target: reader.handle()?,
            binding_generation: reader.nonzero_u32()?,
            metrics_revision: reader.u64()?,
            layout_revision: reader.u64()?,
            coordinate_space: reader.nonzero_u8()?,
            x_milli: reader.i64()?,
            y_milli: reader.i64()?,
            width_milli: reader.i64()?,
            height_milli: reader.i64()?,
        }),
        3 => UiCommandOutcomeWire::StaleBinding,
        4 => UiCommandOutcomeWire::DeadlineExpired,
        5 => UiCommandOutcomeWire::FutureRevision,
        6 => UiCommandOutcomeWire::Capacity,
        7 => UiCommandOutcomeWire::Unsupported,
        8 => UiCommandOutcomeWire::RendererUnavailable,
        _ => return Err(UiReturnDecodeError::InvalidPayload),
    };
    reader.finish()?;
    Ok(DecodedUiReturn::CommandResult {
        command_id,
        outcome,
    })
}

struct Reader<'a> {
    bytes: &'a [u8],
    offset: usize,
    string_bytes: usize,
}

impl<'a> Reader<'a> {
    fn new(bytes: &'a [u8]) -> Self {
        Self {
            bytes,
            offset: 0,
            string_bytes: 0,
        }
    }

    fn take(&mut self, len: usize) -> Result<&'a [u8], UiReturnDecodeError> {
        let end = self
            .offset
            .checked_add(len)
            .ok_or(UiReturnDecodeError::InvalidPayload)?;
        let value = self
            .bytes
            .get(self.offset..end)
            .ok_or(UiReturnDecodeError::InvalidPayload)?;
        self.offset = end;
        Ok(value)
    }

    fn u8(&mut self) -> Result<u8, UiReturnDecodeError> {
        Ok(self.take(1)?[0])
    }

    fn nonzero_u8(&mut self) -> Result<u8, UiReturnDecodeError> {
        let value = self.u8()?;
        if value == 0 {
            return Err(UiReturnDecodeError::InvalidPayload);
        }
        Ok(value)
    }

    fn boolean(&mut self) -> Result<bool, UiReturnDecodeError> {
        match self.u8()? {
            0 => Ok(false),
            1 => Ok(true),
            _ => Err(UiReturnDecodeError::InvalidPayload),
        }
    }

    fn u32(&mut self) -> Result<u32, UiReturnDecodeError> {
        Ok(u32::from_le_bytes(
            self.take(4)?
                .try_into()
                .map_err(|_| UiReturnDecodeError::InvalidPayload)?,
        ))
    }

    fn nonzero_u32(&mut self) -> Result<u32, UiReturnDecodeError> {
        let value = self.u32()?;
        if value == 0 {
            return Err(UiReturnDecodeError::InvalidPayload);
        }
        Ok(value)
    }

    fn i32(&mut self) -> Result<i32, UiReturnDecodeError> {
        Ok(i32::from_le_bytes(
            self.take(4)?
                .try_into()
                .map_err(|_| UiReturnDecodeError::InvalidPayload)?,
        ))
    }

    fn i64(&mut self) -> Result<i64, UiReturnDecodeError> {
        Ok(i64::from_le_bytes(
            self.take(8)?
                .try_into()
                .map_err(|_| UiReturnDecodeError::InvalidPayload)?,
        ))
    }

    fn u64(&mut self) -> Result<u64, UiReturnDecodeError> {
        Ok(u64::from_le_bytes(
            self.take(8)?
                .try_into()
                .map_err(|_| UiReturnDecodeError::InvalidPayload)?,
        ))
    }

    fn handle(&mut self) -> Result<Handle, UiReturnDecodeError> {
        let handle = Handle {
            index: self.u32()?,
            generation: self.u32()?,
        };
        if !handle.is_valid() {
            return Err(UiReturnDecodeError::InvalidPayload);
        }
        Ok(handle)
    }

    fn optional_handle(&mut self) -> Result<Option<Handle>, UiReturnDecodeError> {
        match self.u8()? {
            0 => Ok(None),
            1 => self.handle().map(Some),
            _ => Err(UiReturnDecodeError::InvalidPayload),
        }
    }

    fn string(&mut self) -> Result<&'a str, UiReturnDecodeError> {
        let len = self.u32()? as usize;
        self.string_bytes = self
            .string_bytes
            .checked_add(len)
            .filter(|bytes| *bytes <= generated::MAX_STRING_BYTES)
            .ok_or(UiReturnDecodeError::InvalidPayload)?;
        core::str::from_utf8(self.take(len)?).map_err(|_| UiReturnDecodeError::InvalidPayload)
    }

    fn finish(self) -> Result<(), UiReturnDecodeError> {
        if self.offset == self.bytes.len() {
            Ok(())
        } else {
            Err(UiReturnDecodeError::TrailingBytes)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn packet_identity_and_bounds_are_checked_before_payload_exposure() {
        let mut bytes = vec![0_u8; HEADER_BYTES + 3];
        bytes[0..2].copy_from_slice(&(generated::MessageKind::UiPatch as u16).to_le_bytes());
        bytes[4..8].copy_from_slice(&1_u32.to_le_bytes());
        bytes[8..12].copy_from_slice(&1_u32.to_le_bytes());
        bytes[12..16].copy_from_slice(&2_u32.to_le_bytes());
        bytes[16..20].copy_from_slice(&3_u32.to_le_bytes());
        bytes[20..24].copy_from_slice(&4_u32.to_le_bytes());
        bytes[24..32].copy_from_slice(&5_u64.to_le_bytes());
        bytes[32..40].copy_from_slice(&6_u64.to_le_bytes());
        bytes[40..48].copy_from_slice(&7_u64.to_le_bytes());
        bytes[52..56].copy_from_slice(&3_u32.to_le_bytes());
        bytes[56..].copy_from_slice(b"new");

        let (header, payload) = decode_packet(&bytes).unwrap();
        assert_eq!(header.ui_root_epoch, 4);
        assert_eq!(header.app_code_epoch, 5);
        assert_eq!(header.revision, 6);
        assert_eq!(header.sequence, 7);
        assert_eq!(payload, b"new");

        bytes[52..56].copy_from_slice(&4_u32.to_le_bytes());
        assert_eq!(decode_packet(&bytes), Err(DecodeError::LengthMismatch));
    }
}
