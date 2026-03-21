// Binary render protocol decoder for VoGUI.
//
// Wire format (little-endian):
//   [u32: gen][u8: flags][NODE][u16: handlerCount][HANDLER...][styles?][canvas?][theme?]
//
// Node tags: 0=null 1=element 2=text 3=fragment 4=component 5=cached
// Value tags: 0=null 1=bool 2=int 3=float64 4=string 5=map 6=array 7=node

use std::collections::BTreeMap;
use std::error::Error;
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub struct RenderFrame {
    pub generation: u32,
    pub flags: u8,
    pub tree: RenderNode,
    pub handlers: Vec<RenderHandler>,
    pub styles: Vec<String>,
    pub canvas: Vec<CanvasBatch>,
    pub theme: BTreeMap<String, String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RenderNode {
    Null,
    Element(RenderElement),
    Text(String),
    Fragment(Vec<RenderNode>),
    Component { id: u32, child: Box<RenderNode> },
    Cached { id: u32 },
}

#[derive(Debug, Clone, PartialEq)]
pub struct RenderElement {
    pub node_type: String,
    pub props: BTreeMap<String, RenderValue>,
    pub children: Vec<RenderNode>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RenderValue {
    Null,
    Bool(bool),
    Int(i32),
    Float(f64),
    String(String),
    Map(BTreeMap<String, RenderValue>),
    Array(Vec<RenderValue>),
    Node(Box<RenderNode>),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderHandler {
    pub id: u16,
    pub generation: u16,
    pub handler_type: u8,
    pub int_value: i32,
    pub modifiers: Vec<String>,
    pub key_filter: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CanvasBatch {
    pub reference: String,
    pub commands: Vec<CanvasCommand>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CanvasCommand {
    pub command: String,
    pub args: Vec<RenderValue>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RenderDecodeError {
    UnexpectedEof,
    InvalidUtf8,
    InvalidNodeTag(u8),
    InvalidValueTag(u8),
    TrailingBytes(usize),
}

impl fmt::Display for RenderDecodeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnexpectedEof => write!(f, "unexpected end of binary render payload"),
            Self::InvalidUtf8 => write!(f, "invalid utf-8 in binary render payload"),
            Self::InvalidNodeTag(tag) => write!(f, "invalid binary render node tag: {}", tag),
            Self::InvalidValueTag(tag) => write!(f, "invalid binary render value tag: {}", tag),
            Self::TrailingBytes(remaining) => write!(f, "binary render payload has {} trailing bytes", remaining),
        }
    }
}

impl Error for RenderDecodeError {}

pub fn decode_binary_render(bytes: &[u8]) -> Result<RenderFrame, RenderDecodeError> {
    RenderDecoder::new(bytes).decode_frame()
}

pub mod query {
    use super::{RenderFrame, RenderNode, RenderValue};

    pub fn find_external_widget_handler_id(frame: &RenderFrame) -> Option<i32> {
        find_in_node(&frame.tree)
    }

    fn find_in_node(node: &RenderNode) -> Option<i32> {
        match node {
            RenderNode::Null | RenderNode::Text(_) | RenderNode::Cached { .. } => None,
            RenderNode::Fragment(children) => children.iter().find_map(find_in_node),
            RenderNode::Component { child, .. } => find_in_node(child),
            RenderNode::Element(element) => {
                if element.node_type == "vo-external-widget" {
                    if let Some(RenderValue::Int(handler_id)) = element.props.get("onWidget") {
                        return Some(*handler_id);
                    }
                }
                element
                    .props
                    .values()
                    .find_map(find_in_value)
                    .or_else(|| element.children.iter().find_map(find_in_node))
            }
        }
    }

    fn find_in_value(value: &RenderValue) -> Option<i32> {
        match value {
            RenderValue::Map(map) => map.values().find_map(find_in_value),
            RenderValue::Array(values) => values.iter().find_map(find_in_value),
            RenderValue::Node(node) => find_in_node(node),
            RenderValue::Null
            | RenderValue::Bool(_)
            | RenderValue::Int(_)
            | RenderValue::Float(_)
            | RenderValue::String(_) => None,
        }
    }
}

struct RenderDecoder<'a> {
    bytes: &'a [u8],
    pos: usize,
}

impl<'a> RenderDecoder<'a> {
    fn new(bytes: &'a [u8]) -> Self {
        Self { bytes, pos: 0 }
    }

    fn decode_frame(mut self) -> Result<RenderFrame, RenderDecodeError> {
        let generation = self.read_u32()?;
        let flags = self.read_u8()?;
        let tree = self.read_node()?;

        let handler_count = self.read_u16()? as usize;
        let mut handlers = Vec::with_capacity(handler_count);
        for _ in 0..handler_count {
            handlers.push(self.read_handler()?);
        }

        let styles = if flags & 1 != 0 {
            let count = self.read_u16()? as usize;
            let mut styles = Vec::with_capacity(count);
            for _ in 0..count {
                styles.push(self.read_str()?);
            }
            styles
        } else {
            Vec::new()
        };

        let canvas = if flags & 2 != 0 {
            let count = self.read_u16()? as usize;
            let mut batches = Vec::with_capacity(count);
            for _ in 0..count {
                let reference = self.read_str()?;
                let command_count = self.read_u32()? as usize;
                let mut commands = Vec::with_capacity(command_count);
                for _ in 0..command_count {
                    let command = self.read_str()?;
                    let arg_count = self.read_u8()? as usize;
                    let mut args = Vec::with_capacity(arg_count);
                    for _ in 0..arg_count {
                        args.push(self.read_value()?);
                    }
                    commands.push(CanvasCommand { command, args });
                }
                batches.push(CanvasBatch { reference, commands });
            }
            batches
        } else {
            Vec::new()
        };

        let theme = if flags & 4 != 0 {
            let count = self.read_u16()? as usize;
            let mut theme = BTreeMap::new();
            for _ in 0..count {
                let key = self.read_str()?;
                let value = self.read_str()?;
                theme.insert(key, value);
            }
            theme
        } else {
            BTreeMap::new()
        };

        let remaining = self.remaining();
        if remaining != 0 {
            return Err(RenderDecodeError::TrailingBytes(remaining));
        }

        Ok(RenderFrame {
            generation,
            flags,
            tree,
            handlers,
            styles,
            canvas,
            theme,
        })
    }

    fn read_node(&mut self) -> Result<RenderNode, RenderDecodeError> {
        match self.read_u8()? {
            0 => Ok(RenderNode::Null),
            1 => {
                let node_type = self.read_str()?;
                let prop_count = self.read_u16()? as usize;
                let mut props = BTreeMap::new();
                for _ in 0..prop_count {
                    let key = self.read_str()?;
                    let value = self.read_value()?;
                    props.insert(key, value);
                }
                let child_count = self.read_u32()? as usize;
                let mut children = Vec::with_capacity(child_count);
                for _ in 0..child_count {
                    children.push(self.read_node()?);
                }
                Ok(RenderNode::Element(RenderElement {
                    node_type,
                    props,
                    children,
                }))
            }
            2 => Ok(RenderNode::Text(self.read_str()?)),
            3 => {
                let child_count = self.read_u16()? as usize;
                let mut children = Vec::with_capacity(child_count);
                for _ in 0..child_count {
                    children.push(self.read_node()?);
                }
                Ok(RenderNode::Fragment(children))
            }
            4 => {
                let id = self.read_u32()?;
                let child = self.read_node()?;
                Ok(RenderNode::Component {
                    id,
                    child: Box::new(child),
                })
            }
            5 => Ok(RenderNode::Cached { id: self.read_u32()? }),
            tag => Err(RenderDecodeError::InvalidNodeTag(tag)),
        }
    }

    fn read_value(&mut self) -> Result<RenderValue, RenderDecodeError> {
        match self.read_u8()? {
            0 => Ok(RenderValue::Null),
            1 => Ok(RenderValue::Bool(self.read_u8()? != 0)),
            2 => Ok(RenderValue::Int(self.read_i32()?)),
            3 => Ok(RenderValue::Float(self.read_f64()?)),
            4 => Ok(RenderValue::String(self.read_str()?)),
            5 => {
                let count = self.read_u16()? as usize;
                let mut map = BTreeMap::new();
                for _ in 0..count {
                    let key = self.read_str()?;
                    let value = self.read_value()?;
                    map.insert(key, value);
                }
                Ok(RenderValue::Map(map))
            }
            6 => {
                let count = self.read_u32()? as usize;
                let mut items = Vec::with_capacity(count);
                for _ in 0..count {
                    items.push(self.read_value()?);
                }
                Ok(RenderValue::Array(items))
            }
            7 => Ok(RenderValue::Node(Box::new(self.read_node()?))),
            tag => Err(RenderDecodeError::InvalidValueTag(tag)),
        }
    }

    fn read_handler(&mut self) -> Result<RenderHandler, RenderDecodeError> {
        let id = self.read_u16()?;
        let generation = self.read_u16()?;
        let handler_type = self.read_u8()?;
        let int_value = self.read_i32()?;
        let modifier_count = self.read_u8()? as usize;
        let mut modifiers = Vec::with_capacity(modifier_count);
        for _ in 0..modifier_count {
            modifiers.push(self.read_str()?);
        }
        let key_filter = self.read_str()?;
        Ok(RenderHandler {
            id,
            generation,
            handler_type,
            int_value,
            modifiers,
            key_filter: if key_filter.is_empty() { None } else { Some(key_filter) },
        })
    }

    fn remaining(&self) -> usize {
        self.bytes.len().saturating_sub(self.pos)
    }

    fn read_exact(&mut self, len: usize) -> Result<&'a [u8], RenderDecodeError> {
        let end = self.pos.checked_add(len).ok_or(RenderDecodeError::UnexpectedEof)?;
        let bytes = self.bytes.get(self.pos..end).ok_or(RenderDecodeError::UnexpectedEof)?;
        self.pos = end;
        Ok(bytes)
    }

    fn read_u8(&mut self) -> Result<u8, RenderDecodeError> {
        Ok(self.read_exact(1)?[0])
    }

    fn read_u16(&mut self) -> Result<u16, RenderDecodeError> {
        let bytes = self.read_exact(2)?;
        Ok(u16::from_le_bytes([bytes[0], bytes[1]]))
    }

    fn read_u32(&mut self) -> Result<u32, RenderDecodeError> {
        let bytes = self.read_exact(4)?;
        Ok(u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]))
    }

    fn read_i32(&mut self) -> Result<i32, RenderDecodeError> {
        let bytes = self.read_exact(4)?;
        Ok(i32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]))
    }

    fn read_f64(&mut self) -> Result<f64, RenderDecodeError> {
        let bytes = self.read_exact(8)?;
        Ok(f64::from_le_bytes([
            bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7],
        ]))
    }

    fn read_str(&mut self) -> Result<String, RenderDecodeError> {
        let len = self.read_u16()? as usize;
        let bytes = self.read_exact(len)?;
        let text = std::str::from_utf8(bytes).map_err(|_| RenderDecodeError::InvalidUtf8)?;
        Ok(text.to_owned())
    }
}

#[cfg(test)]
mod tests {
    use super::{decode_binary_render, query, CanvasBatch, CanvasCommand, RenderDecodeError, RenderElement, RenderFrame, RenderHandler, RenderNode, RenderValue};
    use std::collections::BTreeMap;

    #[test]
    fn decode_binary_render_round_trips_full_frame() {
        let frame = RenderFrame {
            generation: 7,
            flags: 7,
            tree: RenderNode::Element(RenderElement {
                node_type: "vo-external-widget".to_string(),
                props: BTreeMap::from([
                    ("onWidget".to_string(), RenderValue::Int(42)),
                    ("widgetType".to_string(), RenderValue::String("voplay".to_string())),
                ]),
                children: vec![RenderNode::Text("ready".to_string())],
            }),
            handlers: vec![RenderHandler {
                id: 42,
                generation: 3,
                handler_type: 1,
                int_value: 9,
                modifiers: vec!["shift".to_string()],
                key_filter: Some("Enter".to_string()),
            }],
            styles: vec!["body { color: white; }".to_string()],
            canvas: vec![CanvasBatch {
                reference: "canvas".to_string(),
                commands: vec![
                    CanvasCommand {
                        command: "clear".to_string(),
                        args: vec![],
                    },
                    CanvasCommand {
                        command: "translate".to_string(),
                        args: vec![RenderValue::Float(1.5), RenderValue::Int(2)],
                    },
                ],
            }],
            theme: BTreeMap::from([("fg".to_string(), "#fff".to_string())]),
        };

        let bytes = encode_frame(&frame);
        let decoded = decode_binary_render(&bytes).unwrap();

        assert_eq!(decoded, frame);
    }

    #[test]
    fn query_finds_external_widget_handler_id_inside_node_value() {
        let widget = RenderNode::Element(RenderElement {
            node_type: "vo-external-widget".to_string(),
            props: BTreeMap::from([
                ("onWidget".to_string(), RenderValue::Int(99)),
                ("widgetType".to_string(), RenderValue::String("voplay".to_string())),
            ]),
            children: vec![],
        });
        let frame = RenderFrame {
            generation: 1,
            flags: 0,
            tree: RenderNode::Element(RenderElement {
                node_type: "root".to_string(),
                props: BTreeMap::from([(
                    "content".to_string(),
                    RenderValue::Array(vec![RenderValue::Node(Box::new(widget))]),
                )]),
                children: vec![],
            }),
            handlers: vec![],
            styles: vec![],
            canvas: vec![],
            theme: BTreeMap::new(),
        };

        assert_eq!(query::find_external_widget_handler_id(&frame), Some(99));
    }

    #[test]
    fn decode_binary_render_rejects_trailing_bytes() {
        let bytes = vec![0, 0, 0, 0, 0, 0, 0, 0, 1];

        let error = decode_binary_render(&bytes).unwrap_err();

        assert_eq!(error, RenderDecodeError::TrailingBytes(1));
    }

    fn encode_frame(frame: &RenderFrame) -> Vec<u8> {
        let mut bytes = Vec::new();
        push_u32(&mut bytes, frame.generation);

        let mut flags = 0u8;
        if !frame.styles.is_empty() {
            flags |= 1;
        }
        if !frame.canvas.is_empty() {
            flags |= 2;
        }
        if !frame.theme.is_empty() {
            flags |= 4;
        }
        push_u8(&mut bytes, flags);
        encode_node(&mut bytes, &frame.tree);

        push_u16(&mut bytes, frame.handlers.len() as u16);
        for handler in &frame.handlers {
            push_u16(&mut bytes, handler.id);
            push_u16(&mut bytes, handler.generation);
            push_u8(&mut bytes, handler.handler_type);
            push_i32(&mut bytes, handler.int_value);
            push_u8(&mut bytes, handler.modifiers.len() as u8);
            for modifier in &handler.modifiers {
                push_str(&mut bytes, modifier);
            }
            push_str(&mut bytes, handler.key_filter.as_deref().unwrap_or(""));
        }

        if !frame.styles.is_empty() {
            push_u16(&mut bytes, frame.styles.len() as u16);
            for style in &frame.styles {
                push_str(&mut bytes, style);
            }
        }

        if !frame.canvas.is_empty() {
            push_u16(&mut bytes, frame.canvas.len() as u16);
            for batch in &frame.canvas {
                push_str(&mut bytes, &batch.reference);
                push_u32(&mut bytes, batch.commands.len() as u32);
                for command in &batch.commands {
                    push_str(&mut bytes, &command.command);
                    push_u8(&mut bytes, command.args.len() as u8);
                    for arg in &command.args {
                        encode_value(&mut bytes, arg);
                    }
                }
            }
        }

        if !frame.theme.is_empty() {
            push_u16(&mut bytes, frame.theme.len() as u16);
            for (key, value) in &frame.theme {
                push_str(&mut bytes, key);
                push_str(&mut bytes, value);
            }
        }

        bytes
    }

    fn encode_node(bytes: &mut Vec<u8>, node: &RenderNode) {
        match node {
            RenderNode::Null => push_u8(bytes, 0),
            RenderNode::Element(element) => {
                push_u8(bytes, 1);
                push_str(bytes, &element.node_type);
                push_u16(bytes, element.props.len() as u16);
                for (key, value) in &element.props {
                    push_str(bytes, key);
                    encode_value(bytes, value);
                }
                push_u32(bytes, element.children.len() as u32);
                for child in &element.children {
                    encode_node(bytes, child);
                }
            }
            RenderNode::Text(text) => {
                push_u8(bytes, 2);
                push_str(bytes, text);
            }
            RenderNode::Fragment(children) => {
                push_u8(bytes, 3);
                push_u16(bytes, children.len() as u16);
                for child in children {
                    encode_node(bytes, child);
                }
            }
            RenderNode::Component { id, child } => {
                push_u8(bytes, 4);
                push_u32(bytes, *id);
                encode_node(bytes, child);
            }
            RenderNode::Cached { id } => {
                push_u8(bytes, 5);
                push_u32(bytes, *id);
            }
        }
    }

    fn encode_value(bytes: &mut Vec<u8>, value: &RenderValue) {
        match value {
            RenderValue::Null => push_u8(bytes, 0),
            RenderValue::Bool(value) => {
                push_u8(bytes, 1);
                push_u8(bytes, if *value { 1 } else { 0 });
            }
            RenderValue::Int(value) => {
                push_u8(bytes, 2);
                push_i32(bytes, *value);
            }
            RenderValue::Float(value) => {
                push_u8(bytes, 3);
                push_f64(bytes, *value);
            }
            RenderValue::String(value) => {
                push_u8(bytes, 4);
                push_str(bytes, value);
            }
            RenderValue::Map(map) => {
                push_u8(bytes, 5);
                push_u16(bytes, map.len() as u16);
                for (key, value) in map {
                    push_str(bytes, key);
                    encode_value(bytes, value);
                }
            }
            RenderValue::Array(values) => {
                push_u8(bytes, 6);
                push_u32(bytes, values.len() as u32);
                for value in values {
                    encode_value(bytes, value);
                }
            }
            RenderValue::Node(node) => {
                push_u8(bytes, 7);
                encode_node(bytes, node);
            }
        }
    }

    fn push_u8(bytes: &mut Vec<u8>, value: u8) {
        bytes.push(value);
    }

    fn push_u16(bytes: &mut Vec<u8>, value: u16) {
        bytes.extend_from_slice(&value.to_le_bytes());
    }

    fn push_u32(bytes: &mut Vec<u8>, value: u32) {
        bytes.extend_from_slice(&value.to_le_bytes());
    }

    fn push_i32(bytes: &mut Vec<u8>, value: i32) {
        bytes.extend_from_slice(&value.to_le_bytes());
    }

    fn push_f64(bytes: &mut Vec<u8>, value: f64) {
        bytes.extend_from_slice(&value.to_le_bytes());
    }

    fn push_str(bytes: &mut Vec<u8>, value: &str) {
        push_u16(bytes, value.len() as u16);
        bytes.extend_from_slice(value.as_bytes());
    }
}
