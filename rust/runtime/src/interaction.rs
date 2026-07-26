use std::collections::{BTreeMap, BTreeSet, VecDeque};

use vogui_protocol::v2::{Handle, NodeId, UiRootId, UiSessionId};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct ExternalFileHandle {
    pub app_session: Handle,
    pub file: Handle,
    pub size_bytes: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MimePayload {
    Inline(Vec<u8>),
    ExternalFile(ExternalFileHandle),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MimeItem {
    pub mime: String,
    pub payload: MimePayload,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MimeOffer {
    pub items: Vec<MimeItem>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct InteractionConfig {
    pub max_mime_items: usize,
    pub max_mime_bytes: usize,
    pub max_inline_bytes: usize,
    pub max_pending_clipboard: usize,
    pub max_pending_file_reads: usize,
    pub max_file_chunk_bytes: usize,
    pub max_drag_sessions: usize,
    pub max_form_fields: usize,
    pub max_validation_bytes: usize,
    pub max_events: usize,
}

impl Default for InteractionConfig {
    fn default() -> Self {
        Self {
            max_mime_items: 64,
            max_mime_bytes: 4096,
            max_inline_bytes: 1024 * 1024,
            max_pending_clipboard: 64,
            max_pending_file_reads: 256,
            max_file_chunk_bytes: 1024 * 1024,
            max_drag_sessions: 32,
            max_form_fields: 4096,
            max_validation_bytes: 1024 * 1024,
            max_events: 1024,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum InteractionError {
    InvalidConfig,
    WrongSession,
    WrongRoot,
    InvalidIdentity,
    MimeCapacity,
    InlineCapacity,
    ClipboardCapacity,
    UnknownClipboardRequest,
    FileReadCapacity,
    UnknownFileRead,
    FileReadRange,
    DeadlineExpired,
    DuplicateCompletion,
    DragCapacity,
    UnknownDrag,
    DragSequence,
    InvalidDragTransition,
    FormCapacity,
    DuplicateField,
    UnknownForm,
    FormRevision,
    ValidationCapacity,
    EventCapacity,
    SequenceExhausted,
    GenerationExhausted,
    Closed,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ClipboardOperation {
    Read { accepted_mimes: Vec<String> },
    Write { offer: MimeOffer },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClipboardRequest {
    pub request_id: u64,
    pub session: UiSessionId,
    pub root: Option<UiRootId>,
    pub deadline_millis: u64,
    pub operation: ClipboardOperation,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ClipboardOutcome {
    Read(MimeOffer),
    Written,
    Denied,
    Unsupported,
    Cancelled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClipboardCompletion {
    pub request_id: u64,
    pub outcome: ClipboardOutcome,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FileReadRequest {
    pub request_id: u64,
    pub file: ExternalFileHandle,
    pub offset: u64,
    pub max_bytes: usize,
    pub deadline_millis: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FileReadCompletion {
    pub request_id: u64,
    pub file: ExternalFileHandle,
    pub offset: u64,
    pub bytes: Vec<u8>,
    pub eof: bool,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct DragSessionId(pub Handle);

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DragPhase {
    Entered,
    Over,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DragEvent {
    Enter {
        drag: DragSessionId,
        root: UiRootId,
        node: NodeId,
        sequence: u64,
        offer: MimeOffer,
    },
    Over {
        drag: DragSessionId,
        root: UiRootId,
        node: NodeId,
        sequence: u64,
        x_milli: i32,
        y_milli: i32,
    },
    Leave {
        drag: DragSessionId,
        root: UiRootId,
        node: NodeId,
        sequence: u64,
    },
    Drop {
        drag: DragSessionId,
        root: UiRootId,
        node: NodeId,
        sequence: u64,
        offer: MimeOffer,
    },
    Cancel {
        drag: DragSessionId,
        root: UiRootId,
        sequence: u64,
    },
}

#[derive(Clone, Debug)]
struct DragState {
    root: UiRootId,
    node: NodeId,
    phase: DragPhase,
    last_sequence: u64,
    offer: MimeOffer,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct FormId(pub Handle);

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FormFieldState {
    pub node: NodeId,
    pub value_revision: u64,
    pub edit_sequence: u64,
    pub required: bool,
    pub invalid: bool,
    pub help: String,
    pub error: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FormSnapshot {
    pub form: FormId,
    pub root: UiRootId,
    pub revision: u64,
    pub fields: Vec<FormFieldState>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FormSubmitEvent {
    pub form: FormId,
    pub root: UiRootId,
    pub revision: u64,
    pub submit_sequence: u64,
    pub invalid_fields: Vec<NodeId>,
}

pub struct InteractionRuntime {
    session: UiSessionId,
    config: InteractionConfig,
    next_request_id: u64,
    clipboard: BTreeMap<u64, ClipboardRequest>,
    clipboard_completions: VecDeque<ClipboardCompletion>,
    file_reads: BTreeMap<u64, FileReadRequest>,
    file_completions: VecDeque<FileReadCompletion>,
    drag_generations: Vec<u32>,
    drag_free: Vec<u32>,
    drags: BTreeMap<DragSessionId, DragState>,
    drag_events: VecDeque<DragEvent>,
    form_generations: Vec<u32>,
    form_free: Vec<u32>,
    forms: BTreeMap<FormId, FormSnapshot>,
    form_events: VecDeque<FormSubmitEvent>,
    next_submit_sequence: u64,
    closed: bool,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct InteractionOwnerSnapshot {
    pub clipboard_requests: usize,
    pub clipboard_completions: usize,
    pub file_reads: usize,
    pub file_completions: usize,
    pub drags: usize,
    pub drag_events: usize,
    pub forms: usize,
    pub form_events: usize,
    pub closed: bool,
}

impl InteractionRuntime {
    pub fn new(session: UiSessionId, config: InteractionConfig) -> Result<Self, InteractionError> {
        if !session.is_valid()
            || config.max_mime_items == 0
            || config.max_mime_bytes == 0
            || config.max_inline_bytes == 0
            || config.max_pending_clipboard == 0
            || config.max_pending_file_reads == 0
            || config.max_file_chunk_bytes == 0
            || config.max_drag_sessions == 0
            || config.max_form_fields == 0
            || config.max_validation_bytes == 0
            || config.max_events == 0
        {
            return Err(InteractionError::InvalidConfig);
        }
        Ok(Self {
            session,
            config,
            next_request_id: 1,
            clipboard: BTreeMap::new(),
            clipboard_completions: VecDeque::new(),
            file_reads: BTreeMap::new(),
            file_completions: VecDeque::new(),
            drag_generations: Vec::new(),
            drag_free: Vec::new(),
            drags: BTreeMap::new(),
            drag_events: VecDeque::new(),
            form_generations: Vec::new(),
            form_free: Vec::new(),
            forms: BTreeMap::new(),
            form_events: VecDeque::new(),
            next_submit_sequence: 1,
            closed: false,
        })
    }

    pub fn owner_snapshot(&self) -> InteractionOwnerSnapshot {
        InteractionOwnerSnapshot {
            clipboard_requests: self.clipboard.len(),
            clipboard_completions: self.clipboard_completions.len(),
            file_reads: self.file_reads.len(),
            file_completions: self.file_completions.len(),
            drags: self.drags.len(),
            drag_events: self.drag_events.len(),
            forms: self.forms.len(),
            form_events: self.form_events.len(),
            closed: self.closed,
        }
    }

    pub fn shutdown(&mut self) -> InteractionOwnerSnapshot {
        let released = self.owner_snapshot();
        self.clipboard.clear();
        self.clipboard_completions.clear();
        self.file_reads.clear();
        self.file_completions.clear();
        self.drags.clear();
        self.drag_events.clear();
        self.forms.clear();
        self.form_events.clear();
        self.drag_generations.clear();
        self.drag_free.clear();
        self.form_generations.clear();
        self.form_free.clear();
        self.closed = true;
        released
    }

    pub fn begin_clipboard(
        &mut self,
        root: Option<UiRootId>,
        deadline_millis: u64,
        operation: ClipboardOperation,
    ) -> Result<ClipboardRequest, InteractionError> {
        if root.is_some_and(|root| !root.is_valid()) {
            return Err(InteractionError::WrongRoot);
        }
        match &operation {
            ClipboardOperation::Read { accepted_mimes } => {
                validate_mimes(accepted_mimes, self.config)?;
            }
            ClipboardOperation::Write { offer } => validate_offer(offer, self.config)?,
        }
        if self.clipboard.len() == self.config.max_pending_clipboard {
            return Err(InteractionError::ClipboardCapacity);
        }
        let request_id = self.allocate_request_id()?;
        let request = ClipboardRequest {
            request_id,
            session: self.session,
            root,
            deadline_millis,
            operation,
        };
        self.clipboard.insert(request_id, request.clone());
        Ok(request)
    }

    pub fn complete_clipboard(
        &mut self,
        request_id: u64,
        now_millis: u64,
        outcome: ClipboardOutcome,
    ) -> Result<(), InteractionError> {
        let request = self
            .clipboard
            .get(&request_id)
            .ok_or(InteractionError::UnknownClipboardRequest)?;
        if now_millis > request.deadline_millis {
            return Err(InteractionError::DeadlineExpired);
        }
        if let ClipboardOutcome::Read(offer) = &outcome {
            validate_offer(offer, self.config)?;
        }
        if self.clipboard_completions.len() == self.config.max_events {
            return Err(InteractionError::EventCapacity);
        }
        self.clipboard.remove(&request_id);
        self.clipboard_completions.push_back(ClipboardCompletion {
            request_id,
            outcome,
        });
        Ok(())
    }

    pub fn poll_clipboard_completion(&mut self) -> Option<ClipboardCompletion> {
        self.clipboard_completions.pop_front()
    }

    pub fn begin_file_read(
        &mut self,
        file: ExternalFileHandle,
        offset: u64,
        max_bytes: usize,
        deadline_millis: u64,
    ) -> Result<FileReadRequest, InteractionError> {
        validate_file(file)?;
        if offset > file.size_bytes
            || max_bytes == 0
            || max_bytes > self.config.max_file_chunk_bytes
        {
            return Err(InteractionError::FileReadRange);
        }
        if self.file_reads.len() == self.config.max_pending_file_reads {
            return Err(InteractionError::FileReadCapacity);
        }
        let request_id = self.allocate_request_id()?;
        let request = FileReadRequest {
            request_id,
            file,
            offset,
            max_bytes,
            deadline_millis,
        };
        self.file_reads.insert(request_id, request.clone());
        Ok(request)
    }

    pub fn complete_file_read(
        &mut self,
        completion: FileReadCompletion,
        now_millis: u64,
    ) -> Result<(), InteractionError> {
        let request = self
            .file_reads
            .get(&completion.request_id)
            .ok_or(InteractionError::UnknownFileRead)?;
        if now_millis > request.deadline_millis {
            return Err(InteractionError::DeadlineExpired);
        }
        if completion.file != request.file
            || completion.offset != request.offset
            || completion.bytes.len() > request.max_bytes
            || completion
                .offset
                .saturating_add(completion.bytes.len() as u64)
                > completion.file.size_bytes
            || completion.eof
                != (completion
                    .offset
                    .saturating_add(completion.bytes.len() as u64)
                    == completion.file.size_bytes)
        {
            return Err(InteractionError::FileReadRange);
        }
        if self.file_completions.len() == self.config.max_events {
            return Err(InteractionError::EventCapacity);
        }
        self.file_reads.remove(&completion.request_id);
        self.file_completions.push_back(completion);
        Ok(())
    }

    pub fn poll_file_completion(&mut self) -> Option<FileReadCompletion> {
        self.file_completions.pop_front()
    }

    pub fn drag_enter(
        &mut self,
        root: UiRootId,
        node: NodeId,
        sequence: u64,
        offer: MimeOffer,
    ) -> Result<DragSessionId, InteractionError> {
        validate_root_node(root, node)?;
        if sequence == 0 {
            return Err(InteractionError::DragSequence);
        }
        validate_offer(&offer, self.config)?;
        if self.drags.len() == self.config.max_drag_sessions {
            return Err(InteractionError::DragCapacity);
        }
        self.preflight_event()?;
        let drag = self.allocate_drag()?;
        self.drags.insert(
            drag,
            DragState {
                root,
                node,
                phase: DragPhase::Entered,
                last_sequence: sequence,
                offer: offer.clone(),
            },
        );
        self.drag_events.push_back(DragEvent::Enter {
            drag,
            root,
            node,
            sequence,
            offer,
        });
        Ok(drag)
    }

    pub fn drag_over(
        &mut self,
        drag: DragSessionId,
        node: NodeId,
        sequence: u64,
        x_milli: i32,
        y_milli: i32,
    ) -> Result<(), InteractionError> {
        if !node.is_valid() {
            return Err(InteractionError::InvalidIdentity);
        }
        self.preflight_event()?;
        let root = {
            let state = self.drag_state_mut(drag, sequence)?;
            state.node = node;
            state.phase = DragPhase::Over;
            state.last_sequence = sequence;
            state.root
        };
        self.drag_events.push_back(DragEvent::Over {
            drag,
            root,
            node,
            sequence,
            x_milli,
            y_milli,
        });
        Ok(())
    }

    pub fn drag_leave(
        &mut self,
        drag: DragSessionId,
        sequence: u64,
    ) -> Result<(), InteractionError> {
        self.preflight_event()?;
        let state = self.remove_drag(drag, sequence)?;
        self.drag_events.push_back(DragEvent::Leave {
            drag,
            root: state.root,
            node: state.node,
            sequence,
        });
        Ok(())
    }

    pub fn drop(&mut self, drag: DragSessionId, sequence: u64) -> Result<(), InteractionError> {
        self.preflight_event()?;
        let state = self.remove_drag(drag, sequence)?;
        self.drag_events.push_back(DragEvent::Drop {
            drag,
            root: state.root,
            node: state.node,
            sequence,
            offer: state.offer,
        });
        Ok(())
    }

    pub fn poll_drag_event(&mut self) -> Option<DragEvent> {
        self.drag_events.pop_front()
    }

    pub fn register_form(
        &mut self,
        root: UiRootId,
        fields: Vec<FormFieldState>,
    ) -> Result<FormId, InteractionError> {
        if !root.is_valid() || fields.len() > self.config.max_form_fields {
            return Err(InteractionError::FormCapacity);
        }
        validate_fields(&fields, self.config)?;
        let form = self.allocate_form()?;
        self.forms.insert(
            form,
            FormSnapshot {
                form,
                root,
                revision: 1,
                fields,
            },
        );
        Ok(form)
    }

    pub fn update_form(
        &mut self,
        form: FormId,
        base_revision: u64,
        fields: Vec<FormFieldState>,
    ) -> Result<u64, InteractionError> {
        validate_fields(&fields, self.config)?;
        let current = self.forms.get(&form).ok_or(InteractionError::UnknownForm)?;
        if current.revision != base_revision {
            return Err(InteractionError::FormRevision);
        }
        let revision = base_revision
            .checked_add(1)
            .ok_or(InteractionError::GenerationExhausted)?;
        self.forms.get_mut(&form).unwrap().fields = fields;
        self.forms.get_mut(&form).unwrap().revision = revision;
        Ok(revision)
    }

    pub fn submit_form(&mut self, form: FormId) -> Result<FormSubmitEvent, InteractionError> {
        self.preflight_event()?;
        let snapshot = self.forms.get(&form).ok_or(InteractionError::UnknownForm)?;
        let submit_sequence = self.next_submit_sequence;
        self.next_submit_sequence = submit_sequence
            .checked_add(1)
            .ok_or(InteractionError::SequenceExhausted)?;
        let event = FormSubmitEvent {
            form,
            root: snapshot.root,
            revision: snapshot.revision,
            submit_sequence,
            invalid_fields: snapshot
                .fields
                .iter()
                .filter_map(|field| field.invalid.then_some(field.node))
                .collect(),
        };
        self.form_events.push_back(event.clone());
        Ok(event)
    }

    pub fn poll_form_event(&mut self) -> Option<FormSubmitEvent> {
        self.form_events.pop_front()
    }

    pub fn close_form(&mut self, form: FormId) -> Result<(), InteractionError> {
        if !self.forms.contains_key(&form) {
            return Err(InteractionError::UnknownForm);
        }
        let next_generation = self.form_generations[form.0.index as usize]
            .checked_add(1)
            .ok_or(InteractionError::GenerationExhausted)?;
        self.forms.remove(&form);
        self.form_generations[form.0.index as usize] = next_generation;
        self.form_free.push(form.0.index);
        Ok(())
    }

    pub fn close_root(&mut self, root: UiRootId) -> Result<(), InteractionError> {
        self.preflight_close_root(root)?;
        let drags = self
            .drags
            .iter()
            .filter_map(|(drag, state)| {
                (state.root == root).then_some((*drag, state.last_sequence))
            })
            .collect::<Vec<_>>();
        let forms = self
            .forms
            .iter()
            .filter_map(|(form, snapshot)| (snapshot.root == root).then_some(*form))
            .collect::<Vec<_>>();
        let clipboard = self
            .clipboard
            .iter()
            .filter_map(|(request_id, request)| (request.root == Some(root)).then_some(*request_id))
            .collect::<Vec<_>>();
        for (drag, sequence) in drags {
            self.drags.remove(&drag);
            self.drag_generations[drag.0.index as usize] += 1;
            self.drag_free.push(drag.0.index);
            self.drag_events.push_back(DragEvent::Cancel {
                drag,
                root,
                sequence: sequence + 1,
            });
        }
        for form in forms {
            self.forms.remove(&form);
            self.form_generations[form.0.index as usize] += 1;
            self.form_free.push(form.0.index);
        }
        for request_id in clipboard {
            self.clipboard.remove(&request_id);
            self.clipboard_completions.push_back(ClipboardCompletion {
                request_id,
                outcome: ClipboardOutcome::Cancelled,
            });
        }
        Ok(())
    }

    pub fn preflight_close_root(&self, root: UiRootId) -> Result<(), InteractionError> {
        self.ensure_open()?;
        let drags = self
            .drags
            .iter()
            .filter_map(|(drag, state)| {
                (state.root == root).then_some((*drag, state.last_sequence))
            })
            .collect::<Vec<_>>();
        let forms = self
            .forms
            .iter()
            .filter_map(|(form, snapshot)| (snapshot.root == root).then_some(*form))
            .collect::<Vec<_>>();
        let clipboard_count = self
            .clipboard
            .values()
            .filter(|request| request.root == Some(root))
            .count();
        if self.drag_events.len().saturating_add(drags.len()) > self.config.max_events
            || self
                .clipboard_completions
                .len()
                .saturating_add(clipboard_count)
                > self.config.max_events
        {
            return Err(InteractionError::EventCapacity);
        }
        for (drag, sequence) in &drags {
            self.drag_generations[drag.0.index as usize]
                .checked_add(1)
                .ok_or(InteractionError::GenerationExhausted)?;
            sequence
                .checked_add(1)
                .ok_or(InteractionError::SequenceExhausted)?;
        }
        for form in &forms {
            self.form_generations[form.0.index as usize]
                .checked_add(1)
                .ok_or(InteractionError::GenerationExhausted)?;
        }
        Ok(())
    }

    fn allocate_request_id(&mut self) -> Result<u64, InteractionError> {
        self.ensure_open()?;
        let request_id = self.next_request_id;
        self.next_request_id = request_id
            .checked_add(1)
            .ok_or(InteractionError::SequenceExhausted)?;
        Ok(request_id)
    }

    fn allocate_drag(&mut self) -> Result<DragSessionId, InteractionError> {
        self.ensure_open()?;
        let index = if let Some(index) = self.drag_free.pop() {
            index
        } else {
            if self.drag_generations.len() == u32::MAX as usize {
                return Err(InteractionError::DragCapacity);
            }
            self.drag_generations.push(1);
            (self.drag_generations.len() - 1) as u32
        };
        Ok(DragSessionId(Handle {
            index,
            generation: self.drag_generations[index as usize],
        }))
    }

    fn drag_state_mut(
        &mut self,
        drag: DragSessionId,
        sequence: u64,
    ) -> Result<&mut DragState, InteractionError> {
        self.ensure_open()?;
        let state = self
            .drags
            .get_mut(&drag)
            .ok_or(InteractionError::UnknownDrag)?;
        if sequence <= state.last_sequence {
            return Err(InteractionError::DragSequence);
        }
        Ok(state)
    }

    fn remove_drag(
        &mut self,
        drag: DragSessionId,
        sequence: u64,
    ) -> Result<DragState, InteractionError> {
        self.ensure_open()?;
        let state = self.drags.get(&drag).ok_or(InteractionError::UnknownDrag)?;
        if sequence <= state.last_sequence {
            return Err(InteractionError::DragSequence);
        }
        let next_generation = self.drag_generations[drag.0.index as usize]
            .checked_add(1)
            .ok_or(InteractionError::GenerationExhausted)?;
        let state = self.drags.remove(&drag).unwrap();
        self.drag_generations[drag.0.index as usize] = next_generation;
        self.drag_free.push(drag.0.index);
        Ok(state)
    }

    fn allocate_form(&mut self) -> Result<FormId, InteractionError> {
        self.ensure_open()?;
        let index = if let Some(index) = self.form_free.pop() {
            index
        } else {
            if self.form_generations.len() == u32::MAX as usize {
                return Err(InteractionError::FormCapacity);
            }
            self.form_generations.push(1);
            (self.form_generations.len() - 1) as u32
        };
        Ok(FormId(Handle {
            index,
            generation: self.form_generations[index as usize],
        }))
    }

    fn preflight_event(&self) -> Result<(), InteractionError> {
        self.ensure_open()?;
        if self.drag_events.len() + self.form_events.len() >= self.config.max_events {
            return Err(InteractionError::EventCapacity);
        }
        Ok(())
    }

    fn ensure_open(&self) -> Result<(), InteractionError> {
        if self.closed {
            Err(InteractionError::Closed)
        } else {
            Ok(())
        }
    }
}

fn validate_offer(offer: &MimeOffer, config: InteractionConfig) -> Result<(), InteractionError> {
    if offer.items.is_empty() || offer.items.len() > config.max_mime_items {
        return Err(InteractionError::MimeCapacity);
    }
    let mut mimes = BTreeSet::new();
    let mut mime_bytes = 0_usize;
    let mut inline_bytes = 0_usize;
    for item in &offer.items {
        if item.mime.is_empty() || !item.mime.contains('/') || !mimes.insert(&item.mime) {
            return Err(InteractionError::MimeCapacity);
        }
        mime_bytes = mime_bytes
            .checked_add(item.mime.len())
            .ok_or(InteractionError::MimeCapacity)?;
        match &item.payload {
            MimePayload::Inline(bytes) => {
                inline_bytes = inline_bytes
                    .checked_add(bytes.len())
                    .ok_or(InteractionError::InlineCapacity)?;
            }
            MimePayload::ExternalFile(file) => validate_file(*file)?,
        }
    }
    if mime_bytes > config.max_mime_bytes || inline_bytes > config.max_inline_bytes {
        return Err(InteractionError::InlineCapacity);
    }
    Ok(())
}

fn validate_mimes(mimes: &[String], config: InteractionConfig) -> Result<(), InteractionError> {
    let offer = MimeOffer {
        items: mimes
            .iter()
            .map(|mime| MimeItem {
                mime: mime.clone(),
                payload: MimePayload::Inline(Vec::new()),
            })
            .collect(),
    };
    validate_offer(&offer, config)
}

fn validate_file(file: ExternalFileHandle) -> Result<(), InteractionError> {
    if !file.app_session.is_valid() || !file.file.is_valid() {
        return Err(InteractionError::InvalidIdentity);
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

    fn offer() -> MimeOffer {
        MimeOffer {
            items: vec![MimeItem {
                mime: "text/plain".to_owned(),
                payload: MimePayload::Inline(b"payload".to_vec()),
            }],
        }
    }

    #[test]
    fn root_close_cancels_owned_clipboard_drag_and_form_state() {
        let root = handle(2);
        let node = handle(3);
        let mut interactions =
            InteractionRuntime::new(handle(1), InteractionConfig::default()).unwrap();
        let clipboard = interactions
            .begin_clipboard(
                Some(root),
                100,
                ClipboardOperation::Read {
                    accepted_mimes: vec!["text/plain".to_owned()],
                },
            )
            .unwrap();
        let drag = interactions.drag_enter(root, node, 1, offer()).unwrap();
        assert!(matches!(
            interactions.poll_drag_event(),
            Some(DragEvent::Enter { .. })
        ));
        let form = interactions
            .register_form(
                root,
                vec![FormFieldState {
                    node,
                    value_revision: 1,
                    edit_sequence: 1,
                    required: true,
                    invalid: false,
                    help: String::new(),
                    error: String::new(),
                }],
            )
            .unwrap();

        interactions.close_root(root).unwrap();
        assert_eq!(
            interactions.poll_clipboard_completion(),
            Some(ClipboardCompletion {
                request_id: clipboard.request_id,
                outcome: ClipboardOutcome::Cancelled,
            })
        );
        assert!(matches!(
            interactions.poll_drag_event(),
            Some(DragEvent::Cancel {
                drag: value,
                sequence: 2,
                ..
            }) if value == drag
        ));
        assert_eq!(
            interactions.drop(drag, 3),
            Err(InteractionError::UnknownDrag)
        );
        assert_eq!(
            interactions.submit_form(form),
            Err(InteractionError::UnknownForm)
        );
    }

    #[test]
    fn drag_and_form_events_enforce_monotonic_state_and_validation_snapshot() {
        let root = handle(2);
        let node = handle(3);
        let mut interactions =
            InteractionRuntime::new(handle(1), InteractionConfig::default()).unwrap();
        let drag = interactions.drag_enter(root, node, 10, offer()).unwrap();
        assert_eq!(
            interactions.drag_over(drag, node, 10, 1, 2),
            Err(InteractionError::DragSequence)
        );
        interactions.drag_over(drag, handle(4), 11, 1, 2).unwrap();
        interactions.drop(drag, 12).unwrap();

        let invalid = handle(8);
        let form = interactions
            .register_form(
                root,
                vec![FormFieldState {
                    node: invalid,
                    value_revision: 1,
                    edit_sequence: 1,
                    required: true,
                    invalid: true,
                    help: String::new(),
                    error: "required".to_owned(),
                }],
            )
            .unwrap();
        let event = interactions.submit_form(form).unwrap();
        assert_eq!(event.revision, 1);
        assert_eq!(event.invalid_fields, vec![invalid]);
        assert_eq!(interactions.poll_form_event(), Some(event));
    }
}

fn validate_root_node(root: UiRootId, node: NodeId) -> Result<(), InteractionError> {
    if !root.is_valid() || !node.is_valid() {
        return Err(InteractionError::InvalidIdentity);
    }
    Ok(())
}

fn validate_fields(
    fields: &[FormFieldState],
    config: InteractionConfig,
) -> Result<(), InteractionError> {
    if fields.len() > config.max_form_fields {
        return Err(InteractionError::FormCapacity);
    }
    let mut nodes = BTreeSet::new();
    let mut validation_bytes = 0_usize;
    for field in fields {
        if !field.node.is_valid() || !nodes.insert(field.node) {
            return Err(InteractionError::DuplicateField);
        }
        validation_bytes = validation_bytes
            .checked_add(field.help.len() + field.error.len())
            .ok_or(InteractionError::ValidationCapacity)?;
    }
    if validation_bytes > config.max_validation_bytes {
        return Err(InteractionError::ValidationCapacity);
    }
    Ok(())
}
