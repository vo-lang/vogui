use std::collections::{BTreeMap, BTreeSet};

use vogui_protocol::v2::{EventToken, Handle, NodeId, NodeRef};

const ROOT_SCOPE_HASH: u64 = 0xcbf2_9ce4_8422_2325;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ViewKind {
    Element(String),
    Text(String),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ViewNode {
    pub key: Option<String>,
    pub kind: ViewKind,
    pub props: BTreeMap<String, String>,
    pub children: Vec<ViewNode>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TreeConfig {
    pub max_nodes: usize,
    pub max_slots: usize,
    pub max_depth: usize,
    pub max_string_bytes: usize,
    pub max_props_per_node: usize,
    pub max_events: usize,
}

impl Default for TreeConfig {
    fn default() -> Self {
        Self {
            max_nodes: 100_000,
            max_slots: 200_000,
            max_depth: 256,
            max_string_bytes: 1024 * 1024,
            max_props_per_node: 256,
            max_events: 100_000,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TreeError {
    InvalidConfig,
    NodeCapacity,
    SlotCapacity,
    DepthCapacity,
    StringCapacity,
    PropertyCapacity,
    EventCapacity,
    InvalidEvent,
    DuplicateKey,
    InvalidNodeRef,
    RevisionExhausted,
    GenerationExhausted,
    StalePreparedRevision,
    InvalidScope,
    DuplicateScopePath,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum UiPatch {
    Create {
        node: NodeId,
        parent: Option<NodeId>,
        index: usize,
    },
    Remove {
        node: NodeId,
    },
    Move {
        node: NodeId,
        parent: Option<NodeId>,
        index: usize,
    },
    SetKind {
        node: NodeId,
        kind: ViewKind,
    },
    SetProps {
        node: NodeId,
        props: BTreeMap<String, String>,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UiTransaction {
    pub base_revision: u64,
    pub new_revision: u64,
    pub root: NodeId,
    pub patches: Vec<UiPatch>,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct TreeInstrumentation {
    pub nodes: usize,
    pub peak_nodes: usize,
    pub reconciles: u64,
    pub scanned_nodes: u64,
    pub dirty_patches: u64,
    pub node_allocations: u64,
    pub node_releases: u64,
}

pub(crate) struct PreparedReconcile {
    transaction: UiTransaction,
    state: Option<PreparedTreeState>,
    scanned_nodes: usize,
}

impl PreparedReconcile {
    pub(crate) fn transaction(&self) -> &UiTransaction {
        &self.transaction
    }

    pub(crate) const fn scanned_nodes(&self) -> usize {
        self.scanned_nodes
    }

    pub(crate) fn resolve_child_scope_identity(
        &self,
        current: &RetainedTree,
        path: &[usize],
    ) -> Result<(u64, u32), TreeError> {
        let Some(state) = &self.state else {
            let node = current.resolve_child_path(path)?;
            return current.node_scope_identity(node);
        };
        let mut node = self.transaction.root;
        for index in path {
            node = *state
                .node(current, node)
                .and_then(|retained| retained.children.get(*index))
                .ok_or(TreeError::InvalidNodeRef)?;
        }
        let retained = state.node(current, node).ok_or(TreeError::InvalidNodeRef)?;
        Ok((retained.scope_path_hash, node.generation))
    }

    pub(crate) fn resolve_child_node(
        &self,
        current: &RetainedTree,
        path: &[usize],
    ) -> Result<NodeId, TreeError> {
        let Some(state) = &self.state else {
            return current.resolve_child_path(path);
        };
        let mut node = self.transaction.root;
        for index in path {
            node = *state
                .node(current, node)
                .and_then(|retained| retained.children.get(*index))
                .ok_or(TreeError::InvalidNodeRef)?;
        }
        Ok(node)
    }
}

enum PreparedTreeState {
    Full {
        nodes: BTreeMap<NodeId, RetainedNode>,
        generations: Vec<u32>,
        free: Vec<u32>,
        removed: Vec<NodeId>,
    },
    Scope {
        nodes: BTreeMap<NodeId, RetainedNode>,
        removed: Vec<NodeId>,
        consumed_free: usize,
        appended_slots: usize,
        retired_generations: Vec<(u32, u32)>,
    },
}

impl PreparedTreeState {
    fn node<'a>(&'a self, current: &'a RetainedTree, node: NodeId) -> Option<&'a RetainedNode> {
        match self {
            Self::Full { nodes, .. } | Self::Scope { nodes, .. } => {
                nodes.get(&node).or_else(|| current.nodes.get(&node))
            }
        }
    }
}

#[derive(Clone, Debug)]
struct RetainedNode {
    key: Option<String>,
    kind: ViewKind,
    props: BTreeMap<String, String>,
    parent: Option<NodeId>,
    children: Vec<NodeId>,
    scope_path_hash: u64,
}

#[derive(Clone, Debug)]
struct EventSlot {
    generation: u32,
    binding: Option<(NodeId, String)>,
}

#[derive(Clone, Debug)]
pub struct RetainedTree {
    config: TreeConfig,
    revision: u64,
    root: Option<NodeId>,
    nodes: BTreeMap<NodeId, RetainedNode>,
    scope_paths: BTreeMap<u64, NodeId>,
    generations: Vec<u32>,
    free: Vec<u32>,
    event_slots: Vec<EventSlot>,
    event_free: Vec<u32>,
    event_bindings: BTreeMap<(NodeId, String), EventToken>,
    instrumentation: TreeInstrumentation,
}

impl RetainedTree {
    pub fn new(config: TreeConfig) -> Result<Self, TreeError> {
        if config.max_nodes == 0
            || config.max_slots < config.max_nodes
            || config.max_slots > u32::MAX as usize
            || config.max_depth == 0
            || config.max_string_bytes == 0
            || config.max_props_per_node == 0
            || config.max_events == 0
            || config.max_events > u32::MAX as usize
        {
            return Err(TreeError::InvalidConfig);
        }
        Ok(Self {
            config,
            revision: 0,
            root: None,
            nodes: BTreeMap::new(),
            scope_paths: BTreeMap::new(),
            generations: Vec::new(),
            free: Vec::new(),
            event_slots: Vec::new(),
            event_free: Vec::new(),
            event_bindings: BTreeMap::new(),
            instrumentation: TreeInstrumentation::default(),
        })
    }

    pub const fn revision(&self) -> u64 {
        self.revision
    }

    pub const fn root(&self) -> Option<NodeId> {
        self.root
    }

    pub const fn instrumentation(&self) -> TreeInstrumentation {
        self.instrumentation
    }

    pub fn node_ref(&self, node: NodeId) -> Result<NodeRef, TreeError> {
        if self.nodes.contains_key(&node) {
            Ok(node)
        } else {
            Err(TreeError::InvalidNodeRef)
        }
    }

    pub fn children(&self, node: NodeId) -> Result<&[NodeId], TreeError> {
        self.nodes
            .get(&node)
            .map(|node| node.children.as_slice())
            .ok_or(TreeError::InvalidNodeRef)
    }

    pub(crate) fn subtree_nodes(&self, node: NodeId) -> Result<Vec<NodeId>, TreeError> {
        if !self.nodes.contains_key(&node) {
            return Err(TreeError::InvalidNodeRef);
        }
        let mut result = Vec::new();
        let mut pending = vec![node];
        while let Some(current) = pending.pop() {
            result.push(current);
            pending.extend(self.nodes[&current].children.iter().rev().copied());
        }
        Ok(result)
    }

    pub fn node_scope_identity(&self, node: NodeId) -> Result<(u64, u32), TreeError> {
        let retained = self.nodes.get(&node).ok_or(TreeError::InvalidNodeRef)?;
        Ok((retained.scope_path_hash, node.generation))
    }

    pub fn resolve_child_path(&self, path: &[usize]) -> Result<NodeId, TreeError> {
        let mut node = self.root.ok_or(TreeError::InvalidNodeRef)?;
        for index in path {
            node = *self
                .nodes
                .get(&node)
                .and_then(|retained| retained.children.get(*index))
                .ok_or(TreeError::InvalidNodeRef)?;
        }
        Ok(node)
    }

    pub fn root_node(&self) -> Result<NodeId, TreeError> {
        self.root.ok_or(TreeError::InvalidNodeRef)
    }

    pub fn resolve_scope(&self, path_hash: u64, generation: u32) -> Result<NodeId, TreeError> {
        if path_hash == 0 || generation == 0 {
            return Err(TreeError::InvalidScope);
        }
        self.scope_paths
            .get(&path_hash)
            .copied()
            .filter(|node| node.generation == generation)
            .ok_or(TreeError::InvalidScope)
    }

    pub fn bind_event(&mut self, node: NodeId, event: &str) -> Result<EventToken, TreeError> {
        if !self.nodes.contains_key(&node) || event.is_empty() {
            return Err(TreeError::InvalidEvent);
        }
        if event.len() > self.config.max_string_bytes {
            return Err(TreeError::StringCapacity);
        }
        let binding = (node, event.to_owned());
        if let Some(token) = self.event_bindings.get(&binding) {
            return Ok(*token);
        }
        if self.event_bindings.len() == self.config.max_events {
            return Err(TreeError::EventCapacity);
        }
        let token = if let Some(index) = self.event_free.pop() {
            let slot = &mut self.event_slots[index as usize];
            slot.binding = Some(binding.clone());
            Handle {
                index,
                generation: slot.generation,
            }
        } else {
            if self.event_slots.len() == self.config.max_events {
                return Err(TreeError::EventCapacity);
            }
            let index = self.event_slots.len() as u32;
            self.event_slots.push(EventSlot {
                generation: 1,
                binding: Some(binding.clone()),
            });
            Handle {
                index,
                generation: 1,
            }
        };
        self.event_bindings.insert(binding, token);
        Ok(token)
    }

    pub(crate) fn preflight_event_reconcile(
        &self,
        removals: &[EventToken],
        additions: &[&str],
    ) -> Result<(), TreeError> {
        let removals = removals.iter().copied().collect::<BTreeSet<_>>();
        if removals.len() > self.event_bindings.len() {
            return Err(TreeError::InvalidEvent);
        }
        for token in &removals {
            let slot = self
                .event_slots
                .get(token.index as usize)
                .filter(|slot| slot.generation == token.generation && slot.binding.is_some())
                .ok_or(TreeError::InvalidEvent)?;
            slot.generation
                .checked_add(1)
                .ok_or(TreeError::GenerationExhausted)?;
        }
        if additions
            .iter()
            .any(|event| event.is_empty() || event.len() > self.config.max_string_bytes)
        {
            return Err(TreeError::InvalidEvent);
        }
        self.event_bindings
            .len()
            .checked_sub(removals.len())
            .and_then(|live| live.checked_add(additions.len()))
            .filter(|live| *live <= self.config.max_events)
            .ok_or(TreeError::EventCapacity)?;
        Ok(())
    }

    pub fn validate_event(&self, token: EventToken, node: NodeId, event: &str) -> bool {
        let Some(slot) = self.event_slots.get(token.index as usize) else {
            return false;
        };
        slot.generation == token.generation
            && slot
                .binding
                .as_ref()
                .map(|(bound_node, bound_event)| *bound_node == node && bound_event == event)
                .unwrap_or(false)
            && self.nodes.contains_key(&node)
    }

    pub fn contains_event_token(&self, token: EventToken) -> bool {
        self.event_slots
            .get(token.index as usize)
            .map(|slot| slot.generation == token.generation && slot.binding.is_some())
            .unwrap_or(false)
    }

    pub fn unbind_event(&mut self, token: EventToken) -> Result<(), TreeError> {
        let slot = self
            .event_slots
            .get(token.index as usize)
            .ok_or(TreeError::InvalidEvent)?;
        if slot.generation != token.generation {
            return Err(TreeError::InvalidEvent);
        }
        let binding = slot.binding.clone().ok_or(TreeError::InvalidEvent)?;
        let next_generation = slot
            .generation
            .checked_add(1)
            .ok_or(TreeError::GenerationExhausted)?;
        if self.event_bindings.get(&binding) != Some(&token) {
            return Err(TreeError::InvalidEvent);
        }
        self.event_bindings.remove(&binding);
        let slot = &mut self.event_slots[token.index as usize];
        slot.binding = None;
        slot.generation = next_generation;
        self.event_free.push(token.index);
        Ok(())
    }

    pub fn reconcile(&mut self, view: &ViewNode) -> Result<UiTransaction, TreeError> {
        let prepared = self.prepare_reconcile(view)?;
        let transaction = prepared.transaction.clone();
        self.apply_prepared(prepared)?;
        Ok(transaction)
    }

    pub fn reconcile_scope(
        &mut self,
        path_hash: u64,
        generation: u32,
        view: &ViewNode,
    ) -> Result<UiTransaction, TreeError> {
        let prepared = self.prepare_reconcile_scope(path_hash, generation, view)?;
        let transaction = prepared.transaction.clone();
        self.apply_prepared(prepared)?;
        Ok(transaction)
    }

    pub(crate) fn prepare_reconcile(
        &self,
        view: &ViewNode,
    ) -> Result<PreparedReconcile, TreeError> {
        let mut count = 0;
        validate_view(view, 1, &self.config, &mut count)?;
        let new_revision = self
            .revision
            .checked_add(1)
            .ok_or(TreeError::RevisionExhausted)?;
        let mut staging = Staging {
            tree: self,
            nodes: BTreeMap::new(),
            generations: self.generations.clone(),
            free: self.free.clone(),
            patches: Vec::new(),
            used_old: BTreeSet::new(),
        };
        let root = staging.build(view, self.root, None, 0, ROOT_SCOPE_HASH)?;
        validate_scope_paths(&staging.nodes)?;
        let removed_set = self
            .nodes
            .keys()
            .filter(|node| !staging.used_old.contains(node))
            .copied()
            .collect::<BTreeSet<_>>();
        let removed = self.removal_order(&removed_set);
        self.preflight_retire_events(&removed)?;
        for node in &removed {
            let generation = staging.generations[node.index as usize]
                .checked_add(1)
                .ok_or(TreeError::GenerationExhausted)?;
            staging.generations[node.index as usize] = generation;
            staging.free.push(node.index);
            staging.patches.push(UiPatch::Remove { node: *node });
        }
        if staging.patches.is_empty() {
            return Ok(PreparedReconcile {
                transaction: UiTransaction {
                    base_revision: self.revision,
                    new_revision: self.revision,
                    root,
                    patches: Vec::new(),
                },
                state: None,
                scanned_nodes: count,
            });
        }
        let Staging {
            nodes,
            generations,
            free,
            patches,
            ..
        } = staging;
        Ok(PreparedReconcile {
            transaction: UiTransaction {
                base_revision: self.revision,
                new_revision,
                root,
                patches,
            },
            state: Some(PreparedTreeState::Full {
                nodes,
                generations,
                free,
                removed,
            }),
            scanned_nodes: count,
        })
    }

    pub(crate) fn prepare_reconcile_scope(
        &self,
        path_hash: u64,
        generation: u32,
        view: &ViewNode,
    ) -> Result<PreparedReconcile, TreeError> {
        let target = self.resolve_scope(path_hash, generation)?;
        let old_subtree_preorder = self.subtree_nodes(target)?;
        let old_subtree = old_subtree_preorder
            .iter()
            .copied()
            .collect::<BTreeSet<_>>();
        let retained_outside = self.nodes.len().saturating_sub(old_subtree.len());
        let mut count = retained_outside;
        validate_view(view, 1, &self.config, &mut count)?;
        let scanned_nodes = count.saturating_sub(retained_outside);
        let new_revision = self
            .revision
            .checked_add(1)
            .ok_or(TreeError::RevisionExhausted)?;
        let old = &self.nodes[&target];
        let parent = old.parent;
        let index = sibling_index(self, target);
        let mut staging = ScopeStaging {
            tree: self,
            nodes: BTreeMap::new(),
            patches: Vec::new(),
            used_old: BTreeSet::new(),
            consumed_free: 0,
            appended_slots: 0,
        };
        let root = staging.build(view, Some(target), parent, index, old.scope_path_hash)?;
        validate_scope_paths(&staging.nodes)?;
        for (node, retained) in &staging.nodes {
            if self
                .scope_paths
                .get(&retained.scope_path_hash)
                .is_some_and(|existing| existing != node && !old_subtree.contains(existing))
            {
                return Err(TreeError::DuplicateScopePath);
            }
        }
        let removed = old_subtree_preorder
            .into_iter()
            .rev()
            .filter(|node| !staging.used_old.contains(node))
            .collect::<Vec<_>>();
        self.preflight_retire_events(&removed)?;
        let mut retired_generations = Vec::with_capacity(removed.len());
        for node in &removed {
            let next = self.generations[node.index as usize]
                .checked_add(1)
                .ok_or(TreeError::GenerationExhausted)?;
            retired_generations.push((node.index, next));
            staging.patches.push(UiPatch::Remove { node: *node });
        }
        if let Some(parent) = parent {
            let mut retained = self
                .nodes
                .get(&parent)
                .cloned()
                .ok_or(TreeError::InvalidScope)?;
            retained.children[index] = root;
            staging.nodes.insert(parent, retained);
        }
        let tree_root = self.root.ok_or(TreeError::InvalidScope)?;
        if staging.patches.is_empty() {
            return Ok(PreparedReconcile {
                transaction: UiTransaction {
                    base_revision: self.revision,
                    new_revision: self.revision,
                    root: tree_root,
                    patches: Vec::new(),
                },
                state: None,
                scanned_nodes,
            });
        }
        let ScopeStaging {
            nodes,
            patches,
            consumed_free,
            appended_slots,
            ..
        } = staging;
        Ok(PreparedReconcile {
            transaction: UiTransaction {
                base_revision: self.revision,
                new_revision,
                root: if parent.is_none() { root } else { tree_root },
                patches,
            },
            state: Some(PreparedTreeState::Scope {
                nodes,
                removed,
                consumed_free,
                appended_slots,
                retired_generations,
            }),
            scanned_nodes,
        })
    }

    pub(crate) fn prepare_reconcile_scopes(
        &self,
        scopes: &[(u64, u32, ViewNode)],
    ) -> Result<PreparedReconcile, TreeError> {
        if scopes.is_empty() {
            return Err(TreeError::InvalidScope);
        }
        let mut staged_tree = self.clone();
        let mut patches = Vec::new();
        let mut scanned_nodes = 0_usize;
        for (path_hash, generation, view) in scopes {
            let prepared = staged_tree.prepare_reconcile_scope(*path_hash, *generation, view)?;
            scanned_nodes = scanned_nodes.saturating_add(prepared.scanned_nodes());
            patches.extend(prepared.transaction.patches.iter().cloned());
            staged_tree.apply_prepared(prepared)?;
        }
        let root = staged_tree.root.ok_or(TreeError::InvalidScope)?;
        if patches.is_empty() {
            return Ok(PreparedReconcile {
                transaction: UiTransaction {
                    base_revision: self.revision,
                    new_revision: self.revision,
                    root,
                    patches,
                },
                state: None,
                scanned_nodes,
            });
        }
        let new_revision = self
            .revision
            .checked_add(1)
            .ok_or(TreeError::RevisionExhausted)?;
        let removed_set = self
            .nodes
            .keys()
            .filter(|node| !staged_tree.nodes.contains_key(node))
            .copied()
            .collect::<BTreeSet<_>>();
        let removed = self.removal_order(&removed_set);
        self.preflight_retire_events(&removed)?;
        Ok(PreparedReconcile {
            transaction: UiTransaction {
                base_revision: self.revision,
                new_revision,
                root,
                patches,
            },
            state: Some(PreparedTreeState::Full {
                nodes: staged_tree.nodes,
                generations: staged_tree.generations,
                free: staged_tree.free,
                removed,
            }),
            scanned_nodes,
        })
    }

    pub(crate) fn apply_prepared(&mut self, prepared: PreparedReconcile) -> Result<(), TreeError> {
        if prepared.transaction.base_revision != self.revision {
            return Err(TreeError::StalePreparedRevision);
        }
        self.instrumentation.reconciles = self.instrumentation.reconciles.saturating_add(1);
        self.instrumentation.scanned_nodes = self
            .instrumentation
            .scanned_nodes
            .saturating_add(prepared.scanned_nodes as u64);
        self.instrumentation.dirty_patches = self
            .instrumentation
            .dirty_patches
            .saturating_add(prepared.transaction.patches.len() as u64);
        for patch in &prepared.transaction.patches {
            match patch {
                UiPatch::Create { .. } => {
                    self.instrumentation.node_allocations =
                        self.instrumentation.node_allocations.saturating_add(1);
                }
                UiPatch::Remove { .. } => {
                    self.instrumentation.node_releases =
                        self.instrumentation.node_releases.saturating_add(1);
                }
                _ => {}
            }
        }
        let Some(state) = prepared.state else {
            return Ok(());
        };
        let removed = match state {
            PreparedTreeState::Full {
                nodes,
                generations,
                free,
                removed,
            } => {
                self.nodes = nodes;
                self.scope_paths = self
                    .nodes
                    .iter()
                    .map(|(node, retained)| (retained.scope_path_hash, *node))
                    .collect();
                self.generations = generations;
                self.free = free;
                removed
            }
            PreparedTreeState::Scope {
                nodes,
                removed,
                consumed_free,
                appended_slots,
                retired_generations,
            } => {
                let retained_free = self
                    .free
                    .len()
                    .checked_sub(consumed_free)
                    .expect("prepared Scope free-list consumption remains valid");
                self.free.truncate(retained_free);
                self.generations
                    .extend(core::iter::repeat_n(1, appended_slots));
                for node in &removed {
                    if let Some(retained) = self.nodes.get(node) {
                        self.scope_paths.remove(&retained.scope_path_hash);
                    }
                    self.nodes.remove(node);
                }
                for (index, generation) in retired_generations {
                    self.generations[index as usize] = generation;
                    self.free.push(index);
                }
                for (node, retained) in nodes {
                    self.scope_paths.insert(retained.scope_path_hash, node);
                    self.nodes.insert(node, retained);
                }
                removed
            }
        };
        self.root = Some(prepared.transaction.root);
        self.revision = prepared.transaction.new_revision;
        self.instrumentation.nodes = self.nodes.len();
        self.instrumentation.peak_nodes = self
            .instrumentation
            .peak_nodes
            .max(self.instrumentation.nodes);
        self.retire_events(&removed);
        Ok(())
    }

    pub(crate) fn snapshot_transaction(&self) -> Option<UiTransaction> {
        let root = self.root?;
        let mut patches = Vec::with_capacity(self.nodes.len().saturating_mul(3));
        let mut pending = vec![(root, None, 0_usize)];
        while let Some((node, parent, index)) = pending.pop() {
            let retained = &self.nodes[&node];
            patches.push(UiPatch::Create {
                node,
                parent,
                index,
            });
            patches.push(UiPatch::SetKind {
                node,
                kind: retained.kind.clone(),
            });
            patches.push(UiPatch::SetProps {
                node,
                props: retained.props.clone(),
            });
            pending.extend(
                retained
                    .children
                    .iter()
                    .enumerate()
                    .rev()
                    .map(|(index, child)| (*child, Some(node), index)),
            );
        }
        Some(UiTransaction {
            base_revision: 0,
            new_revision: self.revision,
            root,
            patches,
        })
    }

    fn preflight_retire_events(&self, removed: &[NodeId]) -> Result<(), TreeError> {
        let removed = removed.iter().copied().collect::<BTreeSet<_>>();
        for slot in &self.event_slots {
            if slot
                .binding
                .as_ref()
                .map(|(node, _)| removed.contains(node))
                .unwrap_or(false)
                && slot.generation == u32::MAX
            {
                return Err(TreeError::GenerationExhausted);
            }
        }
        Ok(())
    }

    fn removal_order(&self, removed: &BTreeSet<NodeId>) -> Vec<NodeId> {
        let Some(root) = self.root else {
            return Vec::new();
        };
        let mut result = Vec::with_capacity(removed.len());
        let mut pending = vec![(root, false)];
        while let Some((node, visited)) = pending.pop() {
            if visited {
                if removed.contains(&node) {
                    result.push(node);
                }
                continue;
            }
            pending.push((node, true));
            if let Some(retained) = self.nodes.get(&node) {
                pending.extend(retained.children.iter().rev().map(|child| (*child, false)));
            }
        }
        result
    }

    fn retire_events(&mut self, removed: &[NodeId]) {
        let removed = removed.iter().copied().collect::<BTreeSet<_>>();
        let bindings = self
            .event_bindings
            .keys()
            .filter(|(node, _)| removed.contains(node))
            .cloned()
            .collect::<Vec<_>>();
        for binding in bindings {
            let token = self.event_bindings.remove(&binding).unwrap();
            let slot = &mut self.event_slots[token.index as usize];
            slot.binding = None;
            slot.generation = slot
                .generation
                .checked_add(1)
                .expect("event generation exhaustion is preflighted");
            self.event_free.push(token.index);
        }
    }
}

struct Staging<'a> {
    tree: &'a RetainedTree,
    nodes: BTreeMap<NodeId, RetainedNode>,
    generations: Vec<u32>,
    free: Vec<u32>,
    patches: Vec<UiPatch>,
    used_old: BTreeSet<NodeId>,
}

struct ScopeStaging<'a> {
    tree: &'a RetainedTree,
    nodes: BTreeMap<NodeId, RetainedNode>,
    patches: Vec<UiPatch>,
    used_old: BTreeSet<NodeId>,
    consumed_free: usize,
    appended_slots: usize,
}

impl ScopeStaging<'_> {
    fn build(
        &mut self,
        view: &ViewNode,
        candidate: Option<NodeId>,
        parent: Option<NodeId>,
        index: usize,
        scope_path_hash: u64,
    ) -> Result<NodeId, TreeError> {
        let reusable = candidate.filter(|node| {
            self.tree
                .nodes
                .get(node)
                .map(|old| old.key == view.key && same_shape(&old.kind, &view.kind))
                .unwrap_or(false)
                && !self.used_old.contains(node)
        });
        let node = if let Some(node) = reusable {
            self.used_old.insert(node);
            let old = &self.tree.nodes[&node];
            if old.parent != parent || sibling_index(self.tree, node) != index {
                self.patches.push(UiPatch::Move {
                    node,
                    parent,
                    index,
                });
            }
            if old.kind != view.kind {
                self.patches.push(UiPatch::SetKind {
                    node,
                    kind: view.kind.clone(),
                });
            }
            if old.props != view.props {
                self.patches.push(UiPatch::SetProps {
                    node,
                    props: view.props.clone(),
                });
            }
            node
        } else {
            let node = self.allocate()?;
            self.patches.push(UiPatch::Create {
                node,
                parent,
                index,
            });
            self.patches.push(UiPatch::SetKind {
                node,
                kind: view.kind.clone(),
            });
            if !view.props.is_empty() {
                self.patches.push(UiPatch::SetProps {
                    node,
                    props: view.props.clone(),
                });
            }
            node
        };
        let old_children = reusable
            .and_then(|old| self.tree.nodes.get(&old))
            .map(|old| old.children.as_slice())
            .unwrap_or(&[]);
        let mut keyed = BTreeMap::new();
        for child in old_children {
            if let Some(key) = self.tree.nodes[child].key.as_ref() {
                keyed.insert(key.as_str(), *child);
            }
        }
        let mut children = Vec::with_capacity(view.children.len());
        for (child_index, child_view) in view.children.iter().enumerate() {
            let candidate = match child_view.key.as_deref() {
                Some(key) => keyed.get(key).copied(),
                None => old_children
                    .get(child_index)
                    .copied()
                    .filter(|old| self.tree.nodes[old].key.is_none()),
            };
            let child_scope_hash =
                extend_scope_hash(scope_path_hash, child_view.key.as_deref(), child_index);
            children.push(self.build(
                child_view,
                candidate,
                Some(node),
                child_index,
                child_scope_hash,
            )?);
        }
        self.nodes.insert(
            node,
            RetainedNode {
                key: view.key.clone(),
                kind: view.kind.clone(),
                props: view.props.clone(),
                parent,
                children,
                scope_path_hash,
            },
        );
        Ok(node)
    }

    fn allocate(&mut self) -> Result<NodeId, TreeError> {
        if self.consumed_free < self.tree.free.len() {
            let offset = self.tree.free.len() - self.consumed_free - 1;
            let index = self.tree.free[offset];
            self.consumed_free += 1;
            return Ok(Handle {
                index,
                generation: self.tree.generations[index as usize],
            });
        }
        let index = self
            .tree
            .generations
            .len()
            .checked_add(self.appended_slots)
            .filter(|length| *length < self.tree.config.max_slots)
            .ok_or(TreeError::SlotCapacity)?;
        self.appended_slots += 1;
        Ok(Handle {
            index: index as u32,
            generation: 1,
        })
    }
}

impl Staging<'_> {
    fn build(
        &mut self,
        view: &ViewNode,
        candidate: Option<NodeId>,
        parent: Option<NodeId>,
        index: usize,
        scope_path_hash: u64,
    ) -> Result<NodeId, TreeError> {
        let reusable = candidate.filter(|node| {
            self.tree
                .nodes
                .get(node)
                .map(|old| old.key == view.key && same_shape(&old.kind, &view.kind))
                .unwrap_or(false)
                && !self.used_old.contains(node)
        });
        let node = if let Some(node) = reusable {
            self.used_old.insert(node);
            let old = &self.tree.nodes[&node];
            if old.parent != parent || sibling_index(self.tree, node) != index {
                self.patches.push(UiPatch::Move {
                    node,
                    parent,
                    index,
                });
            }
            if old.kind != view.kind {
                self.patches.push(UiPatch::SetKind {
                    node,
                    kind: view.kind.clone(),
                });
            }
            if old.props != view.props {
                self.patches.push(UiPatch::SetProps {
                    node,
                    props: view.props.clone(),
                });
            }
            node
        } else {
            let node = self.allocate()?;
            self.patches.push(UiPatch::Create {
                node,
                parent,
                index,
            });
            self.patches.push(UiPatch::SetKind {
                node,
                kind: view.kind.clone(),
            });
            if !view.props.is_empty() {
                self.patches.push(UiPatch::SetProps {
                    node,
                    props: view.props.clone(),
                });
            }
            node
        };

        let old_children = reusable
            .and_then(|old| self.tree.nodes.get(&old))
            .map(|old| old.children.as_slice())
            .unwrap_or(&[]);
        let mut keyed = BTreeMap::new();
        for child in old_children {
            if let Some(key) = self.tree.nodes[child].key.as_ref() {
                keyed.insert(key.as_str(), *child);
            }
        }
        let mut children = Vec::with_capacity(view.children.len());
        for (child_index, child_view) in view.children.iter().enumerate() {
            let candidate = match child_view.key.as_deref() {
                Some(key) => keyed.get(key).copied(),
                None => old_children
                    .get(child_index)
                    .copied()
                    .filter(|old| self.tree.nodes[old].key.is_none()),
            };
            let child_scope_hash =
                extend_scope_hash(scope_path_hash, child_view.key.as_deref(), child_index);
            children.push(self.build(
                child_view,
                candidate,
                Some(node),
                child_index,
                child_scope_hash,
            )?);
        }
        self.nodes.insert(
            node,
            RetainedNode {
                key: view.key.clone(),
                kind: view.kind.clone(),
                props: view.props.clone(),
                parent,
                children,
                scope_path_hash,
            },
        );
        Ok(node)
    }

    fn allocate(&mut self) -> Result<NodeId, TreeError> {
        if self.nodes.len() == self.tree.config.max_nodes {
            return Err(TreeError::NodeCapacity);
        }
        if let Some(index) = self.free.pop() {
            return Ok(Handle {
                index,
                generation: self.generations[index as usize],
            });
        }
        if self.generations.len() == self.tree.config.max_slots {
            return Err(TreeError::SlotCapacity);
        }
        let index = self.generations.len() as u32;
        self.generations.push(1);
        Ok(Handle {
            index,
            generation: 1,
        })
    }
}

fn validate_view(
    node: &ViewNode,
    depth: usize,
    config: &TreeConfig,
    count: &mut usize,
) -> Result<(), TreeError> {
    *count = count.checked_add(1).ok_or(TreeError::NodeCapacity)?;
    if *count > config.max_nodes {
        return Err(TreeError::NodeCapacity);
    }
    if depth > config.max_depth {
        return Err(TreeError::DepthCapacity);
    }
    if node.props.len() > config.max_props_per_node {
        return Err(TreeError::PropertyCapacity);
    }
    let mut string_bytes = node.key.as_ref().map_or(0, String::len);
    string_bytes = string_bytes.saturating_add(match &node.kind {
        ViewKind::Element(name) | ViewKind::Text(name) => name.len(),
    });
    for (key, value) in &node.props {
        string_bytes = string_bytes
            .saturating_add(key.len())
            .saturating_add(value.len());
    }
    if string_bytes > config.max_string_bytes {
        return Err(TreeError::StringCapacity);
    }
    let mut keys = BTreeSet::new();
    for child in &node.children {
        if let Some(key) = &child.key {
            if !keys.insert(key) {
                return Err(TreeError::DuplicateKey);
            }
        }
        validate_view(child, depth + 1, config, count)?;
    }
    Ok(())
}

fn validate_scope_paths(nodes: &BTreeMap<NodeId, RetainedNode>) -> Result<(), TreeError> {
    let mut paths = BTreeSet::new();
    for retained in nodes.values() {
        if !paths.insert(retained.scope_path_hash) {
            return Err(TreeError::DuplicateScopePath);
        }
    }
    Ok(())
}

fn same_shape(left: &ViewKind, right: &ViewKind) -> bool {
    matches!((left, right), (ViewKind::Text(_), ViewKind::Text(_)))
        || matches!((left, right), (ViewKind::Element(a), ViewKind::Element(b)) if a == b)
}

fn extend_scope_hash(parent: u64, key: Option<&str>, index: usize) -> u64 {
    let mut hash = parent;
    let bytes = key.map_or_else(
        || index.to_le_bytes().to_vec(),
        |key| key.as_bytes().to_vec(),
    );
    hash ^= u64::from(key.is_some());
    hash = hash.wrapping_mul(0x100_0000_01b3);
    for byte in bytes {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x100_0000_01b3);
    }
    if hash == 0 {
        1
    } else {
        hash
    }
}

fn sibling_index(tree: &RetainedTree, node: NodeId) -> usize {
    tree.nodes[&node]
        .parent
        .and_then(|parent| {
            tree.nodes[&parent]
                .children
                .iter()
                .position(|child| *child == node)
        })
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn element(name: &str, key: Option<&str>, children: Vec<ViewNode>) -> ViewNode {
        ViewNode {
            key: key.map(str::to_owned),
            kind: ViewKind::Element(name.to_owned()),
            props: BTreeMap::new(),
            children,
        }
    }

    #[test]
    fn keyed_reorder_keeps_node_identity_and_emits_moves() {
        let mut tree = RetainedTree::new(TreeConfig {
            max_nodes: 8,
            max_slots: 16,
            max_depth: 4,
            max_string_bytes: 64,
            max_props_per_node: 4,
            max_events: 8,
        })
        .unwrap();
        let first = element(
            "root",
            None,
            vec![
                element("item", Some("a"), Vec::new()),
                element("item", Some("b"), Vec::new()),
            ],
        );
        tree.reconcile(&first).unwrap();
        let root = tree.root().unwrap();
        let before = tree.children(root).unwrap().to_vec();
        let second = element(
            "root",
            None,
            vec![
                element("item", Some("b"), Vec::new()),
                element("item", Some("a"), Vec::new()),
            ],
        );
        let transaction = tree.reconcile(&second).unwrap();
        let after = tree.children(root).unwrap();
        assert_eq!(after, [before[1], before[0]]);
        assert_eq!(
            transaction
                .patches
                .iter()
                .filter(|patch| matches!(patch, UiPatch::Move { .. }))
                .count(),
            2
        );
    }

    #[test]
    fn duplicate_key_and_capacity_fail_without_advancing_revision() {
        let mut tree = RetainedTree::new(TreeConfig {
            max_nodes: 3,
            max_slots: 4,
            max_depth: 3,
            max_string_bytes: 64,
            max_props_per_node: 4,
            max_events: 4,
        })
        .unwrap();
        let duplicate = element(
            "root",
            None,
            vec![
                element("a", Some("same"), Vec::new()),
                element("b", Some("same"), Vec::new()),
            ],
        );
        assert_eq!(tree.reconcile(&duplicate), Err(TreeError::DuplicateKey));
        assert_eq!(tree.revision(), 0);
        assert!(tree.root().is_none());
    }

    #[test]
    fn type_change_replaces_id_and_stale_node_ref_is_rejected() {
        let mut tree = RetainedTree::new(TreeConfig {
            max_nodes: 2,
            max_slots: 4,
            max_depth: 2,
            max_string_bytes: 64,
            max_props_per_node: 2,
            max_events: 2,
        })
        .unwrap();
        tree.reconcile(&element("button", None, Vec::new()))
            .unwrap();
        let old = tree.root().unwrap();
        tree.reconcile(&element("input", None, Vec::new())).unwrap();
        let current = tree.root().unwrap();
        assert_ne!(old, current);
        assert_eq!(tree.node_ref(old), Err(TreeError::InvalidNodeRef));
        assert_eq!(tree.node_ref(current), Ok(current));
    }

    #[test]
    fn identical_view_emits_no_patch_and_does_not_advance_revision() {
        let mut tree = RetainedTree::new(TreeConfig {
            max_nodes: 2,
            max_slots: 4,
            max_depth: 2,
            max_string_bytes: 64,
            max_props_per_node: 2,
            max_events: 2,
        })
        .unwrap();
        let view = element("button", Some("save"), Vec::new());
        tree.reconcile(&view).unwrap();
        let root = tree.root().unwrap();
        let transaction = tree.reconcile(&view).unwrap();
        assert!(transaction.patches.is_empty());
        assert_eq!(transaction.base_revision, 1);
        assert_eq!(transaction.new_revision, 1);
        assert_eq!(tree.revision(), 1);
        assert_eq!(tree.root(), Some(root));
    }

    #[test]
    fn event_token_is_stable_for_live_node_and_stale_after_replacement() {
        let mut tree = RetainedTree::new(TreeConfig {
            max_nodes: 2,
            max_slots: 4,
            max_depth: 2,
            max_string_bytes: 64,
            max_props_per_node: 2,
            max_events: 2,
        })
        .unwrap();
        let button = element("button", Some("save"), Vec::new());
        tree.reconcile(&button).unwrap();
        let old_node = tree.root().unwrap();
        let token = tree.bind_event(old_node, "click").unwrap();
        assert_eq!(tree.bind_event(old_node, "click"), Ok(token));
        assert!(tree.validate_event(token, old_node, "click"));
        tree.reconcile(&element("input", Some("save"), Vec::new()))
            .unwrap();
        assert!(!tree.validate_event(token, old_node, "click"));
        let current = tree.root().unwrap();
        let current_token = tree.bind_event(current, "click").unwrap();
        assert_eq!(current_token.index, token.index);
        assert_ne!(current_token.generation, token.generation);
    }

    #[test]
    fn event_generation_exhaustion_rejects_tree_replacement_atomically() {
        let mut tree = RetainedTree::new(TreeConfig {
            max_nodes: 2,
            max_slots: 4,
            max_depth: 2,
            max_string_bytes: 64,
            max_props_per_node: 2,
            max_events: 2,
        })
        .unwrap();
        tree.reconcile(&element("button", None, Vec::new()))
            .unwrap();
        let old = tree.root().unwrap();
        let token = tree.bind_event(old, "click").unwrap();
        tree.event_slots[token.index as usize].generation = u32::MAX;
        assert_eq!(
            tree.reconcile(&element("input", None, Vec::new())),
            Err(TreeError::GenerationExhausted)
        );
        assert_eq!(tree.root(), Some(old));
        assert_eq!(tree.revision(), 1);
    }

    #[test]
    fn scope_reconcile_updates_only_owned_subtree_and_preserves_sibling_identity() {
        let mut tree = RetainedTree::new(TreeConfig {
            max_nodes: 16,
            max_slots: 32,
            max_depth: 4,
            max_string_bytes: 128,
            max_props_per_node: 4,
            max_events: 8,
        })
        .unwrap();
        tree.reconcile(&element(
            "root",
            None,
            vec![
                element(
                    "panel",
                    Some("target"),
                    vec![
                        element("item", Some("a"), Vec::new()),
                        element("item", Some("b"), Vec::new()),
                    ],
                ),
                element("aside", Some("sibling"), Vec::new()),
            ],
        ))
        .unwrap();
        let root = tree.root_node().unwrap();
        let target = tree.children(root).unwrap()[0];
        let sibling = tree.children(root).unwrap()[1];
        let removed = tree.children(target).unwrap()[1];
        let (path_hash, generation) = tree.node_scope_identity(target).unwrap();
        let before = tree.instrumentation();
        tree.reconcile_scope(
            path_hash,
            generation,
            &element(
                "panel",
                Some("target"),
                vec![
                    element("item", Some("a"), Vec::new()),
                    element("input", Some("c"), Vec::new()),
                ],
            ),
        )
        .unwrap();
        let after = tree.instrumentation();
        assert_eq!(tree.children(root).unwrap()[1], sibling);
        assert_eq!(tree.resolve_scope(path_hash, generation), Ok(target));
        assert_eq!(tree.node_ref(removed), Err(TreeError::InvalidNodeRef));
        assert_eq!(after.nodes, 5);
        assert_eq!(after.scanned_nodes - before.scanned_nodes, 3);
    }
}
