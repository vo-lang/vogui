use std::collections::{BTreeMap, BTreeSet};

use crate::layout_style::{
    Align, Axis, Color, Contrast, Cursor, Density, Edges, FontWeight, Justify, Layout, LayoutMode,
    Length, MotionPreference, Overflow, StateStyles, StyleProperties, TextDirection,
    ThemeEnvironment, ThemeMode,
};
use crate::resource::{UiResourceDescriptor, UiResourceKind};
use crate::tree::{ViewKind, ViewNode};
use vogui_protocol::v2::{EventToken, NodeId};

const MAX_PRESENTATION_BYTES: usize = 16 * 1024 * 1024;
const MAX_NODES: usize = 100_000;
const MAX_CHILDREN: usize = 100_000;
const MAX_BINDINGS: usize = 100_000;
const MAX_DEPTH: usize = 256;
const MAX_KEY_BYTES: usize = 4096;
const MAX_PROPERTY_BYTES: usize = 1024 * 1024;
const MAX_PROPERTIES_PER_NODE: usize = 256;
const PROPERTY_MAGIC: &[u8; 4] = b"VGP1";
const ROOT_BATCH_MAGIC: &[u8; 4] = b"VGR1";
const TRANSACTION_PREFIX_BYTES: usize = 28;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetEventBinding {
    pub source_node: u64,
    pub event_kind: u64,
    pub mapper_id: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetRefBinding {
    pub source_node: u64,
    pub logical_ref: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetResourceBinding {
    pub source_node: u64,
    pub logical_resource: u64,
    pub descriptor: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetStyleDefinition {
    pub logical_style: u64,
    pub descriptor: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetThemeDefinition {
    pub revision: u64,
    pub environment: ThemeEnvironment,
    pub tokens: BTreeMap<String, (StyleProperties, StateStyles)>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetPresentation {
    pub source_root: u64,
    pub view: ViewNode,
    pub source_paths: BTreeMap<u64, Vec<usize>>,
    pub events: Vec<TargetEventBinding>,
    pub refs: Vec<TargetRefBinding>,
    pub resources: Vec<TargetResourceBinding>,
    pub styles: Vec<TargetStyleDefinition>,
    pub theme: Option<TargetThemeDefinition>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetRootPresentation {
    pub logical_root: u64,
    pub presentation: TargetPresentation,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TargetPresentationError {
    Capacity,
    Malformed,
    DuplicateNode,
    DuplicateRoot,
    UnknownNode,
    InvalidTree,
    InvalidUtf8,
    InvalidKind,
    InvalidProperties,
}

pub fn decode_target_resource_descriptor(
    bytes: &[u8],
) -> Result<UiResourceDescriptor, TargetPresentationError> {
    if bytes.len() < 48 || &bytes[..4] != b"VGD1" {
        return Err(TargetPresentationError::Malformed);
    }
    let kind = match u32::from_le_bytes(bytes[4..8].try_into().unwrap()) {
        1 => UiResourceKind::Image,
        2 => UiResourceKind::Font,
        3 => UiResourceKind::IconSvg,
        4 => UiResourceKind::Cursor,
        5 => UiResourceKind::LocalizedText,
        6 => UiResourceKind::CanvasPaint,
        _ => return Err(TargetPresentationError::InvalidKind),
    };
    let locator_len = u16::from_le_bytes(bytes[8..10].try_into().unwrap()) as usize;
    if bytes[10..12] != [0, 0] || locator_len == 0 {
        return Err(TargetPresentationError::Malformed);
    }
    let options_len = u32::from_le_bytes(bytes[12..16].try_into().unwrap()) as usize;
    let locator_end = 48_usize
        .checked_add(locator_len)
        .ok_or(TargetPresentationError::Capacity)?;
    let options_end = locator_end
        .checked_add(options_len)
        .filter(|end| *end == bytes.len())
        .ok_or(TargetPresentationError::Malformed)?;
    let mut content_hash = [0_u8; 32];
    content_hash.copy_from_slice(&bytes[16..48]);
    if content_hash.iter().all(|byte| *byte == 0) {
        return Err(TargetPresentationError::Malformed);
    }
    Ok(UiResourceDescriptor {
        kind,
        locator: bytes[48..locator_end].to_vec(),
        content_hash,
        options: bytes[locator_end..options_end].to_vec(),
    })
}

pub fn decode_target_style_descriptor(
    bytes: &[u8],
) -> Result<(StyleProperties, StateStyles), TargetPresentationError> {
    if !bytes.starts_with(b"VGY1") {
        return Err(TargetPresentationError::Malformed);
    }
    let mut cursor = 4;
    let layout = decode_style_layout(bytes, &mut cursor)?;
    let properties = decode_style_visual(bytes, &mut cursor, Some(layout))?;
    let states = StateStyles {
        hover: decode_style_visual(bytes, &mut cursor, None)?,
        focus: decode_style_visual(bytes, &mut cursor, None)?,
        pressed: decode_style_visual(bytes, &mut cursor, None)?,
        disabled: decode_style_visual(bytes, &mut cursor, None)?,
    };
    if cursor != bytes.len() {
        return Err(TargetPresentationError::Malformed);
    }
    Ok((properties, states))
}

pub fn decode_target_theme_descriptor(
    bytes: &[u8],
) -> Result<TargetThemeDefinition, TargetPresentationError> {
    if !bytes.starts_with(b"VGT1") {
        return Err(TargetPresentationError::Malformed);
    }
    let mut cursor = 4;
    let revision = take_u64(bytes, &mut cursor)?;
    let mode = match take_u8(bytes, &mut cursor)? {
        1 => ThemeMode::Light,
        2 => ThemeMode::Dark,
        _ => return Err(TargetPresentationError::Malformed),
    };
    let contrast = match take_u8(bytes, &mut cursor)? {
        1 => Contrast::Normal,
        2 => Contrast::High,
        _ => return Err(TargetPresentationError::Malformed),
    };
    let motion = match take_u8(bytes, &mut cursor)? {
        1 => MotionPreference::Full,
        2 => MotionPreference::Reduced,
        _ => return Err(TargetPresentationError::Malformed),
    };
    let density = match take_u8(bytes, &mut cursor)? {
        1 => Density::Compact,
        2 => Density::Standard,
        3 => Density::Comfortable,
        _ => return Err(TargetPresentationError::Malformed),
    };
    let typography_scale_milli = take_u16(bytes, &mut cursor)?;
    let direction = match take_u8(bytes, &mut cursor)? {
        1 => TextDirection::Locale,
        2 => TextDirection::LeftToRight,
        3 => TextDirection::RightToLeft,
        _ => return Err(TargetPresentationError::Malformed),
    };
    if take_u8(bytes, &mut cursor)? != 0 {
        return Err(TargetPresentationError::Malformed);
    }
    let locale_len = usize::from(take_u16(bytes, &mut cursor)?);
    let token_count = usize::from(take_u16(bytes, &mut cursor)?);
    if revision == 0 || typography_scale_milli == 0 || locale_len == 0 {
        return Err(TargetPresentationError::Malformed);
    }
    let locale = std::str::from_utf8(take_bytes(bytes, &mut cursor, locale_len)?)
        .map_err(|_| TargetPresentationError::InvalidUtf8)?
        .to_owned();
    let mut tokens = BTreeMap::new();
    for _ in 0..token_count {
        let name_len = usize::from(take_u16(bytes, &mut cursor)?);
        let descriptor_len = usize::try_from(take_u32(bytes, &mut cursor)?)
            .map_err(|_| TargetPresentationError::Capacity)?;
        if name_len == 0 || name_len > MAX_KEY_BYTES || descriptor_len > MAX_PROPERTY_BYTES {
            return Err(TargetPresentationError::Malformed);
        }
        let name = std::str::from_utf8(take_bytes(bytes, &mut cursor, name_len)?)
            .map_err(|_| TargetPresentationError::InvalidUtf8)?
            .to_owned();
        let descriptor = take_bytes(bytes, &mut cursor, descriptor_len)?;
        if tokens
            .insert(name, decode_target_style_descriptor(descriptor)?)
            .is_some()
        {
            return Err(TargetPresentationError::Malformed);
        }
    }
    if cursor != bytes.len() {
        return Err(TargetPresentationError::Malformed);
    }
    Ok(TargetThemeDefinition {
        revision,
        environment: ThemeEnvironment {
            mode,
            contrast,
            motion,
            density,
            typography_scale_milli,
            locale,
            direction,
        },
        tokens,
    })
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TargetWireEventBinding {
    pub node: NodeId,
    pub event_kind: u64,
    pub token: EventToken,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TargetWireRefBinding {
    pub node: NodeId,
    pub reference: vogui_protocol::v2::Handle,
    pub binding_generation: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TargetWireResourceBinding {
    pub node: NodeId,
    pub resource: vogui_protocol::v2::Handle,
    pub source_revision: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
enum SourceNodeKind {
    Element {
        kind: u64,
        properties: Vec<u8>,
        children: Vec<u64>,
    },
    Scope {
        builder_id: u64,
        child: u64,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct SourceNode {
    key: Vec<u8>,
    kind: SourceNodeKind,
}

pub fn decode_target_presentation(
    bytes: &[u8],
) -> Result<TargetPresentation, TargetPresentationError> {
    if bytes.is_empty() || bytes.len() > MAX_PRESENTATION_BYTES {
        return Err(TargetPresentationError::Capacity);
    }
    let mut cursor = 0_usize;
    let mut root = None;
    let mut nodes = BTreeMap::<u64, SourceNode>::new();
    let mut events = Vec::new();
    let mut refs = Vec::new();
    let mut resources = Vec::new();
    let mut styles = Vec::new();
    let mut theme = None;
    let mut style_ids = BTreeSet::new();
    let mut decoded_styles = BTreeMap::new();
    let mut total_children = 0_usize;
    let mut total_property_bytes = 0_usize;
    while cursor < bytes.len() {
        let tag = take_u8(bytes, &mut cursor)?;
        match tag {
            1 => {
                if nodes.len() == MAX_NODES {
                    return Err(TargetPresentationError::Capacity);
                }
                let id = take_u64(bytes, &mut cursor)?;
                let kind = take_u64(bytes, &mut cursor)?;
                let key_len = usize::try_from(take_u32(bytes, &mut cursor)?)
                    .map_err(|_| TargetPresentationError::Capacity)?;
                let properties_len = usize::try_from(take_u32(bytes, &mut cursor)?)
                    .map_err(|_| TargetPresentationError::Capacity)?;
                let child_count = usize::try_from(take_u32(bytes, &mut cursor)?)
                    .map_err(|_| TargetPresentationError::Capacity)?;
                if id == 0
                    || kind == 0
                    || key_len > MAX_KEY_BYTES
                    || properties_len > MAX_PROPERTY_BYTES
                {
                    return Err(TargetPresentationError::Capacity);
                }
                total_children = total_children
                    .checked_add(child_count)
                    .filter(|count| *count <= MAX_CHILDREN)
                    .ok_or(TargetPresentationError::Capacity)?;
                total_property_bytes = total_property_bytes
                    .checked_add(properties_len)
                    .filter(|count| *count <= MAX_PROPERTY_BYTES)
                    .ok_or(TargetPresentationError::Capacity)?;
                let key = take_bytes(bytes, &mut cursor, key_len)?.to_vec();
                let properties = take_bytes(bytes, &mut cursor, properties_len)?.to_vec();
                let mut children = Vec::with_capacity(child_count);
                for _ in 0..child_count {
                    children.push(take_u64(bytes, &mut cursor)?);
                }
                if nodes
                    .insert(
                        id,
                        SourceNode {
                            key,
                            kind: SourceNodeKind::Element {
                                kind,
                                properties,
                                children,
                            },
                        },
                    )
                    .is_some()
                {
                    return Err(TargetPresentationError::DuplicateNode);
                }
            }
            2 => {
                if nodes.len() == MAX_NODES {
                    return Err(TargetPresentationError::Capacity);
                }
                let id = take_u64(bytes, &mut cursor)?;
                let builder_id = take_u64(bytes, &mut cursor)?;
                let child = take_u64(bytes, &mut cursor)?;
                let key_len = usize::try_from(take_u32(bytes, &mut cursor)?)
                    .map_err(|_| TargetPresentationError::Capacity)?;
                if id == 0 || builder_id == 0 || child == 0 || key_len > MAX_KEY_BYTES {
                    return Err(TargetPresentationError::Malformed);
                }
                let key = take_bytes(bytes, &mut cursor, key_len)?.to_vec();
                if nodes
                    .insert(
                        id,
                        SourceNode {
                            key,
                            kind: SourceNodeKind::Scope { builder_id, child },
                        },
                    )
                    .is_some()
                {
                    return Err(TargetPresentationError::DuplicateNode);
                }
            }
            3 => {
                if events.len() == MAX_BINDINGS {
                    return Err(TargetPresentationError::Capacity);
                }
                let binding = TargetEventBinding {
                    source_node: take_u64(bytes, &mut cursor)?,
                    event_kind: take_u64(bytes, &mut cursor)?,
                    mapper_id: take_u64(bytes, &mut cursor)?,
                };
                if binding.source_node == 0 || binding.event_kind == 0 || binding.mapper_id == 0 {
                    return Err(TargetPresentationError::Malformed);
                }
                events.push(binding);
            }
            4 => {
                if refs.len() == MAX_BINDINGS {
                    return Err(TargetPresentationError::Capacity);
                }
                let binding = TargetRefBinding {
                    source_node: take_u64(bytes, &mut cursor)?,
                    logical_ref: take_u64(bytes, &mut cursor)?,
                };
                if binding.source_node == 0 || binding.logical_ref == 0 {
                    return Err(TargetPresentationError::Malformed);
                }
                refs.push(binding);
            }
            5 => {
                let next_root = take_u64(bytes, &mut cursor)?;
                if next_root == 0 {
                    return Err(TargetPresentationError::Malformed);
                }
                if root.replace(next_root).is_some() {
                    return Err(TargetPresentationError::DuplicateRoot);
                }
            }
            6 => {
                if resources.len() == MAX_BINDINGS {
                    return Err(TargetPresentationError::Capacity);
                }
                let source_node = take_u64(bytes, &mut cursor)?;
                let logical_resource = take_u64(bytes, &mut cursor)?;
                let descriptor_len = usize::try_from(take_u32(bytes, &mut cursor)?)
                    .map_err(|_| TargetPresentationError::Capacity)?;
                if source_node == 0
                    || logical_resource == 0
                    || descriptor_len == 0
                    || descriptor_len > MAX_PROPERTY_BYTES
                {
                    return Err(TargetPresentationError::Malformed);
                }
                resources.push(TargetResourceBinding {
                    source_node,
                    logical_resource,
                    descriptor: take_bytes(bytes, &mut cursor, descriptor_len)?.to_vec(),
                });
            }
            7 => {
                if styles.len() == MAX_BINDINGS {
                    return Err(TargetPresentationError::Capacity);
                }
                let logical_style = take_u64(bytes, &mut cursor)?;
                let descriptor_len = usize::try_from(take_u32(bytes, &mut cursor)?)
                    .map_err(|_| TargetPresentationError::Capacity)?;
                if logical_style == 0
                    || descriptor_len < 4
                    || descriptor_len > MAX_PROPERTY_BYTES
                    || !style_ids.insert(logical_style)
                {
                    return Err(TargetPresentationError::Malformed);
                }
                let descriptor = take_bytes(bytes, &mut cursor, descriptor_len)?;
                let decoded = decode_target_style_descriptor(descriptor)?;
                decoded_styles.insert(logical_style, decoded);
                styles.push(TargetStyleDefinition {
                    logical_style,
                    descriptor: descriptor.to_vec(),
                });
            }
            8 => {
                let descriptor_len = usize::try_from(take_u32(bytes, &mut cursor)?)
                    .map_err(|_| TargetPresentationError::Capacity)?;
                if descriptor_len < 4 || descriptor_len > MAX_PROPERTY_BYTES || theme.is_some() {
                    return Err(TargetPresentationError::Malformed);
                }
                theme = Some(decode_target_theme_descriptor(take_bytes(
                    bytes,
                    &mut cursor,
                    descriptor_len,
                )?)?);
            }
            _ => return Err(TargetPresentationError::Malformed),
        }
    }
    let root = root.ok_or(TargetPresentationError::InvalidTree)?;
    if !nodes.contains_key(&root) {
        return Err(TargetPresentationError::UnknownNode);
    }
    if events
        .iter()
        .any(|binding| !nodes.contains_key(&binding.source_node))
        || refs
            .iter()
            .any(|binding| !nodes.contains_key(&binding.source_node))
        || resources
            .iter()
            .any(|binding| !nodes.contains_key(&binding.source_node))
    {
        return Err(TargetPresentationError::UnknownNode);
    }
    let mut resource_descriptors = BTreeMap::<u64, &[u8]>::new();
    let mut resource_nodes = BTreeSet::new();
    for binding in &resources {
        if !resource_nodes.insert((binding.source_node, binding.logical_resource)) {
            return Err(TargetPresentationError::Malformed);
        }
        match resource_descriptors.get(&binding.logical_resource) {
            Some(descriptor) if *descriptor != binding.descriptor.as_slice() => {
                return Err(TargetPresentationError::Malformed)
            }
            None => {
                resource_descriptors
                    .insert(binding.logical_resource, binding.descriptor.as_slice());
            }
            _ => {}
        }
    }
    validate_source_tree(root, &nodes)?;
    let mut source_paths = BTreeMap::new();
    let mut view = build_view(root, &nodes, 0, None, &mut Vec::new(), &mut source_paths)?;
    apply_style_references(&mut view, &decoded_styles, theme.as_ref())?;
    Ok(TargetPresentation {
        source_root: root,
        view,
        source_paths,
        events,
        refs,
        resources,
        styles,
        theme,
    })
}

fn apply_style_references(
    view: &mut ViewNode,
    styles: &BTreeMap<u64, (StyleProperties, StateStyles)>,
    theme: Option<&TargetThemeDefinition>,
) -> Result<(), TargetPresentationError> {
    let mut properties = StyleProperties::default();
    let mut states = StateStyles::default();
    let mut token_index = 0_u64;
    loop {
        let name = format!("themeToken.{token_index}");
        let Some(token) = view.props.remove(&name) else {
            break;
        };
        if token.is_empty() {
            return Err(TargetPresentationError::InvalidProperties);
        }
        let (token_properties, token_states) = theme
            .and_then(|theme| theme.tokens.get(&token))
            .ok_or(TargetPresentationError::InvalidProperties)?;
        properties.overlay(token_properties);
        overlay_states(&mut states, token_states);
        token_index = token_index
            .checked_add(1)
            .ok_or(TargetPresentationError::Capacity)?;
    }
    if view
        .props
        .keys()
        .any(|name| name.starts_with("themeToken."))
    {
        return Err(TargetPresentationError::InvalidProperties);
    }
    if let Some(style) = view.props.get("style") {
        let style = style
            .parse::<u64>()
            .ok()
            .filter(|style| *style != 0)
            .ok_or(TargetPresentationError::InvalidProperties)?;
        let (reusable_properties, reusable_states) = styles
            .get(&style)
            .ok_or(TargetPresentationError::InvalidProperties)?;
        properties.overlay(reusable_properties);
        overlay_states(&mut states, reusable_states);
    }
    if properties.direction.is_none() {
        properties.direction = theme.map(|theme| theme.environment.direction);
    }
    lower_style_properties(&mut view.props, &properties, "")?;
    lower_style_properties(&mut view.props, &states.hover, "hover-")?;
    lower_style_properties(&mut view.props, &states.focus, "focus-")?;
    lower_style_properties(&mut view.props, &states.pressed, "pressed-")?;
    lower_style_properties(&mut view.props, &states.disabled, "disabled-")?;
    if view.props.len() > MAX_PROPERTIES_PER_NODE {
        return Err(TargetPresentationError::Capacity);
    }
    for child in &mut view.children {
        apply_style_references(child, styles, theme)?;
    }
    Ok(())
}

fn overlay_states(base: &mut StateStyles, overlay: &StateStyles) {
    base.hover.overlay(&overlay.hover);
    base.focus.overlay(&overlay.focus);
    base.pressed.overlay(&overlay.pressed);
    base.disabled.overlay(&overlay.disabled);
}

fn decode_style_layout(
    bytes: &[u8],
    cursor: &mut usize,
) -> Result<Layout, TargetPresentationError> {
    let mode = take_u8(bytes, cursor)?;
    let align_items = decode_align(take_u8(bytes, cursor)?)?;
    let justify_content = decode_justify(take_u8(bytes, cursor)?)?;
    let align_self = match take_u8(bytes, cursor)? {
        0 => None,
        value => Some(decode_align(value)?),
    };
    let wrap = match take_u8(bytes, cursor)? {
        0 => false,
        1 => true,
        _ => return Err(TargetPresentationError::Malformed),
    };
    let overflow_x = decode_overflow(take_u8(bytes, cursor)?)?;
    let overflow_y = decode_overflow(take_u8(bytes, cursor)?)?;
    if take_u8(bytes, cursor)? != 0 {
        return Err(TargetPresentationError::Malformed);
    }
    let grid_columns = take_u16(bytes, cursor)?;
    if take_u16(bytes, cursor)? != 0 {
        return Err(TargetPresentationError::Malformed);
    }
    let mode = match mode {
        1 => LayoutMode::Block,
        2 => LayoutMode::Flex {
            axis: Axis::Horizontal,
            wrap,
        },
        3 => LayoutMode::Flex {
            axis: Axis::Vertical,
            wrap,
        },
        4 if grid_columns != 0 => LayoutMode::Grid {
            columns: grid_columns,
            dense: false,
        },
        5 => LayoutMode::Stack,
        6 => LayoutMode::Absolute,
        _ => return Err(TargetPresentationError::Malformed),
    };
    let width = decode_length(bytes, cursor)?;
    let height = decode_length(bytes, cursor)?;
    let min_width = decode_length(bytes, cursor)?;
    let min_height = decode_length(bytes, cursor)?;
    let max_width = decode_length(bytes, cursor)?;
    let max_height = decode_length(bytes, cursor)?;
    let margin = decode_edges(bytes, cursor)?;
    let padding = decode_edges(bytes, cursor)?;
    let inset = decode_edges(bytes, cursor)?;
    let gap = decode_length(bytes, cursor)?;
    let aspect_width = take_u32(bytes, cursor)?;
    let aspect_height = take_u32(bytes, cursor)?;
    let aspect_ratio = match (aspect_width, aspect_height) {
        (0, 0) => None,
        (width, height) if width != 0 && height != 0 => Some((width, height)),
        _ => return Err(TargetPresentationError::Malformed),
    };
    Ok(Layout {
        mode,
        width,
        height,
        min_width,
        min_height,
        max_width,
        max_height,
        margin,
        padding,
        gap,
        align_items,
        justify_content,
        align_self,
        aspect_ratio,
        overflow_x,
        overflow_y,
        inset,
    })
}

fn decode_style_visual(
    bytes: &[u8],
    cursor: &mut usize,
    layout: Option<Layout>,
) -> Result<StyleProperties, TargetPresentationError> {
    let foreground = optional_color(take_u32(bytes, cursor)?);
    let background = optional_color(take_u32(bytes, cursor)?);
    let border_color = optional_color(take_u32(bytes, cursor)?);
    let border_width = optional_nonnegative_i32(take_u32(bytes, cursor)?)?;
    let corner_radius = optional_nonnegative_i32(take_u32(bytes, cursor)?)?;
    let opacity_milli = match take_u16(bytes, cursor)? {
        0 => None,
        value @ 1..=1000 => Some(value),
        _ => return Err(TargetPresentationError::Malformed),
    };
    let cursor_value = take_u8(bytes, cursor)?;
    let direction_value = take_u8(bytes, cursor)?;
    let weight_value = take_u16(bytes, cursor)?;
    let family_len = usize::from(take_u16(bytes, cursor)?);
    let font_size = optional_positive_i32(take_u32(bytes, cursor)?)?;
    let line_height = optional_positive_i32(take_u32(bytes, cursor)?)?;
    let font_family = if family_len == 0 {
        None
    } else {
        Some(
            std::str::from_utf8(take_bytes(bytes, cursor, family_len)?)
                .map_err(|_| TargetPresentationError::InvalidUtf8)?
                .to_owned(),
        )
    };
    let cursor = match cursor_value {
        0 => None,
        1 => Some(Cursor::Default),
        2 => Some(Cursor::Pointer),
        3 => Some(Cursor::Text),
        4 => Some(Cursor::Move),
        5 => Some(Cursor::ResizeHorizontal),
        6 => Some(Cursor::ResizeVertical),
        7 => Some(Cursor::Hidden),
        _ => return Err(TargetPresentationError::Malformed),
    };
    let direction = match direction_value {
        0 => None,
        1 => Some(TextDirection::Locale),
        2 => Some(TextDirection::LeftToRight),
        3 => Some(TextDirection::RightToLeft),
        _ => return Err(TargetPresentationError::Malformed),
    };
    let font_weight = match weight_value {
        0 => None,
        300 => Some(FontWeight::Light),
        400 => Some(FontWeight::Normal),
        500 => Some(FontWeight::Medium),
        600 => Some(FontWeight::Semibold),
        700 => Some(FontWeight::Bold),
        _ => return Err(TargetPresentationError::Malformed),
    };
    Ok(StyleProperties {
        layout,
        foreground,
        background,
        border_color,
        border_width,
        corner_radius,
        opacity_milli,
        visibility: None,
        cursor,
        font_family,
        font_size,
        font_weight,
        line_height,
        direction,
    })
}

fn decode_length(bytes: &[u8], cursor: &mut usize) -> Result<Length, TargetPresentationError> {
    let unit = take_u8(bytes, cursor)?;
    if take_u8(bytes, cursor)? != 0 || take_u8(bytes, cursor)? != 0 || take_u8(bytes, cursor)? != 0
    {
        return Err(TargetPresentationError::Malformed);
    }
    let milli = take_u32(bytes, cursor)? as i32;
    Ok(match unit {
        1 => Length::Auto,
        2 => Length::Px(milli),
        3 => Length::Percent(milli),
        4 if (1..=i32::from(u16::MAX)).contains(&milli) => Length::Fraction(milli as u16),
        5 => Length::MinContent,
        6 => Length::MaxContent,
        7 => Length::FitContent(milli),
        _ => return Err(TargetPresentationError::Malformed),
    })
}

fn decode_edges(
    bytes: &[u8],
    cursor: &mut usize,
) -> Result<Edges<Length>, TargetPresentationError> {
    Ok(Edges {
        top: decode_length(bytes, cursor)?,
        right: decode_length(bytes, cursor)?,
        bottom: decode_length(bytes, cursor)?,
        left: decode_length(bytes, cursor)?,
    })
}

fn decode_align(value: u8) -> Result<Align, TargetPresentationError> {
    match value {
        1 => Ok(Align::Start),
        2 => Ok(Align::Center),
        3 => Ok(Align::End),
        4 => Ok(Align::Stretch),
        5 => Ok(Align::Baseline),
        _ => Err(TargetPresentationError::Malformed),
    }
}

fn decode_justify(value: u8) -> Result<Justify, TargetPresentationError> {
    match value {
        1 => Ok(Justify::Start),
        2 => Ok(Justify::Center),
        3 => Ok(Justify::End),
        6 => Ok(Justify::SpaceBetween),
        7 => Ok(Justify::SpaceAround),
        8 => Ok(Justify::SpaceEvenly),
        _ => Err(TargetPresentationError::Malformed),
    }
}

fn decode_overflow(value: u8) -> Result<Overflow, TargetPresentationError> {
    match value {
        1 => Ok(Overflow::Visible),
        2 => Ok(Overflow::Clip),
        3 => Ok(Overflow::Scroll),
        4 => Ok(Overflow::Auto),
        _ => Err(TargetPresentationError::Malformed),
    }
}

fn optional_color(value: u32) -> Option<Color> {
    (value != 0).then_some(Color(value))
}

fn optional_nonnegative_i32(value: u32) -> Result<Option<i32>, TargetPresentationError> {
    let value = value as i32;
    if value < 0 {
        return Err(TargetPresentationError::Malformed);
    }
    Ok((value != 0).then_some(value))
}

fn optional_positive_i32(value: u32) -> Result<Option<i32>, TargetPresentationError> {
    let value = value as i32;
    if value < 0 {
        return Err(TargetPresentationError::Malformed);
    }
    Ok((value != 0).then_some(value))
}

fn lower_style_properties(
    props: &mut BTreeMap<String, String>,
    style: &StyleProperties,
    state_prefix: &str,
) -> Result<(), TargetPresentationError> {
    let css_prefix = format!("style.{state_prefix}");
    if let Some(layout) = &style.layout {
        lower_layout(props, layout)?;
    }
    if let Some(color) = style.foreground {
        insert_prop(props, format!("{css_prefix}color"), css_color(color));
        insert_native_style_prop(props, state_prefix, "color_rgba", native_color(color));
    }
    if let Some(color) = style.background {
        insert_prop(
            props,
            format!("{css_prefix}background-color"),
            css_color(color),
        );
        insert_native_style_prop(props, state_prefix, "background_rgba", native_color(color));
    }
    if let Some(color) = style.border_color {
        insert_prop(props, format!("{css_prefix}border-color"), css_color(color));
        insert_native_style_prop(props, state_prefix, "border_rgba", native_color(color));
    }
    if let Some(value) = style.border_width {
        insert_prop(
            props,
            format!("{css_prefix}border-width"),
            css_milli_px(value),
        );
        insert_native_style_prop(props, state_prefix, "border_width_milli", value.to_string());
    }
    if let Some(value) = style.corner_radius {
        insert_prop(
            props,
            format!("{css_prefix}border-radius"),
            css_milli_px(value),
        );
    }
    if let Some(value) = style.opacity_milli {
        insert_prop(
            props,
            format!("{css_prefix}opacity"),
            decimal_milli(i32::from(value)),
        );
    }
    if let Some(value) = style.cursor {
        insert_prop(
            props,
            format!("{css_prefix}cursor"),
            cursor_name(value).to_owned(),
        );
    }
    if let Some(value) = &style.font_family {
        insert_prop(props, format!("{css_prefix}font-family"), value.clone());
        insert_native_style_prop(props, state_prefix, "font_family", value.clone());
    }
    if let Some(value) = style.font_size {
        insert_prop(props, format!("{css_prefix}font-size"), css_milli_px(value));
        insert_native_style_prop(props, state_prefix, "font_size_milli", value.to_string());
    }
    if let Some(value) = style.font_weight {
        let value = font_weight_value(value);
        insert_prop(props, format!("{css_prefix}font-weight"), value.to_string());
        insert_native_style_prop(props, state_prefix, "font_weight", value.to_string());
    }
    if let Some(value) = style.line_height {
        insert_prop(
            props,
            format!("{css_prefix}line-height"),
            css_milli_px(value),
        );
        insert_native_style_prop(props, state_prefix, "line_height_milli", value.to_string());
    }
    if let Some(value) = style.direction {
        let value = direction_name(value);
        insert_prop(props, format!("{css_prefix}direction"), value.to_owned());
        insert_native_style_prop(props, state_prefix, "direction", value);
    }
    Ok(())
}

fn insert_native_style_prop(
    props: &mut BTreeMap<String, String>,
    state_prefix: &str,
    name: &str,
    value: impl Into<String>,
) {
    if state_prefix.is_empty() {
        insert_prop(props, name, value);
    } else {
        insert_prop(
            props,
            format!("state.{}.{name}", state_prefix.trim_end_matches('-')),
            value,
        );
    }
}

fn lower_layout(
    props: &mut BTreeMap<String, String>,
    layout: &Layout,
) -> Result<(), TargetPresentationError> {
    match layout.mode {
        LayoutMode::Block => {
            insert_prop(props, "style.display", "block");
            insert_prop(props, "layout", "block");
        }
        LayoutMode::Flex { axis, wrap } => {
            insert_prop(props, "style.display", "flex");
            insert_prop(
                props,
                "style.flex-direction",
                if axis == Axis::Horizontal {
                    "row"
                } else {
                    "column"
                },
            );
            insert_prop(
                props,
                "style.flex-wrap",
                if wrap { "wrap" } else { "nowrap" },
            );
            insert_prop(
                props,
                "layout",
                if axis == Axis::Horizontal {
                    "row"
                } else {
                    "column"
                },
            );
        }
        LayoutMode::Grid { columns, dense } => {
            insert_prop(props, "style.display", "grid");
            insert_prop(
                props,
                "style.grid-template-columns",
                format!("repeat({columns}, minmax(0, 1fr))"),
            );
            if dense {
                insert_prop(props, "style.grid-auto-flow", "dense");
            }
            insert_prop(props, "layout", "grid");
            insert_prop(props, "columns", columns.to_string());
        }
        LayoutMode::Stack => {
            insert_prop(props, "style.display", "grid");
            insert_prop(props, "layout", "stack");
        }
        LayoutMode::Absolute => {
            insert_prop(props, "style.position", "absolute");
            insert_prop(props, "layout", "stack");
        }
    }
    lower_length(props, "width", "width_milli", layout.width);
    lower_length(props, "height", "height_milli", layout.height);
    lower_length(props, "min-width", "min_width_milli", layout.min_width);
    lower_length(props, "min-height", "min_height_milli", layout.min_height);
    lower_length(props, "max-width", "max_width_milli", layout.max_width);
    lower_length(props, "max-height", "max_height_milli", layout.max_height);
    lower_edges(props, "margin", "margin_milli", layout.margin);
    lower_edges(props, "padding", "padding_milli", layout.padding);
    lower_edges(props, "inset", "", layout.inset);
    lower_length(props, "gap", "gap_milli", layout.gap);
    insert_prop(props, "style.align-items", align_name(layout.align_items));
    insert_prop(
        props,
        "style.justify-content",
        justify_name(layout.justify_content),
    );
    if let Some(value) = layout.align_self {
        insert_prop(props, "style.align-self", align_name(value));
    }
    insert_prop(props, "style.overflow-x", overflow_name(layout.overflow_x));
    insert_prop(props, "style.overflow-y", overflow_name(layout.overflow_y));
    if layout.overflow_x == layout.overflow_y {
        insert_prop(props, "overflow", overflow_name(layout.overflow_x));
    }
    if let Some((width, height)) = layout.aspect_ratio {
        insert_prop(props, "style.aspect-ratio", format!("{width} / {height}"));
    }
    if props.len() > MAX_PROPERTIES_PER_NODE {
        return Err(TargetPresentationError::Capacity);
    }
    Ok(())
}

fn lower_length(
    props: &mut BTreeMap<String, String>,
    css_name: &str,
    native_name: &str,
    value: Length,
) {
    insert_prop(props, format!("style.{css_name}"), css_length(value));
    if !native_name.is_empty() {
        if let Length::Px(value) = value {
            insert_prop(props, native_name, value.to_string());
        }
    }
}

fn lower_edges(
    props: &mut BTreeMap<String, String>,
    css_name: &str,
    native_name: &str,
    edges: Edges<Length>,
) {
    for (name, value) in [
        ("top", edges.top),
        ("right", edges.right),
        ("bottom", edges.bottom),
        ("left", edges.left),
    ] {
        let property = if css_name == "inset" {
            name.to_owned()
        } else {
            format!("{css_name}-{name}")
        };
        insert_prop(props, format!("style.{property}"), css_length(value));
    }
    if !native_name.is_empty()
        && edges.top == edges.right
        && edges.top == edges.bottom
        && edges.top == edges.left
    {
        if let Length::Px(value) = edges.top {
            insert_prop(props, native_name, value.to_string());
        }
    }
}

fn insert_prop(
    props: &mut BTreeMap<String, String>,
    name: impl Into<String>,
    value: impl Into<String>,
) {
    props.entry(name.into()).or_insert_with(|| value.into());
}

fn css_length(value: Length) -> String {
    match value {
        Length::Auto => String::from("auto"),
        Length::Px(value) => css_milli_px(value),
        Length::Percent(value) => format!("{}%", decimal_milli(value)),
        Length::Fraction(value) => format!("{value}fr"),
        Length::MinContent => String::from("min-content"),
        Length::MaxContent => String::from("max-content"),
        Length::FitContent(value) => format!("fit-content({})", css_milli_px(value)),
    }
}

fn css_milli_px(value: i32) -> String {
    format!("{}px", decimal_milli(value))
}

fn decimal_milli(value: i32) -> String {
    let negative = value < 0;
    let magnitude = i64::from(value).abs();
    let whole = magnitude / 1000;
    let fraction = magnitude % 1000;
    if fraction == 0 {
        format!("{}{whole}", if negative { "-" } else { "" })
    } else {
        let fraction = format!("{fraction:03}").trim_end_matches('0').to_owned();
        format!("{}{whole}.{fraction}", if negative { "-" } else { "" })
    }
}

fn css_color(value: Color) -> String {
    format!("#{:08x}", value.0)
}

fn native_color(value: Color) -> String {
    format!("{:08x}", value.0)
}

fn align_name(value: Align) -> &'static str {
    match value {
        Align::Start => "start",
        Align::Center => "center",
        Align::End => "end",
        Align::Stretch => "stretch",
        Align::Baseline => "baseline",
    }
}

fn justify_name(value: Justify) -> &'static str {
    match value {
        Justify::Start => "start",
        Justify::Center => "center",
        Justify::End => "end",
        Justify::SpaceBetween => "space-between",
        Justify::SpaceAround => "space-around",
        Justify::SpaceEvenly => "space-evenly",
    }
}

fn overflow_name(value: Overflow) -> &'static str {
    match value {
        Overflow::Visible => "visible",
        Overflow::Clip => "clip",
        Overflow::Scroll => "scroll",
        Overflow::Auto => "auto",
    }
}

fn cursor_name(value: Cursor) -> &'static str {
    match value {
        Cursor::Default => "default",
        Cursor::Pointer => "pointer",
        Cursor::Text => "text",
        Cursor::Move => "move",
        Cursor::ResizeHorizontal => "ew-resize",
        Cursor::ResizeVertical => "ns-resize",
        Cursor::Hidden => "none",
    }
}

fn font_weight_value(value: FontWeight) -> u16 {
    match value {
        FontWeight::Light => 300,
        FontWeight::Normal => 400,
        FontWeight::Medium => 500,
        FontWeight::Semibold => 600,
        FontWeight::Bold => 700,
    }
}

fn direction_name(value: TextDirection) -> &'static str {
    match value {
        TextDirection::Locale => "auto",
        TextDirection::LeftToRight => "ltr",
        TextDirection::RightToLeft => "rtl",
    }
}

pub fn decode_target_presentations(
    bytes: &[u8],
) -> Result<Vec<TargetRootPresentation>, TargetPresentationError> {
    if !bytes.starts_with(ROOT_BATCH_MAGIC) {
        return decode_target_presentation(bytes).map(|presentation| {
            vec![TargetRootPresentation {
                logical_root: 1,
                presentation,
            }]
        });
    }
    if bytes.len() > MAX_PRESENTATION_BYTES {
        return Err(TargetPresentationError::Capacity);
    }
    let mut cursor = ROOT_BATCH_MAGIC.len();
    let count = usize::from(take_u16(bytes, &mut cursor)?);
    if count == 0 || take_u16(bytes, &mut cursor)? != 0 {
        return Err(TargetPresentationError::Malformed);
    }
    let mut roots = BTreeSet::new();
    let mut presentations = Vec::with_capacity(count);
    for _ in 0..count {
        let logical_root = take_u64(bytes, &mut cursor)?;
        let length = usize::try_from(take_u32(bytes, &mut cursor)?)
            .map_err(|_| TargetPresentationError::Capacity)?;
        if logical_root == 0 || !roots.insert(logical_root) {
            return Err(TargetPresentationError::DuplicateRoot);
        }
        let presentation = decode_target_presentation(take_bytes(bytes, &mut cursor, length)?)?;
        presentations.push(TargetRootPresentation {
            logical_root,
            presentation,
        });
    }
    if cursor != bytes.len() {
        return Err(TargetPresentationError::Malformed);
    }
    Ok(presentations)
}

pub fn append_target_binding_mutations(
    transaction: &mut Vec<u8>,
    bind_events: &[TargetWireEventBinding],
    unbind_events: &[EventToken],
    bind_refs: &[TargetWireRefBinding],
    unbind_refs: &[vogui_protocol::v2::Handle],
    attach_resources: &[TargetWireResourceBinding],
    detach_resources: &[(NodeId, vogui_protocol::v2::Handle)],
    max_bytes: usize,
) -> Result<(), TargetPresentationError> {
    if transaction.len() < TRANSACTION_PREFIX_BYTES {
        return Err(TargetPresentationError::Malformed);
    }
    let mutation_count = bind_events
        .len()
        .checked_add(unbind_events.len())
        .and_then(|count| count.checked_add(bind_refs.len()))
        .and_then(|count| count.checked_add(unbind_refs.len()))
        .and_then(|count| count.checked_add(attach_resources.len()))
        .and_then(|count| count.checked_add(detach_resources.len()))
        .ok_or(TargetPresentationError::Capacity)?;
    let current_count = u32::from_le_bytes(transaction[24..28].try_into().unwrap());
    let next_count = current_count
        .checked_add(u32::try_from(mutation_count).map_err(|_| TargetPresentationError::Capacity)?)
        .ok_or(TargetPresentationError::Capacity)?;
    let added_bytes = bind_events
        .len()
        .checked_mul(19)
        .and_then(|bytes| bytes.checked_add(unbind_events.len().checked_mul(9)?))
        .and_then(|bytes| bytes.checked_add(bind_refs.len().checked_mul(21)?))
        .and_then(|bytes| bytes.checked_add(unbind_refs.len().checked_mul(9)?))
        .and_then(|bytes| bytes.checked_add(attach_resources.len().checked_mul(25)?))
        .and_then(|bytes| bytes.checked_add(detach_resources.len().checked_mul(17)?))
        .ok_or(TargetPresentationError::Capacity)?;
    if transaction
        .len()
        .checked_add(added_bytes)
        .is_none_or(|bytes| bytes > max_bytes)
    {
        return Err(TargetPresentationError::Capacity);
    }
    transaction[24..28].copy_from_slice(&next_count.to_le_bytes());
    for binding in bind_events {
        let event_tag = event_kind_tag(binding.event_kind)?;
        transaction.push(6);
        put_handle(transaction, binding.node);
        transaction.push(event_tag);
        put_handle(transaction, binding.token);
        transaction.push(0);
    }
    for token in unbind_events {
        transaction.push(7);
        put_handle(transaction, *token);
    }
    for binding in bind_refs {
        transaction.push(8);
        put_handle(transaction, binding.node);
        put_handle(transaction, binding.reference);
        transaction.extend_from_slice(&binding.binding_generation.to_le_bytes());
    }
    for reference in unbind_refs {
        transaction.push(9);
        put_handle(transaction, *reference);
    }
    for binding in attach_resources {
        transaction.push(10);
        put_handle(transaction, binding.node);
        put_handle(transaction, binding.resource);
        transaction.extend_from_slice(&binding.source_revision.to_le_bytes());
    }
    for (node, resource) in detach_resources {
        transaction.push(11);
        put_handle(transaction, *node);
        put_handle(transaction, *resource);
    }
    Ok(())
}

fn event_kind_tag(kind: u64) -> Result<u8, TargetPresentationError> {
    u8::try_from(kind)
        .ok()
        .filter(|kind| (1..=28).contains(kind))
        .ok_or(TargetPresentationError::InvalidKind)
}

fn put_handle(bytes: &mut Vec<u8>, handle: vogui_protocol::v2::Handle) {
    bytes.extend_from_slice(&handle.index.to_le_bytes());
    bytes.extend_from_slice(&handle.generation.to_le_bytes());
}

fn validate_source_tree(
    root: u64,
    nodes: &BTreeMap<u64, SourceNode>,
) -> Result<(), TargetPresentationError> {
    fn visit(
        id: u64,
        nodes: &BTreeMap<u64, SourceNode>,
        active: &mut BTreeSet<u64>,
        visited: &mut BTreeSet<u64>,
        depth: usize,
    ) -> Result<(), TargetPresentationError> {
        if depth > MAX_DEPTH || visited.contains(&id) || !active.insert(id) {
            return Err(TargetPresentationError::InvalidTree);
        }
        let node = nodes.get(&id).ok_or(TargetPresentationError::UnknownNode)?;
        match &node.kind {
            SourceNodeKind::Element { children, .. } => {
                let mut unique = BTreeSet::new();
                for child in children {
                    if *child == 0 || !unique.insert(*child) {
                        return Err(TargetPresentationError::InvalidTree);
                    }
                    visit(*child, nodes, active, visited, depth + 1)?;
                }
            }
            SourceNodeKind::Scope { child, .. } => {
                visit(*child, nodes, active, visited, depth + 1)?;
            }
        }
        active.remove(&id);
        visited.insert(id);
        Ok(())
    }
    let mut active = BTreeSet::new();
    let mut visited = BTreeSet::new();
    visit(root, nodes, &mut active, &mut visited, 1)?;
    if visited.len() != nodes.len() {
        return Err(TargetPresentationError::InvalidTree);
    }
    Ok(())
}

fn build_view(
    id: u64,
    nodes: &BTreeMap<u64, SourceNode>,
    depth: usize,
    scope_key: Option<String>,
    path: &mut Vec<usize>,
    source_paths: &mut BTreeMap<u64, Vec<usize>>,
) -> Result<ViewNode, TargetPresentationError> {
    if depth > MAX_DEPTH {
        return Err(TargetPresentationError::Capacity);
    }
    let node = nodes.get(&id).ok_or(TargetPresentationError::UnknownNode)?;
    let source_key = decode_optional_key(&node.key)?;
    match &node.kind {
        SourceNodeKind::Scope { builder_id, child } => {
            source_paths.insert(id, path.clone());
            let local = source_key.unwrap_or_else(|| format!("builder-{builder_id}"));
            let qualified = match scope_key {
                Some(parent) => format!("{parent}/{local}"),
                None => format!("scope:{local}"),
            };
            build_view(
                *child,
                nodes,
                depth + 1,
                Some(qualified),
                path,
                source_paths,
            )
        }
        SourceNodeKind::Element {
            kind,
            properties,
            children,
        } => {
            source_paths.insert(id, path.clone());
            let mut props = decode_properties(properties)?;
            let key = match (scope_key, source_key) {
                (Some(scope), Some(local)) => Some(format!("{scope}/{local}")),
                (Some(scope), None) => Some(scope),
                (None, local) => local,
            };
            let kind = decode_view_kind(*kind, &mut props)?;
            let mut rendered_children = Vec::with_capacity(children.len());
            for (index, child) in children.iter().enumerate() {
                path.push(index);
                rendered_children.push(build_view(
                    *child,
                    nodes,
                    depth + 1,
                    None,
                    path,
                    source_paths,
                )?);
                path.pop();
            }
            Ok(ViewNode {
                key,
                kind,
                props,
                children: rendered_children,
            })
        }
    }
}

fn decode_view_kind(
    kind: u64,
    props: &mut BTreeMap<String, String>,
) -> Result<ViewKind, TargetPresentationError> {
    let semantic = match kind {
        1 => ViewKind::Text(props.remove("text").unwrap_or_default()),
        2 => ViewKind::Element(String::from("image")),
        3 => ViewKind::Element(String::from("button")),
        4 => {
            props
                .entry(String::from("type"))
                .or_insert_with(|| String::from("text"));
            ViewKind::Element(String::from("text-field"))
        }
        5 => {
            props
                .entry(String::from("type"))
                .or_insert_with(|| String::from("checkbox"));
            ViewKind::Element(String::from("toggle"))
        }
        6 => {
            props
                .entry(String::from("type"))
                .or_insert_with(|| String::from("range"));
            ViewKind::Element(String::from("slider"))
        }
        7 => ViewKind::Element(String::from("list")),
        8 => ViewKind::Element(String::from("grid")),
        9 => ViewKind::Element(String::from("rich-text")),
        10 => ViewKind::Element(String::from("icon")),
        11 => ViewKind::Element(String::from("link")),
        12 => {
            props
                .entry(String::from("type"))
                .or_insert_with(|| String::from("password"));
            ViewKind::Element(String::from("password-field"))
        }
        13 => ViewKind::Element(String::from("text-area")),
        14 => {
            props
                .entry(String::from("type"))
                .or_insert_with(|| String::from("checkbox"));
            ViewKind::Element(String::from("checkbox"))
        }
        15 => {
            props
                .entry(String::from("type"))
                .or_insert_with(|| String::from("checkbox"));
            ViewKind::Element(String::from("switch"))
        }
        16 => ViewKind::Element(String::from("radio-group")),
        17 => ViewKind::Element(String::from("select")),
        18 => ViewKind::Element(String::from("list-box")),
        19 => {
            props
                .entry(String::from("type"))
                .or_insert_with(|| String::from("text"));
            ViewKind::Element(String::from("combobox"))
        }
        20 => ViewKind::Element(String::from("form")),
        21 => ViewKind::Element(String::from("label")),
        22 => ViewKind::Element(String::from("help")),
        23 => ViewKind::Element(String::from("error")),
        24 => ViewKind::Element(String::from("progress")),
        25 => ViewKind::Element(String::from("spinner")),
        26 => ViewKind::Element(String::from("tabs")),
        27 => ViewKind::Element(String::from("disclosure")),
        28 => ViewKind::Element(String::from("accordion")),
        29 => ViewKind::Element(String::from("dialog")),
        30 => ViewKind::Element(String::from("drawer")),
        31 => ViewKind::Element(String::from("tooltip")),
        32 => ViewKind::Element(String::from("popover")),
        33 => ViewKind::Element(String::from("menu")),
        34 => ViewKind::Element(String::from("context-menu")),
        35 => ViewKind::Element(String::from("table")),
        36 => ViewKind::Element(String::from("tree")),
        37 => ViewKind::Element(String::from("scroll-view")),
        38 => ViewKind::Element(String::from("virtual-collection")),
        39 => ViewKind::Element(String::from("portal")),
        40 => ViewKind::Element(String::from("overlay")),
        41 => ViewKind::Element(String::from("toast")),
        42 => ViewKind::Element(String::from("focus-scope")),
        43 => ViewKind::Element(String::from("live-region")),
        _ => return Err(TargetPresentationError::InvalidKind),
    };
    if let ViewKind::Element(name) = &semantic {
        decorate_control_semantics(name, props);
    }
    Ok(semantic)
}

fn decorate_control_semantics(kind: &str, props: &mut BTreeMap<String, String>) {
    let role = match kind {
        "image" => "img",
        "button" | "disclosure" => "button",
        "link" => "link",
        "toggle" | "checkbox" => "checkbox",
        "switch" => "switch",
        "slider" => "slider",
        "list" | "virtual-collection" => "list",
        "grid" => "grid",
        "radio-group" => "radiogroup",
        "list-box" => "listbox",
        "combobox" => "combobox",
        "form" => "form",
        "progress" | "spinner" => "progressbar",
        "tabs" => "tablist",
        "dialog" | "drawer" => "dialog",
        "tooltip" => "tooltip",
        "menu" | "context-menu" => "menu",
        "table" => "table",
        "tree" => "tree",
        "toast" | "live-region" => "status",
        _ => "",
    };
    if !role.is_empty() {
        let current_role = props.entry(String::from("role")).or_default();
        if current_role.is_empty() {
            *current_role = role.to_owned();
        }
    }
    let fallback_name = match kind {
        "image" => props.get("alt"),
        _ => props.get("label"),
    }
    .filter(|value| !value.is_empty())
    .cloned();
    if let Some(fallback_name) = fallback_name {
        let accessible_name = props.entry(String::from("accessibleName")).or_default();
        if accessible_name.is_empty() {
            *accessible_name = fallback_name;
        }
    }
    for (source, target) in [
        ("checked", "aria.checked"),
        ("expanded", "aria.expanded"),
        ("required", "aria.required"),
        ("disabled", "aria.disabled"),
    ] {
        if let Some(value) = props.get(source).cloned() {
            props.entry(String::from(target)).or_insert(value);
        }
    }
    if kind == "link" {
        if let Some(url) = props
            .get("externalUrl")
            .filter(|url| !url.is_empty())
            .cloned()
        {
            props.entry(String::from("href")).or_insert(url);
        }
    }
    if matches!(kind, "dialog" | "drawer") {
        if let Some(modal) = props.get("modal").cloned() {
            props.entry(String::from("aria.modal")).or_insert(modal);
        }
    }
    if kind == "slider" {
        for (source, target) in [
            ("valueMilli", "rangeValue"),
            ("minimumMilli", "min"),
            ("maximumMilli", "max"),
            ("stepMilli", "step"),
        ] {
            if let Some(value) = props.get(source).cloned() {
                props.entry(String::from(target)).or_insert(value);
            }
        }
    }
    if kind == "progress"
        && props
            .get("indeterminate")
            .is_none_or(|value| value != "true")
    {
        if let Some(value) = props.get("valueMilli").cloned() {
            props.entry(String::from("progressValue")).or_insert(value);
        }
        if let Some(value) = props.get("maximumMilli").cloned() {
            props.entry(String::from("progressMax")).or_insert(value);
        }
    }
}

fn decode_optional_key(bytes: &[u8]) -> Result<Option<String>, TargetPresentationError> {
    if bytes.is_empty() {
        return Ok(None);
    }
    let key = std::str::from_utf8(bytes).map_err(|_| TargetPresentationError::InvalidUtf8)?;
    Ok(Some(key.to_owned()))
}

fn decode_properties(bytes: &[u8]) -> Result<BTreeMap<String, String>, TargetPresentationError> {
    if bytes.is_empty() {
        return Ok(BTreeMap::new());
    }
    if bytes.len() < 8 || &bytes[..4] != PROPERTY_MAGIC {
        return Err(TargetPresentationError::InvalidProperties);
    }
    let mut cursor = 4_usize;
    let count = usize::try_from(take_u32(bytes, &mut cursor)?)
        .map_err(|_| TargetPresentationError::Capacity)?;
    if count > MAX_PROPERTIES_PER_NODE {
        return Err(TargetPresentationError::Capacity);
    }
    let mut properties = BTreeMap::new();
    for _ in 0..count {
        let name_len = usize::from(take_u16(bytes, &mut cursor)?);
        let value_len = usize::try_from(take_u32(bytes, &mut cursor)?)
            .map_err(|_| TargetPresentationError::Capacity)?;
        if name_len == 0 || name_len > MAX_KEY_BYTES || value_len > MAX_PROPERTY_BYTES {
            return Err(TargetPresentationError::InvalidProperties);
        }
        let name = std::str::from_utf8(take_bytes(bytes, &mut cursor, name_len)?)
            .map_err(|_| TargetPresentationError::InvalidUtf8)?
            .to_owned();
        let value = std::str::from_utf8(take_bytes(bytes, &mut cursor, value_len)?)
            .map_err(|_| TargetPresentationError::InvalidUtf8)?
            .to_owned();
        if properties.insert(name, value).is_some() {
            return Err(TargetPresentationError::InvalidProperties);
        }
    }
    if cursor != bytes.len() {
        return Err(TargetPresentationError::InvalidProperties);
    }
    Ok(properties)
}

fn take_u8(bytes: &[u8], cursor: &mut usize) -> Result<u8, TargetPresentationError> {
    Ok(take_bytes(bytes, cursor, 1)?[0])
}

fn take_u16(bytes: &[u8], cursor: &mut usize) -> Result<u16, TargetPresentationError> {
    let raw = take_bytes(bytes, cursor, 2)?;
    Ok(u16::from_le_bytes([raw[0], raw[1]]))
}

fn take_u32(bytes: &[u8], cursor: &mut usize) -> Result<u32, TargetPresentationError> {
    let raw = take_bytes(bytes, cursor, 4)?;
    Ok(u32::from_le_bytes(raw.try_into().unwrap()))
}

fn take_u64(bytes: &[u8], cursor: &mut usize) -> Result<u64, TargetPresentationError> {
    let raw = take_bytes(bytes, cursor, 8)?;
    Ok(u64::from_le_bytes(raw.try_into().unwrap()))
}

fn take_bytes<'a>(
    bytes: &'a [u8],
    cursor: &mut usize,
    len: usize,
) -> Result<&'a [u8], TargetPresentationError> {
    let end = cursor
        .checked_add(len)
        .filter(|end| *end <= bytes.len())
        .ok_or(TargetPresentationError::Malformed)?;
    let result = &bytes[*cursor..end];
    *cursor = end;
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn style_descriptor() -> Vec<u8> {
        let mut bytes = Vec::from(b"VGY1".as_slice());
        bytes.extend_from_slice(&[3, 4, 1, 0, 0, 1, 1, 0]);
        bytes.extend_from_slice(&0_u16.to_le_bytes());
        bytes.extend_from_slice(&0_u16.to_le_bytes());
        append_test_length(&mut bytes, 2, 120_000);
        append_test_length(&mut bytes, 1, 0);
        append_test_length(&mut bytes, 1, 0);
        append_test_length(&mut bytes, 1, 0);
        append_test_length(&mut bytes, 1, 0);
        append_test_length(&mut bytes, 1, 0);
        for _ in 0..12 {
            append_test_length(&mut bytes, 2, 0);
        }
        append_test_length(&mut bytes, 2, 4_000);
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        append_test_visual(
            &mut bytes,
            0x1122_33ff,
            0x4455_66ff,
            900,
            2,
            2,
            600,
            "Inter",
            16_000,
            20_000,
        );
        append_test_visual(&mut bytes, 0, 0x7788_99ff, 0, 0, 0, 0, "", 0, 0);
        for _ in 0..3 {
            append_test_visual(&mut bytes, 0, 0, 0, 0, 0, 0, "", 0, 0);
        }
        bytes
    }

    fn append_test_length(bytes: &mut Vec<u8>, unit: u8, milli: i32) {
        bytes.extend_from_slice(&[unit, 0, 0, 0]);
        bytes.extend_from_slice(&(milli as u32).to_le_bytes());
    }

    #[allow(clippy::too_many_arguments)]
    fn append_test_visual(
        bytes: &mut Vec<u8>,
        foreground: u32,
        background: u32,
        opacity: u16,
        cursor: u8,
        direction: u8,
        weight: u16,
        family: &str,
        font_size: i32,
        line_height: i32,
    ) {
        bytes.extend_from_slice(&foreground.to_le_bytes());
        bytes.extend_from_slice(&background.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&opacity.to_le_bytes());
        bytes.extend_from_slice(&[cursor, direction]);
        bytes.extend_from_slice(&weight.to_le_bytes());
        bytes.extend_from_slice(&(family.len() as u16).to_le_bytes());
        bytes.extend_from_slice(&(font_size as u32).to_le_bytes());
        bytes.extend_from_slice(&(line_height as u32).to_le_bytes());
        bytes.extend_from_slice(family.as_bytes());
    }

    fn styled_root(logical_style: u64) -> Vec<u8> {
        let descriptor = style_descriptor();
        let mut properties = Vec::from(PROPERTY_MAGIC.as_slice());
        properties.extend_from_slice(&1_u32.to_le_bytes());
        properties.extend_from_slice(&5_u16.to_le_bytes());
        properties.extend_from_slice(&1_u32.to_le_bytes());
        properties.extend_from_slice(b"style");
        properties.extend_from_slice(logical_style.to_string().as_bytes());

        let mut bytes = vec![7];
        bytes.extend_from_slice(&1_u64.to_le_bytes());
        bytes.extend_from_slice(&(descriptor.len() as u32).to_le_bytes());
        bytes.extend_from_slice(&descriptor);
        bytes.push(1);
        bytes.extend_from_slice(&1_u64.to_le_bytes());
        bytes.extend_from_slice(&8_u64.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&(properties.len() as u32).to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&properties);
        bytes.push(5);
        bytes.extend_from_slice(&1_u64.to_le_bytes());
        bytes
    }

    fn theme_descriptor(token_name: &str, token_style: &[u8]) -> Vec<u8> {
        let mut bytes = Vec::from(b"VGT1".as_slice());
        bytes.extend_from_slice(&7_u64.to_le_bytes());
        bytes.extend_from_slice(&[2, 2, 2, 1]);
        bytes.extend_from_slice(&1100_u16.to_le_bytes());
        bytes.extend_from_slice(&[2, 0]);
        bytes.extend_from_slice(&5_u16.to_le_bytes());
        bytes.extend_from_slice(&1_u16.to_le_bytes());
        bytes.extend_from_slice(b"zh-CN");
        bytes.extend_from_slice(&(token_name.len() as u16).to_le_bytes());
        bytes.extend_from_slice(&(token_style.len() as u32).to_le_bytes());
        bytes.extend_from_slice(token_name.as_bytes());
        bytes.extend_from_slice(token_style);
        bytes
    }

    fn themed_root(token_name: &str) -> Vec<u8> {
        let style = style_descriptor();
        let theme = theme_descriptor("control.primary", &style);
        let mut properties = Vec::from(PROPERTY_MAGIC.as_slice());
        properties.extend_from_slice(&2_u32.to_le_bytes());
        properties.extend_from_slice(&12_u16.to_le_bytes());
        properties.extend_from_slice(&(token_name.len() as u32).to_le_bytes());
        properties.extend_from_slice(b"themeToken.0");
        properties.extend_from_slice(token_name.as_bytes());
        properties.extend_from_slice(&22_u16.to_le_bytes());
        properties.extend_from_slice(&9_u32.to_le_bytes());
        properties.extend_from_slice(b"style.background-color");
        properties.extend_from_slice(b"#010203ff");

        let mut bytes = vec![8];
        bytes.extend_from_slice(&(theme.len() as u32).to_le_bytes());
        bytes.extend_from_slice(&theme);
        bytes.push(1);
        bytes.extend_from_slice(&1_u64.to_le_bytes());
        bytes.extend_from_slice(&8_u64.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&(properties.len() as u32).to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&properties);
        bytes.push(5);
        bytes.extend_from_slice(&1_u64.to_le_bytes());
        bytes
    }

    fn root_with_kind(kind: u64) -> Vec<u8> {
        let mut bytes = vec![1];
        bytes.extend_from_slice(&1_u64.to_le_bytes());
        bytes.extend_from_slice(&kind.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.push(5);
        bytes.extend_from_slice(&1_u64.to_le_bytes());
        bytes
    }

    #[test]
    fn style_definitions_are_bounded_and_referenced_by_logical_identity() {
        let decoded = decode_target_presentation(&styled_root(1)).unwrap();
        assert_eq!(
            decoded.styles,
            vec![TargetStyleDefinition {
                logical_style: 1,
                descriptor: style_descriptor(),
            }]
        );
        assert_eq!(
            decoded.view.props.get("style").map(String::as_str),
            Some("1")
        );
        assert_eq!(
            decoded.view.props.get("style.background-color"),
            Some(&String::from("#445566ff"))
        );
        assert_eq!(
            decoded.view.props.get("background_rgba"),
            Some(&String::from("445566ff"))
        );
        assert_eq!(
            decoded.view.props.get("font_family"),
            Some(&String::from("Inter"))
        );
        assert_eq!(
            decoded.view.props.get("layout"),
            Some(&String::from("column"))
        );
        assert_eq!(
            decoded.view.props.get("state.hover.background_rgba"),
            Some(&String::from("778899ff"))
        );

        assert_eq!(
            decode_target_presentation(&styled_root(2)),
            Err(TargetPresentationError::InvalidProperties)
        );
    }

    #[test]
    fn duplicate_or_untyped_style_definitions_are_rejected() {
        let mut duplicate = styled_root(1);
        let definition_len = 13 + style_descriptor().len();
        let definition = duplicate[..definition_len].to_vec();
        duplicate.splice(definition_len..definition_len, definition);
        assert_eq!(
            decode_target_presentation(&duplicate),
            Err(TargetPresentationError::Malformed)
        );

        let mut invalid_magic = styled_root(1);
        invalid_magic[13..17].copy_from_slice(b"BAD!");
        assert_eq!(
            decode_target_presentation(&invalid_magic),
            Err(TargetPresentationError::Malformed)
        );
    }

    #[test]
    fn theme_tokens_lower_before_inline_properties_and_keep_state_styles() {
        let decoded = decode_target_presentation(&themed_root("control.primary")).unwrap();
        let theme = decoded.theme.as_ref().unwrap();
        assert_eq!(theme.revision, 7);
        assert_eq!(theme.environment.mode, ThemeMode::Dark);
        assert_eq!(theme.environment.locale, "zh-CN");
        assert_eq!(
            decoded.view.props.get("style.background-color"),
            Some(&String::from("#010203ff"))
        );
        assert_eq!(
            decoded.view.props.get("background_rgba"),
            Some(&String::from("445566ff"))
        );
        assert_eq!(
            decoded.view.props.get("state.hover.background_rgba"),
            Some(&String::from("778899ff"))
        );
        assert!(!decoded
            .view
            .props
            .keys()
            .any(|name| name.starts_with("themeToken.")));
        assert_eq!(
            decode_target_presentation(&themed_root("missing")),
            Err(TargetPresentationError::InvalidProperties)
        );
    }

    #[test]
    fn every_portable_control_kind_reaches_the_retained_tree() {
        let expected = [
            None,
            Some("image"),
            Some("button"),
            Some("text-field"),
            Some("toggle"),
            Some("slider"),
            Some("list"),
            Some("grid"),
            Some("rich-text"),
            Some("icon"),
            Some("link"),
            Some("password-field"),
            Some("text-area"),
            Some("checkbox"),
            Some("switch"),
            Some("radio-group"),
            Some("select"),
            Some("list-box"),
            Some("combobox"),
            Some("form"),
            Some("label"),
            Some("help"),
            Some("error"),
            Some("progress"),
            Some("spinner"),
            Some("tabs"),
            Some("disclosure"),
            Some("accordion"),
            Some("dialog"),
            Some("drawer"),
            Some("tooltip"),
            Some("popover"),
            Some("menu"),
            Some("context-menu"),
            Some("table"),
            Some("tree"),
            Some("scroll-view"),
            Some("virtual-collection"),
            Some("portal"),
            Some("overlay"),
            Some("toast"),
            Some("focus-scope"),
            Some("live-region"),
        ];
        for (offset, expected) in expected.into_iter().enumerate() {
            let decoded = decode_target_presentation(&root_with_kind(offset as u64 + 1)).unwrap();
            match (&decoded.view.kind, expected) {
                (ViewKind::Text(_), None) => {}
                (ViewKind::Element(actual), Some(expected)) => assert_eq!(actual, expected),
                pair => panic!("unexpected portable control mapping: {pair:?}"),
            }
        }
        assert_eq!(
            decode_target_presentation(&root_with_kind(44)),
            Err(TargetPresentationError::InvalidKind)
        );
    }
}
