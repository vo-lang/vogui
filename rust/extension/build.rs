use std::collections::BTreeSet;
use std::env;
use std::fmt::Write as _;
use std::fs;
use std::path::PathBuf;

use vo_module::profile::{resolve_source_recipes, ArtifactRole, CapabilitySet};
use vo_module::schema::modfile::ModFile;

fn main() {
    println!("cargo:rerun-if-changed=../../vo.mod");
    let profiles = [
        ("headless", "PROFILE_HEADLESS"),
        ("web-minimal", "PROFILE_WEB_MINIMAL"),
        ("web-full", "PROFILE_WEB_FULL"),
        ("web-editor", "PROFILE_WEB_EDITOR"),
        ("web-overlay-minimal", "PROFILE_WEB_OVERLAY_MINIMAL"),
        ("native-webview-minimal", "PROFILE_NATIVE_WEBVIEW_MINIMAL"),
        ("native-webview-full", "PROFILE_NATIVE_WEBVIEW_FULL"),
        ("native-webview-editor", "PROFILE_NATIVE_WEBVIEW_EDITOR"),
        (
            "native-webview-overlay-minimal",
            "PROFILE_NATIVE_WEBVIEW_OVERLAY_MINIMAL",
        ),
        ("native-gpu-minimal", "PROFILE_NATIVE_GPU_MINIMAL"),
        ("native-gpu-full", "PROFILE_NATIVE_GPU_FULL"),
        ("native-gpu-editor", "PROFILE_NATIVE_GPU_EDITOR"),
        (
            "native-gpu-overlay-minimal",
            "PROFILE_NATIVE_GPU_OVERLAY_MINIMAL",
        ),
    ];
    for (_, feature) in profiles {
        println!("cargo:rerun-if-env-changed=CARGO_FEATURE_{feature}");
    }
    let selected = profiles
        .into_iter()
        .filter(|(_, feature)| env::var_os(format!("CARGO_FEATURE_{feature}")).is_some())
        .collect::<Vec<_>>();
    if selected.len() != 1 {
        panic!(
            "vogui-extension requires exactly one profile-* feature, found {}",
            selected.len()
        );
    }
    let profile_name = selected[0].0;
    let target = env::var("TARGET").expect("Cargo provides TARGET");
    let root =
        PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").expect("manifest dir")).join("../..");
    let mod_file =
        ModFile::parse(&fs::read_to_string(root.join("vo.mod")).expect("read Vogui vo.mod"))
            .expect("parse Vogui vo.mod");
    let capabilities = mod_file
        .profiles
        .resolve(
            Some(profile_name),
            &CapabilitySet::default(),
            "vogui-extension build profile",
        )
        .expect("resolve Vogui profile");
    let recipes = resolve_source_recipes(
        &mod_file
            .extension
            .as_ref()
            .expect("Vogui extension contract")
            .source_recipes,
        &mod_file.profiles,
        "vogui source recipes",
    )
    .expect("validate Vogui source recipes");
    let recipe = recipes
        .iter()
        .find(|recipe| {
            recipe.capabilities == capabilities
                && recipe.target == target
                && recipe.toolchain == vo_module::TOOLCHAIN_VERSION
        })
        .unwrap_or_else(|| {
            panic!(
                "Vogui profile {profile_name} has no source recipe for {target} and toolchain {}",
                vo_module::TOOLCHAIN_VERSION,
            )
        });
    let roles = recipe
        .role_outputs
        .iter()
        .map(|output| output.role.clone())
        .collect::<BTreeSet<_>>();
    let schema = digest_array(&recipe.schema);
    let abi = digest_array(&recipe.abi);
    let capability = digest_array(&recipe.capabilities.digest());
    let mut generated = String::new();
    writeln!(
        generated,
        "pub const PROFILE_NAME: &str = {profile_name:?};"
    )
    .unwrap();
    writeln!(
        generated,
        "pub const PROFILE_SCHEMA: [u8; 32] = {schema:?};"
    )
    .unwrap();
    writeln!(generated, "pub const PROFILE_ABI: [u8; 32] = {abi:?};").unwrap();
    writeln!(
        generated,
        "pub const PROFILE_CAPABILITIES: [u8; 32] = {capability:?};"
    )
    .unwrap();
    writeln!(
        generated,
        "pub static PROVIDER_FACTORIES: [vo_app_runtime::provider_abi::ProviderFactoryDescriptorV2; {}] = [",
        roles.len(),
    )
    .unwrap();
    for role in roles {
        let factory_id = stable_factory_id(role.as_str());
        writeln!(
            generated,
            "vo_app_runtime::provider_abi::ProviderFactoryDescriptorV2 {{ struct_size: core::mem::size_of::<vo_app_runtime::provider_abi::ProviderFactoryDescriptorV2>() as u32, abi_version: vo_app_runtime::provider_abi::PROVIDER_FACTORY_ABI_VERSION, factory_id: {factory_id}, role: {}, abi_fingerprint: PROFILE_ABI, schema_fingerprint: PROFILE_SCHEMA, capability_digest: PROFILE_CAPABILITIES, create: Some({}) }},",
            role_abi(&role),
            create_function(&role),
        )
        .unwrap();
    }
    writeln!(generated, "];").unwrap();
    fs::write(
        PathBuf::from(env::var_os("OUT_DIR").expect("out dir")).join("provider_profile.rs"),
        generated,
    )
    .expect("write generated Vogui provider profile");
}

fn digest_array(digest: &vo_module::digest::Digest) -> [u8; 32] {
    let mut bytes = [0u8; 32];
    for (index, pair) in digest.hex().as_bytes().chunks_exact(2).enumerate() {
        bytes[index] = (hex(pair[0]) << 4) | hex(pair[1]);
    }
    bytes
}

fn hex(value: u8) -> u8 {
    match value {
        b'0'..=b'9' => value - b'0',
        b'a'..=b'f' => value - b'a' + 10,
        _ => panic!("invalid digest hex"),
    }
}

fn stable_factory_id(role: &str) -> u32 {
    let mut hash = 0x811c_9dc5u32;
    for byte in b"github.com/vo-lang/vogui"
        .iter()
        .chain([0].iter())
        .chain(role.as_bytes())
    {
        hash ^= u32::from(*byte);
        hash = hash.wrapping_mul(0x0100_0193);
    }
    hash.max(1)
}

fn role_abi(role: &ArtifactRole) -> &'static str {
    match role {
        ArtifactRole::UiLogic => "vo_app_runtime::provider_abi::PROVIDER_ROLE_UI_LOGIC",
        ArtifactRole::UiRenderer => "vo_app_runtime::provider_abi::PROVIDER_ROLE_UI_RENDERER",
        ArtifactRole::SurfaceHost => "vo_app_runtime::provider_abi::PROVIDER_ROLE_SURFACE_HOST",
        ArtifactRole::Accessibility => "vo_app_runtime::provider_abi::PROVIDER_ROLE_ACCESSIBILITY",
        ArtifactRole::Diagnostics => "vo_app_runtime::provider_abi::PROVIDER_ROLE_DIAGNOSTICS",
        _ => panic!("unsupported Vogui provider role {}", role.as_str()),
    }
}

fn create_function(role: &ArtifactRole) -> &'static str {
    match role {
        ArtifactRole::UiLogic => "create_ui_logic_provider",
        ArtifactRole::UiRenderer => "create_ui_renderer_provider",
        ArtifactRole::SurfaceHost => "create_surface_host_provider",
        ArtifactRole::Accessibility => "create_accessibility_provider",
        ArtifactRole::Diagnostics => "create_diagnostics_provider",
        _ => panic!("unsupported Vogui provider role {}", role.as_str()),
    }
}
