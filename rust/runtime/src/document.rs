use std::collections::{BTreeMap, VecDeque};

use vogui_protocol::v2::{Handle, UiSessionId};

pub type AppWindowId = Handle;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct DocumentRuntimeConfig {
    pub max_windows: usize,
    pub max_head_entries_per_window: usize,
    pub max_string_bytes: usize,
    pub max_pending_effects: usize,
    pub max_effect_payload_bytes: usize,
}

impl Default for DocumentRuntimeConfig {
    fn default() -> Self {
        Self {
            max_windows: 16,
            max_head_entries_per_window: 256,
            max_string_bytes: 1024 * 1024,
            max_pending_effects: 1024,
            max_effect_payload_bytes: 4 * 1024 * 1024,
        }
    }
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum HeadEntryKey {
    MetaName(String),
    MetaProperty(String),
    Link { relation: String, identity: String },
    Script(String),
    Custom(String),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HeadEntry {
    pub key: HeadEntryKey,
    pub attributes: BTreeMap<String, String>,
    pub text: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DocumentHead {
    pub revision: u64,
    pub title: String,
    pub language: String,
    pub direction: String,
    pub entries: Vec<HeadEntry>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum WindowEffectKind {
    Focus,
    Blur,
    SetTitle(String),
    SetCursor(String),
    RequestFullscreen,
    ExitFullscreen,
    SetDocumentHead(DocumentHead),
    OpenExternalUrl(String),
    SetClipboardText(String),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WindowEffect {
    pub effect_id: u64,
    pub session: UiSessionId,
    pub window: AppWindowId,
    pub deadline_millis: u64,
    pub kind: WindowEffectKind,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EncodedWindowEffect {
    pub effect_id: u64,
    pub session: UiSessionId,
    pub window: AppWindowId,
    pub deadline_millis: u64,
    pub platform_kind: &'static str,
    pub payload: Vec<u8>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum WindowEffectOutcome {
    Completed,
    Denied,
    Unsupported,
    Cancelled,
    TimedOut,
    Failed,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct WindowEffectCompletion {
    pub effect_id: u64,
    pub window: AppWindowId,
    pub outcome: WindowEffectOutcome,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct DocumentRuntimeInstrumentation {
    pub windows: usize,
    pub pending_effects: usize,
    pub queued_effects: usize,
    pub completions: usize,
    pub effect_payload_bytes: usize,
    pub closed: bool,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct DocumentRuntimeShutdown {
    pub detached_windows: Vec<AppWindowId>,
    pub cancelled_effects: Vec<WindowEffectCompletion>,
    pub discarded_completions: Vec<WindowEffectCompletion>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DocumentRuntimeError {
    InvalidConfig,
    InvalidIdentity,
    WindowCapacity,
    DuplicateWindow,
    UnknownWindow,
    RevisionMismatch,
    EntryCapacity,
    StringCapacity,
    EffectCapacity,
    EffectPayloadCapacity,
    EffectIdExhausted,
    UnknownEffect,
    CompletionCapacity,
    Closed,
}

#[derive(Clone, Debug)]
struct WindowDocumentState {
    head: DocumentHead,
}

pub struct DocumentRuntime {
    session: UiSessionId,
    config: DocumentRuntimeConfig,
    windows: BTreeMap<AppWindowId, WindowDocumentState>,
    effects: BTreeMap<u64, WindowEffect>,
    effect_order: VecDeque<u64>,
    completions: VecDeque<WindowEffectCompletion>,
    effect_payload_bytes: usize,
    next_effect_id: u64,
    closed: bool,
}

impl DocumentRuntime {
    pub fn new(
        session: UiSessionId,
        config: DocumentRuntimeConfig,
    ) -> Result<Self, DocumentRuntimeError> {
        if !session.is_valid()
            || config.max_windows == 0
            || config.max_head_entries_per_window == 0
            || config.max_string_bytes == 0
            || config.max_pending_effects == 0
            || config.max_effect_payload_bytes == 0
        {
            return Err(DocumentRuntimeError::InvalidConfig);
        }
        Ok(Self {
            session,
            config,
            windows: BTreeMap::new(),
            effects: BTreeMap::new(),
            effect_order: VecDeque::new(),
            completions: VecDeque::new(),
            effect_payload_bytes: 0,
            next_effect_id: 1,
            closed: false,
        })
    }

    pub fn instrumentation(&self) -> DocumentRuntimeInstrumentation {
        DocumentRuntimeInstrumentation {
            windows: self.windows.len(),
            pending_effects: self.effects.len(),
            queued_effects: self.effect_order.len(),
            completions: self.completions.len(),
            effect_payload_bytes: self.effect_payload_bytes,
            closed: self.closed,
        }
    }

    pub fn shutdown(&mut self) -> DocumentRuntimeShutdown {
        if self.closed {
            return DocumentRuntimeShutdown::default();
        }
        let detached_windows = self.windows.keys().copied().collect();
        let cancelled_effects = self
            .effects
            .values()
            .map(|effect| WindowEffectCompletion {
                effect_id: effect.effect_id,
                window: effect.window,
                outcome: WindowEffectOutcome::Cancelled,
            })
            .collect();
        let discarded_completions = self.completions.drain(..).collect();
        self.windows.clear();
        self.effects.clear();
        self.effect_order.clear();
        self.effect_payload_bytes = 0;
        self.closed = true;
        DocumentRuntimeShutdown {
            detached_windows,
            cancelled_effects,
            discarded_completions,
        }
    }

    pub fn attach_window(&mut self, window: AppWindowId) -> Result<(), DocumentRuntimeError> {
        self.ensure_open()?;
        if !window.is_valid() {
            return Err(DocumentRuntimeError::InvalidIdentity);
        }
        if self.windows.contains_key(&window) {
            return Err(DocumentRuntimeError::DuplicateWindow);
        }
        if self.windows.len() == self.config.max_windows {
            return Err(DocumentRuntimeError::WindowCapacity);
        }
        self.windows.insert(
            window,
            WindowDocumentState {
                head: DocumentHead {
                    revision: 1,
                    title: String::new(),
                    language: String::new(),
                    direction: String::new(),
                    entries: Vec::new(),
                },
            },
        );
        Ok(())
    }

    pub fn head(&self, window: AppWindowId) -> Result<&DocumentHead, DocumentRuntimeError> {
        self.ensure_open()?;
        self.windows
            .get(&window)
            .map(|state| &state.head)
            .ok_or(DocumentRuntimeError::UnknownWindow)
    }

    pub fn replace_head(
        &mut self,
        window: AppWindowId,
        expected_revision: u64,
        head: DocumentHead,
    ) -> Result<(), DocumentRuntimeError> {
        self.ensure_open()?;
        validate_head(&head, self.config)?;
        let state = self
            .windows
            .get_mut(&window)
            .ok_or(DocumentRuntimeError::UnknownWindow)?;
        if state.head.revision != expected_revision
            || head.revision != expected_revision.saturating_add(1)
        {
            return Err(DocumentRuntimeError::RevisionMismatch);
        }
        state.head = head;
        Ok(())
    }

    pub fn begin_effect(
        &mut self,
        window: AppWindowId,
        deadline_millis: u64,
        kind: WindowEffectKind,
    ) -> Result<u64, DocumentRuntimeError> {
        self.ensure_open()?;
        if !self.windows.contains_key(&window) {
            return Err(DocumentRuntimeError::UnknownWindow);
        }
        if self.effects.len() == self.config.max_pending_effects {
            return Err(DocumentRuntimeError::EffectCapacity);
        }
        let payload_bytes = effect_payload_bytes(&kind);
        let next_bytes = self
            .effect_payload_bytes
            .checked_add(payload_bytes)
            .filter(|bytes| *bytes <= self.config.max_effect_payload_bytes)
            .ok_or(DocumentRuntimeError::EffectPayloadCapacity)?;
        let effect_id = self.next_effect_id;
        self.next_effect_id = effect_id
            .checked_add(1)
            .ok_or(DocumentRuntimeError::EffectIdExhausted)?;
        self.effects.insert(
            effect_id,
            WindowEffect {
                effect_id,
                session: self.session,
                window,
                deadline_millis,
                kind,
            },
        );
        self.effect_order.push_back(effect_id);
        self.effect_payload_bytes = next_bytes;
        Ok(effect_id)
    }

    pub fn poll_effect(&mut self) -> Option<WindowEffect> {
        if self.closed {
            return None;
        }
        while let Some(effect_id) = self.effect_order.pop_front() {
            if let Some(effect) = self.effects.get(&effect_id) {
                return Some(effect.clone());
            }
        }
        None
    }

    pub fn complete_effect(
        &mut self,
        effect_id: u64,
        outcome: WindowEffectOutcome,
    ) -> Result<(), DocumentRuntimeError> {
        self.ensure_open()?;
        if self.completions.len() == self.config.max_pending_effects {
            return Err(DocumentRuntimeError::CompletionCapacity);
        }
        let effect = self
            .effects
            .remove(&effect_id)
            .ok_or(DocumentRuntimeError::UnknownEffect)?;
        self.effect_payload_bytes = self
            .effect_payload_bytes
            .saturating_sub(effect_payload_bytes(&effect.kind));
        self.completions.push_back(WindowEffectCompletion {
            effect_id,
            window: effect.window,
            outcome,
        });
        Ok(())
    }

    pub fn expire(&mut self, now_millis: u64) -> Result<usize, DocumentRuntimeError> {
        self.ensure_open()?;
        let expired = self
            .effects
            .values()
            .filter(|effect| effect.deadline_millis != 0 && now_millis > effect.deadline_millis)
            .map(|effect| effect.effect_id)
            .collect::<Vec<_>>();
        for effect_id in &expired {
            self.complete_effect(*effect_id, WindowEffectOutcome::TimedOut)?;
        }
        Ok(expired.len())
    }

    pub fn poll_completion(&mut self) -> Option<WindowEffectCompletion> {
        if self.closed {
            return None;
        }
        self.completions.pop_front()
    }

    pub fn detach_window(&mut self, window: AppWindowId) -> Result<usize, DocumentRuntimeError> {
        self.ensure_open()?;
        self.windows
            .remove(&window)
            .ok_or(DocumentRuntimeError::UnknownWindow)?;
        let pending = self
            .effects
            .values()
            .filter(|effect| effect.window == window)
            .map(|effect| effect.effect_id)
            .collect::<Vec<_>>();
        for effect_id in &pending {
            self.complete_effect(*effect_id, WindowEffectOutcome::Cancelled)?;
        }
        Ok(pending.len())
    }

    fn ensure_open(&self) -> Result<(), DocumentRuntimeError> {
        if self.closed {
            Err(DocumentRuntimeError::Closed)
        } else {
            Ok(())
        }
    }
}

impl WindowEffect {
    pub fn encode_platform_request(&self) -> Result<EncodedWindowEffect, DocumentRuntimeError> {
        let (platform_kind, payload) = match &self.kind {
            WindowEffectKind::Focus => ("window.command", encode_window_command("focus", &[])?),
            WindowEffectKind::Blur => ("window.command", encode_window_command("blur", &[])?),
            WindowEffectKind::SetTitle(title) => (
                "window.command",
                encode_window_command("title", title.as_bytes())?,
            ),
            WindowEffectKind::SetCursor(cursor) => (
                "window.command",
                encode_window_command("cursor", cursor.as_bytes())?,
            ),
            WindowEffectKind::RequestFullscreen => {
                ("window.command", encode_window_command("fullscreen", &[])?)
            }
            WindowEffectKind::ExitFullscreen => (
                "window.command",
                encode_window_command("exit-fullscreen", &[])?,
            ),
            WindowEffectKind::SetDocumentHead(head) => (
                "window.command",
                encode_window_command("document-head", &encode_document_head(head)?)?,
            ),
            WindowEffectKind::OpenExternalUrl(url) => ("navigation", url.as_bytes().to_vec()),
            WindowEffectKind::SetClipboardText(text) => {
                ("clipboard.write", text.as_bytes().to_vec())
            }
        };
        Ok(EncodedWindowEffect {
            effect_id: self.effect_id,
            session: self.session,
            window: self.window,
            deadline_millis: self.deadline_millis,
            platform_kind,
            payload,
        })
    }
}

pub fn encode_window_command(
    command: &str,
    argument: &[u8],
) -> Result<Vec<u8>, DocumentRuntimeError> {
    let command_len =
        u16::try_from(command.len()).map_err(|_| DocumentRuntimeError::EffectPayloadCapacity)?;
    let argument_len =
        u32::try_from(argument.len()).map_err(|_| DocumentRuntimeError::EffectPayloadCapacity)?;
    if command_len == 0 {
        return Err(DocumentRuntimeError::InvalidIdentity);
    }
    let mut bytes = Vec::with_capacity(10 + command.len() + argument.len());
    bytes.extend_from_slice(b"VWC1");
    bytes.extend_from_slice(&command_len.to_le_bytes());
    bytes.extend_from_slice(&argument_len.to_le_bytes());
    bytes.extend_from_slice(command.as_bytes());
    bytes.extend_from_slice(argument);
    Ok(bytes)
}

pub fn encode_document_head(head: &DocumentHead) -> Result<Vec<u8>, DocumentRuntimeError> {
    let config = DocumentRuntimeConfig::default();
    validate_head(head, config)?;
    let entry_count =
        u16::try_from(head.entries.len()).map_err(|_| DocumentRuntimeError::EntryCapacity)?;
    let mut bytes = Vec::new();
    bytes.extend_from_slice(b"VDH1");
    bytes.extend_from_slice(&head.revision.to_le_bytes());
    put_string_u32(&mut bytes, &head.title)?;
    put_string_u32(&mut bytes, &head.language)?;
    put_string_u32(&mut bytes, &head.direction)?;
    bytes.extend_from_slice(&entry_count.to_le_bytes());
    for entry in &head.entries {
        let (tag, key) = match &entry.key {
            HeadEntryKey::MetaName(name) => (1, format!("meta:name:{name}")),
            HeadEntryKey::MetaProperty(property) => (1, format!("meta:property:{property}")),
            HeadEntryKey::Link { relation, identity } => (2, format!("link:{relation}:{identity}")),
            HeadEntryKey::Script(identity) => (4, format!("script:{identity}")),
            HeadEntryKey::Custom(identity) => (3, format!("custom:{identity}")),
        };
        put_string_u16(&mut bytes, &key)?;
        bytes.push(tag);
        let attribute_count = u16::try_from(entry.attributes.len())
            .map_err(|_| DocumentRuntimeError::EntryCapacity)?;
        bytes.extend_from_slice(&attribute_count.to_le_bytes());
        for (name, value) in &entry.attributes {
            put_string_u16(&mut bytes, name)?;
            put_string_u32(&mut bytes, value)?;
        }
        put_string_u32(&mut bytes, &entry.text)?;
    }
    Ok(bytes)
}

fn validate_head(
    head: &DocumentHead,
    config: DocumentRuntimeConfig,
) -> Result<(), DocumentRuntimeError> {
    if head.revision == 0 || head.entries.len() > config.max_head_entries_per_window {
        return Err(DocumentRuntimeError::EntryCapacity);
    }
    let mut keys = BTreeMap::new();
    let mut bytes = head.title.len() + head.language.len() + head.direction.len();
    for entry in &head.entries {
        if keys.insert(entry.key.clone(), ()).is_some() {
            return Err(DocumentRuntimeError::InvalidIdentity);
        }
        bytes = bytes
            .checked_add(entry.text.len())
            .and_then(|bytes| {
                entry
                    .attributes
                    .iter()
                    .try_fold(bytes, |total, (name, value)| {
                        total.checked_add(name.len())?.checked_add(value.len())
                    })
            })
            .ok_or(DocumentRuntimeError::StringCapacity)?;
    }
    if bytes > config.max_string_bytes {
        return Err(DocumentRuntimeError::StringCapacity);
    }
    Ok(())
}

fn put_string_u16(bytes: &mut Vec<u8>, value: &str) -> Result<(), DocumentRuntimeError> {
    let length = u16::try_from(value.len()).map_err(|_| DocumentRuntimeError::StringCapacity)?;
    bytes.extend_from_slice(&length.to_le_bytes());
    bytes.extend_from_slice(value.as_bytes());
    Ok(())
}

fn put_string_u32(bytes: &mut Vec<u8>, value: &str) -> Result<(), DocumentRuntimeError> {
    let length = u32::try_from(value.len()).map_err(|_| DocumentRuntimeError::StringCapacity)?;
    bytes.extend_from_slice(&length.to_le_bytes());
    bytes.extend_from_slice(value.as_bytes());
    Ok(())
}

fn effect_payload_bytes(kind: &WindowEffectKind) -> usize {
    match kind {
        WindowEffectKind::SetTitle(value)
        | WindowEffectKind::SetCursor(value)
        | WindowEffectKind::OpenExternalUrl(value)
        | WindowEffectKind::SetClipboardText(value) => value.len(),
        WindowEffectKind::SetDocumentHead(head) => {
            head.title.len()
                + head.language.len()
                + head.direction.len()
                + head
                    .entries
                    .iter()
                    .map(|entry| {
                        entry.text.len()
                            + entry
                                .attributes
                                .iter()
                                .map(|(name, value)| name.len() + value.len())
                                .sum::<usize>()
                    })
                    .sum::<usize>()
        }
        WindowEffectKind::Focus
        | WindowEffectKind::Blur
        | WindowEffectKind::RequestFullscreen
        | WindowEffectKind::ExitFullscreen => 0,
    }
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

    #[test]
    fn head_replacement_is_revisioned_and_invalid_candidate_preserves_last_good() {
        let window = handle(2);
        let mut documents =
            DocumentRuntime::new(handle(1), DocumentRuntimeConfig::default()).unwrap();
        documents.attach_window(window).unwrap();
        let head = DocumentHead {
            revision: 2,
            title: "Vogui".to_owned(),
            language: "en".to_owned(),
            direction: "ltr".to_owned(),
            entries: vec![HeadEntry {
                key: HeadEntryKey::MetaName("description".to_owned()),
                attributes: BTreeMap::from([("content".to_owned(), "runtime".to_owned())]),
                text: String::new(),
            }],
        };
        documents.replace_head(window, 1, head.clone()).unwrap();
        assert_eq!(documents.head(window).unwrap(), &head);

        let mut duplicate = head.clone();
        duplicate.revision = 3;
        duplicate.entries.push(duplicate.entries[0].clone());
        assert_eq!(
            documents.replace_head(window, 2, duplicate),
            Err(DocumentRuntimeError::InvalidIdentity)
        );
        assert_eq!(documents.head(window).unwrap(), &head);
    }

    #[test]
    fn effects_complete_once_and_detach_cancels_remaining_window_work() {
        let window = handle(2);
        let mut documents =
            DocumentRuntime::new(handle(1), DocumentRuntimeConfig::default()).unwrap();
        documents.attach_window(window).unwrap();
        let expiring = documents
            .begin_effect(window, 10, WindowEffectKind::SetTitle("title".to_owned()))
            .unwrap();
        let pending = documents
            .begin_effect(window, 0, WindowEffectKind::RequestFullscreen)
            .unwrap();
        assert_eq!(documents.expire(11), Ok(1));
        assert_eq!(
            documents.poll_completion(),
            Some(WindowEffectCompletion {
                effect_id: expiring,
                window,
                outcome: WindowEffectOutcome::TimedOut,
            })
        );
        assert_eq!(documents.detach_window(window), Ok(1));
        assert_eq!(
            documents.poll_completion(),
            Some(WindowEffectCompletion {
                effect_id: pending,
                window,
                outcome: WindowEffectOutcome::Cancelled,
            })
        );
        assert_eq!(
            documents.complete_effect(pending, WindowEffectOutcome::Completed),
            Err(DocumentRuntimeError::UnknownEffect)
        );
    }
}
