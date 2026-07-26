use std::collections::BTreeMap;

use std::collections::BTreeSet;

use vogui_protocol::v2::{Handle, NodeId};

use crate::{
    command::RendererCommandAdmission,
    inspection::RendererHealth,
    presentation::{RendererActor, RendererActorError},
    renderer::{RendererMutation, RendererTreeNode, RendererTreeSnapshot},
    tree::ViewKind,
    PresentationBatch,
};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlatformApplyError {
    pub code: u32,
    pub diagnostic: Vec<u8>,
    pub platform_may_be_partially_visible: bool,
}

pub trait PlatformRenderer {
    fn apply_validated(
        &mut self,
        replacement: bool,
        mutations: &[RendererMutation],
        desired: &RendererTreeSnapshot,
    ) -> Result<(), PlatformApplyError>;

    fn freeze_input(&mut self);
    fn hide_or_detach_poisoned_root(&mut self);
    fn close(&mut self);
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PlatformRendererError {
    Closed,
    Poisoned,
    Runtime(RendererActorError),
    Platform(PlatformApplyError),
}

pub struct PlatformRendererActor<P> {
    runtime: RendererActor,
    platform: P,
    health: RendererHealth,
}

impl<P: PlatformRenderer> PlatformRendererActor<P> {
    pub fn new(runtime: RendererActor, platform: P) -> Self {
        Self {
            runtime,
            platform,
            health: RendererHealth::Healthy,
        }
    }

    pub const fn health(&self) -> RendererHealth {
        self.health
    }

    pub fn runtime(&self) -> &RendererActor {
        &self.runtime
    }

    pub fn runtime_mut(&mut self) -> &mut RendererActor {
        &mut self.runtime
    }

    pub fn platform(&self) -> &P {
        &self.platform
    }

    pub fn platform_mut(&mut self) -> &mut P {
        &mut self.platform
    }

    pub fn apply(&mut self, batch: &PresentationBatch) -> Result<u64, PlatformRendererError> {
        Ok(self.apply_at(batch, 0)?.0)
    }

    pub fn apply_at(
        &mut self,
        batch: &PresentationBatch,
        now_millis: u64,
    ) -> Result<(u64, Vec<RendererCommandAdmission>), PlatformRendererError> {
        match self.health {
            RendererHealth::Closed => return Err(PlatformRendererError::Closed),
            RendererHealth::Poisoned
            | RendererHealth::Frozen
            | RendererHealth::ResyncRequired
            | RendererHealth::Restarting => return Err(PlatformRendererError::Poisoned),
            RendererHealth::Healthy => {}
        }
        let prepared = self
            .runtime
            .prepare(batch)
            .map_err(PlatformRendererError::Runtime)?;
        let desired = self.runtime.prepared_snapshot(&prepared);
        if let Err(error) =
            self.platform
                .apply_validated(prepared.replacement(), prepared.mutations(), &desired)
        {
            self.platform.freeze_input();
            self.platform.hide_or_detach_poisoned_root();
            self.health = RendererHealth::Poisoned;
            return Err(PlatformRendererError::Platform(error));
        }
        self.runtime
            .commit_prepared_at(prepared, now_millis)
            .map_err(PlatformRendererError::Runtime)
    }

    pub fn require_resync(&mut self) {
        if self.health != RendererHealth::Closed {
            self.platform.freeze_input();
            self.health = RendererHealth::ResyncRequired;
        }
    }

    pub fn next_command_deadline_millis(&self) -> Option<u64> {
        if self.health != RendererHealth::Healthy {
            return None;
        }
        self.runtime.next_command_deadline_millis()
    }

    pub fn service_command_deadlines(
        &mut self,
        now_millis: u64,
    ) -> Result<Vec<RendererCommandAdmission>, PlatformRendererError> {
        if self.health != RendererHealth::Healthy {
            return Err(PlatformRendererError::Poisoned);
        }
        Ok(self.runtime.expire_commands(now_millis))
    }

    pub fn begin_restart(&mut self) -> Result<(), PlatformRendererError> {
        if self.health == RendererHealth::Closed {
            return Err(PlatformRendererError::Closed);
        }
        self.platform.freeze_input();
        self.health = RendererHealth::Restarting;
        Ok(())
    }

    pub fn finish_restart(&mut self) -> Result<(), PlatformRendererError> {
        if self.health != RendererHealth::Restarting {
            return Err(PlatformRendererError::Poisoned);
        }
        self.health = RendererHealth::Healthy;
        Ok(())
    }

    pub fn close(&mut self) {
        if self.health != RendererHealth::Closed {
            self.platform.freeze_input();
            self.platform.close();
            self.health = RendererHealth::Closed;
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct HeadlessNode {
    parent: Option<NodeId>,
    children: Vec<NodeId>,
    kind: ViewKind,
    props: BTreeMap<String, String>,
}

pub struct HeadlessRenderer {
    nodes: BTreeMap<NodeId, HeadlessNode>,
    root: Option<NodeId>,
    revision: u64,
    input_frozen: bool,
    closed: bool,
}

impl HeadlessRenderer {
    pub fn new() -> Self {
        Self {
            nodes: BTreeMap::new(),
            root: None,
            revision: 0,
            input_frozen: false,
            closed: false,
        }
    }

    pub const fn revision(&self) -> u64 {
        self.revision
    }

    pub const fn input_frozen(&self) -> bool {
        self.input_frozen
    }
}

impl Default for HeadlessRenderer {
    fn default() -> Self {
        Self::new()
    }
}

impl PlatformRenderer for HeadlessRenderer {
    fn apply_validated(
        &mut self,
        replacement: bool,
        mutations: &[RendererMutation],
        desired: &RendererTreeSnapshot,
    ) -> Result<(), PlatformApplyError> {
        if self.closed {
            return Err(platform_error(1));
        }
        let mut nodes = if replacement {
            BTreeMap::new()
        } else {
            self.nodes.clone()
        };
        for mutation in mutations {
            apply_headless_mutation(&mut nodes, mutation)?;
        }
        if !matches_desired(&nodes, desired) {
            return Err(platform_error(2));
        }
        self.nodes = nodes;
        self.root = Some(desired.tree_root);
        self.revision = desired.revision;
        self.input_frozen = false;
        Ok(())
    }

    fn freeze_input(&mut self) {
        self.input_frozen = true;
    }

    fn hide_or_detach_poisoned_root(&mut self) {
        self.nodes.clear();
        self.root = None;
    }

    fn close(&mut self) {
        self.nodes.clear();
        self.root = None;
        self.closed = true;
    }
}

fn apply_headless_mutation(
    nodes: &mut BTreeMap<NodeId, HeadlessNode>,
    mutation: &RendererMutation,
) -> Result<(), PlatformApplyError> {
    match mutation {
        RendererMutation::Create(node, parent, index) => {
            if nodes.contains_key(node) {
                return Err(platform_error(3));
            }
            if let Some(parent) = parent {
                let parent = nodes.get_mut(parent).ok_or_else(|| platform_error(4))?;
                if *index > parent.children.len() {
                    return Err(platform_error(5));
                }
                parent.children.insert(*index, *node);
            }
            nodes.insert(
                *node,
                HeadlessNode {
                    parent: *parent,
                    children: Vec::new(),
                    kind: ViewKind::Text(String::new()),
                    props: BTreeMap::new(),
                },
            );
        }
        RendererMutation::Remove(node) => {
            let removed = nodes.remove(node).ok_or_else(|| platform_error(6))?;
            if let Some(parent) = removed.parent {
                nodes
                    .get_mut(&parent)
                    .ok_or_else(|| platform_error(7))?
                    .children
                    .retain(|child| child != node);
            }
        }
        RendererMutation::Move(node, parent, index) => {
            let old_parent = nodes.get(node).ok_or_else(|| platform_error(8))?.parent;
            if let Some(old_parent) = old_parent {
                nodes
                    .get_mut(&old_parent)
                    .ok_or_else(|| platform_error(9))?
                    .children
                    .retain(|child| child != node);
            }
            if let Some(parent) = parent {
                let parent = nodes.get_mut(parent).ok_or_else(|| platform_error(10))?;
                if *index > parent.children.len() {
                    return Err(platform_error(11));
                }
                parent.children.insert(*index, *node);
            }
            nodes
                .get_mut(node)
                .ok_or_else(|| platform_error(12))?
                .parent = *parent;
        }
        RendererMutation::SetKind(node, kind) => {
            nodes.get_mut(node).ok_or_else(|| platform_error(13))?.kind = kind.clone();
        }
        RendererMutation::SetProps(node, props) => {
            nodes.get_mut(node).ok_or_else(|| platform_error(14))?.props = props.clone();
        }
        RendererMutation::BindEvent(node, event_kind, _, policy) => {
            if !nodes.contains_key(node) || *event_kind == 0 || (*policy & 0xf0) != 0 {
                return Err(platform_error(15));
            }
        }
        RendererMutation::BindRef(node, _, binding_generation) => {
            if !nodes.contains_key(node) || *binding_generation == 0 {
                return Err(platform_error(16));
            }
        }
        RendererMutation::AttachResource(node, _, source_revision) => {
            if !nodes.contains_key(node) || *source_revision == 0 {
                return Err(platform_error(17));
            }
        }
        RendererMutation::UnbindEvent(_)
        | RendererMutation::UnbindRef(_)
        | RendererMutation::DetachResource(_, _) => {}
    }
    Ok(())
}

fn matches_desired(nodes: &BTreeMap<NodeId, HeadlessNode>, desired: &RendererTreeSnapshot) -> bool {
    nodes.len() == desired.nodes.len()
        && desired
            .nodes
            .iter()
            .all(|node| matches_node(nodes.get(&node.node), node))
}

fn matches_node(actual: Option<&HeadlessNode>, desired: &RendererTreeNode) -> bool {
    actual.is_some_and(|actual| {
        actual.parent == desired.parent
            && actual.children == desired.children
            && actual.kind == desired.kind
            && actual.props == desired.props
    })
}

fn platform_error(code: u32) -> PlatformApplyError {
    PlatformApplyError {
        code,
        diagnostic: Vec::new(),
        platform_may_be_partially_visible: false,
    }
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct TextCacheKey {
    pub text: String,
    pub font: String,
    pub style_revision: u64,
    pub width_milli: i32,
    pub locale: String,
    pub direction: String,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct NativeLayoutBox {
    pub x_milli: i32,
    pub y_milli: i32,
    pub width_milli: i32,
    pub height_milli: i32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NativePaintItem {
    pub node: NodeId,
    pub z_index: i32,
    pub bounds: NativeLayoutBox,
    pub kind: ViewKind,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NativeUiSurface {
    pub revision: u64,
    pub device_generation: Handle,
    pub paint_items: Vec<NativePaintItem>,
}

pub struct RetainedGpuRenderer {
    nodes: BTreeMap<NodeId, HeadlessNode>,
    formatting_roots: BTreeSet<NodeId>,
    layout: BTreeMap<NodeId, NativeLayoutBox>,
    text_cache: BTreeMap<TextCacheKey, Vec<u8>>,
    hit_test_front_to_back: Vec<(NodeId, NativeLayoutBox)>,
    dirty_layout: BTreeSet<NodeId>,
    dirty_paint: BTreeSet<NodeId>,
    accessibility_revision: u64,
    surface: Option<NativeUiSurface>,
    device_generation: Handle,
    input_frozen: bool,
    closed: bool,
}

impl RetainedGpuRenderer {
    pub fn new(device_generation: Handle) -> Result<Self, PlatformApplyError> {
        if !device_generation.is_valid() {
            return Err(platform_error(100));
        }
        Ok(Self {
            nodes: BTreeMap::new(),
            formatting_roots: BTreeSet::new(),
            layout: BTreeMap::new(),
            text_cache: BTreeMap::new(),
            hit_test_front_to_back: Vec::new(),
            dirty_layout: BTreeSet::new(),
            dirty_paint: BTreeSet::new(),
            accessibility_revision: 0,
            surface: None,
            device_generation,
            input_frozen: false,
            closed: false,
        })
    }

    pub fn set_formatting_root(
        &mut self,
        node: NodeId,
        formatting_root: bool,
    ) -> Result<(), PlatformApplyError> {
        if !self.nodes.contains_key(&node) {
            return Err(platform_error(101));
        }
        if formatting_root {
            self.formatting_roots.insert(node);
        } else {
            self.formatting_roots.remove(&node);
        }
        Ok(())
    }

    pub fn surface(&self) -> Option<&NativeUiSurface> {
        self.surface.as_ref()
    }

    pub fn dirty_layout(&self) -> &BTreeSet<NodeId> {
        &self.dirty_layout
    }

    pub fn dirty_paint(&self) -> &BTreeSet<NodeId> {
        &self.dirty_paint
    }

    pub fn hit_test(&self, x_milli: i32, y_milli: i32) -> Option<NodeId> {
        self.hit_test_front_to_back
            .iter()
            .find(|(_, bounds)| contains(*bounds, x_milli, y_milli))
            .map(|(node, _)| *node)
    }

    pub fn insert_text_cache(&mut self, key: TextCacheKey, shaped_glyphs: Vec<u8>) {
        self.text_cache.insert(key, shaped_glyphs);
    }

    pub fn device_lost(&mut self) {
        self.input_frozen = true;
        self.surface = None;
        self.text_cache.clear();
    }

    pub fn rebind_device(&mut self, device_generation: Handle) -> Result<(), PlatformApplyError> {
        if !device_generation.is_valid()
            || device_generation.index != self.device_generation.index
            || device_generation.generation <= self.device_generation.generation
        {
            return Err(platform_error(102));
        }
        self.device_generation = device_generation;
        self.surface = None;
        self.text_cache.clear();
        Ok(())
    }
}

impl PlatformRenderer for RetainedGpuRenderer {
    fn apply_validated(
        &mut self,
        replacement: bool,
        mutations: &[RendererMutation],
        desired: &RendererTreeSnapshot,
    ) -> Result<(), PlatformApplyError> {
        if self.closed {
            return Err(platform_error(103));
        }
        let mut nodes = if replacement {
            BTreeMap::new()
        } else {
            self.nodes.clone()
        };
        let mut dirty_layout = BTreeSet::new();
        let mut dirty_paint = BTreeSet::new();
        for mutation in mutations {
            if let Some(node) = mutation_node(mutation) {
                mark_to_formatting_root(&nodes, &self.formatting_roots, node, &mut dirty_layout);
                dirty_paint.insert(node);
            }
            apply_headless_mutation(&mut nodes, mutation)?;
        }
        if !matches_desired(&nodes, desired) {
            return Err(platform_error(104));
        }
        if replacement {
            dirty_layout.extend(nodes.keys().copied());
            dirty_paint.extend(nodes.keys().copied());
        }
        let layout = compute_native_layout(desired, &nodes)?;
        let mut paint_items = desired
            .nodes
            .iter()
            .enumerate()
            .map(|(index, node)| NativePaintItem {
                node: node.node,
                z_index: index as i32,
                bounds: layout[&node.node],
                kind: node.kind.clone(),
            })
            .collect::<Vec<_>>();
        paint_items.sort_by_key(|item| item.z_index);
        let hit_test_front_to_back = paint_items
            .iter()
            .rev()
            .map(|item| (item.node, item.bounds))
            .collect();
        self.nodes = nodes;
        self.layout = layout;
        self.hit_test_front_to_back = hit_test_front_to_back;
        self.dirty_layout = dirty_layout;
        self.dirty_paint = dirty_paint;
        self.accessibility_revision = desired.revision;
        self.surface = Some(NativeUiSurface {
            revision: desired.revision,
            device_generation: self.device_generation,
            paint_items,
        });
        self.input_frozen = false;
        Ok(())
    }

    fn freeze_input(&mut self) {
        self.input_frozen = true;
    }

    fn hide_or_detach_poisoned_root(&mut self) {
        self.surface = None;
        self.hit_test_front_to_back.clear();
        self.dirty_layout.clear();
        self.dirty_paint.clear();
    }

    fn close(&mut self) {
        self.nodes.clear();
        self.formatting_roots.clear();
        self.layout.clear();
        self.text_cache.clear();
        self.hit_test_front_to_back.clear();
        self.surface = None;
        self.closed = true;
    }
}

fn mutation_node(mutation: &RendererMutation) -> Option<NodeId> {
    match mutation {
        RendererMutation::Create(node, ..)
        | RendererMutation::Remove(node)
        | RendererMutation::Move(node, ..)
        | RendererMutation::SetKind(node, ..)
        | RendererMutation::SetProps(node, ..)
        | RendererMutation::BindEvent(node, ..)
        | RendererMutation::BindRef(node, ..)
        | RendererMutation::AttachResource(node, ..)
        | RendererMutation::DetachResource(node, ..) => Some(*node),
        RendererMutation::UnbindEvent(_) | RendererMutation::UnbindRef(_) => None,
    }
}

fn mark_to_formatting_root(
    nodes: &BTreeMap<NodeId, HeadlessNode>,
    formatting_roots: &BTreeSet<NodeId>,
    node: NodeId,
    dirty: &mut BTreeSet<NodeId>,
) {
    let mut cursor = Some(node);
    while let Some(current) = cursor {
        dirty.insert(current);
        if formatting_roots.contains(&current) {
            break;
        }
        cursor = nodes.get(&current).and_then(|record| record.parent);
    }
}

fn compute_native_layout(
    desired: &RendererTreeSnapshot,
    nodes: &BTreeMap<NodeId, HeadlessNode>,
) -> Result<BTreeMap<NodeId, NativeLayoutBox>, PlatformApplyError> {
    let mut layout = BTreeMap::new();
    let mut pending = vec![(desired.tree_root, 0_i32, 0_i32, 1_000_000_i32)];
    while let Some((node, x, y, width)) = pending.pop() {
        let record = nodes.get(&node).ok_or_else(|| platform_error(105))?;
        let height = 48_000_i32.max(24_000_i32.saturating_mul(record.children.len() as i32));
        layout.insert(
            node,
            NativeLayoutBox {
                x_milli: x,
                y_milli: y,
                width_milli: width,
                height_milli: height,
            },
        );
        let child_width = width.saturating_sub(24_000);
        let mut child_y = y.saturating_add(24_000);
        for child in record.children.iter().rev() {
            pending.push((*child, x.saturating_add(12_000), child_y, child_width));
            child_y = child_y.saturating_add(48_000);
        }
    }
    Ok(layout)
}

fn contains(bounds: NativeLayoutBox, x: i32, y: i32) -> bool {
    x >= bounds.x_milli
        && y >= bounds.y_milli
        && x < bounds.x_milli.saturating_add(bounds.width_milli)
        && y < bounds.y_milli.saturating_add(bounds.height_milli)
}
