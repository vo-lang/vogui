use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum HostKind {
    Headless,
    Browser,
    NativeWebView,
    NativeGpu,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum RendererKind {
    Fake,
    Dom,
    RetainedGpu,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum ControlsTier {
    Minimal,
    Full,
    Editor,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum CompositionMode {
    Standalone,
    Overlay,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum ProfileExtra {
    DomUnsafe,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProfileRequest {
    pub host: HostKind,
    pub renderer: RendererKind,
    pub controls: ControlsTier,
    pub composition: CompositionMode,
    pub extras: BTreeSet<ProfileExtra>,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum ProfileAlias {
    Headless,
    WebMinimal,
    WebFull,
    WebEditor,
    NativeWebViewMinimal,
    NativeWebViewFull,
    NativeWebViewEditor,
    NativeGpuMinimal,
    NativeGpuFull,
    NativeGpuEditor,
    WebOverlayMinimal,
    NativeWebViewOverlayMinimal,
    NativeGpuOverlayMinimal,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum ProfileCapability {
    App,
    Reconciler,
    Protocol,
    SemanticsCore,
    ResourceCore,
    Input,
    TextIme,
    BrowserHost,
    PortableLayout,
    PortableControls,
    DomRenderer,
    RetainedGpuRenderer,
    BrowserAccessibility,
    NativeAccessibility,
    NativeWebViewHost,
    NativeGpuHost,
    Animation,
    ResourceWatch,
    AdvancedResourceFormats,
    VirtualCollection,
    Inspection,
    EditorWidgets,
    TransparentSurface,
    DomUnsafe,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ResolvedProfile {
    pub alias: ProfileAlias,
    pub request: ProfileRequest,
    pub capabilities: BTreeSet<ProfileCapability>,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Role {
    Logic,
    Renderer,
    SurfaceHost,
    Accessibility,
    Diagnostics,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum PlacementClass {
    LogicIsland,
    RendererActor,
    PlatformThread,
    DiagnosticsActor,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoleArtifact {
    pub role: Role,
    pub placement: PlacementClass,
    pub schema_fingerprint: [u8; 32],
    pub capabilities: BTreeSet<ProfileCapability>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BuildRecipe {
    pub alias: ProfileAlias,
    pub capabilities: BTreeSet<ProfileCapability>,
    pub roles: BTreeSet<Role>,
    pub vo_packages: BTreeSet<&'static str>,
    pub rust_crates: BTreeSet<&'static str>,
    pub js_chunks: BTreeSet<&'static str>,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum ArtifactComponent {
    AppRuntime,
    VoguiProtocol,
    FakeRenderer,
    DomRenderer,
    RetainedGpuRenderer,
    SemanticsCore,
    ResourceCore,
    PortableControls,
    AdvancedWidgets,
    EditorWidgets,
    Inspection,
    NativeAccessibility,
    BrowserAccessibility,
    Animation,
    Audio,
    VoplayRenderer,
    Physics,
    RawDom,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProfileError {
    InvalidHostRenderer,
    InvalidHeadlessComposition,
    InvalidOverlayControls,
    DomUnsafeRequiresDom,
    AliasMismatch,
    MissingComponent(ArtifactComponent),
    ForbiddenComponent(ArtifactComponent),
    MissingRole(Role),
    UnexpectedRole(Role),
    DuplicateRole(Role),
    InvalidRoleArtifact(Role),
}

pub fn resolve_alias(
    alias: ProfileAlias,
    extras: BTreeSet<ProfileExtra>,
) -> Result<ResolvedProfile, ProfileError> {
    use CompositionMode as M;
    use ControlsTier as C;
    use HostKind as H;
    use ProfileAlias as A;
    use RendererKind as R;
    let request = match alias {
        A::Headless => ProfileRequest {
            host: H::Headless,
            renderer: R::Fake,
            controls: C::Minimal,
            composition: M::Standalone,
            extras,
        },
        A::WebMinimal | A::WebFull | A::WebEditor | A::WebOverlayMinimal => ProfileRequest {
            host: H::Browser,
            renderer: R::Dom,
            controls: alias_controls(alias),
            composition: alias_composition(alias),
            extras,
        },
        A::NativeWebViewMinimal
        | A::NativeWebViewFull
        | A::NativeWebViewEditor
        | A::NativeWebViewOverlayMinimal => ProfileRequest {
            host: H::NativeWebView,
            renderer: R::Dom,
            controls: alias_controls(alias),
            composition: alias_composition(alias),
            extras,
        },
        A::NativeGpuMinimal
        | A::NativeGpuFull
        | A::NativeGpuEditor
        | A::NativeGpuOverlayMinimal => ProfileRequest {
            host: H::NativeGpu,
            renderer: R::RetainedGpu,
            controls: alias_controls(alias),
            composition: alias_composition(alias),
            extras,
        },
    };
    let resolved = resolve(request)?;
    if resolved.alias != alias {
        return Err(ProfileError::AliasMismatch);
    }
    Ok(resolved)
}

pub fn resolve(request: ProfileRequest) -> Result<ResolvedProfile, ProfileError> {
    validate_request(&request)?;
    let alias = request_alias(&request)?;
    let mut capabilities = BTreeSet::from([
        ProfileCapability::App,
        ProfileCapability::Reconciler,
        ProfileCapability::Protocol,
        ProfileCapability::SemanticsCore,
    ]);
    if request.host != HostKind::Headless {
        capabilities.extend([
            ProfileCapability::ResourceCore,
            ProfileCapability::Input,
            ProfileCapability::TextIme,
            ProfileCapability::PortableLayout,
        ]);
    }
    match request.renderer {
        RendererKind::Fake => {}
        RendererKind::Dom => {
            capabilities.insert(ProfileCapability::DomRenderer);
            if request.controls != ControlsTier::Minimal {
                capabilities.insert(ProfileCapability::BrowserAccessibility);
            }
        }
        RendererKind::RetainedGpu => {
            capabilities.insert(ProfileCapability::RetainedGpuRenderer);
            capabilities.insert(ProfileCapability::NativeAccessibility);
        }
    }
    match request.host {
        HostKind::Browser => {
            capabilities.insert(ProfileCapability::BrowserHost);
        }
        HostKind::NativeWebView => {
            capabilities.insert(ProfileCapability::NativeWebViewHost);
        }
        HostKind::NativeGpu => {
            capabilities.insert(ProfileCapability::NativeGpuHost);
        }
        HostKind::Headless => {}
    }
    match request.controls {
        ControlsTier::Minimal => {}
        ControlsTier::Full => {
            capabilities.extend([
                ProfileCapability::PortableControls,
                ProfileCapability::Animation,
                ProfileCapability::ResourceWatch,
                ProfileCapability::AdvancedResourceFormats,
            ]);
        }
        ControlsTier::Editor => {
            capabilities.extend([
                ProfileCapability::PortableControls,
                ProfileCapability::Animation,
                ProfileCapability::ResourceWatch,
                ProfileCapability::AdvancedResourceFormats,
                ProfileCapability::VirtualCollection,
                ProfileCapability::Inspection,
                ProfileCapability::EditorWidgets,
            ]);
        }
    }
    if request.composition == CompositionMode::Overlay {
        capabilities.insert(ProfileCapability::TransparentSurface);
    }
    if request.extras.contains(&ProfileExtra::DomUnsafe) {
        capabilities.insert(ProfileCapability::DomUnsafe);
    }
    Ok(ResolvedProfile {
        alias,
        request,
        capabilities,
    })
}

pub fn audit_artifact(
    profile: &ResolvedProfile,
    components: &BTreeSet<ArtifactComponent>,
) -> Result<(), ProfileError> {
    let required = required_components(profile);
    for component in required {
        if !components.contains(&component) {
            return Err(ProfileError::MissingComponent(component));
        }
    }
    for component in components {
        if forbidden_component(profile, *component) {
            return Err(ProfileError::ForbiddenComponent(*component));
        }
    }
    Ok(())
}

pub fn build_recipe(profile: &ResolvedProfile) -> BuildRecipe {
    let mut roles = BTreeSet::from([Role::Logic, Role::Renderer]);
    let mut vo_packages = BTreeSet::from(["github.com/vo-lang/vogui/vo/core"]);
    let mut rust_crates = BTreeSet::from(["vogui-protocol", "vogui-runtime"]);
    let mut js_chunks = BTreeSet::new();
    if profile.request.host != HostKind::Headless {
        vo_packages.extend([
            "github.com/vo-lang/vogui/vo/controls",
            "github.com/vo-lang/vogui/vo/resources",
            "github.com/vo-lang/vogui/vo/style",
        ]);
    }
    match profile.request.renderer {
        RendererKind::Fake => {
            rust_crates.insert("vogui-headless-renderer");
        }
        RendererKind::Dom => {
            roles.insert(Role::SurfaceHost);
            if profile
                .capabilities
                .contains(&ProfileCapability::BrowserAccessibility)
            {
                roles.insert(Role::Accessibility);
            }
            js_chunks.extend(["vogui-dom-renderer", "vogui-interaction-bridge"]);
            if profile
                .capabilities
                .contains(&ProfileCapability::BrowserAccessibility)
            {
                js_chunks.insert("vogui-accessibility-dom");
            }
        }
        RendererKind::RetainedGpu => {
            roles.extend([Role::SurfaceHost, Role::Accessibility]);
            rust_crates.extend([
                "vo-app-host-native",
                "vogui-layout",
                "vogui-text",
                "vogui-native-renderer",
                "vogui-native-accessibility",
            ]);
        }
    }
    if profile.request.host == HostKind::NativeWebView {
        rust_crates.insert("vo-app-host-native");
    }
    if profile.capabilities.contains(&ProfileCapability::Animation) {
        vo_packages.insert("github.com/vo-lang/vogui/vo/animation");
    }
    if profile
        .capabilities
        .contains(&ProfileCapability::Inspection)
    {
        roles.insert(Role::Diagnostics);
        rust_crates.insert("vogui-inspection");
    }
    if profile
        .capabilities
        .contains(&ProfileCapability::EditorWidgets)
    {
        vo_packages.insert("github.com/vo-lang/vogui/vo/canvas");
        if profile.request.renderer == RendererKind::Dom {
            js_chunks.insert("vogui-editor-widgets");
        }
    }
    if profile.capabilities.contains(&ProfileCapability::DomUnsafe) {
        vo_packages.insert("github.com/vo-lang/vogui/vo/domunsafe");
        js_chunks.insert("vogui-dom-unsafe");
    }
    BuildRecipe {
        alias: profile.alias,
        capabilities: profile.capabilities.clone(),
        roles,
        vo_packages,
        rust_crates,
        js_chunks,
    }
}

pub fn validate_role_artifacts(
    profile: &ResolvedProfile,
    artifacts: Vec<RoleArtifact>,
) -> Result<BTreeMap<Role, RoleArtifact>, ProfileError> {
    let recipe = build_recipe(profile);
    let mut by_role = BTreeMap::new();
    for artifact in artifacts {
        let role = artifact.role;
        let placement_matches = matches!(
            (role, artifact.placement),
            (Role::Logic, PlacementClass::LogicIsland)
                | (Role::Renderer, PlacementClass::RendererActor)
                | (
                    Role::SurfaceHost | Role::Accessibility,
                    PlacementClass::PlatformThread
                )
                | (Role::Diagnostics, PlacementClass::DiagnosticsActor)
        );
        if !placement_matches
            || artifact.schema_fingerprint.iter().all(|byte| *byte == 0)
            || !artifact
                .capabilities
                .iter()
                .all(|capability| recipe.capabilities.contains(capability))
        {
            return Err(ProfileError::InvalidRoleArtifact(role));
        }
        if by_role.insert(role, artifact).is_some() {
            return Err(ProfileError::DuplicateRole(role));
        }
    }
    for role in &recipe.roles {
        if !by_role.contains_key(role) {
            return Err(ProfileError::MissingRole(*role));
        }
    }
    for role in by_role.keys() {
        if !recipe.roles.contains(role) {
            return Err(ProfileError::UnexpectedRole(*role));
        }
    }
    Ok(by_role)
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProfileSymbolSize {
    pub name: String,
    pub owner: String,
    pub bytes: u64,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum ProfileDependencyKind {
    VoImport,
    RustCrate,
    JsChunk,
    NativeLibrary,
    RuntimeRole,
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct ProfileDependencyEdge {
    pub from: String,
    pub to: String,
    pub kind: ProfileDependencyKind,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProfileChunkSize {
    pub name: String,
    pub raw_bytes: u64,
    pub gzip_bytes: u64,
    pub brotli_bytes: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProfileArtifactMeasurement {
    pub artifact: RoleArtifact,
    pub artifact_name: String,
    pub target: String,
    pub digest: [u8; 32],
    pub raw_bytes: u64,
    pub gzip_bytes: u64,
    pub brotli_bytes: u64,
    pub cold_build_millis: u64,
    pub shader_pipeline_count: u32,
    pub top_symbols: Vec<ProfileSymbolSize>,
    pub chunks: Vec<ProfileChunkSize>,
    pub dependencies: BTreeSet<String>,
    pub dependency_edges: BTreeSet<ProfileDependencyEdge>,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct ProfileSizeTotals {
    pub raw_bytes: u64,
    pub gzip_bytes: u64,
    pub brotli_bytes: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProfileReport {
    pub format: u16,
    pub build_identity: [u8; 32],
    pub profile: ResolvedProfile,
    pub artifacts: BTreeMap<Role, ProfileArtifactMeasurement>,
    pub download: ProfileSizeTotals,
    pub placement_residency: BTreeMap<PlacementClass, u64>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProfileReportError {
    InvalidBuildIdentity,
    InvalidArtifacts(ProfileError),
    InvalidMeasurement(Role),
    DuplicateSymbol(Role, String),
    DuplicateChunk(Role, String),
    DependencyCycle(Role),
    SizeOverflow,
}

pub fn build_profile_report(
    build_identity: [u8; 32],
    profile: &ResolvedProfile,
    measurements: Vec<ProfileArtifactMeasurement>,
) -> Result<ProfileReport, ProfileReportError> {
    if build_identity.iter().all(|byte| *byte == 0) {
        return Err(ProfileReportError::InvalidBuildIdentity);
    }
    validate_role_artifacts(
        profile,
        measurements
            .iter()
            .map(|measurement| measurement.artifact.clone())
            .collect(),
    )
    .map_err(ProfileReportError::InvalidArtifacts)?;
    let mut artifacts = BTreeMap::new();
    let mut download = ProfileSizeTotals::default();
    let mut placement_residency = BTreeMap::<PlacementClass, u64>::new();
    for measurement in measurements {
        let role = measurement.artifact.role;
        let edge_dependencies = measurement
            .dependency_edges
            .iter()
            .map(|edge| edge.to.clone())
            .collect::<BTreeSet<_>>();
        if measurement.raw_bytes == 0
            || !valid_report_label(&measurement.artifact_name)
            || !valid_report_label(&measurement.target)
            || measurement.digest.iter().all(|byte| *byte == 0)
            || measurement.top_symbols.iter().any(|symbol| {
                symbol.name.is_empty()
                    || symbol.name.len() > 512
                    || symbol.owner.is_empty()
                    || symbol.owner.len() > 512
                    || symbol.bytes > measurement.raw_bytes
            })
            || measurement.chunks.iter().any(|chunk| {
                chunk.name.is_empty()
                    || chunk.name.len() > 512
                    || chunk.raw_bytes > measurement.raw_bytes
            })
            || measurement
                .dependencies
                .iter()
                .any(|dependency| dependency.is_empty() || dependency.len() > 512)
            || measurement.dependency_edges.iter().any(|edge| {
                edge.from.is_empty()
                    || edge.from.len() > 512
                    || edge.to.is_empty()
                    || edge.to.len() > 512
                    || edge.from == edge.to
            })
            || edge_dependencies != measurement.dependencies
            || measurement
                .top_symbols
                .iter()
                .try_fold(0_u64, |bytes, symbol| bytes.checked_add(symbol.bytes))
                .is_none_or(|bytes| bytes > measurement.raw_bytes)
        {
            return Err(ProfileReportError::InvalidMeasurement(role));
        }
        if dependency_cycle(&measurement.dependency_edges) {
            return Err(ProfileReportError::DependencyCycle(role));
        }
        reject_report_duplicate_names(
            role,
            measurement.top_symbols.iter().map(|symbol| &symbol.name),
            true,
        )?;
        reject_report_duplicate_names(
            role,
            measurement.chunks.iter().map(|chunk| &chunk.name),
            false,
        )?;
        download.raw_bytes = download
            .raw_bytes
            .checked_add(measurement.raw_bytes)
            .ok_or(ProfileReportError::SizeOverflow)?;
        download.gzip_bytes = download
            .gzip_bytes
            .checked_add(measurement.gzip_bytes)
            .ok_or(ProfileReportError::SizeOverflow)?;
        download.brotli_bytes = download
            .brotli_bytes
            .checked_add(measurement.brotli_bytes)
            .ok_or(ProfileReportError::SizeOverflow)?;
        let residency = placement_residency
            .entry(measurement.artifact.placement)
            .or_default();
        *residency = residency
            .checked_add(measurement.raw_bytes)
            .ok_or(ProfileReportError::SizeOverflow)?;
        artifacts.insert(role, measurement);
    }
    Ok(ProfileReport {
        format: 2,
        build_identity,
        profile: profile.clone(),
        artifacts,
        download,
        placement_residency,
    })
}

fn reject_report_duplicate_names<'a>(
    role: Role,
    names: impl Iterator<Item = &'a String>,
    symbols: bool,
) -> Result<(), ProfileReportError> {
    let mut seen = BTreeSet::new();
    for name in names {
        if !seen.insert(name.clone()) {
            return Err(if symbols {
                ProfileReportError::DuplicateSymbol(role, name.clone())
            } else {
                ProfileReportError::DuplicateChunk(role, name.clone())
            });
        }
    }
    Ok(())
}

fn dependency_cycle(edges: &BTreeSet<ProfileDependencyEdge>) -> bool {
    fn visit(
        node: &str,
        graph: &BTreeMap<&str, Vec<&str>>,
        states: &mut BTreeMap<String, u8>,
    ) -> bool {
        match states.get(node).copied() {
            Some(1) => return true,
            Some(2) => return false,
            _ => {}
        }
        states.insert(node.to_owned(), 1);
        if graph
            .get(node)
            .into_iter()
            .flatten()
            .any(|next| visit(next, graph, states))
        {
            return true;
        }
        states.insert(node.to_owned(), 2);
        false
    }
    let mut graph = BTreeMap::<&str, Vec<&str>>::new();
    for edge in edges {
        graph
            .entry(edge.from.as_str())
            .or_default()
            .push(edge.to.as_str());
    }
    let mut states = BTreeMap::new();
    graph
        .keys()
        .copied()
        .any(|node| visit(node, &graph, &mut states))
}

fn valid_report_label(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 512
        && value.bytes().all(|byte| {
            byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-' | b'/' | b':')
        })
}

pub fn render_build_recipe(recipe: &BuildRecipe) -> String {
    let mut output = String::from("format = 1\nprofile = \"");
    output.push_str(alias_name(recipe.alias));
    output.push_str("\"\ncapabilities = [");
    append_names(
        &mut output,
        recipe.capabilities.iter().copied().map(capability_name),
    );
    output.push_str("]\nroles = [");
    append_names(&mut output, recipe.roles.iter().copied().map(role_name));
    output.push_str("]\nvo_packages = [");
    append_names(&mut output, recipe.vo_packages.iter().copied());
    output.push_str("]\nrust_crates = [");
    append_names(&mut output, recipe.rust_crates.iter().copied());
    output.push_str("]\njs_chunks = [");
    append_names(&mut output, recipe.js_chunks.iter().copied());
    output.push_str("]\n");
    output
}

fn append_names<'a>(output: &mut String, values: impl Iterator<Item = &'a str>) {
    for (index, value) in values.enumerate() {
        if index > 0 {
            output.push_str(", ");
        }
        output.push('"');
        output.push_str(value);
        output.push('"');
    }
}

fn alias_name(alias: ProfileAlias) -> &'static str {
    match alias {
        ProfileAlias::Headless => "headless",
        ProfileAlias::WebMinimal => "web-minimal",
        ProfileAlias::WebFull => "web-full",
        ProfileAlias::WebEditor => "web-editor",
        ProfileAlias::NativeWebViewMinimal => "native-webview-minimal",
        ProfileAlias::NativeWebViewFull => "native-webview-full",
        ProfileAlias::NativeWebViewEditor => "native-webview-editor",
        ProfileAlias::NativeGpuMinimal => "native-gpu-minimal",
        ProfileAlias::NativeGpuFull => "native-gpu-full",
        ProfileAlias::NativeGpuEditor => "native-gpu-editor",
        ProfileAlias::WebOverlayMinimal => "web-overlay-minimal",
        ProfileAlias::NativeWebViewOverlayMinimal => "native-webview-overlay-minimal",
        ProfileAlias::NativeGpuOverlayMinimal => "native-gpu-overlay-minimal",
    }
}

fn role_name(role: Role) -> &'static str {
    match role {
        Role::Logic => "logic",
        Role::Renderer => "renderer",
        Role::SurfaceHost => "surface-host",
        Role::Accessibility => "accessibility",
        Role::Diagnostics => "diagnostics",
    }
}

fn capability_name(capability: ProfileCapability) -> &'static str {
    match capability {
        ProfileCapability::App => "app",
        ProfileCapability::Reconciler => "reconciler",
        ProfileCapability::Protocol => "protocol",
        ProfileCapability::SemanticsCore => "semantics-core",
        ProfileCapability::ResourceCore => "resource-core",
        ProfileCapability::Input => "input",
        ProfileCapability::TextIme => "text-ime",
        ProfileCapability::BrowserHost => "browser-host",
        ProfileCapability::PortableLayout => "portable-layout",
        ProfileCapability::PortableControls => "portable-controls",
        ProfileCapability::DomRenderer => "dom-renderer",
        ProfileCapability::RetainedGpuRenderer => "retained-gpu-renderer",
        ProfileCapability::BrowserAccessibility => "browser-accessibility",
        ProfileCapability::NativeAccessibility => "native-accessibility",
        ProfileCapability::NativeWebViewHost => "native-webview-host",
        ProfileCapability::NativeGpuHost => "gpu-native-host",
        ProfileCapability::Animation => "animation",
        ProfileCapability::ResourceWatch => "resource-watch",
        ProfileCapability::AdvancedResourceFormats => "advanced-resource-formats",
        ProfileCapability::VirtualCollection => "virtual-collection",
        ProfileCapability::Inspection => "inspection",
        ProfileCapability::EditorWidgets => "editor-widgets",
        ProfileCapability::TransparentSurface => "transparent-surface",
        ProfileCapability::DomUnsafe => "dom-unsafe",
    }
}

fn validate_request(request: &ProfileRequest) -> Result<(), ProfileError> {
    let renderer_valid = matches!(
        (request.host, request.renderer),
        (HostKind::Headless, RendererKind::Fake)
            | (HostKind::Browser, RendererKind::Dom)
            | (HostKind::NativeWebView, RendererKind::Dom)
            | (HostKind::NativeGpu, RendererKind::RetainedGpu)
    );
    if !renderer_valid {
        return Err(ProfileError::InvalidHostRenderer);
    }
    if request.host == HostKind::Headless && request.composition != CompositionMode::Standalone {
        return Err(ProfileError::InvalidHeadlessComposition);
    }
    if request.composition == CompositionMode::Overlay && request.controls != ControlsTier::Minimal
    {
        return Err(ProfileError::InvalidOverlayControls);
    }
    if request.extras.contains(&ProfileExtra::DomUnsafe) && request.renderer != RendererKind::Dom {
        return Err(ProfileError::DomUnsafeRequiresDom);
    }
    Ok(())
}

fn request_alias(request: &ProfileRequest) -> Result<ProfileAlias, ProfileError> {
    use CompositionMode as M;
    use ControlsTier as C;
    use HostKind as H;
    use ProfileAlias as A;
    Ok(
        match (request.host, request.controls, request.composition) {
            (H::Headless, C::Minimal, M::Standalone) => A::Headless,
            (H::Browser, C::Minimal, M::Standalone) => A::WebMinimal,
            (H::Browser, C::Full, M::Standalone) => A::WebFull,
            (H::Browser, C::Editor, M::Standalone) => A::WebEditor,
            (H::NativeWebView, C::Minimal, M::Standalone) => A::NativeWebViewMinimal,
            (H::NativeWebView, C::Full, M::Standalone) => A::NativeWebViewFull,
            (H::NativeWebView, C::Editor, M::Standalone) => A::NativeWebViewEditor,
            (H::NativeGpu, C::Minimal, M::Standalone) => A::NativeGpuMinimal,
            (H::NativeGpu, C::Full, M::Standalone) => A::NativeGpuFull,
            (H::NativeGpu, C::Editor, M::Standalone) => A::NativeGpuEditor,
            (H::Browser, C::Minimal, M::Overlay) => A::WebOverlayMinimal,
            (H::NativeWebView, C::Minimal, M::Overlay) => A::NativeWebViewOverlayMinimal,
            (H::NativeGpu, C::Minimal, M::Overlay) => A::NativeGpuOverlayMinimal,
            _ => return Err(ProfileError::AliasMismatch),
        },
    )
}

fn alias_controls(alias: ProfileAlias) -> ControlsTier {
    match alias {
        ProfileAlias::WebFull | ProfileAlias::NativeWebViewFull | ProfileAlias::NativeGpuFull => {
            ControlsTier::Full
        }
        ProfileAlias::WebEditor
        | ProfileAlias::NativeWebViewEditor
        | ProfileAlias::NativeGpuEditor => ControlsTier::Editor,
        _ => ControlsTier::Minimal,
    }
}

fn alias_composition(alias: ProfileAlias) -> CompositionMode {
    match alias {
        ProfileAlias::WebOverlayMinimal
        | ProfileAlias::NativeWebViewOverlayMinimal
        | ProfileAlias::NativeGpuOverlayMinimal => CompositionMode::Overlay,
        _ => CompositionMode::Standalone,
    }
}

fn required_components(profile: &ResolvedProfile) -> BTreeSet<ArtifactComponent> {
    let mut required = BTreeSet::from([
        ArtifactComponent::AppRuntime,
        ArtifactComponent::VoguiProtocol,
        ArtifactComponent::SemanticsCore,
    ]);
    match profile.request.renderer {
        RendererKind::Fake => {
            required.insert(ArtifactComponent::FakeRenderer);
        }
        RendererKind::Dom => {
            required.extend([
                ArtifactComponent::DomRenderer,
                ArtifactComponent::ResourceCore,
                ArtifactComponent::BrowserAccessibility,
            ]);
        }
        RendererKind::RetainedGpu => {
            required.extend([
                ArtifactComponent::RetainedGpuRenderer,
                ArtifactComponent::ResourceCore,
                ArtifactComponent::NativeAccessibility,
            ]);
        }
    }
    if profile.request.controls != ControlsTier::Minimal {
        required.extend([
            ArtifactComponent::PortableControls,
            ArtifactComponent::Animation,
        ]);
    }
    if profile.request.controls == ControlsTier::Editor {
        required.extend([
            ArtifactComponent::EditorWidgets,
            ArtifactComponent::Inspection,
        ]);
    }
    if profile.request.extras.contains(&ProfileExtra::DomUnsafe) {
        required.insert(ArtifactComponent::RawDom);
    }
    required
}

fn forbidden_component(profile: &ResolvedProfile, component: ArtifactComponent) -> bool {
    if matches!(
        component,
        ArtifactComponent::Audio | ArtifactComponent::VoplayRenderer | ArtifactComponent::Physics
    ) {
        return true;
    }
    (match profile.request.renderer {
        RendererKind::Fake => matches!(
            component,
            ArtifactComponent::DomRenderer
                | ArtifactComponent::RetainedGpuRenderer
                | ArtifactComponent::BrowserAccessibility
                | ArtifactComponent::NativeAccessibility
                | ArtifactComponent::RawDom
        ),
        RendererKind::Dom => matches!(
            component,
            ArtifactComponent::FakeRenderer
                | ArtifactComponent::RetainedGpuRenderer
                | ArtifactComponent::NativeAccessibility
        ),
        RendererKind::RetainedGpu => matches!(
            component,
            ArtifactComponent::FakeRenderer
                | ArtifactComponent::DomRenderer
                | ArtifactComponent::BrowserAccessibility
                | ArtifactComponent::RawDom
        ),
    }) || profile.request.controls == ControlsTier::Minimal
        && matches!(
            component,
            ArtifactComponent::AdvancedWidgets
                | ArtifactComponent::EditorWidgets
                | ArtifactComponent::Inspection
        )
}

#[cfg(test)]
mod tests {
    use super::*;

    const ALIASES: [ProfileAlias; 13] = [
        ProfileAlias::Headless,
        ProfileAlias::WebMinimal,
        ProfileAlias::WebFull,
        ProfileAlias::WebEditor,
        ProfileAlias::NativeWebViewMinimal,
        ProfileAlias::NativeWebViewFull,
        ProfileAlias::NativeWebViewEditor,
        ProfileAlias::NativeGpuMinimal,
        ProfileAlias::NativeGpuFull,
        ProfileAlias::NativeGpuEditor,
        ProfileAlias::WebOverlayMinimal,
        ProfileAlias::NativeWebViewOverlayMinimal,
        ProfileAlias::NativeGpuOverlayMinimal,
    ];

    fn artifacts(profile: &ResolvedProfile) -> Vec<RoleArtifact> {
        build_recipe(profile)
            .roles
            .iter()
            .copied()
            .map(|role| RoleArtifact {
                role,
                placement: match role {
                    Role::Logic => PlacementClass::LogicIsland,
                    Role::Renderer => PlacementClass::RendererActor,
                    Role::SurfaceHost | Role::Accessibility => PlacementClass::PlatformThread,
                    Role::Diagnostics => PlacementClass::DiagnosticsActor,
                },
                schema_fingerprint: [role as u8 + 1; 32],
                capabilities: BTreeSet::from([ProfileCapability::App]),
            })
            .collect()
    }

    #[test]
    fn every_declared_profile_resolves_to_an_exact_physical_recipe() {
        let mut rendered = BTreeSet::new();
        for alias in ALIASES {
            let profile = resolve_alias(alias, BTreeSet::new()).unwrap();
            let recipe = build_recipe(&profile);
            assert_eq!(recipe.alias, alias);
            assert_eq!(recipe.capabilities, profile.capabilities);
            assert!(recipe.roles.contains(&Role::Logic));
            assert!(recipe.roles.contains(&Role::Renderer));
            assert!(rendered.insert(render_build_recipe(&recipe)));
            assert!(!recipe.rust_crates.contains("voplay-renderer"));
        }

        let headless =
            build_recipe(&resolve_alias(ProfileAlias::Headless, BTreeSet::new()).unwrap());
        assert!(headless.rust_crates.contains("vogui-headless-renderer"));
        assert!(headless.js_chunks.is_empty());

        let web = build_recipe(&resolve_alias(ProfileAlias::WebMinimal, BTreeSet::new()).unwrap());
        assert!(web.js_chunks.contains("vogui-dom-renderer"));
        assert!(!web.rust_crates.contains("vogui-native-renderer"));

        let native =
            build_recipe(&resolve_alias(ProfileAlias::NativeGpuFull, BTreeSet::new()).unwrap());
        assert!(native.rust_crates.contains("vogui-native-renderer"));
        assert!(native.rust_crates.contains("vogui-native-accessibility"));
        assert!(!native.js_chunks.contains("vogui-dom-renderer"));
    }

    #[test]
    fn illegal_profile_combinations_and_forbidden_components_fail_closed() {
        let invalid = ProfileRequest {
            host: HostKind::Browser,
            renderer: RendererKind::RetainedGpu,
            controls: ControlsTier::Minimal,
            composition: CompositionMode::Standalone,
            extras: BTreeSet::new(),
        };
        assert_eq!(resolve(invalid), Err(ProfileError::InvalidHostRenderer));

        assert_eq!(
            resolve_alias(
                ProfileAlias::NativeGpuMinimal,
                BTreeSet::from([ProfileExtra::DomUnsafe]),
            ),
            Err(ProfileError::DomUnsafeRequiresDom),
        );

        let profile = resolve_alias(ProfileAlias::WebMinimal, BTreeSet::new()).unwrap();
        let mut components = required_components(&profile);
        components.insert(ArtifactComponent::Physics);
        assert_eq!(
            audit_artifact(&profile, &components),
            Err(ProfileError::ForbiddenComponent(ArtifactComponent::Physics)),
        );
    }

    #[test]
    fn role_artifacts_require_exact_role_set_placement_schema_and_capabilities() {
        let profile = resolve_alias(ProfileAlias::NativeGpuEditor, BTreeSet::new()).unwrap();
        let recipe = build_recipe(&profile);
        let artifacts = artifacts(&profile);
        let validated = validate_role_artifacts(&profile, artifacts.clone()).unwrap();
        assert_eq!(validated.len(), recipe.roles.len());

        let mut missing = artifacts.clone();
        missing.retain(|artifact| artifact.role != Role::Renderer);
        assert_eq!(
            validate_role_artifacts(&profile, missing),
            Err(ProfileError::MissingRole(Role::Renderer)),
        );

        let mut invalid = artifacts;
        invalid[0].schema_fingerprint = [0; 32];
        assert!(matches!(
            validate_role_artifacts(&profile, invalid),
            Err(ProfileError::InvalidRoleArtifact(_))
        ));
    }

    #[test]
    fn profile_report_binds_build_artifacts_sizes_and_placement() {
        let profile = resolve_alias(ProfileAlias::NativeGpuEditor, BTreeSet::new()).unwrap();
        let measurements = artifacts(&profile)
            .into_iter()
            .map(|artifact| {
                let role = artifact.role;
                ProfileArtifactMeasurement {
                    artifact,
                    artifact_name: format!("vogui-{role:?}").to_ascii_lowercase(),
                    target: String::from("aarch64-apple-darwin"),
                    digest: [8; 32],
                    raw_bytes: 100,
                    gzip_bytes: 60,
                    brotli_bytes: 50,
                    cold_build_millis: 10,
                    shader_pipeline_count: u32::from(role == Role::Renderer),
                    top_symbols: vec![ProfileSymbolSize {
                        name: format!("{role:?}-entry"),
                        owner: String::from("vogui-runtime"),
                        bytes: 25,
                    }],
                    chunks: vec![ProfileChunkSize {
                        name: format!("{role:?}-chunk"),
                        raw_bytes: 100,
                        gzip_bytes: 60,
                        brotli_bytes: 50,
                    }],
                    dependencies: BTreeSet::from([String::from("vo-app-runtime")]),
                    dependency_edges: BTreeSet::from([ProfileDependencyEdge {
                        from: String::from("vogui-runtime"),
                        to: String::from("vo-app-runtime"),
                        kind: ProfileDependencyKind::RustCrate,
                    }]),
                }
            })
            .collect::<Vec<_>>();

        let report = build_profile_report([9; 32], &profile, measurements).unwrap();
        assert_eq!(report.artifacts.len(), build_recipe(&profile).roles.len());
        assert_eq!(
            report.download.raw_bytes,
            100 * report.artifacts.len() as u64
        );
        assert_eq!(
            report.placement_residency.values().sum::<u64>(),
            report.download.raw_bytes
        );

        let mut missing = report.artifacts.values().cloned().collect::<Vec<_>>();
        missing.pop();
        assert!(matches!(
            build_profile_report([9; 32], &profile, missing),
            Err(ProfileReportError::InvalidArtifacts(_))
        ));
    }
}
