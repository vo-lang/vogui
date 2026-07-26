use std::collections::VecDeque;

use crate::{async_runtime::EffectCompletion, UiReturn};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ReloadConfig {
    pub max_hold_items: usize,
    pub max_hold_bytes: usize,
    pub max_snapshot_bytes: usize,
}

impl Default for ReloadConfig {
    fn default() -> Self {
        Self {
            max_hold_items: 4096,
            max_hold_bytes: 4 * 1024 * 1024,
            max_snapshot_bytes: 16 * 1024 * 1024,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveReloadEffect {
    pub effect_id: u64,
    pub kind: String,
    pub transferable: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReloadBlocker {
    pub effect_id: u64,
    pub kind: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum HeldPayload {
    Message(Vec<u8>),
    Return(UiReturn),
    EffectCompletion(EffectCompletion),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HeldItem {
    pub sequence: u64,
    pub app_code_epoch: u64,
    pub payload: HeldPayload,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReloadHoldOutcome {
    Held,
    RolledBack {
        held: Vec<HeldItem>,
        rejected: HeldItem,
        reason: ReloadError,
    },
}

impl HeldItem {
    pub fn byte_len(&self) -> usize {
        match &self.payload {
            HeldPayload::Message(bytes) => bytes.len(),
            HeldPayload::Return(item) => ui_return_bytes(item),
            HeldPayload::EffectCompletion(completion) => match &completion.outcome {
                crate::async_runtime::EffectOutcome::Completed(bytes)
                | crate::async_runtime::EffectOutcome::Failed(bytes) => 32 + bytes.len(),
                crate::async_runtime::EffectOutcome::Cancelled
                | crate::async_runtime::EffectOutcome::TimedOut => 32,
            },
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DriverSchema {
    pub app_build_id: [u8; 32],
    pub model_fingerprint: [u8; 32],
    pub message_fingerprint: [u8; 32],
    pub transitive_abi_fingerprint: [u8; 32],
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReloadCandidate {
    pub schema: DriverSchema,
    pub neutral_snapshot: Vec<u8>,
    pub root_count: usize,
    pub subscription_count: usize,
    pub widget_binding_count: usize,
    pub resource_lease_count: usize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReloadCommit {
    pub old_app_code_epoch: u64,
    pub new_app_code_epoch: u64,
    pub barrier_sequence: u64,
    pub candidate: ReloadCandidate,
    pub retired_old_epoch_effects: Vec<u64>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ReloadPhase {
    Idle,
    Holding,
    CandidateReady,
    AwaitingSnapshotAck,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReloadError {
    InvalidConfig,
    InvalidEpoch,
    InvalidDeadline,
    Busy(ReloadBlocker),
    WrongPhase,
    Sequence,
    StaleEpoch,
    HoldCapacity,
    SnapshotCapacity,
    DeadlineExpired,
    CandidateRejected,
    EpochExhausted,
    SnapshotAckMismatch,
    Closed,
}

#[derive(Debug)]
struct ActiveReload {
    old_epoch: u64,
    barrier_sequence: u64,
    preflight_started_millis: u64,
    deadline_millis: u64,
    snapshot_ack_deadline_millis: Option<u64>,
    held_bytes: usize,
    held: VecDeque<HeldItem>,
    transferable_effects: Vec<u64>,
    candidate: Option<ReloadCandidate>,
    committed_epoch: Option<u64>,
}

pub struct ReloadCoordinator {
    config: ReloadConfig,
    active: Option<ActiveReload>,
    closed: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ReloadInstrumentation {
    pub phase: ReloadPhase,
    pub held_items: usize,
    pub held_bytes: usize,
    pub candidate_ready: bool,
    pub closed: bool,
}

impl Default for ReloadInstrumentation {
    fn default() -> Self {
        Self {
            phase: ReloadPhase::Idle,
            held_items: 0,
            held_bytes: 0,
            candidate_ready: false,
            closed: false,
        }
    }
}

impl ReloadCoordinator {
    pub fn new(config: ReloadConfig) -> Result<Self, ReloadError> {
        if config.max_hold_items == 0
            || config.max_hold_bytes == 0
            || config.max_snapshot_bytes == 0
        {
            return Err(ReloadError::InvalidConfig);
        }
        Ok(Self {
            config,
            active: None,
            closed: false,
        })
    }

    pub fn phase(&self) -> ReloadPhase {
        match &self.active {
            None => ReloadPhase::Idle,
            Some(active) if active.committed_epoch.is_some() => ReloadPhase::AwaitingSnapshotAck,
            Some(active) if active.candidate.is_some() => ReloadPhase::CandidateReady,
            Some(_) => ReloadPhase::Holding,
        }
    }

    pub fn instrumentation(&self) -> ReloadInstrumentation {
        ReloadInstrumentation {
            phase: self.phase(),
            held_items: self.active.as_ref().map_or(0, |active| active.held.len()),
            held_bytes: self.active.as_ref().map_or(0, |active| active.held_bytes),
            candidate_ready: self
                .active
                .as_ref()
                .is_some_and(|active| active.candidate.is_some()),
            closed: self.closed,
        }
    }

    pub fn shutdown(&mut self) -> Vec<HeldItem> {
        let held = self
            .active
            .take()
            .map(|active| active.held.into_iter().collect())
            .unwrap_or_default();
        self.closed = true;
        held
    }

    pub fn active_epoch(&self) -> Option<u64> {
        self.active.as_ref().map(|active| active.old_epoch)
    }

    pub fn next_precommit_deadline_millis(&self) -> Option<u64> {
        self.active
            .as_ref()
            .filter(|active| active.committed_epoch.is_none())
            .map(|active| active.deadline_millis)
    }

    pub fn next_snapshot_ack_deadline_millis(&self) -> Option<u64> {
        self.active
            .as_ref()
            .and_then(|active| active.snapshot_ack_deadline_millis)
    }

    pub fn expire_precommit(&mut self, now_millis: u64) -> Option<Vec<HeldItem>> {
        let expired = self.active.as_ref().is_some_and(|active| {
            active.committed_epoch.is_none() && now_millis >= active.deadline_millis
        });
        if !expired {
            return None;
        }
        let active = self.active.take().expect("expired reload disappeared");
        Some(active.held.into_iter().collect())
    }

    pub fn begin(
        &mut self,
        app_code_epoch: u64,
        barrier_sequence: u64,
        now_millis: u64,
        deadline_millis: u64,
        effects: &[ActiveReloadEffect],
    ) -> Result<(), ReloadError> {
        if self.closed {
            return Err(ReloadError::Closed);
        }
        if self.active.is_some() {
            return Err(ReloadError::WrongPhase);
        }
        if app_code_epoch == 0 {
            return Err(ReloadError::InvalidEpoch);
        }
        if deadline_millis <= now_millis {
            return Err(ReloadError::InvalidDeadline);
        }
        if let Some(effect) = effects.iter().find(|effect| !effect.transferable) {
            return Err(ReloadError::Busy(ReloadBlocker {
                effect_id: effect.effect_id,
                kind: effect.kind.clone(),
            }));
        }
        self.active = Some(ActiveReload {
            old_epoch: app_code_epoch,
            barrier_sequence,
            preflight_started_millis: now_millis,
            deadline_millis,
            snapshot_ack_deadline_millis: None,
            held_bytes: 0,
            held: VecDeque::new(),
            transferable_effects: effects.iter().map(|effect| effect.effect_id).collect(),
            candidate: None,
            committed_epoch: None,
        });
        Ok(())
    }

    pub fn hold(&mut self, item: HeldItem, now_millis: u64) -> Result<(), ReloadError> {
        let held_bytes = self.preflight_hold(&item, now_millis)?;
        let active = self.active.as_mut().ok_or(ReloadError::WrongPhase)?;
        active.held.push_back(item);
        active.held_bytes = held_bytes;
        Ok(())
    }

    pub fn hold_or_rollback(
        &mut self,
        item: HeldItem,
        now_millis: u64,
    ) -> Result<ReloadHoldOutcome, ReloadError> {
        match self.preflight_hold(&item, now_millis) {
            Ok(held_bytes) => {
                let active = self.active.as_mut().ok_or(ReloadError::WrongPhase)?;
                active.held.push_back(item);
                active.held_bytes = held_bytes;
                Ok(ReloadHoldOutcome::Held)
            }
            Err(reason @ (ReloadError::HoldCapacity | ReloadError::DeadlineExpired)) => {
                let active = self.active.take().ok_or(ReloadError::WrongPhase)?;
                if active.committed_epoch.is_some() {
                    self.active = Some(active);
                    return Err(ReloadError::WrongPhase);
                }
                Ok(ReloadHoldOutcome::RolledBack {
                    held: active.held.into_iter().collect(),
                    rejected: item,
                    reason,
                })
            }
            Err(error) => Err(error),
        }
    }

    pub fn preflight_hold(&self, item: &HeldItem, now_millis: u64) -> Result<usize, ReloadError> {
        if self.closed {
            return Err(ReloadError::Closed);
        }
        let active = self.active.as_ref().ok_or(ReloadError::WrongPhase)?;
        if active.committed_epoch.is_some() {
            return Err(ReloadError::WrongPhase);
        }
        if now_millis >= active.deadline_millis {
            return Err(ReloadError::DeadlineExpired);
        }
        if item.app_code_epoch != active.old_epoch {
            return Err(ReloadError::StaleEpoch);
        }
        let minimum_sequence = active
            .held
            .back()
            .map_or(active.barrier_sequence, |held| held.sequence);
        if item.sequence <= minimum_sequence {
            return Err(ReloadError::Sequence);
        }
        let held_bytes = active
            .held_bytes
            .checked_add(item.byte_len())
            .ok_or(ReloadError::HoldCapacity)?;
        if active.held.len() == self.config.max_hold_items
            || held_bytes > self.config.max_hold_bytes
        {
            return Err(ReloadError::HoldCapacity);
        }
        Ok(held_bytes)
    }

    pub fn install_candidate(
        &mut self,
        candidate: ReloadCandidate,
        now_millis: u64,
    ) -> Result<(), ReloadError> {
        let active = self.active.as_mut().ok_or(ReloadError::WrongPhase)?;
        if active.candidate.is_some() || active.committed_epoch.is_some() {
            return Err(ReloadError::WrongPhase);
        }
        if now_millis >= active.deadline_millis {
            return Err(ReloadError::DeadlineExpired);
        }
        if candidate.neutral_snapshot.len() > self.config.max_snapshot_bytes {
            return Err(ReloadError::SnapshotCapacity);
        }
        active.candidate = Some(candidate);
        Ok(())
    }

    pub fn commit(&mut self, now_millis: u64) -> Result<ReloadCommit, ReloadError> {
        let active = self.active.as_mut().ok_or(ReloadError::WrongPhase)?;
        if active.committed_epoch.is_some() {
            return Err(ReloadError::WrongPhase);
        }
        if now_millis >= active.deadline_millis {
            return Err(ReloadError::DeadlineExpired);
        }
        let candidate = active.candidate.clone().ok_or(ReloadError::WrongPhase)?;
        let new_epoch = active
            .old_epoch
            .checked_add(1)
            .ok_or(ReloadError::EpochExhausted)?;
        let ack_window = active
            .deadline_millis
            .saturating_sub(active.preflight_started_millis);
        active.snapshot_ack_deadline_millis = Some(now_millis.saturating_add(ack_window));
        active.committed_epoch = Some(new_epoch);
        Ok(ReloadCommit {
            old_app_code_epoch: active.old_epoch,
            new_app_code_epoch: new_epoch,
            barrier_sequence: active.barrier_sequence,
            candidate,
            retired_old_epoch_effects: active.transferable_effects.clone(),
        })
    }

    pub fn abort(&mut self) -> Result<Vec<HeldItem>, ReloadError> {
        let active = self.active.take().ok_or(ReloadError::WrongPhase)?;
        if active.committed_epoch.is_some() {
            self.active = Some(active);
            return Err(ReloadError::WrongPhase);
        }
        Ok(active.held.into_iter().collect())
    }

    pub fn snapshot_ack(&mut self, app_code_epoch: u64) -> Result<Vec<HeldItem>, ReloadError> {
        let active = self.active.take().ok_or(ReloadError::WrongPhase)?;
        if active.committed_epoch != Some(app_code_epoch) {
            self.active = Some(active);
            return Err(ReloadError::SnapshotAckMismatch);
        }
        Ok(active.held.into_iter().collect())
    }

    pub fn expire_snapshot_ack(&mut self, now_millis: u64) -> Option<(u64, Vec<HeldItem>)> {
        let expired = self.active.as_ref().is_some_and(|active| {
            active
                .snapshot_ack_deadline_millis
                .is_some_and(|deadline| now_millis >= deadline)
        });
        if !expired {
            return None;
        }
        let active = self
            .active
            .take()
            .expect("expired snapshot acknowledgement disappeared");
        Some((
            active
                .committed_epoch
                .expect("snapshot acknowledgement deadline requires a committed epoch"),
            active.held.into_iter().collect(),
        ))
    }
}

fn ui_return_bytes(item: &UiReturn) -> usize {
    match item {
        UiReturn::ApplyAck { .. } => 48,
        UiReturn::Event { payload, .. } => 64 + payload.len(),
        UiReturn::CommandResult { .. } => 64,
    }
}

impl Default for ReloadCoordinator {
    fn default() -> Self {
        Self::new(ReloadConfig::default()).expect("default reload config is valid")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn candidate() -> ReloadCandidate {
        ReloadCandidate {
            schema: DriverSchema {
                app_build_id: [1; 32],
                model_fingerprint: [2; 32],
                message_fingerprint: [3; 32],
                transitive_abi_fingerprint: [4; 32],
            },
            neutral_snapshot: vec![7, 8],
            root_count: 1,
            subscription_count: 2,
            widget_binding_count: 3,
            resource_lease_count: 4,
        }
    }

    fn held(sequence: u64) -> HeldItem {
        HeldItem {
            sequence,
            app_code_epoch: 7,
            payload: HeldPayload::Message(vec![sequence as u8]),
        }
    }

    #[test]
    fn abort_replays_held_items_in_sequence_and_leaves_old_epoch_active() {
        let mut reload = ReloadCoordinator::default();
        reload.begin(7, 10, 100, 200, &[]).unwrap();
        reload.hold(held(11), 110).unwrap();
        reload.hold(held(12), 120).unwrap();
        assert_eq!(reload.phase(), ReloadPhase::Holding);

        let replay = reload.abort().unwrap();
        assert_eq!(
            replay.iter().map(|item| item.sequence).collect::<Vec<_>>(),
            vec![11, 12]
        );
        assert_eq!(reload.phase(), ReloadPhase::Idle);
    }

    #[test]
    fn commit_requires_candidate_and_matching_snapshot_ack_before_release() {
        let effects = [ActiveReloadEffect {
            effect_id: 9,
            kind: "timer".to_owned(),
            transferable: true,
        }];
        let mut reload = ReloadCoordinator::default();
        reload.begin(7, 10, 100, 200, &effects).unwrap();
        reload.hold(held(11), 110).unwrap();
        assert_eq!(reload.commit(120), Err(ReloadError::WrongPhase));
        reload.install_candidate(candidate(), 130).unwrap();

        let commit = reload.commit(140).unwrap();
        assert_eq!(commit.new_app_code_epoch, 8);
        assert_eq!(commit.retired_old_epoch_effects, vec![9]);
        assert_eq!(reload.phase(), ReloadPhase::AwaitingSnapshotAck);
        assert_eq!(
            reload.snapshot_ack(7),
            Err(ReloadError::SnapshotAckMismatch)
        );
        assert_eq!(reload.snapshot_ack(8).unwrap()[0].sequence, 11);
        assert_eq!(reload.phase(), ReloadPhase::Idle);
    }

    #[test]
    fn nontransferable_effect_blocks_reload_before_hold_state_exists() {
        let blocker = ActiveReloadEffect {
            effect_id: 5,
            kind: "native-dialog".to_owned(),
            transferable: false,
        };
        assert_eq!(
            ReloadCoordinator::default().begin(7, 10, 100, 200, &[blocker]),
            Err(ReloadError::Busy(ReloadBlocker {
                effect_id: 5,
                kind: "native-dialog".to_owned(),
            }))
        );
    }
}
