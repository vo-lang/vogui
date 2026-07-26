use std::collections::{BTreeMap, VecDeque};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum UiFaultPoint {
    ProtocolDecode,
    PresentationQueue,
    WorkerDispatch,
    ResourceAcquire,
    SurfaceOperation,
    RendererOperation,
    DeviceOperation,
    AccessibilityOperation,
    Reload,
    Shutdown,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiInjectedFault {
    RejectBeforeDispatch,
    FailOwner,
    DropLatestOnly,
    OutcomeUnknown,
    SurfaceLost,
    RendererLost,
    DeviceLost,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiFaultRule {
    pub point: UiFaultPoint,
    pub fault: UiInjectedFault,
    pub skip: u64,
    pub every: u64,
    pub remaining: u64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiFaultInjectionError {
    InvalidRule,
    RuleCapacity,
    UnknownRule,
    Closed,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct UiFaultInjectionMetrics {
    pub installed_rules: usize,
    pub evaluated: u64,
    pub injected: u64,
    pub exhausted: u64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiFaultTraceEvent {
    pub sequence: u64,
    pub point: UiFaultPoint,
    pub fault: UiInjectedFault,
    pub visit: u64,
    pub remaining_after: u64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiFaultOwnerSnapshot {
    pub closed: bool,
    pub active_rules: usize,
    pub retained_trace_events: usize,
    pub dropped_trace_events: u64,
    pub next_trace_sequence: u64,
    pub metrics: UiFaultInjectionMetrics,
}

#[derive(Clone, Copy)]
struct ActiveRule {
    rule: UiFaultRule,
    visits: u64,
}

pub struct UiFaultInjector {
    max_rules: usize,
    rules: BTreeMap<UiFaultPoint, ActiveRule>,
    metrics: UiFaultInjectionMetrics,
    max_trace_events: usize,
    trace: VecDeque<UiFaultTraceEvent>,
    dropped_trace_events: u64,
    next_trace_sequence: u64,
    closed: bool,
}

impl UiFaultInjector {
    pub fn new(max_rules: usize) -> Self {
        Self::new_with_trace_capacity(max_rules, 1024)
    }

    pub fn new_with_trace_capacity(max_rules: usize, max_trace_events: usize) -> Self {
        Self {
            max_rules: max_rules.max(1),
            rules: BTreeMap::new(),
            metrics: UiFaultInjectionMetrics::default(),
            max_trace_events: max_trace_events.clamp(1, 1_000_000),
            trace: VecDeque::new(),
            dropped_trace_events: 0,
            next_trace_sequence: 1,
            closed: false,
        }
    }

    pub fn replace(&mut self, rule: UiFaultRule) -> Result<(), UiFaultInjectionError> {
        self.ensure_open()?;
        if rule.every == 0 || rule.remaining == 0 {
            return Err(UiFaultInjectionError::InvalidRule);
        }
        if !self.rules.contains_key(&rule.point) && self.rules.len() == self.max_rules {
            return Err(UiFaultInjectionError::RuleCapacity);
        }
        self.rules
            .insert(rule.point, ActiveRule { rule, visits: 0 });
        self.metrics.installed_rules = self.rules.len();
        Ok(())
    }

    pub fn remove(&mut self, point: UiFaultPoint) -> Result<UiFaultRule, UiFaultInjectionError> {
        self.ensure_open()?;
        let rule = self
            .rules
            .remove(&point)
            .map(|active| active.rule)
            .ok_or(UiFaultInjectionError::UnknownRule)?;
        self.metrics.installed_rules = self.rules.len();
        Ok(rule)
    }

    pub fn clear(&mut self) -> usize {
        let removed = self.rules.len();
        self.rules.clear();
        self.metrics.installed_rules = 0;
        removed
    }

    pub fn trigger(&mut self, point: UiFaultPoint) -> Option<UiInjectedFault> {
        if self.closed {
            return None;
        }
        self.metrics.evaluated = self.metrics.evaluated.saturating_add(1);
        let active = self.rules.get_mut(&point)?;
        active.visits = active.visits.saturating_add(1);
        if active.visits <= active.rule.skip {
            return None;
        }
        let eligible = active.visits - active.rule.skip - 1;
        if eligible % active.rule.every != 0 {
            return None;
        }
        let fault = active.rule.fault;
        active.rule.remaining -= 1;
        let visit = active.visits;
        let remaining_after = active.rule.remaining;
        self.metrics.injected = self.metrics.injected.saturating_add(1);
        if remaining_after == 0 {
            self.rules.remove(&point);
            self.metrics.installed_rules = self.rules.len();
            self.metrics.exhausted = self.metrics.exhausted.saturating_add(1);
        }
        self.push_trace(point, fault, visit, remaining_after);
        Some(fault)
    }

    pub const fn metrics(&self) -> UiFaultInjectionMetrics {
        self.metrics
    }

    pub fn owner_snapshot(&self) -> UiFaultOwnerSnapshot {
        UiFaultOwnerSnapshot {
            closed: self.closed,
            active_rules: self.rules.len(),
            retained_trace_events: self.trace.len(),
            dropped_trace_events: self.dropped_trace_events,
            next_trace_sequence: self.next_trace_sequence,
            metrics: self.metrics,
        }
    }

    pub fn trace_after(
        &self,
        sequence: u64,
        limit: usize,
    ) -> impl Iterator<Item = UiFaultTraceEvent> + '_ {
        self.trace
            .iter()
            .copied()
            .filter(move |event| event.sequence > sequence)
            .take(limit)
    }

    pub fn clear_trace(&mut self) -> usize {
        let removed = self.trace.len();
        self.trace.clear();
        removed
    }

    pub fn shutdown(&mut self) -> (usize, usize) {
        let rules = self.clear();
        let trace = self.clear_trace();
        self.closed = true;
        (rules, trace)
    }

    fn ensure_open(&self) -> Result<(), UiFaultInjectionError> {
        if self.closed {
            Err(UiFaultInjectionError::Closed)
        } else {
            Ok(())
        }
    }

    fn push_trace(
        &mut self,
        point: UiFaultPoint,
        fault: UiInjectedFault,
        visit: u64,
        remaining_after: u64,
    ) {
        if self.next_trace_sequence == u64::MAX {
            self.dropped_trace_events = self.dropped_trace_events.saturating_add(1);
            return;
        }
        if self.trace.len() == self.max_trace_events {
            self.trace.pop_front();
            self.dropped_trace_events = self.dropped_trace_events.saturating_add(1);
        }
        let sequence = self.next_trace_sequence;
        self.next_trace_sequence += 1;
        self.trace.push_back(UiFaultTraceEvent {
            sequence,
            point,
            fault,
            visit,
            remaining_after,
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deterministic_schedule_skips_repeats_and_exhausts_exactly() {
        let mut injector = UiFaultInjector::new(1);
        injector
            .replace(UiFaultRule {
                point: UiFaultPoint::RendererOperation,
                fault: UiInjectedFault::RendererLost,
                skip: 1,
                every: 2,
                remaining: 2,
            })
            .unwrap();

        assert_eq!(injector.trigger(UiFaultPoint::RendererOperation), None);
        assert_eq!(
            injector.trigger(UiFaultPoint::RendererOperation),
            Some(UiInjectedFault::RendererLost)
        );
        assert_eq!(injector.trigger(UiFaultPoint::RendererOperation), None);
        assert_eq!(
            injector.trigger(UiFaultPoint::RendererOperation),
            Some(UiInjectedFault::RendererLost)
        );
        assert_eq!(injector.trigger(UiFaultPoint::RendererOperation), None);
        assert_eq!(
            injector.metrics(),
            UiFaultInjectionMetrics {
                installed_rules: 0,
                evaluated: 5,
                injected: 2,
                exhausted: 1,
            }
        );
    }

    #[test]
    fn invalid_capacity_and_unknown_removal_fail_without_mutation() {
        let mut injector = UiFaultInjector::new(1);
        assert_eq!(
            injector.replace(UiFaultRule {
                point: UiFaultPoint::ProtocolDecode,
                fault: UiInjectedFault::RejectBeforeDispatch,
                skip: 0,
                every: 0,
                remaining: 1,
            }),
            Err(UiFaultInjectionError::InvalidRule)
        );
        injector
            .replace(UiFaultRule {
                point: UiFaultPoint::ProtocolDecode,
                fault: UiInjectedFault::RejectBeforeDispatch,
                skip: 0,
                every: 1,
                remaining: 1,
            })
            .unwrap();
        assert_eq!(
            injector.replace(UiFaultRule {
                point: UiFaultPoint::Shutdown,
                fault: UiInjectedFault::FailOwner,
                skip: 0,
                every: 1,
                remaining: 1,
            }),
            Err(UiFaultInjectionError::RuleCapacity)
        );
        assert_eq!(
            injector.remove(UiFaultPoint::Shutdown),
            Err(UiFaultInjectionError::UnknownRule)
        );
        assert_eq!(injector.metrics().installed_rules, 1);
    }
}
