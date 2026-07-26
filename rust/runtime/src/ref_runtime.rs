use std::collections::BTreeSet;

use vogui_protocol::v2::{Handle, NodeId, UiRootId, UiSessionId};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct LogicalNodeRef {
    session: UiSessionId,
    root: UiRootId,
    handle: Handle,
}

impl LogicalNodeRef {
    pub(crate) const fn from_parts(session: UiSessionId, root: UiRootId, handle: Handle) -> Self {
        Self {
            session,
            root,
            handle,
        }
    }

    pub const fn session(self) -> UiSessionId {
        self.session
    }

    pub const fn root(self) -> UiRootId {
        self.root
    }

    pub const fn handle(self) -> Handle {
        self.handle
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LogicalNodeRefState {
    CreatedUnbound,
    Bound {
        node: NodeId,
        binding_generation: u32,
    },
    Unbound {
        binding_generation: u32,
    },
    PendingRebind {
        node: NodeId,
        binding_generation: u32,
    },
    Closed,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ResolvedNodeRef {
    pub logical: LogicalNodeRef,
    pub node: NodeId,
    pub binding_generation: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct NodeRefRegistryConfig {
    pub max_refs: usize,
}

impl Default for NodeRefRegistryConfig {
    fn default() -> Self {
        Self { max_refs: 16_384 }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum NodeRefError {
    InvalidConfig,
    WrongSession,
    InvalidRoot,
    Capacity,
    UnknownRef,
    Closed,
    NotBound,
    BindingMismatch,
    GenerationExhausted,
}

#[derive(Debug)]
struct RefSlot {
    generation: u32,
    root: Option<UiRootId>,
    state: LogicalNodeRefState,
}

pub struct NodeRefRegistry {
    session: UiSessionId,
    config: NodeRefRegistryConfig,
    slots: Vec<RefSlot>,
    free: Vec<u32>,
    live: usize,
    closed: bool,
}

impl NodeRefRegistry {
    pub fn new(session: UiSessionId, config: NodeRefRegistryConfig) -> Result<Self, NodeRefError> {
        if !session.is_valid() || config.max_refs == 0 || config.max_refs > u32::MAX as usize {
            return Err(NodeRefError::InvalidConfig);
        }
        Ok(Self {
            session,
            config,
            slots: Vec::new(),
            free: Vec::new(),
            live: 0,
            closed: false,
        })
    }

    pub const fn live_count(&self) -> usize {
        self.live
    }

    pub fn create(&mut self, root: UiRootId) -> Result<LogicalNodeRef, NodeRefError> {
        self.ensure_open()?;
        if !root.is_valid() {
            return Err(NodeRefError::InvalidRoot);
        }
        if self.live == self.config.max_refs {
            return Err(NodeRefError::Capacity);
        }
        let index = if let Some(index) = self.free.pop() {
            index
        } else {
            let index = self.slots.len() as u32;
            self.slots.push(RefSlot {
                generation: 1,
                root: None,
                state: LogicalNodeRefState::Closed,
            });
            index
        };
        let slot = &mut self.slots[index as usize];
        slot.root = Some(root);
        slot.state = LogicalNodeRefState::CreatedUnbound;
        self.live += 1;
        Ok(LogicalNodeRef {
            session: self.session,
            root,
            handle: Handle {
                index,
                generation: slot.generation,
            },
        })
    }

    pub fn preflight_create(&self, count: usize) -> Result<(), NodeRefError> {
        self.ensure_open()?;
        self.live
            .checked_add(count)
            .filter(|live| *live <= self.config.max_refs)
            .ok_or(NodeRefError::Capacity)?;
        Ok(())
    }

    pub fn preflight_bind(&self, reference: LogicalNodeRef) -> Result<(), NodeRefError> {
        self.ensure_open()?;
        let slot = self.slot(reference)?;
        match slot.state {
            LogicalNodeRefState::CreatedUnbound => Ok(()),
            LogicalNodeRefState::Bound {
                binding_generation, ..
            }
            | LogicalNodeRefState::Unbound { binding_generation }
            | LogicalNodeRefState::PendingRebind {
                binding_generation, ..
            } => binding_generation
                .checked_add(1)
                .map(|_| ())
                .ok_or(NodeRefError::GenerationExhausted),
            LogicalNodeRefState::Closed => Err(NodeRefError::Closed),
        }
    }

    pub fn preflight_close(&self, reference: LogicalNodeRef) -> Result<(), NodeRefError> {
        self.ensure_open()?;
        self.slot(reference)?
            .generation
            .checked_add(1)
            .map(|_| ())
            .ok_or(NodeRefError::GenerationExhausted)
    }

    pub fn bind(&mut self, reference: LogicalNodeRef, node: NodeId) -> Result<u32, NodeRefError> {
        if !node.is_valid() {
            return Err(NodeRefError::BindingMismatch);
        }
        let slot = self.slot_mut(reference)?;
        let binding_generation = match slot.state {
            LogicalNodeRefState::CreatedUnbound => 1,
            LogicalNodeRefState::Bound {
                node: current,
                binding_generation,
            } if current == node => return Ok(binding_generation),
            LogicalNodeRefState::Bound {
                binding_generation, ..
            }
            | LogicalNodeRefState::Unbound { binding_generation }
            | LogicalNodeRefState::PendingRebind {
                binding_generation, ..
            } => binding_generation
                .checked_add(1)
                .ok_or(NodeRefError::GenerationExhausted)?,
            LogicalNodeRefState::Closed => return Err(NodeRefError::Closed),
        };
        slot.state = LogicalNodeRefState::Bound {
            node,
            binding_generation,
        };
        Ok(binding_generation)
    }

    pub fn unbind(&mut self, reference: LogicalNodeRef) -> Result<u32, NodeRefError> {
        let slot = self.slot_mut(reference)?;
        let binding_generation = match slot.state {
            LogicalNodeRefState::Bound {
                binding_generation, ..
            }
            | LogicalNodeRefState::PendingRebind {
                binding_generation, ..
            } => binding_generation
                .checked_add(1)
                .ok_or(NodeRefError::GenerationExhausted)?,
            LogicalNodeRefState::CreatedUnbound => 1,
            LogicalNodeRefState::Unbound { binding_generation } => return Ok(binding_generation),
            LogicalNodeRefState::Closed => return Err(NodeRefError::Closed),
        };
        slot.state = LogicalNodeRefState::Unbound { binding_generation };
        Ok(binding_generation)
    }

    pub fn resolve(&self, reference: LogicalNodeRef) -> Result<ResolvedNodeRef, NodeRefError> {
        let slot = self.slot(reference)?;
        match slot.state {
            LogicalNodeRefState::Bound {
                node,
                binding_generation,
            } => Ok(ResolvedNodeRef {
                logical: reference,
                node,
                binding_generation,
            }),
            LogicalNodeRefState::Closed => Err(NodeRefError::Closed),
            _ => Err(NodeRefError::NotBound),
        }
    }

    pub fn validate_binding(
        &self,
        reference: LogicalNodeRef,
        node: NodeId,
        binding_generation: u32,
    ) -> Result<(), NodeRefError> {
        let resolved = self.resolve(reference)?;
        if resolved.node != node || resolved.binding_generation != binding_generation {
            return Err(NodeRefError::BindingMismatch);
        }
        Ok(())
    }

    pub fn state(&self, reference: LogicalNodeRef) -> Result<LogicalNodeRefState, NodeRefError> {
        Ok(self.slot(reference)?.state)
    }

    pub fn renderer_restart(&mut self, root: UiRootId) {
        for slot in &mut self.slots {
            if slot.root != Some(root) {
                continue;
            }
            if let LogicalNodeRefState::Bound {
                node,
                binding_generation,
            } = slot.state
            {
                slot.state = LogicalNodeRefState::PendingRebind {
                    node,
                    binding_generation,
                };
            }
        }
    }

    pub fn renderer_snapshot_applied(&mut self, root: UiRootId) {
        for slot in &mut self.slots {
            if slot.root != Some(root) {
                continue;
            }
            if let LogicalNodeRefState::PendingRebind {
                node,
                binding_generation,
            } = slot.state
            {
                slot.state = LogicalNodeRefState::Bound {
                    node,
                    binding_generation,
                };
            }
        }
    }

    pub fn preflight_unbind_nodes(
        &self,
        root: UiRootId,
        removed: &BTreeSet<NodeId>,
    ) -> Result<(), NodeRefError> {
        for slot in &self.slots {
            if slot.root != Some(root) {
                continue;
            }
            let binding_generation = match slot.state {
                LogicalNodeRefState::Bound {
                    node,
                    binding_generation,
                }
                | LogicalNodeRefState::PendingRebind {
                    node,
                    binding_generation,
                } if removed.contains(&node) => Some(binding_generation),
                _ => None,
            };
            if binding_generation == Some(u32::MAX) {
                return Err(NodeRefError::GenerationExhausted);
            }
        }
        Ok(())
    }

    pub fn unbind_nodes(&mut self, root: UiRootId, removed: &BTreeSet<NodeId>) {
        for slot in &mut self.slots {
            if slot.root != Some(root) {
                continue;
            }
            let binding_generation = match slot.state {
                LogicalNodeRefState::Bound {
                    node,
                    binding_generation,
                }
                | LogicalNodeRefState::PendingRebind {
                    node,
                    binding_generation,
                } if removed.contains(&node) => Some(binding_generation),
                _ => None,
            };
            if let Some(binding_generation) = binding_generation {
                slot.state = LogicalNodeRefState::Unbound {
                    binding_generation: binding_generation + 1,
                };
            }
        }
    }

    pub fn close(&mut self, reference: LogicalNodeRef) -> Result<(), NodeRefError> {
        let index = self.slot_index(reference)?;
        let next_generation = self.slots[index]
            .generation
            .checked_add(1)
            .ok_or(NodeRefError::GenerationExhausted)?;
        let slot = &mut self.slots[index];
        slot.generation = next_generation;
        slot.root = None;
        slot.state = LogicalNodeRefState::Closed;
        self.free.push(reference.handle.index);
        self.live -= 1;
        Ok(())
    }

    pub fn close_root(&mut self, root: UiRootId) -> Result<(), NodeRefError> {
        let indices = self.preflight_close_root(root)?;
        for index in indices {
            let slot = &mut self.slots[index];
            slot.generation += 1;
            slot.root = None;
            slot.state = LogicalNodeRefState::Closed;
            self.free.push(index as u32);
            self.live -= 1;
        }
        Ok(())
    }

    pub fn preflight_close_root(&self, root: UiRootId) -> Result<Vec<usize>, NodeRefError> {
        self.ensure_open()?;
        let indices = self
            .slots
            .iter()
            .enumerate()
            .filter_map(|(index, slot)| (slot.root == Some(root)).then_some(index))
            .collect::<Vec<_>>();
        for index in &indices {
            self.slots[*index]
                .generation
                .checked_add(1)
                .ok_or(NodeRefError::GenerationExhausted)?;
        }
        Ok(indices)
    }

    pub fn shutdown(&mut self) -> usize {
        if self.closed {
            return 0;
        }
        let released = self.live;
        self.slots.clear();
        self.free.clear();
        self.live = 0;
        self.closed = true;
        released
    }

    fn ensure_open(&self) -> Result<(), NodeRefError> {
        if self.closed {
            Err(NodeRefError::Closed)
        } else {
            Ok(())
        }
    }

    fn slot(&self, reference: LogicalNodeRef) -> Result<&RefSlot, NodeRefError> {
        let index = self.slot_index(reference)?;
        Ok(&self.slots[index])
    }

    fn slot_mut(&mut self, reference: LogicalNodeRef) -> Result<&mut RefSlot, NodeRefError> {
        let index = self.slot_index(reference)?;
        Ok(&mut self.slots[index])
    }

    fn slot_index(&self, reference: LogicalNodeRef) -> Result<usize, NodeRefError> {
        if reference.session != self.session {
            return Err(NodeRefError::WrongSession);
        }
        if !reference.root.is_valid() || !reference.handle.is_valid() {
            return Err(NodeRefError::UnknownRef);
        }
        let index = reference.handle.index as usize;
        self.slots
            .get(index)
            .filter(|slot| {
                slot.generation == reference.handle.generation
                    && slot.root == Some(reference.root)
                    && slot.state != LogicalNodeRefState::Closed
            })
            .ok_or(NodeRefError::UnknownRef)?;
        Ok(index)
    }
}
