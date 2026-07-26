use vogui_protocol::v2::{Handle, UiRootId, UiSessionId};
use vogui_runtime::{
    command::RendererCommandAdmission,
    platform_renderer::{HeadlessRenderer, PlatformRendererActor, PlatformRendererError},
    presentation::{RendererActor, RendererActorConfig},
    PresentationBatch,
};

#[inline(never)]
pub fn vogui_profile_link_anchor() -> usize {
    module_path!().as_ptr() as usize
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct HeadlessRendererIdentity {
    pub session: UiSessionId,
    pub root: UiRootId,
    pub ui_root_epoch: u32,
    pub app_code_epoch: u64,
    pub renderer_generation: Handle,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct HeadlessRendererConfig {
    pub actor: RendererActorConfig,
}

impl Default for HeadlessRendererConfig {
    fn default() -> Self {
        Self {
            actor: RendererActorConfig::default(),
        }
    }
}

pub struct HeadlessRoot {
    identity: HeadlessRendererIdentity,
    actor: PlatformRendererActor<HeadlessRenderer>,
}

impl HeadlessRoot {
    pub fn new(
        identity: HeadlessRendererIdentity,
        config: HeadlessRendererConfig,
    ) -> Result<Self, PlatformRendererError> {
        if !identity.session.is_valid()
            || !identity.root.is_valid()
            || identity.ui_root_epoch == 0
            || identity.app_code_epoch == 0
            || !identity.renderer_generation.is_valid()
        {
            return Err(PlatformRendererError::Poisoned);
        }
        let runtime = RendererActor::new(
            identity.session,
            identity.root,
            identity.ui_root_epoch,
            identity.app_code_epoch,
            identity.renderer_generation,
            None,
            config.actor,
        )
        .map_err(PlatformRendererError::Runtime)?;
        Ok(Self {
            identity,
            actor: PlatformRendererActor::new(runtime, HeadlessRenderer::new()),
        })
    }

    pub const fn identity(&self) -> HeadlessRendererIdentity {
        self.identity
    }

    pub fn apply(
        &mut self,
        batch: &PresentationBatch,
        now_millis: u64,
    ) -> Result<u64, PlatformRendererError> {
        self.actor
            .apply_at(batch, now_millis)
            .map(|(revision, _)| revision)
    }

    pub fn revision(&self) -> u64 {
        self.actor.platform().revision()
    }

    pub fn next_command_deadline_millis(&self) -> Option<u64> {
        self.actor.next_command_deadline_millis()
    }

    pub fn service_command_deadlines(
        &mut self,
        now_millis: u64,
    ) -> Result<Vec<RendererCommandAdmission>, PlatformRendererError> {
        self.actor.service_command_deadlines(now_millis)
    }

    pub fn require_resync(&mut self) {
        self.actor.require_resync();
    }

    pub fn close(&mut self) {
        self.actor.close();
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::*;
    use vogui_runtime::{
        platform_renderer::PlatformRendererError,
        tree::{ViewKind, ViewNode},
        RootView, UiSession, UiSessionConfig,
    };

    fn handle(index: u32) -> Handle {
        Handle {
            index,
            generation: 1,
        }
    }

    fn identity(session: Handle, root: Handle) -> HeadlessRendererIdentity {
        HeadlessRendererIdentity {
            session,
            root,
            ui_root_epoch: 1,
            app_code_epoch: 1,
            renderer_generation: handle(20),
        }
    }

    #[test]
    fn applies_real_session_batches_and_freezes_after_resync_request() {
        let session_id = handle(1);
        let mut session = UiSession::new(session_id, UiSessionConfig::default()).unwrap();
        let root = session.attach_root().unwrap();
        session
            .commit_views(vec![RootView {
                root,
                view: ViewNode {
                    key: None,
                    kind: ViewKind::Element("panel".to_owned()),
                    props: BTreeMap::new(),
                    children: vec![ViewNode {
                        key: None,
                        kind: ViewKind::Text("ready".to_owned()),
                        props: BTreeMap::new(),
                        children: Vec::new(),
                    }],
                },
            }])
            .unwrap();
        let batch = session.poll_presentation(root).unwrap().unwrap();
        let mut renderer = HeadlessRoot::new(
            identity(session_id, root),
            HeadlessRendererConfig::default(),
        )
        .unwrap();
        assert_eq!(renderer.apply(&batch, 5), Ok(1));
        assert_eq!(renderer.revision(), 1);

        renderer.require_resync();
        assert_eq!(
            renderer.apply(&batch, 6),
            Err(PlatformRendererError::Poisoned)
        );
        renderer.close();
        assert_eq!(
            renderer.apply(&batch, 7),
            Err(PlatformRendererError::Closed)
        );
    }

    #[test]
    fn invalid_identity_is_rejected_before_actor_creation() {
        let mut invalid = identity(handle(1), handle(2));
        invalid.ui_root_epoch = 0;
        assert!(matches!(
            HeadlessRoot::new(invalid, HeadlessRendererConfig::default()),
            Err(PlatformRendererError::Poisoned)
        ));
    }
}
