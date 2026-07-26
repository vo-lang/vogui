use std::collections::{BTreeMap, BTreeSet};

#[inline(never)]
pub fn vogui_profile_link_anchor() -> usize {
    module_path!().as_ptr() as usize
}

use vogui_protocol::v2::NodeId;
use vogui_runtime::{
    renderer::{RendererTreeNode, RendererTreeSnapshot},
    tree::ViewKind,
};

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct Size {
    pub width_milli: i32,
    pub height_milli: i32,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct Rect {
    pub x_milli: i32,
    pub y_milli: i32,
    pub width_milli: i32,
    pub height_milli: i32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct LayoutConfig {
    pub max_nodes: usize,
    pub max_depth: usize,
    pub max_extent_milli: i32,
}

impl Default for LayoutConfig {
    fn default() -> Self {
        Self {
            max_nodes: 100_000,
            max_depth: 256,
            max_extent_milli: 100_000_000,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LayoutError {
    InvalidConfig,
    NodeCapacity,
    MissingRoot,
    MissingNode,
    InvalidTree,
    DepthCapacity,
    InvalidProperty,
    ExtentCapacity,
    IntrinsicMeasure,
}

pub trait IntrinsicMeasurer {
    fn measure_text(
        &mut self,
        node: NodeId,
        text: &str,
        max_width_milli: i32,
    ) -> Result<Size, LayoutError>;

    fn measure_image(
        &mut self,
        node: NodeId,
        source: &str,
        max_width_milli: i32,
        max_height_milli: i32,
    ) -> Result<Size, LayoutError>;
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LayoutSnapshot {
    pub tree_revision: u64,
    pub root: NodeId,
    pub boxes: BTreeMap<NodeId, Rect>,
    pub recomputed_formatting_roots: Vec<NodeId>,
}

pub struct LayoutEngine {
    config: LayoutConfig,
    previous_nodes: BTreeMap<NodeId, RendererTreeNode>,
    boxes: BTreeMap<NodeId, Rect>,
    revision: u64,
}

impl LayoutEngine {
    pub fn new(config: LayoutConfig) -> Result<Self, LayoutError> {
        if config.max_nodes == 0 || config.max_depth == 0 || config.max_extent_milli <= 0 {
            return Err(LayoutError::InvalidConfig);
        }
        Ok(Self {
            config,
            previous_nodes: BTreeMap::new(),
            boxes: BTreeMap::new(),
            revision: 0,
        })
    }

    pub fn apply<M: IntrinsicMeasurer>(
        &mut self,
        tree: &RendererTreeSnapshot,
        viewport: Size,
        measurer: &mut M,
    ) -> Result<LayoutSnapshot, LayoutError> {
        if tree.nodes.len() > self.config.max_nodes {
            return Err(LayoutError::NodeCapacity);
        }
        if viewport.width_milli < 0
            || viewport.height_milli < 0
            || viewport.width_milli > self.config.max_extent_milli
            || viewport.height_milli > self.config.max_extent_milli
        {
            return Err(LayoutError::ExtentCapacity);
        }
        let nodes: BTreeMap<_, _> = tree
            .nodes
            .iter()
            .cloned()
            .map(|node| (node.node, node))
            .collect();
        validate_tree(tree.tree_root, &nodes, self.config.max_depth)?;
        let dirty = dirty_nodes(&self.previous_nodes, &nodes);
        let formatting_roots = normalize_formatting_roots(tree.tree_root, &nodes, &dirty)?;
        let mut staged_boxes = self.boxes.clone();
        if self.revision == 0 || formatting_roots.contains(&tree.tree_root) {
            staged_boxes.clear();
            layout_subtree(
                tree.tree_root,
                &nodes,
                Rect {
                    x_milli: 0,
                    y_milli: 0,
                    width_milli: viewport.width_milli,
                    height_milli: viewport.height_milli,
                },
                0,
                self.config,
                measurer,
                &mut staged_boxes,
            )?;
        } else {
            for root in &formatting_roots {
                let parent_box = nodes
                    .get(root)
                    .and_then(|node| node.parent)
                    .and_then(|parent| staged_boxes.get(&parent).copied())
                    .ok_or(LayoutError::MissingNode)?;
                remove_subtree_boxes(*root, &nodes, &mut staged_boxes)?;
                layout_subtree(
                    *root,
                    &nodes,
                    parent_box,
                    0,
                    self.config,
                    measurer,
                    &mut staged_boxes,
                )?;
            }
        }
        if staged_boxes.len() != nodes.len() {
            return Err(LayoutError::InvalidTree);
        }
        self.previous_nodes = nodes;
        self.boxes = staged_boxes;
        self.revision = tree.revision;
        Ok(LayoutSnapshot {
            tree_revision: tree.revision,
            root: tree.tree_root,
            boxes: self.boxes.clone(),
            recomputed_formatting_roots: formatting_roots.into_iter().collect(),
        })
    }
}

fn validate_tree(
    root: NodeId,
    nodes: &BTreeMap<NodeId, RendererTreeNode>,
    max_depth: usize,
) -> Result<(), LayoutError> {
    let root_node = nodes.get(&root).ok_or(LayoutError::MissingRoot)?;
    if root_node.parent.is_some() {
        return Err(LayoutError::InvalidTree);
    }
    let mut seen = BTreeSet::new();
    let mut pending = vec![(root, 1usize)];
    while let Some((node, depth)) = pending.pop() {
        if depth > max_depth {
            return Err(LayoutError::DepthCapacity);
        }
        if !seen.insert(node) {
            return Err(LayoutError::InvalidTree);
        }
        let current = nodes.get(&node).ok_or(LayoutError::MissingNode)?;
        for child in current.children.iter().rev() {
            if nodes.get(child).and_then(|child| child.parent) != Some(node) {
                return Err(LayoutError::InvalidTree);
            }
            pending.push((*child, depth + 1));
        }
    }
    if seen.len() != nodes.len() {
        return Err(LayoutError::InvalidTree);
    }
    Ok(())
}

fn dirty_nodes(
    previous: &BTreeMap<NodeId, RendererTreeNode>,
    current: &BTreeMap<NodeId, RendererTreeNode>,
) -> BTreeSet<NodeId> {
    let mut dirty = BTreeSet::new();
    for (id, node) in current {
        if previous.get(id) != Some(node) {
            dirty.insert(*id);
        }
    }
    for id in previous.keys() {
        if !current.contains_key(id) {
            if let Some(parent) = previous.get(id).and_then(|node| node.parent) {
                dirty.insert(parent);
            }
        }
    }
    dirty
}

fn normalize_formatting_roots(
    tree_root: NodeId,
    nodes: &BTreeMap<NodeId, RendererTreeNode>,
    dirty: &BTreeSet<NodeId>,
) -> Result<BTreeSet<NodeId>, LayoutError> {
    let mut roots = BTreeSet::new();
    for dirty_node in dirty {
        let mut cursor = *dirty_node;
        loop {
            let node = nodes.get(&cursor).ok_or(LayoutError::MissingNode)?;
            if cursor == tree_root
                || node
                    .props
                    .get("formatting_root")
                    .is_some_and(|value| value == "true")
            {
                roots.insert(cursor);
                break;
            }
            cursor = node.parent.ok_or(LayoutError::InvalidTree)?;
        }
    }
    let roots_snapshot = roots.clone();
    roots.retain(|candidate| {
        !roots_snapshot
            .iter()
            .any(|ancestor| ancestor != candidate && is_ancestor(*ancestor, *candidate, nodes))
    });
    Ok(roots)
}

fn is_ancestor(
    ancestor: NodeId,
    mut node: NodeId,
    nodes: &BTreeMap<NodeId, RendererTreeNode>,
) -> bool {
    while let Some(parent) = nodes.get(&node).and_then(|node| node.parent) {
        if parent == ancestor {
            return true;
        }
        node = parent;
    }
    false
}

#[allow(clippy::too_many_arguments)]
fn layout_subtree<M: IntrinsicMeasurer>(
    node_id: NodeId,
    nodes: &BTreeMap<NodeId, RendererTreeNode>,
    containing: Rect,
    depth: usize,
    config: LayoutConfig,
    measurer: &mut M,
    boxes: &mut BTreeMap<NodeId, Rect>,
) -> Result<Size, LayoutError> {
    if depth >= config.max_depth {
        return Err(LayoutError::DepthCapacity);
    }
    let node = nodes.get(&node_id).ok_or(LayoutError::MissingNode)?;
    let margin = property_i32(node, "margin_milli", 0, config.max_extent_milli)?;
    let padding = property_i32(node, "padding_milli", 0, config.max_extent_milli)?;
    let gap = property_i32(node, "gap_milli", 0, config.max_extent_milli)?;
    let requested_width = optional_property_i32(node, "width_milli", config.max_extent_milli)?;
    let requested_height = optional_property_i32(node, "height_milli", config.max_extent_milli)?;
    let minimum_width = property_i32(node, "min_width_milli", 0, config.max_extent_milli)?;
    let minimum_height = property_i32(node, "min_height_milli", 0, config.max_extent_milli)?;
    let maximum_width = property_i32(
        node,
        "max_width_milli",
        config.max_extent_milli,
        config.max_extent_milli,
    )?;
    let maximum_height = property_i32(
        node,
        "max_height_milli",
        config.max_extent_milli,
        config.max_extent_milli,
    )?;
    if minimum_width > maximum_width || minimum_height > maximum_height {
        return Err(LayoutError::InvalidProperty);
    }
    let available_width = containing
        .width_milli
        .saturating_sub(margin.saturating_mul(2));
    let content_width = requested_width
        .unwrap_or(available_width)
        .clamp(minimum_width, maximum_width);
    let content_origin_x = containing.x_milli.saturating_add(margin + padding);
    let content_origin_y = containing.y_milli.saturating_add(margin + padding);
    let inner_width = content_width.saturating_sub(padding.saturating_mul(2));
    let mut intrinsic = match &node.kind {
        ViewKind::Text(text) => measurer.measure_text(node_id, text, content_width)?,
        ViewKind::Element(kind) if kind == "image" => measurer.measure_image(
            node_id,
            node.props.get("source").map_or("", String::as_str),
            content_width,
            requested_height.unwrap_or(config.max_extent_milli),
        )?,
        ViewKind::Element(_) => Size::default(),
    };
    let layout_mode = node.props.get("layout").map_or("column", String::as_str);
    let children_size = match layout_mode {
        "row" => layout_row(
            node,
            nodes,
            Rect {
                x_milli: content_origin_x,
                y_milli: content_origin_y,
                width_milli: inner_width,
                height_milli: containing.height_milli,
            },
            gap,
            depth,
            config,
            measurer,
            boxes,
        )?,
        "grid" => layout_grid(
            node,
            nodes,
            Rect {
                x_milli: content_origin_x,
                y_milli: content_origin_y,
                width_milli: inner_width,
                height_milli: containing.height_milli,
            },
            gap,
            depth,
            config,
            measurer,
            boxes,
        )?,
        "stack" => layout_stack(
            node,
            nodes,
            Rect {
                x_milli: content_origin_x,
                y_milli: content_origin_y,
                width_milli: inner_width,
                height_milli: containing.height_milli,
            },
            depth,
            config,
            measurer,
            boxes,
        )?,
        "block" | "column" => layout_column(
            node,
            nodes,
            Rect {
                x_milli: content_origin_x,
                y_milli: content_origin_y,
                width_milli: inner_width,
                height_milli: containing.height_milli,
            },
            gap,
            depth,
            config,
            measurer,
            boxes,
        )?,
        _ => return Err(LayoutError::InvalidProperty),
    };
    intrinsic.width_milli = intrinsic.width_milli.max(children_size.width_milli);
    intrinsic.height_milli = intrinsic.height_milli.max(children_size.height_milli);
    let mut width = requested_width
        .unwrap_or(
            intrinsic
                .width_milli
                .saturating_add(padding * 2)
                .max(content_width),
        )
        .clamp(minimum_width, maximum_width);
    let mut height = requested_height
        .unwrap_or(intrinsic.height_milli.saturating_add(padding * 2))
        .clamp(minimum_height, maximum_height);
    if let Some(aspect_milli) =
        optional_property_i32(node, "aspect_ratio_milli", config.max_extent_milli)?
    {
        if aspect_milli == 0 {
            return Err(LayoutError::InvalidProperty);
        }
        match (requested_width, requested_height) {
            (Some(_), None) => {
                height = ((i64::from(width) * 1000) / i64::from(aspect_milli))
                    .try_into()
                    .map_err(|_| LayoutError::ExtentCapacity)?;
            }
            (None, Some(_)) => {
                width = ((i64::from(height) * i64::from(aspect_milli)) / 1000)
                    .try_into()
                    .map_err(|_| LayoutError::ExtentCapacity)?;
            }
            _ => {}
        }
        width = width.clamp(minimum_width, maximum_width);
        height = height.clamp(minimum_height, maximum_height);
    }
    let offset_x = signed_property_i32(node, "left_milli", 0, config.max_extent_milli)?;
    let offset_y = signed_property_i32(node, "top_milli", 0, config.max_extent_milli)?;
    boxes.insert(
        node_id,
        Rect {
            x_milli: containing
                .x_milli
                .saturating_add(margin)
                .saturating_add(offset_x),
            y_milli: containing
                .y_milli
                .saturating_add(margin)
                .saturating_add(offset_y),
            width_milli: width,
            height_milli: height,
        },
    );
    Ok(Size {
        width_milli: width.saturating_add(margin * 2),
        height_milli: height.saturating_add(margin * 2),
    })
}

#[allow(clippy::too_many_arguments)]
fn layout_column<M: IntrinsicMeasurer>(
    node: &RendererTreeNode,
    nodes: &BTreeMap<NodeId, RendererTreeNode>,
    containing: Rect,
    gap: i32,
    depth: usize,
    config: LayoutConfig,
    measurer: &mut M,
    boxes: &mut BTreeMap<NodeId, Rect>,
) -> Result<Size, LayoutError> {
    let mut cursor_y = containing.y_milli;
    let mut size = Size::default();
    for child in &node.children {
        let child_size = layout_subtree(
            *child,
            nodes,
            Rect {
                x_milli: containing.x_milli,
                y_milli: cursor_y,
                width_milli: containing.width_milli,
                height_milli: containing.height_milli,
            },
            depth + 1,
            config,
            measurer,
            boxes,
        )?;
        cursor_y = cursor_y.saturating_add(child_size.height_milli + gap);
        size.width_milli = size.width_milli.max(child_size.width_milli);
        size.height_milli = size
            .height_milli
            .saturating_add(child_size.height_milli + gap);
    }
    if !node.children.is_empty() {
        size.height_milli = size.height_milli.saturating_sub(gap);
    }
    Ok(size)
}

#[allow(clippy::too_many_arguments)]
fn layout_row<M: IntrinsicMeasurer>(
    node: &RendererTreeNode,
    nodes: &BTreeMap<NodeId, RendererTreeNode>,
    containing: Rect,
    gap: i32,
    depth: usize,
    config: LayoutConfig,
    measurer: &mut M,
    boxes: &mut BTreeMap<NodeId, Rect>,
) -> Result<Size, LayoutError> {
    if node.children.is_empty() {
        return Ok(Size::default());
    }
    let wrap = node.props.get("wrap").is_some_and(|value| value == "true");
    let default_width = node
        .props
        .get("item_width_milli")
        .map(|value| {
            value
                .parse::<i32>()
                .map_err(|_| LayoutError::InvalidProperty)
        })
        .transpose()?;
    let count = i32::try_from(node.children.len()).map_err(|_| LayoutError::NodeCapacity)?;
    let equal_width = containing
        .width_milli
        .saturating_sub(gap.saturating_mul(count.saturating_sub(1)))
        / count.max(1);
    let mut cursor_x = containing.x_milli;
    let mut cursor_y = containing.y_milli;
    let mut line_height = 0;
    let mut maximum_width = 0;
    for child in &node.children {
        let child_node = nodes.get(child).ok_or(LayoutError::MissingNode)?;
        let width = optional_property_i32(child_node, "width_milli", config.max_extent_milli)?
            .or(default_width)
            .unwrap_or(equal_width)
            .max(0);
        if wrap
            && cursor_x > containing.x_milli
            && cursor_x
                .saturating_add(width)
                .saturating_sub(containing.x_milli)
                > containing.width_milli
        {
            cursor_x = containing.x_milli;
            cursor_y = cursor_y.saturating_add(line_height + gap);
            line_height = 0;
        }
        let child_size = layout_subtree(
            *child,
            nodes,
            Rect {
                x_milli: cursor_x,
                y_milli: cursor_y,
                width_milli: width,
                height_milli: containing.height_milli,
            },
            depth + 1,
            config,
            measurer,
            boxes,
        )?;
        cursor_x = cursor_x.saturating_add(child_size.width_milli + gap);
        line_height = line_height.max(child_size.height_milli);
        maximum_width = maximum_width.max(cursor_x.saturating_sub(containing.x_milli + gap));
    }
    Ok(Size {
        width_milli: maximum_width,
        height_milli: cursor_y
            .saturating_sub(containing.y_milli)
            .saturating_add(line_height),
    })
}

#[allow(clippy::too_many_arguments)]
fn layout_grid<M: IntrinsicMeasurer>(
    node: &RendererTreeNode,
    nodes: &BTreeMap<NodeId, RendererTreeNode>,
    containing: Rect,
    gap: i32,
    depth: usize,
    config: LayoutConfig,
    measurer: &mut M,
    boxes: &mut BTreeMap<NodeId, Rect>,
) -> Result<Size, LayoutError> {
    let columns = property_i32(node, "grid_columns", 1, 1024)?;
    if columns == 0 {
        return Err(LayoutError::InvalidProperty);
    }
    let cell_width = containing
        .width_milli
        .saturating_sub(gap.saturating_mul(columns.saturating_sub(1)))
        / columns;
    let mut row_y = containing.y_milli;
    let mut row_height = 0;
    for (index, child) in node.children.iter().enumerate() {
        let column = i32::try_from(index).map_err(|_| LayoutError::NodeCapacity)? % columns;
        if column == 0 && index != 0 {
            row_y = row_y.saturating_add(row_height + gap);
            row_height = 0;
        }
        let child_size = layout_subtree(
            *child,
            nodes,
            Rect {
                x_milli: containing
                    .x_milli
                    .saturating_add(column.saturating_mul(cell_width + gap)),
                y_milli: row_y,
                width_milli: cell_width,
                height_milli: containing.height_milli,
            },
            depth + 1,
            config,
            measurer,
            boxes,
        )?;
        row_height = row_height.max(child_size.height_milli);
    }
    Ok(Size {
        width_milli: containing.width_milli,
        height_milli: if node.children.is_empty() {
            0
        } else {
            row_y
                .saturating_sub(containing.y_milli)
                .saturating_add(row_height)
        },
    })
}

#[allow(clippy::too_many_arguments)]
fn layout_stack<M: IntrinsicMeasurer>(
    node: &RendererTreeNode,
    nodes: &BTreeMap<NodeId, RendererTreeNode>,
    containing: Rect,
    depth: usize,
    config: LayoutConfig,
    measurer: &mut M,
    boxes: &mut BTreeMap<NodeId, Rect>,
) -> Result<Size, LayoutError> {
    let mut result = Size::default();
    for child in &node.children {
        let size = layout_subtree(
            *child,
            nodes,
            containing,
            depth + 1,
            config,
            measurer,
            boxes,
        )?;
        result.width_milli = result.width_milli.max(size.width_milli);
        result.height_milli = result.height_milli.max(size.height_milli);
    }
    Ok(result)
}

fn property_i32(
    node: &RendererTreeNode,
    name: &str,
    default: i32,
    max: i32,
) -> Result<i32, LayoutError> {
    optional_property_i32(node, name, max).map(|value| value.unwrap_or(default))
}

fn optional_property_i32(
    node: &RendererTreeNode,
    name: &str,
    max: i32,
) -> Result<Option<i32>, LayoutError> {
    let Some(value) = node.props.get(name) else {
        return Ok(None);
    };
    let value = value
        .parse::<i32>()
        .map_err(|_| LayoutError::InvalidProperty)?;
    if value < 0 || value > max {
        return Err(LayoutError::InvalidProperty);
    }
    Ok(Some(value))
}

fn signed_property_i32(
    node: &RendererTreeNode,
    name: &str,
    default: i32,
    max: i32,
) -> Result<i32, LayoutError> {
    let Some(value) = node.props.get(name) else {
        return Ok(default);
    };
    let value = value
        .parse::<i32>()
        .map_err(|_| LayoutError::InvalidProperty)?;
    if value < -max || value > max {
        return Err(LayoutError::InvalidProperty);
    }
    Ok(value)
}

fn remove_subtree_boxes(
    root: NodeId,
    nodes: &BTreeMap<NodeId, RendererTreeNode>,
    boxes: &mut BTreeMap<NodeId, Rect>,
) -> Result<(), LayoutError> {
    let mut pending = vec![root];
    while let Some(node) = pending.pop() {
        boxes.remove(&node);
        pending.extend(
            nodes
                .get(&node)
                .ok_or(LayoutError::MissingNode)?
                .children
                .iter()
                .copied(),
        );
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use vogui_protocol::v2::Handle;

    fn handle(index: u32) -> Handle {
        Handle {
            index,
            generation: 1,
        }
    }

    #[derive(Default)]
    struct Measurer {
        text_calls: usize,
    }

    impl IntrinsicMeasurer for Measurer {
        fn measure_text(
            &mut self,
            _node: NodeId,
            text: &str,
            _max_width_milli: i32,
        ) -> Result<Size, LayoutError> {
            self.text_calls += 1;
            Ok(Size {
                width_milli: i32::try_from(text.len()).unwrap() * 1_000,
                height_milli: 2_000,
            })
        }

        fn measure_image(
            &mut self,
            _node: NodeId,
            _source: &str,
            _max_width_milli: i32,
            _max_height_milli: i32,
        ) -> Result<Size, LayoutError> {
            Ok(Size {
                width_milli: 4_000,
                height_milli: 3_000,
            })
        }
    }

    fn tree(revision: u64, text: &str) -> RendererTreeSnapshot {
        let root = handle(1);
        let section = handle(2);
        let label = handle(3);
        RendererTreeSnapshot {
            root: handle(100),
            revision,
            tree_root: root,
            nodes: vec![
                RendererTreeNode {
                    node: root,
                    parent: None,
                    children: vec![section],
                    kind: ViewKind::Element("root".into()),
                    props: BTreeMap::new(),
                },
                RendererTreeNode {
                    node: section,
                    parent: Some(root),
                    children: vec![label],
                    kind: ViewKind::Element("section".into()),
                    props: BTreeMap::from([("formatting_root".into(), "true".into())]),
                },
                RendererTreeNode {
                    node: label,
                    parent: Some(section),
                    children: Vec::new(),
                    kind: ViewKind::Text(text.into()),
                    props: BTreeMap::new(),
                },
            ],
        }
    }

    #[test]
    fn dirty_descendant_recomputes_only_its_nearest_formatting_root() {
        let mut engine = LayoutEngine::new(LayoutConfig::default()).unwrap();
        let mut measurer = Measurer::default();
        let viewport = Size {
            width_milli: 80_000,
            height_milli: 60_000,
        };
        let first = engine
            .apply(&tree(1, "first"), viewport, &mut measurer)
            .unwrap();
        assert_eq!(first.recomputed_formatting_roots, vec![handle(1)]);
        assert_eq!(measurer.text_calls, 1);

        let second = engine
            .apply(&tree(2, "second"), viewport, &mut measurer)
            .unwrap();
        assert_eq!(second.recomputed_formatting_roots, vec![handle(2)]);
        assert_eq!(second.boxes.len(), 3);
        assert_eq!(measurer.text_calls, 2);
    }

    #[test]
    fn malformed_tree_does_not_poison_last_good_layout() {
        let mut engine = LayoutEngine::new(LayoutConfig {
            max_nodes: 3,
            ..LayoutConfig::default()
        })
        .unwrap();
        let mut measurer = Measurer::default();
        let viewport = Size {
            width_milli: 80_000,
            height_milli: 60_000,
        };
        let first = engine
            .apply(&tree(1, "stable"), viewport, &mut measurer)
            .unwrap();

        let mut malformed = tree(2, "bad");
        malformed.nodes[2].parent = None;
        assert_eq!(
            engine.apply(&malformed, viewport, &mut measurer),
            Err(LayoutError::InvalidTree),
        );

        let retry = engine
            .apply(&tree(2, "stable"), viewport, &mut measurer)
            .unwrap();
        assert_eq!(retry.boxes, first.boxes);
        assert!(retry.recomputed_formatting_roots.is_empty());
    }
}
