use std::collections::{BTreeMap, BTreeSet, VecDeque};

use vogui_protocol::v2::{EventToken, Handle, NodeId, UiRootId, UiSessionId};

#[inline(never)]
pub fn vogui_profile_link_anchor() -> usize {
    module_path!().as_ptr() as usize
}

pub mod accessibility;
pub mod animation;
pub mod app;
#[cfg(feature = "app-runtime")]
pub mod app_runtime_bridge;
#[cfg(feature = "app-runtime")]
pub mod app_session_adapter;
pub mod async_runtime;
pub mod command;
pub mod control_runtime;
pub mod document;
pub mod fault_injection;
pub mod input;
pub mod inspection;
pub mod interaction;
pub mod layout_style;
pub mod native_text_input;
pub mod performance;
pub mod platform_renderer;
pub mod presentation;
pub mod profile;
pub mod ref_runtime;
pub mod reload;
pub mod renderer;
pub mod resource;
pub mod router;
pub mod semantics;
pub mod target_async;
pub mod target_presentation;
pub mod tree;
pub mod widget_provider;

use app::{
    AppOwner, AppOwnerError, AppPreparedTransaction, BuildRequest, PreparedAppReload,
    PreparedBuild, PreparedSubscriptionUpdate, ScopeId,
};
use async_runtime::{
    AsyncConfig, AsyncError, AsyncRegistry, AsyncReset, EffectCompletion, EffectExecutor,
    EffectOutcome, EffectRequest, EffectScope, SubscriptionChange, SubscriptionSpec,
};
use command::{
    CommandQueueConfig, CommandQueueError, UiCommand, UiCommandOutcome, UiCommandQueue,
    UiCommandResult,
};
use document::{DocumentRuntime, DocumentRuntimeConfig, DocumentRuntimeError};
use fault_injection::{
    UiFaultInjectionError, UiFaultInjectionMetrics, UiFaultInjector, UiFaultOwnerSnapshot,
    UiFaultPoint, UiFaultRule, UiFaultTraceEvent, UiInjectedFault,
};
use interaction::{
    InteractionConfig, InteractionError, InteractionOwnerSnapshot, InteractionRuntime,
};
use layout_style::{
    InteractionState, ResolvedStyle, StateStyles, StyleError, StyleId, StyleProperties, StyleStore,
    StyleStoreConfig, StyleStoreOwnerSnapshot, StyleStoreShutdownReport, ThemeEnvironment,
    ThemeToken,
};
use performance::{
    UiPerformanceConfig, UiPerformanceError, UiPerformanceMeasurement, UiPerformanceOperation,
    UiPerformanceOwnerSnapshot, UiPerformanceRecorder, UiPerformanceSnapshot,
};
use ref_runtime::{
    LogicalNodeRef, NodeRefError, NodeRefRegistry, NodeRefRegistryConfig, ResolvedNodeRef,
};
use reload::{
    ActiveReloadEffect, HeldItem, HeldPayload, ReloadCandidate, ReloadCommit, ReloadConfig,
    ReloadCoordinator, ReloadError, ReloadHoldOutcome, ReloadPhase,
};
use resource::{
    UiResourceDescriptor, UiResourceError, UiResourceFetchWork, UiResourceId, UiResourceLease,
    UiResourcePublication, UiResourceStore, UiResourceStoreConfig,
};
use router::{NavigationLease, RouteSpec, Router, RouterConfig, RouterError};
use tree::{
    PreparedReconcile, RetainedTree, TreeConfig, TreeError, UiPatch, UiTransaction, ViewKind,
    ViewNode,
};
use widget_provider::WrappedWidgetEvent;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiSessionConfig {
    pub max_roots: usize,
    pub max_patch_bytes: usize,
    pub max_pending_bytes_per_root: usize,
    pub max_return_items: usize,
    pub tree: TreeConfig,
    pub command: CommandQueueConfig,
    pub async_registry: AsyncConfig,
    pub resources: UiResourceStoreConfig,
    pub styles: StyleStoreConfig,
    pub reload: ReloadConfig,
    pub node_refs: NodeRefRegistryConfig,
    pub interaction: InteractionConfig,
    pub document: DocumentRuntimeConfig,
    pub performance: UiPerformanceConfig,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct UiSessionInstrumentation {
    pub live_roots: usize,
    pub pending_presentations: usize,
    pub pending_presentation_bytes: usize,
    pub inflight_presentations: usize,
    pub inflight_presentation_bytes: usize,
    pub return_items: usize,
    pub return_payload_bytes: usize,
    pub tree: tree::TreeInstrumentation,
    pub commands: command::CommandQueueInstrumentation,
    pub asynchronous: async_runtime::AsyncInstrumentation,
    pub resources: resource::UiResourceInstrumentation,
    pub styles: StyleStoreOwnerSnapshot,
    pub node_refs: usize,
    pub reload: reload::ReloadInstrumentation,
    pub document: document::DocumentRuntimeInstrumentation,
    pub interaction: InteractionOwnerSnapshot,
    pub fault_rules: usize,
    pub fault_trace_events: usize,
    pub dropped_fault_trace_events: u64,
    pub performance: UiPerformanceOwnerSnapshot,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct UiSessionLeakSummary {
    pub roots: usize,
    pub nodes: usize,
    pub pending_presentations: usize,
    pub inflight_presentations: usize,
    pub returns: usize,
    pub commands: usize,
    pub effects: usize,
    pub completions: usize,
    pub subscriptions: usize,
    pub resources: usize,
    pub resource_leases: usize,
    pub resource_fetch_jobs: usize,
    pub styles: usize,
    pub theme_tokens: usize,
    pub root_theme_overrides: usize,
    pub node_refs: usize,
    pub reload_held_items: usize,
    pub document_windows: usize,
    pub document_effects: usize,
    pub document_completions: usize,
    pub interaction_items: usize,
}

impl UiSessionLeakSummary {
    pub fn is_zero(&self) -> bool {
        *self == Self::default()
    }
}

impl Default for UiSessionConfig {
    fn default() -> Self {
        Self {
            max_roots: 8,
            max_patch_bytes: 1024 * 1024,
            max_pending_bytes_per_root: 2 * 1024 * 1024,
            max_return_items: 1024,
            tree: TreeConfig::default(),
            command: CommandQueueConfig::default(),
            async_registry: AsyncConfig::default(),
            resources: UiResourceStoreConfig::default(),
            styles: StyleStoreConfig::default(),
            reload: ReloadConfig::default(),
            node_refs: NodeRefRegistryConfig::default(),
            interaction: InteractionConfig::default(),
            document: DocumentRuntimeConfig::default(),
            performance: UiPerformanceConfig::default(),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[cfg(test)]
pub(crate) struct RootPatch {
    pub root: UiRootId,
    pub bytes: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RootView {
    pub root: UiRootId,
    pub view: ViewNode,
}

pub type UiNodeRef = LogicalNodeRef;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ViewCommit {
    pub commit_revision: u64,
    pub transactions: Vec<(UiRootId, UiTransaction)>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TargetSubscriptionCommit {
    Unchanged,
    ReplaceAll(Vec<SubscriptionSpec>),
    Owners(Vec<(async_runtime::SubscriptionOwner, Vec<SubscriptionSpec>)>),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppTransactionCommit {
    pub view_commit: ViewCommit,
    pub effect_ids: Vec<u64>,
    pub subscription_changes: Vec<SubscriptionChange>,
    pub cancelled_effect_ids: Vec<u64>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RootDetach {
    pub command_results: Vec<UiCommandResult>,
    pub subscription_changes: Vec<SubscriptionChange>,
    pub cancelled_effect_ids: Vec<u64>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UiSessionShutdownReport {
    pub session: UiSessionId,
    pub detached_roots: Vec<(UiRootId, RootDetach)>,
    pub remaining_command_results: Vec<UiCommandResult>,
    pub released_node_refs: usize,
    pub asynchronous: AsyncReset,
    pub resources: resource::UiResourceShutdown,
    pub styles: StyleStoreShutdownReport,
    pub document: document::DocumentRuntimeShutdown,
    pub interaction: InteractionOwnerSnapshot,
    pub discarded_returns: Vec<UiReturn>,
    pub discarded_reload_items: Vec<HeldItem>,
    pub fault_trace: Vec<UiFaultTraceEvent>,
    pub performance: UiPerformanceSnapshot,
    pub cleared_fault_rules: usize,
    pub final_leaks: UiSessionLeakSummary,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PresentationBatch {
    Patch {
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        base_revision: u64,
        new_revision: u64,
        bytes: Vec<u8>,
    },
    SnapshotRequired {
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        revision: u64,
        bytes: Vec<u8>,
    },
}

impl PresentationBatch {
    pub const fn revision(&self) -> u64 {
        match self {
            Self::Patch { new_revision, .. } => *new_revision,
            Self::SnapshotRequired { revision, .. } => *revision,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum UiReturn {
    ApplyAck {
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        revision: u64,
        sequence: u64,
    },
    Event {
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        applied_revision: u64,
        event_token: EventToken,
        sequence: u64,
        payload: Vec<u8>,
    },
    CommandResult {
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        command_id: u64,
        sequence: u64,
        outcome: UiCommandOutcome,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum UiSessionError {
    InvalidConfig,
    RootCapacity,
    InvalidRoot,
    DuplicateRootPatch,
    PatchTooLarge,
    PresentationInFlight,
    AckRevisionMismatch,
    StaleRootEpoch,
    StaleAppCodeEpoch,
    ReturnSequence,
    EventBeforeApplyAck,
    InvalidEventToken,
    ReturnQueueCapacity,
    RevisionExhausted,
    GenerationExhausted,
    Closed,
    Tree(TreeError),
    Command(CommandQueueError),
    Async(AsyncError),
    App(AppOwnerError),
    Resource(UiResourceError),
    Style(StyleError),
    Router(RouterError),
    Reload(ReloadError),
    NodeRef(NodeRefError),
    Interaction(InteractionError),
    Document(DocumentRuntimeError),
    Performance(UiPerformanceError),
    WrongSession,
    InjectedFault {
        point: UiFaultPoint,
        fault: UiInjectedFault,
    },
}

#[derive(Debug)]
struct RootState {
    epoch: u32,
    last_acked_revision: u64,
    observed_applied_revision: u64,
    desired_revision: u64,
    inflight: Option<PresentationBatch>,
    pending: Option<PendingPresentation>,
    last_return_sequence: u64,
    tree: RetainedTree,
}

enum EffectiveSubscriptionUpdate {
    Unchanged,
    ReplaceAll(Vec<SubscriptionSpec>),
    Owners(Vec<(async_runtime::SubscriptionOwner, Vec<SubscriptionSpec>)>),
}

#[derive(Debug)]
enum PendingPresentation {
    Delta {
        base_revision: u64,
        new_revision: u64,
        bytes: Vec<u8>,
    },
    SnapshotRequired {
        revision: u64,
    },
}

#[derive(Debug)]
struct RootSlot {
    generation: u32,
    state: Option<RootState>,
}

pub struct UiSession {
    id: UiSessionId,
    config: UiSessionConfig,
    app_code_epoch: u64,
    commit_revision: u64,
    roots: Vec<RootSlot>,
    free_roots: Vec<u32>,
    live_roots: usize,
    returns: VecDeque<UiReturn>,
    commands: UiCommandQueue,
    async_registry: AsyncRegistry,
    resources: UiResourceStore,
    styles: StyleStore,
    router: Option<Router>,
    reload: ReloadCoordinator,
    node_refs: NodeRefRegistry,
    interaction: InteractionRuntime,
    document: DocumentRuntime,
    performance: UiPerformanceRecorder,
    retired_tree_instrumentation: tree::TreeInstrumentation,
    faults: UiFaultInjector,
    closed: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RendererRestart {
    pub ui_root_epoch: u32,
    pub command_results: Vec<UiCommandResult>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DriverReload {
    pub command_results: Vec<UiCommandResult>,
    pub async_reset: AsyncReset,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransactionalDriverReload {
    pub commit: ReloadCommit,
    pub cleanup: DriverReload,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppReloadCommit {
    pub view_commit: ViewCommit,
    pub driver_reload: TransactionalDriverReload,
    pub subscription_changes: Vec<SubscriptionChange>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReloadRollback {
    pub reason: ReloadError,
    pub pending_messages: Vec<HeldItem>,
    pub restored_returns: usize,
    pub restored_effect_completions: usize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppReloadRecovery {
    pub app_code_epoch: u64,
    pub stale_items: Vec<HeldItem>,
}

impl UiSession {
    pub fn new(id: UiSessionId, config: UiSessionConfig) -> Result<Self, UiSessionError> {
        if !id.is_valid()
            || config.max_roots == 0
            || config.max_patch_bytes == 0
            || config.max_pending_bytes_per_root == 0
            || config.max_return_items == 0
        {
            return Err(UiSessionError::InvalidConfig);
        }
        RetainedTree::new(config.tree).map_err(UiSessionError::Tree)?;
        let commands = UiCommandQueue::new(config.command).map_err(UiSessionError::Command)?;
        let async_registry =
            AsyncRegistry::new(config.async_registry).map_err(UiSessionError::Async)?;
        let resources =
            UiResourceStore::new(id, config.resources).map_err(UiSessionError::Resource)?;
        let styles = StyleStore::new(id, config.styles, ThemeEnvironment::default())
            .map_err(UiSessionError::Style)?;
        let reload = ReloadCoordinator::new(config.reload).map_err(UiSessionError::Reload)?;
        let node_refs =
            NodeRefRegistry::new(id, config.node_refs).map_err(UiSessionError::NodeRef)?;
        let interaction =
            InteractionRuntime::new(id, config.interaction).map_err(UiSessionError::Interaction)?;
        let document =
            DocumentRuntime::new(id, config.document).map_err(UiSessionError::Document)?;
        let performance =
            UiPerformanceRecorder::new(config.performance).map_err(UiSessionError::Performance)?;
        Ok(Self {
            id,
            config,
            app_code_epoch: 1,
            commit_revision: 0,
            roots: Vec::new(),
            free_roots: Vec::new(),
            live_roots: 0,
            returns: VecDeque::new(),
            commands,
            async_registry,
            resources,
            styles,
            router: None,
            reload,
            node_refs,
            interaction,
            document,
            performance,
            retired_tree_instrumentation: tree::TreeInstrumentation::default(),
            faults: UiFaultInjector::new(64),
            closed: false,
        })
    }

    pub const fn id(&self) -> UiSessionId {
        self.id
    }

    pub const fn app_code_epoch(&self) -> u64 {
        self.app_code_epoch
    }

    pub const fn commit_revision(&self) -> u64 {
        self.commit_revision
    }

    pub fn install_fault_rule(&mut self, rule: UiFaultRule) -> Result<(), UiFaultInjectionError> {
        self.faults.replace(rule)
    }

    pub fn remove_fault_rule(
        &mut self,
        point: UiFaultPoint,
    ) -> Result<UiFaultRule, UiFaultInjectionError> {
        self.faults.remove(point)
    }

    pub fn clear_fault_rules(&mut self) -> usize {
        self.faults.clear()
    }

    pub const fn fault_metrics(&self) -> UiFaultInjectionMetrics {
        self.faults.metrics()
    }

    pub fn fault_owner_snapshot(&self) -> UiFaultOwnerSnapshot {
        self.faults.owner_snapshot()
    }

    pub fn fault_trace_after(
        &self,
        sequence: u64,
        limit: usize,
    ) -> impl Iterator<Item = UiFaultTraceEvent> + '_ {
        self.faults.trace_after(sequence, limit)
    }

    pub fn clear_fault_trace(&mut self) -> usize {
        self.faults.clear_trace()
    }

    pub fn record_performance(
        &mut self,
        operation: UiPerformanceOperation,
        root: Option<UiRootId>,
        duration_nanos: u64,
        allocation_bytes: u64,
        lock_wait_nanos: u64,
    ) -> Result<u64, UiSessionError> {
        self.require_open()?;
        if let Some(root) = root {
            self.root_index(root)?;
        }
        let state = self.instrumentation();
        let queue_items = state
            .return_items
            .saturating_add(state.commands.pending)
            .saturating_add(state.pending_presentations)
            .saturating_add(state.inflight_presentations)
            .saturating_add(state.asynchronous.pending_effects)
            .saturating_add(state.asynchronous.completions);
        let queue_bytes = state
            .return_payload_bytes
            .saturating_add(state.commands.pending_bytes)
            .saturating_add(state.pending_presentation_bytes)
            .saturating_add(state.inflight_presentation_bytes)
            .saturating_add(state.asynchronous.pending_effect_bytes)
            .saturating_add(state.asynchronous.completion_bytes);
        self.performance
            .record(UiPerformanceMeasurement {
                operation,
                root,
                revision: self.commit_revision,
                duration_nanos,
                allocation_bytes,
                lock_wait_nanos,
                queue_items,
                queue_bytes,
            })
            .map_err(UiSessionError::Performance)
    }

    pub fn performance_snapshot(&self, after_sequence: u64, limit: usize) -> UiPerformanceSnapshot {
        self.performance.snapshot_after(after_sequence, limit)
    }

    pub fn evaluate_fault(&mut self, point: UiFaultPoint) -> Option<UiInjectedFault> {
        self.faults.trigger(point)
    }

    pub fn instrumentation(&self) -> UiSessionInstrumentation {
        let faults = self.faults.owner_snapshot();
        let mut result = UiSessionInstrumentation {
            live_roots: self.live_roots,
            return_items: self.returns.len(),
            commands: self.commands.instrumentation(),
            asynchronous: self.async_registry.instrumentation(),
            resources: self.resources.instrumentation(),
            styles: self.styles.owner_snapshot(),
            node_refs: self.node_refs.live_count(),
            reload: self.reload.instrumentation(),
            document: self.document.instrumentation(),
            interaction: self.interaction.owner_snapshot(),
            fault_rules: faults.active_rules,
            fault_trace_events: faults.retained_trace_events,
            dropped_fault_trace_events: faults.dropped_trace_events,
            performance: self.performance.owner_snapshot(),
            tree: self.retired_tree_instrumentation,
            ..UiSessionInstrumentation::default()
        };
        result.tree.nodes = 0;
        for item in &self.returns {
            if let UiReturn::Event { payload, .. } = item {
                result.return_payload_bytes =
                    result.return_payload_bytes.saturating_add(payload.len());
            }
        }
        for root in self.roots.iter().filter_map(|slot| slot.state.as_ref()) {
            accumulate_tree_instrumentation(&mut result.tree, root.tree.instrumentation(), true);
            if let Some(pending) = &root.pending {
                result.pending_presentations = result.pending_presentations.saturating_add(1);
                if let PendingPresentation::Delta { bytes, .. } = pending {
                    result.pending_presentation_bytes = result
                        .pending_presentation_bytes
                        .saturating_add(bytes.len());
                }
            }
            if let Some(inflight) = &root.inflight {
                result.inflight_presentations = result.inflight_presentations.saturating_add(1);
                result.inflight_presentation_bytes = result
                    .inflight_presentation_bytes
                    .saturating_add(presentation_batch_bytes(inflight));
            }
        }
        result
    }

    pub fn leak_summary(&self) -> UiSessionLeakSummary {
        let metrics = self.instrumentation();
        UiSessionLeakSummary {
            roots: metrics.live_roots,
            nodes: metrics.tree.nodes,
            pending_presentations: metrics.pending_presentations,
            inflight_presentations: metrics.inflight_presentations,
            returns: metrics.return_items,
            commands: metrics.commands.pending,
            effects: metrics.asynchronous.pending_effects,
            completions: metrics.asynchronous.completions,
            subscriptions: metrics.asynchronous.subscriptions,
            resources: metrics.resources.live_resources,
            resource_leases: metrics.resources.live_leases,
            resource_fetch_jobs: metrics.resources.fetch_jobs,
            styles: metrics.styles.styles,
            theme_tokens: metrics.styles.theme_tokens,
            root_theme_overrides: metrics.styles.root_overrides,
            node_refs: metrics.node_refs,
            reload_held_items: metrics.reload.held_items,
            document_windows: metrics.document.windows,
            document_effects: metrics.document.pending_effects,
            document_completions: metrics.document.completions,
            interaction_items: metrics
                .interaction
                .clipboard_requests
                .saturating_add(metrics.interaction.clipboard_completions)
                .saturating_add(metrics.interaction.file_reads)
                .saturating_add(metrics.interaction.file_completions)
                .saturating_add(metrics.interaction.drags)
                .saturating_add(metrics.interaction.drag_events)
                .saturating_add(metrics.interaction.forms)
                .saturating_add(metrics.interaction.form_events),
        }
    }

    pub const fn max_presentation_payload_bytes(&self) -> usize {
        if self.config.max_patch_bytes > self.config.max_pending_bytes_per_root {
            self.config.max_patch_bytes
        } else {
            self.config.max_pending_bytes_per_root
        }
    }

    pub fn root_epoch(&self, root: UiRootId) -> Result<u32, UiSessionError> {
        let index = self.root_index(root)?;
        Ok(self.roots[index]
            .state
            .as_ref()
            .expect("validated live root has state")
            .epoch)
    }

    pub fn preflight_attach_roots(&self, count: usize) -> Result<(), UiSessionError> {
        self.require_open()?;
        self.live_roots
            .checked_add(count)
            .filter(|total| *total <= self.config.max_roots)
            .map(|_| ())
            .ok_or(UiSessionError::RootCapacity)
    }

    pub fn attach_root(&mut self) -> Result<UiRootId, UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::SurfaceOperation)?;
        if self.live_roots == self.config.max_roots {
            return Err(UiSessionError::RootCapacity);
        }
        let index = if let Some(index) = self.free_roots.pop() {
            index
        } else {
            let index = self.roots.len() as u32;
            self.roots.push(RootSlot {
                generation: 1,
                state: None,
            });
            index
        };
        let tree = RetainedTree::new(self.config.tree).map_err(UiSessionError::Tree)?;
        let slot = &mut self.roots[index as usize];
        let id = Handle {
            index,
            generation: slot.generation,
        };
        slot.state = Some(RootState {
            epoch: 1,
            last_acked_revision: 0,
            observed_applied_revision: 0,
            desired_revision: self.commit_revision,
            inflight: None,
            pending: None,
            last_return_sequence: 0,
            tree,
        });
        self.live_roots += 1;
        Ok(id)
    }

    pub fn detach_root(&mut self, root: UiRootId) -> Result<RootDetach, UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::SurfaceOperation)?;
        let index = self.root_index(root)?;
        let next_generation = self.roots[index]
            .generation
            .checked_add(1)
            .ok_or(UiSessionError::GenerationExhausted)?;
        self.node_refs
            .preflight_close_root(root)
            .map_err(UiSessionError::NodeRef)?;
        self.interaction
            .preflight_close_root(root)
            .map_err(UiSessionError::Interaction)?;
        let subscription_owners = self
            .async_registry
            .subscription_owners_for_root(root)
            .into_iter()
            .map(|owner| (owner, Vec::new()))
            .collect::<Vec<_>>();
        self.async_registry
            .preflight_subscription_owners(&subscription_owners)
            .map_err(UiSessionError::Async)?;
        let effect_scopes = self.async_registry.effect_scopes_for_root(root);
        self.async_registry
            .preflight_cancel_effect_scopes(&effect_scopes)
            .map_err(UiSessionError::Async)?;
        self.resources
            .release_root(root)
            .map_err(UiSessionError::Resource)?;
        self.node_refs
            .close_root(root)
            .map_err(UiSessionError::NodeRef)?;
        self.interaction
            .close_root(root)
            .map_err(UiSessionError::Interaction)?;
        self.styles.close_root(root);
        if let Some(router) = &mut self.router {
            router.unbind_root(root);
        }
        let command_results = self.commands.restart_root(root);
        let subscription_changes = self
            .async_registry
            .reconcile_subscription_owners(subscription_owners)
            .expect("root subscription cleanup remains valid in serial UiSession detach");
        let cancelled_effect_ids = self
            .async_registry
            .cancel_effect_scopes(&effect_scopes)
            .expect("root effect cleanup remains valid in serial UiSession detach");
        let slot = &mut self.roots[index];
        let state = slot
            .state
            .take()
            .expect("validated live root has retained state");
        accumulate_tree_instrumentation(
            &mut self.retired_tree_instrumentation,
            state.tree.instrumentation(),
            false,
        );
        slot.generation = next_generation;
        self.free_roots.push(root.index);
        self.live_roots -= 1;
        Ok(RootDetach {
            command_results,
            subscription_changes,
            cancelled_effect_ids,
        })
    }

    pub fn shutdown(&mut self) -> Result<UiSessionShutdownReport, UiSessionError> {
        if self.closed {
            return Ok(UiSessionShutdownReport {
                session: self.id,
                detached_roots: Vec::new(),
                remaining_command_results: Vec::new(),
                released_node_refs: 0,
                asynchronous: AsyncReset::default(),
                resources: resource::UiResourceShutdown::default(),
                styles: StyleStoreShutdownReport::default(),
                document: document::DocumentRuntimeShutdown::default(),
                interaction: InteractionOwnerSnapshot::default(),
                discarded_returns: Vec::new(),
                discarded_reload_items: Vec::new(),
                fault_trace: Vec::new(),
                performance: UiPerformanceSnapshot::default(),
                cleared_fault_rules: 0,
                final_leaks: self.leak_summary(),
            });
        }
        self.require_no_injected_fault(UiFaultPoint::Shutdown)?;
        let roots = self
            .roots
            .iter()
            .enumerate()
            .filter_map(|(index, slot)| {
                slot.state.as_ref().map(|_| Handle {
                    index: index as u32,
                    generation: slot.generation,
                })
            })
            .collect::<Vec<_>>();
        for root in &roots {
            let index = self.root_index(*root)?;
            self.roots[index]
                .generation
                .checked_add(1)
                .ok_or(UiSessionError::GenerationExhausted)?;
            self.node_refs
                .preflight_close_root(*root)
                .map_err(UiSessionError::NodeRef)?;
            self.interaction
                .preflight_close_root(*root)
                .map_err(UiSessionError::Interaction)?;
        }
        self.async_registry
            .preflight_reset()
            .map_err(UiSessionError::Async)?;
        self.resources
            .preflight_shutdown()
            .map_err(UiSessionError::Resource)?;

        let fault_trace = self.faults.trace_after(0, usize::MAX).collect();
        let (cleared_fault_rules, _) = self.faults.shutdown();
        let mut detached_roots = Vec::with_capacity(roots.len());
        for root in roots {
            detached_roots.push((root, self.detach_root(root)?));
        }
        let remaining_command_results = self.commands.shutdown();
        let released_node_refs = self.node_refs.shutdown();
        let asynchronous = self
            .async_registry
            .shutdown()
            .map_err(UiSessionError::Async)?;
        let resources = self
            .resources
            .shutdown()
            .map_err(UiSessionError::Resource)?;
        let styles = self.styles.shutdown();
        let document = self.document.shutdown();
        let interaction = self.interaction.shutdown();
        let discarded_returns = self.returns.drain(..).collect();
        let discarded_reload_items = self.reload.shutdown();
        let performance = self.performance.take_snapshot();
        self.router = None;
        self.closed = true;
        let final_leaks = self.leak_summary();
        Ok(UiSessionShutdownReport {
            session: self.id,
            detached_roots,
            remaining_command_results,
            released_node_refs,
            asynchronous,
            resources,
            styles,
            document,
            interaction,
            discarded_returns,
            discarded_reload_items,
            fault_trace,
            performance,
            cleared_fault_rules,
            final_leaks,
        })
    }

    pub fn register_resource(
        &mut self,
        descriptor: UiResourceDescriptor,
    ) -> Result<UiResourceId, UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::ResourceAcquire)?;
        self.resources
            .register(descriptor)
            .map_err(UiSessionError::Resource)
    }

    pub fn preflight_resource_reconcile(
        &self,
        new_descriptors: &[UiResourceDescriptor],
        reloads: &[(UiResourceId, UiResourceDescriptor)],
        existing_acquires: &[(UiRootId, UiResourceId)],
        new_resource_acquires: usize,
        releases: &[UiResourceLease],
        unregisters: &[UiResourceId],
    ) -> Result<(), UiSessionError> {
        for (root, _) in existing_acquires {
            self.root_index(*root)?;
        }
        for lease in releases {
            self.root_index(lease.root)?;
        }
        self.resources
            .preflight_reconcile(
                new_descriptors,
                reloads,
                existing_acquires,
                new_resource_acquires,
                releases,
                unregisters,
            )
            .map_err(UiSessionError::Resource)
    }

    pub fn acquire_resource(
        &mut self,
        root: UiRootId,
        resource: UiResourceId,
        deadline_millis: u64,
    ) -> Result<UiResourceLease, UiSessionError> {
        self.root_index(root)?;
        self.resources
            .acquire(root, resource, deadline_millis)
            .map_err(UiSessionError::Resource)
    }

    pub fn release_resource(&mut self, lease: UiResourceLease) -> Result<(), UiSessionError> {
        self.root_index(lease.root)?;
        self.resources
            .release(lease)
            .map_err(UiSessionError::Resource)
    }

    pub fn unregister_resource(&mut self, resource: UiResourceId) -> Result<(), UiSessionError> {
        self.resources
            .unregister(resource)
            .map_err(UiSessionError::Resource)
    }

    pub fn poll_resource_fetch(&mut self) -> Option<UiResourceFetchWork> {
        self.resources.poll_fetch()
    }

    pub fn complete_resource_fetch(
        &mut self,
        work: &UiResourceFetchWork,
        observed_content_hash: [u8; 32],
        bytes: Vec<u8>,
        metadata: Vec<u8>,
    ) -> Result<UiResourcePublication, UiSessionError> {
        self.resources
            .complete_fetch(work, observed_content_hash, bytes, metadata)
            .map_err(UiSessionError::Resource)
    }

    pub fn fail_resource_fetch(
        &mut self,
        work: &UiResourceFetchWork,
    ) -> Result<(), UiSessionError> {
        self.resources
            .fail_fetch(work)
            .map_err(UiSessionError::Resource)
    }

    pub fn hot_reload_resource(
        &mut self,
        resource: UiResourceId,
        descriptor: UiResourceDescriptor,
        deadline_millis: u64,
    ) -> Result<u64, UiSessionError> {
        self.resources
            .hot_reload(resource, descriptor, deadline_millis)
            .map_err(UiSessionError::Resource)
    }

    pub fn resource_publication(
        &self,
        resource: UiResourceId,
    ) -> Result<UiResourcePublication, UiSessionError> {
        self.resources
            .publication(resource)
            .map_err(UiSessionError::Resource)
    }

    pub fn interaction(&self) -> &InteractionRuntime {
        &self.interaction
    }

    pub fn interaction_mut(&mut self) -> Result<&mut InteractionRuntime, UiSessionError> {
        self.require_open()?;
        Ok(&mut self.interaction)
    }

    pub fn document(&self) -> &DocumentRuntime {
        &self.document
    }

    pub fn document_mut(&mut self) -> Result<&mut DocumentRuntime, UiSessionError> {
        self.require_open()?;
        Ok(&mut self.document)
    }

    pub fn intern_style(
        &mut self,
        properties: StyleProperties,
        states: StateStyles,
    ) -> Result<StyleId, UiSessionError> {
        self.require_open()?;
        self.styles
            .intern(properties, states)
            .map_err(UiSessionError::Style)
    }

    pub fn update_theme(
        &mut self,
        environment: ThemeEnvironment,
        tokens: std::collections::BTreeMap<ThemeToken, StyleProperties>,
    ) -> Result<u64, UiSessionError> {
        self.require_open()?;
        self.styles
            .set_theme(environment, tokens)
            .map_err(UiSessionError::Style)
    }

    pub fn set_root_theme_overrides(
        &mut self,
        root: UiRootId,
        overrides: std::collections::BTreeMap<ThemeToken, StyleProperties>,
    ) -> Result<(), UiSessionError> {
        self.root_index(root)?;
        self.styles
            .set_root_overrides(root, overrides)
            .map_err(UiSessionError::Style)
    }

    pub fn resolve_style(
        &self,
        root: UiRootId,
        defaults: &StyleProperties,
        theme_tokens: &[ThemeToken],
        control_variant: &StyleProperties,
        reusable: StyleId,
        inline: &StyleProperties,
        state: InteractionState,
    ) -> Result<ResolvedStyle, UiSessionError> {
        self.root_index(root)?;
        self.styles
            .resolve(
                root,
                defaults,
                theme_tokens,
                control_variant,
                reusable,
                inline,
                state,
            )
            .map_err(UiSessionError::Style)
    }

    pub fn install_router(
        &mut self,
        config: RouterConfig,
        lease: NavigationLease,
        routes: Vec<RouteSpec>,
    ) -> Result<(), UiSessionError> {
        self.require_open()?;
        let router = Router::new(self.id, config, lease, routes).map_err(UiSessionError::Router)?;
        self.router = Some(router);
        Ok(())
    }

    pub fn router(&self) -> Option<&Router> {
        self.router.as_ref()
    }

    pub fn router_mut(&mut self) -> Option<&mut Router> {
        if self.closed {
            None
        } else {
            self.router.as_mut()
        }
    }

    pub fn reload_driver(&mut self) -> Result<DriverReload, UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::Reload)?;
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        let next_epoch = self
            .app_code_epoch
            .checked_add(1)
            .ok_or(UiSessionError::GenerationExhausted)?;
        self.apply_driver_epoch(next_epoch)
    }

    pub fn begin_transactional_reload(
        &mut self,
        barrier_sequence: u64,
        now_millis: u64,
        deadline_millis: u64,
    ) -> Result<(), UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::Reload)?;
        let effects = self
            .async_registry
            .active_reload_effects()
            .into_iter()
            .map(|(effect_id, kind, transferable)| ActiveReloadEffect {
                effect_id,
                kind,
                transferable,
            })
            .collect::<Vec<_>>();
        self.reload
            .begin(
                self.app_code_epoch,
                barrier_sequence,
                now_millis,
                deadline_millis,
                &effects,
            )
            .map_err(UiSessionError::Reload)
    }

    pub fn hold_reload_item(
        &mut self,
        item: HeldItem,
        now_millis: u64,
    ) -> Result<(), UiSessionError> {
        self.require_open()?;
        self.reload
            .hold(item, now_millis)
            .map_err(UiSessionError::Reload)
    }

    pub fn hold_reload_item_or_rollback(
        &mut self,
        item: HeldItem,
        now_millis: u64,
    ) -> Result<ReloadHoldOutcome, UiSessionError> {
        self.require_open()?;
        self.reload
            .hold_or_rollback(item, now_millis)
            .map_err(UiSessionError::Reload)
    }

    pub fn install_reload_candidate(
        &mut self,
        candidate: ReloadCandidate,
        now_millis: u64,
    ) -> Result<(), UiSessionError> {
        self.require_open()?;
        self.reload
            .install_candidate(candidate, now_millis)
            .map_err(UiSessionError::Reload)
    }

    pub fn abort_transactional_reload(&mut self) -> Result<Vec<HeldItem>, UiSessionError> {
        self.require_open()?;
        self.reload.abort().map_err(UiSessionError::Reload)
    }

    pub fn abort_transactional_reload_and_restore(
        &mut self,
        reason: ReloadError,
    ) -> Result<ReloadRollback, UiSessionError> {
        self.require_open()?;
        let held = self.reload.abort().map_err(UiSessionError::Reload)?;
        self.restore_reload_items(reason, held)
    }

    pub fn next_reload_deadline_millis(&self) -> Option<u64> {
        self.reload
            .next_precommit_deadline_millis()
            .or_else(|| self.reload.next_snapshot_ack_deadline_millis())
    }

    pub fn service_reload_deadline(&mut self, now_millis: u64) -> Option<Vec<HeldItem>> {
        self.reload.expire_precommit(now_millis)
    }

    pub fn service_reload_deadline_and_restore(
        &mut self,
        now_millis: u64,
    ) -> Result<Option<ReloadRollback>, UiSessionError> {
        self.require_open()?;
        let Some(held) = self.reload.expire_precommit(now_millis) else {
            return Ok(None);
        };
        self.restore_reload_items(ReloadError::DeadlineExpired, held)
            .map(Some)
    }

    pub fn commit_transactional_reload(
        &mut self,
        now_millis: u64,
    ) -> Result<TransactionalDriverReload, UiSessionError> {
        if self.reload.active_epoch() != Some(self.app_code_epoch) {
            return Err(UiSessionError::Reload(ReloadError::StaleEpoch));
        }
        self.async_registry
            .preflight_reset()
            .map_err(UiSessionError::Async)?;
        let commit = self
            .reload
            .commit(now_millis)
            .map_err(UiSessionError::Reload)?;
        let cleanup = self.apply_driver_epoch(commit.new_app_code_epoch)?;
        Ok(TransactionalDriverReload { commit, cleanup })
    }

    pub fn acknowledge_app_reload_snapshot(
        &mut self,
        owner: &mut AppOwner,
        app_code_epoch: u64,
    ) -> Result<Vec<HeldItem>, UiSessionError> {
        if owner.session() != self.id || !owner.has_pinned_reload_state() {
            return Err(UiSessionError::WrongSession);
        }
        let held = self
            .reload
            .snapshot_ack(app_code_epoch)
            .map_err(UiSessionError::Reload)?;
        owner
            .release_pinned_reload_state()
            .map_err(UiSessionError::App)?;
        Ok(held)
    }

    pub fn service_app_reload_snapshot_deadline(
        &mut self,
        owner: &mut AppOwner,
        now_millis: u64,
    ) -> Result<Option<AppReloadRecovery>, UiSessionError> {
        let expired = self
            .reload
            .next_snapshot_ack_deadline_millis()
            .is_some_and(|deadline| now_millis >= deadline);
        if !expired {
            return Ok(None);
        }
        if owner.session() != self.id || !owner.has_pinned_reload_state() {
            return Err(UiSessionError::WrongSession);
        }
        let Some((app_code_epoch, stale_items)) = self.reload.expire_snapshot_ack(now_millis)
        else {
            return Ok(None);
        };
        owner
            .release_pinned_reload_state()
            .map_err(UiSessionError::App)?;
        Ok(Some(AppReloadRecovery {
            app_code_epoch,
            stale_items,
        }))
    }

    pub fn reload_phase(&self) -> ReloadPhase {
        self.reload.phase()
    }

    pub fn commit_app_reload(
        &mut self,
        owner: &mut AppOwner,
        prepared: PreparedAppReload,
        now_millis: u64,
    ) -> Result<AppReloadCommit, UiSessionError> {
        let result = self.commit_app_reload_candidate(owner, prepared, now_millis);
        if result.is_err()
            && matches!(
                self.reload.phase(),
                ReloadPhase::Holding | ReloadPhase::CandidateReady
            )
        {
            let held = self.reload.abort().map_err(UiSessionError::Reload)?;
            self.restore_reload_items(ReloadError::CandidateRejected, held)?;
        }
        result
    }

    fn commit_app_reload_candidate(
        &mut self,
        owner: &mut AppOwner,
        prepared: PreparedAppReload,
        now_millis: u64,
    ) -> Result<AppReloadCommit, UiSessionError> {
        if owner.session() != self.id {
            return Err(UiSessionError::WrongSession);
        }
        owner
            .preflight_commit_reload(&prepared)
            .map_err(UiSessionError::App)?;
        if prepared.views.len() != self.live_roots {
            return Err(UiSessionError::InvalidRoot);
        }
        let mut seen = BTreeSet::new();
        for (root, _) in &prepared.views {
            self.root_index(*root)?;
            if !seen.insert(*root) {
                return Err(UiSessionError::DuplicateRootPatch);
            }
        }
        self.async_registry
            .preflight_subscriptions(&prepared.subscriptions)
            .map_err(UiSessionError::Async)?;
        self.install_reload_candidate(prepared.reload_candidate(), now_millis)?;
        let views = prepared
            .views
            .iter()
            .map(|(root, view)| RootView {
                root: *root,
                view: view.clone(),
            })
            .collect();
        let view_commit = self.commit_views(views)?;
        let driver_reload = self.commit_transactional_reload(now_millis)?;
        let subscription_changes = self
            .async_registry
            .reconcile_subscriptions(prepared.subscriptions.clone())
            .map_err(UiSessionError::Async)?;
        owner.commit_reload(prepared).map_err(UiSessionError::App)?;
        Ok(AppReloadCommit {
            view_commit,
            driver_reload,
            subscription_changes,
        })
    }

    fn apply_driver_epoch(&mut self, next_epoch: u64) -> Result<DriverReload, UiSessionError> {
        let expected_epoch = self
            .app_code_epoch
            .checked_add(1)
            .ok_or(UiSessionError::GenerationExhausted)?;
        if next_epoch != expected_epoch {
            return Err(UiSessionError::StaleAppCodeEpoch);
        }
        let roots = self
            .roots
            .iter()
            .enumerate()
            .filter_map(|(index, slot)| {
                slot.state.as_ref().map(|_| Handle {
                    index: index as u32,
                    generation: slot.generation,
                })
            })
            .collect::<Vec<_>>();
        let async_reset = self.async_registry.reset().map_err(UiSessionError::Async)?;
        let mut command_results = Vec::new();
        for root in roots {
            self.node_refs.renderer_restart(root);
            command_results.extend(self.commands.restart_root(root));
        }
        self.app_code_epoch = next_epoch;
        for slot in &mut self.roots {
            let Some(root) = slot.state.as_mut() else {
                continue;
            };
            root.inflight = None;
            root.pending = Some(PendingPresentation::SnapshotRequired {
                revision: root.desired_revision,
            });
            root.last_return_sequence = 0;
        }
        self.returns.clear();
        Ok(DriverReload {
            command_results,
            async_reset,
        })
    }

    pub fn restart_renderer(&mut self, root: UiRootId) -> Result<RendererRestart, UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::DeviceOperation)?;
        self.require_no_injected_fault(UiFaultPoint::RendererOperation)?;
        let index = self.root_index(root)?;
        let next_epoch = self.roots[index]
            .state
            .as_ref()
            .unwrap()
            .epoch
            .checked_add(1)
            .ok_or(UiSessionError::GenerationExhausted)?;
        self.node_refs.renderer_restart(root);
        let command_results = self.commands.restart_root(root);
        let state = self.root_mut(root)?;
        state.epoch = next_epoch;
        state.inflight = None;
        state.pending = Some(PendingPresentation::SnapshotRequired {
            revision: state.desired_revision,
        });
        state.observed_applied_revision = 0;
        state.last_return_sequence = 0;
        Ok(RendererRestart {
            ui_root_epoch: state.epoch,
            command_results,
        })
    }

    #[cfg(test)]
    pub(crate) fn commit(&mut self, patches: Vec<RootPatch>) -> Result<u64, UiSessionError> {
        let mut roots = BTreeSet::new();
        for patch in &patches {
            self.root_index(patch.root)?;
            if !roots.insert(patch.root) {
                return Err(UiSessionError::DuplicateRootPatch);
            }
            if patch.bytes.len() > self.config.max_patch_bytes {
                return Err(UiSessionError::PatchTooLarge);
            }
        }
        let revision = self
            .commit_revision
            .checked_add(1)
            .ok_or(UiSessionError::RevisionExhausted)?;
        for patch in patches {
            let max_pending = self.config.max_pending_bytes_per_root;
            let root = self.root_mut(patch.root)?;
            root.desired_revision = revision;
            merge_pending(root, revision, patch.bytes, max_pending);
        }
        self.commit_revision = revision;
        Ok(revision)
    }

    pub fn commit_views(&mut self, views: Vec<RootView>) -> Result<ViewCommit, UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::PresentationQueue)?;
        let mut roots = BTreeSet::new();
        let mut prepared =
            Vec::<(UiRootId, PreparedReconcile, UiTransaction, Option<Vec<u8>>)>::new();
        let mut has_changes = false;
        for root_view in &views {
            if !roots.insert(root_view.root) {
                return Err(UiSessionError::DuplicateRootPatch);
            }
            let index = self.root_index(root_view.root)?;
            let tree = &self.roots[index].state.as_ref().unwrap().tree;
            let next = tree
                .prepare_reconcile(&root_view.view)
                .map_err(UiSessionError::Tree)?;
            let transaction = next.transaction().clone();
            let bytes = if transaction.patches.is_empty() {
                None
            } else {
                has_changes = true;
                Some(
                    encode_ui_transaction(&transaction, self.config.max_patch_bytes)
                        .ok_or(UiSessionError::PatchTooLarge)?,
                )
            };
            prepared.push((root_view.root, next, transaction, bytes));
        }
        let commit_revision = if has_changes {
            self.commit_revision
                .checked_add(1)
                .ok_or(UiSessionError::RevisionExhausted)?
        } else {
            self.commit_revision
        };

        let transactions = prepared
            .iter()
            .map(|(root, _, transaction, _)| (*root, transaction.clone()))
            .collect::<Vec<_>>();
        let mut removed_by_root = BTreeMap::<UiRootId, BTreeSet<NodeId>>::new();
        for (root, _, transaction, _) in &prepared {
            let index = self.root_index(*root)?;
            let tree = &self.roots[index].state.as_ref().unwrap().tree;
            let removed = removed_by_root.entry(*root).or_default();
            for patch in &transaction.patches {
                if let UiPatch::Remove { node } = patch {
                    removed.extend(tree.subtree_nodes(*node).map_err(UiSessionError::Tree)?);
                }
            }
            self.node_refs
                .preflight_unbind_nodes(*root, removed)
                .map_err(UiSessionError::NodeRef)?;
        }
        for (root, next, _, bytes) in prepared {
            let max_pending = self.config.max_pending_bytes_per_root;
            let state = self.root_mut(root)?;
            state
                .tree
                .apply_prepared(next)
                .expect("prepared tree remains owned by the same serial UiSession root");
            if let Some(bytes) = bytes {
                state.desired_revision = commit_revision;
                merge_pending(state, commit_revision, bytes, max_pending);
            }
            if let Some(removed) = removed_by_root.get(&root) {
                self.node_refs.unbind_nodes(root, removed);
            }
        }
        self.commit_revision = commit_revision;
        Ok(ViewCommit {
            commit_revision,
            transactions,
        })
    }

    pub fn commit_binding_changes(&mut self, root: UiRootId) -> Result<u64, UiSessionError> {
        self.commit_binding_changes_for_roots(vec![root])
    }

    pub fn commit_binding_changes_for_roots(
        &mut self,
        roots: Vec<UiRootId>,
    ) -> Result<u64, UiSessionError> {
        let mut unique = BTreeSet::new();
        if roots.is_empty() || roots.iter().any(|root| !unique.insert(*root)) {
            return Err(UiSessionError::DuplicateRootPatch);
        }
        let revision = self
            .commit_revision
            .checked_add(1)
            .ok_or(UiSessionError::RevisionExhausted)?;
        let mut encoded = Vec::with_capacity(roots.len());
        for root in roots {
            let index = self.root_index(root)?;
            let state = self.roots[index].state.as_ref().unwrap();
            let transaction = UiTransaction {
                base_revision: state.desired_revision,
                new_revision: revision,
                root: state.tree.root_node().map_err(UiSessionError::Tree)?,
                patches: Vec::new(),
            };
            let bytes = encode_ui_transaction(&transaction, self.config.max_patch_bytes)
                .ok_or(UiSessionError::PatchTooLarge)?;
            encoded.push((root, bytes));
        }
        for (root, bytes) in encoded {
            let max_pending = self.config.max_pending_bytes_per_root;
            let state = self.root_mut(root)?;
            state.desired_revision = revision;
            merge_pending(state, revision, bytes, max_pending);
        }
        self.commit_revision = revision;
        Ok(revision)
    }

    fn commit_prepared_builds(
        &mut self,
        builds: &[PreparedBuild],
        subscriptions: Option<&PreparedSubscriptionUpdate>,
    ) -> Result<(ViewCommit, Vec<SubscriptionChange>, Vec<u64>), UiSessionError> {
        let mut grouped = BTreeMap::<UiRootId, Vec<&PreparedBuild>>::new();
        for build in builds {
            let root = build_root(build);
            self.root_index(root)?;
            grouped.entry(root).or_default().push(build);
        }
        let mut prepared =
            Vec::<(UiRootId, PreparedReconcile, UiTransaction, Option<Vec<u8>>)>::new();
        let mut has_changes = false;
        for (root, root_builds) in grouped {
            let index = self.root_index(root)?;
            let tree = &self.roots[index].state.as_ref().unwrap().tree;
            let next = if root_builds.len() == 1 {
                match root_builds[0].request {
                    BuildRequest::Root(request_root) if request_root == root => tree
                        .prepare_reconcile(&root_builds[0].view)
                        .map_err(UiSessionError::Tree)?,
                    BuildRequest::Scope { scope, .. } if scope.root == root => tree
                        .prepare_reconcile_scope(
                            scope.path_hash,
                            scope.generation,
                            &root_builds[0].view,
                        )
                        .map_err(UiSessionError::Tree)?,
                    _ => return Err(UiSessionError::App(AppOwnerError::InvalidScope)),
                }
            } else {
                let mut scopes = Vec::with_capacity(root_builds.len());
                for build in root_builds {
                    let BuildRequest::Scope { scope, .. } = build.request else {
                        return Err(UiSessionError::App(AppOwnerError::InvalidScope));
                    };
                    if scope.root != root {
                        return Err(UiSessionError::App(AppOwnerError::InvalidScope));
                    }
                    scopes.push((scope.path_hash, scope.generation, build.view.clone()));
                }
                tree.prepare_reconcile_scopes(&scopes)
                    .map_err(UiSessionError::Tree)?
            };
            let transaction = next.transaction().clone();
            let bytes = if transaction.patches.is_empty() {
                None
            } else {
                has_changes = true;
                Some(
                    encode_ui_transaction(&transaction, self.config.max_patch_bytes)
                        .ok_or(UiSessionError::PatchTooLarge)?,
                )
            };
            prepared.push((root, next, transaction, bytes));
        }
        let commit_revision = if has_changes {
            self.commit_revision
                .checked_add(1)
                .ok_or(UiSessionError::RevisionExhausted)?
        } else {
            self.commit_revision
        };
        let transactions = prepared
            .iter()
            .map(|(root, _, transaction, _)| (*root, transaction.clone()))
            .collect::<Vec<_>>();
        let mut removed_by_root = BTreeMap::<UiRootId, BTreeSet<NodeId>>::new();
        let mut removed_subscription_owners = BTreeSet::new();
        for (root, _, transaction, _) in &prepared {
            let index = self.root_index(*root)?;
            let tree = &self.roots[index].state.as_ref().unwrap().tree;
            let removed = removed_by_root.entry(*root).or_default();
            for patch in &transaction.patches {
                if let UiPatch::Remove { node } = patch {
                    removed.extend(tree.subtree_nodes(*node).map_err(UiSessionError::Tree)?);
                }
            }
            for node in removed.iter().copied() {
                let (path_hash, generation) = tree
                    .node_scope_identity(node)
                    .map_err(UiSessionError::Tree)?;
                removed_subscription_owners.insert(async_runtime::SubscriptionOwner::Scope {
                    root: *root,
                    path_hash,
                    generation,
                });
            }
            self.node_refs
                .preflight_unbind_nodes(*root, removed)
                .map_err(UiSessionError::NodeRef)?;
        }
        let effective_subscriptions =
            effective_subscription_update(subscriptions, &removed_subscription_owners);
        let removed_effect_scopes = removed_subscription_owners
            .iter()
            .filter_map(|owner| match owner {
                async_runtime::SubscriptionOwner::Scope {
                    root,
                    path_hash,
                    generation,
                } => Some(async_runtime::EffectScope::Scope {
                    root: *root,
                    path_hash: *path_hash,
                    generation: *generation,
                }),
                _ => None,
            })
            .collect::<BTreeSet<_>>();
        match &effective_subscriptions {
            EffectiveSubscriptionUpdate::Unchanged => {}
            EffectiveSubscriptionUpdate::ReplaceAll(desired) => {
                self.async_registry
                    .preflight_subscriptions(desired)
                    .map_err(UiSessionError::Async)?;
            }
            EffectiveSubscriptionUpdate::Owners(owners) => {
                self.async_registry
                    .preflight_subscription_owners(owners)
                    .map_err(UiSessionError::Async)?;
            }
        }
        self.async_registry
            .preflight_cancel_effect_scopes(&removed_effect_scopes)
            .map_err(UiSessionError::Async)?;
        for (root, next, _, bytes) in prepared {
            let max_pending = self.config.max_pending_bytes_per_root;
            let state = self.root_mut(root)?;
            state
                .tree
                .apply_prepared(next)
                .expect("prepared scope tree remains owned by the same serial UiSession root");
            if let Some(bytes) = bytes {
                state.desired_revision = commit_revision;
                merge_pending(state, commit_revision, bytes, max_pending);
            }
            if let Some(removed) = removed_by_root.get(&root) {
                self.node_refs.unbind_nodes(root, removed);
            }
        }
        self.commit_revision = commit_revision;
        let subscription_changes = match effective_subscriptions {
            EffectiveSubscriptionUpdate::Unchanged => Vec::new(),
            EffectiveSubscriptionUpdate::ReplaceAll(desired) => self
                .async_registry
                .reconcile_subscriptions(desired)
                .expect("subscription replacement remains valid in serial UiSession commit"),
            EffectiveSubscriptionUpdate::Owners(owners) => self
                .async_registry
                .reconcile_subscription_owners(owners)
                .expect("subscription owner diff remains valid in serial UiSession commit"),
        };
        let cancelled_effect_ids = self
            .async_registry
            .cancel_effect_scopes(&removed_effect_scopes)
            .expect("scope effect cleanup remains valid in serial UiSession commit");
        Ok((
            ViewCommit {
                commit_revision,
                transactions,
            },
            subscription_changes,
            cancelled_effect_ids,
        ))
    }

    pub fn node_scope_id(&self, root: UiRootId, node: NodeId) -> Result<ScopeId, UiSessionError> {
        let index = self.root_index(root)?;
        let (path_hash, generation) = self.roots[index]
            .state
            .as_ref()
            .unwrap()
            .tree
            .node_scope_identity(node)
            .map_err(UiSessionError::Tree)?;
        Ok(ScopeId {
            root,
            path_hash,
            generation,
        })
    }

    pub fn resolve_candidate_scope_ids(
        &self,
        root: UiRootId,
        view: &ViewNode,
        paths: &[Vec<usize>],
    ) -> Result<Vec<ScopeId>, UiSessionError> {
        let index = self.root_index(root)?;
        let tree = &self.roots[index].state.as_ref().unwrap().tree;
        let prepared = tree.prepare_reconcile(view).map_err(UiSessionError::Tree)?;
        paths
            .iter()
            .map(|path| {
                let (path_hash, generation) = prepared
                    .resolve_child_scope_identity(tree, path)
                    .map_err(UiSessionError::Tree)?;
                Ok(ScopeId {
                    root,
                    path_hash,
                    generation,
                })
            })
            .collect()
    }

    pub fn resolve_candidate_node_ids(
        &self,
        root: UiRootId,
        view: &ViewNode,
        paths: &[Vec<usize>],
    ) -> Result<Vec<NodeId>, UiSessionError> {
        let index = self.root_index(root)?;
        let tree = &self.roots[index].state.as_ref().unwrap().tree;
        let prepared = tree.prepare_reconcile(view).map_err(UiSessionError::Tree)?;
        paths
            .iter()
            .map(|path| {
                prepared
                    .resolve_child_node(tree, path)
                    .map_err(UiSessionError::Tree)
            })
            .collect()
    }

    pub fn preflight_target_binding_reconcile(
        &self,
        root: UiRootId,
        event_removals: &[EventToken],
        event_additions: &[String],
        new_refs: usize,
        rebound_refs: &[UiNodeRef],
        released_refs: &[UiNodeRef],
    ) -> Result<(), UiSessionError> {
        let index = self.root_index(root)?;
        let tree = &self.roots[index].state.as_ref().unwrap().tree;
        let event_names = event_additions
            .iter()
            .map(String::as_str)
            .collect::<Vec<_>>();
        tree.preflight_event_reconcile(event_removals, &event_names)
            .map_err(UiSessionError::Tree)?;
        self.node_refs
            .preflight_create(new_refs)
            .map_err(UiSessionError::NodeRef)?;
        for reference in rebound_refs {
            if reference.root() != root {
                return Err(UiSessionError::InvalidRoot);
            }
            self.node_refs
                .preflight_bind(*reference)
                .map_err(UiSessionError::NodeRef)?;
        }
        for reference in released_refs {
            if reference.root() != root {
                return Err(UiSessionError::InvalidRoot);
            }
            self.node_refs
                .preflight_close(*reference)
                .map_err(UiSessionError::NodeRef)?;
        }
        Ok(())
    }

    pub fn commit_app_transaction(
        &mut self,
        owner: &mut AppOwner,
        prepared: &AppPreparedTransaction,
    ) -> Result<AppTransactionCommit, UiSessionError> {
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        if owner.session() != self.id {
            return Err(UiSessionError::WrongSession);
        }
        owner
            .preflight_commit(prepared)
            .map_err(UiSessionError::App)?;
        for build in &prepared.builds {
            self.root_index(build_root(build))?;
        }
        let effect_preflight = prepared
            .effects
            .iter()
            .map(|effect| (effect.kind.clone(), effect.payload.len()))
            .collect::<Vec<_>>();
        self.async_registry
            .preflight_effect_batch(self.app_code_epoch, &effect_preflight)
            .map_err(UiSessionError::Async)?;
        let (view_commit, subscription_changes, cancelled_effect_ids) =
            self.commit_prepared_builds(&prepared.builds, prepared.subscriptions.as_ref())?;
        let effects = prepared
            .effects
            .iter()
            .map(|effect| {
                (
                    effect.kind.clone(),
                    effect.executor,
                    effect.scope,
                    effect.deadline_millis,
                    effect.payload.clone(),
                    effect.transferable_across_reload,
                )
            })
            .collect();
        let effect_ids = self
            .async_registry
            .begin_effect_batch(self.app_code_epoch, effects)
            .map_err(UiSessionError::Async)?;
        owner.commit(prepared).map_err(UiSessionError::App)?;
        Ok(AppTransactionCommit {
            view_commit,
            effect_ids,
            subscription_changes,
            cancelled_effect_ids,
        })
    }

    #[cfg(test)]
    pub(crate) fn reconcile_root(
        &mut self,
        root: UiRootId,
        view: &ViewNode,
    ) -> Result<UiTransaction, UiSessionError> {
        let mut transactions = self.reconcile_roots(vec![RootView {
            root,
            view: view.clone(),
        }])?;
        Ok(transactions.pop().unwrap())
    }

    #[cfg(test)]
    pub(crate) fn reconcile_roots(
        &mut self,
        views: Vec<RootView>,
    ) -> Result<Vec<UiTransaction>, UiSessionError> {
        let mut roots = BTreeSet::new();
        let mut prepared = Vec::<(UiRootId, PreparedReconcile)>::with_capacity(views.len());
        for root_view in &views {
            if !roots.insert(root_view.root) {
                return Err(UiSessionError::DuplicateRootPatch);
            }
            let index = self.root_index(root_view.root)?;
            let tree = &self.roots[index].state.as_ref().unwrap().tree;
            prepared.push((
                root_view.root,
                tree.prepare_reconcile(&root_view.view)
                    .map_err(UiSessionError::Tree)?,
            ));
        }
        let transactions = prepared
            .iter()
            .map(|(_, prepared)| prepared.transaction().clone())
            .collect::<Vec<_>>();
        for (root, prepared) in prepared {
            self.root_mut(root)?
                .tree
                .apply_prepared(prepared)
                .map_err(UiSessionError::Tree)?;
        }
        Ok(transactions)
    }

    pub fn node_ref(&mut self, root: UiRootId, node: Handle) -> Result<UiNodeRef, UiSessionError> {
        let index = self.root_index(root)?;
        self.roots[index]
            .state
            .as_ref()
            .unwrap()
            .tree
            .node_ref(node)
            .map_err(UiSessionError::Tree)?;
        let reference = self
            .node_refs
            .create(root)
            .map_err(UiSessionError::NodeRef)?;
        self.node_refs
            .bind(reference, node)
            .map_err(UiSessionError::NodeRef)?;
        Ok(reference)
    }

    pub fn resolve_node_path(
        &self,
        root: UiRootId,
        path: &[usize],
    ) -> Result<NodeId, UiSessionError> {
        let index = self.root_index(root)?;
        self.roots[index]
            .state
            .as_ref()
            .unwrap()
            .tree
            .resolve_child_path(path)
            .map_err(UiSessionError::Tree)
    }

    pub fn bind_event_node(
        &mut self,
        root: UiRootId,
        node: NodeId,
        event: &str,
    ) -> Result<EventToken, UiSessionError> {
        self.root_mut(root)?
            .tree
            .bind_event(node, event)
            .map_err(UiSessionError::Tree)
    }

    pub fn unbind_event(
        &mut self,
        root: UiRootId,
        token: EventToken,
    ) -> Result<(), UiSessionError> {
        self.root_mut(root)?
            .tree
            .unbind_event(token)
            .map_err(UiSessionError::Tree)
    }

    pub fn bind_node_ref(
        &mut self,
        reference: UiNodeRef,
        node: NodeId,
    ) -> Result<u32, UiSessionError> {
        let index = self.root_index(reference.root())?;
        self.roots[index]
            .state
            .as_ref()
            .unwrap()
            .tree
            .node_ref(node)
            .map_err(UiSessionError::Tree)?;
        self.node_refs
            .bind(reference, node)
            .map_err(UiSessionError::NodeRef)
    }

    pub fn resolve_node_ref(
        &self,
        reference: UiNodeRef,
    ) -> Result<ResolvedNodeRef, UiSessionError> {
        self.node_refs
            .resolve(reference)
            .map_err(UiSessionError::NodeRef)
    }

    pub fn release_node_ref(&mut self, reference: UiNodeRef) -> Result<(), UiSessionError> {
        self.node_refs
            .close(reference)
            .map_err(UiSessionError::NodeRef)
    }

    pub fn bind_event(
        &mut self,
        reference: UiNodeRef,
        event: &str,
    ) -> Result<EventToken, UiSessionError> {
        if reference.session() != self.id {
            return Err(UiSessionError::WrongSession);
        }
        let resolved = self
            .node_refs
            .resolve(reference)
            .map_err(UiSessionError::NodeRef)?;
        self.root_mut(reference.root())?
            .tree
            .bind_event(resolved.node, event)
            .map_err(UiSessionError::Tree)
    }

    pub fn begin_command(
        &mut self,
        target: UiNodeRef,
        kind: String,
        payload: Vec<u8>,
    ) -> Result<u64, UiSessionError> {
        self.begin_command_with_deadline(target, kind, payload, u64::MAX)
    }

    pub fn begin_command_with_deadline(
        &mut self,
        target: UiNodeRef,
        kind: String,
        payload: Vec<u8>,
        deadline_millis: u64,
    ) -> Result<u64, UiSessionError> {
        if target.session() != self.id {
            return Err(UiSessionError::WrongSession);
        }
        let resolved = self
            .node_refs
            .resolve(target)
            .map_err(UiSessionError::NodeRef)?;
        let index = self.root_index(target.root())?;
        let state = self.roots[index].state.as_ref().unwrap();
        state
            .tree
            .node_ref(resolved.node)
            .map_err(UiSessionError::Tree)?;
        self.commands
            .begin(
                target.root(),
                state.epoch,
                self.app_code_epoch,
                target.handle(),
                resolved.node,
                resolved.binding_generation,
                state.tree.revision(),
                deadline_millis,
                kind,
                payload,
            )
            .map_err(UiSessionError::Command)
    }

    pub fn poll_command(&mut self) -> Option<UiCommand> {
        self.commands.poll()
    }

    pub fn cancel_command(&mut self, command_id: u64) -> Result<UiCommandResult, UiSessionError> {
        self.commands
            .cancel(command_id)
            .map_err(UiSessionError::Command)
    }

    pub fn begin_effect(&mut self, kind: String, payload: Vec<u8>) -> Result<u64, UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::WorkerDispatch)?;
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        self.async_registry
            .begin_effect(self.app_code_epoch, kind, payload)
            .map_err(UiSessionError::Async)
    }

    pub fn preflight_target_async(
        &self,
        effects: &[(String, usize)],
        subscriptions: &[SubscriptionSpec],
    ) -> Result<(), UiSessionError> {
        self.async_registry
            .preflight_effect_batch(self.app_code_epoch, effects)
            .map_err(UiSessionError::Async)?;
        self.async_registry
            .preflight_subscriptions(subscriptions)
            .map_err(UiSessionError::Async)?;
        Ok(())
    }

    pub fn commit_target_async(
        &mut self,
        effects: Vec<(String, EffectExecutor, EffectScope, u64, Vec<u8>, bool)>,
        subscriptions: Vec<SubscriptionSpec>,
    ) -> Result<(Vec<u64>, Vec<SubscriptionChange>), UiSessionError> {
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        let effect_ids = self
            .async_registry
            .begin_effect_batch(self.app_code_epoch, effects)
            .map_err(UiSessionError::Async)?;
        let changes = self
            .async_registry
            .reconcile_subscriptions(subscriptions)
            .map_err(UiSessionError::Async)?;
        Ok((effect_ids, changes))
    }

    pub fn commit_target_view_and_subscriptions(
        &mut self,
        root: UiRootId,
        view: ViewNode,
        subscriptions: TargetSubscriptionCommit,
    ) -> Result<(ViewCommit, Vec<SubscriptionChange>, Vec<u64>), UiSessionError> {
        self.commit_target_views_and_subscriptions(vec![RootView { root, view }], subscriptions)
    }

    pub fn commit_target_views_and_subscriptions(
        &mut self,
        views: Vec<RootView>,
        subscriptions: TargetSubscriptionCommit,
    ) -> Result<(ViewCommit, Vec<SubscriptionChange>, Vec<u64>), UiSessionError> {
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        let subscriptions = match subscriptions {
            TargetSubscriptionCommit::Unchanged => None,
            TargetSubscriptionCommit::ReplaceAll(subscriptions) => {
                Some(PreparedSubscriptionUpdate::ReplaceAll(subscriptions))
            }
            TargetSubscriptionCommit::Owners(owners) => {
                Some(PreparedSubscriptionUpdate::Owners(owners))
            }
        };
        let builds = views
            .into_iter()
            .map(|view| PreparedBuild {
                request: BuildRequest::Root(view.root),
                view: view.view,
            })
            .collect::<Vec<_>>();
        self.commit_prepared_builds(&builds, subscriptions.as_ref())
    }

    pub fn begin_target_effects(
        &mut self,
        effects: Vec<(String, EffectExecutor, EffectScope, u64, Vec<u8>, bool)>,
    ) -> Result<Vec<u64>, UiSessionError> {
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        self.async_registry
            .begin_effect_batch(self.app_code_epoch, effects)
            .map_err(UiSessionError::Async)
    }

    pub fn begin_transferable_effect(
        &mut self,
        kind: String,
        payload: Vec<u8>,
    ) -> Result<u64, UiSessionError> {
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        self.async_registry
            .begin_effect_with_reload_policy(self.app_code_epoch, kind, payload, true)
            .map_err(UiSessionError::Async)
    }

    pub fn poll_effect(&mut self) -> Option<EffectRequest> {
        self.async_registry.poll_effect()
    }

    pub fn expire_effects(&mut self, now_millis: u64) -> Result<Vec<u64>, UiSessionError> {
        self.async_registry
            .expire_effects(now_millis)
            .map_err(UiSessionError::Async)
    }

    pub fn complete_effect(
        &mut self,
        effect_id: u64,
        app_code_epoch: u64,
        outcome: EffectOutcome,
    ) -> Result<(), UiSessionError> {
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        self.async_registry
            .complete_effect(effect_id, app_code_epoch, outcome)
            .map_err(UiSessionError::Async)
    }

    pub fn complete_effect_during_reload(
        &mut self,
        effect_id: u64,
        app_code_epoch: u64,
        outcome: EffectOutcome,
        sequence: u64,
        now_millis: u64,
    ) -> Result<(), UiSessionError> {
        let prospective = HeldItem {
            sequence,
            app_code_epoch,
            payload: HeldPayload::EffectCompletion(EffectCompletion {
                effect_id,
                app_code_epoch,
                outcome: outcome.clone(),
            }),
        };
        self.reload
            .preflight_hold(&prospective, now_millis)
            .map_err(UiSessionError::Reload)?;
        self.async_registry
            .complete_effect(effect_id, app_code_epoch, outcome)
            .map_err(UiSessionError::Async)?;
        let completion = self
            .async_registry
            .take_completion(effect_id)
            .ok_or(UiSessionError::Async(AsyncError::UnknownEffect))?;
        self.reload
            .hold(
                HeldItem {
                    sequence,
                    app_code_epoch,
                    payload: HeldPayload::EffectCompletion(completion),
                },
                now_millis,
            )
            .map_err(UiSessionError::Reload)
    }

    pub fn drain_effect_completions(&mut self) -> Result<Vec<EffectCompletion>, UiSessionError> {
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        Ok(self.async_registry.drain_completions())
    }

    pub fn reconcile_subscriptions(
        &mut self,
        desired: Vec<SubscriptionSpec>,
    ) -> Result<Vec<SubscriptionChange>, UiSessionError> {
        self.async_registry
            .reconcile_subscriptions(desired)
            .map_err(UiSessionError::Async)
    }

    pub fn poll_presentation(
        &mut self,
        root: UiRootId,
    ) -> Result<Option<PresentationBatch>, UiSessionError> {
        let app_code_epoch = self.app_code_epoch;
        let max_snapshot_bytes = self.config.max_pending_bytes_per_root;
        let state = self.root_mut(root)?;
        if state.inflight.is_some() {
            return Ok(None);
        }
        let Some(pending) = state.pending.take() else {
            return Ok(None);
        };
        let batch = match pending {
            PendingPresentation::Delta {
                base_revision,
                new_revision,
                bytes,
            } => PresentationBatch::Patch {
                root,
                ui_root_epoch: state.epoch,
                app_code_epoch,
                base_revision,
                new_revision,
                bytes,
            },
            PendingPresentation::SnapshotRequired { revision } => {
                let bytes = if let Some(transaction) = state.tree.snapshot_transaction() {
                    if transaction.new_revision != revision {
                        return Err(UiSessionError::AckRevisionMismatch);
                    }
                    encode_ui_transaction(&transaction, max_snapshot_bytes)
                        .ok_or(UiSessionError::PatchTooLarge)?
                } else {
                    #[cfg(test)]
                    {
                        Vec::new()
                    }
                    #[cfg(not(test))]
                    {
                        return Err(UiSessionError::InvalidRoot);
                    }
                };
                PresentationBatch::SnapshotRequired {
                    root,
                    ui_root_epoch: state.epoch,
                    app_code_epoch,
                    revision,
                    bytes,
                }
            }
        };
        state.inflight = Some(batch.clone());
        Ok(Some(batch))
    }

    pub fn queue_return(&mut self, item: UiReturn) -> Result<(), UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::PresentationQueue)?;
        if self.reload.phase() != ReloadPhase::Idle {
            return Err(UiSessionError::Reload(ReloadError::WrongPhase));
        }
        if self.returns.len() == self.config.max_return_items {
            return Err(UiSessionError::ReturnQueueCapacity);
        }
        self.returns.push_back(item);
        Ok(())
    }

    pub fn queue_return_during_reload(
        &mut self,
        item: UiReturn,
        now_millis: u64,
    ) -> Result<Option<ReloadRollback>, UiSessionError> {
        let (sequence, app_code_epoch) = match &item {
            UiReturn::ApplyAck {
                sequence,
                app_code_epoch,
                ..
            }
            | UiReturn::Event {
                sequence,
                app_code_epoch,
                ..
            }
            | UiReturn::CommandResult {
                sequence,
                app_code_epoch,
                ..
            } => (*sequence, *app_code_epoch),
        };
        match self
            .reload
            .hold_or_rollback(
                HeldItem {
                    sequence,
                    app_code_epoch,
                    payload: HeldPayload::Return(item),
                },
                now_millis,
            )
            .map_err(UiSessionError::Reload)?
        {
            ReloadHoldOutcome::Held => Ok(None),
            ReloadHoldOutcome::RolledBack {
                mut held,
                rejected,
                reason,
            } => {
                held.push(rejected);
                self.restore_reload_items(reason, held).map(Some)
            }
        }
    }

    fn restore_reload_items(
        &mut self,
        reason: ReloadError,
        mut held: Vec<HeldItem>,
    ) -> Result<ReloadRollback, UiSessionError> {
        held.sort_by_key(|item| item.sequence);
        let restored_returns = held
            .iter()
            .filter(|item| matches!(&item.payload, HeldPayload::Return(_)))
            .count();
        if self.returns.len().saturating_add(restored_returns) > self.config.max_return_items {
            return Err(UiSessionError::ReturnQueueCapacity);
        }
        let restored_effect_completions = held
            .iter()
            .filter(|item| matches!(&item.payload, HeldPayload::EffectCompletion(_)))
            .count();
        let completions = held
            .iter()
            .filter_map(|item| match &item.payload {
                HeldPayload::EffectCompletion(completion) => Some(completion.clone()),
                _ => None,
            })
            .collect::<Vec<_>>();
        self.async_registry
            .restore_completions(completions)
            .map_err(UiSessionError::Async)?;

        let mut pending_messages = Vec::new();
        for item in held {
            let HeldItem {
                sequence,
                app_code_epoch,
                payload,
            } = item;
            match payload {
                HeldPayload::Return(item) => self.returns.push_back(item),
                HeldPayload::EffectCompletion(_) => {}
                HeldPayload::Message(bytes) => pending_messages.push(HeldItem {
                    sequence,
                    app_code_epoch,
                    payload: HeldPayload::Message(bytes),
                }),
            }
        }
        Ok(ReloadRollback {
            reason,
            pending_messages,
            restored_returns,
            restored_effect_completions,
        })
    }

    pub fn queue_widget_event(&mut self, event: WrappedWidgetEvent) -> Result<(), UiSessionError> {
        self.queue_return(UiReturn::Event {
            root: event.root,
            ui_root_epoch: event.ui_root_epoch,
            app_code_epoch: event.app_code_epoch,
            applied_revision: event.applied_revision,
            event_token: event.event_token,
            sequence: event.sequence,
            payload: event.payload,
        })
    }

    pub fn process_next_return(&mut self) -> Result<Option<UiReturn>, UiSessionError> {
        self.require_no_injected_fault(UiFaultPoint::ProtocolDecode)?;
        let Some(item) = self.returns.pop_front() else {
            return Ok(None);
        };
        self.validate_return(&item)?;
        Ok(Some(item))
    }

    fn validate_return(&mut self, item: &UiReturn) -> Result<(), UiSessionError> {
        let (root_id, root_epoch, app_code_epoch, sequence) = match item {
            UiReturn::ApplyAck {
                root,
                ui_root_epoch,
                app_code_epoch,
                sequence,
                ..
            }
            | UiReturn::Event {
                root,
                ui_root_epoch,
                app_code_epoch,
                sequence,
                ..
            }
            | UiReturn::CommandResult {
                root,
                ui_root_epoch,
                app_code_epoch,
                sequence,
                ..
            } => (*root, *ui_root_epoch, *app_code_epoch, *sequence),
        };
        if app_code_epoch != self.app_code_epoch {
            return Err(UiSessionError::StaleAppCodeEpoch);
        }
        let root_index = self.root_index(root_id)?;
        let root = self.roots[root_index].state.as_ref().unwrap();
        if root_epoch != root.epoch {
            return Err(UiSessionError::StaleRootEpoch);
        }
        if sequence <= root.last_return_sequence {
            return Err(UiSessionError::ReturnSequence);
        }
        let mut replacement_applied = false;
        match item {
            UiReturn::ApplyAck { revision, .. } => {
                let root = self.roots[root_index].state.as_mut().unwrap();
                let expected = root
                    .inflight
                    .as_ref()
                    .map(PresentationBatch::revision)
                    .ok_or(UiSessionError::AckRevisionMismatch)?;
                if *revision != expected {
                    return Err(UiSessionError::AckRevisionMismatch);
                }
                replacement_applied = matches!(
                    root.inflight,
                    Some(PresentationBatch::SnapshotRequired { .. })
                );
                root.last_acked_revision = *revision;
                root.observed_applied_revision = root.observed_applied_revision.max(*revision);
                root.inflight = None;
            }
            UiReturn::Event {
                applied_revision,
                event_token,
                ..
            } => {
                let root = self.roots[root_index].state.as_mut().unwrap();
                if !event_token.is_valid() {
                    return Err(UiSessionError::InvalidEventToken);
                }
                if *applied_revision > root.observed_applied_revision {
                    return Err(UiSessionError::EventBeforeApplyAck);
                }
                if !root.tree.contains_event_token(*event_token) {
                    return Err(UiSessionError::InvalidEventToken);
                }
            }
            UiReturn::CommandResult {
                command_id,
                outcome,
                ..
            } => {
                let command = self
                    .commands
                    .command(*command_id)
                    .cloned()
                    .ok_or(UiSessionError::Command(CommandQueueError::UnknownCommand))?;
                if self.roots[root_index]
                    .state
                    .as_ref()
                    .unwrap()
                    .observed_applied_revision
                    < command.min_applied_revision
                {
                    return Err(UiSessionError::EventBeforeApplyAck);
                }
                self.node_refs
                    .validate_binding(
                        LogicalNodeRef::from_parts(self.id, root_id, command.target),
                        command.target_node,
                        command.expected_binding_generation,
                    )
                    .map_err(UiSessionError::NodeRef)?;
                if let UiCommandOutcome::Measured(measurement) = outcome {
                    if measurement.target != command.target
                        || measurement.binding_generation != command.expected_binding_generation
                    {
                        return Err(UiSessionError::Command(CommandQueueError::IdentityMismatch));
                    }
                }
                self.commands
                    .complete(*command_id, root_id, root_epoch, app_code_epoch, *outcome)
                    .map_err(UiSessionError::Command)?;
            }
        }
        if replacement_applied {
            self.node_refs.renderer_snapshot_applied(root_id);
        }
        let root = self.roots[root_index].state.as_mut().unwrap();
        root.last_return_sequence = sequence;
        Ok(())
    }

    fn root_index(&self, root: UiRootId) -> Result<usize, UiSessionError> {
        self.require_open()?;
        let index = root.index as usize;
        let Some(slot) = self.roots.get(index) else {
            return Err(UiSessionError::InvalidRoot);
        };
        if slot.generation != root.generation || slot.state.is_none() {
            return Err(UiSessionError::InvalidRoot);
        }
        Ok(index)
    }

    fn require_no_injected_fault(&mut self, point: UiFaultPoint) -> Result<(), UiSessionError> {
        self.require_open()?;
        match self.faults.trigger(point) {
            Some(fault) => Err(UiSessionError::InjectedFault { point, fault }),
            None => Ok(()),
        }
    }

    fn require_open(&self) -> Result<(), UiSessionError> {
        if self.closed {
            Err(UiSessionError::Closed)
        } else {
            Ok(())
        }
    }

    fn root_mut(&mut self, root: UiRootId) -> Result<&mut RootState, UiSessionError> {
        let index = self.root_index(root)?;
        Ok(self.roots[index].state.as_mut().unwrap())
    }
}

fn presentation_batch_bytes(batch: &PresentationBatch) -> usize {
    match batch {
        PresentationBatch::Patch { bytes, .. }
        | PresentationBatch::SnapshotRequired { bytes, .. } => bytes.len(),
    }
}

fn accumulate_tree_instrumentation(
    total: &mut tree::TreeInstrumentation,
    tree: tree::TreeInstrumentation,
    include_current: bool,
) {
    if include_current {
        total.nodes = total.nodes.saturating_add(tree.nodes);
    }
    total.peak_nodes = total.peak_nodes.saturating_add(tree.peak_nodes);
    total.reconciles = total.reconciles.saturating_add(tree.reconciles);
    total.scanned_nodes = total.scanned_nodes.saturating_add(tree.scanned_nodes);
    total.dirty_patches = total.dirty_patches.saturating_add(tree.dirty_patches);
    total.node_allocations = total.node_allocations.saturating_add(tree.node_allocations);
    total.node_releases = total.node_releases.saturating_add(tree.node_releases);
}

fn build_root(build: &PreparedBuild) -> UiRootId {
    match build.request {
        BuildRequest::Root(root) => root,
        BuildRequest::Scope { scope, .. } => scope.root,
    }
}

fn effective_subscription_update(
    prepared: Option<&PreparedSubscriptionUpdate>,
    removed: &BTreeSet<async_runtime::SubscriptionOwner>,
) -> EffectiveSubscriptionUpdate {
    match prepared {
        Some(PreparedSubscriptionUpdate::ReplaceAll(desired)) => {
            EffectiveSubscriptionUpdate::ReplaceAll(
                desired
                    .iter()
                    .filter(|spec| !removed.contains(&spec.owner))
                    .cloned()
                    .collect(),
            )
        }
        Some(PreparedSubscriptionUpdate::Owners(owners)) => {
            let mut effective = owners
                .iter()
                .cloned()
                .collect::<BTreeMap<async_runtime::SubscriptionOwner, Vec<SubscriptionSpec>>>();
            for owner in removed {
                effective.insert(*owner, Vec::new());
            }
            EffectiveSubscriptionUpdate::Owners(effective.into_iter().collect())
        }
        None if removed.is_empty() => EffectiveSubscriptionUpdate::Unchanged,
        None => EffectiveSubscriptionUpdate::Owners(
            removed
                .iter()
                .copied()
                .map(|owner| (owner, Vec::new()))
                .collect(),
        ),
    }
}

fn merge_pending(root: &mut RootState, revision: u64, bytes: Vec<u8>, max_pending: usize) {
    match root.pending.take() {
        Some(PendingPresentation::Delta {
            base_revision,
            bytes: mut pending,
            ..
        }) if pending.len().saturating_add(bytes.len()) <= max_pending => {
            pending.extend_from_slice(&bytes);
            root.pending = Some(PendingPresentation::Delta {
                base_revision,
                new_revision: revision,
                bytes: pending,
            });
        }
        Some(PendingPresentation::SnapshotRequired { .. }) => {
            root.pending = Some(PendingPresentation::SnapshotRequired { revision });
        }
        Some(PendingPresentation::Delta { .. }) => {
            root.pending = Some(PendingPresentation::SnapshotRequired { revision });
        }
        _ if bytes.len() <= max_pending => {
            let base_revision = root
                .inflight
                .as_ref()
                .map(PresentationBatch::revision)
                .unwrap_or(root.last_acked_revision);
            root.pending = Some(PendingPresentation::Delta {
                base_revision,
                new_revision: revision,
                bytes,
            });
        }
        _ => root.pending = Some(PendingPresentation::SnapshotRequired { revision }),
    }
}

fn encode_ui_transaction(transaction: &UiTransaction, max_bytes: usize) -> Option<Vec<u8>> {
    let mut encoder = BoundedEncoder::new(max_bytes);
    encoder.u64(transaction.base_revision)?;
    encoder.u64(transaction.new_revision)?;
    encoder.handle(transaction.root)?;
    encoder.u32(u32::try_from(transaction.patches.len()).ok()?)?;
    for patch in &transaction.patches {
        match patch {
            UiPatch::Create {
                node,
                parent,
                index,
            } => {
                encoder.u8(1)?;
                encoder.handle(*node)?;
                encoder.optional_handle(*parent)?;
                encoder.u32(u32::try_from(*index).ok()?)?;
            }
            UiPatch::Remove { node } => {
                encoder.u8(2)?;
                encoder.handle(*node)?;
            }
            UiPatch::Move {
                node,
                parent,
                index,
            } => {
                encoder.u8(3)?;
                encoder.handle(*node)?;
                encoder.optional_handle(*parent)?;
                encoder.u32(u32::try_from(*index).ok()?)?;
            }
            UiPatch::SetKind { node, kind } => {
                encoder.u8(4)?;
                encoder.handle(*node)?;
                match kind {
                    ViewKind::Element(name) => {
                        encoder.u8(1)?;
                        encoder.string(name)?;
                    }
                    ViewKind::Text(text) => {
                        encoder.u8(2)?;
                        encoder.string(text)?;
                    }
                }
            }
            UiPatch::SetProps { node, props } => {
                encoder.u8(5)?;
                encoder.handle(*node)?;
                encoder.u32(u32::try_from(props.len()).ok()?)?;
                for (key, value) in props {
                    encoder.string(key)?;
                    encoder.string(value)?;
                }
            }
        }
    }
    Some(encoder.finish())
}

struct BoundedEncoder {
    bytes: Vec<u8>,
    max_bytes: usize,
}

impl BoundedEncoder {
    fn new(max_bytes: usize) -> Self {
        Self {
            bytes: Vec::new(),
            max_bytes,
        }
    }

    fn push(&mut self, bytes: &[u8]) -> Option<()> {
        if self.bytes.len().checked_add(bytes.len())? > self.max_bytes {
            return None;
        }
        self.bytes.extend_from_slice(bytes);
        Some(())
    }

    fn u8(&mut self, value: u8) -> Option<()> {
        self.push(&[value])
    }

    fn u32(&mut self, value: u32) -> Option<()> {
        self.push(&value.to_le_bytes())
    }

    fn u64(&mut self, value: u64) -> Option<()> {
        self.push(&value.to_le_bytes())
    }

    fn handle(&mut self, value: Handle) -> Option<()> {
        self.u32(value.index)?;
        self.u32(value.generation)
    }

    fn optional_handle(&mut self, value: Option<Handle>) -> Option<()> {
        match value {
            Some(value) => {
                self.u8(1)?;
                self.handle(value)
            }
            None => self.u8(0),
        }
    }

    fn string(&mut self, value: &str) -> Option<()> {
        self.u32(u32::try_from(value.len()).ok()?)?;
        self.push(value.as_bytes())
    }

    fn finish(self) -> Vec<u8> {
        self.bytes
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn session() -> UiSession {
        session_with_pending(6)
    }

    fn session_with_pending(max_pending_bytes_per_root: usize) -> UiSession {
        UiSession::new(
            Handle {
                index: 0,
                generation: 1,
            },
            test_config(max_pending_bytes_per_root),
        )
        .unwrap()
    }

    fn test_config(max_pending_bytes_per_root: usize) -> UiSessionConfig {
        UiSessionConfig {
            max_roots: 2,
            max_patch_bytes: 160,
            max_pending_bytes_per_root,
            max_return_items: 8,
            tree: TreeConfig {
                max_nodes: 8,
                max_slots: 16,
                max_depth: 4,
                max_string_bytes: 64,
                max_props_per_node: 4,
                max_events: 8,
            },
            command: CommandQueueConfig {
                max_pending: 4,
                max_payload_bytes: 16,
                max_kind_bytes: 16,
            },
            async_registry: AsyncConfig {
                max_effects: 4,
                max_effect_payload_bytes: 16,
                max_completions: 4,
                max_completion_bytes: 16,
                max_subscriptions: 4,
                max_subscription_bytes: 16,
                max_label_bytes: 16,
            },
            resources: UiResourceStoreConfig::default(),
            styles: StyleStoreConfig::default(),
            reload: ReloadConfig::default(),
            node_refs: NodeRefRegistryConfig::default(),
            interaction: InteractionConfig::default(),
            document: DocumentRuntimeConfig::default(),
            performance: UiPerformanceConfig::default(),
        }
    }

    #[test]
    fn root_detach_leaves_zero_live_session_resources() {
        let mut session = session();
        let root = session.attach_root().unwrap();
        assert!(!session.leak_summary().is_zero());
        session.detach_root(root).unwrap();
        assert!(session.leak_summary().is_zero());
    }

    #[test]
    fn one_thousand_ui_owner_graph_attach_detach_cycles_leave_zero_resources() {
        for cycle in 1..=1_000_u32 {
            let mut session = UiSession::new(
                Handle {
                    index: cycle,
                    generation: 1,
                },
                test_config(160),
            )
            .expect("session");
            let root = session.attach_root().expect("root");
            let transaction = session
                .reconcile_root(
                    root,
                    &ViewNode {
                        key: Some("action".to_owned()),
                        kind: tree::ViewKind::Element("button".to_owned()),
                        props: BTreeMap::new(),
                        children: Vec::new(),
                    },
                )
                .expect("reconcile");
            let reference = session
                .node_ref(root, transaction.root)
                .expect("node reference");
            session
                .bind_event(reference, "click")
                .expect("event binding");
            session
                .begin_command(reference, "focus".to_owned(), Vec::new())
                .expect("command");
            let (effects, subscriptions) = session
                .commit_target_async(
                    vec![(
                        "load".to_owned(),
                        EffectExecutor::TaskRegistry,
                        EffectScope::UiRoot(root),
                        10_000,
                        vec![1],
                        false,
                    )],
                    vec![SubscriptionSpec {
                        owner: async_runtime::SubscriptionOwner::UiRoot(root),
                        key: "clock".to_owned(),
                        kind: "timer".to_owned(),
                        payload: vec![1],
                    }],
                )
                .expect("root async owners");
            assert_eq!(effects.len(), 1);
            assert_eq!(subscriptions.len(), 1);
            let resource = session
                .register_resource(UiResourceDescriptor {
                    kind: resource::UiResourceKind::Image,
                    locator: b"memory://soak-image".to_vec(),
                    content_hash: [7; 32],
                    options: Vec::new(),
                })
                .expect("resource");
            session
                .acquire_resource(root, resource, 10_000)
                .expect("resource lease");

            let detach = session.detach_root(root).expect("detach root");
            assert_eq!(detach.command_results.len(), 1);
            assert_eq!(detach.cancelled_effect_ids, effects);
            assert_eq!(detach.subscription_changes.len(), 1);
            assert!(session
                .begin_command(reference, "focus".to_owned(), Vec::new())
                .is_err());
            assert_eq!(
                session
                    .drain_effect_completions()
                    .expect("drain root terminal effects"),
                vec![EffectCompletion {
                    effect_id: effects[0],
                    app_code_epoch: 1,
                    outcome: EffectOutcome::Cancelled,
                }]
            );
            session
                .unregister_resource(resource)
                .expect("unregister session resource");
            assert!(
                session.leak_summary().is_zero(),
                "cycle {cycle} leaked {:?}",
                session.leak_summary()
            );
        }
    }

    #[test]
    fn injected_renderer_fault_is_atomic_and_next_attempt_recovers() {
        let mut session = session();
        let root = session.attach_root().unwrap();
        session
            .install_fault_rule(UiFaultRule {
                point: UiFaultPoint::RendererOperation,
                fault: UiInjectedFault::RendererLost,
                skip: 0,
                every: 1,
                remaining: 1,
            })
            .unwrap();
        assert_eq!(
            session.restart_renderer(root),
            Err(UiSessionError::InjectedFault {
                point: UiFaultPoint::RendererOperation,
                fault: UiInjectedFault::RendererLost,
            })
        );
        assert_eq!(session.root_epoch(root), Ok(1));
        assert_eq!(session.restart_renderer(root).unwrap().ui_root_epoch, 2);
        assert_eq!(session.fault_metrics().exhausted, 1);
    }

    #[test]
    fn stalled_root_accumulates_without_blocking_healthy_root() {
        let mut session = session();
        let stalled = session.attach_root().unwrap();
        let healthy = session.attach_root().unwrap();
        assert_eq!(
            session
                .commit(vec![
                    RootPatch {
                        root: stalled,
                        bytes: vec![1, 2],
                    },
                    RootPatch {
                        root: healthy,
                        bytes: vec![3],
                    },
                ])
                .unwrap(),
            1
        );
        session.poll_presentation(stalled).unwrap().unwrap();
        session.poll_presentation(healthy).unwrap().unwrap();
        session
            .queue_return(UiReturn::ApplyAck {
                root: healthy,
                ui_root_epoch: 1,
                app_code_epoch: 1,
                revision: 1,
                sequence: 1,
            })
            .unwrap();
        session.process_next_return().unwrap();

        session
            .commit(vec![
                RootPatch {
                    root: stalled,
                    bytes: vec![4, 5, 6, 7],
                },
                RootPatch {
                    root: healthy,
                    bytes: vec![8],
                },
            ])
            .unwrap();
        assert!(session.poll_presentation(stalled).unwrap().is_none());
        assert!(matches!(
            session.poll_presentation(healthy).unwrap(),
            Some(PresentationBatch::Patch {
                new_revision: 2,
                ..
            })
        ));

        session
            .commit(vec![RootPatch {
                root: stalled,
                bytes: vec![9, 10, 11],
            }])
            .unwrap();
        session
            .queue_return(UiReturn::ApplyAck {
                root: stalled,
                ui_root_epoch: 1,
                app_code_epoch: 1,
                revision: 1,
                sequence: 1,
            })
            .unwrap();
        session.process_next_return().unwrap();
        assert!(matches!(
            session.poll_presentation(stalled).unwrap(),
            Some(PresentationBatch::SnapshotRequired { revision: 3, .. })
        ));
    }

    #[test]
    fn return_lane_requires_ack_before_event_and_rejects_stale_epoch() {
        let mut session = session();
        let root = session.attach_root().unwrap();
        session
            .commit(vec![RootPatch {
                root,
                bytes: vec![1],
            }])
            .unwrap();
        session.poll_presentation(root).unwrap().unwrap();
        session
            .queue_return(UiReturn::Event {
                root,
                ui_root_epoch: 1,
                app_code_epoch: 1,
                applied_revision: 1,
                event_token: Handle {
                    index: 0,
                    generation: 1,
                },
                sequence: 1,
                payload: Vec::new(),
            })
            .unwrap();
        assert_eq!(
            session.process_next_return(),
            Err(UiSessionError::EventBeforeApplyAck)
        );
        session
            .queue_return(UiReturn::ApplyAck {
                root,
                ui_root_epoch: 2,
                app_code_epoch: 1,
                revision: 1,
                sequence: 2,
            })
            .unwrap();
        assert_eq!(
            session.process_next_return(),
            Err(UiSessionError::StaleRootEpoch)
        );
    }

    #[test]
    fn root_generation_reuse_rejects_late_packets() {
        let mut session = session();
        let old = session.attach_root().unwrap();
        session.detach_root(old).unwrap();
        let current = session.attach_root().unwrap();
        assert_eq!(old.index, current.index);
        assert_ne!(old.generation, current.generation);
        assert_eq!(
            session.commit(vec![RootPatch {
                root: old,
                bytes: vec![1],
            }]),
            Err(UiSessionError::InvalidRoot)
        );
    }

    #[test]
    fn failed_commit_is_atomic_and_renderer_restart_changes_epoch() {
        let mut session = session();
        let root = session.attach_root().unwrap();
        assert_eq!(
            session.commit(vec![
                RootPatch {
                    root,
                    bytes: vec![1],
                },
                RootPatch {
                    root,
                    bytes: vec![2],
                },
            ]),
            Err(UiSessionError::DuplicateRootPatch)
        );
        assert_eq!(session.commit_revision(), 0);
        assert!(session.poll_presentation(root).unwrap().is_none());

        session
            .commit(vec![RootPatch {
                root,
                bytes: vec![3],
            }])
            .unwrap();
        session.poll_presentation(root).unwrap().unwrap();
        assert_eq!(session.restart_renderer(root).unwrap().ui_root_epoch, 2);
        assert!(matches!(
            session.poll_presentation(root).unwrap(),
            Some(PresentationBatch::SnapshotRequired {
                ui_root_epoch: 2,
                revision: 1,
                ..
            })
        ));
    }

    #[test]
    fn generation_exhaustion_is_rejected_before_session_or_root_mutation() {
        let mut session = session();
        let root = session.attach_root().unwrap();
        let commit = session
            .commit_views(vec![RootView {
                root,
                view: ViewNode {
                    key: None,
                    kind: tree::ViewKind::Element("button".to_owned()),
                    props: std::collections::BTreeMap::new(),
                    children: Vec::new(),
                },
            }])
            .unwrap();
        let node = commit.transactions[0].1.root;
        session.roots[root.index as usize].generation = u32::MAX;
        let saturated = Handle {
            index: root.index,
            generation: u32::MAX,
        };
        let target = session.node_ref(saturated, node).unwrap();
        let before_detach = session
            .begin_command(target, "focus".to_owned(), Vec::new())
            .unwrap();
        assert_eq!(
            session.detach_root(saturated),
            Err(UiSessionError::GenerationExhausted)
        );
        assert_eq!(session.live_roots, 1);
        assert_eq!(session.poll_command().unwrap().command_id, before_detach);

        session.roots[root.index as usize]
            .state
            .as_mut()
            .unwrap()
            .epoch = u32::MAX;
        let before_restart = session
            .begin_command(target, "scroll".to_owned(), Vec::new())
            .unwrap();
        assert_eq!(
            session.restart_renderer(saturated),
            Err(UiSessionError::GenerationExhausted)
        );
        assert_eq!(session.poll_command().unwrap().command_id, before_restart);
        let before_reload = session
            .begin_command(target, "measure".to_owned(), Vec::new())
            .unwrap();
        session.app_code_epoch = u64::MAX;
        assert_eq!(
            session.reload_driver(),
            Err(UiSessionError::GenerationExhausted)
        );
        assert_eq!(session.app_code_epoch(), u64::MAX);
        assert_eq!(session.poll_command().unwrap().command_id, before_reload);
    }

    #[test]
    fn event_return_must_resolve_in_the_owning_root_tree() {
        let mut session = session();
        let root = session.attach_root().unwrap();
        let view = ViewNode {
            key: Some("action".to_owned()),
            kind: tree::ViewKind::Element("button".to_owned()),
            props: std::collections::BTreeMap::new(),
            children: Vec::new(),
        };
        let transaction = session.reconcile_root(root, &view).unwrap();
        let reference = session.node_ref(root, transaction.root).unwrap();
        let token = session.bind_event(reference, "click").unwrap();
        session
            .commit(vec![RootPatch {
                root,
                bytes: vec![1],
            }])
            .unwrap();
        session.poll_presentation(root).unwrap().unwrap();
        session
            .queue_return(UiReturn::ApplyAck {
                root,
                ui_root_epoch: 1,
                app_code_epoch: 1,
                revision: 1,
                sequence: 1,
            })
            .unwrap();
        session.process_next_return().unwrap();
        session
            .queue_return(UiReturn::Event {
                root,
                ui_root_epoch: 1,
                app_code_epoch: 1,
                applied_revision: 1,
                event_token: token,
                sequence: 2,
                payload: Vec::new(),
            })
            .unwrap();
        assert!(matches!(
            session.process_next_return(),
            Ok(Some(UiReturn::Event { .. }))
        ));

        let replacement = ViewNode {
            kind: tree::ViewKind::Element("input".to_owned()),
            ..view
        };
        session.reconcile_root(root, &replacement).unwrap();
        session
            .queue_return(UiReturn::Event {
                root,
                ui_root_epoch: 1,
                app_code_epoch: 1,
                applied_revision: 1,
                event_token: token,
                sequence: 3,
                payload: Vec::new(),
            })
            .unwrap();
        assert_eq!(
            session.process_next_return(),
            Err(UiSessionError::InvalidEventToken)
        );
    }

    #[test]
    fn command_target_is_root_owned_and_restart_reports_terminal_outcomes() {
        let mut session = session();
        let root = session.attach_root().unwrap();
        let view = ViewNode {
            key: None,
            kind: tree::ViewKind::Element("button".to_owned()),
            props: std::collections::BTreeMap::new(),
            children: Vec::new(),
        };
        let commit = session.commit_views(vec![RootView { root, view }]).unwrap();
        let target = session
            .node_ref(root, commit.transactions[0].1.root)
            .unwrap();
        let dispatched = session
            .begin_command(target, "focus".to_owned(), vec![1])
            .unwrap();
        let queued = session
            .begin_command(target, "scroll".to_owned(), vec![2])
            .unwrap();
        assert_eq!(session.poll_command().unwrap().command_id, dispatched);
        let restart = session.restart_renderer(root).unwrap();
        assert_eq!(restart.ui_root_epoch, 2);
        assert_eq!(
            restart.command_results,
            vec![
                UiCommandResult {
                    command_id: dispatched,
                    root,
                    outcome: UiCommandOutcome::OutcomeUnknownOnRendererRestart,
                },
                UiCommandResult {
                    command_id: queued,
                    root,
                    outcome: UiCommandOutcome::DroppedBeforeDispatch,
                },
            ]
        );
        assert!(session.poll_command().is_none());
    }

    #[test]
    fn node_ref_rejects_same_root_and_node_bits_from_another_ui_session() {
        let mut alpha = session();
        let mut beta = session();
        beta.id = Handle {
            index: 1,
            generation: 1,
        };
        let alpha_root = alpha.attach_root().unwrap();
        let beta_root = beta.attach_root().unwrap();
        let view = ViewNode {
            key: None,
            kind: tree::ViewKind::Element("button".to_owned()),
            props: std::collections::BTreeMap::new(),
            children: Vec::new(),
        };
        let alpha_commit = alpha
            .commit_views(vec![RootView {
                root: alpha_root,
                view: view.clone(),
            }])
            .unwrap();
        let beta_commit = beta
            .commit_views(vec![RootView {
                root: beta_root,
                view,
            }])
            .unwrap();
        assert_eq!(alpha_root, beta_root);
        assert_eq!(
            alpha_commit.transactions[0].1.root,
            beta_commit.transactions[0].1.root
        );
        let foreign = alpha
            .node_ref(alpha_root, alpha_commit.transactions[0].1.root)
            .unwrap();
        assert_eq!(
            beta.begin_command(foreign, "focus".to_owned(), Vec::new()),
            Err(UiSessionError::WrongSession)
        );
        assert_eq!(
            beta.bind_event(foreign, "click"),
            Err(UiSessionError::WrongSession)
        );
    }

    #[test]
    fn command_result_shares_root_sequence_and_is_terminal_once() {
        let mut session = session_with_pending(160);
        let root = session.attach_root().unwrap();
        let view = ViewNode {
            key: None,
            kind: tree::ViewKind::Element("input".to_owned()),
            props: std::collections::BTreeMap::new(),
            children: Vec::new(),
        };
        let commit = session.commit_views(vec![RootView { root, view }]).unwrap();
        let applied_revision = commit.transactions[0].1.new_revision;
        session.poll_presentation(root).unwrap().unwrap();
        session
            .queue_return(UiReturn::ApplyAck {
                root,
                ui_root_epoch: 1,
                app_code_epoch: 1,
                revision: applied_revision,
                sequence: 1,
            })
            .unwrap();
        session.process_next_return().unwrap();
        let target = session
            .node_ref(root, commit.transactions[0].1.root)
            .unwrap();
        let command_id = session
            .begin_command(target, "focus".to_owned(), Vec::new())
            .unwrap();
        session.poll_command().unwrap();
        session
            .queue_return(UiReturn::CommandResult {
                root,
                ui_root_epoch: 1,
                app_code_epoch: 1,
                command_id,
                sequence: 2,
                outcome: UiCommandOutcome::Executed,
            })
            .unwrap();
        assert!(matches!(
            session.process_next_return(),
            Ok(Some(UiReturn::CommandResult { .. }))
        ));
        session
            .queue_return(UiReturn::CommandResult {
                root,
                ui_root_epoch: 1,
                app_code_epoch: 1,
                command_id,
                sequence: 3,
                outcome: UiCommandOutcome::Executed,
            })
            .unwrap();
        assert_eq!(
            session.process_next_return(),
            Err(UiSessionError::Command(CommandQueueError::UnknownCommand))
        );
    }

    #[test]
    fn driver_reload_cancels_effects_and_stops_subscriptions_before_epoch_change() {
        let mut session = session();
        let effect_id = session.begin_effect("load".to_owned(), vec![1]).unwrap();
        assert_eq!(session.poll_effect().unwrap().effect_id, effect_id);
        let changes = session
            .reconcile_subscriptions(vec![SubscriptionSpec {
                owner: async_runtime::SubscriptionOwner::App,
                key: "clock".to_owned(),
                kind: "timer".to_owned(),
                payload: vec![1],
            }])
            .unwrap();
        let subscription = match &changes[0] {
            SubscriptionChange::Start { handle, .. } => *handle,
            _ => unreachable!(),
        };
        let reload = session.reload_driver().unwrap();
        assert_eq!(session.app_code_epoch(), 2);
        assert_eq!(
            reload.async_reset.effect_completions,
            vec![EffectCompletion {
                effect_id,
                app_code_epoch: 1,
                outcome: EffectOutcome::Cancelled,
            }]
        );
        assert_eq!(
            reload.async_reset.subscription_changes,
            vec![SubscriptionChange::Stop {
                handle: subscription
            }]
        );
        assert_eq!(
            session.complete_effect(effect_id, 1, EffectOutcome::Completed(Vec::new())),
            Err(UiSessionError::Async(AsyncError::UnknownEffect))
        );
    }

    #[test]
    fn multi_root_reconcile_prepares_every_tree_before_any_apply() {
        let mut session = session();
        let first = session.attach_root().unwrap();
        let second = session.attach_root().unwrap();
        let base = |name: &str| ViewNode {
            key: None,
            kind: tree::ViewKind::Element(name.to_owned()),
            props: std::collections::BTreeMap::new(),
            children: Vec::new(),
        };
        session
            .reconcile_roots(vec![
                RootView {
                    root: first,
                    view: base("first"),
                },
                RootView {
                    root: second,
                    view: base("second"),
                },
            ])
            .unwrap();

        let mut changed_first = base("first");
        changed_first
            .props
            .insert("class".to_owned(), "changed".to_owned());
        let duplicate_second = ViewNode {
            children: vec![
                ViewNode {
                    key: Some("same".to_owned()),
                    ..base("child")
                },
                ViewNode {
                    key: Some("same".to_owned()),
                    ..base("child")
                },
            ],
            ..base("second")
        };
        assert_eq!(
            session.reconcile_roots(vec![
                RootView {
                    root: first,
                    view: changed_first.clone(),
                },
                RootView {
                    root: second,
                    view: duplicate_second,
                },
            ]),
            Err(UiSessionError::Tree(TreeError::DuplicateKey))
        );
        let transaction = session.reconcile_root(first, &changed_first).unwrap();
        assert_eq!(transaction.base_revision, 1);
        assert_eq!(transaction.new_revision, 2);
        assert!(transaction
            .patches
            .iter()
            .any(|patch| matches!(patch, tree::UiPatch::SetProps { .. })));
    }

    #[test]
    fn commit_views_combines_tree_apply_patch_budget_and_commit_revision() {
        let mut session = session();
        let first = session.attach_root().unwrap();
        let second = session.attach_root().unwrap();
        let node = |name: &str| ViewNode {
            key: None,
            kind: tree::ViewKind::Element(name.to_owned()),
            props: std::collections::BTreeMap::new(),
            children: Vec::new(),
        };
        let initial = session
            .commit_views(vec![
                RootView {
                    root: first,
                    view: node("first"),
                },
                RootView {
                    root: second,
                    view: node("second"),
                },
            ])
            .unwrap();
        assert_eq!(initial.commit_revision, 1);

        let no_change = session
            .commit_views(vec![
                RootView {
                    root: first,
                    view: node("first"),
                },
                RootView {
                    root: second,
                    view: node("second"),
                },
            ])
            .unwrap();
        assert_eq!(no_change.commit_revision, 1);
        assert!(no_change
            .transactions
            .iter()
            .all(|(_, transaction)| transaction.patches.is_empty()));

        let mut changed_first = node("first");
        changed_first
            .props
            .insert("class".to_owned(), "changed".to_owned());
        let oversized_second = ViewNode {
            children: (0..5)
                .map(|index| ViewNode {
                    key: Some(format!("child-{index}")),
                    ..node("child")
                })
                .collect(),
            ..node("second")
        };
        assert_eq!(
            session.commit_views(vec![
                RootView {
                    root: first,
                    view: changed_first.clone(),
                },
                RootView {
                    root: second,
                    view: oversized_second,
                },
            ]),
            Err(UiSessionError::PatchTooLarge)
        );
        assert_eq!(session.commit_revision(), 1);
        let committed = session
            .commit_views(vec![RootView {
                root: first,
                view: changed_first,
            }])
            .unwrap();
        assert_eq!(committed.commit_revision, 2);
        assert_eq!(committed.transactions[0].1.base_revision, 1);
    }
}
