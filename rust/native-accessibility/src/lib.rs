use std::collections::BTreeMap;

#[inline(never)]
pub fn vogui_profile_link_anchor() -> usize {
    module_path!().as_ptr() as usize
}

use vogui_protocol::v2::{NodeId, UiRootId};
use vogui_runtime::{
    accessibility::{AccessibilityApplyError, PlatformAccessibilityAdapter},
    semantics::{SemanticAction, SemanticNode, SemanticRole, SemanticSnapshot, SemanticStates},
};

#[cfg(all(target_os = "macos", feature = "macos-appkit"))]
mod appkit_sink;
#[cfg(all(target_os = "macos", feature = "macos-appkit"))]
pub use appkit_sink::{
    AppKitAccessibilityAction, AppKitAccessibilityActionReceiver, AppKitAccessibilitySink,
    AppKitFrameTransform,
};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NativeAccessibilityNode {
    pub node: NodeId,
    pub role: SemanticRole,
    pub label: String,
    pub description: String,
    pub value: String,
    pub locale: String,
    pub states: SemanticStates,
    pub actions: Vec<SemanticAction>,
    pub children: Vec<NodeId>,
    pub focus_order: Option<i32>,
    pub live: bool,
    pub x_milli: i32,
    pub y_milli: i32,
    pub width_milli: i32,
    pub height_milli: i32,
}

impl From<&SemanticNode> for NativeAccessibilityNode {
    fn from(node: &SemanticNode) -> Self {
        Self {
            node: node.node,
            role: node.role,
            label: node.label.clone(),
            description: node.description.clone(),
            value: node.value.clone(),
            locale: node.locale.clone(),
            states: node.states,
            actions: node.actions.iter().copied().collect(),
            children: node.children.clone(),
            focus_order: node.focus_order,
            live: node.live,
            x_milli: node.bounds.x_milli,
            y_milli: node.bounds.y_milli,
            width_milli: node.bounds.width_milli,
            height_milli: node.bounds.height_milli,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NativeAccessibilityTree {
    pub root_owner: UiRootId,
    pub tree_revision: u64,
    pub semantic_revision: u64,
    pub root: NodeId,
    pub nodes: BTreeMap<NodeId, NativeAccessibilityNode>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NativeAccessibilityError {
    pub code: u32,
    pub diagnostic: Vec<u8>,
    pub platform_may_be_partially_visible: bool,
}

pub trait NativeAccessibilityPlatform {
    type Prepared;

    fn prepare(
        &mut self,
        desired: &NativeAccessibilityTree,
    ) -> Result<Self::Prepared, NativeAccessibilityError>;

    fn commit(&mut self, prepared: Self::Prepared) -> Result<(), NativeAccessibilityError>;
    fn freeze_actions(&mut self);
    fn hide_tree(&mut self);
    fn close(&mut self);
}

pub struct NativeAccessibilityAdapter<P> {
    platform: P,
    committed: Option<NativeAccessibilityTree>,
    closed: bool,
}

impl<P: NativeAccessibilityPlatform> NativeAccessibilityAdapter<P> {
    pub fn new(platform: P) -> Self {
        Self {
            platform,
            committed: None,
            closed: false,
        }
    }

    pub fn committed(&self) -> Option<&NativeAccessibilityTree> {
        self.committed.as_ref()
    }

    pub fn platform(&self) -> &P {
        &self.platform
    }

    pub fn platform_mut(&mut self) -> &mut P {
        &mut self.platform
    }
}

impl<P: NativeAccessibilityPlatform> PlatformAccessibilityAdapter
    for NativeAccessibilityAdapter<P>
{
    fn apply_snapshot(
        &mut self,
        snapshot: &SemanticSnapshot,
    ) -> Result<(), AccessibilityApplyError> {
        if self.closed {
            return Err(accessibility_error(
                1,
                b"native accessibility adapter is closed",
            ));
        }
        let desired = NativeAccessibilityTree {
            root_owner: snapshot.root,
            tree_revision: snapshot.tree_revision,
            semantic_revision: snapshot.semantic_revision,
            root: snapshot.root_node,
            nodes: snapshot
                .nodes
                .iter()
                .map(|node| (node.node, NativeAccessibilityNode::from(node)))
                .collect(),
        };
        let prepared = self
            .platform
            .prepare(&desired)
            .map_err(map_platform_error)?;
        self.platform.commit(prepared).map_err(map_platform_error)?;
        self.committed = Some(desired);
        Ok(())
    }

    fn freeze_actions(&mut self) {
        self.platform.freeze_actions();
    }

    fn hide_or_detach_tree(&mut self) {
        self.platform.hide_tree();
        self.committed = None;
    }

    fn close(&mut self) {
        if !self.closed {
            self.platform.freeze_actions();
            self.platform.close();
            self.committed = None;
            self.closed = true;
        }
    }
}

fn map_platform_error(error: NativeAccessibilityError) -> AccessibilityApplyError {
    AccessibilityApplyError {
        code: error.code,
        diagnostic: error.diagnostic,
        platform_may_be_partially_visible: error.platform_may_be_partially_visible,
    }
}

fn accessibility_error(code: u32, diagnostic: &[u8]) -> AccessibilityApplyError {
    AccessibilityApplyError {
        code,
        diagnostic: diagnostic.to_vec(),
        platform_may_be_partially_visible: false,
    }
}

/// Small macOS boundary kept free of process globals and AppKit object
/// ownership. The host supplies one sink per UiRoot on its platform thread.
pub trait MacOsAccessibilitySink {
    type Transaction;

    fn stage(
        &mut self,
        desired: &NativeAccessibilityTree,
    ) -> Result<Self::Transaction, NativeAccessibilityError>;
    fn apply(&mut self, transaction: Self::Transaction) -> Result<(), NativeAccessibilityError>;
    fn set_actions_enabled(&mut self, enabled: bool);
    fn set_tree_visible(&mut self, visible: bool);
    fn close(&mut self);
}

pub struct MacOsAccessibilityPlatform<S> {
    sink: S,
}

impl<S> MacOsAccessibilityPlatform<S> {
    pub fn new(sink: S) -> Self {
        Self { sink }
    }

    pub fn sink(&self) -> &S {
        &self.sink
    }

    pub fn sink_mut(&mut self) -> &mut S {
        &mut self.sink
    }
}

impl<S: MacOsAccessibilitySink> NativeAccessibilityPlatform for MacOsAccessibilityPlatform<S> {
    type Prepared = S::Transaction;

    fn prepare(
        &mut self,
        desired: &NativeAccessibilityTree,
    ) -> Result<Self::Prepared, NativeAccessibilityError> {
        self.sink.stage(desired)
    }

    fn commit(&mut self, prepared: Self::Prepared) -> Result<(), NativeAccessibilityError> {
        self.sink.apply(prepared)?;
        self.sink.set_tree_visible(true);
        self.sink.set_actions_enabled(true);
        Ok(())
    }

    fn freeze_actions(&mut self) {
        self.sink.set_actions_enabled(false);
    }

    fn hide_tree(&mut self) {
        self.sink.set_tree_visible(false);
    }

    fn close(&mut self) {
        self.sink.set_actions_enabled(false);
        self.sink.set_tree_visible(false);
        self.sink.close();
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeSet;

    use super::*;
    use vogui_runtime::{
        accessibility::PlatformAccessibilityAdapter,
        semantics::{SemanticBounds, SemanticStates},
    };

    fn handle(index: u32) -> NodeId {
        NodeId {
            index,
            generation: 1,
        }
    }

    fn snapshot(revision: u64, label: &str) -> SemanticSnapshot {
        let root = handle(10);
        let node = handle(20);
        SemanticSnapshot {
            root,
            tree_revision: revision,
            semantic_revision: revision,
            root_node: node,
            nodes: vec![SemanticNode {
                node,
                role: SemanticRole::Button,
                label: label.to_owned(),
                description: String::new(),
                value: String::new(),
                locale: "en-US".to_owned(),
                bounds: SemanticBounds {
                    x_milli: 1,
                    y_milli: 2,
                    width_milli: 3,
                    height_milli: 4,
                },
                states: SemanticStates::default(),
                actions: BTreeSet::from([SemanticAction::Press]),
                relations: BTreeSet::new(),
                children: Vec::new(),
                focus_order: Some(0),
                live: false,
            }],
        }
    }

    #[derive(Default)]
    struct FakePlatform {
        prepared: Vec<NativeAccessibilityTree>,
        fail_prepare: bool,
        fail_commit: bool,
        freezes: usize,
        hides: usize,
        closes: usize,
    }

    impl NativeAccessibilityPlatform for FakePlatform {
        type Prepared = NativeAccessibilityTree;

        fn prepare(
            &mut self,
            desired: &NativeAccessibilityTree,
        ) -> Result<Self::Prepared, NativeAccessibilityError> {
            self.prepared.push(desired.clone());
            if self.fail_prepare {
                return Err(NativeAccessibilityError {
                    code: 41,
                    diagnostic: b"prepare".to_vec(),
                    platform_may_be_partially_visible: false,
                });
            }
            Ok(desired.clone())
        }

        fn commit(&mut self, prepared: Self::Prepared) -> Result<(), NativeAccessibilityError> {
            if self.fail_commit {
                return Err(NativeAccessibilityError {
                    code: 42,
                    diagnostic: b"commit".to_vec(),
                    platform_may_be_partially_visible: true,
                });
            }
            assert_eq!(self.prepared.last(), Some(&prepared));
            Ok(())
        }

        fn freeze_actions(&mut self) {
            self.freezes += 1;
        }

        fn hide_tree(&mut self) {
            self.hides += 1;
        }

        fn close(&mut self) {
            self.closes += 1;
        }
    }

    #[test]
    fn failed_platform_transaction_preserves_last_committed_tree() {
        let mut adapter = NativeAccessibilityAdapter::new(FakePlatform::default());
        adapter.apply_snapshot(&snapshot(1, "save")).unwrap();
        let committed = adapter.committed().cloned().unwrap();
        assert_eq!(committed.nodes[&handle(20)].label, "save");

        adapter.platform_mut().fail_commit = true;
        let error = adapter.apply_snapshot(&snapshot(2, "discard")).unwrap_err();
        assert_eq!(error.code, 42);
        assert!(error.platform_may_be_partially_visible);
        assert_eq!(adapter.committed(), Some(&committed));
    }

    #[test]
    fn detach_and_close_clear_ownership_and_are_idempotent() {
        let mut adapter = NativeAccessibilityAdapter::new(FakePlatform::default());
        adapter.apply_snapshot(&snapshot(1, "root")).unwrap();
        adapter.hide_or_detach_tree();
        assert!(adapter.committed().is_none());
        assert_eq!(adapter.platform().hides, 1);

        adapter.close();
        adapter.close();
        assert_eq!(adapter.platform().freezes, 1);
        assert_eq!(adapter.platform().closes, 1);
        let error = adapter.apply_snapshot(&snapshot(2, "closed")).unwrap_err();
        assert_eq!(error.code, 1);
    }
}
