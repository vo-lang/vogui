use std::collections::{BTreeMap, BTreeSet, VecDeque};

use vogui_protocol::v2::{Handle, UiRootId};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum EffectExecutor {
    UiCommand,
    PlatformRequest,
    TaskRegistry,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum EffectScope {
    App,
    UiRoot(UiRootId),
    Scope {
        root: UiRootId,
        path_hash: u64,
        generation: u32,
    },
    Node {
        root: UiRootId,
        logical_ref: Handle,
        binding_generation: u32,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EffectRouteBinding {
    pub kind: String,
    pub executor: EffectExecutor,
    pub max_payload_bytes: usize,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum SubscriptionOwner {
    App,
    UiRoot(UiRootId),
    Scope {
        root: UiRootId,
        path_hash: u64,
        generation: u32,
    },
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct AsyncConfig {
    pub max_effects: usize,
    pub max_effect_payload_bytes: usize,
    pub max_completions: usize,
    pub max_completion_bytes: usize,
    pub max_subscriptions: usize,
    pub max_subscription_bytes: usize,
    pub max_label_bytes: usize,
}

impl Default for AsyncConfig {
    fn default() -> Self {
        Self {
            max_effects: 1024,
            max_effect_payload_bytes: 1024 * 1024,
            max_completions: 1024,
            max_completion_bytes: 1024 * 1024,
            max_subscriptions: 1024,
            max_subscription_bytes: 1024 * 1024,
            max_label_bytes: 256,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EffectRequest {
    pub effect_id: u64,
    pub app_code_epoch: u64,
    pub kind: String,
    pub executor: EffectExecutor,
    pub scope: EffectScope,
    pub deadline_millis: u64,
    pub payload: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EffectOutcome {
    Completed(Vec<u8>),
    Failed(Vec<u8>),
    Cancelled,
    TimedOut,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EffectCompletion {
    pub effect_id: u64,
    pub app_code_epoch: u64,
    pub outcome: EffectOutcome,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SubscriptionSpec {
    pub owner: SubscriptionOwner,
    pub key: String,
    pub kind: String,
    pub payload: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SubscriptionChange {
    Start {
        handle: Handle,
        spec: SubscriptionSpec,
    },
    Stop {
        handle: Handle,
    },
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct AsyncReset {
    pub effect_completions: Vec<EffectCompletion>,
    pub subscription_changes: Vec<SubscriptionChange>,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct AsyncInstrumentation {
    pub pending_effects: usize,
    pub pending_effect_bytes: usize,
    pub completions: usize,
    pub completion_bytes: usize,
    pub subscriptions: usize,
    pub subscription_bytes: usize,
    pub closed: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AsyncError {
    InvalidConfig,
    InvalidEpoch,
    InvalidKind,
    EffectCapacity,
    EffectPayloadCapacity,
    EffectIdExhausted,
    UnknownEffect,
    EffectAlreadyDispatched,
    EffectNotDispatched,
    StaleAppCodeEpoch,
    CompletionCapacity,
    DuplicateSubscriptionKey,
    SubscriptionCapacity,
    SubscriptionPayloadCapacity,
    GenerationExhausted,
    Closed,
}

#[derive(Debug)]
struct PendingEffect {
    request: EffectRequest,
    dispatched: bool,
    transferable_across_reload: bool,
}

#[derive(Debug)]
struct SubscriptionSlot {
    generation: u32,
    spec: Option<SubscriptionSpec>,
}

pub struct AsyncRegistry {
    config: AsyncConfig,
    next_effect_id: u64,
    pending_effect_bytes: usize,
    pending_effects: BTreeMap<u64, PendingEffect>,
    effect_order: VecDeque<u64>,
    completion_bytes: usize,
    completions: VecDeque<EffectCompletion>,
    subscriptions: BTreeMap<(SubscriptionOwner, String), Handle>,
    subscription_slots: Vec<SubscriptionSlot>,
    subscription_free: Vec<u32>,
    subscription_bytes: usize,
    closed: bool,
}

impl AsyncRegistry {
    pub fn new(config: AsyncConfig) -> Result<Self, AsyncError> {
        if config.max_effects == 0
            || config.max_effect_payload_bytes == 0
            || config.max_completions == 0
            || config.max_completion_bytes == 0
            || config.max_subscriptions == 0
            || config.max_subscriptions > u32::MAX as usize
            || config.max_subscription_bytes == 0
            || config.max_label_bytes == 0
        {
            return Err(AsyncError::InvalidConfig);
        }
        Ok(Self {
            config,
            next_effect_id: 1,
            pending_effect_bytes: 0,
            pending_effects: BTreeMap::new(),
            effect_order: VecDeque::new(),
            completion_bytes: 0,
            completions: VecDeque::new(),
            subscriptions: BTreeMap::new(),
            subscription_slots: Vec::new(),
            subscription_free: Vec::new(),
            subscription_bytes: 0,
            closed: false,
        })
    }

    pub fn begin_effect(
        &mut self,
        app_code_epoch: u64,
        kind: String,
        payload: Vec<u8>,
    ) -> Result<u64, AsyncError> {
        self.begin_effect_routed(
            app_code_epoch,
            kind,
            EffectExecutor::TaskRegistry,
            EffectScope::App,
            u64::MAX,
            payload,
            false,
        )
    }

    pub fn begin_effect_with_reload_policy(
        &mut self,
        app_code_epoch: u64,
        kind: String,
        payload: Vec<u8>,
        transferable_across_reload: bool,
    ) -> Result<u64, AsyncError> {
        self.begin_effect_routed(
            app_code_epoch,
            kind,
            EffectExecutor::TaskRegistry,
            EffectScope::App,
            u64::MAX,
            payload,
            transferable_across_reload,
        )
    }

    pub fn begin_effect_routed(
        &mut self,
        app_code_epoch: u64,
        kind: String,
        executor: EffectExecutor,
        scope: EffectScope,
        deadline_millis: u64,
        payload: Vec<u8>,
        transferable_across_reload: bool,
    ) -> Result<u64, AsyncError> {
        self.ensure_open()?;
        if app_code_epoch == 0 || deadline_millis == 0 || !valid_effect_scope(scope) {
            return Err(AsyncError::InvalidEpoch);
        }
        if kind.is_empty() || kind.len() > self.config.max_label_bytes {
            return Err(AsyncError::InvalidKind);
        }
        if self.pending_effects.len() == self.config.max_effects {
            return Err(AsyncError::EffectCapacity);
        }
        let next_bytes = self
            .pending_effect_bytes
            .checked_add(payload.len())
            .ok_or(AsyncError::EffectPayloadCapacity)?;
        if next_bytes > self.config.max_effect_payload_bytes {
            return Err(AsyncError::EffectPayloadCapacity);
        }
        let effect_id = self.next_effect_id;
        let next_effect_id = effect_id
            .checked_add(1)
            .ok_or(AsyncError::EffectIdExhausted)?;
        let request = EffectRequest {
            effect_id,
            app_code_epoch,
            kind,
            executor,
            scope,
            deadline_millis,
            payload,
        };
        self.pending_effects.insert(
            effect_id,
            PendingEffect {
                request,
                dispatched: false,
                transferable_across_reload,
            },
        );
        self.effect_order.push_back(effect_id);
        self.pending_effect_bytes = next_bytes;
        self.next_effect_id = next_effect_id;
        Ok(effect_id)
    }

    pub fn poll_effect(&mut self) -> Option<EffectRequest> {
        while let Some(effect_id) = self.effect_order.pop_front() {
            let Some(pending) = self.pending_effects.get_mut(&effect_id) else {
                continue;
            };
            if pending.dispatched {
                continue;
            }
            pending.dispatched = true;
            return Some(pending.request.clone());
        }
        None
    }

    pub fn preflight_effect_batch(
        &self,
        app_code_epoch: u64,
        effects: &[(String, usize)],
    ) -> Result<(), AsyncError> {
        if app_code_epoch == 0 {
            return Err(AsyncError::InvalidEpoch);
        }
        if self.pending_effects.len().saturating_add(effects.len()) > self.config.max_effects {
            return Err(AsyncError::EffectCapacity);
        }
        let mut bytes = self.pending_effect_bytes;
        for (kind, payload_bytes) in effects {
            if kind.is_empty() || kind.len() > self.config.max_label_bytes {
                return Err(AsyncError::InvalidKind);
            }
            bytes = bytes
                .checked_add(*payload_bytes)
                .ok_or(AsyncError::EffectPayloadCapacity)?;
        }
        if bytes > self.config.max_effect_payload_bytes {
            return Err(AsyncError::EffectPayloadCapacity);
        }
        self.next_effect_id
            .checked_add(effects.len() as u64)
            .ok_or(AsyncError::EffectIdExhausted)?;
        Ok(())
    }

    pub fn begin_effect_batch(
        &mut self,
        app_code_epoch: u64,
        effects: Vec<(String, EffectExecutor, EffectScope, u64, Vec<u8>, bool)>,
    ) -> Result<Vec<u64>, AsyncError> {
        let preflight = effects
            .iter()
            .map(|(kind, _, _, _, payload, _)| (kind.clone(), payload.len()))
            .collect::<Vec<_>>();
        self.preflight_effect_batch(app_code_epoch, &preflight)?;
        let mut ids = Vec::with_capacity(effects.len());
        for (kind, executor, scope, deadline_millis, payload, transferable) in effects {
            let id = self.begin_effect_routed(
                app_code_epoch,
                kind,
                executor,
                scope,
                deadline_millis,
                payload,
                transferable,
            )?;
            ids.push(id);
        }
        Ok(ids)
    }

    pub fn complete_effect(
        &mut self,
        effect_id: u64,
        app_code_epoch: u64,
        outcome: EffectOutcome,
    ) -> Result<(), AsyncError> {
        let pending = self
            .pending_effects
            .get(&effect_id)
            .ok_or(AsyncError::UnknownEffect)?;
        if pending.request.app_code_epoch != app_code_epoch {
            return Err(AsyncError::StaleAppCodeEpoch);
        }
        if !pending.dispatched {
            return Err(AsyncError::EffectNotDispatched);
        }
        let outcome_bytes = outcome_bytes(&outcome);
        let next_completion_bytes = self
            .completion_bytes
            .checked_add(outcome_bytes)
            .ok_or(AsyncError::CompletionCapacity)?;
        if self.completions.len() == self.config.max_completions
            || next_completion_bytes > self.config.max_completion_bytes
        {
            return Err(AsyncError::CompletionCapacity);
        }
        let pending = self.pending_effects.remove(&effect_id).unwrap();
        self.pending_effect_bytes -= pending.request.payload.len();
        self.completions.push_back(EffectCompletion {
            effect_id,
            app_code_epoch,
            outcome,
        });
        self.completion_bytes = next_completion_bytes;
        Ok(())
    }

    pub fn cancel_effect(&mut self, effect_id: u64) -> Result<(), AsyncError> {
        let pending = self
            .pending_effects
            .get(&effect_id)
            .ok_or(AsyncError::UnknownEffect)?;
        if pending.dispatched {
            return Err(AsyncError::EffectAlreadyDispatched);
        }
        if self.completions.len() == self.config.max_completions {
            return Err(AsyncError::CompletionCapacity);
        }
        let pending = self.pending_effects.remove(&effect_id).unwrap();
        self.effect_order.retain(|queued| *queued != effect_id);
        self.pending_effect_bytes -= pending.request.payload.len();
        self.completions.push_back(EffectCompletion {
            effect_id,
            app_code_epoch: pending.request.app_code_epoch,
            outcome: EffectOutcome::Cancelled,
        });
        Ok(())
    }

    pub fn drain_completions(&mut self) -> Vec<EffectCompletion> {
        self.completion_bytes = 0;
        self.completions.drain(..).collect()
    }

    pub fn restore_completions(
        &mut self,
        completions: Vec<EffectCompletion>,
    ) -> Result<(), AsyncError> {
        let restored_bytes = completions.iter().try_fold(0_usize, |total, completion| {
            total
                .checked_add(outcome_bytes(&completion.outcome))
                .ok_or(AsyncError::CompletionCapacity)
        })?;
        let next_len = self
            .completions
            .len()
            .checked_add(completions.len())
            .ok_or(AsyncError::CompletionCapacity)?;
        let next_bytes = self
            .completion_bytes
            .checked_add(restored_bytes)
            .ok_or(AsyncError::CompletionCapacity)?;
        if next_len > self.config.max_completions || next_bytes > self.config.max_completion_bytes {
            return Err(AsyncError::CompletionCapacity);
        }
        let mut identities = self
            .completions
            .iter()
            .map(|completion| completion.effect_id)
            .collect::<BTreeSet<_>>();
        if completions
            .iter()
            .any(|completion| !identities.insert(completion.effect_id))
        {
            return Err(AsyncError::UnknownEffect);
        }
        self.completions.extend(completions);
        self.completion_bytes = next_bytes;
        Ok(())
    }

    pub fn take_completion(&mut self, effect_id: u64) -> Option<EffectCompletion> {
        let index = self
            .completions
            .iter()
            .position(|completion| completion.effect_id == effect_id)?;
        let completion = self.completions.remove(index)?;
        self.completion_bytes -= outcome_bytes(&completion.outcome);
        Some(completion)
    }

    pub fn expire_effects(&mut self, now_millis: u64) -> Result<Vec<u64>, AsyncError> {
        let expired = self
            .pending_effects
            .values()
            .filter(|pending| pending.request.deadline_millis <= now_millis)
            .map(|pending| pending.request.effect_id)
            .collect::<Vec<_>>();
        if self.completions.len().saturating_add(expired.len()) > self.config.max_completions {
            return Err(AsyncError::CompletionCapacity);
        }
        for effect_id in &expired {
            let pending = self
                .pending_effects
                .remove(effect_id)
                .expect("expired effect was collected from the same serial registry");
            self.pending_effect_bytes -= pending.request.payload.len();
            self.completions.push_back(EffectCompletion {
                effect_id: *effect_id,
                app_code_epoch: pending.request.app_code_epoch,
                outcome: EffectOutcome::TimedOut,
            });
        }
        Ok(expired)
    }

    pub fn cancel_effect_scopes(
        &mut self,
        scopes: &BTreeSet<EffectScope>,
    ) -> Result<Vec<u64>, AsyncError> {
        let cancelled = self.preflight_cancel_effect_scopes(scopes)?;
        for effect_id in &cancelled {
            let pending = self
                .pending_effects
                .remove(effect_id)
                .expect("cancelled effect was collected from the same serial registry");
            self.pending_effect_bytes -= pending.request.payload.len();
            self.completions.push_back(EffectCompletion {
                effect_id: *effect_id,
                app_code_epoch: pending.request.app_code_epoch,
                outcome: EffectOutcome::Cancelled,
            });
        }
        Ok(cancelled)
    }

    pub fn preflight_cancel_effect_scopes(
        &self,
        scopes: &BTreeSet<EffectScope>,
    ) -> Result<Vec<u64>, AsyncError> {
        let cancelled = self
            .pending_effects
            .values()
            .filter(|pending| scopes.contains(&pending.request.scope))
            .map(|pending| pending.request.effect_id)
            .collect::<Vec<_>>();
        if self.completions.len().saturating_add(cancelled.len()) > self.config.max_completions {
            return Err(AsyncError::CompletionCapacity);
        }
        Ok(cancelled)
    }

    pub fn effect_scopes_for_root(&self, root: UiRootId) -> BTreeSet<EffectScope> {
        self.pending_effects
            .values()
            .filter_map(|pending| match pending.request.scope {
                EffectScope::UiRoot(owner_root) if owner_root == root => {
                    Some(pending.request.scope)
                }
                EffectScope::Scope {
                    root: owner_root, ..
                }
                | EffectScope::Node {
                    root: owner_root, ..
                } if owner_root == root => Some(pending.request.scope),
                _ => None,
            })
            .collect()
    }

    pub fn reconcile_subscriptions(
        &mut self,
        desired: Vec<SubscriptionSpec>,
    ) -> Result<Vec<SubscriptionChange>, AsyncError> {
        let desired_bytes = self.preflight_subscriptions(&desired)?;

        let desired_by_key = desired
            .into_iter()
            .map(|spec| ((spec.owner, spec.key.clone()), spec))
            .collect::<BTreeMap<_, _>>();
        let mut replacements = Vec::new();
        let mut removals = Vec::new();
        for (key, handle) in &self.subscriptions {
            match desired_by_key.get(key) {
                Some(spec)
                    if self.subscription_slots[handle.index as usize].spec.as_ref()
                        == Some(spec) => {}
                Some(_) => replacements.push((key.clone(), *handle)),
                None => removals.push((key.clone(), *handle)),
            }
        }
        for (_, handle) in replacements.iter().chain(removals.iter()) {
            if self.subscription_slots[handle.index as usize].generation == u32::MAX {
                return Err(AsyncError::GenerationExhausted);
            }
        }

        let mut changes = Vec::new();
        for (key, handle) in removals.into_iter().chain(replacements.clone()) {
            self.stop_subscription(&key, handle);
            changes.push(SubscriptionChange::Stop { handle });
        }
        for (key, spec) in desired_by_key {
            if self.subscriptions.contains_key(&key) {
                continue;
            }
            let handle = self.allocate_subscription(spec.clone());
            self.subscriptions.insert(key, handle);
            changes.push(SubscriptionChange::Start { handle, spec });
        }
        self.subscription_bytes = desired_bytes;
        Ok(changes)
    }

    pub fn preflight_subscriptions(
        &self,
        desired: &[SubscriptionSpec],
    ) -> Result<usize, AsyncError> {
        let mut keys = BTreeSet::new();
        let mut desired_bytes = 0_usize;
        for spec in desired {
            if !valid_subscription_owner(spec.owner)
                || spec.key.is_empty()
                || spec.kind.is_empty()
                || spec.key.len() > self.config.max_label_bytes
                || spec.kind.len() > self.config.max_label_bytes
            {
                return Err(AsyncError::InvalidKind);
            }
            if !keys.insert((spec.owner, spec.key.clone())) {
                return Err(AsyncError::DuplicateSubscriptionKey);
            }
            desired_bytes = desired_bytes
                .checked_add(spec.payload.len())
                .ok_or(AsyncError::SubscriptionPayloadCapacity)?;
        }
        if desired.len() > self.config.max_subscriptions {
            return Err(AsyncError::SubscriptionCapacity);
        }
        if desired_bytes > self.config.max_subscription_bytes {
            return Err(AsyncError::SubscriptionPayloadCapacity);
        }
        for (key, handle) in &self.subscriptions {
            let changes = desired
                .iter()
                .find(|spec| (spec.owner, spec.key.as_str()) == (key.0, key.1.as_str()))
                .is_none_or(|spec| {
                    self.subscription_slots[handle.index as usize].spec.as_ref() != Some(spec)
                });
            if changes && self.subscription_slots[handle.index as usize].generation == u32::MAX {
                return Err(AsyncError::GenerationExhausted);
            }
        }
        Ok(desired_bytes)
    }

    pub fn reconcile_subscription_owners(
        &mut self,
        desired_owners: Vec<(SubscriptionOwner, Vec<SubscriptionSpec>)>,
    ) -> Result<Vec<SubscriptionChange>, AsyncError> {
        let desired = self.desired_after_owner_updates(&desired_owners)?;
        self.reconcile_subscriptions(desired)
    }

    pub fn preflight_subscription_owners(
        &self,
        desired_owners: &[(SubscriptionOwner, Vec<SubscriptionSpec>)],
    ) -> Result<usize, AsyncError> {
        let desired = self.desired_after_owner_updates(desired_owners)?;
        self.preflight_subscriptions(&desired)
    }

    pub fn remove_subscription_owner(
        &mut self,
        owner: SubscriptionOwner,
    ) -> Result<Vec<SubscriptionChange>, AsyncError> {
        self.reconcile_subscription_owners(vec![(owner, Vec::new())])
    }

    pub fn subscription_handle(&self, owner: SubscriptionOwner, key: &str) -> Option<Handle> {
        self.subscriptions.get(&(owner, key.to_owned())).copied()
    }

    pub fn subscription_owners_for_root(&self, root: UiRootId) -> BTreeSet<SubscriptionOwner> {
        self.subscriptions
            .keys()
            .filter_map(|(owner, _)| match owner {
                SubscriptionOwner::UiRoot(owner_root) if *owner_root == root => Some(*owner),
                SubscriptionOwner::Scope {
                    root: owner_root, ..
                } if *owner_root == root => Some(*owner),
                _ => None,
            })
            .collect()
    }

    pub fn active_reload_effects(&self) -> Vec<(u64, String, bool)> {
        self.pending_effects
            .values()
            .map(|pending| {
                (
                    pending.request.effect_id,
                    pending.request.kind.clone(),
                    pending.transferable_across_reload,
                )
            })
            .collect()
    }

    pub fn instrumentation(&self) -> AsyncInstrumentation {
        AsyncInstrumentation {
            pending_effects: self.pending_effects.len(),
            pending_effect_bytes: self.pending_effect_bytes,
            completions: self.completions.len(),
            completion_bytes: self.completion_bytes,
            subscriptions: self.subscriptions.len(),
            subscription_bytes: self.subscription_bytes,
            closed: self.closed,
        }
    }

    pub fn preflight_reset(&self) -> Result<(), AsyncError> {
        if self.closed {
            return Ok(());
        }
        for handle in self.subscriptions.values() {
            if self.subscription_slots[handle.index as usize].generation == u32::MAX {
                return Err(AsyncError::GenerationExhausted);
            }
        }
        Ok(())
    }

    pub fn reset(&mut self) -> Result<AsyncReset, AsyncError> {
        if self.closed {
            return Err(AsyncError::Closed);
        }
        self.preflight_reset()?;
        let effect_completions = self
            .pending_effects
            .values()
            .map(|pending| EffectCompletion {
                effect_id: pending.request.effect_id,
                app_code_epoch: pending.request.app_code_epoch,
                outcome: EffectOutcome::Cancelled,
            })
            .collect::<Vec<_>>();
        self.pending_effects.clear();
        self.effect_order.clear();
        self.pending_effect_bytes = 0;
        self.completions.clear();
        self.completion_bytes = 0;

        let subscriptions = self
            .subscriptions
            .iter()
            .map(|(key, handle)| (key.clone(), *handle))
            .collect::<Vec<_>>();
        let mut subscription_changes = Vec::with_capacity(subscriptions.len());
        for (key, handle) in subscriptions {
            self.stop_subscription(&key, handle);
            subscription_changes.push(SubscriptionChange::Stop { handle });
        }
        self.subscription_bytes = 0;
        Ok(AsyncReset {
            effect_completions,
            subscription_changes,
        })
    }

    pub fn shutdown(&mut self) -> Result<AsyncReset, AsyncError> {
        if self.closed {
            return Ok(AsyncReset::default());
        }
        let reset = self.reset()?;
        self.closed = true;
        Ok(reset)
    }

    fn ensure_open(&self) -> Result<(), AsyncError> {
        if self.closed {
            Err(AsyncError::Closed)
        } else {
            Ok(())
        }
    }

    fn stop_subscription(&mut self, key: &(SubscriptionOwner, String), handle: Handle) {
        self.subscriptions.remove(key);
        let slot = &mut self.subscription_slots[handle.index as usize];
        slot.spec = None;
        slot.generation = slot
            .generation
            .checked_add(1)
            .expect("subscription generation exhaustion is preflighted");
        self.subscription_free.push(handle.index);
    }

    fn allocate_subscription(&mut self, spec: SubscriptionSpec) -> Handle {
        if let Some(index) = self.subscription_free.pop() {
            let slot = &mut self.subscription_slots[index as usize];
            slot.spec = Some(spec);
            return Handle {
                index,
                generation: slot.generation,
            };
        }
        let index = self.subscription_slots.len() as u32;
        self.subscription_slots.push(SubscriptionSlot {
            generation: 1,
            spec: Some(spec),
        });
        Handle {
            index,
            generation: 1,
        }
    }

    fn desired_after_owner_updates(
        &self,
        desired_owners: &[(SubscriptionOwner, Vec<SubscriptionSpec>)],
    ) -> Result<Vec<SubscriptionSpec>, AsyncError> {
        let mut owners = BTreeSet::new();
        for (owner, specs) in desired_owners {
            if !valid_subscription_owner(*owner) || !owners.insert(*owner) {
                return Err(AsyncError::DuplicateSubscriptionKey);
            }
            if specs.iter().any(|spec| spec.owner != *owner) {
                return Err(AsyncError::DuplicateSubscriptionKey);
            }
        }
        let mut desired = self
            .subscriptions
            .iter()
            .filter(|((owner, _), _)| !owners.contains(owner))
            .filter_map(|(_, handle)| {
                self.subscription_slots[handle.index as usize]
                    .spec
                    .as_ref()
                    .cloned()
            })
            .collect::<Vec<_>>();
        for (_, specs) in desired_owners {
            desired.extend(specs.iter().cloned());
        }
        Ok(desired)
    }
}

fn valid_subscription_owner(owner: SubscriptionOwner) -> bool {
    match owner {
        SubscriptionOwner::App => true,
        SubscriptionOwner::UiRoot(root) => root.is_valid(),
        SubscriptionOwner::Scope {
            root,
            path_hash,
            generation,
        } => root.is_valid() && path_hash != 0 && generation != 0,
    }
}

fn valid_effect_scope(scope: EffectScope) -> bool {
    match scope {
        EffectScope::App => true,
        EffectScope::UiRoot(root) => root.is_valid(),
        EffectScope::Scope {
            root,
            path_hash,
            generation,
        } => root.is_valid() && path_hash != 0 && generation != 0,
        EffectScope::Node {
            root,
            logical_ref,
            binding_generation,
        } => root.is_valid() && logical_ref.is_valid() && binding_generation != 0,
    }
}

fn outcome_bytes(outcome: &EffectOutcome) -> usize {
    match outcome {
        EffectOutcome::Completed(bytes) | EffectOutcome::Failed(bytes) => bytes.len(),
        EffectOutcome::Cancelled | EffectOutcome::TimedOut => 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn registry() -> AsyncRegistry {
        AsyncRegistry::new(AsyncConfig {
            max_effects: 2,
            max_effect_payload_bytes: 4,
            max_completions: 2,
            max_completion_bytes: 4,
            max_subscriptions: 2,
            max_subscription_bytes: 4,
            max_label_bytes: 16,
        })
        .unwrap()
    }

    fn subscription(key: &str, payload: u8) -> SubscriptionSpec {
        SubscriptionSpec {
            owner: SubscriptionOwner::App,
            key: key.to_owned(),
            kind: "timer".to_owned(),
            payload: vec![payload],
        }
    }

    #[test]
    fn effect_completion_is_terminal_and_waits_for_safe_point_drain() {
        let mut registry = registry();
        let effect_id = registry
            .begin_effect(1, "load".to_owned(), vec![1])
            .unwrap();
        assert_eq!(registry.poll_effect().unwrap().effect_id, effect_id);
        registry
            .complete_effect(effect_id, 1, EffectOutcome::Completed(vec![2]))
            .unwrap();
        assert_eq!(
            registry.complete_effect(effect_id, 1, EffectOutcome::Completed(vec![3])),
            Err(AsyncError::UnknownEffect)
        );
        assert_eq!(
            registry.drain_completions(),
            vec![EffectCompletion {
                effect_id,
                app_code_epoch: 1,
                outcome: EffectOutcome::Completed(vec![2]),
            }]
        );
    }

    #[test]
    fn subscription_key_preserves_handle_and_change_replaces_generation() {
        let mut registry = registry();
        let started = registry
            .reconcile_subscriptions(vec![subscription("clock", 1)])
            .unwrap();
        let first = match &started[0] {
            SubscriptionChange::Start { handle, .. } => *handle,
            _ => unreachable!(),
        };
        assert!(registry
            .reconcile_subscriptions(vec![subscription("clock", 1)])
            .unwrap()
            .is_empty());
        let changed = registry
            .reconcile_subscriptions(vec![subscription("clock", 2)])
            .unwrap();
        assert_eq!(changed[0], SubscriptionChange::Stop { handle: first });
        let current = registry
            .subscription_handle(SubscriptionOwner::App, "clock")
            .unwrap();
        assert_eq!(current.index, first.index);
        assert_ne!(current.generation, first.generation);
    }

    #[test]
    fn duplicate_subscription_and_stale_effect_epoch_leave_state_unchanged() {
        let mut registry = registry();
        assert_eq!(
            registry
                .reconcile_subscriptions(vec![subscription("clock", 1), subscription("clock", 2),]),
            Err(AsyncError::DuplicateSubscriptionKey)
        );
        assert!(registry
            .subscription_handle(SubscriptionOwner::App, "clock")
            .is_none());
        let effect_id = registry
            .begin_effect(2, "load".to_owned(), vec![1])
            .unwrap();
        registry.poll_effect().unwrap();
        assert_eq!(
            registry.complete_effect(effect_id, 1, EffectOutcome::Completed(Vec::new())),
            Err(AsyncError::StaleAppCodeEpoch)
        );
        assert_eq!(registry.pending_effects.len(), 1);
    }
}
