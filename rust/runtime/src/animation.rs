use std::collections::{BTreeMap, VecDeque};

use vogui_protocol::v2::{Handle, NodeId, UiRootId};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct AnimationId {
    pub root: UiRootId,
    pub node: NodeId,
    pub handle: Handle,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum AnimatedProperty {
    Opacity,
    TranslationX,
    TranslationY,
    ScaleX,
    ScaleY,
    Rotation,
    Width,
    Height,
    ScrollX,
    ScrollY,
    Color,
    Custom(u16),
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Easing {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
    CubicBezier {
        x1_milli: u16,
        y1_milli: i16,
        x2_milli: u16,
        y2_milli: i16,
    },
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Keyframe {
    pub offset_milli: u16,
    pub value_milli: i64,
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum AnimationCurve {
    Transition {
        from_milli: i64,
        to_milli: i64,
        duration_millis: u64,
        easing: Easing,
    },
    Keyframes {
        frames: Vec<Keyframe>,
        duration_millis: u64,
    },
    Spring {
        from_milli: i64,
        to_milli: i64,
        stiffness_milli: u32,
        damping_milli: u32,
        mass_milli: u32,
        duration_millis: u64,
    },
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct AnimationDescriptor {
    pub property: AnimatedProperty,
    pub curve: AnimationCurve,
    pub delay_millis: u64,
    pub completion_message: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct AnimationConfig {
    pub max_animations: usize,
    pub max_keyframes: usize,
    pub max_completions: usize,
}

impl Default for AnimationConfig {
    fn default() -> Self {
        Self {
            max_animations: 16_384,
            max_keyframes: 256,
            max_completions: 1024,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AnimationError {
    InvalidConfig,
    InvalidIdentity,
    InvalidDescriptor,
    AnimationCapacity,
    CompletionCapacity,
    UnknownAnimation,
    GenerationExhausted,
    ClockReversed,
    TimeOverflow,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AnimationTerminal {
    Completed,
    Cancelled,
    Replaced,
    NodeRemoved,
    RootClosed,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct AnimationCompletion {
    pub animation: AnimationId,
    pub terminal: AnimationTerminal,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct AnimationSample {
    pub animation: AnimationId,
    pub property: AnimatedProperty,
    pub value_milli: i64,
    pub complete: bool,
}

#[derive(Debug)]
struct AnimationRecord {
    descriptor: AnimationDescriptor,
    start_millis: u64,
}

#[derive(Debug)]
struct AnimationSlot {
    generation: u32,
    record: Option<AnimationRecord>,
}

pub struct AnimationRuntime {
    config: AnimationConfig,
    now_millis: u64,
    reduced_motion: bool,
    slots: Vec<AnimationSlot>,
    free: Vec<u32>,
    active_by_property: BTreeMap<(UiRootId, NodeId, AnimatedProperty), AnimationId>,
    completions: VecDeque<AnimationCompletion>,
}

impl AnimationRuntime {
    pub fn new(config: AnimationConfig) -> Result<Self, AnimationError> {
        if config.max_animations == 0
            || config.max_animations > u32::MAX as usize
            || config.max_keyframes == 0
            || config.max_completions == 0
        {
            return Err(AnimationError::InvalidConfig);
        }
        Ok(Self {
            config,
            now_millis: 0,
            reduced_motion: false,
            slots: Vec::new(),
            free: Vec::new(),
            active_by_property: BTreeMap::new(),
            completions: VecDeque::new(),
        })
    }

    pub const fn now_millis(&self) -> u64 {
        self.now_millis
    }

    pub fn set_reduced_motion(&mut self, reduced: bool) -> Result<(), AnimationError> {
        self.reduced_motion = reduced;
        if reduced {
            let active = self
                .active_by_property
                .values()
                .copied()
                .collect::<Vec<_>>();
            for animation in active {
                self.finish(animation, AnimationTerminal::Completed)?;
            }
        }
        Ok(())
    }

    pub fn begin(
        &mut self,
        root: UiRootId,
        node: NodeId,
        descriptor: AnimationDescriptor,
    ) -> Result<AnimationId, AnimationError> {
        if !root.is_valid() || !node.is_valid() {
            return Err(AnimationError::InvalidIdentity);
        }
        validate_descriptor(&descriptor, self.config.max_keyframes)?;
        let key = (root, node, descriptor.property);
        if let Some(existing) = self.active_by_property.get(&key).copied() {
            self.finish(existing, AnimationTerminal::Replaced)?;
        }
        let index = if let Some(index) = self.free.pop() {
            index
        } else {
            if self.slots.len() == self.config.max_animations {
                return Err(AnimationError::AnimationCapacity);
            }
            let index = self.slots.len() as u32;
            self.slots.push(AnimationSlot {
                generation: 1,
                record: None,
            });
            index
        };
        let slot = &mut self.slots[index as usize];
        let id = AnimationId {
            root,
            node,
            handle: Handle {
                index,
                generation: slot.generation,
            },
        };
        slot.record = Some(AnimationRecord {
            descriptor: descriptor.clone(),
            start_millis: self.now_millis,
        });
        self.active_by_property.insert(key, id);
        if self.reduced_motion {
            self.finish(id, AnimationTerminal::Completed)?;
        }
        Ok(id)
    }

    pub fn tick(&mut self, now_millis: u64) -> Result<Vec<AnimationSample>, AnimationError> {
        if now_millis < self.now_millis {
            return Err(AnimationError::ClockReversed);
        }
        self.now_millis = now_millis;
        let active = self
            .active_by_property
            .values()
            .copied()
            .collect::<Vec<_>>();
        let mut samples = Vec::with_capacity(active.len());
        let mut completed = Vec::new();
        for id in active {
            let record = self.record(id)?;
            let elapsed = now_millis
                .checked_sub(record.start_millis)
                .ok_or(AnimationError::ClockReversed)?;
            let (value_milli, complete) = sample_descriptor(&record.descriptor, elapsed)?;
            samples.push(AnimationSample {
                animation: id,
                property: record.descriptor.property,
                value_milli,
                complete,
            });
            if complete {
                completed.push(id);
            }
        }
        for id in completed {
            self.finish(id, AnimationTerminal::Completed)?;
        }
        Ok(samples)
    }

    pub fn cancel(&mut self, id: AnimationId) -> Result<(), AnimationError> {
        self.finish(id, AnimationTerminal::Cancelled)
    }

    pub fn remove_node(&mut self, root: UiRootId, node: NodeId) -> Result<(), AnimationError> {
        let ids = self
            .active_by_property
            .iter()
            .filter_map(|((active_root, active_node, _), id)| {
                (*active_root == root && *active_node == node).then_some(*id)
            })
            .collect::<Vec<_>>();
        for id in ids {
            self.finish(id, AnimationTerminal::NodeRemoved)?;
        }
        Ok(())
    }

    pub fn close_root(&mut self, root: UiRootId) -> Result<(), AnimationError> {
        self.preflight_close_root(root)?;
        let ids = self
            .active_by_property
            .iter()
            .filter_map(|((active_root, _, _), id)| (*active_root == root).then_some(*id))
            .collect::<Vec<_>>();
        for id in ids {
            self.finish(id, AnimationTerminal::RootClosed)?;
        }
        Ok(())
    }

    pub fn preflight_close_root(&self, root: UiRootId) -> Result<(), AnimationError> {
        if !root.is_valid() {
            return Err(AnimationError::InvalidIdentity);
        }
        let mut completion_count = self.completions.len();
        for ((active_root, _, _), id) in &self.active_by_property {
            if *active_root != root {
                continue;
            }
            let index = self.record_index(*id)?;
            self.slots[index]
                .generation
                .checked_add(1)
                .ok_or(AnimationError::GenerationExhausted)?;
            if self.slots[index]
                .record
                .as_ref()
                .is_some_and(|record| record.descriptor.completion_message)
            {
                completion_count = completion_count
                    .checked_add(1)
                    .ok_or(AnimationError::CompletionCapacity)?;
            }
        }
        if completion_count > self.config.max_completions {
            return Err(AnimationError::CompletionCapacity);
        }
        Ok(())
    }

    pub fn poll_completion(&mut self) -> Option<AnimationCompletion> {
        self.completions.pop_front()
    }

    fn finish(
        &mut self,
        id: AnimationId,
        terminal: AnimationTerminal,
    ) -> Result<(), AnimationError> {
        let index = self.record_index(id)?;
        let record = self.slots[index]
            .record
            .as_ref()
            .ok_or(AnimationError::UnknownAnimation)?;
        let should_report = record.descriptor.completion_message;
        if should_report && self.completions.len() == self.config.max_completions {
            return Err(AnimationError::CompletionCapacity);
        }
        let next_generation = self.slots[index]
            .generation
            .checked_add(1)
            .ok_or(AnimationError::GenerationExhausted)?;
        let property = record.descriptor.property;
        self.active_by_property
            .remove(&(id.root, id.node, property));
        self.slots[index].record = None;
        self.slots[index].generation = next_generation;
        self.free.push(id.handle.index);
        if should_report {
            self.completions.push_back(AnimationCompletion {
                animation: id,
                terminal,
            });
        }
        Ok(())
    }

    fn record(&self, id: AnimationId) -> Result<&AnimationRecord, AnimationError> {
        let index = self.record_index(id)?;
        self.slots[index]
            .record
            .as_ref()
            .ok_or(AnimationError::UnknownAnimation)
    }

    fn record_index(&self, id: AnimationId) -> Result<usize, AnimationError> {
        if !id.root.is_valid() || !id.node.is_valid() || !id.handle.is_valid() {
            return Err(AnimationError::InvalidIdentity);
        }
        let index = id.handle.index as usize;
        self.slots
            .get(index)
            .filter(|slot| slot.generation == id.handle.generation)
            .ok_or(AnimationError::UnknownAnimation)?;
        Ok(index)
    }
}

fn validate_descriptor(
    descriptor: &AnimationDescriptor,
    max_keyframes: usize,
) -> Result<(), AnimationError> {
    match &descriptor.curve {
        AnimationCurve::Transition {
            duration_millis,
            easing,
            ..
        } => {
            if *duration_millis == 0 || !valid_easing(*easing) {
                return Err(AnimationError::InvalidDescriptor);
            }
        }
        AnimationCurve::Keyframes {
            frames,
            duration_millis,
        } => {
            if *duration_millis == 0
                || frames.len() < 2
                || frames.len() > max_keyframes
                || frames.first().map(|frame| frame.offset_milli) != Some(0)
                || frames.last().map(|frame| frame.offset_milli) != Some(1000)
                || frames
                    .windows(2)
                    .any(|pair| pair[0].offset_milli >= pair[1].offset_milli)
            {
                return Err(AnimationError::InvalidDescriptor);
            }
        }
        AnimationCurve::Spring {
            stiffness_milli,
            damping_milli,
            mass_milli,
            duration_millis,
            ..
        } => {
            if *stiffness_milli == 0
                || *damping_milli == 0
                || *mass_milli == 0
                || *duration_millis == 0
            {
                return Err(AnimationError::InvalidDescriptor);
            }
        }
    }
    Ok(())
}

fn valid_easing(easing: Easing) -> bool {
    match easing {
        Easing::CubicBezier {
            x1_milli, x2_milli, ..
        } => x1_milli <= 1000 && x2_milli <= 1000,
        _ => true,
    }
}

fn sample_descriptor(
    descriptor: &AnimationDescriptor,
    elapsed_millis: u64,
) -> Result<(i64, bool), AnimationError> {
    if elapsed_millis < descriptor.delay_millis {
        return Ok((initial_value(&descriptor.curve), false));
    }
    let elapsed = elapsed_millis - descriptor.delay_millis;
    match &descriptor.curve {
        AnimationCurve::Transition {
            from_milli,
            to_milli,
            duration_millis,
            easing,
        } => {
            let progress = progress_million(elapsed, *duration_millis)?;
            let eased = ease(progress, *easing);
            Ok((
                interpolate(*from_milli, *to_milli, eased)?,
                elapsed >= *duration_millis,
            ))
        }
        AnimationCurve::Keyframes {
            frames,
            duration_millis,
        } => {
            let progress = progress_million(elapsed, *duration_millis)?;
            let offset = (progress / 1000) as u16;
            let pair = frames
                .windows(2)
                .find(|pair| offset <= pair[1].offset_milli)
                .unwrap_or_else(|| &frames[frames.len() - 2..]);
            let span = u64::from(pair[1].offset_milli - pair[0].offset_milli);
            let local = u64::from(offset.saturating_sub(pair[0].offset_milli))
                .saturating_mul(1_000_000)
                / span;
            Ok((
                interpolate(pair[0].value_milli, pair[1].value_milli, local)?,
                elapsed >= *duration_millis,
            ))
        }
        AnimationCurve::Spring {
            from_milli,
            to_milli,
            duration_millis,
            ..
        } => {
            let progress = progress_million(elapsed, *duration_millis)?;
            let smooth = progress
                .saturating_mul(progress)
                .saturating_mul(3_000_000_u64.saturating_sub(2 * progress))
                / 1_000_000
                / 1_000_000;
            Ok((
                interpolate(*from_milli, *to_milli, smooth)?,
                elapsed >= *duration_millis,
            ))
        }
    }
}

fn initial_value(curve: &AnimationCurve) -> i64 {
    match curve {
        AnimationCurve::Transition { from_milli, .. }
        | AnimationCurve::Spring { from_milli, .. } => *from_milli,
        AnimationCurve::Keyframes { frames, .. } => frames[0].value_milli,
    }
}

fn progress_million(elapsed: u64, duration: u64) -> Result<u64, AnimationError> {
    elapsed
        .min(duration)
        .checked_mul(1_000_000)
        .map(|value| value / duration)
        .ok_or(AnimationError::TimeOverflow)
}

fn ease(progress: u64, easing: Easing) -> u64 {
    match easing {
        Easing::Linear | Easing::CubicBezier { .. } => progress,
        Easing::EaseIn => progress.saturating_mul(progress) / 1_000_000,
        Easing::EaseOut => {
            let inverse = 1_000_000 - progress;
            1_000_000 - inverse.saturating_mul(inverse) / 1_000_000
        }
        Easing::EaseInOut => {
            if progress < 500_000 {
                2 * progress.saturating_mul(progress) / 1_000_000
            } else {
                let inverse = 1_000_000 - progress;
                1_000_000 - 2 * inverse.saturating_mul(inverse) / 1_000_000
            }
        }
    }
}

fn interpolate(from: i64, to: i64, progress: u64) -> Result<i64, AnimationError> {
    let delta = i128::from(to) - i128::from(from);
    let value = i128::from(from) + delta * i128::from(progress) / 1_000_000;
    i64::try_from(value).map_err(|_| AnimationError::TimeOverflow)
}
