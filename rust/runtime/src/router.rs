use std::collections::{BTreeMap, BTreeSet};

use vogui_protocol::v2::{Handle, UiRootId, UiSessionId};

pub type WindowId = Handle;

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct RouteId(pub u32);

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct RouteScopeId(pub Handle);

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum RouteSegment {
    Literal(String),
    Parameter(String),
    Rest(String),
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum RouteBehavior {
    View,
    Redirect { target: String },
    NotFound,
    ErrorBoundary,
    Lazy { capability: String },
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct RouteSpec {
    pub id: RouteId,
    pub parent: Option<RouteId>,
    pub path: Vec<RouteSegment>,
    pub index: bool,
    pub behavior: RouteBehavior,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RouteLocation {
    pub path: String,
    pub query: BTreeMap<String, String>,
    pub hash: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RouteMatch {
    pub route: RouteId,
    pub layout_chain: Vec<RouteId>,
    pub parameters: BTreeMap<String, String>,
    pub location: RouteLocation,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RouteResolution {
    Matched(RouteMatch),
    Redirected {
        navigation_id: u64,
        location: RouteLocation,
        matched: RouteMatch,
        redirects: Vec<RouteId>,
    },
    NotFound(RouteLocation),
    Error {
        location: RouteLocation,
        boundary: Option<RouteId>,
        error: RouterError,
    },
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum NavigationMode {
    PrimaryUrl,
    Memory,
    Namespace(String),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NavigationLease {
    pub window: WindowId,
    pub owner: UiSessionId,
    pub generation: u32,
    pub mode: NavigationMode,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NavigationTransferOffer {
    pub transfer_id: u64,
    pub window: WindowId,
    pub from: UiSessionId,
    pub to: UiSessionId,
    pub lease_generation: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RouterConfig {
    pub max_routes: usize,
    pub max_segments: usize,
    pub max_location_bytes: usize,
    pub max_query_fields: usize,
    pub max_redirect_depth: usize,
    pub max_history_entries: usize,
    pub max_scopes: usize,
}

impl Default for RouterConfig {
    fn default() -> Self {
        Self {
            max_routes: 4096,
            max_segments: 64,
            max_location_bytes: 16 * 1024,
            max_query_fields: 256,
            max_redirect_depth: 16,
            max_history_entries: 1024,
            max_scopes: 1024,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RouterError {
    InvalidConfig,
    InvalidIdentity,
    RouteCapacity,
    DuplicateRoute,
    DuplicatePattern,
    UnknownParent,
    ParentCycle,
    SegmentCapacity,
    InvalidPattern,
    LocationCapacity,
    QueryCapacity,
    InvalidLocation,
    RedirectCycle,
    RedirectDepth,
    NavigationSequence,
    HistoryCapacity,
    HistoryBoundary,
    LeaseConflict,
    LeaseMismatch,
    NamespaceConflict,
    TransferMismatch,
    ScopeCapacity,
    UnknownScope,
    GenerationExhausted,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum NavigationCause {
    Link,
    Programmatic,
    Back,
    Forward,
    DeepLink,
    Restore,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NavigationCommit {
    pub navigation_id: u64,
    pub cause: NavigationCause,
    pub resolution: RouteResolution,
    pub replace: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RootRouteBinding {
    FollowSessionRoute,
    Independent(RouteScopeId),
}

#[derive(Clone, Debug)]
struct WindowLeaseState {
    generation: u32,
    primary: Option<UiSessionId>,
    namespaces: BTreeMap<String, UiSessionId>,
    next_transfer_id: u64,
    transfer: Option<NavigationTransferOffer>,
}

pub struct NavigationLeaseRegistry {
    windows: BTreeMap<WindowId, WindowLeaseState>,
}

impl NavigationLeaseRegistry {
    pub fn new() -> Self {
        Self {
            windows: BTreeMap::new(),
        }
    }

    pub fn acquire(
        &mut self,
        window: WindowId,
        owner: UiSessionId,
        mode: NavigationMode,
    ) -> Result<NavigationLease, RouterError> {
        if !window.is_valid() || !owner.is_valid() {
            return Err(RouterError::InvalidIdentity);
        }
        let state = self.windows.entry(window).or_insert(WindowLeaseState {
            generation: 1,
            primary: None,
            namespaces: BTreeMap::new(),
            next_transfer_id: 1,
            transfer: None,
        });
        match &mode {
            NavigationMode::PrimaryUrl => match state.primary {
                Some(existing) if existing != owner => return Err(RouterError::LeaseConflict),
                _ => state.primary = Some(owner),
            },
            NavigationMode::Namespace(namespace) => {
                validate_namespace(namespace)?;
                match state.namespaces.get(namespace) {
                    Some(existing) if *existing != owner => {
                        return Err(RouterError::NamespaceConflict)
                    }
                    _ => {
                        state.namespaces.insert(namespace.clone(), owner);
                    }
                }
            }
            NavigationMode::Memory => {}
        }
        Ok(NavigationLease {
            window,
            owner,
            generation: state.generation,
            mode,
        })
    }

    pub fn release(&mut self, lease: &NavigationLease) -> Result<(), RouterError> {
        let state = self
            .windows
            .get_mut(&lease.window)
            .ok_or(RouterError::LeaseMismatch)?;
        if state.generation != lease.generation {
            return Err(RouterError::LeaseMismatch);
        }
        match &lease.mode {
            NavigationMode::PrimaryUrl if state.primary == Some(lease.owner) => {
                state.primary = None;
                state.transfer = None;
            }
            NavigationMode::Namespace(namespace)
                if state.namespaces.get(namespace) == Some(&lease.owner) =>
            {
                state.namespaces.remove(namespace);
            }
            NavigationMode::Memory => {}
            _ => return Err(RouterError::LeaseMismatch),
        }
        Ok(())
    }

    pub fn offer_primary_transfer(
        &mut self,
        lease: &NavigationLease,
        to: UiSessionId,
    ) -> Result<NavigationTransferOffer, RouterError> {
        if !to.is_valid() || !matches!(lease.mode, NavigationMode::PrimaryUrl) {
            return Err(RouterError::TransferMismatch);
        }
        let state = self
            .windows
            .get_mut(&lease.window)
            .ok_or(RouterError::LeaseMismatch)?;
        if state.generation != lease.generation || state.primary != Some(lease.owner) {
            return Err(RouterError::LeaseMismatch);
        }
        let transfer_id = state.next_transfer_id;
        state.next_transfer_id = transfer_id
            .checked_add(1)
            .ok_or(RouterError::GenerationExhausted)?;
        let offer = NavigationTransferOffer {
            transfer_id,
            window: lease.window,
            from: lease.owner,
            to,
            lease_generation: lease.generation,
        };
        state.transfer = Some(offer.clone());
        Ok(offer)
    }

    pub fn accept_primary_transfer(
        &mut self,
        offer: &NavigationTransferOffer,
        accepting_owner: UiSessionId,
    ) -> Result<NavigationLease, RouterError> {
        let state = self
            .windows
            .get_mut(&offer.window)
            .ok_or(RouterError::TransferMismatch)?;
        if accepting_owner != offer.to
            || state.transfer.as_ref() != Some(offer)
            || state.primary != Some(offer.from)
            || state.generation != offer.lease_generation
        {
            return Err(RouterError::TransferMismatch);
        }
        state.generation = state
            .generation
            .checked_add(1)
            .ok_or(RouterError::GenerationExhausted)?;
        state.primary = Some(accepting_owner);
        state.transfer = None;
        Ok(NavigationLease {
            window: offer.window,
            owner: accepting_owner,
            generation: state.generation,
            mode: NavigationMode::PrimaryUrl,
        })
    }
}

impl Default for NavigationLeaseRegistry {
    fn default() -> Self {
        Self::new()
    }
}

pub struct Router {
    session: UiSessionId,
    config: RouterConfig,
    lease: NavigationLease,
    routes: BTreeMap<RouteId, RouteSpec>,
    current: Option<RouteResolution>,
    history: Vec<RouteLocation>,
    history_index: usize,
    next_navigation_id: u64,
    scope_generations: Vec<u32>,
    free_scopes: Vec<u32>,
    scopes: BTreeMap<RouteScopeId, RouteResolution>,
    roots: BTreeMap<UiRootId, RootRouteBinding>,
}

impl Router {
    pub fn new(
        session: UiSessionId,
        config: RouterConfig,
        lease: NavigationLease,
        specs: Vec<RouteSpec>,
    ) -> Result<Self, RouterError> {
        validate_config(config)?;
        if !session.is_valid() || lease.owner != session {
            return Err(RouterError::InvalidIdentity);
        }
        if specs.len() > config.max_routes {
            return Err(RouterError::RouteCapacity);
        }
        let mut routes = BTreeMap::new();
        let mut patterns = BTreeSet::new();
        for spec in specs {
            validate_spec(&spec, config)?;
            if routes.insert(spec.id, spec.clone()).is_some() {
                return Err(RouterError::DuplicateRoute);
            }
            if !spec.index && !patterns.insert(spec.path.clone()) {
                return Err(RouterError::DuplicatePattern);
            }
        }
        validate_route_graph(&routes)?;
        Ok(Self {
            session,
            config,
            lease,
            routes,
            current: None,
            history: Vec::new(),
            history_index: 0,
            next_navigation_id: 1,
            scope_generations: Vec::new(),
            free_scopes: Vec::new(),
            scopes: BTreeMap::new(),
            roots: BTreeMap::new(),
        })
    }

    pub const fn session(&self) -> UiSessionId {
        self.session
    }

    pub fn lease(&self) -> &NavigationLease {
        &self.lease
    }

    pub fn current(&self) -> Option<&RouteResolution> {
        self.current.as_ref()
    }

    pub fn bind_root(
        &mut self,
        root: UiRootId,
        binding: RootRouteBinding,
    ) -> Result<(), RouterError> {
        if !root.is_valid() {
            return Err(RouterError::InvalidIdentity);
        }
        if let RootRouteBinding::Independent(scope) = binding {
            if !self.scopes.contains_key(&scope) {
                return Err(RouterError::UnknownScope);
            }
        }
        self.roots.insert(root, binding);
        Ok(())
    }

    pub fn unbind_root(&mut self, root: UiRootId) {
        self.roots.remove(&root);
    }

    pub fn create_scope(&mut self, initial: RouteLocation) -> Result<RouteScopeId, RouterError> {
        if self.scopes.len() == self.config.max_scopes {
            return Err(RouterError::ScopeCapacity);
        }
        let resolution = self.resolve(0, initial)?;
        let index = if let Some(index) = self.free_scopes.pop() {
            index
        } else {
            if self.scope_generations.len() == u32::MAX as usize {
                return Err(RouterError::ScopeCapacity);
            }
            self.scope_generations.push(1);
            (self.scope_generations.len() - 1) as u32
        };
        let scope = RouteScopeId(Handle {
            index,
            generation: self.scope_generations[index as usize],
        });
        self.scopes.insert(scope, resolution);
        Ok(scope)
    }

    pub fn close_scope(&mut self, scope: RouteScopeId) -> Result<(), RouterError> {
        if self.scopes.remove(&scope).is_none() {
            return Err(RouterError::UnknownScope);
        }
        let generation = self
            .scope_generations
            .get_mut(scope.0.index as usize)
            .ok_or(RouterError::UnknownScope)?;
        *generation = generation
            .checked_add(1)
            .ok_or(RouterError::GenerationExhausted)?;
        self.free_scopes.push(scope.0.index);
        self.roots.retain(|_, binding| {
            !matches!(binding, RootRouteBinding::Independent(bound) if *bound == scope)
        });
        Ok(())
    }

    pub fn navigate(
        &mut self,
        location: RouteLocation,
        cause: NavigationCause,
        replace: bool,
    ) -> Result<NavigationCommit, RouterError> {
        let navigation_id = self.allocate_navigation_id()?;
        let resolution = self.resolve(navigation_id, location)?;
        let committed_location = resolution_location(&resolution).clone();
        if replace && !self.history.is_empty() {
            self.history[self.history_index] = committed_location;
        } else {
            self.history.truncate(self.history_index.saturating_add(1));
            if self.history.len() == self.config.max_history_entries {
                return Err(RouterError::HistoryCapacity);
            }
            self.history.push(committed_location);
            self.history_index = self.history.len() - 1;
        }
        self.current = Some(resolution.clone());
        Ok(NavigationCommit {
            navigation_id,
            cause,
            resolution,
            replace,
        })
    }

    pub fn navigate_scope(
        &mut self,
        scope: RouteScopeId,
        location: RouteLocation,
    ) -> Result<RouteResolution, RouterError> {
        if !self.scopes.contains_key(&scope) {
            return Err(RouterError::UnknownScope);
        }
        let navigation_id = self.allocate_navigation_id()?;
        let resolution = self.resolve(navigation_id, location)?;
        self.scopes.insert(scope, resolution.clone());
        Ok(resolution)
    }

    pub fn back(&mut self) -> Result<NavigationCommit, RouterError> {
        if self.history_index == 0 || self.history.is_empty() {
            return Err(RouterError::HistoryBoundary);
        }
        self.history_index -= 1;
        let location = self.history[self.history_index].clone();
        self.commit_history_navigation(location, NavigationCause::Back)
    }

    pub fn forward(&mut self) -> Result<NavigationCommit, RouterError> {
        if self.history_index + 1 >= self.history.len() {
            return Err(RouterError::HistoryBoundary);
        }
        self.history_index += 1;
        let location = self.history[self.history_index].clone();
        self.commit_history_navigation(location, NavigationCause::Forward)
    }

    pub fn resolution_for_root(
        &self,
        root: UiRootId,
    ) -> Result<Option<&RouteResolution>, RouterError> {
        match self.roots.get(&root) {
            Some(RootRouteBinding::FollowSessionRoute) => Ok(self.current.as_ref()),
            Some(RootRouteBinding::Independent(scope)) => self
                .scopes
                .get(scope)
                .map(Some)
                .ok_or(RouterError::UnknownScope),
            None => Ok(None),
        }
    }

    fn commit_history_navigation(
        &mut self,
        location: RouteLocation,
        cause: NavigationCause,
    ) -> Result<NavigationCommit, RouterError> {
        let navigation_id = self.allocate_navigation_id()?;
        let resolution = self.resolve(navigation_id, location)?;
        self.current = Some(resolution.clone());
        Ok(NavigationCommit {
            navigation_id,
            cause,
            resolution,
            replace: true,
        })
    }

    fn allocate_navigation_id(&mut self) -> Result<u64, RouterError> {
        let id = self.next_navigation_id;
        self.next_navigation_id = id.checked_add(1).ok_or(RouterError::NavigationSequence)?;
        Ok(id)
    }

    fn resolve(
        &self,
        navigation_id: u64,
        mut location: RouteLocation,
    ) -> Result<RouteResolution, RouterError> {
        validate_location(&location, self.config)?;
        let mut redirects = Vec::new();
        let mut seen = BTreeSet::new();
        loop {
            let Some(matched) = self.match_location(&location)? else {
                return Ok(RouteResolution::NotFound(location));
            };
            let spec = &self.routes[&matched.route];
            match &spec.behavior {
                RouteBehavior::Redirect { target } => {
                    if redirects.len() == self.config.max_redirect_depth {
                        return Err(RouterError::RedirectDepth);
                    }
                    if !seen.insert(spec.id) {
                        return Err(RouterError::RedirectCycle);
                    }
                    redirects.push(spec.id);
                    location = parse_location(target, self.config)?;
                }
                RouteBehavior::ErrorBoundary => {
                    return Ok(RouteResolution::Error {
                        location,
                        boundary: Some(spec.id),
                        error: RouterError::InvalidLocation,
                    });
                }
                _ if redirects.is_empty() => return Ok(RouteResolution::Matched(matched)),
                _ => {
                    return Ok(RouteResolution::Redirected {
                        navigation_id,
                        location,
                        matched,
                        redirects,
                    })
                }
            }
        }
    }

    fn match_location(&self, location: &RouteLocation) -> Result<Option<RouteMatch>, RouterError> {
        let path_segments = split_path(&location.path, self.config.max_segments)?;
        let mut best: Option<(usize, RouteId, BTreeMap<String, String>)> = None;
        for spec in self.routes.values() {
            let Some(parameters) = match_segments(&spec.path, &path_segments) else {
                continue;
            };
            let score = spec
                .path
                .iter()
                .filter(|segment| matches!(segment, RouteSegment::Literal(_)))
                .count();
            if best.as_ref().is_none_or(|(best_score, best_id, _)| {
                score > *best_score || (score == *best_score && spec.id < *best_id)
            }) {
                best = Some((score, spec.id, parameters));
            }
        }
        let Some((_, route, parameters)) = best else {
            return Ok(None);
        };
        Ok(Some(RouteMatch {
            route,
            layout_chain: layout_chain(route, &self.routes)?,
            parameters,
            location: location.clone(),
        }))
    }
}

fn validate_config(config: RouterConfig) -> Result<(), RouterError> {
    if config.max_routes == 0
        || config.max_segments == 0
        || config.max_location_bytes == 0
        || config.max_query_fields == 0
        || config.max_redirect_depth == 0
        || config.max_history_entries == 0
        || config.max_scopes == 0
    {
        return Err(RouterError::InvalidConfig);
    }
    Ok(())
}

fn validate_namespace(namespace: &str) -> Result<(), RouterError> {
    if namespace.is_empty()
        || namespace.starts_with('/')
        || namespace.ends_with('/')
        || namespace.contains("//")
    {
        return Err(RouterError::InvalidPattern);
    }
    Ok(())
}

fn validate_spec(spec: &RouteSpec, config: RouterConfig) -> Result<(), RouterError> {
    if spec.path.len() > config.max_segments || spec.path.is_empty() && !spec.index {
        return Err(RouterError::SegmentCapacity);
    }
    let mut names = BTreeSet::new();
    for (index, segment) in spec.path.iter().enumerate() {
        match segment {
            RouteSegment::Literal(value) if value.is_empty() || value.contains('/') => {
                return Err(RouterError::InvalidPattern)
            }
            RouteSegment::Parameter(name) if name.is_empty() || !names.insert(name) => {
                return Err(RouterError::InvalidPattern)
            }
            RouteSegment::Rest(name)
                if name.is_empty() || !names.insert(name) || index + 1 != spec.path.len() =>
            {
                return Err(RouterError::InvalidPattern)
            }
            _ => {}
        }
    }
    Ok(())
}

fn validate_route_graph(routes: &BTreeMap<RouteId, RouteSpec>) -> Result<(), RouterError> {
    for spec in routes.values() {
        if spec
            .parent
            .is_some_and(|parent| !routes.contains_key(&parent))
        {
            return Err(RouterError::UnknownParent);
        }
        let mut seen = BTreeSet::new();
        let mut cursor = Some(spec.id);
        while let Some(route) = cursor {
            if !seen.insert(route) {
                return Err(RouterError::ParentCycle);
            }
            cursor = routes.get(&route).and_then(|route| route.parent);
        }
    }
    Ok(())
}

fn validate_location(location: &RouteLocation, config: RouterConfig) -> Result<(), RouterError> {
    let bytes = location.path.len()
        + location
            .query
            .iter()
            .map(|(key, value)| key.len() + value.len())
            .sum::<usize>()
        + location.hash.as_ref().map_or(0, String::len);
    if bytes > config.max_location_bytes {
        return Err(RouterError::LocationCapacity);
    }
    if location.query.len() > config.max_query_fields {
        return Err(RouterError::QueryCapacity);
    }
    if !location.path.starts_with('/') || location.path.contains("//") {
        return Err(RouterError::InvalidLocation);
    }
    Ok(())
}

fn parse_location(raw: &str, config: RouterConfig) -> Result<RouteLocation, RouterError> {
    if raw.len() > config.max_location_bytes {
        return Err(RouterError::LocationCapacity);
    }
    let (without_hash, hash) = raw
        .split_once('#')
        .map_or((raw, None), |(path, hash)| (path, Some(hash.to_owned())));
    let (path, query_raw) = without_hash
        .split_once('?')
        .map_or((without_hash, None), |(path, query)| (path, Some(query)));
    let mut query = BTreeMap::new();
    if let Some(query_raw) = query_raw {
        for field in query_raw.split('&').filter(|field| !field.is_empty()) {
            let (key, value) = field.split_once('=').unwrap_or((field, ""));
            if key.is_empty() || query.insert(key.to_owned(), value.to_owned()).is_some() {
                return Err(RouterError::InvalidLocation);
            }
        }
    }
    let location = RouteLocation {
        path: path.to_owned(),
        query,
        hash,
    };
    validate_location(&location, config)?;
    Ok(location)
}

fn split_path(path: &str, max_segments: usize) -> Result<Vec<&str>, RouterError> {
    let segments = path
        .trim_matches('/')
        .split('/')
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>();
    if segments.len() > max_segments {
        return Err(RouterError::SegmentCapacity);
    }
    Ok(segments)
}

fn match_segments(pattern: &[RouteSegment], path: &[&str]) -> Option<BTreeMap<String, String>> {
    let has_rest = matches!(pattern.last(), Some(RouteSegment::Rest(_)));
    if (!has_rest && pattern.len() != path.len()) || (has_rest && path.len() + 1 < pattern.len()) {
        return None;
    }
    let mut parameters = BTreeMap::new();
    for (index, segment) in pattern.iter().enumerate() {
        match segment {
            RouteSegment::Literal(expected) if path.get(index) != Some(&expected.as_str()) => {
                return None
            }
            RouteSegment::Literal(_) => {}
            RouteSegment::Parameter(name) => {
                parameters.insert(name.clone(), path[index].to_owned());
            }
            RouteSegment::Rest(name) => {
                parameters.insert(name.clone(), path[index..].join("/"));
                break;
            }
        }
    }
    Some(parameters)
}

fn layout_chain(
    route: RouteId,
    routes: &BTreeMap<RouteId, RouteSpec>,
) -> Result<Vec<RouteId>, RouterError> {
    let mut chain = Vec::new();
    let mut cursor = Some(route);
    while let Some(id) = cursor {
        chain.push(id);
        cursor = routes.get(&id).ok_or(RouterError::UnknownParent)?.parent;
    }
    chain.reverse();
    Ok(chain)
}

fn resolution_location(resolution: &RouteResolution) -> &RouteLocation {
    match resolution {
        RouteResolution::Matched(matched) => &matched.location,
        RouteResolution::Redirected { location, .. }
        | RouteResolution::NotFound(location)
        | RouteResolution::Error { location, .. } => location,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn handle(index: u32) -> Handle {
        Handle {
            index,
            generation: 1,
        }
    }

    fn location(path: &str) -> RouteLocation {
        RouteLocation {
            path: path.to_owned(),
            query: BTreeMap::new(),
            hash: None,
        }
    }

    fn routes() -> Vec<RouteSpec> {
        vec![
            RouteSpec {
                id: RouteId(1),
                parent: None,
                path: vec![RouteSegment::Literal("home".to_owned())],
                index: false,
                behavior: RouteBehavior::View,
            },
            RouteSpec {
                id: RouteId(2),
                parent: None,
                path: vec![
                    RouteSegment::Literal("users".to_owned()),
                    RouteSegment::Parameter("id".to_owned()),
                ],
                index: false,
                behavior: RouteBehavior::View,
            },
        ]
    }

    #[test]
    fn primary_navigation_lease_requires_explicit_generation_transfer() {
        let window = handle(1);
        let first = handle(2);
        let second = handle(3);
        let mut leases = NavigationLeaseRegistry::new();
        let original = leases
            .acquire(window, first, NavigationMode::PrimaryUrl)
            .unwrap();
        assert_eq!(
            leases.acquire(window, second, NavigationMode::PrimaryUrl),
            Err(RouterError::LeaseConflict)
        );
        let offer = leases.offer_primary_transfer(&original, second).unwrap();
        assert_eq!(
            leases.accept_primary_transfer(&offer, first),
            Err(RouterError::TransferMismatch)
        );
        let transferred = leases.accept_primary_transfer(&offer, second).unwrap();
        assert!(transferred.generation > original.generation);
        assert_eq!(leases.release(&original), Err(RouterError::LeaseMismatch));
    }

    #[test]
    fn independent_root_scope_does_not_follow_session_history() {
        let session = handle(2);
        let root_following = handle(10);
        let root_independent = handle(11);
        let lease = NavigationLease {
            window: handle(1),
            owner: session,
            generation: 1,
            mode: NavigationMode::Memory,
        };
        let mut router = Router::new(session, RouterConfig::default(), lease, routes()).unwrap();
        let scope = router.create_scope(location("/users/7")).unwrap();
        router
            .bind_root(root_following, RootRouteBinding::FollowSessionRoute)
            .unwrap();
        router
            .bind_root(root_independent, RootRouteBinding::Independent(scope))
            .unwrap();
        router
            .navigate(location("/home"), NavigationCause::Programmatic, false)
            .unwrap();

        let RouteResolution::Matched(independent) = router
            .resolution_for_root(root_independent)
            .unwrap()
            .unwrap()
        else {
            panic!("independent route must resolve");
        };
        assert_eq!(independent.route, RouteId(2));
        assert_eq!(independent.parameters["id"], "7");
        let RouteResolution::Matched(following) =
            router.resolution_for_root(root_following).unwrap().unwrap()
        else {
            panic!("following route must resolve");
        };
        assert_eq!(following.route, RouteId(1));

        router.close_scope(scope).unwrap();
        assert!(router
            .resolution_for_root(root_independent)
            .unwrap()
            .is_none());
    }
}
