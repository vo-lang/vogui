use std::collections::{BTreeMap, VecDeque};

use vogui_protocol::v2::UiRootId;

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum UiPerformanceOperation {
    Init,
    Update,
    ViewBuild,
    SubscriptionBuild,
    Reconcile,
    PatchEncode,
    PresentationQueue,
    ReturnDispatch,
    Layout,
    Paint,
    RendererApply,
    Reload,
    Shutdown,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiPerformanceConfig {
    pub max_samples: usize,
}

impl Default for UiPerformanceConfig {
    fn default() -> Self {
        Self {
            max_samples: 16_384,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiPerformanceMeasurement {
    pub operation: UiPerformanceOperation,
    pub root: Option<UiRootId>,
    pub revision: u64,
    pub duration_nanos: u64,
    pub allocation_bytes: u64,
    pub lock_wait_nanos: u64,
    pub queue_items: usize,
    pub queue_bytes: usize,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiPerformanceSample {
    pub sequence: u64,
    pub measurement: UiPerformanceMeasurement,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct UiPerformanceAggregate {
    pub samples: u64,
    pub duration_nanos: u64,
    pub peak_duration_nanos: u64,
    pub allocation_bytes: u64,
    pub lock_wait_nanos: u64,
    pub peak_queue_items: usize,
    pub peak_queue_bytes: usize,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct UiPerformanceOwnerSnapshot {
    pub retained_samples: usize,
    pub dropped_samples: u64,
    pub next_sequence: u64,
    pub total_samples: u64,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct UiPerformanceSnapshot {
    pub owner: UiPerformanceOwnerSnapshot,
    pub samples: Vec<UiPerformanceSample>,
    pub aggregates: BTreeMap<UiPerformanceOperation, UiPerformanceAggregate>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiPerformanceError {
    InvalidConfig,
    InvalidMeasurement,
    SequenceExhausted,
}

pub struct UiPerformanceRecorder {
    config: UiPerformanceConfig,
    samples: VecDeque<UiPerformanceSample>,
    aggregates: BTreeMap<UiPerformanceOperation, UiPerformanceAggregate>,
    dropped_samples: u64,
    next_sequence: u64,
    total_samples: u64,
}

impl UiPerformanceRecorder {
    pub fn new(config: UiPerformanceConfig) -> Result<Self, UiPerformanceError> {
        if config.max_samples == 0 || config.max_samples > 1_000_000 {
            return Err(UiPerformanceError::InvalidConfig);
        }
        Ok(Self {
            config,
            samples: VecDeque::new(),
            aggregates: BTreeMap::new(),
            dropped_samples: 0,
            next_sequence: 1,
            total_samples: 0,
        })
    }

    pub fn record(
        &mut self,
        measurement: UiPerformanceMeasurement,
    ) -> Result<u64, UiPerformanceError> {
        if measurement.root.is_some_and(|root| !root.is_valid()) {
            return Err(UiPerformanceError::InvalidMeasurement);
        }
        let sequence = self.next_sequence;
        self.next_sequence = sequence
            .checked_add(1)
            .ok_or(UiPerformanceError::SequenceExhausted)?;
        if self.samples.len() == self.config.max_samples {
            self.samples.pop_front();
            self.dropped_samples = self.dropped_samples.saturating_add(1);
        }
        self.samples.push_back(UiPerformanceSample {
            sequence,
            measurement,
        });
        self.total_samples = self.total_samples.saturating_add(1);
        let aggregate = self.aggregates.entry(measurement.operation).or_default();
        aggregate.samples = aggregate.samples.saturating_add(1);
        aggregate.duration_nanos = aggregate
            .duration_nanos
            .saturating_add(measurement.duration_nanos);
        aggregate.peak_duration_nanos = aggregate
            .peak_duration_nanos
            .max(measurement.duration_nanos);
        aggregate.allocation_bytes = aggregate
            .allocation_bytes
            .saturating_add(measurement.allocation_bytes);
        aggregate.lock_wait_nanos = aggregate
            .lock_wait_nanos
            .saturating_add(measurement.lock_wait_nanos);
        aggregate.peak_queue_items = aggregate.peak_queue_items.max(measurement.queue_items);
        aggregate.peak_queue_bytes = aggregate.peak_queue_bytes.max(measurement.queue_bytes);
        Ok(sequence)
    }

    pub fn owner_snapshot(&self) -> UiPerformanceOwnerSnapshot {
        UiPerformanceOwnerSnapshot {
            retained_samples: self.samples.len(),
            dropped_samples: self.dropped_samples,
            next_sequence: self.next_sequence,
            total_samples: self.total_samples,
        }
    }

    pub fn snapshot_after(&self, sequence: u64, limit: usize) -> UiPerformanceSnapshot {
        UiPerformanceSnapshot {
            owner: self.owner_snapshot(),
            samples: self
                .samples
                .iter()
                .copied()
                .filter(|sample| sample.sequence > sequence)
                .take(limit)
                .collect(),
            aggregates: self.aggregates.clone(),
        }
    }

    pub fn take_snapshot(&mut self) -> UiPerformanceSnapshot {
        let snapshot = self.snapshot_after(0, usize::MAX);
        self.samples.clear();
        self.aggregates.clear();
        snapshot
    }
}
