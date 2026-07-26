use std::collections::{BTreeMap, BTreeSet, VecDeque};

use vogui_protocol::v2::{EventToken, Handle, NodeId, UiRootId, UiSessionId};

use crate::{
    app::ScopeId,
    layout_style::{StyleId, ThemeToken},
    resource::UiResourceId,
    semantics::{SemanticNode, SemanticSnapshot},
};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum RendererHealth {
    Healthy,
    Frozen,
    Poisoned,
    ResyncRequired,
    Restarting,
    Closed,
}

#[derive(Clone, Copy, Debug, Default, Eq, Ord, PartialEq, PartialOrd)]
pub struct LayoutRect {
    pub x_milli: i32,
    pub y_milli: i32,
    pub width_milli: i32,
    pub height_milli: i32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InspectionTiming {
    pub builder_micros: u64,
    pub reconcile_micros: u64,
    pub patch_micros: u64,
    pub apply_micros: u64,
    pub allocated_bytes: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InspectionNode {
    pub node: NodeId,
    pub parent: Option<NodeId>,
    pub children: Vec<NodeId>,
    pub scope: Option<ScopeId>,
    pub layout: LayoutRect,
    pub reusable_style: Option<StyleId>,
    pub theme_tokens: Vec<ThemeToken>,
    pub event_tokens: Vec<EventToken>,
    pub ref_handles: Vec<Handle>,
    pub resources: Vec<UiResourceId>,
    pub semantic: Option<SemanticNode>,
    pub dirty_reason: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InspectionSnapshot {
    pub session: UiSessionId,
    pub root: UiRootId,
    pub inspection_revision: u64,
    pub tree_revision: u64,
    pub semantic_revision: u64,
    pub theme_revision: u64,
    pub renderer_generation: Handle,
    pub renderer_health: RendererHealth,
    pub renderer_capabilities: BTreeSet<String>,
    pub focus_chain: Vec<NodeId>,
    pub timing: InspectionTiming,
    pub accessibility_diagnostics: Vec<String>,
    pub subscriptions: Vec<String>,
    pub root_node: NodeId,
    pub nodes: Vec<InspectionNode>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct InspectionConfig {
    pub max_nodes: usize,
    pub max_children_per_node: usize,
    pub max_bindings_per_node: usize,
    pub max_strings: usize,
    pub max_string_bytes: usize,
    pub max_edit_commands: usize,
    pub max_edit_payload_bytes: usize,
}

impl Default for InspectionConfig {
    fn default() -> Self {
        Self {
            max_nodes: 100_000,
            max_children_per_node: 16_384,
            max_bindings_per_node: 256,
            max_strings: 16_384,
            max_string_bytes: 4 * 1024 * 1024,
            max_edit_commands: 1024,
            max_edit_payload_bytes: 1024 * 1024,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum InspectionError {
    InvalidConfig,
    WrongSession,
    WrongRoot,
    StaleRevision,
    RevisionExhausted,
    NodeCapacity,
    ChildCapacity,
    BindingCapacity,
    StringCapacity,
    DuplicateNode,
    MissingRoot,
    InvalidTree,
    UnknownNode,
    EditCapacity,
    EditPayloadCapacity,
    EditSequence,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum InspectionQuery {
    Root,
    Node(NodeId),
    SemanticTree,
    FocusChain,
    Diagnostics,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum InspectionResponse {
    Root(InspectionSnapshot),
    Node(InspectionNode),
    SemanticTree(SemanticSnapshot),
    FocusChain(Vec<NodeId>),
    Diagnostics {
        health: RendererHealth,
        capabilities: BTreeSet<String>,
        accessibility: Vec<String>,
        timing: InspectionTiming,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum InspectionEditTarget {
    AppMessage {
        mapper_id: u32,
        payload_fingerprint: [u8; 32],
    },
    DevelopmentStyleOverride {
        node: NodeId,
        field_id: u16,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InspectionEditCommand {
    pub sequence: u64,
    pub session: UiSessionId,
    pub root: UiRootId,
    pub expected_inspection_revision: u64,
    pub expected_tree_revision: u64,
    pub target: InspectionEditTarget,
    pub payload: Vec<u8>,
}

pub struct InspectionEndpoint {
    session: UiSessionId,
    root: UiRootId,
    config: InspectionConfig,
    snapshot: Option<InspectionSnapshot>,
    nodes: BTreeMap<NodeId, InspectionNode>,
    edit_queue: VecDeque<InspectionEditCommand>,
    edit_payload_bytes: usize,
    last_edit_sequence: u64,
}

impl InspectionEndpoint {
    pub fn new(
        session: UiSessionId,
        root: UiRootId,
        config: InspectionConfig,
    ) -> Result<Self, InspectionError> {
        if !session.is_valid()
            || !root.is_valid()
            || config.max_nodes == 0
            || config.max_children_per_node == 0
            || config.max_bindings_per_node == 0
            || config.max_strings == 0
            || config.max_string_bytes == 0
            || config.max_edit_commands == 0
            || config.max_edit_payload_bytes == 0
        {
            return Err(InspectionError::InvalidConfig);
        }
        Ok(Self {
            session,
            root,
            config,
            snapshot: None,
            nodes: BTreeMap::new(),
            edit_queue: VecDeque::new(),
            edit_payload_bytes: 0,
            last_edit_sequence: 0,
        })
    }

    pub const fn revision(&self) -> u64 {
        match &self.snapshot {
            Some(snapshot) => snapshot.inspection_revision,
            None => 0,
        }
    }

    pub fn publish(&mut self, snapshot: InspectionSnapshot) -> Result<(), InspectionError> {
        if snapshot.session != self.session {
            return Err(InspectionError::WrongSession);
        }
        if snapshot.root != self.root {
            return Err(InspectionError::WrongRoot);
        }
        let expected_revision = self
            .revision()
            .checked_add(1)
            .ok_or(InspectionError::RevisionExhausted)?;
        if snapshot.inspection_revision != expected_revision {
            return Err(InspectionError::StaleRevision);
        }
        if snapshot.nodes.len() > self.config.max_nodes {
            return Err(InspectionError::NodeCapacity);
        }
        validate_string_budget(&snapshot, self.config)?;
        let mut nodes = BTreeMap::new();
        for node in &snapshot.nodes {
            validate_node(node, self.config)?;
            if nodes.insert(node.node, node.clone()).is_some() {
                return Err(InspectionError::DuplicateNode);
            }
        }
        validate_tree(snapshot.root_node, &nodes)?;
        self.nodes = nodes;
        self.snapshot = Some(snapshot);
        Ok(())
    }

    pub fn query(
        &self,
        expected_revision: u64,
        query: InspectionQuery,
    ) -> Result<InspectionResponse, InspectionError> {
        let snapshot = self
            .snapshot
            .as_ref()
            .ok_or(InspectionError::StaleRevision)?;
        if snapshot.inspection_revision != expected_revision {
            return Err(InspectionError::StaleRevision);
        }
        Ok(match query {
            InspectionQuery::Root => InspectionResponse::Root(snapshot.clone()),
            InspectionQuery::Node(node) => InspectionResponse::Node(
                self.nodes
                    .get(&node)
                    .cloned()
                    .ok_or(InspectionError::UnknownNode)?,
            ),
            InspectionQuery::SemanticTree => {
                let nodes = snapshot
                    .nodes
                    .iter()
                    .filter_map(|node| node.semantic.clone())
                    .collect::<Vec<_>>();
                InspectionResponse::SemanticTree(SemanticSnapshot {
                    root: snapshot.root,
                    tree_revision: snapshot.tree_revision,
                    semantic_revision: snapshot.semantic_revision,
                    root_node: snapshot.root_node,
                    nodes,
                })
            }
            InspectionQuery::FocusChain => {
                InspectionResponse::FocusChain(snapshot.focus_chain.clone())
            }
            InspectionQuery::Diagnostics => InspectionResponse::Diagnostics {
                health: snapshot.renderer_health,
                capabilities: snapshot.renderer_capabilities.clone(),
                accessibility: snapshot.accessibility_diagnostics.clone(),
                timing: snapshot.timing.clone(),
            },
        })
    }

    pub fn submit_edit(&mut self, command: InspectionEditCommand) -> Result<(), InspectionError> {
        let snapshot = self
            .snapshot
            .as_ref()
            .ok_or(InspectionError::StaleRevision)?;
        if command.session != self.session {
            return Err(InspectionError::WrongSession);
        }
        if command.root != self.root {
            return Err(InspectionError::WrongRoot);
        }
        if command.expected_inspection_revision != snapshot.inspection_revision
            || command.expected_tree_revision != snapshot.tree_revision
        {
            return Err(InspectionError::StaleRevision);
        }
        if command.sequence <= self.last_edit_sequence {
            return Err(InspectionError::EditSequence);
        }
        if let InspectionEditTarget::DevelopmentStyleOverride { node, .. } = command.target {
            if !self.nodes.contains_key(&node) {
                return Err(InspectionError::UnknownNode);
            }
        }
        let payload_bytes = self
            .edit_payload_bytes
            .checked_add(command.payload.len())
            .ok_or(InspectionError::EditPayloadCapacity)?;
        if self.edit_queue.len() == self.config.max_edit_commands {
            return Err(InspectionError::EditCapacity);
        }
        if payload_bytes > self.config.max_edit_payload_bytes {
            return Err(InspectionError::EditPayloadCapacity);
        }
        self.last_edit_sequence = command.sequence;
        self.edit_payload_bytes = payload_bytes;
        self.edit_queue.push_back(command);
        Ok(())
    }

    pub fn poll_edit(&mut self) -> Option<InspectionEditCommand> {
        let command = self.edit_queue.pop_front()?;
        self.edit_payload_bytes -= command.payload.len();
        Some(command)
    }
}

fn validate_node(node: &InspectionNode, config: InspectionConfig) -> Result<(), InspectionError> {
    if !node.node.is_valid() {
        return Err(InspectionError::UnknownNode);
    }
    if node.children.len() > config.max_children_per_node {
        return Err(InspectionError::ChildCapacity);
    }
    if node.theme_tokens.len()
        + node.event_tokens.len()
        + node.ref_handles.len()
        + node.resources.len()
        > config.max_bindings_per_node
    {
        return Err(InspectionError::BindingCapacity);
    }
    Ok(())
}

fn validate_string_budget(
    snapshot: &InspectionSnapshot,
    config: InspectionConfig,
) -> Result<(), InspectionError> {
    let mut count = snapshot.renderer_capabilities.len()
        + snapshot.accessibility_diagnostics.len()
        + snapshot.subscriptions.len();
    let mut bytes = snapshot
        .renderer_capabilities
        .iter()
        .map(String::len)
        .chain(snapshot.accessibility_diagnostics.iter().map(String::len))
        .chain(snapshot.subscriptions.iter().map(String::len))
        .sum::<usize>();
    for node in &snapshot.nodes {
        if let Some(reason) = &node.dirty_reason {
            count += 1;
            bytes = bytes
                .checked_add(reason.len())
                .ok_or(InspectionError::StringCapacity)?;
        }
    }
    if count > config.max_strings || bytes > config.max_string_bytes {
        return Err(InspectionError::StringCapacity);
    }
    Ok(())
}

fn validate_tree(
    root: NodeId,
    nodes: &BTreeMap<NodeId, InspectionNode>,
) -> Result<(), InspectionError> {
    if !nodes.contains_key(&root) {
        return Err(InspectionError::MissingRoot);
    }
    let mut seen = BTreeSet::new();
    let mut pending = vec![root];
    while let Some(node) = pending.pop() {
        if !seen.insert(node) {
            return Err(InspectionError::InvalidTree);
        }
        let record = nodes.get(&node).ok_or(InspectionError::UnknownNode)?;
        for child in record.children.iter().rev() {
            let child_record = nodes.get(child).ok_or(InspectionError::UnknownNode)?;
            if child_record.parent != Some(node) {
                return Err(InspectionError::InvalidTree);
            }
            pending.push(*child);
        }
    }
    if seen.len() != nodes.len() || nodes[&root].parent.is_some() {
        return Err(InspectionError::InvalidTree);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn handle(index: u32) -> Handle {
        Handle {
            index,
            generation: 1,
        }
    }

    fn node(id: u32, parent: Option<NodeId>, children: Vec<NodeId>) -> InspectionNode {
        InspectionNode {
            node: handle(id),
            parent,
            children,
            scope: None,
            layout: LayoutRect::default(),
            reusable_style: None,
            theme_tokens: Vec::new(),
            event_tokens: Vec::new(),
            ref_handles: Vec::new(),
            resources: Vec::new(),
            semantic: None,
            dirty_reason: None,
        }
    }

    fn snapshot(revision: u64) -> InspectionSnapshot {
        InspectionSnapshot {
            session: handle(1),
            root: handle(2),
            inspection_revision: revision,
            tree_revision: 7,
            semantic_revision: 8,
            theme_revision: 9,
            renderer_generation: handle(3),
            renderer_health: RendererHealth::Healthy,
            renderer_capabilities: BTreeSet::from(["headless".to_owned()]),
            focus_chain: vec![handle(10)],
            timing: InspectionTiming {
                builder_micros: 1,
                reconcile_micros: 2,
                patch_micros: 3,
                apply_micros: 4,
                allocated_bytes: 5,
            },
            accessibility_diagnostics: Vec::new(),
            subscriptions: Vec::new(),
            root_node: handle(10),
            nodes: vec![
                node(10, None, vec![handle(11)]),
                node(11, Some(handle(10)), Vec::new()),
            ],
        }
    }

    #[test]
    fn malformed_publication_is_atomic_and_queries_require_exact_revision() {
        let mut endpoint =
            InspectionEndpoint::new(handle(1), handle(2), InspectionConfig::default()).unwrap();
        endpoint.publish(snapshot(1)).unwrap();
        let mut malformed = snapshot(2);
        malformed.nodes[1].parent = None;
        assert_eq!(
            endpoint.publish(malformed),
            Err(InspectionError::InvalidTree)
        );
        assert_eq!(endpoint.revision(), 1);
        assert_eq!(
            endpoint.query(2, InspectionQuery::Root),
            Err(InspectionError::StaleRevision)
        );
        assert!(matches!(
            endpoint.query(1, InspectionQuery::Node(handle(11))),
            Ok(InspectionResponse::Node(InspectionNode {
                node,
                parent: Some(parent),
                ..
            })) if node == handle(11) && parent == handle(10)
        ));
    }

    #[test]
    fn edit_admission_checks_snapshot_node_sequence_and_live_payload_budget() {
        let config = InspectionConfig {
            max_edit_payload_bytes: 3,
            ..InspectionConfig::default()
        };
        let mut endpoint = InspectionEndpoint::new(handle(1), handle(2), config).unwrap();
        endpoint.publish(snapshot(1)).unwrap();
        let command = |sequence, node, payload: Vec<u8>| InspectionEditCommand {
            sequence,
            session: handle(1),
            root: handle(2),
            expected_inspection_revision: 1,
            expected_tree_revision: 7,
            target: InspectionEditTarget::DevelopmentStyleOverride { node, field_id: 1 },
            payload,
        };
        endpoint
            .submit_edit(command(1, handle(10), vec![1, 2, 3]))
            .unwrap();
        assert_eq!(
            endpoint.submit_edit(command(2, handle(99), Vec::new())),
            Err(InspectionError::UnknownNode)
        );
        assert_eq!(
            endpoint.submit_edit(command(2, handle(10), vec![4])),
            Err(InspectionError::EditPayloadCapacity)
        );
        assert_eq!(endpoint.poll_edit().unwrap().sequence, 1);
        endpoint
            .submit_edit(command(2, handle(10), vec![4]))
            .unwrap();
        assert_eq!(endpoint.poll_edit().unwrap().sequence, 2);
    }
}
