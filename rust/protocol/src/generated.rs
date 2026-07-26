// @generated from framework schema. DO NOT EDIT.
pub const SCHEMA_ID: &str = "vogui.ui";
pub const SCHEMA_FORMAT: u32 = 1;
pub const PROTOCOL_MAJOR: u16 = 1;
pub const PROTOCOL_MINOR: u16 = 0;
pub const SCHEMA_IDENTITY: [u8; 16] = [
    170, 77, 1, 40, 73, 81, 15, 167, 46, 145, 6, 79, 113, 43, 133, 209,
];
pub const MAJOR_COMPAT_FINGERPRINT: [u8; 32] = [
    181, 26, 19, 162, 79, 63, 168, 175, 167, 128, 105, 18, 33, 50, 111, 184, 246, 83, 238, 6, 168,
    79, 143, 249, 54, 63, 17, 246, 108, 114, 45, 199,
];
pub const EXACT_SCHEMA_FINGERPRINT: [u8; 32] = [
    85, 106, 224, 27, 73, 227, 12, 130, 248, 134, 115, 46, 117, 88, 51, 35, 40, 204, 22, 3, 131,
    71, 161, 21, 123, 41, 214, 165, 207, 8, 240, 19,
];
pub const MAX_EVENT_PAYLOAD_BYTES: usize = 65536;
pub const MAX_NODES_PER_SNAPSHOT: usize = 65536;
pub const MAX_PACKET_BYTES: usize = 1048576;
pub const MAX_PATCH_OPS: usize = 65536;
pub const MAX_STRING_BYTES: usize = 262144;
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u16)]
pub enum MessageKind {
    UiSnapshot = 1,
    UiPatch = 2,
    UiEvent = 3,
    UiCommand = 4,
    UiCommandResult = 5,
    UiApplyAck = 6,
    UiSurfaceControl = 7,
    UiResourcePublication = 8,
    UiResourceRetire = 9,
}

impl MessageKind {
    pub const fn from_wire(value: u16) -> Option<Self> {
        match value {
            1 => Some(Self::UiSnapshot),
            2 => Some(Self::UiPatch),
            3 => Some(Self::UiEvent),
            4 => Some(Self::UiCommand),
            5 => Some(Self::UiCommandResult),
            6 => Some(Self::UiApplyAck),
            7 => Some(Self::UiSurfaceControl),
            8 => Some(Self::UiResourcePublication),
            9 => Some(Self::UiResourceRetire),
            _ => None,
        }
    }
}

pub const HEADER_BYTES: usize = 56;
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
#[repr(C)]
pub struct GenerationalHandle {
    pub index: u32,
    pub generation: u32,
}

impl GenerationalHandle {
    pub const INVALID: Self = Self {
        index: u32::MAX,
        generation: 0,
    };

    pub const fn is_valid(self) -> bool {
        self.index != u32::MAX && self.generation != 0
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct FrameworkPacketHeader {
    pub kind: MessageKind,
    pub ui_session: GenerationalHandle,
    pub ui_root: GenerationalHandle,
    pub ui_root_epoch: u32,
    pub app_code_epoch: u64,
    pub revision: u64,
    pub sequence: u64,
    pub payload_len: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum FrameworkPacketCodecError {
    Truncated,
    UnknownKind,
    InvalidHandle,
    PayloadTooLarge,
    LengthMismatch,
    LengthOverflow,
}

pub fn decode_framework_packet(
    bytes: &[u8],
) -> Result<(FrameworkPacketHeader, &[u8]), FrameworkPacketCodecError> {
    if bytes.len() < HEADER_BYTES {
        return Err(FrameworkPacketCodecError::Truncated);
    }
    let payload_length = read_framework_u32(bytes, 52);
    let payload_bytes = payload_length as usize;
    if payload_bytes > MAX_PACKET_BYTES.saturating_sub(HEADER_BYTES) {
        return Err(FrameworkPacketCodecError::PayloadTooLarge);
    }
    if bytes.len() != HEADER_BYTES + payload_bytes {
        return Err(FrameworkPacketCodecError::LengthMismatch);
    }
    let header = FrameworkPacketHeader {
        kind: MessageKind::from_wire(read_framework_u16(bytes, 0))
            .ok_or(FrameworkPacketCodecError::UnknownKind)?,
        ui_session: {
            let value = GenerationalHandle {
                index: read_framework_u32(bytes, 4),
                generation: read_framework_u32(bytes, 8),
            };
            if !value.is_valid() {
                return Err(FrameworkPacketCodecError::InvalidHandle);
            }
            value
        },
        ui_root: {
            let value = GenerationalHandle {
                index: read_framework_u32(bytes, 12),
                generation: read_framework_u32(bytes, 16),
            };
            if !value.is_valid() {
                return Err(FrameworkPacketCodecError::InvalidHandle);
            }
            value
        },
        ui_root_epoch: read_framework_u32(bytes, 20),
        app_code_epoch: read_framework_u64(bytes, 24),
        revision: read_framework_u64(bytes, 32),
        sequence: read_framework_u64(bytes, 40),
        payload_len: read_framework_u32(bytes, 52),
    };
    Ok((header, &bytes[HEADER_BYTES..]))
}

pub fn encode_framework_packet(
    header: FrameworkPacketHeader,
    payload: &[u8],
) -> Result<Vec<u8>, FrameworkPacketCodecError> {
    if payload.len() > MAX_PACKET_BYTES.saturating_sub(HEADER_BYTES) {
        return Err(FrameworkPacketCodecError::PayloadTooLarge);
    }
    let payload_length =
        u32::try_from(payload.len()).map_err(|_| FrameworkPacketCodecError::LengthOverflow)?;
    if header.payload_len != payload_length {
        return Err(FrameworkPacketCodecError::LengthMismatch);
    }
    if !header.ui_session.is_valid() {
        return Err(FrameworkPacketCodecError::InvalidHandle);
    }
    if !header.ui_root.is_valid() {
        return Err(FrameworkPacketCodecError::InvalidHandle);
    }
    let mut bytes = vec![0u8; HEADER_BYTES + payload.len()];
    bytes[0..2].copy_from_slice(&(header.kind as u16).to_le_bytes());
    bytes[4..8].copy_from_slice(&header.ui_session.index.to_le_bytes());
    bytes[8..12].copy_from_slice(&header.ui_session.generation.to_le_bytes());
    bytes[12..16].copy_from_slice(&header.ui_root.index.to_le_bytes());
    bytes[16..20].copy_from_slice(&header.ui_root.generation.to_le_bytes());
    bytes[20..24].copy_from_slice(&header.ui_root_epoch.to_le_bytes());
    bytes[24..32].copy_from_slice(&header.app_code_epoch.to_le_bytes());
    bytes[32..40].copy_from_slice(&header.revision.to_le_bytes());
    bytes[40..48].copy_from_slice(&header.sequence.to_le_bytes());
    bytes[52..56].copy_from_slice(&header.payload_len.to_le_bytes());
    bytes[HEADER_BYTES..].copy_from_slice(payload);
    Ok(bytes)
}

fn read_framework_u16(bytes: &[u8], offset: usize) -> u16 {
    u16::from_le_bytes([bytes[offset], bytes[offset + 1]])
}

fn read_framework_u32(bytes: &[u8], offset: usize) -> u32 {
    u32::from_le_bytes(bytes[offset..offset + 4].try_into().unwrap())
}

fn read_framework_u64(bytes: &[u8], offset: usize) -> u64 {
    u64::from_le_bytes(bytes[offset..offset + 8].try_into().unwrap())
}
