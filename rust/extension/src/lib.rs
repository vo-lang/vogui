use core::ffi::c_void;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::panic::{catch_unwind, AssertUnwindSafe};

use vo_app_runtime::provider_abi::{
    CallerEndpointHandle, HostByteSpan, HostResourceHandle, ProviderFactoryTableV2,
    ProviderInstanceAbiV2, VoHostServicesV2, HOST_SERVICE_STATUS_OK,
    HOST_SERVICE_STATUS_WOULD_BLOCK, MAX_PROVIDER_PACKET_BYTES, PROVIDER_FACTORY_ABI_VERSION,
    PROVIDER_STATUS_INTERNAL_ERROR, PROVIDER_STATUS_INVALID_ARGUMENT,
    PROVIDER_STATUS_INVALID_STATE, PROVIDER_STATUS_OK,
};
use vo_ext::prelude::{vo_fn, ExternCallContext, ExternResult, HostEventReplaySource};

include!(concat!(env!("OUT_DIR"), "/provider_profile.rs"));

#[vo_fn("vogui", "TargetSession")]
fn target_session(call: &mut ExternCallContext) -> ExternResult {
    let Some(caller) = call.caller_endpoint_handle() else {
        return ExternResult::Panic(String::from(
            "Vogui target island has no valid App Runtime caller identity",
        ));
    };
    call.ret_u64(0, u64::from(caller.session_index));
    call.ret_u64(1, u64::from(caller.session_generation));
    call.ret_u64(2, caller.session_epoch);
    ExternResult::Ok
}

#[vo_fn("vogui", "TargetIdentity")]
fn target_identity(call: &mut ExternCallContext) -> ExternResult {
    let Some(caller) = call.caller_endpoint_handle() else {
        return ExternResult::Panic(String::from(
            "Vogui target island has no valid provider endpoint identity",
        ));
    };
    call.ret_u64(0, u64::from(caller.endpoint_index));
    call.ret_u64(1, u64::from(caller.endpoint_generation));
    ExternResult::Ok
}

#[vo_fn("vogui", "TargetInit")]
fn target_init(call: &mut ExternCallContext) -> ExternResult {
    if call.take_resume_host_event_token().is_some() {
        let response = call.take_resume_host_event_data().unwrap_or_default();
        if response.first().copied().unwrap_or(1) == 0 {
            call.ret_nil_error(0);
        } else {
            call.ret_error_msg(
                0,
                &String::from_utf8_lossy(response.get(1..).unwrap_or_default()),
            );
        }
        return ExternResult::Ok;
    }
    let model = call.arg_bytes(0);
    let effects = call.arg_bytes(1);
    let presentation = call.arg_bytes(2);
    let subscriptions = call.arg_bytes(3);
    let payload_len = b"vogui-target-init-v1\0"
        .len()
        .saturating_add(16)
        .saturating_add(model.len())
        .saturating_add(effects.len())
        .saturating_add(presentation.len())
        .saturating_add(subscriptions.len());
    if payload_len > 16 * 1024 * 1024
        || model.len() > u32::MAX as usize
        || effects.len() > u32::MAX as usize
        || presentation.len() > u32::MAX as usize
        || subscriptions.len() > u32::MAX as usize
    {
        call.ret_error_msg(0, "generated Vogui target state exceeds startup limit");
        return ExternResult::Ok;
    }
    let mut payload = Vec::with_capacity(payload_len);
    payload.extend_from_slice(b"vogui-target-init-v1\0");
    payload.extend_from_slice(&(model.len() as u32).to_le_bytes());
    payload.extend_from_slice(&(effects.len() as u32).to_le_bytes());
    payload.extend_from_slice(&(presentation.len() as u32).to_le_bytes());
    payload.extend_from_slice(&(subscriptions.len() as u32).to_le_bytes());
    payload.extend_from_slice(model);
    payload.extend_from_slice(effects);
    payload.extend_from_slice(presentation);
    payload.extend_from_slice(subscriptions);
    let token = call.next_host_event_token();
    match call.begin_host_request("vogui.target-init", &payload, token, 0) {
        Ok(_) => ExternResult::HostEventWaitAndReplay {
            token,
            source: HostEventReplaySource::Extension,
        },
        Err(status) => {
            call.ret_error_msg(
                0,
                &format!("App Runtime rejected Vogui target initialization with status {status}"),
            );
            ExternResult::Ok
        }
    }
}

#[vo_fn("vogui", "TargetNextTurn")]
fn target_next_turn(call: &mut ExternCallContext) -> ExternResult {
    if call.take_resume_host_event_token().is_some() {
        let response = call.take_resume_host_event_data().unwrap_or_default();
        if response.first().copied().unwrap_or(1) == 0 {
            call.ret_bytes(0, response.get(1..).unwrap_or_default());
            call.ret_nil_error(1);
        } else {
            call.ret_bytes(0, &[]);
            call.ret_error_msg(
                1,
                &String::from_utf8_lossy(response.get(1..).unwrap_or_default()),
            );
        }
        return ExternResult::Ok;
    }
    let token = call.next_host_event_token();
    match call.begin_host_request("vogui.target-next-turn", &[], token, 0) {
        Ok(_) => ExternResult::HostEventWaitAndReplay {
            token,
            source: HostEventReplaySource::Extension,
        },
        Err(status) => {
            call.ret_bytes(0, &[]);
            call.ret_error_msg(
                1,
                &format!("App Runtime rejected Vogui target turn wait with status {status}"),
            );
            ExternResult::Ok
        }
    }
}

#[vo_fn("vogui", "TargetCommit")]
fn target_commit(call: &mut ExternCallContext) -> ExternResult {
    if call.take_resume_host_event_token().is_some() {
        let response = call.take_resume_host_event_data().unwrap_or_default();
        if response.first().copied().unwrap_or(1) == 0 {
            call.ret_nil_error(0);
        } else {
            call.ret_error_msg(
                0,
                &String::from_utf8_lossy(response.get(1..).unwrap_or_default()),
            );
        }
        return ExternResult::Ok;
    }
    let model = call.arg_bytes(0);
    let update_result = call.arg_bytes(1);
    let effects = call.arg_bytes(2);
    let presentation = call.arg_bytes(3);
    let subscriptions = call.arg_bytes(4);
    let payload_len = b"vogui-target-commit-v1\0"
        .len()
        .saturating_add(20)
        .saturating_add(model.len())
        .saturating_add(update_result.len())
        .saturating_add(effects.len())
        .saturating_add(presentation.len())
        .saturating_add(subscriptions.len());
    if payload_len > 16 * 1024 * 1024
        || model.len() > u32::MAX as usize
        || update_result.len() > u32::MAX as usize
        || effects.len() > u32::MAX as usize
        || presentation.len() > u32::MAX as usize
        || subscriptions.len() > u32::MAX as usize
    {
        call.ret_error_msg(0, "generated Vogui commit exceeds provider limit");
        return ExternResult::Ok;
    }
    let mut payload = Vec::with_capacity(payload_len);
    payload.extend_from_slice(b"vogui-target-commit-v1\0");
    payload.extend_from_slice(&(model.len() as u32).to_le_bytes());
    payload.extend_from_slice(&(update_result.len() as u32).to_le_bytes());
    payload.extend_from_slice(&(effects.len() as u32).to_le_bytes());
    payload.extend_from_slice(&(presentation.len() as u32).to_le_bytes());
    payload.extend_from_slice(&(subscriptions.len() as u32).to_le_bytes());
    payload.extend_from_slice(model);
    payload.extend_from_slice(update_result);
    payload.extend_from_slice(effects);
    payload.extend_from_slice(presentation);
    payload.extend_from_slice(subscriptions);
    let token = call.next_host_event_token();
    match call.begin_host_request("vogui.target-commit", &payload, token, 0) {
        Ok(_) => ExternResult::HostEventWaitAndReplay {
            token,
            source: HostEventReplaySource::Extension,
        },
        Err(status) => {
            call.ret_error_msg(
                0,
                &format!("App Runtime rejected Vogui target commit with status {status}"),
            );
            ExternResult::Ok
        }
    }
}

#[vo_fn("vogui", "RunEntry")]
fn run_entry(call: &mut ExternCallContext) -> ExternResult {
    if call.take_resume_host_event_token().is_some() {
        let response = call.take_resume_host_event_data().unwrap_or_default();
        if response.first().copied().unwrap_or(0) == 0 {
            call.ret_nil_error(0);
        } else {
            call.ret_error_msg(0, &String::from_utf8_lossy(&response[1..]));
        }
        return ExternResult::Ok;
    }
    let descriptor = call.arg_bytes(0).to_vec();
    let init = call.arg_bytes(1).to_vec();
    if descriptor.len() != 172 || init.len() > 16 * 1024 * 1024 {
        call.ret_error_msg(0, "generated entry launch payload is invalid");
        return ExternResult::Ok;
    }
    let payload = entry_launch_payload(&descriptor, &init);
    let token = call.next_host_event_token();
    match call.begin_host_request("vogui.run-entry", &payload, token, 0) {
        Ok(_) => ExternResult::HostEventWaitAndReplay {
            token,
            source: HostEventReplaySource::Extension,
        },
        Err(status) => {
            call.ret_error_msg(
                0,
                &format!("App Runtime rejected generated entry request with status {status}"),
            );
            ExternResult::Ok
        }
    }
}

fn entry_launch_payload(descriptor: &[u8], init: &[u8]) -> Vec<u8> {
    let mut payload = Vec::with_capacity(27 + descriptor.len() + init.len());
    payload.extend_from_slice(b"vo-entry-launch-v1\0");
    payload.extend_from_slice(&(descriptor.len() as u32).to_le_bytes());
    payload.extend_from_slice(&(init.len() as u32).to_le_bytes());
    payload.extend_from_slice(descriptor);
    payload.extend_from_slice(init);
    payload
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum Phase {
    Created,
    Prepared,
    Running,
    Suspended,
    Closed,
}

struct ProviderState {
    role: u32,
    caller: CallerEndpointHandle,
    host: VoHostServicesV2,
    phase: Phase,
    ui_session: Option<vogui_runtime::UiSession>,
    ui_roots: BTreeMap<u64, vogui_protocol::v2::UiRootId>,
    surface_attached: BTreeSet<vogui_protocol::v2::UiRootId>,
    next_presentation_sequence: u64,
    event_bindings: BTreeMap<(u64, u64, u64), ProviderEventBinding>,
    ref_bindings: BTreeMap<(u64, u64), ProviderRefBinding>,
    resource_bindings: BTreeMap<u64, ProviderResourceBinding>,
    resource_leases: BTreeMap<(u64, u64, u64), ProviderResourceLease>,
    resource_fetches: BTreeMap<u64, vogui_runtime::resource::UiResourceFetchWork>,
    resource_publications: VecDeque<vogui_runtime::resource::UiResourcePublication>,
    next_resource_request_id: u64,
    effect_mappers: BTreeMap<u64, (u32, u32, Option<vogui_protocol::v2::UiRootId>)>,
    host_effects: BTreeSet<u64>,
    command_effects: BTreeMap<u64, u64>,
    subscription_mappers:
        BTreeMap<vogui_protocol::v2::Handle, (u32, Option<vogui_protocol::v2::UiRootId>)>,
    inbound_packets: VecDeque<Vec<u8>>,
    inbound_bytes: usize,
    pending_output: VecDeque<Vec<u8>>,
    pending_output_bytes: usize,
    pending_bind_events: BTreeMap<
        vogui_protocol::v2::UiRootId,
        Vec<vogui_runtime::target_presentation::TargetWireEventBinding>,
    >,
    pending_unbind_events:
        BTreeMap<vogui_protocol::v2::UiRootId, Vec<vogui_protocol::v2::EventToken>>,
    pending_bind_refs: BTreeMap<
        vogui_protocol::v2::UiRootId,
        Vec<vogui_runtime::target_presentation::TargetWireRefBinding>,
    >,
    pending_unbind_refs: BTreeMap<vogui_protocol::v2::UiRootId, Vec<vogui_protocol::v2::Handle>>,
    pending_attach_resources: BTreeMap<
        vogui_protocol::v2::UiRootId,
        Vec<vogui_runtime::target_presentation::TargetWireResourceBinding>,
    >,
    pending_detach_resources: BTreeMap<
        vogui_protocol::v2::UiRootId,
        Vec<(vogui_protocol::v2::NodeId, vogui_protocol::v2::Handle)>,
    >,
}

#[derive(Clone, Copy)]
struct ProviderEventBinding {
    node: vogui_protocol::v2::NodeId,
    mapper_id: u64,
    token: vogui_protocol::v2::EventToken,
}

#[derive(Clone, Copy)]
struct ProviderRefBinding {
    node: vogui_protocol::v2::NodeId,
    reference: vogui_runtime::UiNodeRef,
    binding_generation: u32,
}

#[derive(Clone, Debug)]
struct ProviderResourceBinding {
    descriptor: vogui_runtime::resource::UiResourceDescriptor,
    resource: vogui_runtime::resource::UiResourceId,
}

#[derive(Clone, Copy, Debug)]
struct ProviderResourceLease {
    lease: vogui_runtime::resource::UiResourceLease,
    node: vogui_protocol::v2::NodeId,
    source_revision: u64,
    commit_revision: u64,
}

#[derive(Clone, Debug)]
struct PreparedResourceBinding {
    descriptor: vogui_runtime::resource::UiResourceDescriptor,
    node: vogui_protocol::v2::NodeId,
}

struct PreparedBatchRoot {
    logical_root: u64,
    root: vogui_protocol::v2::UiRootId,
    view: vogui_runtime::tree::ViewNode,
    candidate_events: BTreeMap<(u64, u64, u64), (u64, vogui_protocol::v2::NodeId)>,
    candidate_refs: BTreeMap<(u64, u64), vogui_protocol::v2::NodeId>,
    candidate_resources: BTreeMap<(u64, u64, u64), PreparedResourceBinding>,
}

struct PreparedResourceReconcile {
    releases: Vec<((u64, u64, u64), ProviderResourceLease)>,
    unregisters: Vec<(u64, vogui_runtime::resource::UiResourceId)>,
    new_resources: BTreeMap<u64, vogui_runtime::resource::UiResourceDescriptor>,
    reloads: Vec<(
        u64,
        vogui_runtime::resource::UiResourceId,
        vogui_runtime::resource::UiResourceDescriptor,
    )>,
    existing_acquires: Vec<(
        (u64, u64, u64),
        vogui_protocol::v2::UiRootId,
        vogui_runtime::resource::UiResourceId,
        vogui_protocol::v2::NodeId,
    )>,
    new_resource_acquires: Vec<(
        (u64, u64, u64),
        vogui_protocol::v2::UiRootId,
        u64,
        vogui_protocol::v2::NodeId,
    )>,
    rebinds: Vec<(
        (u64, u64, u64),
        ProviderResourceLease,
        vogui_protocol::v2::NodeId,
    )>,
}

static PROVIDER_TABLE: ProviderFactoryTableV2 = ProviderFactoryTableV2 {
    struct_size: core::mem::size_of::<ProviderFactoryTableV2>() as u32,
    abi_version: PROVIDER_FACTORY_ABI_VERSION,
    factory_count: PROVIDER_FACTORIES.len() as u32,
    factories: PROVIDER_FACTORIES.as_ptr(),
};

#[no_mangle]
pub extern "C" fn vo_provider_factories_v2() -> *const ProviderFactoryTableV2 {
    &PROVIDER_TABLE
}

macro_rules! create_provider {
    ($name:ident, $role:expr) => {
        #[allow(dead_code)]
        unsafe extern "C" fn $name(
            host: *const VoHostServicesV2,
            caller: CallerEndpointHandle,
            out: *mut ProviderInstanceAbiV2,
        ) -> u32 {
            create($role, host, caller, out)
        }
    };
}

create_provider!(
    create_ui_logic_provider,
    vo_app_runtime::provider_abi::PROVIDER_ROLE_UI_LOGIC
);
create_provider!(
    create_ui_renderer_provider,
    vo_app_runtime::provider_abi::PROVIDER_ROLE_UI_RENDERER
);
create_provider!(
    create_surface_host_provider,
    vo_app_runtime::provider_abi::PROVIDER_ROLE_SURFACE_HOST
);
create_provider!(
    create_accessibility_provider,
    vo_app_runtime::provider_abi::PROVIDER_ROLE_ACCESSIBILITY
);
create_provider!(
    create_diagnostics_provider,
    vo_app_runtime::provider_abi::PROVIDER_ROLE_DIAGNOSTICS
);

fn create(
    role: u32,
    host: *const VoHostServicesV2,
    caller: CallerEndpointHandle,
    out: *mut ProviderInstanceAbiV2,
) -> u32 {
    if host.is_null() || out.is_null() || !caller.is_valid() {
        return PROVIDER_STATUS_INVALID_ARGUMENT;
    }
    let host = unsafe { *host };
    if host.validate().is_err() {
        return PROVIDER_STATUS_INVALID_ARGUMENT;
    }
    match catch_unwind(AssertUnwindSafe(|| {
        force_link_profile_closure();
        let context = Box::into_raw(Box::new(ProviderState {
            role,
            caller,
            host,
            phase: Phase::Created,
            ui_session: None,
            ui_roots: BTreeMap::new(),
            surface_attached: BTreeSet::new(),
            next_presentation_sequence: 1,
            event_bindings: BTreeMap::new(),
            ref_bindings: BTreeMap::new(),
            resource_bindings: BTreeMap::new(),
            resource_leases: BTreeMap::new(),
            resource_fetches: BTreeMap::new(),
            resource_publications: VecDeque::new(),
            next_resource_request_id: u64::MAX,
            effect_mappers: BTreeMap::new(),
            host_effects: BTreeSet::new(),
            command_effects: BTreeMap::new(),
            subscription_mappers: BTreeMap::new(),
            inbound_packets: VecDeque::new(),
            inbound_bytes: 0,
            pending_output: VecDeque::new(),
            pending_output_bytes: 0,
            pending_bind_events: BTreeMap::new(),
            pending_unbind_events: BTreeMap::new(),
            pending_bind_refs: BTreeMap::new(),
            pending_unbind_refs: BTreeMap::new(),
            pending_attach_resources: BTreeMap::new(),
            pending_detach_resources: BTreeMap::new(),
        }))
        .cast::<c_void>();
        unsafe {
            out.write(ProviderInstanceAbiV2 {
                struct_size: core::mem::size_of::<ProviderInstanceAbiV2>() as u32,
                context,
                prepare: Some(prepare),
                start: Some(start),
                suspend: Some(suspend),
                resume: Some(resume),
                dispatch_packet: Some(dispatch_packet),
                close: Some(close),
                destroy: Some(destroy),
            });
        }
    })) {
        Ok(()) => PROVIDER_STATUS_OK,
        Err(_) => PROVIDER_STATUS_INTERNAL_ERROR,
    }
}

unsafe extern "C" fn prepare(context: *mut c_void) -> u32 {
    abi_guard(|| {
        let state = unsafe { context.cast::<ProviderState>().as_mut() }
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        if state.phase != Phase::Created {
            return Err(PROVIDER_STATUS_INVALID_STATE);
        }
        if state.role == vo_app_runtime::provider_abi::PROVIDER_ROLE_UI_LOGIC {
            let mut session = vogui_runtime::UiSession::new(
                vogui_protocol::v2::Handle {
                    index: state.caller.session_index,
                    generation: state.caller.session_generation,
                },
                vogui_runtime::UiSessionConfig::default(),
            )
            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            let root = session
                .attach_root()
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            state.ui_session = Some(session);
            state.ui_roots.insert(1, root);
        }
        state.phase = Phase::Prepared;
        Ok(())
    })
}

unsafe extern "C" fn start(context: *mut c_void) -> u32 {
    abi_guard(|| {
        let state = unsafe { context.cast::<ProviderState>().as_mut() }
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        if state.phase != Phase::Prepared
            || (state.role == vo_app_runtime::provider_abi::PROVIDER_ROLE_UI_LOGIC
                && state.ui_session.is_none())
        {
            return Err(PROVIDER_STATUS_INVALID_STATE);
        }
        state.phase = Phase::Running;
        Ok(())
    })
}

unsafe extern "C" fn suspend(context: *mut c_void) -> u32 {
    transition(context, Phase::Running, Phase::Suspended)
}

unsafe extern "C" fn resume(context: *mut c_void) -> u32 {
    transition(context, Phase::Suspended, Phase::Running)
}

unsafe extern "C" fn dispatch_packet(context: *mut c_void, packet: HostByteSpan) -> u32 {
    abi_guard(|| {
        let state = unsafe { context.cast::<ProviderState>().as_mut() }
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        if state.phase != Phase::Running
            || packet.reserved != 0
            || packet.ptr.is_null()
            || packet.len == 0
            || packet.len as usize > MAX_PROVIDER_PACKET_BYTES
        {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        }
        let packet = unsafe { core::slice::from_raw_parts(packet.ptr, packet.len as usize) };
        if state.role == vo_app_runtime::provider_abi::PROVIDER_ROLE_UI_LOGIC {
            state.dispatch_ui_logic(packet)?;
            state.flush_pending_output()?;
            return Ok(());
        }
        if state.inbound_packets.len() == 4096 {
            return Err(PROVIDER_STATUS_INVALID_STATE);
        }
        vogui_protocol::v2::decode_packet(packet).map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let next_bytes = state
            .inbound_bytes
            .checked_add(packet.len())
            .filter(|bytes| *bytes <= 16 * 1024 * 1024)
            .ok_or(PROVIDER_STATUS_INVALID_STATE)?;
        state.inbound_packets.push_back(packet.to_vec());
        state.inbound_bytes = next_bytes;
        Ok(())
    })
}

unsafe extern "C" fn close(context: *mut c_void) -> u32 {
    abi_guard(|| {
        let state = unsafe { context.cast::<ProviderState>().as_mut() }
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        state.ui_session.take();
        state.ui_roots.clear();
        state.surface_attached.clear();
        state.event_bindings.clear();
        state.ref_bindings.clear();
        state.resource_bindings.clear();
        state.resource_leases.clear();
        state.resource_fetches.clear();
        state.resource_publications.clear();
        state.effect_mappers.clear();
        state.host_effects.clear();
        state.command_effects.clear();
        state.subscription_mappers.clear();
        state.inbound_packets.clear();
        state.inbound_bytes = 0;
        state.pending_output.clear();
        state.pending_output_bytes = 0;
        state.pending_bind_events.clear();
        state.pending_unbind_events.clear();
        state.pending_bind_refs.clear();
        state.pending_unbind_refs.clear();
        state.pending_attach_resources.clear();
        state.pending_detach_resources.clear();
        state.phase = Phase::Closed;
        Ok(())
    })
}

unsafe extern "C" fn destroy(context: *mut c_void) {
    let _ = catch_unwind(AssertUnwindSafe(|| {
        if !context.is_null() {
            drop(unsafe { Box::from_raw(context.cast::<ProviderState>()) });
        }
    }));
}

fn transition(context: *mut c_void, from: Phase, to: Phase) -> u32 {
    abi_guard(|| {
        let state = unsafe { context.cast::<ProviderState>().as_mut() }
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        if state.phase != from {
            return Err(PROVIDER_STATUS_INVALID_STATE);
        }
        state.phase = to;
        Ok(())
    })
}

impl ProviderState {
    fn prepare_resource_reconcile(
        &self,
        session: &vogui_runtime::UiSession,
        prepared: &[PreparedBatchRoot],
    ) -> Result<PreparedResourceReconcile, u32> {
        let updated_roots = prepared
            .iter()
            .map(|prepared| prepared.logical_root)
            .collect::<BTreeSet<_>>();
        let mut desired = BTreeMap::new();
        let mut desired_descriptors =
            BTreeMap::<u64, vogui_runtime::resource::UiResourceDescriptor>::new();
        for prepared in prepared {
            for (key, binding) in &prepared.candidate_resources {
                if desired.insert(*key, binding.clone()).is_some() {
                    return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                }
                match desired_descriptors.get(&key.1) {
                    Some(existing) if existing != &binding.descriptor => {
                        return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                    }
                    Some(_) => {}
                    None => {
                        desired_descriptors.insert(key.1, binding.descriptor.clone());
                    }
                }
            }
        }
        let reloads = desired_descriptors
            .iter()
            .filter_map(|(logical_resource, descriptor)| {
                let existing = self.resource_bindings.get(logical_resource)?;
                (existing.descriptor != *descriptor).then_some((
                    *logical_resource,
                    existing.resource,
                    descriptor.clone(),
                ))
            })
            .collect::<Vec<_>>();

        let releases = self
            .resource_leases
            .iter()
            .filter(|(key, _)| updated_roots.contains(&key.0) && !desired.contains_key(key))
            .map(|(key, lease)| (*key, *lease))
            .collect::<Vec<_>>();
        let mut existing_acquires = Vec::new();
        let mut new_resource_acquires = Vec::new();
        let mut rebinds = Vec::new();
        for (key, desired_binding) in &desired {
            if let Some(existing) = self.resource_leases.get(key) {
                if existing.node != desired_binding.node {
                    rebinds.push((*key, *existing, desired_binding.node));
                }
                continue;
            }
            let root = self
                .ui_roots
                .get(&key.0)
                .copied()
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
            if let Some(binding) = self.resource_bindings.get(&key.1) {
                existing_acquires.push((*key, root, binding.resource, desired_binding.node));
            } else {
                new_resource_acquires.push((*key, root, key.1, desired_binding.node));
            }
        }
        let new_resources = desired_descriptors
            .into_iter()
            .filter(|(logical_resource, _)| !self.resource_bindings.contains_key(logical_resource))
            .collect::<BTreeMap<_, _>>();
        if new_resource_acquires
            .iter()
            .any(|(_, _, logical_resource, _)| !new_resources.contains_key(logical_resource))
        {
            return Err(PROVIDER_STATUS_INTERNAL_ERROR);
        }

        let remaining_resource_ids = self
            .resource_leases
            .keys()
            .filter(|key| !updated_roots.contains(&key.0) || desired.contains_key(*key))
            .map(|key| key.1)
            .chain(desired.keys().map(|key| key.1))
            .collect::<BTreeSet<_>>();
        let unregisters = self
            .resource_bindings
            .iter()
            .filter(|(logical_resource, _)| !remaining_resource_ids.contains(logical_resource))
            .map(|(logical_resource, binding)| (*logical_resource, binding.resource))
            .collect::<Vec<_>>();
        let descriptors = new_resources.values().cloned().collect::<Vec<_>>();
        let reload_preflight = reloads
            .iter()
            .map(|(_, resource, descriptor)| (*resource, descriptor.clone()))
            .collect::<Vec<_>>();
        let acquire_preflight = existing_acquires
            .iter()
            .map(|(_, root, resource, _)| (*root, *resource))
            .collect::<Vec<_>>();
        let release_preflight = releases
            .iter()
            .map(|(_, lease)| lease.lease)
            .collect::<Vec<_>>();
        let unregister_preflight = unregisters
            .iter()
            .map(|(_, resource)| *resource)
            .collect::<Vec<_>>();
        session
            .preflight_resource_reconcile(
                &descriptors,
                &reload_preflight,
                &acquire_preflight,
                new_resource_acquires.len(),
                &release_preflight,
                &unregister_preflight,
            )
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        Ok(PreparedResourceReconcile {
            releases,
            unregisters,
            new_resources,
            reloads,
            existing_acquires,
            new_resource_acquires,
            rebinds,
        })
    }

    fn commit_resource_reconcile(
        &mut self,
        session: &mut vogui_runtime::UiSession,
        prepared: PreparedResourceReconcile,
    ) -> Result<(), u32> {
        for (key, lease) in prepared.releases {
            session
                .release_resource(lease.lease)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            self.resource_leases.remove(&key);
            self.pending_detach_resources
                .entry(lease.lease.root)
                .or_default()
                .push((lease.node, lease.lease.resource.handle));
            if !self
                .resource_leases
                .values()
                .any(|binding| binding.lease.resource == lease.lease.resource)
            {
                self.cancel_resource_fetches(lease.lease.resource)?;
            }
        }
        for (logical_resource, resource) in prepared.unregisters {
            session
                .unregister_resource(resource)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            self.resource_bindings.remove(&logical_resource);
        }
        for (logical_resource, descriptor) in prepared.new_resources {
            let resource = session
                .register_resource(descriptor.clone())
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            self.resource_bindings.insert(
                logical_resource,
                ProviderResourceBinding {
                    descriptor,
                    resource,
                },
            );
        }
        let mut reload_roots = BTreeSet::new();
        let mut reload_revisions = BTreeMap::new();
        for (logical_resource, resource, descriptor) in prepared.reloads {
            self.cancel_resource_fetches(resource)?;
            let source_revision = session
                .hot_reload_resource(resource, descriptor.clone(), u64::MAX)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            let binding = self
                .resource_bindings
                .get_mut(&logical_resource)
                .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
            binding.descriptor = descriptor;
            reload_revisions.insert(logical_resource, source_revision);
            for (key, lease) in &mut self.resource_leases {
                if key.1 != logical_resource {
                    continue;
                }
                lease.source_revision = source_revision;
                lease.commit_revision = session.commit_revision();
                reload_roots.insert(lease.lease.root);
                self.pending_attach_resources
                    .entry(lease.lease.root)
                    .or_default()
                    .push(
                        vogui_runtime::target_presentation::TargetWireResourceBinding {
                            node: lease.node,
                            resource: resource.handle,
                            source_revision,
                        },
                    );
            }
        }
        for (key, root, resource, node) in prepared.existing_acquires {
            let source_revision = reload_revisions.get(&key.1).copied().unwrap_or(1);
            let lease = session
                .acquire_resource(root, resource, u64::MAX)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            self.resource_leases.insert(
                key,
                ProviderResourceLease {
                    lease,
                    node,
                    source_revision,
                    commit_revision: session.commit_revision(),
                },
            );
            self.pending_attach_resources.entry(root).or_default().push(
                vogui_runtime::target_presentation::TargetWireResourceBinding {
                    node,
                    resource: resource.handle,
                    source_revision,
                },
            );
        }
        for (key, root, logical_resource, node) in prepared.new_resource_acquires {
            let resource = self
                .resource_bindings
                .get(&logical_resource)
                .map(|binding| binding.resource)
                .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
            let lease = session
                .acquire_resource(root, resource, u64::MAX)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            self.resource_leases.insert(
                key,
                ProviderResourceLease {
                    lease,
                    node,
                    source_revision: 1,
                    commit_revision: session.commit_revision(),
                },
            );
            self.pending_attach_resources.entry(root).or_default().push(
                vogui_runtime::target_presentation::TargetWireResourceBinding {
                    node,
                    resource: resource.handle,
                    source_revision: 1,
                },
            );
        }
        for (key, old, node) in prepared.rebinds {
            self.pending_detach_resources
                .entry(old.lease.root)
                .or_default()
                .push((old.node, old.lease.resource.handle));
            self.pending_attach_resources
                .entry(old.lease.root)
                .or_default()
                .push(
                    vogui_runtime::target_presentation::TargetWireResourceBinding {
                        node,
                        resource: old.lease.resource.handle,
                        source_revision: old.source_revision,
                    },
                );
            self.resource_leases.insert(
                key,
                ProviderResourceLease {
                    node,
                    commit_revision: session.commit_revision(),
                    ..old
                },
            );
        }
        if !reload_roots.is_empty() {
            session
                .commit_binding_changes_for_roots(reload_roots.into_iter().collect())
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            let revision = session.commit_revision();
            for lease in self.resource_leases.values_mut() {
                if self
                    .pending_attach_resources
                    .contains_key(&lease.lease.root)
                {
                    lease.commit_revision = revision;
                }
            }
        }
        Ok(())
    }

    fn dispatch_ui_logic(&mut self, packet: &[u8]) -> Result<(), u32> {
        let mut session = self
            .ui_session
            .take()
            .ok_or(PROVIDER_STATUS_INVALID_STATE)?;
        let result = if packet == b"vogui-host-renderer-restart-v1\0" {
            self.restart_ui_renderer_with_session(&mut session)
        } else if packet.starts_with(b"vogui-host-effect-result-v1\0") {
            self.dispatch_effect_result_with_session(&mut session, packet)
        } else if packet.starts_with(b"vogui-host-subscription-event-v1\0") {
            self.dispatch_subscription_event(packet)
        } else {
            match vogui_protocol::v2::decode_ui_return(packet) {
                Ok((header, returned)) => {
                    self.dispatch_ui_return_with_session(&mut session, header, returned)
                }
                Err(_) => self.dispatch_ui_logic_with_session(&mut session, packet),
            }
        };
        self.ui_session = Some(session);
        result
    }

    fn restart_ui_renderer_with_session(
        &mut self,
        session: &mut vogui_runtime::UiSession,
    ) -> Result<(), u32> {
        let roots = self.ui_roots.values().copied().collect::<Vec<_>>();
        let mut command_results = Vec::new();
        for root in &roots {
            let restart = session
                .restart_renderer(*root)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            command_results.extend(restart.command_results);
            self.surface_attached.remove(root);
        }
        for result in command_results {
            let Some(effect_id) = self.command_effects.remove(&result.command_id) else {
                continue;
            };
            session
                .complete_effect(
                    effect_id,
                    session.app_code_epoch(),
                    command_effect_outcome(result.outcome),
                )
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            self.emit_effect_completion(session, effect_id)?;
        }
        for root in roots {
            let batch = session
                .poll_presentation(root)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?
                .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
            self.emit_presentation_batch(session, root, batch)?;
        }
        Ok(())
    }

    fn dispatch_subscription_event(&mut self, packet: &[u8]) -> Result<(), u32> {
        const PREFIX: &[u8] = b"vogui-host-subscription-event-v1\0";
        let body = packet
            .strip_prefix(PREFIX)
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        if body.len() < 12 {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        }
        let handle = vogui_protocol::v2::Handle {
            index: u32::from_le_bytes(body[..4].try_into().unwrap()),
            generation: u32::from_le_bytes(body[4..8].try_into().unwrap()),
        };
        let payload_len = u32::from_le_bytes(body[8..12].try_into().unwrap()) as usize;
        if !handle.is_valid() || payload_len != body.len() - 12 {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        }
        let (mapper, source_root) = self
            .subscription_mappers
            .get(&handle)
            .copied()
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        self.emit_target_turn_from(source_root, mapper, &body[12..])
    }

    fn dispatch_effect_result_with_session(
        &mut self,
        session: &mut vogui_runtime::UiSession,
        packet: &[u8],
    ) -> Result<(), u32> {
        const PREFIX: &[u8] = b"vogui-host-effect-result-v1\0";
        let body = packet
            .strip_prefix(PREFIX)
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        if body.len() < 21 {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        }
        let effect_id = u64::from_le_bytes(body[..8].try_into().unwrap());
        let app_code_epoch = u64::from_le_bytes(body[8..16].try_into().unwrap());
        let outcome_tag = body[16];
        let payload_len = u32::from_le_bytes(body[17..21].try_into().unwrap()) as usize;
        if effect_id == 0 || app_code_epoch == 0 || payload_len != body.len() - 21 {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        }
        let payload = body[21..].to_vec();
        if let Some(work) = self.resource_fetches.remove(&effect_id) {
            if app_code_epoch != self.caller.endpoint_epoch {
                return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
            }
            if outcome_tag == 1 {
                let observed_hash: [u8; 32] = Sha256::digest(&payload).into();
                let metadata = work.descriptor.options.clone();
                match session.complete_resource_fetch(&work, observed_hash, payload, metadata) {
                    Ok(publication) => self.resource_publications.push_back(publication),
                    Err(_) => {
                        let _ = session.fail_resource_fetch(&work);
                    }
                }
            } else {
                let _ = session.fail_resource_fetch(&work);
            }
            self.emit_resource_publications(session)?;
            return self.emit_pending_resource_fetches(session);
        }
        if effect_id >= (1_u64 << 63) {
            return Ok(());
        }
        let outcome = match outcome_tag {
            1 => vogui_runtime::async_runtime::EffectOutcome::Completed(payload.clone()),
            2 => vogui_runtime::async_runtime::EffectOutcome::Failed(payload.clone()),
            3 if payload.is_empty() => vogui_runtime::async_runtime::EffectOutcome::Cancelled,
            4 if payload.is_empty() => vogui_runtime::async_runtime::EffectOutcome::TimedOut,
            _ => return Err(PROVIDER_STATUS_INVALID_ARGUMENT),
        };
        session
            .complete_effect(effect_id, app_code_epoch, outcome)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        if !self.host_effects.remove(&effect_id) {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        }
        let completion = session
            .drain_effect_completions()
            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
        if completion.len() != 1 || completion[0].effect_id != effect_id {
            return Err(PROVIDER_STATUS_INTERNAL_ERROR);
        }
        let (success_mapper, failure_mapper, source_root) = self
            .effect_mappers
            .remove(&effect_id)
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let mapper = if outcome_tag == 1 {
            success_mapper
        } else {
            failure_mapper
        };
        self.emit_target_turn_from(source_root, mapper, &payload)
    }

    fn emit_pending_resource_fetches(
        &mut self,
        session: &mut vogui_runtime::UiSession,
    ) -> Result<(), u32> {
        while let Some(work) = session.poll_resource_fetch() {
            let request_id = self.next_resource_request_id;
            self.next_resource_request_id = self
                .next_resource_request_id
                .checked_sub(1)
                .filter(|next| *next != 0)
                .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
            if self.resource_fetches.contains_key(&request_id) {
                return Err(PROVIDER_STATUS_INTERNAL_ERROR);
            }
            let locator = core::str::from_utf8(&work.descriptor.locator)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let locator_len =
                u32::try_from(locator.len()).map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let mut request = Vec::with_capacity(16 + locator.len());
            request.extend_from_slice(b"VFS1");
            request.push(1);
            request.extend_from_slice(&[0, 0, 0]);
            request.extend_from_slice(&locator_len.to_le_bytes());
            request.extend_from_slice(&0_u32.to_le_bytes());
            request.extend_from_slice(locator.as_bytes());
            let kind = b"vfs";
            let mut packet = Vec::with_capacity(72 + request.len());
            packet.extend_from_slice(b"vogui-host-effect-v1\0");
            packet.extend_from_slice(&request_id.to_le_bytes());
            packet.extend_from_slice(&self.caller.endpoint_epoch.to_le_bytes());
            packet.push(2);
            packet.push(1);
            packet.extend_from_slice(&invalid_protocol_handle().index.to_le_bytes());
            packet.extend_from_slice(&invalid_protocol_handle().generation.to_le_bytes());
            packet.extend_from_slice(&invalid_protocol_handle().index.to_le_bytes());
            packet.extend_from_slice(&invalid_protocol_handle().generation.to_le_bytes());
            packet.extend_from_slice(&0_u32.to_le_bytes());
            packet.extend_from_slice(&work.deadline_millis.to_le_bytes());
            packet.extend_from_slice(&(kind.len() as u16).to_le_bytes());
            packet.extend_from_slice(&(request.len() as u32).to_le_bytes());
            packet.extend_from_slice(kind);
            packet.extend_from_slice(&request);
            self.push_output(packet)?;
            self.resource_fetches.insert(request_id, work);
        }
        Ok(())
    }

    fn cancel_resource_fetches(
        &mut self,
        resource: vogui_runtime::resource::UiResourceId,
    ) -> Result<(), u32> {
        let request_ids = self
            .resource_fetches
            .iter()
            .filter_map(|(request_id, work)| (work.resource == resource).then_some(*request_id))
            .collect::<Vec<_>>();
        for request_id in request_ids {
            self.resource_fetches.remove(&request_id);
            let mut packet = Vec::with_capacity(47);
            packet.extend_from_slice(b"vogui-host-effect-cancel-v1\0");
            packet.extend_from_slice(&request_id.to_le_bytes());
            packet.extend_from_slice(&self.caller.endpoint_epoch.to_le_bytes());
            self.push_output(packet)?;
        }
        Ok(())
    }

    fn emit_resource_publications(
        &mut self,
        session: &vogui_runtime::UiSession,
    ) -> Result<(), u32> {
        const PREFIX_BYTES: usize = 70;
        const MAX_CHUNK_BYTES: usize = 512 * 1024;
        while let Some(publication) = self.resource_publications.pop_front() {
            let roots = self
                .resource_leases
                .values()
                .filter(|lease| lease.lease.resource == publication.resource)
                .map(|lease| (lease.lease.root, lease.commit_revision))
                .collect::<BTreeMap<_, _>>();
            if roots.is_empty() {
                continue;
            }
            let total_len = u32::try_from(publication.bytes.len())
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let metadata_len = u32::try_from(publication.metadata.len())
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let chunk_count = publication.bytes.len().max(1).div_ceil(MAX_CHUNK_BYTES);
            let packet_count = roots
                .len()
                .checked_mul(chunk_count)
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let packet_bytes = roots
                .len()
                .checked_mul(
                    publication
                        .bytes
                        .len()
                        .checked_add(publication.metadata.len())
                        .and_then(|bytes| {
                            bytes.checked_add(
                                chunk_count
                                    .checked_mul(vogui_protocol::v2::HEADER_BYTES + PREFIX_BYTES)?,
                            )
                        })
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
                )
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
            self.preflight_output_capacity(packet_count, packet_bytes)?;
            for (root, commit_revision) in roots {
                let ui_root_epoch = session
                    .root_epoch(root)
                    .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
                for chunk_index in 0..chunk_count {
                    let offset = chunk_index
                        .checked_mul(MAX_CHUNK_BYTES)
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                    let end = offset
                        .checked_add(MAX_CHUNK_BYTES)
                        .map(|end| end.min(publication.bytes.len()))
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                    let chunk = &publication.bytes[offset..end];
                    let metadata = if chunk_index == 0 {
                        publication.metadata.as_slice()
                    } else {
                        &[]
                    };
                    let mut payload =
                        Vec::with_capacity(PREFIX_BYTES + metadata.len() + chunk.len());
                    payload.extend_from_slice(&publication.resource.handle.index.to_le_bytes());
                    payload
                        .extend_from_slice(&publication.resource.handle.generation.to_le_bytes());
                    payload.extend_from_slice(&publication.source_revision.to_le_bytes());
                    payload.push(resource_kind_tag(publication.kind));
                    payload.extend_from_slice(&publication.content_hash);
                    payload.extend_from_slice(&total_len.to_le_bytes());
                    payload.extend_from_slice(&metadata_len.to_le_bytes());
                    payload.extend_from_slice(&(offset as u32).to_le_bytes());
                    payload.extend_from_slice(&(chunk.len() as u32).to_le_bytes());
                    payload.push(u8::from(end == publication.bytes.len()));
                    payload.extend_from_slice(metadata);
                    payload.extend_from_slice(chunk);
                    let sequence = self.next_presentation_sequence;
                    self.next_presentation_sequence = sequence
                        .checked_add(1)
                        .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
                    let packet = vogui_protocol::v2::encode_packet(
                        vogui_protocol::v2::PacketHeader {
                            kind: vogui_protocol::v2::MessageKind::UiResourcePublication,
                            ui_session: session.id(),
                            ui_root: root,
                            ui_root_epoch,
                            app_code_epoch: session.app_code_epoch(),
                            revision: commit_revision,
                            sequence,
                            payload_len: 0,
                        },
                        &payload,
                    )
                    .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
                    self.push_output(packet)?;
                }
            }
        }
        Ok(())
    }

    fn dispatch_ui_return_with_session(
        &mut self,
        session: &mut vogui_runtime::UiSession,
        header: vogui_protocol::v2::PacketHeader,
        returned: vogui_protocol::v2::DecodedUiReturn<'_>,
    ) -> Result<(), u32> {
        let root = header.ui_root;
        if header.ui_session != session.id()
            || !self.ui_roots.values().any(|candidate| *candidate == root)
        {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        }
        let mut target_turn = None;
        let mut command_effect = None;
        let item = match returned {
            vogui_protocol::v2::DecodedUiReturn::ApplyAck => vogui_runtime::UiReturn::ApplyAck {
                root,
                ui_root_epoch: header.ui_root_epoch,
                app_code_epoch: header.app_code_epoch,
                revision: header.revision,
                sequence: header.sequence,
            },
            vogui_protocol::v2::DecodedUiReturn::Event {
                event_token,
                payload,
            } => {
                let mapper_id = self
                    .event_bindings
                    .values()
                    .find_map(|binding| (binding.token == event_token).then_some(binding.mapper_id))
                    .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                let mapper_id =
                    u32::try_from(mapper_id).map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
                target_turn = Some((mapper_id, payload.to_vec()));
                vogui_runtime::UiReturn::Event {
                    root,
                    ui_root_epoch: header.ui_root_epoch,
                    app_code_epoch: header.app_code_epoch,
                    applied_revision: header.revision,
                    event_token,
                    sequence: header.sequence,
                    payload: payload.to_vec(),
                }
            }
            vogui_protocol::v2::DecodedUiReturn::CommandResult {
                command_id,
                outcome,
            } => {
                let outcome = map_command_outcome(outcome);
                if let Some(effect_id) = self.command_effects.get(&command_id).copied() {
                    command_effect = Some((command_id, effect_id, outcome));
                }
                vogui_runtime::UiReturn::CommandResult {
                    root,
                    ui_root_epoch: header.ui_root_epoch,
                    app_code_epoch: header.app_code_epoch,
                    command_id,
                    sequence: header.sequence,
                    outcome,
                }
            }
        };
        session
            .queue_return(item)
            .and_then(|()| session.process_next_return().map(|_| ()))
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        if let Some((mapper_id, payload)) = target_turn {
            self.emit_target_turn_with_metadata(
                Some(root),
                Some(header.sequence),
                Some(header.revision),
                mapper_id,
                &payload,
            )?;
        }
        if let Some((command_id, effect_id, outcome)) = command_effect {
            self.command_effects.remove(&command_id);
            let effect_outcome = command_effect_outcome(outcome);
            session
                .complete_effect(effect_id, header.app_code_epoch, effect_outcome)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            self.emit_effect_completion(session, effect_id)?;
        }
        if let Some(batch) = session
            .poll_presentation(root)
            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?
        {
            self.emit_presentation_batch(session, root, batch)?;
        }
        Ok(())
    }

    fn dispatch_ui_logic_with_session(
        &mut self,
        session: &mut vogui_runtime::UiSession,
        packet: &[u8],
    ) -> Result<(), u32> {
        let ingress = vogui_runtime::target_async::decode_target_state_ingress(packet)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let mut targets =
            vogui_runtime::target_presentation::decode_target_presentations(ingress.presentation)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let missing_roots = targets
            .iter()
            .filter(|target| !self.ui_roots.contains_key(&target.logical_root))
            .count();
        session
            .preflight_attach_roots(missing_roots)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let mut newly_attached = Vec::with_capacity(missing_roots);
        for target in &targets {
            if self.ui_roots.contains_key(&target.logical_root) {
                continue;
            }
            let root = session
                .attach_root()
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            self.ui_roots.insert(target.logical_root, root);
            newly_attached.push((target.logical_root, root));
        }
        let result = if targets.len() == 1 {
            let target = targets.pop().unwrap();
            let root = self.ui_roots[&target.logical_root];
            self.dispatch_target_state_with_session(
                session,
                ingress,
                target.logical_root,
                root,
                target.presentation,
            )
        } else {
            self.dispatch_target_batch_with_session(session, ingress, targets)
        };
        if result.is_err() {
            for (logical_root, root) in newly_attached.into_iter().rev() {
                self.ui_roots.remove(&logical_root);
                self.surface_attached.remove(&root);
                let _ = session.detach_root(root);
            }
        }
        result
    }

    fn dispatch_target_batch_with_session(
        &mut self,
        session: &mut vogui_runtime::UiSession,
        ingress: vogui_runtime::target_async::TargetStateIngress<'_>,
        targets: Vec<vogui_runtime::target_presentation::TargetRootPresentation>,
    ) -> Result<(), u32> {
        if targets.len() < 2 {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        }
        let target_effects = if ingress.complete_state {
            let effects = vogui_runtime::target_async::decode_target_effects(ingress.effects)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let effect_preflight = effects
                .iter()
                .map(|effect| (effect.kind.clone(), effect.payload.len()))
                .collect::<Vec<_>>();
            session
                .preflight_target_async(&effect_preflight, &[])
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            effects
        } else {
            Vec::new()
        };
        let target_subscriptions = if ingress.complete_state {
            vogui_runtime::target_async::decode_target_subscriptions(ingress.subscriptions)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?
        } else {
            Vec::new()
        };
        let subscription_update = if ingress.complete_state {
            match vogui_runtime::target_async::decode_target_subscription_update(
                ingress.update_result,
            )
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?
            {
                vogui_runtime::target_async::TargetSubscriptionUpdate::Unchanged => {
                    vogui_runtime::target_async::TargetSubscriptionUpdate::Unchanged
                }
                vogui_runtime::target_async::TargetSubscriptionUpdate::ReplaceAll => {
                    vogui_runtime::target_async::TargetSubscriptionUpdate::ReplaceAll
                }
                vogui_runtime::target_async::TargetSubscriptionUpdate::DirtyOwners(_) => {
                    return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                }
            }
        } else {
            vogui_runtime::target_async::TargetSubscriptionUpdate::Unchanged
        };

        let mut prepared = Vec::with_capacity(targets.len());
        let mut binding_output_bytes = 0_usize;
        let mut resolved_scope_owners = BTreeMap::new();
        for target in targets {
            let logical_root = target.logical_root;
            let root = self.ui_roots[&logical_root];
            let target = target.presentation;
            let mut desired_events = BTreeMap::new();
            for binding in &target.events {
                if desired_events
                    .insert(
                        (logical_root, binding.source_node, binding.event_kind),
                        binding.mapper_id,
                    )
                    .is_some()
                {
                    return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                }
            }
            let event_paths = desired_events
                .keys()
                .map(|(_, source_node, _)| {
                    target
                        .source_paths
                        .get(source_node)
                        .cloned()
                        .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)
                })
                .collect::<Result<Vec<_>, _>>()?;
            let event_nodes = session
                .resolve_candidate_node_ids(root, &target.view, &event_paths)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let candidate_events = desired_events
                .iter()
                .zip(event_nodes)
                .map(|((key, mapper_id), node)| (*key, (*mapper_id, node)))
                .collect::<BTreeMap<_, _>>();
            let mut resolved_events = BTreeSet::new();
            for ((_, _, event_kind), (_, node)) in &candidate_events {
                if !resolved_events.insert((*node, *event_kind)) {
                    return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                }
            }
            let mut unmatched_events = candidate_events.clone();
            let mut removed_event_tokens = Vec::new();
            let mut added_event_names = Vec::new();
            for (key, old) in &self.event_bindings {
                if key.0 != logical_root {
                    continue;
                }
                match unmatched_events.remove(key) {
                    Some((mapper, node)) if mapper == old.mapper_id && node == old.node => {}
                    Some(_) => {
                        removed_event_tokens.push(old.token);
                        added_event_names.push(event_kind_name(key.2)?.to_owned());
                    }
                    None => removed_event_tokens.push(old.token),
                }
            }
            for ((_, _, event_kind), _) in unmatched_events {
                added_event_names.push(event_kind_name(event_kind)?.to_owned());
            }

            let mut desired_refs = BTreeMap::new();
            for binding in &target.refs {
                let path = target
                    .source_paths
                    .get(&binding.source_node)
                    .cloned()
                    .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                if desired_refs
                    .insert((logical_root, binding.logical_ref), path)
                    .is_some()
                {
                    return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                }
            }
            let mut scope_refs = target_subscriptions
                .iter()
                .filter_map(|subscription| match subscription.owner {
                    vogui_runtime::target_async::TargetSubscriptionOwner::Scope {
                        logical_root: owner_root,
                        logical_ref,
                    } if owner_root == logical_root => Some(logical_ref),
                    _ => None,
                })
                .collect::<BTreeSet<_>>();
            if let vogui_runtime::target_async::TargetSubscriptionUpdate::DirtyOwners(requests) =
                &subscription_update
            {
                scope_refs.extend(requests.iter().filter_map(|request| match request.owner {
                    vogui_runtime::target_async::TargetSubscriptionOwner::Scope {
                        logical_root: owner_root,
                        logical_ref,
                    } if owner_root == logical_root => Some(logical_ref),
                    _ => None,
                }));
            }
            let scope_paths = scope_refs
                .iter()
                .map(|logical_ref| {
                    desired_refs
                        .get(&(logical_root, *logical_ref))
                        .cloned()
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)
                })
                .collect::<Result<Vec<_>, _>>()?;
            let scope_ids = session
                .resolve_candidate_scope_ids(root, &target.view, &scope_paths)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            for (logical_ref, scope) in scope_refs.into_iter().zip(scope_ids) {
                resolved_scope_owners.insert(
                    (logical_root, logical_ref),
                    vogui_runtime::async_runtime::SubscriptionOwner::Scope {
                        root: scope.root,
                        path_hash: scope.path_hash,
                        generation: scope.generation,
                    },
                );
            }
            let ref_paths = desired_refs.values().cloned().collect::<Vec<_>>();
            let ref_nodes = session
                .resolve_candidate_node_ids(root, &target.view, &ref_paths)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let candidate_refs = desired_refs
                .keys()
                .copied()
                .zip(ref_nodes)
                .collect::<BTreeMap<_, _>>();
            let mut unmatched_refs = candidate_refs.clone();
            let mut rebound_refs = Vec::new();
            let mut released_refs = Vec::new();
            for (key, old) in &self.ref_bindings {
                if key.0 != logical_root {
                    continue;
                }
                match unmatched_refs.remove(key) {
                    Some(node) if node == old.node => {}
                    Some(_) => rebound_refs.push(old.reference),
                    None => released_refs.push(old.reference),
                }
            }
            session
                .preflight_target_binding_reconcile(
                    root,
                    &removed_event_tokens,
                    &added_event_names,
                    unmatched_refs.len(),
                    &rebound_refs,
                    &released_refs,
                )
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            binding_output_bytes = binding_output_bytes
                .checked_add(
                    added_event_names
                        .len()
                        .checked_mul(19)
                        .and_then(|bytes| {
                            bytes.checked_add(removed_event_tokens.len().checked_mul(9)?)
                        })
                        .and_then(|bytes| {
                            bytes.checked_add(
                                unmatched_refs
                                    .len()
                                    .checked_add(rebound_refs.len())?
                                    .checked_mul(21)?,
                            )
                        })
                        .and_then(|bytes| bytes.checked_add(released_refs.len().checked_mul(9)?))
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
                )
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let mut candidate_resources = BTreeMap::new();
            let resource_paths = target
                .resources
                .iter()
                .map(|binding| {
                    target
                        .source_paths
                        .get(&binding.source_node)
                        .cloned()
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)
                })
                .collect::<Result<Vec<_>, _>>()?;
            let resource_nodes = session
                .resolve_candidate_node_ids(root, &target.view, &resource_paths)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            for (binding, node) in target.resources.iter().zip(resource_nodes) {
                if binding.logical_resource == 0 {
                    return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                }
                let descriptor =
                    vogui_runtime::target_presentation::decode_target_resource_descriptor(
                        &binding.descriptor,
                    )
                    .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
                if candidate_resources
                    .insert(
                        (logical_root, binding.logical_resource, binding.source_node),
                        PreparedResourceBinding { descriptor, node },
                    )
                    .is_some()
                {
                    return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                }
            }
            prepared.push(PreparedBatchRoot {
                logical_root,
                root,
                view: target.view,
                candidate_events,
                candidate_refs,
                candidate_resources,
            });
        }
        let resource_reconcile = self.prepare_resource_reconcile(session, &prepared)?;
        let desired_subscriptions = target_subscriptions
            .iter()
            .map(|subscription| {
                let owner = match subscription.owner {
                    vogui_runtime::target_async::TargetSubscriptionOwner::App => {
                        vogui_runtime::async_runtime::SubscriptionOwner::App
                    }
                    vogui_runtime::target_async::TargetSubscriptionOwner::UiRoot {
                        logical_root,
                    } if logical_root != 0 => {
                        vogui_runtime::async_runtime::SubscriptionOwner::UiRoot(
                            self.ui_roots
                                .get(&logical_root)
                                .copied()
                                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
                        )
                    }
                    vogui_runtime::target_async::TargetSubscriptionOwner::Scope {
                        logical_root,
                        logical_ref,
                    } if logical_root != 0 => resolved_scope_owners
                        .get(&(logical_root, logical_ref))
                        .copied()
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
                    _ => return Err(PROVIDER_STATUS_INVALID_ARGUMENT),
                };
                Ok(vogui_runtime::async_runtime::SubscriptionSpec {
                    owner,
                    key: subscription.key.clone(),
                    kind: subscription.kind.clone(),
                    payload: subscription.payload.clone(),
                })
            })
            .collect::<Result<Vec<_>, u32>>()?;
        session
            .preflight_target_async(&[], &desired_subscriptions)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let desired_subscription_mappers = desired_subscriptions
            .iter()
            .zip(&target_subscriptions)
            .map(|(spec, subscription)| ((spec.owner, spec.key.clone()), subscription.mapper_id))
            .collect::<BTreeMap<_, _>>();
        let subscription_commit = match subscription_update {
            vogui_runtime::target_async::TargetSubscriptionUpdate::Unchanged => {
                if !desired_subscriptions.is_empty() {
                    return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                }
                vogui_runtime::TargetSubscriptionCommit::Unchanged
            }
            vogui_runtime::target_async::TargetSubscriptionUpdate::ReplaceAll => {
                vogui_runtime::TargetSubscriptionCommit::ReplaceAll(desired_subscriptions.clone())
            }
            vogui_runtime::target_async::TargetSubscriptionUpdate::DirtyOwners(requests) => {
                let mut owners = BTreeMap::new();
                for request in requests {
                    let owner = match request.owner {
                        vogui_runtime::target_async::TargetSubscriptionOwner::App => {
                            vogui_runtime::async_runtime::SubscriptionOwner::App
                        }
                        vogui_runtime::target_async::TargetSubscriptionOwner::UiRoot {
                            logical_root,
                        } if logical_root != 0 => {
                            vogui_runtime::async_runtime::SubscriptionOwner::UiRoot(
                                self.ui_roots
                                    .get(&logical_root)
                                    .copied()
                                    .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
                            )
                        }
                        vogui_runtime::target_async::TargetSubscriptionOwner::Scope {
                            logical_root,
                            logical_ref,
                        } if logical_root != 0 => resolved_scope_owners
                            .get(&(logical_root, logical_ref))
                            .copied()
                            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
                        _ => return Err(PROVIDER_STATUS_INVALID_ARGUMENT),
                    };
                    if owners.insert(owner, Vec::new()).is_some() {
                        return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                    }
                }
                for spec in &desired_subscriptions {
                    owners
                        .get_mut(&spec.owner)
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?
                        .push(spec.clone());
                }
                vogui_runtime::TargetSubscriptionCommit::Owners(owners.into_iter().collect())
            }
        };
        let presentation_bytes = session
            .max_presentation_payload_bytes()
            .checked_mul(prepared.len())
            .and_then(|bytes| {
                bytes.checked_add(
                    vogui_protocol::v2::HEADER_BYTES
                        .checked_add(38)?
                        .checked_mul(prepared.len())?,
                )
            })
            .and_then(|bytes| bytes.checked_add(binding_output_bytes))
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let effect_output_bytes = target_effects.iter().try_fold(0_usize, |bytes, effect| {
            bytes
                .checked_add(effect.kind.len())
                .and_then(|bytes| bytes.checked_add(effect.payload.len()))
                .and_then(|bytes| bytes.checked_add(256))
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)
        })?;
        let subscription_output_bytes =
            desired_subscriptions
                .iter()
                .try_fold(0_usize, |bytes, subscription| {
                    bytes
                        .checked_add(b"vogui-host-subscription-v1\0".len() + 15)
                        .and_then(|bytes| bytes.checked_add(subscription.kind.len()))
                        .and_then(|bytes| bytes.checked_add(subscription.payload.len()))
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)
                })?;
        self.preflight_output_capacity(
            prepared
                .len()
                .checked_mul(2)
                .and_then(|count| count.checked_add(self.subscription_mappers.len()))
                .and_then(|count| count.checked_add(desired_subscriptions.len()))
                .and_then(|count| count.checked_add(self.effect_mappers.len().checked_mul(2)?))
                .and_then(|count| count.checked_add(target_effects.len()))
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
            presentation_bytes
                .checked_add(
                    self.subscription_mappers
                        .len()
                        .checked_mul(b"vogui-host-subscription-v1\0".len() + 9)
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
                )
                .and_then(|bytes| {
                    bytes.checked_add(
                        self.effect_mappers.len().checked_mul(
                            b"vogui-host-effect-cancel-v1\0"
                                .len()
                                .checked_add(16)?
                                .checked_add(b"vogui-target-turn-v1\0".len())?
                                .checked_add(24)?,
                        )?,
                    )
                })
                .and_then(|bytes| bytes.checked_add(effect_output_bytes))
                .and_then(|bytes| bytes.checked_add(subscription_output_bytes))
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
        )?;

        let before_revision = session.commit_revision();
        let views = prepared
            .iter()
            .map(|prepared| vogui_runtime::RootView {
                root: prepared.root,
                view: prepared.view.clone(),
            })
            .collect();
        let (_, subscription_changes, cancelled_effect_ids) = session
            .commit_target_views_and_subscriptions(views, subscription_commit)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        self.commit_resource_reconcile(session, resource_reconcile)?;
        self.emit_pending_resource_fetches(session)?;
        let mut binding_roots = Vec::new();
        for prepared in prepared {
            let mut desired_events = prepared.candidate_events;
            let mut bind_events = Vec::new();
            let mut unbind_events = Vec::new();
            let mut next_events = BTreeMap::new();
            for (key, old) in core::mem::take(&mut self.event_bindings) {
                if key.0 != prepared.logical_root {
                    next_events.insert(key, old);
                    continue;
                }
                match desired_events.remove(&key) {
                    Some((mapper_id, node)) if mapper_id == old.mapper_id && node == old.node => {
                        next_events.insert(key, old);
                    }
                    Some((mapper_id, node)) => {
                        session
                            .unbind_event(prepared.root, old.token)
                            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
                        unbind_events.push(old.token);
                        let token = session
                            .bind_event_node(prepared.root, node, event_kind_name(key.2)?)
                            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
                        bind_events.push(
                            vogui_runtime::target_presentation::TargetWireEventBinding {
                                node,
                                event_kind: key.2,
                                token,
                            },
                        );
                        next_events.insert(
                            key,
                            ProviderEventBinding {
                                node,
                                mapper_id,
                                token,
                            },
                        );
                    }
                    None => {
                        session
                            .unbind_event(prepared.root, old.token)
                            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
                        unbind_events.push(old.token);
                    }
                }
            }
            for (key, (mapper_id, node)) in desired_events {
                let token = session
                    .bind_event_node(prepared.root, node, event_kind_name(key.2)?)
                    .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
                bind_events.push(vogui_runtime::target_presentation::TargetWireEventBinding {
                    node,
                    event_kind: key.2,
                    token,
                });
                next_events.insert(
                    key,
                    ProviderEventBinding {
                        node,
                        mapper_id,
                        token,
                    },
                );
            }
            self.event_bindings = next_events;

            let mut desired_refs = prepared.candidate_refs;
            let mut bind_refs = Vec::new();
            let mut unbind_refs = Vec::new();
            let mut next_refs = BTreeMap::new();
            for (key, old) in core::mem::take(&mut self.ref_bindings) {
                if key.0 != prepared.logical_root {
                    next_refs.insert(key, old);
                    continue;
                }
                match desired_refs.remove(&key) {
                    Some(node) if node == old.node => {
                        next_refs.insert(key, old);
                    }
                    Some(node) => {
                        let binding_generation = session
                            .bind_node_ref(old.reference, node)
                            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
                        bind_refs.push(vogui_runtime::target_presentation::TargetWireRefBinding {
                            node,
                            reference: old.reference.handle(),
                            binding_generation,
                        });
                        next_refs.insert(
                            key,
                            ProviderRefBinding {
                                node,
                                reference: old.reference,
                                binding_generation,
                            },
                        );
                    }
                    None => {
                        session
                            .release_node_ref(old.reference)
                            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
                        unbind_refs.push(old.reference.handle());
                    }
                }
            }
            for (key, node) in desired_refs {
                let reference = session
                    .node_ref(prepared.root, node)
                    .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
                let resolved = session
                    .resolve_node_ref(reference)
                    .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
                bind_refs.push(vogui_runtime::target_presentation::TargetWireRefBinding {
                    node,
                    reference: reference.handle(),
                    binding_generation: resolved.binding_generation,
                });
                next_refs.insert(
                    key,
                    ProviderRefBinding {
                        node,
                        reference,
                        binding_generation: resolved.binding_generation,
                    },
                );
            }
            self.ref_bindings = next_refs;
            if !bind_events.is_empty()
                || !unbind_events.is_empty()
                || !bind_refs.is_empty()
                || !unbind_refs.is_empty()
            {
                binding_roots.push(prepared.root);
            }
            self.pending_bind_events
                .entry(prepared.root)
                .or_default()
                .extend(bind_events);
            self.pending_unbind_events
                .entry(prepared.root)
                .or_default()
                .extend(unbind_events);
            self.pending_bind_refs
                .entry(prepared.root)
                .or_default()
                .extend(bind_refs);
            self.pending_unbind_refs
                .entry(prepared.root)
                .or_default()
                .extend(unbind_refs);
        }
        binding_roots.extend(self.pending_attach_resources.keys().copied());
        binding_roots.extend(self.pending_detach_resources.keys().copied());
        binding_roots.sort_unstable();
        binding_roots.dedup();
        if !binding_roots.is_empty() && session.commit_revision() == before_revision {
            session
                .commit_binding_changes_for_roots(binding_roots)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
        }
        for change in subscription_changes {
            match &change {
                vogui_runtime::async_runtime::SubscriptionChange::Start { handle, spec } => {
                    let mapper = desired_subscription_mappers
                        .get(&(spec.owner, spec.key.clone()))
                        .copied()
                        .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
                    let source_root = match spec.owner {
                        vogui_runtime::async_runtime::SubscriptionOwner::App => None,
                        vogui_runtime::async_runtime::SubscriptionOwner::UiRoot(root)
                        | vogui_runtime::async_runtime::SubscriptionOwner::Scope { root, .. } => {
                            Some(root)
                        }
                    };
                    self.subscription_mappers
                        .insert(*handle, (mapper, source_root));
                }
                vogui_runtime::async_runtime::SubscriptionChange::Stop { handle } => {
                    self.subscription_mappers.remove(handle);
                }
            }
            self.emit_subscription_change(change)?;
        }
        let mut mapper_routes = Vec::with_capacity(target_effects.len());
        let mut effects = Vec::with_capacity(target_effects.len());
        for effect in target_effects {
            let (scope, source_root) = match effect.scope {
                vogui_runtime::target_async::TargetEffectScope::App => {
                    (vogui_runtime::async_runtime::EffectScope::App, None)
                }
                vogui_runtime::target_async::TargetEffectScope::UiRoot { logical_root } => {
                    if logical_root == 0 {
                        return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                    }
                    let root = self
                        .ui_roots
                        .get(&logical_root)
                        .copied()
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                    (
                        vogui_runtime::async_runtime::EffectScope::UiRoot(root),
                        Some(root),
                    )
                }
                vogui_runtime::target_async::TargetEffectScope::Node {
                    logical_root,
                    logical_ref,
                } => {
                    if logical_root == 0 {
                        return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                    }
                    let root = self
                        .ui_roots
                        .get(&logical_root)
                        .copied()
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                    let binding = self
                        .ref_bindings
                        .get(&(logical_root, logical_ref))
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                    (
                        vogui_runtime::async_runtime::EffectScope::Node {
                            root,
                            logical_ref: binding.reference.handle(),
                            binding_generation: binding.binding_generation,
                        },
                        Some(root),
                    )
                }
            };
            mapper_routes.push((effect.success_mapper, effect.failure_mapper, source_root));
            effects.push((
                effect.kind,
                effect.executor,
                scope,
                effect.deadline_millis,
                effect.payload,
                effect.transferable_across_reload,
            ));
        }
        let effect_ids = session
            .begin_target_effects(effects)
            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
        for (effect_id, route) in effect_ids.into_iter().zip(mapper_routes) {
            self.effect_mappers.insert(effect_id, route);
        }
        let mut pending_effect_requests = Vec::new();
        while let Some(effect) = session.poll_effect() {
            pending_effect_requests.push(effect);
        }
        let roots = self.ui_roots.values().copied().collect::<Vec<_>>();
        for root in roots {
            if let Some(batch) = session
                .poll_presentation(root)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?
            {
                self.emit_presentation_batch(session, root, batch)?;
            }
        }
        self.emit_cancelled_effects(session, &cancelled_effect_ids)?;
        for effect in pending_effect_requests {
            if effect.executor == vogui_runtime::async_runtime::EffectExecutor::UiCommand {
                self.emit_effect_command(session, effect)?;
            } else {
                self.emit_effect_request(effect)?;
            }
        }
        Ok(())
    }

    fn dispatch_target_state_with_session(
        &mut self,
        session: &mut vogui_runtime::UiSession,
        ingress: vogui_runtime::target_async::TargetStateIngress<'_>,
        logical_root: u64,
        root: vogui_protocol::v2::UiRootId,
        target: vogui_runtime::target_presentation::TargetPresentation,
    ) -> Result<(), u32> {
        let mut pending_effect_requests = Vec::new();
        let target_effects = ingress
            .complete_state
            .then(|| vogui_runtime::target_async::decode_target_effects(ingress.effects))
            .transpose()
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?
            .unwrap_or_default();
        let target_subscriptions = ingress
            .complete_state
            .then(|| {
                vogui_runtime::target_async::decode_target_subscriptions(ingress.subscriptions)
            })
            .transpose()
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?
            .unwrap_or_default();
        let target_subscription_update = ingress
            .complete_state
            .then(|| {
                vogui_runtime::target_async::decode_target_subscription_update(
                    ingress.update_result,
                )
            })
            .transpose()
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?
            .unwrap_or(vogui_runtime::target_async::TargetSubscriptionUpdate::Unchanged);
        if ingress.complete_state {
            let effect_preflight = target_effects
                .iter()
                .map(|effect| (effect.kind.clone(), effect.payload.len()))
                .collect::<Vec<_>>();
            session
                .preflight_target_async(&effect_preflight, &[])
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        }
        let mut desired_events = BTreeMap::new();
        for binding in &target.events {
            if desired_events
                .insert(
                    (logical_root, binding.source_node, binding.event_kind),
                    binding.mapper_id,
                )
                .is_some()
            {
                return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
            }
        }
        let mut desired_refs = BTreeMap::new();
        for binding in &target.refs {
            let path = target
                .source_paths
                .get(&binding.source_node)
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
            if desired_refs
                .insert((logical_root, binding.logical_ref), path.clone())
                .is_some()
            {
                return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
            }
        }
        let owner_matches_root = |owner| match owner {
            vogui_runtime::target_async::TargetSubscriptionOwner::App => true,
            vogui_runtime::target_async::TargetSubscriptionOwner::UiRoot {
                logical_root: owner_root,
            }
            | vogui_runtime::target_async::TargetSubscriptionOwner::Scope {
                logical_root: owner_root,
                ..
            } => owner_root == 0 || owner_root == logical_root,
        };
        if target_subscriptions
            .iter()
            .any(|subscription| !owner_matches_root(subscription.owner))
        {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        }
        let mut scope_sources = target_subscriptions
            .iter()
            .filter_map(|subscription| match subscription.owner {
                vogui_runtime::target_async::TargetSubscriptionOwner::Scope {
                    logical_ref, ..
                } => Some(logical_ref),
                _ => None,
            })
            .collect::<BTreeSet<_>>();
        if let vogui_runtime::target_async::TargetSubscriptionUpdate::DirtyOwners(requests) =
            &target_subscription_update
        {
            if requests
                .iter()
                .any(|request| !owner_matches_root(request.owner))
            {
                return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
            }
            scope_sources.extend(requests.iter().filter_map(|request| match request.owner {
                vogui_runtime::target_async::TargetSubscriptionOwner::Scope {
                    logical_ref, ..
                } => Some(logical_ref),
                _ => None,
            }));
        }
        let scope_paths = scope_sources
            .iter()
            .map(|logical_ref| {
                desired_refs
                    .get(&(logical_root, *logical_ref))
                    .cloned()
                    .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)
            })
            .collect::<Result<Vec<_>, _>>()?;
        let scope_ids = session
            .resolve_candidate_scope_ids(root, &target.view, &scope_paths)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let resolved_scope_owners = scope_sources
            .into_iter()
            .zip(scope_ids)
            .map(|(logical_ref, scope)| {
                (
                    logical_ref,
                    vogui_runtime::async_runtime::SubscriptionOwner::Scope {
                        root: scope.root,
                        path_hash: scope.path_hash,
                        generation: scope.generation,
                    },
                )
            })
            .collect::<BTreeMap<_, _>>();
        let resolve_subscription_owner = |owner| match owner {
            vogui_runtime::target_async::TargetSubscriptionOwner::App => {
                Ok(vogui_runtime::async_runtime::SubscriptionOwner::App)
            }
            vogui_runtime::target_async::TargetSubscriptionOwner::UiRoot { .. } => Ok(
                vogui_runtime::async_runtime::SubscriptionOwner::UiRoot(root),
            ),
            vogui_runtime::target_async::TargetSubscriptionOwner::Scope { logical_ref, .. } => {
                resolved_scope_owners
                    .get(&logical_ref)
                    .copied()
                    .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)
            }
        };
        let desired_subscriptions = target_subscriptions
            .iter()
            .map(|subscription| {
                let owner = resolve_subscription_owner(subscription.owner)?;
                Ok(vogui_runtime::async_runtime::SubscriptionSpec {
                    owner,
                    key: subscription.key.clone(),
                    kind: subscription.kind.clone(),
                    payload: subscription.payload.clone(),
                })
            })
            .collect::<Result<Vec<_>, u32>>()?;
        session
            .preflight_target_async(&[], &desired_subscriptions)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let desired_subscription_mappers = desired_subscriptions
            .iter()
            .zip(&target_subscriptions)
            .map(|(spec, subscription)| ((spec.owner, spec.key.clone()), subscription.mapper_id))
            .collect::<BTreeMap<_, _>>();
        let subscription_commit = match &target_subscription_update {
            vogui_runtime::target_async::TargetSubscriptionUpdate::Unchanged => {
                if !desired_subscriptions.is_empty() {
                    return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                }
                vogui_runtime::TargetSubscriptionCommit::Unchanged
            }
            vogui_runtime::target_async::TargetSubscriptionUpdate::ReplaceAll => {
                vogui_runtime::TargetSubscriptionCommit::ReplaceAll(desired_subscriptions.clone())
            }
            vogui_runtime::target_async::TargetSubscriptionUpdate::DirtyOwners(requests) => {
                let mut owners = BTreeMap::new();
                for request in requests {
                    let owner = resolve_subscription_owner(request.owner)?;
                    if owners.insert(owner, Vec::new()).is_some() {
                        return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
                    }
                }
                for spec in &desired_subscriptions {
                    owners
                        .get_mut(&spec.owner)
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?
                        .push(spec.clone());
                }
                vogui_runtime::TargetSubscriptionCommit::Owners(owners.into_iter().collect())
            }
        };
        let event_paths = desired_events
            .keys()
            .map(|(_, source_node, _)| {
                target
                    .source_paths
                    .get(source_node)
                    .cloned()
                    .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)
            })
            .collect::<Result<Vec<_>, _>>()?;
        let event_nodes = session
            .resolve_candidate_node_ids(root, &target.view, &event_paths)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let candidate_events = desired_events
            .iter()
            .zip(event_nodes)
            .map(|((key, mapper_id), node)| (*key, (*mapper_id, node)))
            .collect::<BTreeMap<_, _>>();
        let mut resolved_event_keys = BTreeSet::new();
        for ((_, _, event_kind), (_, node)) in &candidate_events {
            if !resolved_event_keys.insert((*node, *event_kind)) {
                return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
            }
        }
        let mut unmatched_events = candidate_events.clone();
        let mut removed_event_tokens = Vec::new();
        let mut added_event_names = Vec::new();
        for (key, old) in &self.event_bindings {
            if key.0 != logical_root {
                continue;
            }
            match unmatched_events.remove(key) {
                Some((mapper_id, node)) if mapper_id == old.mapper_id && node == old.node => {}
                Some(_) => {
                    removed_event_tokens.push(old.token);
                    added_event_names.push(event_kind_name(key.2)?.to_owned());
                }
                None => removed_event_tokens.push(old.token),
            }
        }
        for ((_, _, event_kind), _) in unmatched_events {
            added_event_names.push(event_kind_name(event_kind)?.to_owned());
        }
        let ref_paths = desired_refs.values().cloned().collect::<Vec<_>>();
        let ref_nodes = session
            .resolve_candidate_node_ids(root, &target.view, &ref_paths)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let candidate_refs = desired_refs
            .keys()
            .copied()
            .zip(ref_nodes)
            .collect::<BTreeMap<_, _>>();
        let mut unmatched_refs = candidate_refs.clone();
        let mut rebound_refs = Vec::new();
        let mut released_refs = Vec::new();
        for (logical_ref, old) in &self.ref_bindings {
            if logical_ref.0 != logical_root {
                continue;
            }
            match unmatched_refs.remove(logical_ref) {
                Some(node) if node == old.node => {}
                Some(_) => rebound_refs.push(old.reference),
                None => released_refs.push(old.reference),
            }
        }
        session
            .preflight_target_binding_reconcile(
                root,
                &removed_event_tokens,
                &added_event_names,
                unmatched_refs.len(),
                &rebound_refs,
                &released_refs,
            )
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let mut candidate_resources = BTreeMap::new();
        let resource_paths = target
            .resources
            .iter()
            .map(|binding| {
                target
                    .source_paths
                    .get(&binding.source_node)
                    .cloned()
                    .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)
            })
            .collect::<Result<Vec<_>, _>>()?;
        let resource_nodes = session
            .resolve_candidate_node_ids(root, &target.view, &resource_paths)
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        for (binding, node) in target.resources.iter().zip(resource_nodes) {
            if binding.logical_resource == 0 {
                return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
            }
            let descriptor = vogui_runtime::target_presentation::decode_target_resource_descriptor(
                &binding.descriptor,
            )
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            if candidate_resources
                .insert(
                    (logical_root, binding.logical_resource, binding.source_node),
                    PreparedResourceBinding { descriptor, node },
                )
                .is_some()
            {
                return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
            }
        }
        let resource_prepared = PreparedBatchRoot {
            logical_root,
            root,
            view: target.view.clone(),
            candidate_events: candidate_events.clone(),
            candidate_refs: candidate_refs.clone(),
            candidate_resources,
        };
        let resource_reconcile =
            self.prepare_resource_reconcile(session, core::slice::from_ref(&resource_prepared))?;
        let binding_output_bytes = added_event_names
            .len()
            .checked_mul(19)
            .and_then(|bytes| bytes.checked_add(removed_event_tokens.len().checked_mul(9)?))
            .and_then(|bytes| {
                bytes.checked_add(
                    unmatched_refs
                        .len()
                        .checked_add(rebound_refs.len())?
                        .checked_mul(21)?,
                )
            })
            .and_then(|bytes| bytes.checked_add(released_refs.len().checked_mul(9)?))
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let output_packets = 2_usize
            .checked_add(self.subscription_mappers.len())
            .and_then(|count| count.checked_add(desired_subscriptions.len()))
            .and_then(|count| count.checked_add(self.effect_mappers.len().checked_mul(2)?))
            .and_then(|count| count.checked_add(target_effects.len()))
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let mut output_bytes = vogui_protocol::v2::HEADER_BYTES
            .checked_add(session.max_presentation_payload_bytes())
            .and_then(|bytes| bytes.checked_add(binding_output_bytes))
            .and_then(|bytes| bytes.checked_add(vogui_protocol::v2::HEADER_BYTES.checked_add(38)?))
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let subscription_prefix_bytes = b"vogui-host-subscription-v1\0".len();
        output_bytes = output_bytes
            .checked_add(
                self.subscription_mappers
                    .len()
                    .checked_mul(subscription_prefix_bytes + 9)
                    .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
            )
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        for subscription in &desired_subscriptions {
            output_bytes = output_bytes
                .checked_add(
                    subscription_prefix_bytes
                        .checked_add(15)
                        .and_then(|bytes| bytes.checked_add(subscription.kind.len()))
                        .and_then(|bytes| bytes.checked_add(subscription.payload.len()))
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
                )
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        }
        let cancellation_output_bytes = b"vogui-host-effect-cancel-v1\0"
            .len()
            .checked_add(16)
            .and_then(|bytes| bytes.checked_add(b"vogui-target-turn-v1\0".len().checked_add(24)?))
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        output_bytes = output_bytes
            .checked_add(
                self.effect_mappers
                    .len()
                    .checked_mul(cancellation_output_bytes)
                    .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
            )
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        for effect in &target_effects {
            output_bytes = output_bytes
                .checked_add(
                    effect
                        .kind
                        .len()
                        .checked_add(effect.payload.len())
                        .and_then(|bytes| bytes.checked_add(256))
                        .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?,
                )
                .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        }
        self.preflight_output_capacity(output_packets, output_bytes)?;
        let before_revision = session.commit_revision();
        let (pending_subscription_changes, cancelled_effect_ids) = if ingress.complete_state {
            let (_, changes, cancelled) = session
                .commit_target_view_and_subscriptions(root, target.view, subscription_commit)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            (changes, cancelled)
        } else {
            session
                .commit_views(vec![vogui_runtime::RootView {
                    root,
                    view: target.view,
                }])
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            (Vec::new(), Vec::new())
        };
        self.commit_resource_reconcile(session, resource_reconcile)?;
        self.emit_pending_resource_fetches(session)?;

        let mut desired_events = candidate_events;

        let mut bind_events = Vec::new();
        let mut unbind_events = Vec::new();
        let mut next_event_bindings = BTreeMap::new();
        let old_event_bindings = core::mem::take(&mut self.event_bindings);
        for (key, old) in old_event_bindings {
            if key.0 != logical_root {
                next_event_bindings.insert(key, old);
                continue;
            }
            match desired_events.remove(&key) {
                Some((mapper_id, node)) if mapper_id == old.mapper_id && node == old.node => {
                    next_event_bindings.insert(key, old);
                }
                Some((mapper_id, node)) => {
                    let _ = session.unbind_event(root, old.token);
                    unbind_events.push(old.token);
                    let token = session
                        .bind_event_node(root, node, event_kind_name(key.2)?)
                        .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
                    let next = ProviderEventBinding {
                        node,
                        mapper_id,
                        token,
                    };
                    bind_events.push(vogui_runtime::target_presentation::TargetWireEventBinding {
                        node,
                        event_kind: key.2,
                        token,
                    });
                    next_event_bindings.insert(key, next);
                }
                None => {
                    let _ = session.unbind_event(root, old.token);
                    unbind_events.push(old.token);
                }
            }
        }
        for (key, (mapper_id, node)) in desired_events {
            let token = session
                .bind_event_node(root, node, event_kind_name(key.2)?)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let next = ProviderEventBinding {
                node,
                mapper_id,
                token,
            };
            bind_events.push(vogui_runtime::target_presentation::TargetWireEventBinding {
                node,
                event_kind: key.2,
                token,
            });
            next_event_bindings.insert(key, next);
        }
        self.event_bindings = next_event_bindings;

        let mut bind_refs = Vec::new();
        let mut unbind_refs = Vec::new();
        let mut desired_refs = candidate_refs;
        let mut next_ref_bindings = BTreeMap::new();
        let old_ref_bindings = core::mem::take(&mut self.ref_bindings);
        for (logical_ref, old) in old_ref_bindings {
            if logical_ref.0 != logical_root {
                next_ref_bindings.insert(logical_ref, old);
                continue;
            }
            match desired_refs.remove(&logical_ref) {
                Some(node) => {
                    if node == old.node {
                        next_ref_bindings.insert(logical_ref, old);
                    } else {
                        let binding_generation = session
                            .bind_node_ref(old.reference, node)
                            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
                        let next = ProviderRefBinding {
                            node,
                            reference: old.reference,
                            binding_generation,
                        };
                        bind_refs.push(vogui_runtime::target_presentation::TargetWireRefBinding {
                            node,
                            reference: old.reference.handle(),
                            binding_generation,
                        });
                        next_ref_bindings.insert(logical_ref, next);
                    }
                }
                None => {
                    session
                        .release_node_ref(old.reference)
                        .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
                    unbind_refs.push(old.reference.handle());
                }
            }
        }
        for (logical_ref, node) in desired_refs {
            let reference = session
                .node_ref(root, node)
                .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            let resolved = session
                .resolve_node_ref(reference)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            let next = ProviderRefBinding {
                node,
                reference,
                binding_generation: resolved.binding_generation,
            };
            bind_refs.push(vogui_runtime::target_presentation::TargetWireRefBinding {
                node,
                reference: reference.handle(),
                binding_generation: resolved.binding_generation,
            });
            next_ref_bindings.insert(logical_ref, next);
        }
        self.ref_bindings = next_ref_bindings;

        if ingress.complete_state {
            let mut mapper_pairs = Vec::with_capacity(target_effects.len());
            let mut effects = Vec::with_capacity(target_effects.len());
            for effect in target_effects {
                let (scope, source_root) = match effect.scope {
                    vogui_runtime::target_async::TargetEffectScope::App => {
                        (vogui_runtime::async_runtime::EffectScope::App, None)
                    }
                    vogui_runtime::target_async::TargetEffectScope::UiRoot {
                        logical_root: effect_root,
                    } => {
                        let effect_root = if effect_root == 0 {
                            logical_root
                        } else {
                            effect_root
                        };
                        let effect_root = self
                            .ui_roots
                            .get(&effect_root)
                            .copied()
                            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                        (
                            vogui_runtime::async_runtime::EffectScope::UiRoot(effect_root),
                            Some(effect_root),
                        )
                    }
                    vogui_runtime::target_async::TargetEffectScope::Node {
                        logical_root: effect_root,
                        logical_ref,
                    } => {
                        let effect_root = if effect_root == 0 {
                            logical_root
                        } else {
                            effect_root
                        };
                        let effect_root_handle = self
                            .ui_roots
                            .get(&effect_root)
                            .copied()
                            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                        let binding = self
                            .ref_bindings
                            .get(&(effect_root, logical_ref))
                            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
                        (
                            vogui_runtime::async_runtime::EffectScope::Node {
                                root: effect_root_handle,
                                logical_ref: binding.reference.handle(),
                                binding_generation: binding.binding_generation,
                            },
                            Some(effect_root_handle),
                        )
                    }
                };
                mapper_pairs.push((effect.success_mapper, effect.failure_mapper, source_root));
                effects.push((
                    effect.kind,
                    effect.executor,
                    scope,
                    effect.deadline_millis,
                    effect.payload,
                    effect.transferable_across_reload,
                ));
            }
            let effect_ids = session
                .begin_target_effects(effects)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
            for (effect_id, mappers) in effect_ids.into_iter().zip(mapper_pairs) {
                self.effect_mappers.insert(effect_id, mappers);
            }
            for change in pending_subscription_changes {
                match &change {
                    vogui_runtime::async_runtime::SubscriptionChange::Start { handle, spec } => {
                        let mapper = desired_subscription_mappers
                            .get(&(spec.owner, spec.key.clone()))
                            .copied()
                            .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
                        let source_root = match spec.owner {
                            vogui_runtime::async_runtime::SubscriptionOwner::App => None,
                            vogui_runtime::async_runtime::SubscriptionOwner::UiRoot(root)
                            | vogui_runtime::async_runtime::SubscriptionOwner::Scope {
                                root, ..
                            } => Some(root),
                        };
                        self.subscription_mappers
                            .insert(*handle, (mapper, source_root));
                    }
                    vogui_runtime::async_runtime::SubscriptionChange::Stop { handle } => {
                        self.subscription_mappers.remove(handle);
                    }
                }
                self.emit_subscription_change(change)?;
            }
            while let Some(effect) = session.poll_effect() {
                pending_effect_requests.push(effect);
            }
        }

        let bindings_changed = !bind_events.is_empty()
            || !unbind_events.is_empty()
            || !bind_refs.is_empty()
            || !unbind_refs.is_empty()
            || self.pending_attach_resources.contains_key(&root)
            || self.pending_detach_resources.contains_key(&root);
        if bindings_changed && session.commit_revision() == before_revision {
            session
                .commit_binding_changes(root)
                .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
        }
        self.pending_bind_events
            .entry(root)
            .or_default()
            .extend(bind_events);
        self.pending_unbind_events
            .entry(root)
            .or_default()
            .extend(unbind_events);
        self.pending_bind_refs
            .entry(root)
            .or_default()
            .extend(bind_refs);
        self.pending_unbind_refs
            .entry(root)
            .or_default()
            .extend(unbind_refs);
        if let Some(batch) = session
            .poll_presentation(root)
            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?
        {
            self.emit_presentation_batch(session, root, batch)?;
        }
        self.emit_cancelled_effects(session, &cancelled_effect_ids)?;
        for effect in pending_effect_requests {
            if effect.executor == vogui_runtime::async_runtime::EffectExecutor::UiCommand {
                self.emit_effect_command(session, effect)?;
            } else {
                self.emit_effect_request(effect)?;
            }
        }
        Ok(())
    }

    fn emit_effect_request(
        &mut self,
        effect: vogui_runtime::async_runtime::EffectRequest,
    ) -> Result<(), u32> {
        if !self.host_effects.insert(effect.effect_id) {
            return Err(PROVIDER_STATUS_INTERNAL_ERROR);
        }
        let executor = match effect.executor {
            vogui_runtime::async_runtime::EffectExecutor::UiCommand => 1,
            vogui_runtime::async_runtime::EffectExecutor::PlatformRequest => 2,
            vogui_runtime::async_runtime::EffectExecutor::TaskRegistry => 3,
        };
        let kind_len =
            u16::try_from(effect.kind.len()).map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let payload_len =
            u32::try_from(effect.payload.len()).map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let (scope, root, reference, binding_generation) = match effect.scope {
            vogui_runtime::async_runtime::EffectScope::App => {
                (1, invalid_protocol_handle(), invalid_protocol_handle(), 0)
            }
            vogui_runtime::async_runtime::EffectScope::UiRoot(root) => {
                (2, root, invalid_protocol_handle(), 0)
            }
            vogui_runtime::async_runtime::EffectScope::Node {
                root,
                logical_ref,
                binding_generation,
            } => (3, root, logical_ref, binding_generation),
            vogui_runtime::async_runtime::EffectScope::Scope {
                root, generation, ..
            } => (4, root, invalid_protocol_handle(), generation),
        };
        let mut packet = Vec::with_capacity(72 + effect.kind.len() + effect.payload.len());
        packet.extend_from_slice(b"vogui-host-effect-v1\0");
        packet.extend_from_slice(&effect.effect_id.to_le_bytes());
        packet.extend_from_slice(&effect.app_code_epoch.to_le_bytes());
        packet.push(executor);
        packet.push(scope);
        packet.extend_from_slice(&root.index.to_le_bytes());
        packet.extend_from_slice(&root.generation.to_le_bytes());
        packet.extend_from_slice(&reference.index.to_le_bytes());
        packet.extend_from_slice(&reference.generation.to_le_bytes());
        packet.extend_from_slice(&binding_generation.to_le_bytes());
        packet.extend_from_slice(&effect.deadline_millis.to_le_bytes());
        packet.extend_from_slice(&kind_len.to_le_bytes());
        packet.extend_from_slice(&payload_len.to_le_bytes());
        packet.extend_from_slice(effect.kind.as_bytes());
        packet.extend_from_slice(&effect.payload);
        self.push_output(packet)
    }

    fn emit_cancelled_effects(
        &mut self,
        session: &mut vogui_runtime::UiSession,
        cancelled_effect_ids: &[u64],
    ) -> Result<(), u32> {
        if cancelled_effect_ids.is_empty() {
            return Ok(());
        }
        let expected = cancelled_effect_ids
            .iter()
            .copied()
            .collect::<BTreeSet<_>>();
        let completions = session
            .drain_effect_completions()
            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
        if completions.len() != expected.len() {
            return Err(PROVIDER_STATUS_INTERNAL_ERROR);
        }
        for completion in completions {
            if !expected.contains(&completion.effect_id)
                || !matches!(
                    completion.outcome,
                    vogui_runtime::async_runtime::EffectOutcome::Cancelled
                )
            {
                return Err(PROVIDER_STATUS_INTERNAL_ERROR);
            }
            if self.host_effects.remove(&completion.effect_id) {
                let mut packet = Vec::with_capacity(47);
                packet.extend_from_slice(b"vogui-host-effect-cancel-v1\0");
                packet.extend_from_slice(&completion.effect_id.to_le_bytes());
                packet.extend_from_slice(&completion.app_code_epoch.to_le_bytes());
                self.push_output(packet)?;
            }
            let (_, failure_mapper, source_root) = self
                .effect_mappers
                .remove(&completion.effect_id)
                .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
            self.emit_target_turn_from(source_root, failure_mapper, &[])?;
        }
        Ok(())
    }

    fn emit_effect_command(
        &mut self,
        session: &mut vogui_runtime::UiSession,
        effect: vogui_runtime::async_runtime::EffectRequest,
    ) -> Result<(), u32> {
        let vogui_runtime::async_runtime::EffectScope::Node {
            logical_ref,
            binding_generation,
            ..
        } = effect.scope
        else {
            return Err(PROVIDER_STATUS_INVALID_ARGUMENT);
        };
        let reference = self
            .ref_bindings
            .values()
            .find(|binding| {
                binding.reference.handle() == logical_ref
                    && binding.binding_generation == binding_generation
            })
            .map(|binding| binding.reference)
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let command_id = session
            .begin_command_with_deadline(
                reference,
                effect.kind,
                effect.payload,
                effect.deadline_millis,
            )
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let command = session
            .poll_command()
            .filter(|command| command.command_id == command_id)
            .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
        self.command_effects.insert(command_id, effect.effect_id);
        let packet = vogui_protocol::v2::encode_ui_command(
            vogui_protocol::v2::PacketHeader {
                kind: vogui_protocol::v2::MessageKind::UiCommand,
                ui_session: session.id(),
                ui_root: command.root,
                ui_root_epoch: command.ui_root_epoch,
                app_code_epoch: command.app_code_epoch,
                revision: command.min_applied_revision,
                sequence: command.command_id,
                payload_len: 0,
            },
            vogui_protocol::v2::UiCommandWire {
                request_id: command.command_id,
                target: command.target,
                expected_binding_generation: command.expected_binding_generation,
                deadline_millis: command.deadline_millis,
                kind: &command.kind,
                payload: &command.payload,
            },
        )
        .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        self.push_output(packet)
    }

    fn emit_target_turn_from(
        &mut self,
        source_root: Option<vogui_protocol::v2::UiRootId>,
        mapper_id: u32,
        payload: &[u8],
    ) -> Result<(), u32> {
        self.emit_target_turn_with_metadata(source_root, None, None, mapper_id, payload)
    }

    fn emit_target_turn_with_metadata(
        &mut self,
        source_root: Option<vogui_protocol::v2::UiRootId>,
        event_sequence: Option<u64>,
        event_revision: Option<u64>,
        mapper_id: u32,
        payload: &[u8],
    ) -> Result<(), u32> {
        let payload_len =
            u32::try_from(payload.len()).map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let mut turn = Vec::with_capacity(61 + payload.len());
        if let Some(root) = source_root {
            if let Some(sequence) = event_sequence {
                turn.extend_from_slice(b"vogui-target-turn-v3\0");
                turn.extend_from_slice(&mapper_id.to_le_bytes());
                turn.extend_from_slice(&root.index.to_le_bytes());
                turn.extend_from_slice(&root.generation.to_le_bytes());
                turn.extend_from_slice(&self.caller.endpoint_index.to_le_bytes());
                turn.extend_from_slice(&self.caller.endpoint_generation.to_le_bytes());
                turn.extend_from_slice(&sequence.to_le_bytes());
                turn.extend_from_slice(&event_revision.unwrap_or(0).to_le_bytes());
                turn.extend_from_slice(&payload_len.to_le_bytes());
                turn.extend_from_slice(payload);
                return self.push_output(turn);
            }
            turn.extend_from_slice(b"vogui-target-turn-v2\0");
            turn.extend_from_slice(&mapper_id.to_le_bytes());
            turn.extend_from_slice(&root.index.to_le_bytes());
            turn.extend_from_slice(&root.generation.to_le_bytes());
            turn.extend_from_slice(&self.caller.endpoint_index.to_le_bytes());
            turn.extend_from_slice(&self.caller.endpoint_generation.to_le_bytes());
            turn.extend_from_slice(&payload_len.to_le_bytes());
            turn.extend_from_slice(payload);
            return self.push_output(turn);
        }
        turn.extend_from_slice(b"vogui-target-turn-v1\0");
        turn.extend_from_slice(&mapper_id.to_le_bytes());
        turn.extend_from_slice(&payload_len.to_le_bytes());
        turn.extend_from_slice(payload);
        self.push_output(turn)
    }

    fn emit_effect_completion(
        &mut self,
        session: &mut vogui_runtime::UiSession,
        effect_id: u64,
    ) -> Result<(), u32> {
        let completion = session
            .drain_effect_completions()
            .map_err(|_| PROVIDER_STATUS_INTERNAL_ERROR)?;
        if completion.len() != 1 || completion[0].effect_id != effect_id {
            return Err(PROVIDER_STATUS_INTERNAL_ERROR);
        }
        let (success_mapper, failure_mapper, source_root) = self
            .effect_mappers
            .remove(&effect_id)
            .ok_or(PROVIDER_STATUS_INVALID_ARGUMENT)?;
        let (mapper, payload) = match &completion[0].outcome {
            vogui_runtime::async_runtime::EffectOutcome::Completed(payload) => {
                (success_mapper, payload.as_slice())
            }
            vogui_runtime::async_runtime::EffectOutcome::Failed(payload) => {
                (failure_mapper, payload.as_slice())
            }
            vogui_runtime::async_runtime::EffectOutcome::Cancelled
            | vogui_runtime::async_runtime::EffectOutcome::TimedOut => (failure_mapper, &[][..]),
        };
        self.emit_target_turn_from(source_root, mapper, payload)
    }

    fn emit_subscription_change(
        &mut self,
        change: vogui_runtime::async_runtime::SubscriptionChange,
    ) -> Result<(), u32> {
        let mut packet = Vec::new();
        packet.extend_from_slice(b"vogui-host-subscription-v1\0");
        match change {
            vogui_runtime::async_runtime::SubscriptionChange::Start { handle, spec } => {
                let kind_len =
                    u16::try_from(spec.kind.len()).map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
                let payload_len = u32::try_from(spec.payload.len())
                    .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
                packet.push(1);
                packet.extend_from_slice(&handle.index.to_le_bytes());
                packet.extend_from_slice(&handle.generation.to_le_bytes());
                packet.extend_from_slice(&kind_len.to_le_bytes());
                packet.extend_from_slice(&payload_len.to_le_bytes());
                packet.extend_from_slice(spec.kind.as_bytes());
                packet.extend_from_slice(&spec.payload);
            }
            vogui_runtime::async_runtime::SubscriptionChange::Stop { handle } => {
                packet.push(2);
                packet.extend_from_slice(&handle.index.to_le_bytes());
                packet.extend_from_slice(&handle.generation.to_le_bytes());
            }
        }
        self.push_output(packet)
    }

    fn emit_presentation_batch(
        &mut self,
        session: &vogui_runtime::UiSession,
        root: vogui_protocol::v2::UiRootId,
        mut batch: vogui_runtime::PresentationBatch,
    ) -> Result<(), u32> {
        let mut bind_events = self.pending_bind_events.remove(&root).unwrap_or_default();
        let mut unbind_events = self.pending_unbind_events.remove(&root).unwrap_or_default();
        let mut bind_refs = self.pending_bind_refs.remove(&root).unwrap_or_default();
        let mut unbind_refs = self.pending_unbind_refs.remove(&root).unwrap_or_default();
        let mut attach_resources = self
            .pending_attach_resources
            .remove(&root)
            .unwrap_or_default();
        let mut detach_resources = self
            .pending_detach_resources
            .remove(&root)
            .unwrap_or_default();
        let replacement = matches!(
            batch,
            vogui_runtime::PresentationBatch::SnapshotRequired { .. }
        );
        if replacement {
            bind_events = self
                .event_bindings
                .iter()
                .filter(|((logical_root, _, _), _)| {
                    self.ui_roots.get(logical_root).copied() == Some(root)
                })
                .map(|((_, _, event_kind), binding)| {
                    vogui_runtime::target_presentation::TargetWireEventBinding {
                        node: binding.node,
                        event_kind: *event_kind,
                        token: binding.token,
                    }
                })
                .collect();
            unbind_events.clear();
            bind_refs = self
                .ref_bindings
                .iter()
                .filter(|((logical_root, _), _)| {
                    self.ui_roots.get(logical_root).copied() == Some(root)
                })
                .map(
                    |(_, binding)| vogui_runtime::target_presentation::TargetWireRefBinding {
                        node: binding.node,
                        reference: binding.reference.handle(),
                        binding_generation: binding.binding_generation,
                    },
                )
                .collect();
            unbind_refs.clear();
            attach_resources = self
                .resource_leases
                .values()
                .filter(|binding| binding.lease.root == root)
                .map(
                    |binding| vogui_runtime::target_presentation::TargetWireResourceBinding {
                        node: binding.node,
                        resource: binding.lease.resource.handle,
                        source_revision: binding.source_revision,
                    },
                )
                .collect();
            detach_resources.clear();
        }
        let (kind, ui_root_epoch, app_code_epoch, revision, presentation_bytes) = match &mut batch {
            vogui_runtime::PresentationBatch::Patch {
                ui_root_epoch,
                app_code_epoch,
                new_revision,
                bytes,
                ..
            } => (
                vogui_protocol::v2::MessageKind::UiPatch,
                *ui_root_epoch,
                *app_code_epoch,
                *new_revision,
                bytes,
            ),
            vogui_runtime::PresentationBatch::SnapshotRequired {
                ui_root_epoch,
                app_code_epoch,
                revision,
                bytes,
                ..
            } => (
                vogui_protocol::v2::MessageKind::UiSnapshot,
                *ui_root_epoch,
                *app_code_epoch,
                *revision,
                bytes,
            ),
        };
        vogui_runtime::target_presentation::append_target_binding_mutations(
            presentation_bytes,
            &bind_events,
            &unbind_events,
            &bind_refs,
            &unbind_refs,
            &attach_resources,
            &detach_resources,
            vogui_protocol::v2::MAX_PACKET_BYTES.saturating_sub(vogui_protocol::v2::HEADER_BYTES),
        )
        .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        if !self.surface_attached.contains(&root) {
            self.emit_surface_attach(session.id(), root, ui_root_epoch, app_code_epoch, revision)?;
            self.surface_attached.insert(root);
        }
        let sequence = self.next_presentation_sequence;
        self.next_presentation_sequence = sequence
            .checked_add(1)
            .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
        let packet = vogui_protocol::v2::encode_packet(
            vogui_protocol::v2::PacketHeader {
                kind,
                ui_session: session.id(),
                ui_root: root,
                ui_root_epoch,
                app_code_epoch,
                revision,
                sequence,
                payload_len: 0,
            },
            presentation_bytes,
        )
        .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        self.push_output(packet)?;
        let retired = detach_resources
            .iter()
            .filter(|(_, resource)| {
                !self.resource_leases.values().any(|binding| {
                    binding.lease.root == root && binding.lease.resource.handle == *resource
                })
            })
            .map(|(_, resource)| *resource)
            .collect::<BTreeSet<_>>();
        for resource in retired {
            let mut payload = Vec::with_capacity(16);
            payload.extend_from_slice(&resource.index.to_le_bytes());
            payload.extend_from_slice(&resource.generation.to_le_bytes());
            let source_revision = 1_u64;
            payload.extend_from_slice(&source_revision.to_le_bytes());
            let sequence = self.next_presentation_sequence;
            self.next_presentation_sequence = sequence
                .checked_add(1)
                .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
            let packet = vogui_protocol::v2::encode_packet(
                vogui_protocol::v2::PacketHeader {
                    kind: vogui_protocol::v2::MessageKind::UiResourceRetire,
                    ui_session: session.id(),
                    ui_root: root,
                    ui_root_epoch,
                    app_code_epoch,
                    revision,
                    sequence,
                    payload_len: 0,
                },
                &payload,
            )
            .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
            self.push_output(packet)?;
        }
        Ok(())
    }

    fn emit_surface_attach(
        &mut self,
        session: vogui_protocol::v2::UiSessionId,
        root: vogui_protocol::v2::UiRootId,
        ui_root_epoch: u32,
        app_code_epoch: u64,
        revision: u64,
    ) -> Result<(), u32> {
        let endpoint = vogui_protocol::v2::Handle {
            index: self.caller.endpoint_index,
            generation: self.caller.endpoint_generation,
        };
        let mut payload = Vec::with_capacity(38);
        payload.push(1);
        for handle in [session, endpoint, endpoint, endpoint] {
            payload.extend_from_slice(&handle.index.to_le_bytes());
            payload.extend_from_slice(&handle.generation.to_le_bytes());
        }
        payload.extend_from_slice(&0_i32.to_le_bytes());
        payload.push(1);
        let sequence = self.next_presentation_sequence;
        self.next_presentation_sequence = sequence
            .checked_add(1)
            .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
        let packet = vogui_protocol::v2::encode_packet(
            vogui_protocol::v2::PacketHeader {
                kind: vogui_protocol::v2::MessageKind::UiSurfaceControl,
                ui_session: session,
                ui_root: root,
                ui_root_epoch,
                app_code_epoch,
                revision,
                sequence,
                payload_len: 0,
            },
            &payload,
        )
        .map_err(|_| PROVIDER_STATUS_INVALID_ARGUMENT)?;
        self.push_output(packet)
    }

    fn push_output(&mut self, packet: Vec<u8>) -> Result<(), u32> {
        if self.pending_output.len() == 4096 {
            return Err(PROVIDER_STATUS_INVALID_STATE);
        }
        let next_bytes = self
            .pending_output_bytes
            .checked_add(packet.len())
            .filter(|bytes| *bytes <= 16 * 1024 * 1024)
            .ok_or(PROVIDER_STATUS_INVALID_STATE)?;
        self.pending_output.push_back(packet);
        self.pending_output_bytes = next_bytes;
        Ok(())
    }

    fn preflight_output_capacity(
        &self,
        additional_packets: usize,
        additional_bytes: usize,
    ) -> Result<(), u32> {
        if self
            .pending_output
            .len()
            .checked_add(additional_packets)
            .is_none_or(|count| count > 4096)
            || self
                .pending_output_bytes
                .checked_add(additional_bytes)
                .is_none_or(|bytes| bytes > 16 * 1024 * 1024)
        {
            return Err(PROVIDER_STATUS_INVALID_STATE);
        }
        Ok(())
    }

    fn flush_pending_output(&mut self) -> Result<(), u32> {
        let publish = self
            .host
            .publish_endpoint_packet
            .ok_or(PROVIDER_STATUS_INTERNAL_ERROR)?;
        while let Some(packet) = self.pending_output.front() {
            let status = unsafe {
                publish(
                    self.host.context,
                    self.caller,
                    HostResourceHandle::INVALID,
                    0,
                    HostByteSpan {
                        ptr: packet.as_ptr(),
                        len: packet.len() as u32,
                        reserved: 0,
                    },
                )
            };
            if status == HOST_SERVICE_STATUS_WOULD_BLOCK {
                return Ok(());
            }
            if status != HOST_SERVICE_STATUS_OK {
                return Err(PROVIDER_STATUS_INTERNAL_ERROR);
            }
            let packet = self.pending_output.pop_front().unwrap();
            self.pending_output_bytes -= packet.len();
        }
        Ok(())
    }
}

const fn invalid_protocol_handle() -> vogui_protocol::v2::Handle {
    vogui_protocol::v2::Handle {
        index: u32::MAX,
        generation: 0,
    }
}

fn map_command_outcome(
    outcome: vogui_protocol::v2::UiCommandOutcomeWire,
) -> vogui_runtime::command::UiCommandOutcome {
    match outcome {
        vogui_protocol::v2::UiCommandOutcomeWire::Executed => {
            vogui_runtime::command::UiCommandOutcome::Executed
        }
        vogui_protocol::v2::UiCommandOutcomeWire::Measured(measurement) => {
            vogui_runtime::command::UiCommandOutcome::Measured(
                vogui_runtime::command::UiMeasurement {
                    target: measurement.target,
                    binding_generation: measurement.binding_generation,
                    metrics_revision: measurement.metrics_revision,
                    layout_revision: measurement.layout_revision,
                    coordinate_space: match measurement.coordinate_space {
                        1 => vogui_runtime::command::UiCoordinateSpace::CssViewport,
                        _ => return vogui_runtime::command::UiCommandOutcome::Failed,
                    },
                    x_milli: measurement.x_milli,
                    y_milli: measurement.y_milli,
                    width_milli: measurement.width_milli,
                    height_milli: measurement.height_milli,
                },
            )
        }
        vogui_protocol::v2::UiCommandOutcomeWire::StaleBinding => {
            vogui_runtime::command::UiCommandOutcome::StaleBinding
        }
        vogui_protocol::v2::UiCommandOutcomeWire::DeadlineExpired => {
            vogui_runtime::command::UiCommandOutcome::DeadlineExpired
        }
        vogui_protocol::v2::UiCommandOutcomeWire::FutureRevision => {
            vogui_runtime::command::UiCommandOutcome::FutureRevision
        }
        vogui_protocol::v2::UiCommandOutcomeWire::Capacity
        | vogui_protocol::v2::UiCommandOutcomeWire::Unsupported
        | vogui_protocol::v2::UiCommandOutcomeWire::RendererUnavailable => {
            vogui_runtime::command::UiCommandOutcome::Failed
        }
    }
}

fn command_effect_outcome(
    outcome: vogui_runtime::command::UiCommandOutcome,
) -> vogui_runtime::async_runtime::EffectOutcome {
    match outcome {
        vogui_runtime::command::UiCommandOutcome::Executed => {
            vogui_runtime::async_runtime::EffectOutcome::Completed(Vec::new())
        }
        vogui_runtime::command::UiCommandOutcome::Measured(measurement) => {
            let mut payload = Vec::with_capacity(65);
            payload.extend_from_slice(b"VGM1");
            payload.extend_from_slice(&measurement.target.index.to_le_bytes());
            payload.extend_from_slice(&measurement.target.generation.to_le_bytes());
            payload.extend_from_slice(&measurement.binding_generation.to_le_bytes());
            payload.extend_from_slice(&measurement.metrics_revision.to_le_bytes());
            payload.extend_from_slice(&measurement.layout_revision.to_le_bytes());
            payload.push(match measurement.coordinate_space {
                vogui_runtime::command::UiCoordinateSpace::CssViewport => 1,
            });
            payload.extend_from_slice(&measurement.x_milli.to_le_bytes());
            payload.extend_from_slice(&measurement.y_milli.to_le_bytes());
            payload.extend_from_slice(&measurement.width_milli.to_le_bytes());
            payload.extend_from_slice(&measurement.height_milli.to_le_bytes());
            vogui_runtime::async_runtime::EffectOutcome::Completed(payload)
        }
        vogui_runtime::command::UiCommandOutcome::DroppedBeforeDispatch => {
            vogui_runtime::async_runtime::EffectOutcome::Failed(vec![1])
        }
        vogui_runtime::command::UiCommandOutcome::OutcomeUnknownOnRendererRestart => {
            vogui_runtime::async_runtime::EffectOutcome::Failed(vec![2])
        }
        vogui_runtime::command::UiCommandOutcome::Failed => {
            vogui_runtime::async_runtime::EffectOutcome::Failed(vec![3])
        }
        vogui_runtime::command::UiCommandOutcome::Cancelled => {
            vogui_runtime::async_runtime::EffectOutcome::Cancelled
        }
        vogui_runtime::command::UiCommandOutcome::StaleBinding => {
            vogui_runtime::async_runtime::EffectOutcome::Failed(vec![4])
        }
        vogui_runtime::command::UiCommandOutcome::DeadlineExpired => {
            vogui_runtime::async_runtime::EffectOutcome::TimedOut
        }
        vogui_runtime::command::UiCommandOutcome::FutureRevision => {
            vogui_runtime::async_runtime::EffectOutcome::Failed(vec![5])
        }
    }
}

fn event_kind_name(kind: u64) -> Result<&'static str, u32> {
    match kind {
        1 => Ok("press"),
        2 => Ok("textEdit"),
        3 => Ok("keyDown"),
        4 => Ok("keyUp"),
        5 => Ok("focusIn"),
        6 => Ok("focusOut"),
        7 => Ok("pointerDown"),
        8 => Ok("pointerUp"),
        9 => Ok("dragEnter"),
        10 => Ok("dragOver"),
        11 => Ok("dragLeave"),
        12 => Ok("drop"),
        13 => Ok("change"),
        14 => Ok("input"),
        15 => Ok("submit"),
        16 => Ok("dismiss"),
        17 => Ok("select"),
        18 => Ok("toggle"),
        19 => Ok("open"),
        20 => Ok("close"),
        21 => Ok("pointerMove"),
        22 => Ok("pointerCancel"),
        23 => Ok("wheel"),
        24 => Ok("contextMenu"),
        25 => Ok("compositionStart"),
        26 => Ok("compositionUpdate"),
        27 => Ok("compositionCommit"),
        28 => Ok("compositionCancel"),
        _ => Err(PROVIDER_STATUS_INVALID_ARGUMENT),
    }
}

fn resource_kind_tag(kind: vogui_runtime::resource::UiResourceKind) -> u8 {
    match kind {
        vogui_runtime::resource::UiResourceKind::Image => 1,
        vogui_runtime::resource::UiResourceKind::Font => 2,
        vogui_runtime::resource::UiResourceKind::IconSvg => 3,
        vogui_runtime::resource::UiResourceKind::Cursor => 4,
        vogui_runtime::resource::UiResourceKind::LocalizedText => 5,
        vogui_runtime::resource::UiResourceKind::CanvasPaint => 6,
    }
}

fn abi_guard(operation: impl FnOnce() -> Result<(), u32>) -> u32 {
    match catch_unwind(AssertUnwindSafe(operation)) {
        Ok(Ok(())) => PROVIDER_STATUS_OK,
        Ok(Err(status)) => status,
        Err(_) => PROVIDER_STATUS_INTERNAL_ERROR,
    }
}

fn force_link_profile_closure() {
    let identity = vogui_runtime::vogui_profile_link_anchor();
    #[cfg(any(
        feature = "profile-native-gpu-minimal",
        feature = "profile-native-gpu-full",
        feature = "profile-native-gpu-editor",
        feature = "profile-native-gpu-overlay-minimal"
    ))]
    let identity = {
        let mut identity = identity;
        identity ^= vogui_layout::vogui_profile_link_anchor();
        identity ^= vogui_text::vogui_profile_link_anchor();
        identity ^= vogui_native_renderer::vogui_profile_link_anchor();
        identity ^= vogui_native_accessibility::vogui_profile_link_anchor();
        identity
    };
    std::hint::black_box(identity);
}

pub const fn compiled_profile_name() -> &'static str {
    PROFILE_NAME
}

vo_ext::export_extensions!(vo_ext::vo_extension_entry!("vogui", "RunEntry"));
vo_ext::export_wasm_extension_protocol!();
