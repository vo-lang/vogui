use std::collections::{BTreeMap, VecDeque};

use vogui_protocol::v2::{NodeId, NodeRef, UiRootId};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct CommandQueueConfig {
    pub max_pending: usize,
    pub max_payload_bytes: usize,
    pub max_kind_bytes: usize,
}

impl Default for CommandQueueConfig {
    fn default() -> Self {
        Self {
            max_pending: 1024,
            max_payload_bytes: 1024 * 1024,
            max_kind_bytes: 256,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UiCommand {
    pub command_id: u64,
    pub root: UiRootId,
    pub ui_root_epoch: u32,
    pub app_code_epoch: u64,
    pub target: NodeRef,
    pub target_node: NodeId,
    pub expected_binding_generation: u32,
    pub min_applied_revision: u64,
    pub deadline_millis: u64,
    pub kind: String,
    pub payload: Vec<u8>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiCoordinateSpace {
    CssViewport,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiMeasurement {
    pub target: NodeRef,
    pub binding_generation: u32,
    pub metrics_revision: u64,
    pub layout_revision: u64,
    pub coordinate_space: UiCoordinateSpace,
    pub x_milli: i64,
    pub y_milli: i64,
    pub width_milli: i64,
    pub height_milli: i64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiCommandOutcome {
    Executed,
    Measured(UiMeasurement),
    DroppedBeforeDispatch,
    OutcomeUnknownOnRendererRestart,
    Failed,
    Cancelled,
    StaleBinding,
    DeadlineExpired,
    FutureRevision,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiCommandResult {
    pub command_id: u64,
    pub root: UiRootId,
    pub outcome: UiCommandOutcome,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CommandQueueError {
    InvalidConfig,
    InvalidIdentity,
    InvalidKind,
    Capacity,
    PayloadCapacity,
    CommandIdExhausted,
    UnknownCommand,
    IdentityMismatch,
    NotDispatched,
    AlreadyDispatched,
    Closed,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct CommandQueueInstrumentation {
    pub pending: usize,
    pub peak_pending: usize,
    pub pending_bytes: usize,
    pub peak_pending_bytes: usize,
    pub enqueued: u64,
    pub dispatched: u64,
    pub terminal: u64,
    pub capacity_rejections: u64,
    pub payload_rejections: u64,
    pub closed: bool,
}

#[derive(Debug)]
struct PendingCommand {
    command: UiCommand,
    dispatched: bool,
}

pub struct UiCommandQueue {
    config: CommandQueueConfig,
    next_command_id: u64,
    pending_bytes: usize,
    pending: BTreeMap<u64, PendingCommand>,
    order: VecDeque<u64>,
    instrumentation: CommandQueueInstrumentation,
    closed: bool,
}

impl UiCommandQueue {
    pub fn new(config: CommandQueueConfig) -> Result<Self, CommandQueueError> {
        if config.max_pending == 0 || config.max_payload_bytes == 0 || config.max_kind_bytes == 0 {
            return Err(CommandQueueError::InvalidConfig);
        }
        Ok(Self {
            config,
            next_command_id: 1,
            pending_bytes: 0,
            pending: BTreeMap::new(),
            order: VecDeque::new(),
            instrumentation: CommandQueueInstrumentation::default(),
            closed: false,
        })
    }

    pub fn begin(
        &mut self,
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        target: NodeRef,
        target_node: NodeId,
        expected_binding_generation: u32,
        min_applied_revision: u64,
        deadline_millis: u64,
        kind: String,
        payload: Vec<u8>,
    ) -> Result<u64, CommandQueueError> {
        if self.closed {
            return Err(CommandQueueError::Closed);
        }
        if !root.is_valid()
            || !target.is_valid()
            || !target_node.is_valid()
            || expected_binding_generation == 0
            || ui_root_epoch == 0
            || app_code_epoch == 0
        {
            return Err(CommandQueueError::InvalidIdentity);
        }
        if kind.is_empty() || kind.len() > self.config.max_kind_bytes {
            return Err(CommandQueueError::InvalidKind);
        }
        if self.pending.len() == self.config.max_pending {
            self.instrumentation.capacity_rejections =
                self.instrumentation.capacity_rejections.saturating_add(1);
            return Err(CommandQueueError::Capacity);
        }
        let Some(next_bytes) = self.pending_bytes.checked_add(payload.len()) else {
            self.instrumentation.payload_rejections =
                self.instrumentation.payload_rejections.saturating_add(1);
            return Err(CommandQueueError::PayloadCapacity);
        };
        if next_bytes > self.config.max_payload_bytes {
            self.instrumentation.payload_rejections =
                self.instrumentation.payload_rejections.saturating_add(1);
            return Err(CommandQueueError::PayloadCapacity);
        }
        let command_id = self.next_command_id;
        let next_command_id = command_id
            .checked_add(1)
            .ok_or(CommandQueueError::CommandIdExhausted)?;
        let command = UiCommand {
            command_id,
            root,
            ui_root_epoch,
            app_code_epoch,
            target,
            target_node,
            expected_binding_generation,
            min_applied_revision,
            deadline_millis,
            kind,
            payload,
        };
        self.pending.insert(
            command_id,
            PendingCommand {
                command,
                dispatched: false,
            },
        );
        self.order.push_back(command_id);
        self.pending_bytes = next_bytes;
        self.next_command_id = next_command_id;
        self.instrumentation.pending = self.pending.len();
        self.instrumentation.pending_bytes = self.pending_bytes;
        self.instrumentation.peak_pending = self
            .instrumentation
            .peak_pending
            .max(self.instrumentation.pending);
        self.instrumentation.peak_pending_bytes = self
            .instrumentation
            .peak_pending_bytes
            .max(self.instrumentation.pending_bytes);
        self.instrumentation.enqueued = self.instrumentation.enqueued.saturating_add(1);
        Ok(command_id)
    }

    pub fn poll(&mut self) -> Option<UiCommand> {
        while let Some(command_id) = self.order.pop_front() {
            let Some(pending) = self.pending.get_mut(&command_id) else {
                continue;
            };
            if pending.dispatched {
                continue;
            }
            pending.dispatched = true;
            self.instrumentation.dispatched = self.instrumentation.dispatched.saturating_add(1);
            return Some(pending.command.clone());
        }
        None
    }

    pub fn complete(
        &mut self,
        command_id: u64,
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        outcome: UiCommandOutcome,
    ) -> Result<UiCommandResult, CommandQueueError> {
        let pending = self
            .pending
            .get(&command_id)
            .ok_or(CommandQueueError::UnknownCommand)?;
        if pending.command.root != root
            || pending.command.ui_root_epoch != ui_root_epoch
            || pending.command.app_code_epoch != app_code_epoch
        {
            return Err(CommandQueueError::IdentityMismatch);
        }
        if !pending.dispatched {
            return Err(CommandQueueError::NotDispatched);
        }
        let pending = self.pending.remove(&command_id).unwrap();
        self.pending_bytes -= pending.command.payload.len();
        self.record_terminal();
        Ok(UiCommandResult {
            command_id,
            root,
            outcome,
        })
    }

    pub fn cancel(&mut self, command_id: u64) -> Result<UiCommandResult, CommandQueueError> {
        if self
            .pending
            .get(&command_id)
            .ok_or(CommandQueueError::UnknownCommand)?
            .dispatched
        {
            return Err(CommandQueueError::AlreadyDispatched);
        }
        let pending = self
            .pending
            .remove(&command_id)
            .ok_or(CommandQueueError::UnknownCommand)?;
        self.order.retain(|queued| *queued != command_id);
        self.pending_bytes -= pending.command.payload.len();
        self.record_terminal();
        Ok(UiCommandResult {
            command_id,
            root: pending.command.root,
            outcome: UiCommandOutcome::Cancelled,
        })
    }

    pub fn restart_root(&mut self, root: UiRootId) -> Vec<UiCommandResult> {
        let command_ids = self
            .pending
            .iter()
            .filter(|(_, pending)| pending.command.root == root)
            .map(|(command_id, _)| *command_id)
            .collect::<Vec<_>>();
        let command_id_set = command_ids
            .iter()
            .copied()
            .collect::<std::collections::BTreeSet<_>>();
        self.order
            .retain(|command_id| !command_id_set.contains(command_id));
        let results = command_ids
            .into_iter()
            .map(|command_id| {
                let pending = self.pending.remove(&command_id).unwrap();
                self.pending_bytes -= pending.command.payload.len();
                UiCommandResult {
                    command_id,
                    root,
                    outcome: if pending.dispatched {
                        UiCommandOutcome::OutcomeUnknownOnRendererRestart
                    } else {
                        UiCommandOutcome::DroppedBeforeDispatch
                    },
                }
            })
            .collect::<Vec<_>>();
        for _ in &results {
            self.record_terminal();
        }
        results
    }

    pub fn pending_count(&self) -> usize {
        self.pending.len()
    }

    pub fn command(&self, command_id: u64) -> Option<&UiCommand> {
        self.pending
            .get(&command_id)
            .map(|pending| &pending.command)
    }

    pub fn pending_bytes(&self) -> usize {
        self.pending_bytes
    }

    pub const fn instrumentation(&self) -> CommandQueueInstrumentation {
        self.instrumentation
    }

    pub fn shutdown(&mut self) -> Vec<UiCommandResult> {
        if self.closed {
            return Vec::new();
        }
        let roots = self
            .pending
            .values()
            .map(|pending| pending.command.root)
            .collect::<std::collections::BTreeSet<_>>();
        let mut results = Vec::new();
        for root in roots {
            results.extend(self.restart_root(root));
        }
        self.closed = true;
        self.instrumentation.closed = true;
        results
    }

    fn record_terminal(&mut self) {
        self.instrumentation.pending = self.pending.len();
        self.instrumentation.pending_bytes = self.pending_bytes;
        self.instrumentation.terminal = self.instrumentation.terminal.saturating_add(1);
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RendererCommandConfig {
    pub max_staged: usize,
    pub max_future_revision_window: u64,
}

impl Default for RendererCommandConfig {
    fn default() -> Self {
        Self {
            max_staged: 1024,
            max_future_revision_window: 1024,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RendererCommandError {
    InvalidConfig,
    WrongRoot,
    StaleRootEpoch,
    StaleAppCodeEpoch,
    Sequence,
    Capacity,
    RevisionReversed,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RendererCommandAdmission {
    Ready(UiCommand),
    Staged,
    Terminal(UiCommandResult),
}

pub struct RendererCommandRuntime {
    root: UiRootId,
    ui_root_epoch: u32,
    app_code_epoch: u64,
    config: RendererCommandConfig,
    applied_revision: u64,
    last_sequence: u64,
    bindings: BTreeMap<NodeRef, (NodeId, u32)>,
    staged: BTreeMap<u64, UiCommand>,
    order: VecDeque<u64>,
}

impl RendererCommandRuntime {
    pub fn new(
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        config: RendererCommandConfig,
    ) -> Result<Self, RendererCommandError> {
        if !root.is_valid()
            || ui_root_epoch == 0
            || app_code_epoch == 0
            || config.max_staged == 0
            || config.max_future_revision_window == 0
        {
            return Err(RendererCommandError::InvalidConfig);
        }
        Ok(Self {
            root,
            ui_root_epoch,
            app_code_epoch,
            config,
            applied_revision: 0,
            last_sequence: 0,
            bindings: BTreeMap::new(),
            staged: BTreeMap::new(),
            order: VecDeque::new(),
        })
    }

    pub fn bind(
        &mut self,
        logical: NodeRef,
        node: NodeId,
        binding_generation: u32,
    ) -> Result<(), RendererCommandError> {
        if !logical.is_valid() || !node.is_valid() || binding_generation == 0 {
            return Err(RendererCommandError::InvalidConfig);
        }
        self.bindings.insert(logical, (node, binding_generation));
        Ok(())
    }

    pub fn unbind(&mut self, logical: NodeRef, binding_generation: u32) {
        if self
            .bindings
            .get(&logical)
            .is_some_and(|(_, current)| *current <= binding_generation)
        {
            self.bindings.remove(&logical);
        }
    }

    pub fn submit(
        &mut self,
        command: UiCommand,
        now_millis: u64,
    ) -> Result<RendererCommandAdmission, RendererCommandError> {
        self.validate_identity(&command)?;
        if command.command_id <= self.last_sequence {
            return Err(RendererCommandError::Sequence);
        }
        self.last_sequence = command.command_id;
        if command.deadline_millis <= now_millis {
            return Ok(RendererCommandAdmission::Terminal(result(
                &command,
                UiCommandOutcome::DeadlineExpired,
            )));
        }
        if command.min_applied_revision
            > self
                .applied_revision
                .saturating_add(self.config.max_future_revision_window)
        {
            return Ok(RendererCommandAdmission::Terminal(result(
                &command,
                UiCommandOutcome::FutureRevision,
            )));
        }
        if command.min_applied_revision <= self.applied_revision {
            return Ok(self.ready_or_stale(command));
        }
        if self.staged.len() == self.config.max_staged {
            return Err(RendererCommandError::Capacity);
        }
        self.order.push_back(command.command_id);
        self.staged.insert(command.command_id, command);
        Ok(RendererCommandAdmission::Staged)
    }

    pub fn apply_revision(
        &mut self,
        revision: u64,
        now_millis: u64,
    ) -> Result<Vec<RendererCommandAdmission>, RendererCommandError> {
        if revision < self.applied_revision {
            return Err(RendererCommandError::RevisionReversed);
        }
        self.applied_revision = revision;
        let mut ready = Vec::new();
        let mut pending = VecDeque::new();
        while let Some(command_id) = self.order.pop_front() {
            let command = self
                .staged
                .get(&command_id)
                .expect("staged order references a command");
            if command.deadline_millis <= now_millis {
                let command = self.staged.remove(&command_id).unwrap();
                ready.push(RendererCommandAdmission::Terminal(result(
                    &command,
                    UiCommandOutcome::DeadlineExpired,
                )));
            } else if command.min_applied_revision <= revision {
                let command = self.staged.remove(&command_id).unwrap();
                ready.push(self.ready_or_stale(command));
            } else {
                pending.push_back(command_id);
            }
        }
        self.order = pending;
        Ok(ready)
    }

    pub fn next_deadline_millis(&self) -> Option<u64> {
        self.staged
            .values()
            .map(|pending| pending.deadline_millis)
            .min()
    }

    pub fn expire(&mut self, now_millis: u64) -> Vec<RendererCommandAdmission> {
        let mut terminal = Vec::new();
        let mut pending = VecDeque::new();
        while let Some(command_id) = self.order.pop_front() {
            let Some(command) = self.staged.get(&command_id) else {
                continue;
            };
            if command.deadline_millis <= now_millis {
                let command = self
                    .staged
                    .remove(&command_id)
                    .expect("staged command disappeared during expiry");
                terminal.push(RendererCommandAdmission::Terminal(result(
                    &command,
                    UiCommandOutcome::DeadlineExpired,
                )));
            } else {
                pending.push_back(command_id);
            }
        }
        self.order = pending;
        terminal
    }

    pub fn restart(
        &mut self,
        ui_root_epoch: u32,
        app_code_epoch: u64,
    ) -> Result<Vec<UiCommandResult>, RendererCommandError> {
        if ui_root_epoch <= self.ui_root_epoch || app_code_epoch < self.app_code_epoch {
            return Err(RendererCommandError::StaleRootEpoch);
        }
        let terminal = self
            .staged
            .values()
            .map(|command| result(command, UiCommandOutcome::DroppedBeforeDispatch))
            .collect();
        self.staged.clear();
        self.order.clear();
        self.bindings.clear();
        self.applied_revision = 0;
        self.last_sequence = 0;
        self.ui_root_epoch = ui_root_epoch;
        self.app_code_epoch = app_code_epoch;
        Ok(terminal)
    }

    fn validate_identity(&self, command: &UiCommand) -> Result<(), RendererCommandError> {
        if command.root != self.root {
            return Err(RendererCommandError::WrongRoot);
        }
        if command.ui_root_epoch != self.ui_root_epoch {
            return Err(RendererCommandError::StaleRootEpoch);
        }
        if command.app_code_epoch != self.app_code_epoch {
            return Err(RendererCommandError::StaleAppCodeEpoch);
        }
        Ok(())
    }

    fn ready_or_stale(&self, command: UiCommand) -> RendererCommandAdmission {
        if self.bindings.get(&command.target)
            != Some(&(command.target_node, command.expected_binding_generation))
        {
            RendererCommandAdmission::Terminal(result(&command, UiCommandOutcome::StaleBinding))
        } else {
            RendererCommandAdmission::Ready(command)
        }
    }
}

fn result(command: &UiCommand, outcome: UiCommandOutcome) -> UiCommandResult {
    UiCommandResult {
        command_id: command.command_id,
        root: command.root,
        outcome,
    }
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

    fn queue() -> UiCommandQueue {
        UiCommandQueue::new(CommandQueueConfig {
            max_pending: 2,
            max_payload_bytes: 4,
            max_kind_bytes: 8,
        })
        .unwrap()
    }

    #[test]
    fn command_is_dispatched_and_completed_exactly_once() {
        let mut queue = queue();
        let command_id = queue
            .begin(
                handle(1),
                2,
                3,
                handle(4),
                handle(5),
                1,
                0,
                u64::MAX,
                "focus".to_owned(),
                vec![1],
            )
            .unwrap();
        assert_eq!(queue.poll().unwrap().command_id, command_id);
        assert!(queue.poll().is_none());
        assert_eq!(
            queue
                .complete(command_id, handle(1), 2, 3, UiCommandOutcome::Executed)
                .unwrap()
                .outcome,
            UiCommandOutcome::Executed
        );
        assert_eq!(
            queue.complete(command_id, handle(1), 2, 3, UiCommandOutcome::Executed),
            Err(CommandQueueError::UnknownCommand)
        );
    }

    #[test]
    fn restart_reports_dropped_and_outcome_unknown_honestly() {
        let mut queue = queue();
        let dispatched = queue
            .begin(
                handle(1),
                1,
                1,
                handle(2),
                handle(4),
                1,
                0,
                u64::MAX,
                "focus".to_owned(),
                vec![1],
            )
            .unwrap();
        let queued = queue
            .begin(
                handle(1),
                1,
                1,
                handle(3),
                handle(5),
                1,
                0,
                u64::MAX,
                "scroll".to_owned(),
                vec![2],
            )
            .unwrap();
        queue.poll().unwrap();
        assert_eq!(
            queue.restart_root(handle(1)),
            vec![
                UiCommandResult {
                    command_id: dispatched,
                    root: handle(1),
                    outcome: UiCommandOutcome::OutcomeUnknownOnRendererRestart,
                },
                UiCommandResult {
                    command_id: queued,
                    root: handle(1),
                    outcome: UiCommandOutcome::DroppedBeforeDispatch,
                },
            ]
        );
        assert_eq!(queue.pending_count(), 0);
        assert_eq!(queue.pending_bytes(), 0);
    }

    #[test]
    fn identity_and_byte_quotas_fail_before_allocation() {
        let mut queue = queue();
        assert_eq!(
            queue.begin(
                handle(1),
                1,
                1,
                handle(2),
                handle(3),
                1,
                0,
                u64::MAX,
                "focus".to_owned(),
                vec![0; 5],
            ),
            Err(CommandQueueError::PayloadCapacity)
        );
        let command_id = queue
            .begin(
                handle(1),
                1,
                1,
                handle(2),
                handle(3),
                1,
                0,
                u64::MAX,
                "focus".to_owned(),
                vec![1],
            )
            .unwrap();
        assert_eq!(
            queue.complete(command_id, handle(9), 1, 1, UiCommandOutcome::Executed),
            Err(CommandQueueError::IdentityMismatch)
        );
        assert_eq!(queue.pending_count(), 1);
    }
}
