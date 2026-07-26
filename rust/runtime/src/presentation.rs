use vogui_protocol::v2::{Handle, NodeId, UiRootId, UiSessionId};

use crate::{
    animation::{
        AnimationCompletion, AnimationConfig, AnimationDescriptor, AnimationError, AnimationId,
        AnimationRuntime, AnimationSample,
    },
    command::{
        RendererCommandAdmission, RendererCommandConfig, RendererCommandError,
        RendererCommandRuntime, UiCommand, UiCommandResult,
    },
    control_runtime::{ControlRuntime, ControlRuntimeConfig, ControlRuntimeError},
    input::{RendererInputConfig, RendererInputError, RendererInputState, SyntheticInput},
    renderer::{
        PreparedRendererApply, RendererConfig, RendererError, RendererMirror, RendererTreeSnapshot,
    },
    resource::{
        UiRendererResidencyWork, UiRendererResourceCache, UiRendererResourceCacheConfig,
        UiResourceError, UiResourceId, UiResourcePublication,
    },
    semantics::{SemanticConfig, SemanticError, SemanticSnapshot, SemanticTree},
    PresentationBatch,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RendererActorConfig {
    pub mirror: RendererConfig,
    pub input: RendererInputConfig,
    pub semantics: SemanticConfig,
    pub resources: UiRendererResourceCacheConfig,
    pub animation: AnimationConfig,
    pub commands: RendererCommandConfig,
    pub controls: ControlRuntimeConfig,
}

impl Default for RendererActorConfig {
    fn default() -> Self {
        Self {
            mirror: RendererConfig::default(),
            input: RendererInputConfig::default(),
            semantics: SemanticConfig::default(),
            resources: UiRendererResourceCacheConfig::default(),
            animation: AnimationConfig::default(),
            commands: RendererCommandConfig::default(),
            controls: ControlRuntimeConfig::default(),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RendererActorError {
    InvalidIdentity,
    StaleRendererGeneration,
    UnknownNode,
    SemanticRevisionMismatch,
    Renderer(RendererError),
    Input(RendererInputError),
    Semantic(SemanticError),
    Resource(UiResourceError),
    Animation(AnimationError),
    Command(RendererCommandError),
    Control(ControlRuntimeError),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RendererActorRestart {
    pub synthetic_input: Vec<SyntheticInput>,
    pub animation_completions: Vec<AnimationCompletion>,
    pub command_results: Vec<UiCommandResult>,
    pub resources_requiring_rebuild: Vec<UiResourceId>,
}

pub struct RendererActor {
    session: UiSessionId,
    root: UiRootId,
    ui_root_epoch: u32,
    app_code_epoch: u64,
    renderer_generation: Handle,
    config: RendererActorConfig,
    mirror: RendererMirror,
    input: RendererInputState,
    semantics: SemanticTree,
    resources: UiRendererResourceCache,
    animation: AnimationRuntime,
    commands: RendererCommandRuntime,
    controls: ControlRuntime,
}

impl RendererActor {
    pub fn new(
        session: UiSessionId,
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        renderer_generation: Handle,
        device_generation: Option<Handle>,
        config: RendererActorConfig,
    ) -> Result<Self, RendererActorError> {
        if !session.is_valid() || !root.is_valid() || !renderer_generation.is_valid() {
            return Err(RendererActorError::InvalidIdentity);
        }
        Ok(Self {
            session,
            root,
            ui_root_epoch,
            app_code_epoch,
            renderer_generation,
            config,
            mirror: RendererMirror::new(root, ui_root_epoch, app_code_epoch, config.mirror)
                .map_err(RendererActorError::Renderer)?,
            input: RendererInputState::new(session, config.input)
                .map_err(RendererActorError::Input)?,
            semantics: SemanticTree::new(root, config.semantics)
                .map_err(RendererActorError::Semantic)?,
            resources: UiRendererResourceCache::new(
                session,
                renderer_generation,
                device_generation,
                config.resources,
            )
            .map_err(RendererActorError::Resource)?,
            animation: AnimationRuntime::new(config.animation)
                .map_err(RendererActorError::Animation)?,
            commands: RendererCommandRuntime::new(
                root,
                ui_root_epoch,
                app_code_epoch,
                config.commands,
            )
            .map_err(RendererActorError::Command)?,
            controls: ControlRuntime::new(session, config.controls)
                .map_err(RendererActorError::Control)?,
        })
    }

    pub const fn session(&self) -> UiSessionId {
        self.session
    }

    pub const fn root(&self) -> UiRootId {
        self.root
    }

    pub const fn applied_revision(&self) -> u64 {
        self.mirror.applied_revision()
    }

    pub fn apply(&mut self, batch: &PresentationBatch) -> Result<u64, RendererActorError> {
        Ok(self.apply_at(batch, 0)?.0)
    }

    pub fn apply_at(
        &mut self,
        batch: &PresentationBatch,
        now_millis: u64,
    ) -> Result<(u64, Vec<RendererCommandAdmission>), RendererActorError> {
        let revision = self
            .mirror
            .apply(batch)
            .map_err(RendererActorError::Renderer)?;
        let commands = self
            .commands
            .apply_revision(revision, now_millis)
            .map_err(RendererActorError::Command)?;
        Ok((revision, commands))
    }

    pub fn prepare(
        &self,
        batch: &PresentationBatch,
    ) -> Result<PreparedRendererApply, RendererActorError> {
        self.mirror
            .prepare(batch)
            .map_err(RendererActorError::Renderer)
    }

    pub fn prepared_snapshot(&self, prepared: &PreparedRendererApply) -> RendererTreeSnapshot {
        self.mirror.prepared_snapshot(prepared)
    }

    pub fn commit_prepared(&mut self, prepared: PreparedRendererApply) -> u64 {
        self.mirror.commit(prepared)
    }

    pub fn commit_prepared_at(
        &mut self,
        prepared: PreparedRendererApply,
        now_millis: u64,
    ) -> Result<(u64, Vec<RendererCommandAdmission>), RendererActorError> {
        let revision = self.mirror.commit(prepared);
        let commands = self
            .commands
            .apply_revision(revision, now_millis)
            .map_err(RendererActorError::Command)?;
        Ok((revision, commands))
    }

    pub fn bind_node_ref(
        &mut self,
        logical: Handle,
        node: NodeId,
        binding_generation: u32,
    ) -> Result<(), RendererActorError> {
        self.commands
            .bind(logical, node, binding_generation)
            .map_err(RendererActorError::Command)
    }

    pub fn submit_command(
        &mut self,
        command: UiCommand,
        now_millis: u64,
    ) -> Result<RendererCommandAdmission, RendererActorError> {
        self.commands
            .submit(command, now_millis)
            .map_err(RendererActorError::Command)
    }

    pub fn next_command_deadline_millis(&self) -> Option<u64> {
        self.commands.next_deadline_millis()
    }

    pub fn expire_commands(&mut self, now_millis: u64) -> Vec<RendererCommandAdmission> {
        self.commands.expire(now_millis)
    }

    pub fn replace_semantics(
        &mut self,
        snapshot: SemanticSnapshot,
    ) -> Result<(), RendererActorError> {
        if snapshot.tree_revision != self.mirror.applied_revision() {
            return Err(RendererActorError::SemanticRevisionMismatch);
        }
        self.semantics
            .replace(snapshot)
            .map_err(RendererActorError::Semantic)
    }

    pub fn begin_animation(
        &mut self,
        node: NodeId,
        descriptor: AnimationDescriptor,
    ) -> Result<AnimationId, RendererActorError> {
        if self.mirror.node_kind(node).is_none() {
            return Err(RendererActorError::UnknownNode);
        }
        self.animation
            .begin(self.root, node, descriptor)
            .map_err(RendererActorError::Animation)
    }

    pub fn tick_animation(
        &mut self,
        now_millis: u64,
    ) -> Result<Vec<AnimationSample>, RendererActorError> {
        self.animation
            .tick(now_millis)
            .map_err(RendererActorError::Animation)
    }

    pub fn set_reduced_motion(&mut self, reduced: bool) -> Result<(), RendererActorError> {
        self.animation
            .set_reduced_motion(reduced)
            .map_err(RendererActorError::Animation)
    }

    pub fn request_resource(
        &mut self,
        publication: UiResourcePublication,
    ) -> Result<UiRendererResidencyWork, RendererActorError> {
        self.resources
            .request(publication)
            .map_err(RendererActorError::Resource)
    }

    pub fn input(&self) -> &RendererInputState {
        &self.input
    }

    pub fn input_mut(&mut self) -> &mut RendererInputState {
        &mut self.input
    }

    pub fn semantics(&self) -> &SemanticTree {
        &self.semantics
    }

    pub fn resources(&self) -> &UiRendererResourceCache {
        &self.resources
    }

    pub fn resources_mut(&mut self) -> &mut UiRendererResourceCache {
        &mut self.resources
    }

    pub fn controls(&self) -> &ControlRuntime {
        &self.controls
    }

    pub fn controls_mut(&mut self) -> &mut ControlRuntime {
        &mut self.controls
    }

    pub fn poll_animation_completion(&mut self) -> Option<AnimationCompletion> {
        self.animation.poll_completion()
    }

    pub fn restart(
        &mut self,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        renderer_generation: Handle,
        device_generation: Option<Handle>,
    ) -> Result<RendererActorRestart, RendererActorError> {
        if !renderer_generation.is_valid()
            || renderer_generation.index != self.renderer_generation.index
            || renderer_generation.generation <= self.renderer_generation.generation
        {
            return Err(RendererActorError::StaleRendererGeneration);
        }
        let next_mirror =
            RendererMirror::new(self.root, ui_root_epoch, app_code_epoch, self.config.mirror)
                .map_err(RendererActorError::Renderer)?;
        self.animation
            .preflight_close_root(self.root)
            .map_err(RendererActorError::Animation)?;
        let resources_requiring_rebuild = self
            .resources
            .restart(renderer_generation, device_generation)
            .map_err(RendererActorError::Resource)?;
        let synthetic_input = self.input.suspend();
        self.animation
            .close_root(self.root)
            .map_err(RendererActorError::Animation)?;
        let mut animation_completions = Vec::new();
        while let Some(completion) = self.animation.poll_completion() {
            animation_completions.push(completion);
        }
        let command_results = self
            .commands
            .restart(ui_root_epoch, app_code_epoch)
            .map_err(RendererActorError::Command)?;
        self.mirror = next_mirror;
        self.semantics = SemanticTree::new(self.root, self.config.semantics)
            .map_err(RendererActorError::Semantic)?;
        self.controls = ControlRuntime::new(self.session, self.config.controls)
            .map_err(RendererActorError::Control)?;
        self.ui_root_epoch = ui_root_epoch;
        self.app_code_epoch = app_code_epoch;
        self.renderer_generation = renderer_generation;
        Ok(RendererActorRestart {
            synthetic_input,
            animation_completions,
            command_results,
            resources_requiring_rebuild,
        })
    }
}
