use std::collections::{BTreeMap, BTreeSet};

use vogui_protocol::v2::{Handle, NodeId, UiRootId};

use crate::{tree::ViewKind, PresentationBatch};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RendererConfig {
    pub max_nodes: usize,
    pub max_patches: usize,
    pub max_payload_bytes: usize,
    pub max_string_bytes: usize,
    pub max_props_per_node: usize,
}

impl Default for RendererConfig {
    fn default() -> Self {
        Self {
            max_nodes: 100_000,
            max_patches: 300_000,
            max_payload_bytes: 8 * 1024 * 1024,
            max_string_bytes: 1024 * 1024,
            max_props_per_node: 256,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RendererError {
    InvalidConfig,
    WrongRoot,
    StaleRootEpoch,
    StaleAppCodeEpoch,
    BaseRevisionMismatch,
    RevisionMismatch,
    PayloadCapacity,
    Truncated,
    Malformed,
    InvalidNode,
    NodeCapacity,
    PatchCapacity,
    StringCapacity,
    PropertyCapacity,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct MirrorNode {
    parent: Option<NodeId>,
    children: Vec<NodeId>,
    kind: Option<ViewKind>,
    props: BTreeMap<String, String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RendererMutation {
    Create(NodeId, Option<NodeId>, usize),
    Remove(NodeId),
    Move(NodeId, Option<NodeId>, usize),
    SetKind(NodeId, ViewKind),
    SetProps(NodeId, BTreeMap<String, String>),
    BindEvent(NodeId, u8, Handle, u8),
    UnbindEvent(Handle),
    BindRef(NodeId, Handle, u32),
    UnbindRef(Handle),
    AttachResource(NodeId, Handle, u64),
    DetachResource(NodeId, Handle),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RendererTreeNode {
    pub node: NodeId,
    pub parent: Option<NodeId>,
    pub children: Vec<NodeId>,
    pub kind: ViewKind,
    pub props: BTreeMap<String, String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RendererTreeSnapshot {
    pub root: UiRootId,
    pub revision: u64,
    pub tree_root: NodeId,
    pub nodes: Vec<RendererTreeNode>,
}

pub struct PreparedRendererApply {
    revision: u64,
    tree_root: NodeId,
    nodes: BTreeMap<NodeId, MirrorNode>,
    mutations: Vec<RendererMutation>,
    replacement: bool,
}

impl PreparedRendererApply {
    pub const fn revision(&self) -> u64 {
        self.revision
    }

    pub const fn replacement(&self) -> bool {
        self.replacement
    }

    pub fn mutations(&self) -> &[RendererMutation] {
        &self.mutations
    }
}

pub struct RendererMirror {
    root: UiRootId,
    ui_root_epoch: u32,
    app_code_epoch: u64,
    applied_revision: u64,
    tree_root: Option<NodeId>,
    nodes: BTreeMap<NodeId, MirrorNode>,
    config: RendererConfig,
}

impl RendererMirror {
    pub fn new(
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        config: RendererConfig,
    ) -> Result<Self, RendererError> {
        if !root.is_valid()
            || ui_root_epoch == 0
            || app_code_epoch == 0
            || config.max_nodes == 0
            || config.max_patches == 0
            || config.max_payload_bytes == 0
            || config.max_string_bytes == 0
            || config.max_props_per_node == 0
        {
            return Err(RendererError::InvalidConfig);
        }
        Ok(Self {
            root,
            ui_root_epoch,
            app_code_epoch,
            applied_revision: 0,
            tree_root: None,
            nodes: BTreeMap::new(),
            config,
        })
    }

    pub const fn applied_revision(&self) -> u64 {
        self.applied_revision
    }

    pub fn node_kind(&self, node: NodeId) -> Option<&ViewKind> {
        self.nodes.get(&node)?.kind.as_ref()
    }

    pub fn apply(&mut self, batch: &PresentationBatch) -> Result<u64, RendererError> {
        let prepared = self.prepare(batch)?;
        Ok(self.commit(prepared))
    }

    pub fn prepare(
        &self,
        batch: &PresentationBatch,
    ) -> Result<PreparedRendererApply, RendererError> {
        let (root, root_epoch, app_epoch, outer_base, outer_new, bytes, snapshot) = match batch {
            PresentationBatch::Patch {
                root,
                ui_root_epoch,
                app_code_epoch,
                base_revision,
                new_revision,
                bytes,
            } => (
                *root,
                *ui_root_epoch,
                *app_code_epoch,
                *base_revision,
                *new_revision,
                bytes.as_slice(),
                false,
            ),
            PresentationBatch::SnapshotRequired {
                root,
                ui_root_epoch,
                app_code_epoch,
                revision,
                bytes,
            } => (
                *root,
                *ui_root_epoch,
                *app_code_epoch,
                0,
                *revision,
                bytes.as_slice(),
                true,
            ),
        };
        if root != self.root {
            return Err(RendererError::WrongRoot);
        }
        if root_epoch != self.ui_root_epoch {
            return Err(RendererError::StaleRootEpoch);
        }
        if app_epoch != self.app_code_epoch {
            return Err(RendererError::StaleAppCodeEpoch);
        }
        if !snapshot && outer_base != self.applied_revision {
            return Err(RendererError::BaseRevisionMismatch);
        }
        if bytes.len() > self.config.max_payload_bytes {
            return Err(RendererError::PayloadCapacity);
        }
        let transactions = Decoder::new(bytes, &self.config).transactions()?;
        if transactions.is_empty()
            || transactions[0].base_revision != outer_base
            || transactions.last().unwrap().new_revision != outer_new
            || transactions
                .windows(2)
                .any(|pair| pair[0].new_revision != pair[1].base_revision)
        {
            return Err(RendererError::RevisionMismatch);
        }
        let mut nodes = if snapshot {
            BTreeMap::new()
        } else {
            self.nodes.clone()
        };
        let mut tree_root = if snapshot { None } else { self.tree_root };
        let mut mutations = Vec::new();
        for transaction in transactions {
            tree_root = Some(transaction.root);
            for patch in transaction.patches {
                apply_patch(&mut nodes, &patch, &self.config)?;
                mutations.push(patch);
            }
        }
        validate_tree(&nodes, tree_root, self.config.max_nodes)?;
        Ok(PreparedRendererApply {
            revision: outer_new,
            tree_root: tree_root.unwrap(),
            nodes,
            mutations,
            replacement: snapshot,
        })
    }

    pub fn prepared_snapshot(&self, prepared: &PreparedRendererApply) -> RendererTreeSnapshot {
        tree_snapshot(
            self.root,
            prepared.revision,
            prepared.tree_root,
            &prepared.nodes,
        )
    }

    pub fn snapshot(&self) -> Option<RendererTreeSnapshot> {
        Some(tree_snapshot(
            self.root,
            self.applied_revision,
            self.tree_root?,
            &self.nodes,
        ))
    }

    pub fn commit(&mut self, prepared: PreparedRendererApply) -> u64 {
        self.nodes = prepared.nodes;
        self.tree_root = Some(prepared.tree_root);
        self.applied_revision = prepared.revision;
        prepared.revision
    }
}

#[derive(Clone, Debug)]
struct Transaction {
    base_revision: u64,
    new_revision: u64,
    root: NodeId,
    patches: Vec<RendererMutation>,
}

struct Decoder<'a> {
    bytes: &'a [u8],
    offset: usize,
    config: &'a RendererConfig,
    patch_count: usize,
}

impl<'a> Decoder<'a> {
    fn new(bytes: &'a [u8], config: &'a RendererConfig) -> Self {
        Self {
            bytes,
            offset: 0,
            config,
            patch_count: 0,
        }
    }

    fn transactions(mut self) -> Result<Vec<Transaction>, RendererError> {
        let mut result = Vec::new();
        while self.offset < self.bytes.len() {
            let base_revision = self.u64()?;
            let new_revision = self.u64()?;
            let root = self.handle()?;
            let count = self.u32()? as usize;
            self.patch_count = self
                .patch_count
                .checked_add(count)
                .filter(|count| *count <= self.config.max_patches)
                .ok_or(RendererError::PatchCapacity)?;
            let mut patches = Vec::with_capacity(count.min(self.config.max_patches));
            for _ in 0..count {
                patches.push(match self.u8()? {
                    1 => RendererMutation::Create(
                        self.handle()?,
                        self.optional_handle()?,
                        self.u32()? as usize,
                    ),
                    2 => RendererMutation::Remove(self.handle()?),
                    3 => RendererMutation::Move(
                        self.handle()?,
                        self.optional_handle()?,
                        self.u32()? as usize,
                    ),
                    4 => {
                        let node = self.handle()?;
                        let kind = match self.u8()? {
                            1 => ViewKind::Element(self.string()?),
                            2 => ViewKind::Text(self.string()?),
                            _ => return Err(RendererError::Malformed),
                        };
                        RendererMutation::SetKind(node, kind)
                    }
                    5 => {
                        let node = self.handle()?;
                        let count = self.u32()? as usize;
                        if count > self.config.max_props_per_node {
                            return Err(RendererError::PropertyCapacity);
                        }
                        let mut props = BTreeMap::new();
                        for _ in 0..count {
                            if props.insert(self.string()?, self.string()?).is_some() {
                                return Err(RendererError::Malformed);
                            }
                        }
                        RendererMutation::SetProps(node, props)
                    }
                    6 => RendererMutation::BindEvent(
                        self.handle()?,
                        self.u8()?,
                        self.handle()?,
                        self.u8()?,
                    ),
                    7 => RendererMutation::UnbindEvent(self.handle()?),
                    8 => RendererMutation::BindRef(self.handle()?, self.handle()?, self.u32()?),
                    9 => RendererMutation::UnbindRef(self.handle()?),
                    10 => RendererMutation::AttachResource(
                        self.handle()?,
                        self.handle()?,
                        self.u64()?,
                    ),
                    11 => RendererMutation::DetachResource(self.handle()?, self.handle()?),
                    _ => return Err(RendererError::Malformed),
                });
            }
            result.push(Transaction {
                base_revision,
                new_revision,
                root,
                patches,
            });
        }
        Ok(result)
    }

    fn take<const N: usize>(&mut self) -> Result<[u8; N], RendererError> {
        let end = self.offset.checked_add(N).ok_or(RendererError::Truncated)?;
        let bytes = self
            .bytes
            .get(self.offset..end)
            .ok_or(RendererError::Truncated)?;
        self.offset = end;
        Ok(bytes.try_into().unwrap())
    }

    fn u8(&mut self) -> Result<u8, RendererError> {
        Ok(self.take::<1>()?[0])
    }

    fn u32(&mut self) -> Result<u32, RendererError> {
        Ok(u32::from_le_bytes(self.take()?))
    }

    fn u64(&mut self) -> Result<u64, RendererError> {
        Ok(u64::from_le_bytes(self.take()?))
    }

    fn handle(&mut self) -> Result<Handle, RendererError> {
        let handle = Handle {
            index: self.u32()?,
            generation: self.u32()?,
        };
        handle
            .is_valid()
            .then_some(handle)
            .ok_or(RendererError::InvalidNode)
    }

    fn optional_handle(&mut self) -> Result<Option<Handle>, RendererError> {
        match self.u8()? {
            0 => Ok(None),
            1 => Ok(Some(self.handle()?)),
            _ => Err(RendererError::Malformed),
        }
    }

    fn string(&mut self) -> Result<String, RendererError> {
        let len = self.u32()? as usize;
        if len > self.config.max_string_bytes {
            return Err(RendererError::StringCapacity);
        }
        let end = self
            .offset
            .checked_add(len)
            .ok_or(RendererError::Truncated)?;
        let bytes = self
            .bytes
            .get(self.offset..end)
            .ok_or(RendererError::Truncated)?;
        self.offset = end;
        String::from_utf8(bytes.to_vec()).map_err(|_| RendererError::Malformed)
    }
}

fn apply_patch(
    nodes: &mut BTreeMap<NodeId, MirrorNode>,
    patch: &RendererMutation,
    config: &RendererConfig,
) -> Result<(), RendererError> {
    match patch {
        RendererMutation::Create(node, parent, index) => {
            if nodes.contains_key(&node) || nodes.len() == config.max_nodes {
                return Err(RendererError::NodeCapacity);
            }
            if let Some(parent) = *parent {
                let parent = nodes.get_mut(&parent).ok_or(RendererError::InvalidNode)?;
                if *index > parent.children.len() {
                    return Err(RendererError::InvalidNode);
                }
                parent.children.insert(*index, *node);
            }
            nodes.insert(
                *node,
                MirrorNode {
                    parent: *parent,
                    children: Vec::new(),
                    kind: None,
                    props: BTreeMap::new(),
                },
            );
        }
        RendererMutation::Remove(node) => {
            let removed = nodes.remove(node).ok_or(RendererError::InvalidNode)?;
            if let Some(parent) = removed.parent {
                if let Some(parent) = nodes.get_mut(&parent) {
                    parent.children.retain(|child| *child != *node);
                }
            }
        }
        RendererMutation::Move(node, parent, index) => {
            let old_parent = nodes.get(node).ok_or(RendererError::InvalidNode)?.parent;
            if let Some(old_parent) = old_parent {
                nodes
                    .get_mut(&old_parent)
                    .ok_or(RendererError::InvalidNode)?
                    .children
                    .retain(|child| *child != *node);
            }
            if let Some(parent) = *parent {
                let parent_node = nodes.get_mut(&parent).ok_or(RendererError::InvalidNode)?;
                if *index > parent_node.children.len() {
                    return Err(RendererError::InvalidNode);
                }
                parent_node.children.insert(*index, *node);
            }
            nodes.get_mut(node).unwrap().parent = *parent;
        }
        RendererMutation::SetKind(node, kind) => {
            nodes.get_mut(node).ok_or(RendererError::InvalidNode)?.kind = Some(kind.clone());
        }
        RendererMutation::SetProps(node, props) => {
            nodes.get_mut(node).ok_or(RendererError::InvalidNode)?.props = props.clone();
        }
        RendererMutation::BindEvent(node, event_kind, _, policy) => {
            if !nodes.contains_key(node) || *event_kind == 0 || (*policy & 0xf0) != 0 {
                return Err(RendererError::InvalidNode);
            }
        }
        RendererMutation::BindRef(node, _, binding_generation) => {
            if !nodes.contains_key(node) || *binding_generation == 0 {
                return Err(RendererError::InvalidNode);
            }
        }
        RendererMutation::AttachResource(node, _, source_revision) => {
            if !nodes.contains_key(node) || *source_revision == 0 {
                return Err(RendererError::InvalidNode);
            }
        }
        RendererMutation::UnbindEvent(_)
        | RendererMutation::UnbindRef(_)
        | RendererMutation::DetachResource(_, _) => {}
    }
    Ok(())
}

fn tree_snapshot(
    root: UiRootId,
    revision: u64,
    tree_root: NodeId,
    nodes: &BTreeMap<NodeId, MirrorNode>,
) -> RendererTreeSnapshot {
    RendererTreeSnapshot {
        root,
        revision,
        tree_root,
        nodes: nodes
            .iter()
            .map(|(node, record)| RendererTreeNode {
                node: *node,
                parent: record.parent,
                children: record.children.clone(),
                kind: record
                    .kind
                    .clone()
                    .expect("validated renderer tree has node kinds"),
                props: record.props.clone(),
            })
            .collect(),
    }
}

fn validate_tree(
    nodes: &BTreeMap<NodeId, MirrorNode>,
    root: Option<NodeId>,
    max_nodes: usize,
) -> Result<(), RendererError> {
    let root = root.ok_or(RendererError::InvalidNode)?;
    if nodes.len() > max_nodes || !nodes.contains_key(&root) {
        return Err(RendererError::InvalidNode);
    }
    let mut visited = BTreeSet::new();
    let mut pending = vec![root];
    while let Some(node) = pending.pop() {
        if !visited.insert(node) {
            return Err(RendererError::InvalidNode);
        }
        let node_state = &nodes[&node];
        if node_state.kind.is_none() {
            return Err(RendererError::InvalidNode);
        }
        for child in &node_state.children {
            if nodes
                .get(child)
                .is_none_or(|child_state| child_state.parent != Some(node))
            {
                return Err(RendererError::InvalidNode);
            }
            pending.push(*child);
        }
    }
    if visited.len() != nodes.len() {
        return Err(RendererError::InvalidNode);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        async_runtime::AsyncConfig,
        command::CommandQueueConfig,
        tree::{TreeConfig, ViewNode},
        RootView, UiReturn, UiSession, UiSessionConfig,
    };

    fn handle(index: u32) -> Handle {
        Handle {
            index,
            generation: 1,
        }
    }

    fn session() -> UiSession {
        UiSession::new(
            handle(7),
            UiSessionConfig {
                max_roots: 1,
                max_patch_bytes: 4096,
                max_pending_bytes_per_root: 4096,
                max_return_items: 8,
                tree: TreeConfig {
                    max_nodes: 16,
                    max_slots: 32,
                    max_depth: 8,
                    max_string_bytes: 1024,
                    max_props_per_node: 8,
                    max_events: 8,
                },
                command: CommandQueueConfig::default(),
                async_registry: AsyncConfig::default(),
                resources: crate::resource::UiResourceStoreConfig::default(),
                styles: crate::layout_style::StyleStoreConfig::default(),
                reload: crate::reload::ReloadConfig::default(),
                node_refs: crate::ref_runtime::NodeRefRegistryConfig::default(),
                interaction: crate::interaction::InteractionConfig::default(),
                document: crate::document::DocumentRuntimeConfig::default(),
                performance: crate::performance::UiPerformanceConfig::default(),
            },
        )
        .unwrap()
    }

    fn view(text: &str) -> ViewNode {
        ViewNode {
            key: None,
            kind: ViewKind::Element("div".to_owned()),
            props: BTreeMap::new(),
            children: vec![ViewNode {
                key: None,
                kind: ViewKind::Text(text.to_owned()),
                props: BTreeMap::new(),
                children: Vec::new(),
            }],
        }
    }

    #[test]
    fn patch_failure_preserves_last_good_and_snapshot_replaces_from_zero() {
        let mut session = session();
        let root = session.attach_root().unwrap();
        let commit = session
            .commit_views(vec![RootView {
                root,
                view: view("one"),
            }])
            .unwrap();
        let root_node = commit.transactions[0].1.root;
        let patch = session.poll_presentation(root).unwrap().unwrap();
        let mut mirror = RendererMirror::new(root, 1, 1, RendererConfig::default()).unwrap();
        assert_eq!(mirror.apply(&patch), Ok(1));
        assert_eq!(
            mirror.node_kind(root_node),
            Some(&ViewKind::Element("div".to_owned()))
        );

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
        let replacement_commit = session
            .commit_views(vec![RootView {
                root,
                view: ViewNode {
                    key: None,
                    kind: ViewKind::Text("replacement".to_owned()),
                    props: BTreeMap::new(),
                    children: Vec::new(),
                },
            }])
            .unwrap();
        let replacement_root = replacement_commit.transactions[0].1.root;
        let replacement_patch = session.poll_presentation(root).unwrap().unwrap();
        assert_eq!(mirror.apply(&replacement_patch), Ok(2));
        assert!(mirror.node_kind(root_node).is_none());
        assert_eq!(
            mirror.node_kind(replacement_root),
            Some(&ViewKind::Text("replacement".to_owned()))
        );

        let malformed = PresentationBatch::Patch {
            root,
            ui_root_epoch: 1,
            app_code_epoch: 1,
            base_revision: 2,
            new_revision: 3,
            bytes: vec![0; 4],
        };
        assert_eq!(mirror.apply(&malformed), Err(RendererError::Truncated));
        assert_eq!(mirror.applied_revision(), 2);
        assert_eq!(
            mirror.node_kind(replacement_root),
            Some(&ViewKind::Text("replacement".to_owned()))
        );

        session.restart_renderer(root).unwrap();
        let snapshot = session.poll_presentation(root).unwrap().unwrap();
        let mut replacement = RendererMirror::new(root, 2, 1, RendererConfig::default()).unwrap();
        assert_eq!(replacement.apply(&snapshot), Ok(2));
        assert_eq!(
            replacement.node_kind(replacement_root),
            Some(&ViewKind::Text("replacement".to_owned()))
        );
    }

    #[test]
    fn identity_and_base_revision_are_checked_before_decode_or_mutation() {
        let root = handle(1);
        let mut mirror = RendererMirror::new(root, 1, 1, RendererConfig::default()).unwrap();
        let batch = PresentationBatch::Patch {
            root,
            ui_root_epoch: 1,
            app_code_epoch: 1,
            base_revision: 9,
            new_revision: 10,
            bytes: Vec::new(),
        };
        assert_eq!(
            mirror.apply(&batch),
            Err(RendererError::BaseRevisionMismatch)
        );
        assert_eq!(mirror.applied_revision(), 0);
        let foreign = PresentationBatch::Patch {
            root: handle(2),
            ui_root_epoch: 1,
            app_code_epoch: 1,
            base_revision: 9,
            new_revision: 10,
            bytes: Vec::new(),
        };
        assert_eq!(mirror.apply(&foreign), Err(RendererError::WrongRoot));
    }
}
