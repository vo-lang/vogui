use crate::async_runtime::EffectExecutor;

const MAX_ASYNC_BYTES: usize = 16 * 1024 * 1024;
const MAX_RECORDS: usize = 4096;
const MAX_LABEL_BYTES: usize = 256;
const MAX_PAYLOAD_BYTES: usize = 1024 * 1024;
const EFFECT_MAGIC: &[u8; 4] = b"VGE1";
const EFFECT_MAGIC_V2: &[u8; 4] = b"VGE2";
const UPDATE_MAGIC: &[u8; 4] = b"VGU1";
const UPDATE_MAGIC_V2: &[u8; 4] = b"VGU2";
const TARGET_INIT_MAGIC: &[u8] = b"vogui-target-init-v1\0";
const TARGET_COMMIT_MAGIC: &[u8] = b"vogui-target-commit-v1\0";

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TargetStateIngress<'a> {
    pub complete_state: bool,
    pub update_result: &'a [u8],
    pub effects: &'a [u8],
    pub presentation: &'a [u8],
    pub subscriptions: &'a [u8],
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TargetEffectScope {
    App,
    UiRoot { logical_root: u64 },
    Node { logical_root: u64, logical_ref: u64 },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetEffectSpec {
    pub kind: String,
    pub executor: EffectExecutor,
    pub scope: TargetEffectScope,
    pub success_mapper: u32,
    pub failure_mapper: u32,
    pub deadline_millis: u64,
    pub transferable_across_reload: bool,
    pub payload: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetSubscriptionSpec {
    pub owner: TargetSubscriptionOwner,
    pub key: String,
    pub kind: String,
    pub payload: Vec<u8>,
    pub mapper_id: u32,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum TargetSubscriptionOwner {
    App,
    UiRoot { logical_root: u64 },
    Scope { logical_root: u64, logical_ref: u64 },
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct TargetSubscriptionBuildRequest {
    pub owner: TargetSubscriptionOwner,
    pub builder_id: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TargetSubscriptionUpdate {
    Unchanged,
    ReplaceAll,
    DirtyOwners(Vec<TargetSubscriptionBuildRequest>),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TargetAsyncError {
    Capacity,
    Malformed,
    InvalidUtf8,
    InvalidKind,
    InvalidScope,
    DuplicateKey,
}

pub fn decode_target_state_ingress(
    bytes: &[u8],
) -> Result<TargetStateIngress<'_>, TargetAsyncError> {
    if bytes.is_empty() || bytes.len() > MAX_ASYNC_BYTES {
        return Err(TargetAsyncError::Capacity);
    }
    if let Some(body) = bytes.strip_prefix(TARGET_INIT_MAGIC) {
        let mut reader = Reader::new(body);
        let model_len = reader.u32()? as usize;
        let effects_len = reader.u32()? as usize;
        let presentation_len = reader.u32()? as usize;
        let subscriptions_len = reader.u32()? as usize;
        reader.take(model_len)?;
        let effects = reader.take(effects_len)?;
        let presentation = reader.take(presentation_len)?;
        let subscriptions = reader.take(subscriptions_len)?;
        reader.finish()?;
        return Ok(TargetStateIngress {
            complete_state: true,
            update_result: &[],
            effects,
            presentation,
            subscriptions,
        });
    }
    if let Some(body) = bytes.strip_prefix(TARGET_COMMIT_MAGIC) {
        let mut reader = Reader::new(body);
        let model_len = reader.u32()? as usize;
        let update_result_len = reader.u32()? as usize;
        let effects_len = reader.u32()? as usize;
        let presentation_len = reader.u32()? as usize;
        let subscriptions_len = reader.u32()? as usize;
        reader.take(model_len)?;
        let update_result = reader.take(update_result_len)?;
        let effects = reader.take(effects_len)?;
        let presentation = reader.take(presentation_len)?;
        let subscriptions = reader.take(subscriptions_len)?;
        reader.finish()?;
        return Ok(TargetStateIngress {
            complete_state: true,
            update_result,
            effects,
            presentation,
            subscriptions,
        });
    }
    Ok(TargetStateIngress {
        complete_state: false,
        update_result: &[],
        effects: &[],
        presentation: bytes,
        subscriptions: &[],
    })
}

pub fn decode_target_subscription_update(
    bytes: &[u8],
) -> Result<TargetSubscriptionUpdate, TargetAsyncError> {
    if bytes.is_empty() {
        return Ok(TargetSubscriptionUpdate::ReplaceAll);
    }
    if bytes.len() > MAX_ASYNC_BYTES {
        return Err(TargetAsyncError::Capacity);
    }
    let mut reader = Reader::new(bytes);
    let magic = reader.take(4)?;
    if magic != UPDATE_MAGIC && magic != UPDATE_MAGIC_V2 {
        return Err(TargetAsyncError::Malformed);
    }
    let qualified = magic == UPDATE_MAGIC_V2;
    let mode = reader.u8()?;
    if reader.u8()? != 0 {
        return Err(TargetAsyncError::Malformed);
    }
    let count = reader.u16()? as usize;
    if count > MAX_RECORDS {
        return Err(TargetAsyncError::Capacity);
    }
    if mode == 0 && count == 0 {
        reader.finish()?;
        return Ok(TargetSubscriptionUpdate::Unchanged);
    }
    if mode == 1 && count == 0 {
        reader.finish()?;
        return Ok(TargetSubscriptionUpdate::ReplaceAll);
    }
    if mode != 2 || count == 0 {
        return Err(TargetAsyncError::Malformed);
    }
    let mut requests = Vec::with_capacity(count);
    let mut owners = std::collections::BTreeSet::new();
    for _ in 0..count {
        let owner_tag = reader.u8()?;
        if reader.u8()? != 0 || reader.u16()? != 0 {
            return Err(TargetAsyncError::Malformed);
        }
        let builder_id = reader.u32()?;
        let owner_ref = reader.u64()?;
        let logical_root = if qualified { reader.u64()? } else { 0 };
        let owner = match (owner_tag, logical_root, owner_ref) {
            (1, 0, 0) => TargetSubscriptionOwner::App,
            (2, logical_root, 0) => TargetSubscriptionOwner::UiRoot { logical_root },
            (3, logical_root, logical_ref) if logical_ref != 0 => TargetSubscriptionOwner::Scope {
                logical_root,
                logical_ref,
            },
            _ => return Err(TargetAsyncError::InvalidScope),
        };
        if qualified && !matches!(owner, TargetSubscriptionOwner::App) && logical_root == 0 {
            return Err(TargetAsyncError::InvalidScope);
        }
        if builder_id == 0 || !owners.insert(owner) {
            return Err(TargetAsyncError::DuplicateKey);
        }
        requests.push(TargetSubscriptionBuildRequest { owner, builder_id });
    }
    reader.finish()?;
    Ok(TargetSubscriptionUpdate::DirtyOwners(requests))
}

pub fn decode_target_effects(bytes: &[u8]) -> Result<Vec<TargetEffectSpec>, TargetAsyncError> {
    if bytes.is_empty() {
        return Ok(Vec::new());
    }
    if bytes.len() > MAX_ASYNC_BYTES {
        return Err(TargetAsyncError::Capacity);
    }
    let mut reader = Reader::new(bytes);
    let magic = reader.take(4)?;
    if magic != EFFECT_MAGIC && magic != EFFECT_MAGIC_V2 {
        return Err(TargetAsyncError::Malformed);
    }
    let qualified = magic == EFFECT_MAGIC_V2;
    let count = reader.u32()? as usize;
    if count > MAX_RECORDS {
        return Err(TargetAsyncError::Capacity);
    }
    let mut effects = Vec::with_capacity(count);
    let mut payload_bytes = 0usize;
    for _ in 0..count {
        let kind_len = reader.u16()? as usize;
        let scope_tag = reader.u8()?;
        let flags = reader.u8()?;
        let success_mapper = reader.u32()?;
        let failure_mapper = reader.u32()?;
        let deadline_millis = reader.u64()?;
        let logical_root = if qualified { reader.u64()? } else { 0 };
        let logical_ref = reader.u64()?;
        let payload_len = reader.u32()? as usize;
        if kind_len == 0
            || kind_len > MAX_LABEL_BYTES
            || payload_len > MAX_PAYLOAD_BYTES
            || flags & !1 != 0
            || success_mapper == 0
            || failure_mapper == 0
            || deadline_millis == 0
        {
            return Err(TargetAsyncError::Malformed);
        }
        payload_bytes = payload_bytes
            .checked_add(payload_len)
            .filter(|total| *total <= MAX_ASYNC_BYTES)
            .ok_or(TargetAsyncError::Capacity)?;
        let kind = reader.string(kind_len)?;
        let executor = effect_executor(&kind).ok_or(TargetAsyncError::InvalidKind)?;
        let scope = match (scope_tag, logical_root, logical_ref) {
            (1, 0, 0) => TargetEffectScope::App,
            (2, logical_root, 0) => TargetEffectScope::UiRoot { logical_root },
            (3, logical_root, logical_ref) if logical_ref != 0 => TargetEffectScope::Node {
                logical_root,
                logical_ref,
            },
            _ => return Err(TargetAsyncError::InvalidScope),
        };
        effects.push(TargetEffectSpec {
            kind,
            executor,
            scope,
            success_mapper,
            failure_mapper,
            deadline_millis,
            transferable_across_reload: flags & 1 != 0,
            payload: reader.take(payload_len)?.to_vec(),
        });
    }
    reader.finish()?;
    Ok(effects)
}

pub fn decode_target_subscriptions(
    bytes: &[u8],
) -> Result<Vec<TargetSubscriptionSpec>, TargetAsyncError> {
    if bytes.len() > MAX_ASYNC_BYTES {
        return Err(TargetAsyncError::Capacity);
    }
    let mut reader = Reader::new(bytes);
    let mut subscriptions = Vec::new();
    let mut keys = std::collections::BTreeSet::new();
    let mut legacy_index = 0u32;
    while !reader.done() {
        if subscriptions.len() == MAX_RECORDS {
            return Err(TargetAsyncError::Capacity);
        }
        let tag = reader.u8()?;
        let (owner, key_len, kind_len, payload_len, mapper_id, legacy) = match tag {
            1 => (
                TargetSubscriptionOwner::UiRoot { logical_root: 0 },
                0,
                reader.u32()? as usize,
                reader.u32()? as usize,
                reader.u64()?,
                true,
            ),
            2 => (
                TargetSubscriptionOwner::UiRoot { logical_root: 0 },
                reader.u16()? as usize,
                reader.u16()? as usize,
                reader.u32()? as usize,
                reader.u64()?,
                false,
            ),
            3 => {
                let owner_tag = reader.u8()?;
                if reader.u8()? != 0 {
                    return Err(TargetAsyncError::Malformed);
                }
                let key_len = reader.u16()? as usize;
                let kind_len = reader.u16()? as usize;
                let payload_len = reader.u32()? as usize;
                let mapper_id = reader.u64()?;
                let owner_ref = reader.u64()?;
                let owner = match (owner_tag, owner_ref) {
                    (1, 0) => TargetSubscriptionOwner::App,
                    (2, 0) => TargetSubscriptionOwner::UiRoot { logical_root: 0 },
                    (3, logical_ref) if logical_ref != 0 => TargetSubscriptionOwner::Scope {
                        logical_root: 0,
                        logical_ref,
                    },
                    _ => return Err(TargetAsyncError::InvalidScope),
                };
                (owner, key_len, kind_len, payload_len, mapper_id, false)
            }
            4 => {
                let owner_tag = reader.u8()?;
                if reader.u8()? != 0 {
                    return Err(TargetAsyncError::Malformed);
                }
                let key_len = reader.u16()? as usize;
                let kind_len = reader.u16()? as usize;
                let payload_len = reader.u32()? as usize;
                let mapper_id = reader.u64()?;
                let owner_ref = reader.u64()?;
                let logical_root = reader.u64()?;
                let owner = match (owner_tag, logical_root, owner_ref) {
                    (1, 0, 0) => TargetSubscriptionOwner::App,
                    (2, logical_root, 0) if logical_root != 0 => {
                        TargetSubscriptionOwner::UiRoot { logical_root }
                    }
                    (3, logical_root, logical_ref) if logical_root != 0 && logical_ref != 0 => {
                        TargetSubscriptionOwner::Scope {
                            logical_root,
                            logical_ref,
                        }
                    }
                    _ => return Err(TargetAsyncError::InvalidScope),
                };
                (owner, key_len, kind_len, payload_len, mapper_id, false)
            }
            _ => return Err(TargetAsyncError::Malformed),
        };
        if key_len > MAX_LABEL_BYTES
            || kind_len == 0
            || kind_len > MAX_LABEL_BYTES
            || payload_len > MAX_PAYLOAD_BYTES
            || mapper_id == 0
            || mapper_id > u32::MAX as u64
        {
            return Err(TargetAsyncError::Malformed);
        }
        let key = if legacy {
            legacy_index = legacy_index
                .checked_add(1)
                .ok_or(TargetAsyncError::Capacity)?;
            format!("legacy-{legacy_index}")
        } else {
            if key_len == 0 {
                return Err(TargetAsyncError::Malformed);
            }
            reader.string(key_len)?
        };
        let kind = reader.string(kind_len)?;
        if !subscription_kind_supported(&kind) {
            return Err(TargetAsyncError::InvalidKind);
        }
        if !keys.insert((owner, key.clone())) {
            return Err(TargetAsyncError::DuplicateKey);
        }
        subscriptions.push(TargetSubscriptionSpec {
            owner,
            key,
            kind,
            payload: reader.take(payload_len)?.to_vec(),
            mapper_id: mapper_id as u32,
        });
    }
    Ok(subscriptions)
}

pub fn effect_executor(kind: &str) -> Option<EffectExecutor> {
    match kind {
        "focus" | "scroll" | "selection" | "measure" | "animation.begin" | "animation.cancel" => {
            Some(EffectExecutor::UiCommand)
        }
        "clipboard.read" | "clipboard.write" | "file.open" | "file.save" | "navigation"
        | "window.command" | "view.command" | "vfs" | "capability" | "audio.activation"
        | "haptics.rumble" => Some(EffectExecutor::PlatformRequest),
        "delay" | "background" => Some(EffectExecutor::TaskRegistry),
        _ => None,
    }
}

pub fn subscription_kind_supported(kind: &str) -> bool {
    matches!(
        kind,
        "timer.once"
            | "timer.interval"
            | "animation.clock"
            | "resize"
            | "visibility"
            | "route.location"
            | "global.shortcut"
            | "pointer.stream"
            | "file.drop"
            | "resource.watch"
            | "platform.lifecycle"
    )
}

struct Reader<'a> {
    bytes: &'a [u8],
    cursor: usize,
}

impl<'a> Reader<'a> {
    fn new(bytes: &'a [u8]) -> Self {
        Self { bytes, cursor: 0 }
    }

    fn done(&self) -> bool {
        self.cursor == self.bytes.len()
    }

    fn finish(&self) -> Result<(), TargetAsyncError> {
        self.done().then_some(()).ok_or(TargetAsyncError::Malformed)
    }

    fn take(&mut self, len: usize) -> Result<&'a [u8], TargetAsyncError> {
        let end = self
            .cursor
            .checked_add(len)
            .ok_or(TargetAsyncError::Malformed)?;
        let value = self
            .bytes
            .get(self.cursor..end)
            .ok_or(TargetAsyncError::Malformed)?;
        self.cursor = end;
        Ok(value)
    }

    fn u8(&mut self) -> Result<u8, TargetAsyncError> {
        Ok(self.take(1)?[0])
    }

    fn u16(&mut self) -> Result<u16, TargetAsyncError> {
        Ok(u16::from_le_bytes(
            self.take(2)?.try_into().expect("bounded u16"),
        ))
    }

    fn u32(&mut self) -> Result<u32, TargetAsyncError> {
        Ok(u32::from_le_bytes(
            self.take(4)?.try_into().expect("bounded u32"),
        ))
    }

    fn u64(&mut self) -> Result<u64, TargetAsyncError> {
        Ok(u64::from_le_bytes(
            self.take(8)?.try_into().expect("bounded u64"),
        ))
    }

    fn string(&mut self, len: usize) -> Result<String, TargetAsyncError> {
        std::str::from_utf8(self.take(len)?)
            .map(str::to_owned)
            .map_err(|_| TargetAsyncError::InvalidUtf8)
    }
}
