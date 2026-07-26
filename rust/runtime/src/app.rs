use std::collections::{BTreeMap, BTreeSet};

use vogui_protocol::v2::{Handle, UiRootId, UiSessionId};

use crate::{
    async_runtime::{
        EffectExecutor, EffectRouteBinding, EffectScope, SubscriptionOwner, SubscriptionSpec,
    },
    reload::{DriverSchema, ReloadCandidate},
    tree::ViewNode,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TransactionMode {
    ImmutableValue,
    GeneratedWriteJournal,
    RestartOnFailure,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppDriverSchema {
    pub app_build_id: [u8; 32],
    pub model_fingerprint: [u8; 32],
    pub message_fingerprint: [u8; 32],
    pub transitive_model_abi: [u8; 32],
    pub transaction_mode: TransactionMode,
    pub supports_neutral_snapshot: bool,
    pub supports_migration: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppEntryDescriptor {
    pub artifact_id: [u8; 32],
    pub factory_id: u64,
    pub schema: AppDriverSchema,
    pub max_init_bytes: usize,
    pub max_model_bytes: usize,
    pub max_message_bytes: usize,
    pub max_effects_per_update: usize,
    pub max_subscriptions: usize,
    pub effect_routes: Vec<EffectRouteBinding>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OwnedInitData {
    bytes: Vec<u8>,
}

impl OwnedInitData {
    pub fn new(bytes: Vec<u8>, max_bytes: usize) -> Result<Self, AppOwnerError> {
        if bytes.len() > max_bytes {
            return Err(AppOwnerError::InitCapacity);
        }
        Ok(Self { bytes })
    }

    pub fn as_bytes(&self) -> &[u8] {
        &self.bytes
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ModelSlot {
    fingerprint: [u8; 32],
    bytes: Vec<u8>,
}

impl ModelSlot {
    pub fn new(fingerprint: [u8; 32], bytes: Vec<u8>) -> Self {
        Self { fingerprint, bytes }
    }

    pub const fn fingerprint(&self) -> [u8; 32] {
        self.fingerprint
    }

    pub fn as_bytes(&self) -> &[u8] {
        &self.bytes
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MessageSlot {
    fingerprint: [u8; 32],
    bytes: Vec<u8>,
}

impl MessageSlot {
    pub fn new(fingerprint: [u8; 32], bytes: Vec<u8>) -> Self {
        Self { fingerprint, bytes }
    }

    pub const fn fingerprint(&self) -> [u8; 32] {
        self.fingerprint
    }

    pub fn as_bytes(&self) -> &[u8] {
        &self.bytes
    }
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct ScopeId {
    pub root: UiRootId,
    pub path_hash: u64,
    pub generation: u32,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum DirtyRequest {
    Scope { scope: ScopeId, builder_id: u32 },
    Root(UiRootId),
    AllRoots,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RootContext {
    pub session: UiSessionId,
    pub root: UiRootId,
    pub app_view: Handle,
    pub surface: Handle,
    pub metrics_revision: u64,
    pub theme_revision: u64,
    pub locale_revision: u64,
    pub capabilities_revision: u64,
    pub logical_width_milli: u32,
    pub logical_height_milli: u32,
    pub scale_factor_milli: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UpdateContext {
    pub session: UiSessionId,
    pub source_root: Option<UiRootId>,
    pub source_surface: Option<Handle>,
    pub source_app_view: Option<Handle>,
    pub event_sequence: Option<u64>,
    pub event_revision: Option<u64>,
    pub monotonic_millis: u64,
    pub capability_revision: u64,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum BuildRequest {
    Root(UiRootId),
    Scope { scope: ScopeId, builder_id: u32 },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StagedEffect {
    pub kind: String,
    pub executor: EffectExecutor,
    pub scope: EffectScope,
    pub deadline_millis: u64,
    pub payload: Vec<u8>,
    pub transferable_across_reload: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DriverUpdate {
    pub candidate_model: ModelSlot,
    pub dirty: Vec<DirtyRequest>,
    pub effects: Vec<StagedEffect>,
    pub subscriptions: SubscriptionUpdate,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SubscriptionUpdate {
    Unchanged,
    DirtyOwners(Vec<SubscriptionBuildRequest>),
    ReplaceAll,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum SubscriptionBuildRequest {
    AppOwner,
    UiRoot(UiRootId),
    Scope { scope: ScopeId, builder_id: u32 },
    All,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DriverRecovery {
    Continue,
    RebuildScope(ScopeId),
    RebuildRoot(UiRootId),
    RestartSession,
    CloseRoot(UiRootId),
    ExitApp,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppDriverFault {
    pub domain: String,
    pub code: u32,
    pub diagnostic: Vec<u8>,
}

pub trait AppDriver {
    fn schema(&self) -> AppDriverSchema;

    fn init(
        &mut self,
        init: &OwnedInitData,
        context: &UpdateContext,
    ) -> Result<DriverUpdate, AppDriverFault>;

    fn update(
        &mut self,
        committed: &ModelSlot,
        message: &MessageSlot,
        context: &UpdateContext,
    ) -> Result<DriverUpdate, AppDriverFault>;

    fn build(
        &mut self,
        model: &ModelSlot,
        context: &RootContext,
        request: BuildRequest,
    ) -> Result<ViewNode, AppDriverFault>;

    fn build_subscriptions(
        &mut self,
        model: &ModelSlot,
        request: SubscriptionBuildRequest,
    ) -> Result<Vec<SubscriptionSpec>, AppDriverFault>;

    fn dispatch_mapper(
        &mut self,
        mapper_id: u32,
        typed_payload_fingerprint: [u8; 32],
        typed_payload: &[u8],
    ) -> Result<MessageSlot, AppDriverFault>;

    fn encode_neutral_snapshot(&mut self, model: &ModelSlot) -> Result<Vec<u8>, AppDriverFault>;

    fn migrate_neutral_snapshot(
        &mut self,
        old_schema: &AppDriverSchema,
        snapshot: &[u8],
    ) -> Result<ModelSlot, AppDriverFault>;

    fn on_error(&mut self, fault: &AppDriverFault) -> DriverRecovery;
}

pub trait AppDriverFactory {
    fn factory_id(&self) -> u64;
    fn create(&self, descriptor: &AppEntryDescriptor)
        -> Result<Box<dyn AppDriver>, AppDriverFault>;
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PreparedBuild {
    pub request: BuildRequest,
    pub view: ViewNode,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppPreparedTransaction {
    pub base_model_revision: u64,
    pub candidate_model_revision: u64,
    pub candidate_model: ModelSlot,
    pub builds: Vec<PreparedBuild>,
    pub effects: Vec<StagedEffect>,
    pub subscriptions: Option<PreparedSubscriptionUpdate>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PreparedSubscriptionUpdate {
    ReplaceAll(Vec<SubscriptionSpec>),
    Owners(Vec<(SubscriptionOwner, Vec<SubscriptionSpec>)>),
}

pub struct PreparedAppReload {
    pub descriptor: AppEntryDescriptor,
    pub driver: Box<dyn AppDriver>,
    pub candidate_model: ModelSlot,
    pub candidate_model_revision: u64,
    pub neutral_snapshot: Vec<u8>,
    pub views: Vec<(UiRootId, ViewNode)>,
    pub subscriptions: Vec<SubscriptionSpec>,
}

impl PreparedAppReload {
    pub fn reload_candidate(&self) -> ReloadCandidate {
        ReloadCandidate {
            schema: DriverSchema {
                app_build_id: self.descriptor.schema.app_build_id,
                model_fingerprint: self.descriptor.schema.model_fingerprint,
                message_fingerprint: self.descriptor.schema.message_fingerprint,
                transitive_abi_fingerprint: self.descriptor.schema.transitive_model_abi,
            },
            neutral_snapshot: self.neutral_snapshot.clone(),
            root_count: self.views.len(),
            subscription_count: self.subscriptions.len(),
            widget_binding_count: 0,
            resource_lease_count: 0,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AppOwnerError {
    InvalidDescriptor,
    FactoryMismatch,
    DriverSchemaMismatch,
    InitCapacity,
    ModelCapacity,
    MessageCapacity,
    EffectCapacity,
    InvalidEffectRoute,
    SubscriptionCapacity,
    WrongSession,
    UnknownRoot,
    DuplicateRoot,
    InvalidScope,
    RevisionMismatch,
    RevisionExhausted,
    ReloadAwaitingSnapshotAck,
    Driver(AppDriverFault),
}

struct RetiredAppState {
    descriptor: AppEntryDescriptor,
    driver: Box<dyn AppDriver>,
    model: ModelSlot,
}

pub struct AppOwner {
    session: UiSessionId,
    descriptor: AppEntryDescriptor,
    driver: Box<dyn AppDriver>,
    model: ModelSlot,
    model_revision: u64,
    retired_reload: Option<RetiredAppState>,
}

impl AppOwner {
    pub fn create(
        session: UiSessionId,
        descriptor: AppEntryDescriptor,
        factory: &dyn AppDriverFactory,
        init: OwnedInitData,
        context: UpdateContext,
    ) -> Result<(Self, DriverUpdate), AppOwnerError> {
        validate_descriptor(session, &descriptor)?;
        if factory.factory_id() != descriptor.factory_id {
            return Err(AppOwnerError::FactoryMismatch);
        }
        let mut driver = factory.create(&descriptor).map_err(AppOwnerError::Driver)?;
        if driver.schema() != descriptor.schema {
            return Err(AppOwnerError::DriverSchemaMismatch);
        }
        if context.session != session {
            return Err(AppOwnerError::WrongSession);
        }
        if init.bytes.len() > descriptor.max_init_bytes {
            return Err(AppOwnerError::InitCapacity);
        }
        let initial = driver
            .init(&init, &context)
            .map_err(AppOwnerError::Driver)?;
        validate_update(&descriptor, &initial)?;
        let owner = Self {
            session,
            descriptor,
            driver,
            model: initial.candidate_model.clone(),
            model_revision: 1,
            retired_reload: None,
        };
        Ok((owner, initial))
    }

    pub const fn session(&self) -> UiSessionId {
        self.session
    }

    pub const fn model_revision(&self) -> u64 {
        self.model_revision
    }

    pub fn model(&self) -> &ModelSlot {
        &self.model
    }

    pub fn dispatch_mapper(
        &mut self,
        mapper_id: u32,
        payload_fingerprint: [u8; 32],
        payload: &[u8],
    ) -> Result<MessageSlot, AppOwnerError> {
        let message = self
            .driver
            .dispatch_mapper(mapper_id, payload_fingerprint, payload)
            .map_err(AppOwnerError::Driver)?;
        self.validate_message(&message)?;
        Ok(message)
    }

    pub fn prepare_message(
        &mut self,
        message: &MessageSlot,
        update_context: &UpdateContext,
        root_contexts: &[RootContext],
    ) -> Result<AppPreparedTransaction, AppOwnerError> {
        self.validate_message(message)?;
        validate_root_contexts(self.session, root_contexts)?;
        if update_context.session != self.session {
            return Err(AppOwnerError::WrongSession);
        }
        let update = self
            .driver
            .update(&self.model, message, update_context)
            .map_err(AppOwnerError::Driver)?;
        validate_update(&self.descriptor, &update)?;
        let next_revision = self
            .model_revision
            .checked_add(1)
            .ok_or(AppOwnerError::RevisionExhausted)?;
        let build_requests = normalize_dirty(&update.dirty, root_contexts)?;
        let roots = root_contexts
            .iter()
            .map(|context| (context.root, context))
            .collect::<BTreeMap<_, _>>();
        let mut builds = Vec::new();
        for request in build_requests {
            let root = match request {
                BuildRequest::Root(root) => root,
                BuildRequest::Scope { scope, .. } => scope.root,
            };
            let context = roots.get(&root).ok_or(AppOwnerError::UnknownRoot)?;
            let view = self
                .driver
                .build(&update.candidate_model, context, request)
                .map_err(AppOwnerError::Driver)?;
            builds.push(PreparedBuild { request, view });
        }
        let subscriptions = match update.subscriptions {
            SubscriptionUpdate::Unchanged => None,
            SubscriptionUpdate::ReplaceAll => {
                let subscriptions = self
                    .driver
                    .build_subscriptions(&update.candidate_model, SubscriptionBuildRequest::All)
                    .map_err(AppOwnerError::Driver)?;
                if subscriptions.len() > self.descriptor.max_subscriptions {
                    return Err(AppOwnerError::SubscriptionCapacity);
                }
                Some(PreparedSubscriptionUpdate::ReplaceAll(subscriptions))
            }
            SubscriptionUpdate::DirtyOwners(requests) => {
                let requests = normalize_subscription_requests(&requests, root_contexts)?;
                let mut owners = Vec::with_capacity(requests.len());
                let mut count = 0_usize;
                for request in requests {
                    let subscriptions = self
                        .driver
                        .build_subscriptions(&update.candidate_model, request)
                        .map_err(AppOwnerError::Driver)?;
                    count = count
                        .checked_add(subscriptions.len())
                        .ok_or(AppOwnerError::SubscriptionCapacity)?;
                    if count > self.descriptor.max_subscriptions {
                        return Err(AppOwnerError::SubscriptionCapacity);
                    }
                    let owner = subscription_owner(request)?;
                    if subscriptions.iter().any(|spec| spec.owner != owner) {
                        return Err(AppOwnerError::InvalidScope);
                    }
                    owners.push((owner, subscriptions));
                }
                Some(PreparedSubscriptionUpdate::Owners(owners))
            }
        };
        Ok(AppPreparedTransaction {
            base_model_revision: self.model_revision,
            candidate_model_revision: next_revision,
            candidate_model: update.candidate_model,
            builds,
            effects: update.effects,
            subscriptions,
        })
    }

    pub fn commit(&mut self, prepared: &AppPreparedTransaction) -> Result<(), AppOwnerError> {
        self.preflight_commit(prepared)?;
        self.model = prepared.candidate_model.clone();
        self.model_revision = prepared.candidate_model_revision;
        Ok(())
    }

    pub fn preflight_commit(&self, prepared: &AppPreparedTransaction) -> Result<(), AppOwnerError> {
        if prepared.base_model_revision != self.model_revision
            || prepared.candidate_model_revision
                != self
                    .model_revision
                    .checked_add(1)
                    .ok_or(AppOwnerError::RevisionExhausted)?
        {
            return Err(AppOwnerError::RevisionMismatch);
        }
        validate_model(&self.descriptor, &prepared.candidate_model)
    }

    pub fn neutral_snapshot(&mut self) -> Result<Vec<u8>, AppOwnerError> {
        if !self.descriptor.schema.supports_neutral_snapshot {
            return Err(AppOwnerError::InvalidDescriptor);
        }
        self.driver
            .encode_neutral_snapshot(&self.model)
            .map_err(AppOwnerError::Driver)
    }

    pub fn prepare_reload(
        &mut self,
        descriptor: AppEntryDescriptor,
        factory: &dyn AppDriverFactory,
        root_contexts: &[RootContext],
    ) -> Result<PreparedAppReload, AppOwnerError> {
        validate_descriptor(self.session, &descriptor)?;
        validate_root_contexts(self.session, root_contexts)?;
        if factory.factory_id() != descriptor.factory_id {
            return Err(AppOwnerError::FactoryMismatch);
        }
        if !self.descriptor.schema.supports_neutral_snapshot
            || !descriptor.schema.supports_migration
        {
            return Err(AppOwnerError::InvalidDescriptor);
        }
        let neutral_snapshot = self
            .driver
            .encode_neutral_snapshot(&self.model)
            .map_err(AppOwnerError::Driver)?;
        if neutral_snapshot.len() > descriptor.max_model_bytes {
            return Err(AppOwnerError::ModelCapacity);
        }
        let mut driver = factory.create(&descriptor).map_err(AppOwnerError::Driver)?;
        if driver.schema() != descriptor.schema {
            return Err(AppOwnerError::DriverSchemaMismatch);
        }
        let candidate_model = driver
            .migrate_neutral_snapshot(&self.descriptor.schema, &neutral_snapshot)
            .map_err(AppOwnerError::Driver)?;
        validate_model(&descriptor, &candidate_model)?;
        let candidate_model_revision = self
            .model_revision
            .checked_add(1)
            .ok_or(AppOwnerError::RevisionExhausted)?;
        let mut views = Vec::with_capacity(root_contexts.len());
        for context in root_contexts {
            let view = driver
                .build(&candidate_model, context, BuildRequest::Root(context.root))
                .map_err(AppOwnerError::Driver)?;
            views.push((context.root, view));
        }
        let subscriptions = driver
            .build_subscriptions(&candidate_model, SubscriptionBuildRequest::All)
            .map_err(AppOwnerError::Driver)?;
        if subscriptions.len() > descriptor.max_subscriptions {
            return Err(AppOwnerError::SubscriptionCapacity);
        }
        Ok(PreparedAppReload {
            descriptor,
            driver,
            candidate_model,
            candidate_model_revision,
            neutral_snapshot,
            views,
            subscriptions,
        })
    }

    pub fn commit_reload(&mut self, prepared: PreparedAppReload) -> Result<(), AppOwnerError> {
        self.preflight_commit_reload(&prepared)?;
        let descriptor = std::mem::replace(&mut self.descriptor, prepared.descriptor);
        let driver = std::mem::replace(&mut self.driver, prepared.driver);
        let model = std::mem::replace(&mut self.model, prepared.candidate_model);
        self.retired_reload = Some(RetiredAppState {
            descriptor,
            driver,
            model,
        });
        self.model_revision = prepared.candidate_model_revision;
        Ok(())
    }

    pub fn preflight_commit_reload(
        &self,
        prepared: &PreparedAppReload,
    ) -> Result<(), AppOwnerError> {
        if self.retired_reload.is_some() {
            return Err(AppOwnerError::ReloadAwaitingSnapshotAck);
        }
        let expected_revision = self
            .model_revision
            .checked_add(1)
            .ok_or(AppOwnerError::RevisionExhausted)?;
        if prepared.candidate_model_revision != expected_revision {
            return Err(AppOwnerError::RevisionMismatch);
        }
        validate_model(&prepared.descriptor, &prepared.candidate_model)
    }

    pub const fn has_pinned_reload_state(&self) -> bool {
        self.retired_reload.is_some()
    }

    pub fn release_pinned_reload_state(&mut self) -> Result<(), AppOwnerError> {
        let retired = self
            .retired_reload
            .take()
            .ok_or(AppOwnerError::ReloadAwaitingSnapshotAck)?;
        drop(retired.descriptor);
        drop(retired.driver);
        drop(retired.model);
        Ok(())
    }

    pub fn recovery_for(&mut self, fault: &AppDriverFault) -> DriverRecovery {
        self.driver.on_error(fault)
    }

    fn validate_message(&self, message: &MessageSlot) -> Result<(), AppOwnerError> {
        if message.fingerprint != self.descriptor.schema.message_fingerprint {
            return Err(AppOwnerError::DriverSchemaMismatch);
        }
        if message.bytes.len() > self.descriptor.max_message_bytes {
            return Err(AppOwnerError::MessageCapacity);
        }
        Ok(())
    }
}

fn validate_descriptor(
    session: UiSessionId,
    descriptor: &AppEntryDescriptor,
) -> Result<(), AppOwnerError> {
    if !session.is_valid()
        || descriptor.artifact_id.iter().all(|byte| *byte == 0)
        || descriptor.factory_id == 0
        || descriptor.schema.app_build_id.iter().all(|byte| *byte == 0)
        || descriptor
            .schema
            .model_fingerprint
            .iter()
            .all(|byte| *byte == 0)
        || descriptor
            .schema
            .message_fingerprint
            .iter()
            .all(|byte| *byte == 0)
        || descriptor.max_init_bytes == 0
        || descriptor.max_model_bytes == 0
        || descriptor.max_message_bytes == 0
        || descriptor.max_effects_per_update == 0
        || descriptor.max_subscriptions == 0
    {
        return Err(AppOwnerError::InvalidDescriptor);
    }
    let mut routes = BTreeSet::new();
    for route in &descriptor.effect_routes {
        if route.kind.is_empty()
            || route.max_payload_bytes == 0
            || !routes.insert(route.kind.as_str())
        {
            return Err(AppOwnerError::InvalidEffectRoute);
        }
    }
    Ok(())
}

fn validate_update(
    descriptor: &AppEntryDescriptor,
    update: &DriverUpdate,
) -> Result<(), AppOwnerError> {
    validate_model(descriptor, &update.candidate_model)?;
    if update.effects.len() > descriptor.max_effects_per_update {
        return Err(AppOwnerError::EffectCapacity);
    }
    for effect in &update.effects {
        let route = descriptor
            .effect_routes
            .iter()
            .find(|route| route.kind == effect.kind)
            .ok_or(AppOwnerError::InvalidEffectRoute)?;
        if route.executor != effect.executor
            || effect.payload.len() > route.max_payload_bytes
            || effect.deadline_millis == 0
            || !valid_effect_scope(effect.scope)
        {
            return Err(AppOwnerError::InvalidEffectRoute);
        }
    }
    Ok(())
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

fn validate_model(descriptor: &AppEntryDescriptor, model: &ModelSlot) -> Result<(), AppOwnerError> {
    if model.fingerprint != descriptor.schema.model_fingerprint {
        return Err(AppOwnerError::DriverSchemaMismatch);
    }
    if model.bytes.len() > descriptor.max_model_bytes {
        return Err(AppOwnerError::ModelCapacity);
    }
    Ok(())
}

fn validate_root_contexts(
    session: UiSessionId,
    roots: &[RootContext],
) -> Result<(), AppOwnerError> {
    let mut seen = BTreeSet::new();
    for root in roots {
        if root.session != session
            || !root.root.is_valid()
            || !root.app_view.is_valid()
            || !root.surface.is_valid()
            || root.scale_factor_milli == 0
        {
            return Err(AppOwnerError::WrongSession);
        }
        if !seen.insert(root.root) {
            return Err(AppOwnerError::DuplicateRoot);
        }
    }
    Ok(())
}

fn normalize_dirty(
    dirty: &[DirtyRequest],
    root_contexts: &[RootContext],
) -> Result<Vec<BuildRequest>, AppOwnerError> {
    let live_roots = root_contexts
        .iter()
        .map(|context| context.root)
        .collect::<BTreeSet<_>>();
    if dirty.contains(&DirtyRequest::AllRoots) {
        return Ok(live_roots.into_iter().map(BuildRequest::Root).collect());
    }
    let mut roots = BTreeSet::new();
    let mut scopes = BTreeSet::new();
    for request in dirty {
        match *request {
            DirtyRequest::AllRoots => unreachable!(),
            DirtyRequest::Root(root) => {
                if !live_roots.contains(&root) {
                    return Err(AppOwnerError::UnknownRoot);
                }
                roots.insert(root);
                scopes.retain(|(scope, _): &(ScopeId, u32)| scope.root != root);
            }
            DirtyRequest::Scope { scope, builder_id } => {
                if !live_roots.contains(&scope.root)
                    || scope.path_hash == 0
                    || scope.generation == 0
                    || builder_id == 0
                {
                    return Err(AppOwnerError::InvalidScope);
                }
                if !roots.contains(&scope.root) {
                    scopes.insert((scope, builder_id));
                }
            }
        }
    }
    let mut requests = roots
        .into_iter()
        .map(BuildRequest::Root)
        .collect::<Vec<_>>();
    requests.extend(
        scopes
            .into_iter()
            .map(|(scope, builder_id)| BuildRequest::Scope { scope, builder_id }),
    );
    Ok(requests)
}

fn normalize_subscription_requests(
    requests: &[SubscriptionBuildRequest],
    root_contexts: &[RootContext],
) -> Result<Vec<SubscriptionBuildRequest>, AppOwnerError> {
    let live_roots = root_contexts
        .iter()
        .map(|context| context.root)
        .collect::<BTreeSet<_>>();
    let mut unique = BTreeSet::new();
    for request in requests {
        match *request {
            SubscriptionBuildRequest::All => return Err(AppOwnerError::InvalidScope),
            SubscriptionBuildRequest::AppOwner => {}
            SubscriptionBuildRequest::UiRoot(root) => {
                if !live_roots.contains(&root) {
                    return Err(AppOwnerError::UnknownRoot);
                }
            }
            SubscriptionBuildRequest::Scope { scope, builder_id } => {
                if !live_roots.contains(&scope.root)
                    || scope.path_hash == 0
                    || scope.generation == 0
                    || builder_id == 0
                {
                    return Err(AppOwnerError::InvalidScope);
                }
            }
        }
        if !unique.insert(*request) {
            return Err(AppOwnerError::InvalidScope);
        }
    }
    Ok(unique.into_iter().collect())
}

fn subscription_owner(
    request: SubscriptionBuildRequest,
) -> Result<SubscriptionOwner, AppOwnerError> {
    match request {
        SubscriptionBuildRequest::AppOwner => Ok(SubscriptionOwner::App),
        SubscriptionBuildRequest::UiRoot(root) => Ok(SubscriptionOwner::UiRoot(root)),
        SubscriptionBuildRequest::Scope { scope, .. } => Ok(SubscriptionOwner::Scope {
            root: scope.root,
            path_hash: scope.path_hash,
            generation: scope.generation,
        }),
        SubscriptionBuildRequest::All => Err(AppOwnerError::InvalidScope),
    }
}
