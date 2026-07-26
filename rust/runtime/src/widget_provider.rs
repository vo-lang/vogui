use std::collections::{BTreeMap, BTreeSet};

use vogui_protocol::v2::{EventToken, Handle, NodeId, UiRootId, UiSessionId};

#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct WidgetKindId(pub u64);

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum WidgetProviderPlacement {
    RendererLocal,
    Remote,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum WidgetFaultPolicy {
    Placeholder,
    FreezeRoot,
    RestartProvider,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WidgetKindSchema {
    pub kind: WidgetKindId,
    pub min_schema_revision: u32,
    pub max_schema_revision: u32,
    pub supports_measure: bool,
    pub supports_semantics: bool,
    pub interactive: bool,
    pub initial_role: String,
    pub initial_name: String,
    pub event_kinds: BTreeSet<u64>,
    pub fault_policy: WidgetFaultPolicy,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WidgetProviderDescriptor {
    pub provider: Handle,
    pub placement: WidgetProviderPlacement,
    pub schema_revision: u32,
    pub kinds: Vec<WidgetKindSchema>,
}

#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct WidgetInstanceHandle {
    pub session: UiSessionId,
    pub root: UiRootId,
    pub handle: Handle,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WidgetCreate {
    pub instance: WidgetInstanceHandle,
    pub kind: WidgetKindId,
    pub node: NodeId,
    pub props_revision: u64,
    pub props: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WidgetApplyProps {
    pub instance: WidgetInstanceHandle,
    pub base_props_revision: u64,
    pub new_props_revision: u64,
    pub change_bitmap: Vec<u8>,
    pub props: Vec<u8>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct WidgetConstraints {
    pub min_width: u32,
    pub min_height: u32,
    pub max_width: u32,
    pub max_height: u32,
}

impl WidgetConstraints {
    pub const fn is_valid(self) -> bool {
        self.min_width <= self.max_width && self.min_height <= self.max_height
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct WidgetMeasureRequest {
    pub instance: WidgetInstanceHandle,
    pub request_id: u64,
    pub constraints: WidgetConstraints,
    pub metrics_revision: u64,
    pub props_revision: u64,
    pub deadline_millis: u64,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct WidgetMeasuredSize {
    pub width: u32,
    pub height: u32,
    pub baseline: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct WidgetMeasureResult {
    pub instance: WidgetInstanceHandle,
    pub request_id: u64,
    pub metrics_revision: u64,
    pub props_revision: u64,
    pub layout_revision: u64,
    pub size: WidgetMeasuredSize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WidgetSemanticsSnapshot {
    pub instance: WidgetInstanceHandle,
    pub props_revision: u64,
    pub semantic_revision: u64,
    pub bytes: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProviderEvent {
    pub instance: WidgetInstanceHandle,
    pub ui_root_epoch: u32,
    pub app_code_epoch: u64,
    pub renderer_generation: Handle,
    pub props_revision: u64,
    pub provider_sequence: u64,
    pub widget_event_kind: u64,
    pub payload: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WrappedWidgetEvent {
    pub root: UiRootId,
    pub ui_root_epoch: u32,
    pub app_code_epoch: u64,
    pub applied_revision: u64,
    pub event_token: EventToken,
    pub sequence: u64,
    pub payload: Vec<u8>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct WidgetFault {
    pub instance: WidgetInstanceHandle,
    pub node: NodeId,
    pub policy: WidgetFaultPolicy,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct WidgetProviderConfig {
    pub max_instances: usize,
    pub max_props_bytes: usize,
    pub max_change_bitmap_bytes: usize,
    pub max_event_payload_bytes: usize,
    pub max_pending_measures: usize,
    pub max_semantics_bytes: usize,
    pub max_schema_label_bytes: usize,
}

impl Default for WidgetProviderConfig {
    fn default() -> Self {
        Self {
            max_instances: 4096,
            max_props_bytes: 1024 * 1024,
            max_change_bitmap_bytes: 64 * 1024,
            max_event_payload_bytes: 1024 * 1024,
            max_pending_measures: 4096,
            max_semantics_bytes: 4 * 1024 * 1024,
            max_schema_label_bytes: 1024,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum WidgetProviderError {
    InvalidConfig,
    InvalidDescriptor,
    DuplicateKind,
    UnsupportedKind,
    InvalidIdentity,
    InstanceCapacity,
    UnknownInstance,
    StaleInstance,
    PropsRevisionMismatch,
    PropsCapacity,
    ChangeBitmapCapacity,
    UnsupportedMeasure,
    MeasureCapacity,
    UnknownMeasure,
    StaleMeasure,
    MeasureDeadline,
    InvalidMeasure,
    UnsupportedSemantics,
    SemanticsCapacity,
    StaleSemantics,
    ProviderSequence,
    UnknownEventKind,
    EventCapacity,
    StaleRootEpoch,
    StaleAppCodeEpoch,
    StaleRenderer,
    GenerationExhausted,
}

#[derive(Debug)]
struct WidgetInstance {
    root: UiRootId,
    ui_root_epoch: u32,
    app_code_epoch: u64,
    node: NodeId,
    kind: WidgetKindId,
    props_revision: u64,
    props: Vec<u8>,
    event_bindings: BTreeMap<u64, EventToken>,
    provider_sequence: u64,
    measured: Option<WidgetMeasureResult>,
    semantics: Option<WidgetSemanticsSnapshot>,
}

pub struct WidgetProviderRuntime {
    session: UiSessionId,
    renderer_generation: Handle,
    descriptor: WidgetProviderDescriptor,
    schemas: BTreeMap<WidgetKindId, WidgetKindSchema>,
    config: WidgetProviderConfig,
    instances: Vec<Option<WidgetInstance>>,
    generations: Vec<u32>,
    free: BTreeSet<u32>,
    live: usize,
    next_measure_request: u64,
    pending_measures: BTreeMap<u64, WidgetMeasureRequest>,
}

impl WidgetProviderRuntime {
    pub fn new(
        session: UiSessionId,
        renderer_generation: Handle,
        descriptor: WidgetProviderDescriptor,
        config: WidgetProviderConfig,
    ) -> Result<Self, WidgetProviderError> {
        validate_config(session, renderer_generation, &descriptor, config)?;
        let mut schemas = BTreeMap::new();
        for schema in &descriptor.kinds {
            validate_schema(schema, descriptor.schema_revision, config)?;
            if schemas.insert(schema.kind, schema.clone()).is_some() {
                return Err(WidgetProviderError::DuplicateKind);
            }
        }
        Ok(Self {
            session,
            renderer_generation,
            descriptor,
            schemas,
            config,
            instances: Vec::new(),
            generations: Vec::new(),
            free: BTreeSet::new(),
            live: 0,
            next_measure_request: 1,
            pending_measures: BTreeMap::new(),
        })
    }

    pub fn create(
        &mut self,
        root: UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        node: NodeId,
        kind: WidgetKindId,
        props_revision: u64,
        props: Vec<u8>,
        event_bindings: BTreeMap<u64, EventToken>,
    ) -> Result<WidgetCreate, WidgetProviderError> {
        let schema = self
            .schemas
            .get(&kind)
            .ok_or(WidgetProviderError::UnsupportedKind)?;
        if !root.is_valid()
            || !node.is_valid()
            || ui_root_epoch == 0
            || app_code_epoch == 0
            || props_revision == 0
            || props.len() > self.config.max_props_bytes
            || event_bindings
                .keys()
                .any(|event_kind| !schema.event_kinds.contains(event_kind))
            || event_bindings.values().any(|token| !token.is_valid())
        {
            return Err(WidgetProviderError::InvalidIdentity);
        }
        if self.live == self.config.max_instances {
            return Err(WidgetProviderError::InstanceCapacity);
        }
        let index = if let Some(index) = self.free.pop_first() {
            index
        } else {
            let index = self.instances.len() as u32;
            self.instances.push(None);
            self.generations.push(1);
            index
        };
        let instance = WidgetInstanceHandle {
            session: self.session,
            root,
            handle: Handle {
                index,
                generation: self.generations[index as usize],
            },
        };
        self.instances[index as usize] = Some(WidgetInstance {
            root,
            ui_root_epoch,
            app_code_epoch,
            node,
            kind,
            props_revision,
            props: props.clone(),
            event_bindings,
            provider_sequence: 0,
            measured: None,
            semantics: None,
        });
        self.live += 1;
        Ok(WidgetCreate {
            instance,
            kind,
            node,
            props_revision,
            props,
        })
    }

    pub fn apply_props(
        &mut self,
        instance: WidgetInstanceHandle,
        base_props_revision: u64,
        change_bitmap: Vec<u8>,
        props: Vec<u8>,
        event_bindings: BTreeMap<u64, EventToken>,
    ) -> Result<WidgetApplyProps, WidgetProviderError> {
        if props.len() > self.config.max_props_bytes {
            return Err(WidgetProviderError::PropsCapacity);
        }
        if change_bitmap.is_empty() || change_bitmap.len() > self.config.max_change_bitmap_bytes {
            return Err(WidgetProviderError::ChangeBitmapCapacity);
        }
        let record = self.instance(instance)?;
        let schema = &self.schemas[&record.kind];
        if base_props_revision != record.props_revision
            || event_bindings
                .keys()
                .any(|event_kind| !schema.event_kinds.contains(event_kind))
            || event_bindings.values().any(|token| !token.is_valid())
        {
            return Err(WidgetProviderError::PropsRevisionMismatch);
        }
        let new_props_revision = base_props_revision
            .checked_add(1)
            .ok_or(WidgetProviderError::GenerationExhausted)?;
        let record = self.instance_mut(instance)?;
        record.props_revision = new_props_revision;
        record.props = props.clone();
        record.event_bindings = event_bindings;
        record.measured = None;
        record.semantics = None;
        Ok(WidgetApplyProps {
            instance,
            base_props_revision,
            new_props_revision,
            change_bitmap,
            props,
        })
    }

    pub fn begin_measure(
        &mut self,
        instance: WidgetInstanceHandle,
        constraints: WidgetConstraints,
        metrics_revision: u64,
        deadline_millis: u64,
    ) -> Result<WidgetMeasureRequest, WidgetProviderError> {
        let record = self.instance(instance)?;
        if !self.schemas[&record.kind].supports_measure {
            return Err(WidgetProviderError::UnsupportedMeasure);
        }
        if !constraints.is_valid() || metrics_revision == 0 {
            return Err(WidgetProviderError::InvalidMeasure);
        }
        if self.pending_measures.len() == self.config.max_pending_measures {
            return Err(WidgetProviderError::MeasureCapacity);
        }
        let props_revision = record.props_revision;
        let request_id = self.next_measure_request;
        self.next_measure_request = request_id
            .checked_add(1)
            .ok_or(WidgetProviderError::GenerationExhausted)?;
        let request = WidgetMeasureRequest {
            instance,
            request_id,
            constraints,
            metrics_revision,
            props_revision,
            deadline_millis,
        };
        self.pending_measures.insert(request_id, request);
        Ok(request)
    }

    pub fn complete_measure(
        &mut self,
        result: WidgetMeasureResult,
        now_millis: u64,
    ) -> Result<(), WidgetProviderError> {
        let request = self
            .pending_measures
            .get(&result.request_id)
            .copied()
            .ok_or(WidgetProviderError::UnknownMeasure)?;
        if request.instance != result.instance
            || request.metrics_revision != result.metrics_revision
            || request.props_revision != result.props_revision
        {
            return Err(WidgetProviderError::StaleMeasure);
        }
        if now_millis > request.deadline_millis {
            self.pending_measures.remove(&result.request_id);
            return Err(WidgetProviderError::MeasureDeadline);
        }
        if result.layout_revision == 0
            || result.size.width < request.constraints.min_width
            || result.size.width > request.constraints.max_width
            || result.size.height < request.constraints.min_height
            || result.size.height > request.constraints.max_height
            || result.size.baseline > result.size.height
        {
            return Err(WidgetProviderError::InvalidMeasure);
        }
        let record = self.instance(result.instance)?;
        if record.props_revision != result.props_revision
            || record
                .measured
                .is_some_and(|current| current.layout_revision >= result.layout_revision)
        {
            return Err(WidgetProviderError::StaleMeasure);
        }
        self.pending_measures.remove(&result.request_id);
        self.instance_mut(result.instance)?.measured = Some(result);
        Ok(())
    }

    pub fn apply_semantics(
        &mut self,
        snapshot: WidgetSemanticsSnapshot,
    ) -> Result<(), WidgetProviderError> {
        if snapshot.bytes.len() > self.config.max_semantics_bytes {
            return Err(WidgetProviderError::SemanticsCapacity);
        }
        let record = self.instance(snapshot.instance)?;
        if !self.schemas[&record.kind].supports_semantics {
            return Err(WidgetProviderError::UnsupportedSemantics);
        }
        if snapshot.props_revision != record.props_revision
            || snapshot.semantic_revision == 0
            || record
                .semantics
                .as_ref()
                .is_some_and(|current| current.semantic_revision >= snapshot.semantic_revision)
        {
            return Err(WidgetProviderError::StaleSemantics);
        }
        let instance = snapshot.instance;
        self.instance_mut(instance)?.semantics = Some(snapshot);
        Ok(())
    }

    pub fn provider_event(
        &mut self,
        event: ProviderEvent,
        applied_revision: u64,
        return_sequence: u64,
    ) -> Result<WrappedWidgetEvent, WidgetProviderError> {
        if event.payload.len() > self.config.max_event_payload_bytes {
            return Err(WidgetProviderError::EventCapacity);
        }
        if event.renderer_generation != self.renderer_generation || return_sequence == 0 {
            return Err(WidgetProviderError::StaleRenderer);
        }
        let record = self.instance(event.instance)?;
        if event.ui_root_epoch != record.ui_root_epoch {
            return Err(WidgetProviderError::StaleRootEpoch);
        }
        if event.app_code_epoch != record.app_code_epoch {
            return Err(WidgetProviderError::StaleAppCodeEpoch);
        }
        if event.props_revision != record.props_revision {
            return Err(WidgetProviderError::PropsRevisionMismatch);
        }
        if record.provider_sequence.checked_add(1) != Some(event.provider_sequence) {
            return Err(WidgetProviderError::ProviderSequence);
        }
        let event_token = record
            .event_bindings
            .get(&event.widget_event_kind)
            .copied()
            .ok_or(WidgetProviderError::UnknownEventKind)?;
        let root = record.root;
        self.instance_mut(event.instance)?.provider_sequence = event.provider_sequence;
        Ok(WrappedWidgetEvent {
            root,
            ui_root_epoch: event.ui_root_epoch,
            app_code_epoch: event.app_code_epoch,
            applied_revision,
            event_token,
            sequence: return_sequence,
            payload: event.payload,
        })
    }

    pub fn dispose(&mut self, instance: WidgetInstanceHandle) -> Result<(), WidgetProviderError> {
        let index = self.instance_index(instance)?;
        self.generations[index] = self.generations[index]
            .checked_add(1)
            .ok_or(WidgetProviderError::GenerationExhausted)?;
        self.instances[index] = None;
        self.free.insert(index as u32);
        self.live -= 1;
        self.pending_measures
            .retain(|_, request| request.instance != instance);
        Ok(())
    }

    pub fn restart_renderer(
        &mut self,
        renderer_generation: Handle,
    ) -> Result<Vec<WidgetInstanceHandle>, WidgetProviderError> {
        if !renderer_generation.is_valid()
            || renderer_generation.index != self.renderer_generation.index
            || renderer_generation.generation <= self.renderer_generation.generation
        {
            return Err(WidgetProviderError::StaleRenderer);
        }
        let instances = self
            .instances
            .iter()
            .enumerate()
            .filter_map(|(index, record)| {
                record.as_ref().map(|record| WidgetInstanceHandle {
                    session: self.session,
                    root: record.root,
                    handle: Handle {
                        index: index as u32,
                        generation: self.generations[index],
                    },
                })
            })
            .collect::<Vec<_>>();
        self.renderer_generation = renderer_generation;
        self.pending_measures.clear();
        for record in self.instances.iter_mut().flatten() {
            record.provider_sequence = 0;
            record.measured = None;
            record.semantics = None;
        }
        Ok(instances)
    }

    pub fn provider_fault(&self) -> Vec<WidgetFault> {
        self.instances
            .iter()
            .enumerate()
            .filter_map(|(index, record)| {
                let record = record.as_ref()?;
                Some(WidgetFault {
                    instance: WidgetInstanceHandle {
                        session: self.session,
                        root: record.root,
                        handle: Handle {
                            index: index as u32,
                            generation: self.generations[index],
                        },
                    },
                    node: record.node,
                    policy: self.schemas[&record.kind].fault_policy,
                })
            })
            .collect()
    }

    pub fn descriptor(&self) -> &WidgetProviderDescriptor {
        &self.descriptor
    }

    pub fn instance_node(
        &self,
        instance: WidgetInstanceHandle,
    ) -> Result<NodeId, WidgetProviderError> {
        Ok(self.instance(instance)?.node)
    }

    fn instance(
        &self,
        instance: WidgetInstanceHandle,
    ) -> Result<&WidgetInstance, WidgetProviderError> {
        let index = self.instance_index(instance)?;
        let record = self.instances[index]
            .as_ref()
            .ok_or(WidgetProviderError::UnknownInstance)?;
        if record.root != instance.root {
            return Err(WidgetProviderError::InvalidIdentity);
        }
        Ok(record)
    }

    fn instance_mut(
        &mut self,
        instance: WidgetInstanceHandle,
    ) -> Result<&mut WidgetInstance, WidgetProviderError> {
        let index = self.instance_index(instance)?;
        let record = self.instances[index]
            .as_mut()
            .ok_or(WidgetProviderError::UnknownInstance)?;
        if record.root != instance.root {
            return Err(WidgetProviderError::InvalidIdentity);
        }
        Ok(record)
    }

    fn instance_index(&self, instance: WidgetInstanceHandle) -> Result<usize, WidgetProviderError> {
        if instance.session != self.session
            || !instance.root.is_valid()
            || !instance.handle.is_valid()
        {
            return Err(WidgetProviderError::InvalidIdentity);
        }
        let index = instance.handle.index as usize;
        if self.generations.get(index).copied() != Some(instance.handle.generation) {
            return Err(WidgetProviderError::StaleInstance);
        }
        Ok(index)
    }
}

fn validate_config(
    session: UiSessionId,
    renderer_generation: Handle,
    descriptor: &WidgetProviderDescriptor,
    config: WidgetProviderConfig,
) -> Result<(), WidgetProviderError> {
    if !session.is_valid()
        || !renderer_generation.is_valid()
        || !descriptor.provider.is_valid()
        || descriptor.schema_revision == 0
        || descriptor.kinds.is_empty()
        || config.max_instances == 0
        || config.max_instances > u32::MAX as usize
        || config.max_props_bytes == 0
        || config.max_change_bitmap_bytes == 0
        || config.max_event_payload_bytes == 0
        || config.max_pending_measures == 0
        || config.max_semantics_bytes == 0
        || config.max_schema_label_bytes == 0
    {
        return Err(WidgetProviderError::InvalidConfig);
    }
    Ok(())
}

fn validate_schema(
    schema: &WidgetKindSchema,
    selected_revision: u32,
    config: WidgetProviderConfig,
) -> Result<(), WidgetProviderError> {
    if schema.kind.0 == 0
        || schema.min_schema_revision == 0
        || schema.min_schema_revision > schema.max_schema_revision
        || selected_revision < schema.min_schema_revision
        || selected_revision > schema.max_schema_revision
        || schema.initial_role.is_empty()
        || schema.initial_role.len() > config.max_schema_label_bytes
        || schema.initial_name.len() > config.max_schema_label_bytes
        || schema.event_kinds.contains(&0)
        || schema.interactive && schema.event_kinds.is_empty()
    {
        return Err(WidgetProviderError::InvalidDescriptor);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn handle(index: u32, generation: u32) -> Handle {
        Handle { index, generation }
    }

    fn runtime() -> WidgetProviderRuntime {
        WidgetProviderRuntime::new(
            handle(1, 1),
            handle(2, 1),
            WidgetProviderDescriptor {
                provider: handle(3, 1),
                placement: WidgetProviderPlacement::RendererLocal,
                schema_revision: 1,
                kinds: vec![WidgetKindSchema {
                    kind: WidgetKindId(10),
                    min_schema_revision: 1,
                    max_schema_revision: 1,
                    supports_measure: true,
                    supports_semantics: true,
                    interactive: true,
                    initial_role: "button".to_owned(),
                    initial_name: "chart".to_owned(),
                    event_kinds: BTreeSet::from([7]),
                    fault_policy: WidgetFaultPolicy::Placeholder,
                }],
            },
            WidgetProviderConfig::default(),
        )
        .unwrap()
    }

    fn create(runtime: &mut WidgetProviderRuntime) -> WidgetCreate {
        runtime
            .create(
                handle(4, 1),
                5,
                6,
                handle(5, 1),
                WidgetKindId(10),
                1,
                vec![1],
                BTreeMap::from([(7, handle(6, 1))]),
            )
            .unwrap()
    }

    #[test]
    fn props_revision_invalidates_pending_measure_and_dispose_rejects_stale_instance() {
        let mut runtime = runtime();
        let created = create(&mut runtime);
        let request = runtime
            .begin_measure(
                created.instance,
                WidgetConstraints {
                    min_width: 1,
                    min_height: 1,
                    max_width: 100,
                    max_height: 100,
                },
                1,
                100,
            )
            .unwrap();
        runtime
            .apply_props(
                created.instance,
                1,
                vec![1],
                vec![2],
                BTreeMap::from([(7, handle(6, 1))]),
            )
            .unwrap();
        assert_eq!(
            runtime.complete_measure(
                WidgetMeasureResult {
                    instance: created.instance,
                    request_id: request.request_id,
                    metrics_revision: 1,
                    props_revision: 1,
                    layout_revision: 1,
                    size: WidgetMeasuredSize {
                        width: 10,
                        height: 10,
                        baseline: 8,
                    },
                },
                50,
            ),
            Err(WidgetProviderError::StaleMeasure)
        );

        runtime.dispose(created.instance).unwrap();
        assert_eq!(
            runtime.instance_node(created.instance),
            Err(WidgetProviderError::StaleInstance)
        );
        let replacement = create(&mut runtime);
        assert_eq!(
            replacement.instance.handle.index,
            created.instance.handle.index
        );
        assert!(replacement.instance.handle.generation > created.instance.handle.generation);
    }

    #[test]
    fn provider_events_are_epoch_generation_and_sequence_scoped() {
        let mut runtime = runtime();
        let created = create(&mut runtime);
        let event = ProviderEvent {
            instance: created.instance,
            ui_root_epoch: 5,
            app_code_epoch: 6,
            renderer_generation: handle(2, 1),
            props_revision: 1,
            provider_sequence: 1,
            widget_event_kind: 7,
            payload: vec![9],
        };
        let wrapped = runtime.provider_event(event.clone(), 8, 9).unwrap();
        assert_eq!(wrapped.event_token, handle(6, 1));
        assert_eq!(
            runtime.provider_event(event.clone(), 8, 10),
            Err(WidgetProviderError::ProviderSequence)
        );

        runtime.restart_renderer(handle(2, 2)).unwrap();
        let mut restarted = event;
        restarted.renderer_generation = handle(2, 2);
        assert!(runtime.provider_event(restarted, 8, 11).is_ok());
        assert_eq!(
            runtime.provider_fault()[0].policy,
            WidgetFaultPolicy::Placeholder
        );
    }
}
