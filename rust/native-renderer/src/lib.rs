use std::collections::BTreeMap;

#[inline(never)]
pub fn vogui_profile_link_anchor() -> usize {
    module_path!().as_ptr() as usize
}

use vogui_layout::{
    IntrinsicMeasurer, LayoutConfig, LayoutEngine, LayoutError, LayoutSnapshot, Rect, Size,
};
use vogui_protocol::v2::{Handle, MessageKind, NodeId, UiRootId, UiSessionId};
use vogui_runtime::{
    platform_renderer::{PlatformApplyError, PlatformRenderer},
    renderer::{RendererMutation, RendererTreeSnapshot},
    resource::{
        UiRendererResidencyWork, UiRendererResourceCache, UiRendererResourceCacheConfig,
        UiResourceError, UiResourceId, UiResourceKind, UiResourcePublication,
    },
    tree::ViewKind,
};
use vogui_text::{
    FontResolver, TextConfig, TextDirection, TextEngine, TextError, TextShaper, TextStyle,
};

#[cfg(feature = "native-wgpu")]
mod wgpu_painter;
#[cfg(feature = "native-wgpu")]
pub use wgpu_painter::{WgpuPreparedUiFrame, WgpuUiPainter, WgpuUiPainterConfig};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct NativeRendererConfig {
    pub layout: LayoutConfig,
    pub text: TextConfig,
    pub viewport: Size,
    pub scale_numerator: u32,
    pub scale_denominator: u32,
    pub max_paint_commands: usize,
    pub max_hit_entries: usize,
}

impl Default for NativeRendererConfig {
    fn default() -> Self {
        Self {
            layout: LayoutConfig::default(),
            text: TextConfig::default(),
            viewport: Size {
                width_milli: 1_280_000,
                height_milli: 720_000,
            },
            scale_numerator: 1,
            scale_denominator: 1,
            max_paint_commands: 200_000,
            max_hit_entries: 100_000,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PaintCommand {
    BeginClip(NodeId, Rect),
    EndClip(NodeId),
    FillRect {
        node: NodeId,
        rect: Rect,
        color: u32,
    },
    StrokeRect {
        node: NodeId,
        rect: Rect,
        color: u32,
        width_milli: i32,
    },
    Text {
        node: NodeId,
        rect: Rect,
        color: u32,
        glyph_count: usize,
    },
    Image {
        node: NodeId,
        rect: Rect,
        source: String,
        residency: Option<Vec<u8>>,
    },
    Icon {
        node: NodeId,
        rect: Rect,
        color: u32,
        residency: Vec<u8>,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NativeFrame {
    pub tree_revision: u64,
    pub device_generation: u64,
    pub viewport: Size,
    pub scale_numerator: u32,
    pub scale_denominator: u32,
    pub commands: Vec<PaintCommand>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct NativePaintSubmission {
    pub texture_token: u64,
    pub fence_value: u64,
    pub device_generation: u64,
    pub content_revision: u64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct HitEntry {
    pub node: NodeId,
    pub rect: Rect,
    pub order: u32,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct NativeInteractionState {
    pub hovered: bool,
    pub focused: bool,
    pub pressed: bool,
    pub disabled: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct NativeResourceIdentity {
    pub session: UiSessionId,
    pub root: UiRootId,
    pub ui_root_epoch: u32,
    pub app_code_epoch: u64,
    pub renderer_generation: Handle,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum NativeResourcePacketResult {
    Pending,
    Residency(UiRendererResidencyWork),
    Retired(UiResourceId),
}

struct NativeResourceAssembly {
    kind: UiResourceKind,
    content_hash: [u8; 32],
    total_bytes: usize,
    metadata_bytes: usize,
    metadata: Vec<u8>,
    bytes: Vec<u8>,
}

pub trait NativePainter {
    type Prepared;

    fn device_generation(&self) -> u64;
    fn prepare(&mut self, frame: &NativeFrame) -> Result<Self::Prepared, PlatformApplyError>;
    fn submit(
        &mut self,
        prepared: Self::Prepared,
    ) -> Result<NativePaintSubmission, PlatformApplyError>;
    fn rebind_device(&mut self, new_generation: u64) -> Result<(), PlatformApplyError>;
    fn hide_surface(&mut self);
    fn close(&mut self);
}

pub trait ImageIntrinsic {
    fn measure_image(
        &mut self,
        source: &str,
        max_width_milli: i32,
        max_height_milli: i32,
    ) -> Result<Size, LayoutError>;
}

pub struct NativeRenderer<F, S, I, P> {
    config: NativeRendererConfig,
    layout: LayoutEngine,
    text: TextEngine<F, S>,
    images: I,
    painter: P,
    base_tree: Option<RendererTreeSnapshot>,
    nodes: BTreeMap<NodeId, vogui_runtime::renderer::RendererTreeNode>,
    interaction_states: BTreeMap<NodeId, NativeInteractionState>,
    layout_snapshot: Option<LayoutSnapshot>,
    composition_output: Option<NativePaintSubmission>,
    hit_index: Vec<HitEntry>,
    resource_cache: Option<UiRendererResourceCache>,
    resource_identity: Option<NativeResourceIdentity>,
    resource_assemblies: BTreeMap<(UiResourceId, u64), NativeResourceAssembly>,
    resource_bindings: BTreeMap<NodeId, (UiResourceId, u64)>,
    input_frozen: bool,
    closed: bool,
}

impl<F, S, I, P> NativeRenderer<F, S, I, P>
where
    F: FontResolver,
    S: TextShaper,
    I: ImageIntrinsic,
    P: NativePainter,
{
    pub fn new(
        config: NativeRendererConfig,
        fonts: F,
        shaper: S,
        images: I,
        painter: P,
    ) -> Result<Self, PlatformApplyError> {
        if config.max_paint_commands == 0
            || config.max_hit_entries == 0
            || config.viewport.width_milli <= 0
            || config.viewport.height_milli <= 0
            || config.scale_numerator == 0
            || config.scale_denominator == 0
        {
            return Err(renderer_error(1, b"invalid native renderer config", false));
        }
        Ok(Self {
            layout: LayoutEngine::new(config.layout)
                .map_err(|_| renderer_error(2, b"invalid layout config", false))?,
            text: TextEngine::new(config.text, fonts, shaper)
                .map_err(|_| renderer_error(3, b"invalid text config", false))?,
            config,
            images,
            painter,
            base_tree: None,
            nodes: BTreeMap::new(),
            interaction_states: BTreeMap::new(),
            layout_snapshot: None,
            composition_output: None,
            hit_index: Vec::new(),
            resource_cache: None,
            resource_identity: None,
            resource_assemblies: BTreeMap::new(),
            resource_bindings: BTreeMap::new(),
            input_frozen: false,
            closed: false,
        })
    }

    pub fn set_viewport(&mut self, viewport: Size) -> Result<(), PlatformApplyError> {
        self.configure_viewport(
            viewport,
            self.config.scale_numerator,
            self.config.scale_denominator,
        )?;
        Ok(())
    }

    pub fn set_scale(
        &mut self,
        numerator: u32,
        denominator: u32,
    ) -> Result<(), PlatformApplyError> {
        self.configure_viewport(self.config.viewport, numerator, denominator)?;
        Ok(())
    }

    pub fn configure_viewport(
        &mut self,
        viewport: Size,
        scale_numerator: u32,
        scale_denominator: u32,
    ) -> Result<Option<NativePaintSubmission>, PlatformApplyError> {
        if viewport.width_milli <= 0
            || viewport.height_milli <= 0
            || scale_numerator == 0
            || scale_denominator == 0
        {
            return Err(renderer_error(
                4,
                b"invalid native renderer viewport",
                false,
            ));
        }
        if self.config.viewport == viewport
            && self.config.scale_numerator == scale_numerator
            && self.config.scale_denominator == scale_denominator
        {
            return Ok(self.composition_output);
        }
        let previous = (
            self.config.viewport,
            self.config.scale_numerator,
            self.config.scale_denominator,
        );
        self.config.viewport = viewport;
        self.config.scale_numerator = scale_numerator;
        self.config.scale_denominator = scale_denominator;
        let Some(base) = self.base_tree.clone() else {
            return Ok(None);
        };
        let desired = apply_native_interaction_styles(&base, &self.interaction_states);
        let resource_bindings = self.resource_bindings.clone();
        let (layout, submission, hit_index) =
            match self.render_candidate(&desired, &resource_bindings) {
                Ok(rendered) => rendered,
                Err(error) => {
                    self.config.viewport = previous.0;
                    self.config.scale_numerator = previous.1;
                    self.config.scale_denominator = previous.2;
                    return Err(error);
                }
            };
        self.nodes = desired
            .nodes
            .iter()
            .cloned()
            .map(|node| (node.node, node))
            .collect();
        self.layout_snapshot = Some(layout);
        self.composition_output = Some(submission);
        self.hit_index = hit_index;
        Ok(Some(submission))
    }

    pub fn hit_test(&self, x_milli: i32, y_milli: i32) -> Option<NodeId> {
        if self.input_frozen || self.closed {
            return None;
        }
        self.hit_index
            .iter()
            .rev()
            .find(|entry| contains(entry.rect, x_milli, y_milli))
            .map(|entry| entry.node)
    }

    pub fn set_interaction_state(
        &mut self,
        node: NodeId,
        state: NativeInteractionState,
    ) -> Result<(), PlatformApplyError> {
        if self.closed || self.input_frozen {
            return Err(renderer_error(
                22,
                b"native interaction state is unavailable",
                false,
            ));
        }
        let base = self
            .base_tree
            .clone()
            .ok_or_else(|| renderer_error(22, b"native interaction tree is unavailable", false))?;
        if !base.nodes.iter().any(|candidate| candidate.node == node) {
            return Err(renderer_error(
                22,
                b"unknown native interaction node",
                false,
            ));
        }
        if self
            .interaction_states
            .get(&node)
            .copied()
            .unwrap_or_default()
            == state
        {
            return Ok(());
        }
        let mut states = self.interaction_states.clone();
        if state == NativeInteractionState::default() {
            states.remove(&node);
        } else {
            states.insert(node, state);
        }
        let desired = apply_native_interaction_styles(&base, &states);
        let resource_bindings = self.resource_bindings.clone();
        let (layout, submission, hit_index) =
            self.render_candidate(&desired, &resource_bindings)?;
        self.interaction_states = states;
        self.nodes = desired
            .nodes
            .iter()
            .cloned()
            .map(|node| (node.node, node))
            .collect();
        self.layout_snapshot = Some(layout);
        self.composition_output = Some(submission);
        self.hit_index = hit_index;
        Ok(())
    }

    pub fn rebind_device(
        &mut self,
        generation: u64,
    ) -> Result<Vec<UiResourceId>, PlatformApplyError> {
        if generation == 0 || generation <= self.painter.device_generation() {
            return Err(renderer_error(5, b"invalid device generation", false));
        }
        self.painter.rebind_device(generation)?;
        let resources_requiring_rebuild = if let Some(resources) = &mut self.resource_cache {
            let generation = u32::try_from(generation)
                .map_err(|_| renderer_error(5, b"device generation exceeds protocol", false))?;
            resources
                .restart_device(Handle {
                    index: 0,
                    generation,
                })
                .map_err(map_resource_error)?
        } else {
            Vec::new()
        };
        self.resource_assemblies.clear();
        self.text.clear();
        self.layout_snapshot = None;
        self.composition_output = None;
        Ok(resources_requiring_rebuild)
    }

    pub fn layout_snapshot(&self) -> Option<&LayoutSnapshot> {
        self.layout_snapshot.as_ref()
    }

    pub const fn composition_output(&self) -> Option<NativePaintSubmission> {
        self.composition_output
    }

    pub fn painter_mut(&mut self) -> &mut P {
        &mut self.painter
    }

    fn render_candidate(
        &mut self,
        desired: &RendererTreeSnapshot,
        resource_bindings: &BTreeMap<NodeId, (UiResourceId, u64)>,
    ) -> Result<(LayoutSnapshot, NativePaintSubmission, Vec<HitEntry>), PlatformApplyError> {
        let mut measurer = RendererMeasurer {
            text: &mut self.text,
            images: &mut self.images,
            nodes: desired.nodes.iter().map(|node| (node.node, node)).collect(),
        };
        let layout = self
            .layout
            .apply(desired, self.config.viewport, &mut measurer)
            .map_err(map_layout_error)?;
        if layout.boxes.len() > self.config.max_hit_entries {
            return Err(renderer_error(7, b"hit index capacity exceeded", false));
        }
        let commands = build_paint_list(
            desired,
            &layout,
            &mut self.text,
            resource_bindings,
            self.resource_cache.as_ref(),
            self.config.max_paint_commands,
        )?;
        let frame = NativeFrame {
            tree_revision: desired.revision,
            device_generation: self.painter.device_generation(),
            viewport: self.config.viewport,
            scale_numerator: self.config.scale_numerator,
            scale_denominator: self.config.scale_denominator,
            commands,
        };
        let prepared = self.painter.prepare(&frame)?;
        let submission = self.painter.submit(prepared)?;
        if submission.texture_token == 0
            || submission.fence_value == 0
            || submission.device_generation != frame.device_generation
            || submission.content_revision != frame.tree_revision
        {
            return Err(renderer_error(
                8,
                b"invalid native painter submission",
                true,
            ));
        }
        let hit_index = desired
            .nodes
            .iter()
            .enumerate()
            .filter_map(|(order, node)| {
                layout.boxes.get(&node.node).copied().map(|rect| HitEntry {
                    node: node.node,
                    rect,
                    order: order as u32,
                })
            })
            .collect();
        Ok((layout, submission, hit_index))
    }

    pub fn configure_resource_cache(
        &mut self,
        identity: NativeResourceIdentity,
        device_generation: Option<Handle>,
        config: UiRendererResourceCacheConfig,
    ) -> Result<(), PlatformApplyError> {
        if self.resource_cache.is_some()
            || !identity.session.is_valid()
            || !identity.root.is_valid()
            || identity.ui_root_epoch == 0
            || identity.app_code_epoch == 0
            || !identity.renderer_generation.is_valid()
            || device_generation.is_some_and(|generation| generation.index != 0)
        {
            return Err(renderer_error(
                15,
                b"invalid or duplicate native resource cache",
                false,
            ));
        }
        self.resource_cache = Some(
            UiRendererResourceCache::new(
                identity.session,
                identity.renderer_generation,
                device_generation,
                config,
            )
            .map_err(map_resource_error)?,
        );
        self.resource_identity = Some(identity);
        Ok(())
    }

    pub fn accept_resource_packet(
        &mut self,
        packet: &[u8],
    ) -> Result<NativeResourcePacketResult, PlatformApplyError> {
        let identity = self
            .resource_identity
            .ok_or_else(|| renderer_error(18, b"native resource cache is unavailable", false))?;
        let (header, payload) = vogui_protocol::v2::decode_packet(packet)
            .map_err(|_| renderer_error(20, b"invalid native resource packet", false))?;
        if header.ui_session != identity.session
            || header.ui_root != identity.root
            || header.ui_root_epoch != identity.ui_root_epoch
            || header.app_code_epoch != identity.app_code_epoch
        {
            return Err(renderer_error(
                21,
                b"stale native resource packet identity",
                false,
            ));
        }
        match header.kind {
            MessageKind::UiResourcePublication => self.accept_resource_publication_payload(payload),
            MessageKind::UiResourceRetire => {
                if payload.len() != 16 {
                    return Err(renderer_error(
                        20,
                        b"invalid native resource retirement",
                        false,
                    ));
                }
                let resource = UiResourceId {
                    session: identity.session,
                    handle: Handle {
                        index: u32::from_le_bytes(payload[..4].try_into().unwrap()),
                        generation: u32::from_le_bytes(payload[4..8].try_into().unwrap()),
                    },
                };
                let source_revision = u64::from_le_bytes(payload[8..16].try_into().unwrap());
                if !resource.handle.is_valid() || source_revision == 0 {
                    return Err(renderer_error(
                        20,
                        b"invalid native resource retirement identity",
                        false,
                    ));
                }
                self.retire_resource(resource, source_revision)?;
                self.resource_assemblies
                    .retain(|(candidate, _), _| *candidate != resource);
                Ok(NativeResourcePacketResult::Retired(resource))
            }
            _ => Err(renderer_error(
                20,
                b"unexpected native resource packet kind",
                false,
            )),
        }
    }

    fn accept_resource_publication_payload(
        &mut self,
        payload: &[u8],
    ) -> Result<NativeResourcePacketResult, PlatformApplyError> {
        const PREFIX_BYTES: usize = 66;
        if payload.len() < PREFIX_BYTES {
            return Err(renderer_error(
                20,
                b"truncated native resource publication",
                false,
            ));
        }
        let identity = self.resource_identity.unwrap();
        let resource = UiResourceId {
            session: identity.session,
            handle: Handle {
                index: u32::from_le_bytes(payload[..4].try_into().unwrap()),
                generation: u32::from_le_bytes(payload[4..8].try_into().unwrap()),
            },
        };
        let source_revision = u64::from_le_bytes(payload[8..16].try_into().unwrap());
        let kind = resource_kind_from_tag(payload[16])?;
        let mut content_hash = [0_u8; 32];
        content_hash.copy_from_slice(&payload[17..49]);
        let total_bytes = u32::from_le_bytes(payload[49..53].try_into().unwrap()) as usize;
        let metadata_bytes = u32::from_le_bytes(payload[53..57].try_into().unwrap()) as usize;
        let offset = u32::from_le_bytes(payload[57..61].try_into().unwrap()) as usize;
        let chunk_bytes = u32::from_le_bytes(payload[61..65].try_into().unwrap()) as usize;
        let final_chunk = match payload[65] {
            0 => false,
            1 => true,
            _ => {
                return Err(renderer_error(
                    20,
                    b"invalid native resource final flag",
                    false,
                ));
            }
        };
        let inline_metadata = if offset == 0 { metadata_bytes } else { 0 };
        let chunk_start = PREFIX_BYTES
            .checked_add(inline_metadata)
            .ok_or_else(|| renderer_error(20, b"native resource length overflow", false))?;
        if !resource.handle.is_valid()
            || source_revision == 0
            || total_bytes == 0
            || content_hash.iter().all(|byte| *byte == 0)
            || offset
                .checked_add(chunk_bytes)
                .is_none_or(|end| end > total_bytes)
            || chunk_start
                .checked_add(chunk_bytes)
                .is_none_or(|end| end != payload.len())
            || final_chunk != (offset + chunk_bytes == total_bytes)
        {
            return Err(renderer_error(
                20,
                b"invalid native resource publication fields",
                false,
            ));
        }
        let key = (resource, source_revision);
        if offset == 0 {
            self.resource_assemblies.retain(|(candidate, revision), _| {
                *candidate != resource || *revision >= source_revision
            });
            self.resource_assemblies.insert(
                key,
                NativeResourceAssembly {
                    kind,
                    content_hash,
                    total_bytes,
                    metadata_bytes,
                    metadata: payload[PREFIX_BYTES..chunk_start].to_vec(),
                    bytes: Vec::with_capacity(total_bytes),
                },
            );
        }
        let assembly = self
            .resource_assemblies
            .get_mut(&key)
            .ok_or_else(|| renderer_error(20, b"native resource chunk has no assembly", false))?;
        if assembly.kind != kind
            || assembly.content_hash != content_hash
            || assembly.total_bytes != total_bytes
            || assembly.metadata_bytes != metadata_bytes
            || assembly.bytes.len() != offset
        {
            return Err(renderer_error(
                20,
                b"native resource chunk sequence mismatch",
                false,
            ));
        }
        assembly.bytes.extend_from_slice(&payload[chunk_start..]);
        if !final_chunk {
            return Ok(NativeResourcePacketResult::Pending);
        }
        let assembly = self.resource_assemblies.remove(&key).unwrap();
        let publication = UiResourcePublication {
            resource,
            source_revision,
            kind: assembly.kind,
            content_hash: assembly.content_hash,
            bytes: assembly.bytes,
            metadata: assembly.metadata,
        };
        self.publish_resource(publication)
            .map(NativeResourcePacketResult::Residency)
    }

    pub fn bind_resource(
        &mut self,
        node: NodeId,
        resource: UiResourceId,
        source_revision: u64,
    ) -> Result<(), PlatformApplyError> {
        if !node.is_valid() || source_revision == 0 {
            return Err(renderer_error(
                16,
                b"invalid native resource binding",
                false,
            ));
        }
        self.resource_bindings
            .insert(node, (resource, source_revision));
        Ok(())
    }

    pub fn unbind_resource(
        &mut self,
        node: NodeId,
        resource: UiResourceId,
    ) -> Result<(), PlatformApplyError> {
        if self.resource_bindings.get(&node).map(|binding| binding.0) != Some(resource) {
            return Err(renderer_error(
                17,
                b"unknown native resource binding",
                false,
            ));
        }
        self.resource_bindings.remove(&node);
        Ok(())
    }

    pub fn publish_resource(
        &mut self,
        publication: UiResourcePublication,
    ) -> Result<UiRendererResidencyWork, PlatformApplyError> {
        self.resource_cache
            .as_mut()
            .ok_or_else(|| renderer_error(18, b"native resource cache is unavailable", false))?
            .request(publication)
            .map_err(map_resource_error)
    }

    pub fn complete_resource_residency(
        &mut self,
        work: &UiRendererResidencyWork,
        handle_bytes: Vec<u8>,
    ) -> Result<(), PlatformApplyError> {
        self.resource_cache
            .as_mut()
            .ok_or_else(|| renderer_error(18, b"native resource cache is unavailable", false))?
            .complete(work, handle_bytes)
            .map_err(map_resource_error)
    }

    pub fn retire_resource(
        &mut self,
        resource: UiResourceId,
        source_revision: u64,
    ) -> Result<(), PlatformApplyError> {
        if self
            .resource_bindings
            .values()
            .any(|binding| binding.0 == resource && binding.1 <= source_revision)
        {
            return Err(renderer_error(19, b"native resource is still bound", false));
        }
        self.resource_cache
            .as_mut()
            .ok_or_else(|| renderer_error(18, b"native resource cache is unavailable", false))?
            .retire(resource, source_revision)
            .map_err(map_resource_error)
    }
}

impl<F, S, I, P> PlatformRenderer for NativeRenderer<F, S, I, P>
where
    F: FontResolver,
    S: TextShaper,
    I: ImageIntrinsic,
    P: NativePainter,
{
    fn apply_validated(
        &mut self,
        replacement: bool,
        mutations: &[RendererMutation],
        desired: &RendererTreeSnapshot,
    ) -> Result<(), PlatformApplyError> {
        if self.closed {
            return Err(renderer_error(6, b"native renderer is closed", false));
        }
        let mut resource_bindings = if replacement {
            BTreeMap::new()
        } else {
            self.resource_bindings.clone()
        };
        for mutation in mutations {
            match mutation {
                RendererMutation::AttachResource(node, handle, source_revision) => {
                    let identity = self.resource_identity.ok_or_else(|| {
                        renderer_error(18, b"native resource cache is unavailable", false)
                    })?;
                    if *source_revision == 0
                        || !desired
                            .nodes
                            .iter()
                            .any(|candidate| candidate.node == *node)
                    {
                        return Err(renderer_error(
                            16,
                            b"invalid native resource binding",
                            false,
                        ));
                    }
                    resource_bindings.insert(
                        *node,
                        (
                            UiResourceId {
                                session: identity.session,
                                handle: *handle,
                            },
                            *source_revision,
                        ),
                    );
                }
                RendererMutation::DetachResource(node, handle) => {
                    if resource_bindings.get(node).map(|binding| binding.0.handle) != Some(*handle)
                    {
                        return Err(renderer_error(
                            17,
                            b"unknown native resource binding",
                            false,
                        ));
                    }
                    resource_bindings.remove(node);
                }
                _ => {}
            }
        }
        resource_bindings.retain(|node, _| {
            desired
                .nodes
                .iter()
                .any(|candidate| candidate.node == *node)
        });
        let mut interaction_states = self.interaction_states.clone();
        interaction_states.retain(|node, _| {
            desired
                .nodes
                .iter()
                .any(|candidate| candidate.node == *node)
        });
        let effective = apply_native_interaction_styles(desired, &interaction_states);
        let (layout, submission, hit_index) =
            self.render_candidate(&effective, &resource_bindings)?;
        self.base_tree = Some(desired.clone());
        self.interaction_states = interaction_states;
        self.nodes = effective
            .nodes
            .iter()
            .cloned()
            .map(|node| (node.node, node))
            .collect();
        self.resource_bindings = resource_bindings;
        self.hit_index = hit_index;
        self.layout_snapshot = Some(layout);
        self.composition_output = Some(submission);
        self.input_frozen = false;
        Ok(())
    }

    fn freeze_input(&mut self) {
        self.input_frozen = true;
    }

    fn hide_or_detach_poisoned_root(&mut self) {
        self.painter.hide_surface();
        self.base_tree = None;
        self.nodes.clear();
        self.interaction_states.clear();
        self.hit_index.clear();
        self.resource_bindings.clear();
        self.resource_cache = None;
        self.resource_identity = None;
        self.resource_assemblies.clear();
        self.layout_snapshot = None;
        self.composition_output = None;
    }

    fn close(&mut self) {
        if !self.closed {
            self.input_frozen = true;
            self.painter.hide_surface();
            self.painter.close();
            self.text.clear();
            self.base_tree = None;
            self.nodes.clear();
            self.interaction_states.clear();
            self.hit_index.clear();
            self.resource_bindings.clear();
            self.resource_cache = None;
            self.resource_identity = None;
            self.resource_assemblies.clear();
            self.layout_snapshot = None;
            self.composition_output = None;
            self.closed = true;
        }
    }
}

struct RendererMeasurer<'a, F, S, I> {
    text: &'a mut TextEngine<F, S>,
    images: &'a mut I,
    nodes: BTreeMap<NodeId, &'a vogui_runtime::renderer::RendererTreeNode>,
}

fn apply_native_interaction_styles(
    base: &RendererTreeSnapshot,
    states: &BTreeMap<NodeId, NativeInteractionState>,
) -> RendererTreeSnapshot {
    let mut desired = base.clone();
    for node in &mut desired.nodes {
        let mut state = states.get(&node.node).copied().unwrap_or_default();
        state.disabled |= node
            .props
            .get("disabled")
            .is_some_and(|value| value == "true");
        for (active, name) in [
            (state.hovered, "hover"),
            (state.focused, "focus"),
            (state.pressed, "pressed"),
            (state.disabled, "disabled"),
        ] {
            if active {
                overlay_native_state(&mut node.props, name);
            }
        }
    }
    desired
}

fn overlay_native_state(props: &mut BTreeMap<String, String>, state: &str) {
    let prefix = format!("state.{state}.");
    let overlays = props
        .iter()
        .filter_map(|(name, value)| {
            name.strip_prefix(&prefix)
                .map(|name| (name.to_owned(), value.clone()))
        })
        .collect::<Vec<_>>();
    for (name, value) in overlays {
        props.insert(name, value);
    }
}

impl<F, S, I> IntrinsicMeasurer for RendererMeasurer<'_, F, S, I>
where
    F: FontResolver,
    S: TextShaper,
    I: ImageIntrinsic,
{
    fn measure_text(
        &mut self,
        node: NodeId,
        text: &str,
        max_width_milli: i32,
    ) -> Result<Size, LayoutError> {
        let source = self.nodes.get(&node).ok_or(LayoutError::MissingNode)?;
        let style = text_style(source)?;
        let layout = self
            .text
            .layout(
                node,
                text,
                style,
                max_width_milli,
                source.props.get("locale").map_or("und", String::as_str),
                text_direction(source),
            )
            .map_err(|_| LayoutError::IntrinsicMeasure)?;
        Ok(Size {
            width_milli: layout.width_milli,
            height_milli: layout.height_milli,
        })
    }

    fn measure_image(
        &mut self,
        _node: NodeId,
        source: &str,
        max_width_milli: i32,
        max_height_milli: i32,
    ) -> Result<Size, LayoutError> {
        self.images
            .measure_image(source, max_width_milli, max_height_milli)
    }
}

fn build_paint_list<F: FontResolver, S: TextShaper>(
    tree: &RendererTreeSnapshot,
    layout: &LayoutSnapshot,
    text: &mut TextEngine<F, S>,
    resource_bindings: &BTreeMap<NodeId, (UiResourceId, u64)>,
    resource_cache: Option<&UiRendererResourceCache>,
    max_commands: usize,
) -> Result<Vec<PaintCommand>, PlatformApplyError> {
    let nodes = tree
        .nodes
        .iter()
        .map(|node| (node.node, node))
        .collect::<BTreeMap<_, _>>();
    let mut commands = Vec::new();
    paint_node(
        tree.tree_root,
        &nodes,
        layout,
        text,
        resource_bindings,
        resource_cache,
        max_commands,
        &mut commands,
    )?;
    Ok(commands)
}

fn paint_node<F: FontResolver, S: TextShaper>(
    node_id: NodeId,
    nodes: &BTreeMap<NodeId, &vogui_runtime::renderer::RendererTreeNode>,
    layout: &LayoutSnapshot,
    text: &mut TextEngine<F, S>,
    resource_bindings: &BTreeMap<NodeId, (UiResourceId, u64)>,
    resource_cache: Option<&UiRendererResourceCache>,
    max_commands: usize,
    commands: &mut Vec<PaintCommand>,
) -> Result<(), PlatformApplyError> {
    let node = nodes
        .get(&node_id)
        .copied()
        .ok_or_else(|| renderer_error(8, b"paint tree omitted node", false))?;
    let rect = *layout
        .boxes
        .get(&node.node)
        .ok_or_else(|| renderer_error(8, b"layout omitted node", false))?;
    let clipped = matches!(
        node.props.get("overflow").map(String::as_str),
        Some("hidden" | "scroll" | "auto")
    );
    if clipped {
        commands.push(PaintCommand::BeginClip(node.node, rect));
    }
    if let Some(background) = node.props.get("background_rgba") {
        commands.push(PaintCommand::FillRect {
            node: node.node,
            rect,
            color: parse_color(background)?,
        });
    }
    if let (Some(border), Some(width)) = (
        node.props.get("border_rgba"),
        node.props.get("border_width_milli"),
    ) {
        let width_milli = width
            .parse::<i32>()
            .ok()
            .filter(|width| *width > 0)
            .ok_or_else(|| renderer_error(12, b"invalid border width", false))?;
        commands.push(PaintCommand::StrokeRect {
            node: node.node,
            rect,
            color: parse_color(border)?,
            width_milli,
        });
    }
    if node
        .props
        .get("focused")
        .is_some_and(|value| value == "true")
    {
        commands.push(PaintCommand::StrokeRect {
            node: node.node,
            rect,
            color: node
                .props
                .get("focus_ring_rgba")
                .map(|value| parse_color(value))
                .transpose()?
                .unwrap_or(0xff0a84ff),
            width_milli: property_i32(node, "focus_ring_width_milli", 2_000)?,
        });
    }
    match &node.kind {
        ViewKind::Text(value) => {
            let shaped = text
                .layout(
                    node.node,
                    value,
                    text_style(node).map_err(map_layout_error)?,
                    rect.width_milli,
                    node.props.get("locale").map_or("und", String::as_str),
                    text_direction(node),
                )
                .map_err(map_text_error)?;
            commands.push(PaintCommand::Text {
                node: node.node,
                rect,
                color: node
                    .props
                    .get("color_rgba")
                    .map(|value| parse_color(value))
                    .transpose()?
                    .unwrap_or(0xff000000),
                glyph_count: shaped.glyphs.len(),
            });
        }
        ViewKind::Element(kind) if kind == "image" => {
            let residency = resource_bindings
                .get(&node.node)
                .and_then(|(resource, _)| resource_cache?.resident_handle(*resource))
                .map(<[u8]>::to_vec);
            commands.push(PaintCommand::Image {
                node: node.node,
                rect,
                source: node.props.get("source").cloned().unwrap_or_default(),
                residency,
            });
        }
        ViewKind::Element(kind) if kind == "icon" => {
            let residency = resource_bindings
                .get(&node.node)
                .and_then(|(resource, _)| resource_cache?.resident_handle(*resource))
                .ok_or_else(|| renderer_error(11, b"icon residency is unavailable", false))?
                .to_vec();
            commands.push(PaintCommand::Icon {
                node: node.node,
                rect,
                color: node
                    .props
                    .get("color_rgba")
                    .map(|value| parse_color(value))
                    .transpose()?
                    .unwrap_or(0xff000000),
                residency,
            });
        }
        ViewKind::Element(kind)
            if matches!(
                kind.as_str(),
                "text-field" | "password-field" | "text-area" | "combobox"
            ) =>
        {
            let value = node
                .props
                .get("value")
                .filter(|value| !value.is_empty())
                .or_else(|| node.props.get("placeholder"))
                .map(String::as_str)
                .unwrap_or("");
            let obscured;
            let value = if kind == "password-field" && !value.is_empty() {
                obscured = "•".repeat(value.chars().count());
                obscured.as_str()
            } else {
                value
            };
            let shaped = text
                .layout(
                    node.node,
                    value,
                    text_style(node).map_err(map_layout_error)?,
                    rect.width_milli,
                    node.props.get("locale").map_or("und", String::as_str),
                    text_direction(node),
                )
                .map_err(map_text_error)?;
            commands.push(PaintCommand::Text {
                node: node.node,
                rect,
                color: node
                    .props
                    .get("color_rgba")
                    .map(|value| parse_color(value))
                    .transpose()?
                    .unwrap_or(0xff000000),
                glyph_count: shaped.glyphs.len(),
            });
        }
        ViewKind::Element(kind) if kind == "slider" => {
            let minimum = property_i64(node, "minimumMilli", 0)?;
            let maximum = property_i64(node, "maximumMilli", 1000)?;
            let span = maximum
                .checked_sub(minimum)
                .filter(|span| *span > 0)
                .ok_or_else(|| renderer_error(12, b"invalid slider range", false))?;
            let value = property_i64(node, "valueMilli", minimum)?.clamp(minimum, maximum);
            let track = Rect {
                x_milli: rect.x_milli,
                y_milli: rect.y_milli + rect.height_milli / 2 - 2_000,
                width_milli: rect.width_milli,
                height_milli: 4_000,
            };
            commands.push(PaintCommand::FillRect {
                node: node.node,
                rect: track,
                color: node
                    .props
                    .get("track_rgba")
                    .map(|value| parse_color(value))
                    .transpose()?
                    .unwrap_or(0xffb0b0b0),
            });
            let progress = i64::from(rect.width_milli)
                .checked_mul(value - minimum)
                .and_then(|value| value.checked_div(span))
                .ok_or_else(|| renderer_error(12, b"slider geometry overflow", false))?
                .clamp(0, i64::from(rect.width_milli));
            let progress = i32::try_from(progress)
                .map_err(|_| renderer_error(12, b"slider geometry overflow", false))?;
            commands.push(PaintCommand::FillRect {
                node: node.node,
                rect: Rect {
                    width_milli: progress,
                    ..track
                },
                color: node
                    .props
                    .get("accent_rgba")
                    .map(|value| parse_color(value))
                    .transpose()?
                    .unwrap_or(0xff0a84ff),
            });
            commands.push(PaintCommand::FillRect {
                node: node.node,
                rect: Rect {
                    x_milli: rect.x_milli + progress - 8_000,
                    y_milli: rect.y_milli + rect.height_milli / 2 - 8_000,
                    width_milli: 16_000,
                    height_milli: 16_000,
                },
                color: node
                    .props
                    .get("thumb_rgba")
                    .map(|value| parse_color(value))
                    .transpose()?
                    .unwrap_or(0xffffffff),
            });
        }
        ViewKind::Element(kind) if is_labeled_control(kind) => {
            if let Some(label) = node.props.get("label") {
                let shaped = text
                    .layout(
                        node.node,
                        label,
                        text_style(node).map_err(map_layout_error)?,
                        rect.width_milli,
                        node.props.get("locale").map_or("und", String::as_str),
                        text_direction(node),
                    )
                    .map_err(map_text_error)?;
                commands.push(PaintCommand::Text {
                    node: node.node,
                    rect,
                    color: node
                        .props
                        .get("color_rgba")
                        .map(|value| parse_color(value))
                        .transpose()?
                        .unwrap_or(0xff000000),
                    glyph_count: shaped.glyphs.len(),
                });
            }
            if matches!(kind.as_str(), "checkbox" | "switch" | "toggle" | "radio")
                && node
                    .props
                    .get("checked")
                    .is_some_and(|value| value == "true")
            {
                let indicator = Rect {
                    x_milli: rect.x_milli,
                    y_milli: rect.y_milli,
                    width_milli: rect.height_milli.min(20_000),
                    height_milli: rect.height_milli.min(20_000),
                };
                commands.push(PaintCommand::FillRect {
                    node: node.node,
                    rect: indicator,
                    color: node
                        .props
                        .get("accent_rgba")
                        .map(|value| parse_color(value))
                        .transpose()?
                        .unwrap_or(0xff0a84ff),
                });
            }
        }
        ViewKind::Element(kind) if matches!(kind.as_str(), "progress" | "spinner") => {
            let maximum = property_u64(node, "maximumMilli", 1000)?;
            let value = if kind == "spinner" {
                maximum / 3
            } else {
                property_u64(node, "valueMilli", 0)?.min(maximum)
            };
            let width = if maximum == 0 {
                0
            } else {
                (i64::from(rect.width_milli) * value as i64 / maximum as i64)
                    .clamp(0, i64::from(i32::MAX)) as i32
            };
            commands.push(PaintCommand::FillRect {
                node: node.node,
                rect: Rect {
                    width_milli: width,
                    ..rect
                },
                color: node
                    .props
                    .get("accent_rgba")
                    .map(|value| parse_color(value))
                    .transpose()?
                    .unwrap_or(0xff0a84ff),
            });
        }
        ViewKind::Element(_) => {}
    }
    if commands.len() > max_commands {
        return Err(renderer_error(9, b"paint command capacity exceeded", false));
    }
    for child in &node.children {
        paint_node(
            *child,
            nodes,
            layout,
            text,
            resource_bindings,
            resource_cache,
            max_commands,
            commands,
        )?;
    }
    if clipped {
        commands.push(PaintCommand::EndClip(node.node));
    }
    if commands.len() > max_commands {
        return Err(renderer_error(9, b"paint command capacity exceeded", false));
    }
    Ok(())
}

fn text_style(node: &vogui_runtime::renderer::RendererTreeNode) -> Result<TextStyle, LayoutError> {
    let size_milli = property_u32(node, "font_size_milli", 16_000)?;
    let line_height_milli =
        property_u32(node, "line_height_milli", size_milli.saturating_mul(6) / 5)?;
    let weight = property_u32(node, "font_weight", 400)?;
    let weight = u16::try_from(weight).map_err(|_| LayoutError::InvalidProperty)?;
    Ok(TextStyle {
        families: vec![node
            .props
            .get("font_family")
            .cloned()
            .unwrap_or_else(|| "system-ui".to_string())],
        size_milli,
        weight,
        italic: node
            .props
            .get("font_italic")
            .is_some_and(|value| value == "true"),
        letter_spacing_milli: node
            .props
            .get("letter_spacing_milli")
            .map(|value| value.parse().map_err(|_| LayoutError::InvalidProperty))
            .transpose()?
            .unwrap_or(0),
        line_height_milli,
    })
}

fn property_u32(
    node: &vogui_runtime::renderer::RendererTreeNode,
    name: &str,
    default: u32,
) -> Result<u32, LayoutError> {
    node.props
        .get(name)
        .map(|value| value.parse().map_err(|_| LayoutError::InvalidProperty))
        .transpose()
        .map(|value| value.unwrap_or(default))
}

fn property_u64(
    node: &vogui_runtime::renderer::RendererTreeNode,
    name: &str,
    default: u64,
) -> Result<u64, PlatformApplyError> {
    node.props
        .get(name)
        .map(|value| {
            value
                .parse()
                .map_err(|_| renderer_error(12, b"invalid unsigned control property", false))
        })
        .transpose()
        .map(|value| value.unwrap_or(default))
}

fn property_i32(
    node: &vogui_runtime::renderer::RendererTreeNode,
    name: &str,
    default: i32,
) -> Result<i32, PlatformApplyError> {
    node.props
        .get(name)
        .map(|value| {
            value
                .parse()
                .map_err(|_| renderer_error(12, b"invalid signed control property", false))
        })
        .transpose()
        .map(|value| value.unwrap_or(default))
}

fn property_i64(
    node: &vogui_runtime::renderer::RendererTreeNode,
    name: &str,
    default: i64,
) -> Result<i64, PlatformApplyError> {
    node.props
        .get(name)
        .map(|value| {
            value
                .parse()
                .map_err(|_| renderer_error(12, b"invalid signed control property", false))
        })
        .transpose()
        .map(|value| value.unwrap_or(default))
}

fn is_labeled_control(kind: &str) -> bool {
    matches!(
        kind,
        "button"
            | "link"
            | "checkbox"
            | "switch"
            | "toggle"
            | "radio"
            | "tab"
            | "menuitem"
            | "option"
            | "disclosure"
            | "radio-group"
            | "select"
            | "list-box"
            | "menu"
            | "context-menu"
    )
}

fn text_direction(node: &vogui_runtime::renderer::RendererTreeNode) -> TextDirection {
    match node.props.get("direction").map(String::as_str) {
        Some("ltr") => TextDirection::LeftToRight,
        Some("rtl") => TextDirection::RightToLeft,
        _ => TextDirection::Auto,
    }
}

fn parse_color(value: &str) -> Result<u32, PlatformApplyError> {
    let value = value.strip_prefix('#').unwrap_or(value);
    u32::from_str_radix(value, 16)
        .map_err(|_| renderer_error(10, b"invalid RGBA color property", false))
}

fn contains(rect: Rect, x: i32, y: i32) -> bool {
    x >= rect.x_milli
        && y >= rect.y_milli
        && x < rect.x_milli.saturating_add(rect.width_milli)
        && y < rect.y_milli.saturating_add(rect.height_milli)
}

fn map_layout_error(error: LayoutError) -> PlatformApplyError {
    renderer_error(100 + error as u32, b"native layout rejected tree", false)
}

fn map_text_error(error: TextError) -> PlatformApplyError {
    renderer_error(200 + error as u32, b"native text layout failed", false)
}

fn map_resource_error(error: UiResourceError) -> PlatformApplyError {
    renderer_error(
        300 + error as u32,
        b"native resource residency rejected work",
        false,
    )
}

fn resource_kind_from_tag(tag: u8) -> Result<UiResourceKind, PlatformApplyError> {
    match tag {
        1 => Ok(UiResourceKind::Image),
        2 => Ok(UiResourceKind::Font),
        3 => Ok(UiResourceKind::IconSvg),
        4 => Ok(UiResourceKind::Cursor),
        5 => Ok(UiResourceKind::LocalizedText),
        6 => Ok(UiResourceKind::CanvasPaint),
        _ => Err(renderer_error(20, b"invalid native resource kind", false)),
    }
}

fn renderer_error(
    code: u32,
    diagnostic: &[u8],
    platform_may_be_partially_visible: bool,
) -> PlatformApplyError {
    PlatformApplyError {
        code,
        diagnostic: diagnostic.to_vec(),
        platform_may_be_partially_visible,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use vogui_runtime::{
        platform_renderer::PlatformRenderer,
        renderer::{RendererTreeNode, RendererTreeSnapshot},
    };
    use vogui_text::{ResolvedFont, TextCacheKey, TextLayout};

    struct Fonts;

    impl FontResolver for Fonts {
        fn resolve(
            &mut self,
            _families: &[String],
            _weight: u16,
            _italic: bool,
            _locale: &str,
        ) -> Result<ResolvedFont, TextError> {
            Ok(ResolvedFont {
                face_id: 1,
                generation: 1,
            })
        }
    }

    struct Shaper;

    impl TextShaper for Shaper {
        fn shape(
            &mut self,
            _font: &ResolvedFont,
            _key: &TextCacheKey,
        ) -> Result<TextLayout, TextError> {
            Ok(TextLayout {
                width_milli: 10_000,
                height_milli: 10_000,
                baseline_milli: 8_000,
                glyphs: Vec::new(),
            })
        }
    }

    struct Images;

    impl ImageIntrinsic for Images {
        fn measure_image(
            &mut self,
            _source: &str,
            _max_width_milli: i32,
            _max_height_milli: i32,
        ) -> Result<Size, LayoutError> {
            Ok(Size {
                width_milli: 10_000,
                height_milli: 10_000,
            })
        }
    }

    struct Painter {
        generation: u64,
        fail_submit: bool,
        hidden: usize,
        closed: usize,
        frames: Vec<NativeFrame>,
    }

    impl NativePainter for Painter {
        type Prepared = NativeFrame;

        fn device_generation(&self) -> u64 {
            self.generation
        }

        fn prepare(&mut self, frame: &NativeFrame) -> Result<Self::Prepared, PlatformApplyError> {
            Ok(frame.clone())
        }

        fn submit(
            &mut self,
            prepared: Self::Prepared,
        ) -> Result<NativePaintSubmission, PlatformApplyError> {
            if self.fail_submit {
                return Err(renderer_error(900, b"submit failed", true));
            }
            self.frames.push(prepared.clone());
            Ok(NativePaintSubmission {
                texture_token: 1,
                fence_value: prepared.tree_revision,
                device_generation: self.generation,
                content_revision: prepared.tree_revision,
            })
        }

        fn rebind_device(&mut self, new_generation: u64) -> Result<(), PlatformApplyError> {
            self.generation = new_generation;
            Ok(())
        }

        fn hide_surface(&mut self) {
            self.hidden += 1;
        }

        fn close(&mut self) {
            self.closed += 1;
        }
    }

    fn handle(index: u32) -> Handle {
        Handle {
            index,
            generation: 1,
        }
    }

    fn snapshot(revision: u64, background: &str) -> RendererTreeSnapshot {
        let root = handle(1);
        RendererTreeSnapshot {
            root: handle(9),
            revision,
            tree_root: root,
            nodes: vec![RendererTreeNode {
                node: root,
                parent: None,
                children: Vec::new(),
                kind: ViewKind::Element("panel".to_owned()),
                props: BTreeMap::from([
                    ("width_milli".to_owned(), "100000".to_owned()),
                    ("height_milli".to_owned(), "50000".to_owned()),
                    ("background_rgba".to_owned(), background.to_owned()),
                    (
                        "state.hover.background_rgba".to_owned(),
                        "00ff00ff".to_owned(),
                    ),
                    ("state.hover.border_rgba".to_owned(), "0000ffff".to_owned()),
                    (
                        "state.hover.border_width_milli".to_owned(),
                        "2000".to_owned(),
                    ),
                    (
                        "state.disabled.background_rgba".to_owned(),
                        "777777ff".to_owned(),
                    ),
                ]),
            }],
        }
    }

    fn renderer() -> NativeRenderer<Fonts, Shaper, Images, Painter> {
        NativeRenderer::new(
            NativeRendererConfig::default(),
            Fonts,
            Shaper,
            Images,
            Painter {
                generation: 1,
                fail_submit: false,
                hidden: 0,
                closed: 0,
                frames: Vec::new(),
            },
        )
        .unwrap()
    }

    #[test]
    fn successful_frame_publishes_hit_index_and_failed_submit_preserves_last_good() {
        let mut renderer = renderer();
        renderer
            .apply_validated(true, &[], &snapshot(1, "ff0000ff"))
            .unwrap();
        let committed = renderer.composition_output().unwrap();
        assert_eq!(committed.content_revision, 1);
        assert_eq!(renderer.hit_test(1, 1), Some(handle(1)));

        renderer.painter_mut().fail_submit = true;
        let error = renderer
            .apply_validated(false, &[], &snapshot(2, "00ff00ff"))
            .unwrap_err();
        assert_eq!(error.code, 900);
        assert!(error.platform_may_be_partially_visible);
        assert_eq!(renderer.composition_output(), Some(committed));
        assert_eq!(renderer.layout_snapshot().unwrap().tree_revision, 1);
    }

    #[test]
    fn device_rebind_invalidates_old_composition_and_close_is_idempotent() {
        let mut renderer = renderer();
        renderer
            .apply_validated(true, &[], &snapshot(1, "ff0000ff"))
            .unwrap();
        renderer.rebind_device(2).unwrap();
        assert!(renderer.composition_output().is_none());
        renderer.close();
        renderer.close();
        assert_eq!(renderer.painter_mut().hidden, 1);
        assert_eq!(renderer.painter_mut().closed, 1);
        assert!(renderer.hit_test(1, 1).is_none());
    }

    #[test]
    fn interaction_state_repaints_typed_state_styles_in_precedence_order() {
        let mut renderer = renderer();
        renderer
            .apply_validated(true, &[], &snapshot(1, "ff0000ff"))
            .unwrap();
        renderer
            .set_interaction_state(
                handle(1),
                NativeInteractionState {
                    hovered: true,
                    ..NativeInteractionState::default()
                },
            )
            .unwrap();
        let hover = renderer.painter_mut().frames.last().unwrap();
        assert!(hover.commands.contains(&PaintCommand::FillRect {
            node: handle(1),
            rect: Rect {
                x_milli: 0,
                y_milli: 0,
                width_milli: 100_000,
                height_milli: 50_000,
            },
            color: 0x00ff00ff,
        }));
        assert!(hover.commands.iter().any(|command| matches!(
            command,
            PaintCommand::StrokeRect {
                color: 0x0000ffff,
                width_milli: 2_000,
                ..
            }
        )));

        renderer
            .set_interaction_state(
                handle(1),
                NativeInteractionState {
                    hovered: true,
                    disabled: true,
                    ..NativeInteractionState::default()
                },
            )
            .unwrap();
        let disabled = renderer.painter_mut().frames.last().unwrap();
        assert!(disabled.commands.iter().any(|command| matches!(
            command,
            PaintCommand::FillRect {
                color: 0x777777ff,
                ..
            }
        )));
    }
}
