use std::collections::{BTreeMap, BTreeSet, VecDeque};

use vogui_protocol::v2::{Handle, UiRootId, UiSessionId};

#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct UiResourceId {
    pub session: UiSessionId,
    pub handle: Handle,
}

#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct UiResourceLease {
    pub resource: UiResourceId,
    pub root: UiRootId,
    pub handle: Handle,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum UiResourceKind {
    Image,
    Font,
    IconSvg,
    Cursor,
    LocalizedText,
    CanvasPaint,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UiResourceDescriptor {
    pub kind: UiResourceKind,
    pub locator: Vec<u8>,
    pub content_hash: [u8; 32],
    pub options: Vec<u8>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiResourceState {
    Requested,
    Fetching,
    Ready,
    Failed,
    Cancelled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UiResourceFetchWork {
    pub resource: UiResourceId,
    pub source_revision: u64,
    pub job_generation: Handle,
    pub descriptor: UiResourceDescriptor,
    pub deadline_millis: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UiResourcePublication {
    pub resource: UiResourceId,
    pub source_revision: u64,
    pub kind: UiResourceKind,
    pub content_hash: [u8; 32],
    pub bytes: Vec<u8>,
    pub metadata: Vec<u8>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiResourceStoreConfig {
    pub max_resources: usize,
    pub max_descriptor_bytes: usize,
    pub max_source_bytes: usize,
    pub max_metadata_bytes: usize,
    pub max_total_source_bytes: usize,
    pub max_leases: usize,
    pub max_fetch_jobs: usize,
}

impl Default for UiResourceStoreConfig {
    fn default() -> Self {
        Self {
            max_resources: 4096,
            max_descriptor_bytes: 16 * 1024,
            max_source_bytes: 16 * 1024 * 1024,
            max_metadata_bytes: 256 * 1024,
            max_total_source_bytes: 64 * 1024 * 1024,
            max_leases: 65_536,
            max_fetch_jobs: 4096,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiResourceError {
    InvalidConfig,
    WrongSession,
    InvalidIdentity,
    ResourceCapacity,
    DescriptorCapacity,
    DuplicateResource,
    UnknownResource,
    LeaseCapacity,
    UnknownLease,
    FetchCapacity,
    InvalidState,
    SourceCapacity,
    MetadataCapacity,
    TotalSourceCapacity,
    StaleSourceRevision,
    ContentHashMismatch,
    StaleJob,
    StaleRenderer,
    StaleDevice,
    ResidencyCapacity,
    GenerationExhausted,
    Closed,
}

#[derive(Debug)]
struct ResourceRecord {
    descriptor: UiResourceDescriptor,
    source_revision: u64,
    job_generation: Handle,
    state: UiResourceState,
    published_revision: Option<u64>,
    published_content_hash: [u8; 32],
    bytes: Vec<u8>,
    metadata: Vec<u8>,
    leases: BTreeSet<Handle>,
    queued: bool,
    deadline_millis: u64,
}

#[derive(Clone, Copy, Debug)]
struct LeaseRecord {
    resource: UiResourceId,
    root: UiRootId,
}

pub struct UiResourceStore {
    session: UiSessionId,
    config: UiResourceStoreConfig,
    resources: Vec<Option<ResourceRecord>>,
    resource_generations: Vec<u32>,
    free_resources: BTreeSet<u32>,
    leases: Vec<Option<LeaseRecord>>,
    lease_generations: Vec<u32>,
    free_leases: BTreeSet<u32>,
    fetch_queue: VecDeque<UiResourceId>,
    live_resources: usize,
    live_leases: usize,
    source_bytes: usize,
    closed: bool,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct UiResourceInstrumentation {
    pub live_resources: usize,
    pub live_leases: usize,
    pub source_bytes: usize,
    pub fetch_jobs: usize,
    pub closed: bool,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct UiResourceShutdown {
    pub released_leases: usize,
    pub released_resources: usize,
    pub cancelled_fetch_jobs: usize,
    pub released_source_bytes: usize,
}

impl UiResourceStore {
    pub fn new(
        session: UiSessionId,
        config: UiResourceStoreConfig,
    ) -> Result<Self, UiResourceError> {
        if !session.is_valid()
            || config.max_resources == 0
            || config.max_resources > u32::MAX as usize
            || config.max_descriptor_bytes == 0
            || config.max_source_bytes == 0
            || config.max_metadata_bytes == 0
            || config.max_total_source_bytes == 0
            || config.max_leases == 0
            || config.max_leases > u32::MAX as usize
            || config.max_fetch_jobs == 0
        {
            return Err(UiResourceError::InvalidConfig);
        }
        Ok(Self {
            session,
            config,
            resources: Vec::new(),
            resource_generations: Vec::new(),
            free_resources: BTreeSet::new(),
            leases: Vec::new(),
            lease_generations: Vec::new(),
            free_leases: BTreeSet::new(),
            fetch_queue: VecDeque::new(),
            live_resources: 0,
            live_leases: 0,
            source_bytes: 0,
            closed: false,
        })
    }

    pub fn instrumentation(&self) -> UiResourceInstrumentation {
        UiResourceInstrumentation {
            live_resources: self.live_resources,
            live_leases: self.live_leases,
            source_bytes: self.source_bytes,
            fetch_jobs: self.fetch_queue.len(),
            closed: self.closed,
        }
    }

    pub fn preflight_shutdown(&self) -> Result<(), UiResourceError> {
        if self.closed {
            return Ok(());
        }
        for (index, lease) in self.leases.iter().enumerate() {
            if lease.is_some() {
                self.lease_generations[index]
                    .checked_add(1)
                    .ok_or(UiResourceError::GenerationExhausted)?;
            }
        }
        for (index, resource) in self.resources.iter().enumerate() {
            if resource.is_some() {
                self.resource_generations[index]
                    .checked_add(1)
                    .ok_or(UiResourceError::GenerationExhausted)?;
            }
        }
        Ok(())
    }

    pub fn shutdown(&mut self) -> Result<UiResourceShutdown, UiResourceError> {
        if self.closed {
            return Ok(UiResourceShutdown::default());
        }
        self.preflight_shutdown()?;
        let leases = self
            .leases
            .iter()
            .enumerate()
            .filter_map(|(index, record)| {
                let record = record.as_ref()?;
                Some(UiResourceLease {
                    resource: record.resource,
                    root: record.root,
                    handle: Handle {
                        index: index as u32,
                        generation: self.lease_generations[index],
                    },
                })
            })
            .collect::<Vec<_>>();
        let resources = self
            .resources
            .iter()
            .enumerate()
            .filter_map(|(index, record)| {
                record.as_ref().map(|_| UiResourceId {
                    session: self.session,
                    handle: Handle {
                        index: index as u32,
                        generation: self.resource_generations[index],
                    },
                })
            })
            .collect::<Vec<_>>();
        let report = UiResourceShutdown {
            released_leases: leases.len(),
            released_resources: resources.len(),
            cancelled_fetch_jobs: self.fetch_queue.len(),
            released_source_bytes: self.source_bytes,
        };
        for lease in leases {
            self.release(lease)?;
        }
        for resource in resources {
            self.unregister(resource)?;
        }
        self.closed = true;
        Ok(report)
    }

    pub fn register(
        &mut self,
        descriptor: UiResourceDescriptor,
    ) -> Result<UiResourceId, UiResourceError> {
        self.ensure_open()?;
        validate_descriptor(&descriptor, self.config)?;
        if self.live_resources == self.config.max_resources {
            return Err(UiResourceError::ResourceCapacity);
        }
        if self.resources.iter().flatten().any(|record| {
            record.descriptor.kind == descriptor.kind
                && record.descriptor.locator == descriptor.locator
        }) {
            return Err(UiResourceError::DuplicateResource);
        }
        let index = take_slot(
            &mut self.resources,
            &mut self.resource_generations,
            &mut self.free_resources,
        );
        let resource = UiResourceId {
            session: self.session,
            handle: Handle {
                index,
                generation: self.resource_generations[index as usize],
            },
        };
        self.resources[index as usize] = Some(ResourceRecord {
            descriptor,
            source_revision: 1,
            job_generation: Handle {
                index,
                generation: 1,
            },
            state: UiResourceState::Requested,
            published_revision: None,
            published_content_hash: [0; 32],
            bytes: Vec::new(),
            metadata: Vec::new(),
            leases: BTreeSet::new(),
            queued: false,
            deadline_millis: 0,
        });
        self.live_resources += 1;
        Ok(resource)
    }

    pub fn preflight_reconcile(
        &self,
        new_descriptors: &[UiResourceDescriptor],
        reloads: &[(UiResourceId, UiResourceDescriptor)],
        existing_acquires: &[(UiRootId, UiResourceId)],
        new_resource_acquires: usize,
        releases: &[UiResourceLease],
        unregisters: &[UiResourceId],
    ) -> Result<(), UiResourceError> {
        self.ensure_open()?;
        let mut unregister_handles = BTreeSet::new();
        for resource in unregisters {
            let index = self.resource_index(*resource)?;
            let record = self.resources[index]
                .as_ref()
                .ok_or(UiResourceError::UnknownResource)?;
            if !record
                .leases
                .iter()
                .all(|handle| releases.iter().any(|lease| lease.handle == *handle))
                || !unregister_handles.insert(resource.handle)
            {
                return Err(UiResourceError::InvalidState);
            }
            self.resource_generations[index]
                .checked_add(1)
                .ok_or(UiResourceError::GenerationExhausted)?;
        }
        if self
            .live_resources
            .checked_sub(unregisters.len())
            .and_then(|count| count.checked_add(new_descriptors.len()))
            .is_none_or(|count| count > self.config.max_resources)
        {
            return Err(UiResourceError::ResourceCapacity);
        }
        let mut reload_descriptors = BTreeMap::new();
        for (resource, descriptor) in reloads {
            validate_descriptor(descriptor, self.config)?;
            let current = self.resource(*resource)?;
            if descriptor.kind != current.descriptor.kind
                || reload_descriptors
                    .insert(resource.handle, descriptor)
                    .is_some()
            {
                return Err(UiResourceError::InvalidIdentity);
            }
            current
                .source_revision
                .checked_add(1)
                .ok_or(UiResourceError::GenerationExhausted)?;
            current
                .job_generation
                .generation
                .checked_add(1)
                .ok_or(UiResourceError::GenerationExhausted)?;
        }
        let mut descriptor_keys = self
            .resources
            .iter()
            .enumerate()
            .filter_map(|(index, record)| {
                let record = record.as_ref()?;
                let handle = Handle {
                    index: index as u32,
                    generation: self.resource_generations[index],
                };
                (!unregister_handles.contains(&handle)).then_some((handle, record))
            })
            .map(|(handle, record)| {
                let descriptor = reload_descriptors
                    .get(&handle)
                    .copied()
                    .unwrap_or(&record.descriptor);
                (descriptor.kind, descriptor.locator.clone())
            })
            .collect::<Vec<_>>();
        let descriptor_count = descriptor_keys.len();
        let mut descriptor_keys = descriptor_keys.drain(..).collect::<BTreeSet<_>>();
        if descriptor_keys.len() != descriptor_count {
            return Err(UiResourceError::DuplicateResource);
        }
        for descriptor in new_descriptors {
            validate_descriptor(descriptor, self.config)?;
            if !descriptor_keys.insert((descriptor.kind, descriptor.locator.clone())) {
                return Err(UiResourceError::DuplicateResource);
            }
        }
        for (root, resource) in existing_acquires {
            if !root.is_valid() || *root == Handle::INVALID {
                return Err(UiResourceError::InvalidIdentity);
            }
            self.resource(*resource)?;
        }
        let mut release_handles = BTreeSet::new();
        for lease in releases {
            let index = self.lease_index(*lease)?;
            let record = self.leases[index].ok_or(UiResourceError::UnknownLease)?;
            if record.resource != lease.resource
                || record.root != lease.root
                || !release_handles.insert(lease.handle)
            {
                return Err(UiResourceError::UnknownLease);
            }
            self.lease_generations[index]
                .checked_add(1)
                .ok_or(UiResourceError::GenerationExhausted)?;
        }
        let additions = existing_acquires
            .len()
            .checked_add(new_resource_acquires)
            .ok_or(UiResourceError::LeaseCapacity)?;
        self.live_leases
            .checked_sub(releases.len())
            .and_then(|count| count.checked_add(additions))
            .filter(|count| *count <= self.config.max_leases)
            .ok_or(UiResourceError::LeaseCapacity)?;
        Ok(())
    }

    pub fn unregister(&mut self, resource: UiResourceId) -> Result<(), UiResourceError> {
        let index = self.resource_index(resource)?;
        let record = self.resources[index]
            .as_ref()
            .ok_or(UiResourceError::UnknownResource)?;
        if !record.leases.is_empty() {
            return Err(UiResourceError::InvalidState);
        }
        self.source_bytes = self
            .source_bytes
            .checked_sub(record.bytes.len())
            .ok_or(UiResourceError::InvalidState)?;
        self.fetch_queue.retain(|queued| *queued != resource);
        self.resources[index] = None;
        recycle_slot(
            index as u32,
            &mut self.resource_generations,
            &mut self.free_resources,
        )?;
        self.live_resources -= 1;
        Ok(())
    }

    pub fn acquire(
        &mut self,
        root: UiRootId,
        resource: UiResourceId,
        deadline_millis: u64,
    ) -> Result<UiResourceLease, UiResourceError> {
        if !root.is_valid() || root == Handle::INVALID {
            return Err(UiResourceError::InvalidIdentity);
        }
        self.resource(resource)?;
        if self.live_leases == self.config.max_leases {
            return Err(UiResourceError::LeaseCapacity);
        }
        let index = take_slot(
            &mut self.leases,
            &mut self.lease_generations,
            &mut self.free_leases,
        );
        let lease = UiResourceLease {
            resource,
            root,
            handle: Handle {
                index,
                generation: self.lease_generations[index as usize],
            },
        };
        self.leases[index as usize] = Some(LeaseRecord { resource, root });
        let record = self.resource_mut(resource)?;
        record.leases.insert(lease.handle);
        if matches!(
            record.state,
            UiResourceState::Requested | UiResourceState::Cancelled | UiResourceState::Failed
        ) {
            record.state = UiResourceState::Requested;
            record.deadline_millis = deadline_millis;
            if !record.queued {
                record.queued = true;
                self.fetch_queue.push_back(resource);
            }
        }
        self.live_leases += 1;
        Ok(lease)
    }

    pub fn release(&mut self, lease: UiResourceLease) -> Result<(), UiResourceError> {
        let index = self.lease_index(lease)?;
        let record = self.leases[index].ok_or(UiResourceError::UnknownLease)?;
        if record.resource != lease.resource || record.root != lease.root {
            return Err(UiResourceError::UnknownLease);
        }
        self.leases[index] = None;
        recycle_slot(
            index as u32,
            &mut self.lease_generations,
            &mut self.free_leases,
        )?;
        self.live_leases -= 1;
        let resource = self.resource_mut(lease.resource)?;
        resource.leases.remove(&lease.handle);
        if resource.leases.is_empty()
            && matches!(
                resource.state,
                UiResourceState::Requested | UiResourceState::Fetching
            )
        {
            resource.state = UiResourceState::Cancelled;
            resource.queued = false;
            self.fetch_queue.retain(|queued| *queued != lease.resource);
        }
        Ok(())
    }

    pub fn release_root(&mut self, root: UiRootId) -> Result<usize, UiResourceError> {
        let leases = self
            .leases
            .iter()
            .enumerate()
            .filter_map(|(index, record)| {
                record
                    .filter(|record| record.root == root)
                    .map(|record| UiResourceLease {
                        resource: record.resource,
                        root,
                        handle: Handle {
                            index: index as u32,
                            generation: self.lease_generations[index],
                        },
                    })
            })
            .collect::<Vec<_>>();
        if leases.iter().any(|lease| {
            self.lease_generations[lease.handle.index as usize]
                .checked_add(1)
                .is_none()
        }) {
            return Err(UiResourceError::GenerationExhausted);
        }
        for lease in &leases {
            self.release(*lease)?;
        }
        Ok(leases.len())
    }

    pub fn poll_fetch(&mut self) -> Option<UiResourceFetchWork> {
        while let Some(resource) = self.fetch_queue.pop_front() {
            let record = self.resource_mut(resource).ok()?;
            record.queued = false;
            if record.leases.is_empty() || record.state != UiResourceState::Requested {
                continue;
            }
            record.state = UiResourceState::Fetching;
            return Some(UiResourceFetchWork {
                resource,
                source_revision: record.source_revision,
                job_generation: record.job_generation,
                descriptor: record.descriptor.clone(),
                deadline_millis: record.deadline_millis,
            });
        }
        None
    }

    pub fn complete_fetch(
        &mut self,
        work: &UiResourceFetchWork,
        observed_content_hash: [u8; 32],
        bytes: Vec<u8>,
        metadata: Vec<u8>,
    ) -> Result<UiResourcePublication, UiResourceError> {
        if bytes.len() > self.config.max_source_bytes {
            return Err(UiResourceError::SourceCapacity);
        }
        if metadata.len() > self.config.max_metadata_bytes {
            return Err(UiResourceError::MetadataCapacity);
        }
        let current = self.resource(work.resource)?;
        if current.source_revision != work.source_revision {
            return Err(UiResourceError::StaleSourceRevision);
        }
        if observed_content_hash != current.descriptor.content_hash {
            return Err(UiResourceError::ContentHashMismatch);
        }
        if current.job_generation != work.job_generation {
            return Err(UiResourceError::StaleJob);
        }
        if current.state != UiResourceState::Fetching || current.leases.is_empty() {
            return Err(UiResourceError::InvalidState);
        }
        let next_total = self
            .source_bytes
            .checked_sub(current.bytes.len())
            .and_then(|total| total.checked_add(bytes.len()))
            .filter(|total| *total <= self.config.max_total_source_bytes)
            .ok_or(UiResourceError::TotalSourceCapacity)?;
        let record = self.resource_mut(work.resource)?;
        record.bytes = bytes;
        record.metadata = metadata;
        record.published_revision = Some(work.source_revision);
        record.published_content_hash = observed_content_hash;
        record.state = UiResourceState::Ready;
        self.source_bytes = next_total;
        self.publication(work.resource)
    }

    pub fn expire(&mut self, now_millis: u64) -> Vec<UiResourceId> {
        let expired = self
            .resources
            .iter()
            .enumerate()
            .filter_map(|(index, record)| {
                let record = record.as_ref()?;
                (record.deadline_millis <= now_millis
                    && matches!(
                        record.state,
                        UiResourceState::Requested | UiResourceState::Fetching
                    ))
                .then_some(UiResourceId {
                    session: self.session,
                    handle: Handle {
                        index: index as u32,
                        generation: self.resource_generations[index],
                    },
                })
            })
            .collect::<Vec<_>>();
        for resource in &expired {
            if let Ok(record) = self.resource_mut(*resource) {
                record.state = UiResourceState::Cancelled;
                record.queued = false;
            }
        }
        if !expired.is_empty() {
            let expired = expired.iter().copied().collect::<BTreeSet<_>>();
            self.fetch_queue
                .retain(|resource| !expired.contains(resource));
        }
        expired.into_iter().collect()
    }

    pub fn fail_fetch(&mut self, work: &UiResourceFetchWork) -> Result<(), UiResourceError> {
        let record = self.resource_mut(work.resource)?;
        if record.source_revision != work.source_revision
            || record.job_generation != work.job_generation
        {
            return Err(UiResourceError::StaleJob);
        }
        if record.state != UiResourceState::Fetching {
            return Err(UiResourceError::InvalidState);
        }
        record.state = UiResourceState::Failed;
        Ok(())
    }

    pub fn hot_reload(
        &mut self,
        resource: UiResourceId,
        descriptor: UiResourceDescriptor,
        deadline_millis: u64,
    ) -> Result<u64, UiResourceError> {
        validate_descriptor(&descriptor, self.config)?;
        let current = self.resource(resource)?;
        if descriptor.kind != current.descriptor.kind {
            return Err(UiResourceError::InvalidIdentity);
        }
        let source_revision = current
            .source_revision
            .checked_add(1)
            .ok_or(UiResourceError::GenerationExhausted)?;
        let job_generation = current
            .job_generation
            .generation
            .checked_add(1)
            .ok_or(UiResourceError::GenerationExhausted)?;
        let has_leases = !current.leases.is_empty();
        let record = self.resource_mut(resource)?;
        record.descriptor = descriptor;
        record.source_revision = source_revision;
        record.job_generation.generation = job_generation;
        record.deadline_millis = deadline_millis;
        record.state = if has_leases {
            UiResourceState::Requested
        } else {
            UiResourceState::Cancelled
        };
        if has_leases && !record.queued {
            record.queued = true;
            self.fetch_queue.push_back(resource);
        }
        Ok(source_revision)
    }

    pub fn publication(
        &self,
        resource: UiResourceId,
    ) -> Result<UiResourcePublication, UiResourceError> {
        let record = self.resource(resource)?;
        let source_revision = record
            .published_revision
            .ok_or(UiResourceError::InvalidState)?;
        Ok(UiResourcePublication {
            resource,
            source_revision,
            kind: record.descriptor.kind,
            content_hash: record.published_content_hash,
            bytes: record.bytes.clone(),
            metadata: record.metadata.clone(),
        })
    }

    pub fn state(&self, resource: UiResourceId) -> Option<UiResourceState> {
        self.resource(resource).ok().map(|record| record.state)
    }

    fn resource(&self, resource: UiResourceId) -> Result<&ResourceRecord, UiResourceError> {
        let index = self.resource_index(resource)?;
        self.resources[index]
            .as_ref()
            .ok_or(UiResourceError::UnknownResource)
    }

    fn resource_mut(
        &mut self,
        resource: UiResourceId,
    ) -> Result<&mut ResourceRecord, UiResourceError> {
        let index = self.resource_index(resource)?;
        self.resources[index]
            .as_mut()
            .ok_or(UiResourceError::UnknownResource)
    }

    fn resource_index(&self, resource: UiResourceId) -> Result<usize, UiResourceError> {
        self.ensure_open()?;
        if resource.session != self.session || !resource.handle.is_valid() {
            return Err(UiResourceError::WrongSession);
        }
        let index = resource.handle.index as usize;
        if self.resource_generations.get(index).copied() != Some(resource.handle.generation) {
            return Err(UiResourceError::UnknownResource);
        }
        Ok(index)
    }

    fn lease_index(&self, lease: UiResourceLease) -> Result<usize, UiResourceError> {
        self.ensure_open()?;
        if lease.resource.session != self.session || !lease.handle.is_valid() {
            return Err(UiResourceError::WrongSession);
        }
        let index = lease.handle.index as usize;
        if self.lease_generations.get(index).copied() != Some(lease.handle.generation) {
            return Err(UiResourceError::UnknownLease);
        }
        Ok(index)
    }

    fn ensure_open(&self) -> Result<(), UiResourceError> {
        if self.closed {
            Err(UiResourceError::Closed)
        } else {
            Ok(())
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct UiRendererResidencyId {
    pub resource: UiResourceId,
    pub renderer_generation: Handle,
    pub device_generation: Option<Handle>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiRendererResidencyState {
    Decoding,
    Ready,
    Failed,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UiRendererResidencyWork {
    pub residency: UiRendererResidencyId,
    pub source_revision: u64,
    pub job_generation: Handle,
    pub publication: UiResourcePublication,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct UiRendererResourceCacheConfig {
    pub max_residencies: usize,
    pub max_handle_bytes: usize,
    pub max_total_handle_bytes: usize,
}

impl Default for UiRendererResourceCacheConfig {
    fn default() -> Self {
        Self {
            max_residencies: 4096,
            max_handle_bytes: 1024 * 1024,
            max_total_handle_bytes: 16 * 1024 * 1024,
        }
    }
}

#[derive(Debug)]
struct ResidencyRecord {
    source_revision: u64,
    job_generation: Handle,
    state: UiRendererResidencyState,
    handle_bytes: Vec<u8>,
}

pub struct UiRendererResourceCache {
    session: UiSessionId,
    renderer_generation: Handle,
    device_generation: Option<Handle>,
    config: UiRendererResourceCacheConfig,
    residencies: BTreeMap<UiResourceId, ResidencyRecord>,
    total_handle_bytes: usize,
}

impl UiRendererResourceCache {
    pub fn new(
        session: UiSessionId,
        renderer_generation: Handle,
        device_generation: Option<Handle>,
        config: UiRendererResourceCacheConfig,
    ) -> Result<Self, UiResourceError> {
        if !session.is_valid()
            || !renderer_generation.is_valid()
            || device_generation.is_some_and(|generation| !generation.is_valid())
            || config.max_residencies == 0
            || config.max_handle_bytes == 0
            || config.max_total_handle_bytes == 0
        {
            return Err(UiResourceError::InvalidConfig);
        }
        Ok(Self {
            session,
            renderer_generation,
            device_generation,
            config,
            residencies: BTreeMap::new(),
            total_handle_bytes: 0,
        })
    }

    pub fn request(
        &mut self,
        publication: UiResourcePublication,
    ) -> Result<UiRendererResidencyWork, UiResourceError> {
        if publication.resource.session != self.session {
            return Err(UiResourceError::WrongSession);
        }
        if !self.residencies.contains_key(&publication.resource)
            && self.residencies.len() == self.config.max_residencies
        {
            return Err(UiResourceError::ResidencyCapacity);
        }
        if let Some(record) = self.residencies.get(&publication.resource) {
            if record.source_revision > publication.source_revision
                || (record.source_revision == publication.source_revision
                    && record.state != UiRendererResidencyState::Failed)
            {
                return Err(UiResourceError::StaleSourceRevision);
            }
        }
        let next_generation =
            self.residencies
                .get(&publication.resource)
                .map_or(Ok(1), |record| {
                    record
                        .job_generation
                        .generation
                        .checked_add(1)
                        .ok_or(UiResourceError::GenerationExhausted)
                })?;
        if let Some(previous) = self.residencies.get(&publication.resource) {
            self.total_handle_bytes -= previous.handle_bytes.len();
        }
        let job_generation = Handle {
            index: publication.resource.handle.index,
            generation: next_generation,
        };
        self.residencies.insert(
            publication.resource,
            ResidencyRecord {
                source_revision: publication.source_revision,
                job_generation,
                state: UiRendererResidencyState::Decoding,
                handle_bytes: Vec::new(),
            },
        );
        Ok(UiRendererResidencyWork {
            residency: UiRendererResidencyId {
                resource: publication.resource,
                renderer_generation: self.renderer_generation,
                device_generation: self.device_generation,
            },
            source_revision: publication.source_revision,
            job_generation,
            publication,
        })
    }

    pub fn complete(
        &mut self,
        work: &UiRendererResidencyWork,
        handle_bytes: Vec<u8>,
    ) -> Result<(), UiResourceError> {
        self.validate_work(work)?;
        if handle_bytes.len() > self.config.max_handle_bytes {
            return Err(UiResourceError::SourceCapacity);
        }
        let record = self
            .residencies
            .get(&work.residency.resource)
            .ok_or(UiResourceError::UnknownResource)?;
        let next_total = self
            .total_handle_bytes
            .checked_sub(record.handle_bytes.len())
            .and_then(|total| total.checked_add(handle_bytes.len()))
            .filter(|total| *total <= self.config.max_total_handle_bytes)
            .ok_or(UiResourceError::TotalSourceCapacity)?;
        let record = self.residencies.get_mut(&work.residency.resource).unwrap();
        record.handle_bytes = handle_bytes;
        record.state = UiRendererResidencyState::Ready;
        self.total_handle_bytes = next_total;
        Ok(())
    }

    pub fn fail(&mut self, work: &UiRendererResidencyWork) -> Result<(), UiResourceError> {
        self.validate_work(work)?;
        self.residencies
            .get_mut(&work.residency.resource)
            .unwrap()
            .state = UiRendererResidencyState::Failed;
        Ok(())
    }

    pub fn restart(
        &mut self,
        renderer_generation: Handle,
        device_generation: Option<Handle>,
    ) -> Result<Vec<UiResourceId>, UiResourceError> {
        let invalid_device_transition = match (self.device_generation, device_generation) {
            (Some(current), Some(next)) => {
                current.index != next.index || next.generation < current.generation
            }
            (Some(_), None) => true,
            (None, _) => false,
        };
        if !renderer_generation.is_valid()
            || renderer_generation.index != self.renderer_generation.index
            || renderer_generation.generation <= self.renderer_generation.generation
            || device_generation.is_some_and(|generation| !generation.is_valid())
            || invalid_device_transition
        {
            return Err(UiResourceError::StaleRenderer);
        }
        self.renderer_generation = renderer_generation;
        self.device_generation = device_generation;
        let rebuild = self.residencies.keys().copied().collect();
        self.residencies.clear();
        self.total_handle_bytes = 0;
        Ok(rebuild)
    }

    pub fn restart_device(
        &mut self,
        device_generation: Handle,
    ) -> Result<Vec<UiResourceId>, UiResourceError> {
        let current = self.device_generation.ok_or(UiResourceError::StaleDevice)?;
        if !device_generation.is_valid()
            || device_generation.index != current.index
            || device_generation.generation <= current.generation
        {
            return Err(UiResourceError::StaleDevice);
        }
        self.device_generation = Some(device_generation);
        let rebuild = self.residencies.keys().copied().collect();
        self.residencies.clear();
        self.total_handle_bytes = 0;
        Ok(rebuild)
    }

    pub fn state(&self, resource: UiResourceId) -> Option<UiRendererResidencyState> {
        self.residencies.get(&resource).map(|record| record.state)
    }

    pub fn resident_handle(&self, resource: UiResourceId) -> Option<&[u8]> {
        self.residencies
            .get(&resource)
            .filter(|record| record.state == UiRendererResidencyState::Ready)
            .map(|record| record.handle_bytes.as_slice())
    }

    pub fn retire(
        &mut self,
        resource: UiResourceId,
        source_revision: u64,
    ) -> Result<(), UiResourceError> {
        if resource.session != self.session {
            return Err(UiResourceError::WrongSession);
        }
        let Some(record) = self.residencies.get(&resource) else {
            return Ok(());
        };
        if source_revision < record.source_revision {
            return Err(UiResourceError::StaleSourceRevision);
        }
        self.total_handle_bytes = self
            .total_handle_bytes
            .checked_sub(record.handle_bytes.len())
            .ok_or(UiResourceError::InvalidState)?;
        self.residencies.remove(&resource);
        Ok(())
    }

    fn validate_work(&self, work: &UiRendererResidencyWork) -> Result<(), UiResourceError> {
        if work.residency.renderer_generation != self.renderer_generation {
            return Err(UiResourceError::StaleRenderer);
        }
        if work.residency.device_generation != self.device_generation {
            return Err(UiResourceError::StaleDevice);
        }
        let record = self
            .residencies
            .get(&work.residency.resource)
            .ok_or(UiResourceError::UnknownResource)?;
        if record.source_revision != work.source_revision
            || record.job_generation != work.job_generation
            || record.state != UiRendererResidencyState::Decoding
        {
            return Err(UiResourceError::StaleJob);
        }
        Ok(())
    }
}

fn validate_descriptor(
    descriptor: &UiResourceDescriptor,
    config: UiResourceStoreConfig,
) -> Result<(), UiResourceError> {
    if descriptor.locator.is_empty()
        || descriptor
            .locator
            .len()
            .checked_add(descriptor.options.len())
            .is_none_or(|bytes| bytes > config.max_descriptor_bytes)
        || descriptor.content_hash.iter().all(|byte| *byte == 0)
    {
        return Err(UiResourceError::DescriptorCapacity);
    }
    Ok(())
}

fn take_slot<T>(
    slots: &mut Vec<Option<T>>,
    generations: &mut Vec<u32>,
    free: &mut BTreeSet<u32>,
) -> u32 {
    if let Some(index) = free.pop_first() {
        index
    } else {
        let index = slots.len() as u32;
        slots.push(None);
        generations.push(1);
        index
    }
}

fn recycle_slot(
    index: u32,
    generations: &mut [u32],
    free: &mut BTreeSet<u32>,
) -> Result<(), UiResourceError> {
    generations[index as usize] = generations[index as usize]
        .checked_add(1)
        .ok_or(UiResourceError::GenerationExhausted)?;
    free.insert(index);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn handle(index: u32, generation: u32) -> Handle {
        Handle { index, generation }
    }

    fn descriptor(locator: &str, hash: u8) -> UiResourceDescriptor {
        UiResourceDescriptor {
            kind: UiResourceKind::Image,
            locator: locator.as_bytes().to_vec(),
            content_hash: [hash; 32],
            options: Vec::new(),
        }
    }

    #[test]
    fn lease_drives_fetch_cancellation_and_hot_reload_invalidates_old_work() {
        let session = handle(1, 1);
        let root = handle(2, 1);
        let mut store = UiResourceStore::new(session, UiResourceStoreConfig::default()).unwrap();
        let resource = store.register(descriptor("hero", 1)).unwrap();
        let lease = store.acquire(root, resource, 100).unwrap();
        let original = store.poll_fetch().unwrap();

        assert_eq!(
            store.hot_reload(resource, descriptor("hero-v2", 2), 200),
            Ok(2)
        );
        assert_eq!(
            store.complete_fetch(&original, [1; 32], vec![1], Vec::new()),
            Err(UiResourceError::StaleSourceRevision)
        );
        let replacement = store.poll_fetch().unwrap();
        let publication = store
            .complete_fetch(&replacement, [2; 32], vec![7, 8], vec![9])
            .unwrap();
        assert_eq!(publication.source_revision, 2);
        assert_eq!(store.state(resource), Some(UiResourceState::Ready));

        store.release(lease).unwrap();
        store
            .hot_reload(resource, descriptor("hero-v3", 3), 300)
            .unwrap();
        assert_eq!(store.state(resource), Some(UiResourceState::Cancelled));
        assert!(store.poll_fetch().is_none());
    }

    #[test]
    fn residency_work_is_scoped_to_renderer_and_device_generations() {
        let session = handle(1, 1);
        let resource = UiResourceId {
            session,
            handle: handle(9, 1),
        };
        let publication = UiResourcePublication {
            resource,
            source_revision: 1,
            kind: UiResourceKind::Image,
            content_hash: [1; 32],
            bytes: vec![1, 2, 3],
            metadata: Vec::new(),
        };
        let mut cache = UiRendererResourceCache::new(
            session,
            handle(4, 1),
            Some(handle(5, 1)),
            UiRendererResourceCacheConfig::default(),
        )
        .unwrap();
        let stale = cache.request(publication.clone()).unwrap();
        cache.restart_device(handle(5, 2)).unwrap();
        assert_eq!(
            cache.complete(&stale, vec![10]),
            Err(UiResourceError::StaleDevice)
        );

        let current = cache.request(publication).unwrap();
        cache.complete(&current, vec![10, 11]).unwrap();
        assert_eq!(cache.resident_handle(resource), Some(&[10, 11][..]));
        cache.restart(handle(4, 2), Some(handle(5, 2))).unwrap();
        assert!(cache.resident_handle(resource).is_none());
    }
}
