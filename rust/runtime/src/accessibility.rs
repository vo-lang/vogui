use crate::semantics::{
    SemanticActionRequest, SemanticConfig, SemanticError, SemanticSnapshot, SemanticTree,
};
use vogui_protocol::v2::UiRootId;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AccessibilityApplyError {
    pub code: u32,
    pub diagnostic: Vec<u8>,
    pub platform_may_be_partially_visible: bool,
}

pub trait PlatformAccessibilityAdapter {
    fn apply_snapshot(
        &mut self,
        snapshot: &SemanticSnapshot,
    ) -> Result<(), AccessibilityApplyError>;
    fn freeze_actions(&mut self);
    fn hide_or_detach_tree(&mut self);
    fn close(&mut self);
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AccessibilityHealth {
    Healthy,
    Poisoned,
    Closed,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AccessibilityError {
    Closed,
    Poisoned,
    Semantics(SemanticError),
    Platform(AccessibilityApplyError),
}

pub struct AccessibilityActor<P> {
    tree: SemanticTree,
    platform: P,
    health: AccessibilityHealth,
}

impl<P: PlatformAccessibilityAdapter> AccessibilityActor<P> {
    pub fn new(
        root: UiRootId,
        config: SemanticConfig,
        platform: P,
    ) -> Result<Self, AccessibilityError> {
        Ok(Self {
            tree: SemanticTree::new(root, config).map_err(AccessibilityError::Semantics)?,
            platform,
            health: AccessibilityHealth::Healthy,
        })
    }

    pub const fn health(&self) -> AccessibilityHealth {
        self.health
    }

    pub fn snapshot(&self) -> Option<SemanticSnapshot> {
        self.tree.snapshot()
    }

    pub fn platform(&self) -> &P {
        &self.platform
    }

    pub fn platform_mut(&mut self) -> &mut P {
        &mut self.platform
    }

    pub fn apply(&mut self, snapshot: SemanticSnapshot) -> Result<(), AccessibilityError> {
        match self.health {
            AccessibilityHealth::Closed => return Err(AccessibilityError::Closed),
            AccessibilityHealth::Poisoned => return Err(AccessibilityError::Poisoned),
            AccessibilityHealth::Healthy => {}
        }
        let mut staged = self.tree.clone();
        staged
            .replace(snapshot)
            .map_err(AccessibilityError::Semantics)?;
        let desired = staged
            .snapshot()
            .expect("successful semantic replacement always has a root");
        if let Err(error) = self.platform.apply_snapshot(&desired) {
            self.platform.freeze_actions();
            self.platform.hide_or_detach_tree();
            self.health = AccessibilityHealth::Poisoned;
            return Err(AccessibilityError::Platform(error));
        }
        self.tree = staged;
        Ok(())
    }

    pub fn submit_platform_action(
        &mut self,
        request: SemanticActionRequest,
    ) -> Result<(), AccessibilityError> {
        match self.health {
            AccessibilityHealth::Closed => return Err(AccessibilityError::Closed),
            AccessibilityHealth::Poisoned => return Err(AccessibilityError::Poisoned),
            AccessibilityHealth::Healthy => {}
        }
        self.tree
            .submit_action(request)
            .map_err(AccessibilityError::Semantics)
    }

    pub fn poll_action(&mut self) -> Option<SemanticActionRequest> {
        self.tree.poll_action()
    }

    pub fn close(&mut self) {
        if self.health == AccessibilityHealth::Closed {
            return;
        }
        self.platform.freeze_actions();
        self.platform.close();
        self.health = AccessibilityHealth::Closed;
    }
}
