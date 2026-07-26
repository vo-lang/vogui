use std::collections::BTreeSet;
use std::fmt::Write as _;
use std::ops::Range;

use serde::Deserialize;
use sha2::{Digest, Sha256};
use vo_schema_compiler::{
    generator_cache_key, schema_source_fingerprint, validate_generated_path, GeneratedArtifact,
    GeneratorCacheInput, GeneratorDiagnostic, GeneratorIdentity, GeneratorOutput,
};

pub const GENERATOR_NAME: &str = "vogui.typed-app";
pub const GENERATOR_VERSION: &str = "4";
pub const SCHEMA_KIND: &str = "vogui.app";

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TransactionMode {
    ImmutableValue,
    GeneratedWriteJournal,
    RestartOnFailure,
}

impl TransactionMode {
    fn parse(value: &str) -> Option<Self> {
        match value {
            "immutable_value" => Some(Self::ImmutableValue),
            "generated_write_journal" => Some(Self::GeneratedWriteJournal),
            "restart_on_failure" => Some(Self::RestartOnFailure),
            _ => None,
        }
    }

    fn wire_value(self) -> u32 {
        match self {
            Self::ImmutableValue => 0,
            Self::GeneratedWriteJournal => 1,
            Self::RestartOnFailure => 2,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppAdapterIr {
    pub canonical_module: String,
    pub package: String,
    pub app_name: String,
    pub model_type: String,
    pub message_type: String,
    pub init_type: String,
    pub transaction_mode: TransactionMode,
    pub supports_neutral_snapshot: bool,
    pub supports_migration: bool,
    pub max_init_bytes: usize,
    pub max_model_bytes: usize,
    pub max_message_bytes: usize,
    pub max_effects_per_update: usize,
    pub max_subscriptions: usize,
    pub methods: AppMethods,
    pub init_fields: Vec<Field>,
    pub model_fields: Vec<Field>,
    pub message_fields: Vec<Field>,
    pub scopes: Vec<Scope>,
    pub mappers: Vec<Mapper>,
    pub subscriptions: Vec<Subscription>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppMethods {
    pub init: String,
    pub update: String,
    pub view: String,
    pub subscriptions: String,
    pub on_error: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Scope {
    pub id: u32,
    pub name: String,
    pub builder: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Mapper {
    pub id: u32,
    pub name: String,
    pub payload_type: String,
    pub map: String,
    pub fields: Vec<Field>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Field {
    pub name: String,
    pub field_type: FieldType,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum FieldType {
    Bool,
    Int32,
    Uint32,
    Int64,
    Uint64,
    String,
    Bytes,
}

impl FieldType {
    fn parse(value: &str) -> Option<Self> {
        Some(match value {
            "bool" => Self::Bool,
            "int32" => Self::Int32,
            "uint32" => Self::Uint32,
            "int64" => Self::Int64,
            "uint64" => Self::Uint64,
            "string" => Self::String,
            "bytes" => Self::Bytes,
            _ => return None,
        })
    }

    fn canonical_name(self) -> &'static str {
        match self {
            Self::Bool => "bool",
            Self::Int32 => "int32",
            Self::Uint32 => "uint32",
            Self::Int64 => "int64",
            Self::Uint64 => "uint64",
            Self::String => "string",
            Self::Bytes => "bytes",
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Subscription {
    pub id: u32,
    pub name: String,
    pub build: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CompiledAppAdapter {
    pub ir: AppAdapterIr,
    pub app_build_id: [u8; 32],
    pub artifact_id: [u8; 32],
    pub model_fingerprint: [u8; 32],
    pub message_fingerprint: [u8; 32],
    pub transitive_model_abi: [u8; 32],
    pub factory_id: u64,
    pub output: GeneratorOutput,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SourceApp {
    format: u32,
    canonical_module: String,
    package: String,
    app: String,
    model: String,
    message: String,
    init: String,
    transaction_mode: String,
    #[serde(default)]
    supports_neutral_snapshot: bool,
    #[serde(default)]
    supports_migration: bool,
    limits: SourceLimits,
    methods: SourceMethods,
    #[serde(default)]
    init_field: Vec<SourceField>,
    #[serde(default)]
    model_field: Vec<SourceField>,
    #[serde(default)]
    message_field: Vec<SourceField>,
    #[serde(default)]
    scope: Vec<SourceScope>,
    #[serde(default)]
    mapper: Vec<SourceMapper>,
    #[serde(default)]
    subscription: Vec<SourceSubscription>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SourceLimits {
    max_init_bytes: usize,
    max_model_bytes: usize,
    max_message_bytes: usize,
    max_effects_per_update: usize,
    max_subscriptions: usize,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SourceMethods {
    init: String,
    update: String,
    view: String,
    subscriptions: String,
    on_error: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SourceScope {
    id: u32,
    name: String,
    builder: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SourceMapper {
    id: u32,
    name: String,
    payload: String,
    map: String,
    #[serde(default)]
    field: Vec<SourceField>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SourceField {
    name: String,
    #[serde(rename = "type")]
    field_type: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SourceSubscription {
    id: u32,
    name: String,
    build: String,
}

pub fn generate(
    source_path: &str,
    source: &str,
    toolchain: &str,
    target: &str,
    capabilities: &[String],
) -> Result<CompiledAppAdapter, Vec<GeneratorDiagnostic>> {
    let parsed: SourceApp = match toml::from_str(source) {
        Ok(parsed) => parsed,
        Err(error) => {
            let span = error.span().unwrap_or(0..source.len().min(1));
            return Err(vec![diagnostic(
                "VOGUI-GEN-001",
                "parse",
                source_path,
                span,
                error.to_string(),
            )]);
        }
    };
    let ir = validate(source_path, source, parsed)?;
    let canonical = canonical_ir(&ir);
    let app_build_id: [u8; 32] = Sha256::digest(canonical.as_bytes()).into();
    let artifact_id: [u8; 32] =
        Sha256::digest(format!("vogui-app-artifact:{canonical}").as_bytes()).into();
    let model_fingerprint: [u8; 32] =
        Sha256::digest(format!("model:{}:{}", ir.canonical_module, ir.model_type).as_bytes())
            .into();
    let message_fingerprint: [u8; 32] =
        Sha256::digest(format!("message:{}:{}", ir.canonical_module, ir.message_type).as_bytes())
            .into();
    let transitive_model_abi: [u8; 32] = Sha256::digest(
        format!(
            "model-abi:{}:{}:{}",
            ir.canonical_module,
            ir.model_type,
            ir.transaction_mode.wire_value()
        )
        .as_bytes(),
    )
    .into();
    let role_artifact_set_fingerprint: [u8; 32] = Sha256::digest(
        format!(
            "vogui-role-artifact-set:{}:{}",
            ir.canonical_module, ir.app_name
        )
        .as_bytes(),
    )
    .into();
    let mut factory_bytes = [0u8; 8];
    factory_bytes.copy_from_slice(&app_build_id[..8]);
    let mut factory_id = u64::from_le_bytes(factory_bytes);
    if factory_id == 0 {
        factory_id = 1;
    }

    let schema_fingerprint = schema_source_fingerprint(source.as_bytes());
    let identity = GeneratorIdentity {
        name: GENERATOR_NAME.to_string(),
        version: GENERATOR_VERSION.to_string(),
        schema_kind: SCHEMA_KIND.to_string(),
    };
    let cache_key = generator_cache_key(&GeneratorCacheInput {
        identity: &identity,
        schema_fingerprint,
        toolchain,
        target,
        capabilities,
    });
    let path = format!("{}_app.vo", snake_case(&ir.app_name));
    validate_generated_path(&path).expect("generator owns a normalized output path");
    let vo_source = render_vo(
        &ir,
        app_build_id,
        artifact_id,
        model_fingerprint,
        message_fingerprint,
        transitive_model_abi,
        role_artifact_set_fingerprint,
        factory_id,
    );
    let manifest_path = format!("generated/{}_app.manifest", snake_case(&ir.app_name));
    let manifest = render_manifest(
        &ir,
        app_build_id,
        artifact_id,
        model_fingerprint,
        message_fingerprint,
        transitive_model_abi,
        factory_id,
        cache_key,
    );
    Ok(CompiledAppAdapter {
        ir,
        app_build_id,
        artifact_id,
        model_fingerprint,
        message_fingerprint,
        transitive_model_abi,
        factory_id,
        output: GeneratorOutput {
            schema_fingerprint,
            cache_key,
            artifacts: vec![
                GeneratedArtifact::new(path, vo_source.into_bytes()),
                GeneratedArtifact::new(manifest_path, manifest.into_bytes()),
            ],
        },
    })
}

fn validate(
    source_path: &str,
    source: &str,
    parsed: SourceApp,
) -> Result<AppAdapterIr, Vec<GeneratorDiagnostic>> {
    let mut errors = Vec::new();
    if parsed.format != 1 {
        errors.push(field_error(
            source_path,
            source,
            "format",
            "VOGUI-GEN-002",
            "validate",
            "format must be 1",
        ));
    }
    if !valid_module_path(&parsed.canonical_module) {
        errors.push(field_error(
            source_path,
            source,
            "canonical_module",
            "VOGUI-GEN-003",
            "validate",
            "canonical module must contain at least two portable slash-separated segments",
        ));
    }
    if !valid_identifier(&parsed.package) {
        errors.push(field_error(
            source_path,
            source,
            "package",
            "VOGUI-GEN-003",
            "validate",
            "package must be one local identifier",
        ));
    }
    for (field, value) in [
        ("app", parsed.app.as_str()),
        ("model", parsed.model.as_str()),
        ("message", parsed.message.as_str()),
        ("init", parsed.init.as_str()),
        ("init", parsed.methods.init.as_str()),
        ("update", parsed.methods.update.as_str()),
        ("view", parsed.methods.view.as_str()),
        ("subscriptions", parsed.methods.subscriptions.as_str()),
        ("on_error", parsed.methods.on_error.as_str()),
    ] {
        if !valid_identifier(value) {
            errors.push(field_error(
                source_path,
                source,
                field,
                "VOGUI-GEN-004",
                "validate",
                "types and callbacks must be local named symbols; closures, borrowed memory, live object expressions, and dynamic paths are rejected",
            ));
        }
    }
    let transaction_mode = match TransactionMode::parse(&parsed.transaction_mode) {
        Some(mode) => mode,
        None => {
            errors.push(field_error(
                source_path,
                source,
                "transaction_mode",
                "VOGUI-GEN-005",
                "validate",
                "unsupported transaction mode",
            ));
            TransactionMode::RestartOnFailure
        }
    };
    if parsed.supports_migration && !parsed.supports_neutral_snapshot {
        errors.push(field_error(
            source_path,
            source,
            "supports_migration",
            "VOGUI-GEN-006",
            "validate",
            "migration requires neutral snapshot support",
        ));
    }
    let limits = [
        ("max_init_bytes", parsed.limits.max_init_bytes),
        ("max_model_bytes", parsed.limits.max_model_bytes),
        ("max_message_bytes", parsed.limits.max_message_bytes),
        (
            "max_effects_per_update",
            parsed.limits.max_effects_per_update,
        ),
        ("max_subscriptions", parsed.limits.max_subscriptions),
    ];
    for (field, value) in limits {
        if value == 0 || value > 64 * 1024 * 1024 {
            errors.push(field_error(
                source_path,
                source,
                field,
                "VOGUI-GEN-007",
                "validate",
                "limit must be in 1..=67108864",
            ));
        }
    }
    let mut scope_ids = BTreeSet::new();
    let mut mapper_ids = BTreeSet::new();
    let mut subscription_ids = BTreeSet::new();
    let mut names = BTreeSet::new();
    validate_fields(
        source_path,
        source,
        "init_field",
        &parsed.init_field,
        &mut errors,
    );
    validate_fields(
        source_path,
        source,
        "model_field",
        &parsed.model_field,
        &mut errors,
    );
    validate_fields(
        source_path,
        source,
        "message_field",
        &parsed.message_field,
        &mut errors,
    );
    for scope in &parsed.scope {
        validate_table_entry(
            source_path,
            source,
            "scope",
            scope.id,
            &scope.name,
            &scope.builder,
            &mut scope_ids,
            &mut names,
            &mut errors,
        );
    }
    for mapper in &parsed.mapper {
        validate_table_entry(
            source_path,
            source,
            "mapper",
            mapper.id,
            &mapper.name,
            &mapper.map,
            &mut mapper_ids,
            &mut names,
            &mut errors,
        );
        if !valid_identifier(&mapper.payload) {
            errors.push(field_error(
                source_path,
                source,
                "payload",
                "VOGUI-GEN-004",
                "validate",
                "mapper payload must be a named type",
            ));
        }
        validate_fields(
            source_path,
            source,
            "mapper.field",
            &mapper.field,
            &mut errors,
        );
    }
    for subscription in &parsed.subscription {
        validate_table_entry(
            source_path,
            source,
            "subscription",
            subscription.id,
            &subscription.name,
            &subscription.build,
            &mut subscription_ids,
            &mut names,
            &mut errors,
        );
    }
    if !errors.is_empty() {
        return Err(errors);
    }
    Ok(AppAdapterIr {
        canonical_module: parsed.canonical_module,
        package: parsed.package,
        app_name: parsed.app,
        model_type: parsed.model,
        message_type: parsed.message,
        init_type: parsed.init,
        transaction_mode,
        supports_neutral_snapshot: parsed.supports_neutral_snapshot,
        supports_migration: parsed.supports_migration,
        max_init_bytes: parsed.limits.max_init_bytes,
        max_model_bytes: parsed.limits.max_model_bytes,
        max_message_bytes: parsed.limits.max_message_bytes,
        max_effects_per_update: parsed.limits.max_effects_per_update,
        max_subscriptions: parsed.limits.max_subscriptions,
        methods: AppMethods {
            init: parsed.methods.init,
            update: parsed.methods.update,
            view: parsed.methods.view,
            subscriptions: parsed.methods.subscriptions,
            on_error: parsed.methods.on_error,
        },
        init_fields: convert_fields(parsed.init_field),
        model_fields: convert_fields(parsed.model_field),
        message_fields: convert_fields(parsed.message_field),
        scopes: parsed
            .scope
            .into_iter()
            .map(|scope| Scope {
                id: scope.id,
                name: scope.name,
                builder: scope.builder,
            })
            .collect(),
        mappers: parsed
            .mapper
            .into_iter()
            .map(|mapper| Mapper {
                id: mapper.id,
                name: mapper.name,
                payload_type: mapper.payload,
                map: mapper.map,
                fields: convert_fields(mapper.field),
            })
            .collect(),
        subscriptions: parsed
            .subscription
            .into_iter()
            .map(|subscription| Subscription {
                id: subscription.id,
                name: subscription.name,
                build: subscription.build,
            })
            .collect(),
    })
}

fn validate_fields(
    source_path: &str,
    source: &str,
    table: &str,
    fields: &[SourceField],
    errors: &mut Vec<GeneratorDiagnostic>,
) {
    let mut names = BTreeSet::new();
    for field in fields {
        if !valid_identifier(&field.name) || !names.insert(field.name.as_str()) {
            errors.push(field_error(
                source_path,
                source,
                "name",
                "VOGUI-GEN-010",
                "normalize",
                &format!("{table} field names must be unique identifiers"),
            ));
        }
        if FieldType::parse(&field.field_type).is_none() {
            errors.push(field_error(
                source_path,
                source,
                "type",
                "VOGUI-GEN-011",
                "validate",
                "field type must be bool, int32, uint32, int64, uint64, string, or bytes",
            ));
        }
    }
}

fn convert_fields(fields: Vec<SourceField>) -> Vec<Field> {
    fields
        .into_iter()
        .map(|field| Field {
            name: field.name,
            field_type: FieldType::parse(&field.field_type)
                .expect("validated field type must remain valid"),
        })
        .collect()
}

#[allow(clippy::too_many_arguments)]
fn validate_table_entry(
    source_path: &str,
    source: &str,
    table: &str,
    id: u32,
    name: &str,
    callback: &str,
    ids: &mut BTreeSet<u32>,
    names: &mut BTreeSet<String>,
    errors: &mut Vec<GeneratorDiagnostic>,
) {
    if id == 0 || !ids.insert(id) {
        errors.push(field_error(
            source_path,
            source,
            "id",
            "VOGUI-GEN-008",
            "normalize",
            &format!("{table} id must be non-zero and unique"),
        ));
    }
    if !valid_identifier(name) || !names.insert(format!("{table}:{name}")) {
        errors.push(field_error(
            source_path,
            source,
            "name",
            "VOGUI-GEN-009",
            "normalize",
            &format!("{table} name must be a unique identifier"),
        ));
    }
    if !valid_identifier(callback) {
        errors.push(field_error(
            source_path,
            source,
            table,
            "VOGUI-GEN-004",
            "validate",
            "callback must be a named symbol",
        ));
    }
}

fn canonical_ir(ir: &AppAdapterIr) -> String {
    let mut out = format!(
        "module={};package={};app={};model={};message={};init={};transaction={};snapshot={};migration={};limits={},{},{},{},{};methods={},{},{},{},{}",
        ir.canonical_module,
        ir.package,
        ir.app_name,
        ir.model_type,
        ir.message_type,
        ir.init_type,
        ir.transaction_mode.wire_value(),
        ir.supports_neutral_snapshot as u8,
        ir.supports_migration as u8,
        ir.max_init_bytes,
        ir.max_model_bytes,
        ir.max_message_bytes,
        ir.max_effects_per_update,
        ir.max_subscriptions,
        ir.methods.init,
        ir.methods.update,
        ir.methods.view,
        ir.methods.subscriptions,
        ir.methods.on_error,
    );
    let mut scopes = ir.scopes.clone();
    scopes.sort_by_key(|scope| scope.id);
    for scope in scopes {
        write!(out, ";scope={},{},{}", scope.id, scope.name, scope.builder).unwrap();
    }
    for (kind, fields) in [
        ("init", ir.init_fields.as_slice()),
        ("model", ir.model_fields.as_slice()),
        ("message", ir.message_fields.as_slice()),
    ] {
        for field in fields {
            write!(
                out,
                ";{kind}-field={},{}",
                field.name,
                field.field_type.canonical_name()
            )
            .unwrap();
        }
    }
    let mut mappers = ir.mappers.clone();
    mappers.sort_by_key(|mapper| mapper.id);
    for mapper in mappers {
        write!(
            out,
            ";mapper={},{},{},{}",
            mapper.id, mapper.name, mapper.payload_type, mapper.map
        )
        .unwrap();
        for field in mapper.fields {
            write!(out, ",{},{}", field.name, field.field_type.canonical_name()).unwrap();
        }
    }
    let mut subscriptions = ir.subscriptions.clone();
    subscriptions.sort_by_key(|subscription| subscription.id);
    for subscription in subscriptions {
        write!(
            out,
            ";subscription={},{},{}",
            subscription.id, subscription.name, subscription.build
        )
        .unwrap();
    }
    out
}

#[allow(clippy::too_many_arguments)]
fn render_vo(
    ir: &AppAdapterIr,
    app_build_id: [u8; 32],
    artifact_id: [u8; 32],
    model_fingerprint: [u8; 32],
    message_fingerprint: [u8; 32],
    transitive_model_abi: [u8; 32],
    role_artifact_set_fingerprint: [u8; 32],
    factory_id: u64,
) -> String {
    let mut out = format!(
        "// governed-generator: {GENERATOR_NAME}@{GENERATOR_VERSION}\n// app-build-id: {}\n// artifact-id: {}\n// model-fingerprint: {}\n// message-fingerprint: {}\n// transitive-model-abi: {}\npackage {}\n\n",
        hex(&app_build_id),
        hex(&artifact_id),
        hex(&model_fingerprint),
        hex(&message_fingerprint),
        hex(&transitive_model_abi),
        ir.package,
    );
    out.push_str("import (\n\t\"errors\"\n\t\"github.com/vo-lang/vogui\"\n)\n\n");
    writeln!(
        out,
        "const {}FactoryId uint64 = {}",
        ir.app_name, factory_id
    )
    .unwrap();
    writeln!(
        out,
        "const {}TransactionMode uint32 = {}",
        ir.app_name,
        ir.transaction_mode.wire_value()
    )
    .unwrap();
    writeln!(
        out,
        "const {}MaxInitBytes uint64 = {}",
        ir.app_name, ir.max_init_bytes
    )
    .unwrap();
    writeln!(
        out,
        "const {}MaxModelBytes uint64 = {}",
        ir.app_name, ir.max_model_bytes
    )
    .unwrap();
    writeln!(
        out,
        "const {}MaxMessageBytes uint64 = {}",
        ir.app_name, ir.max_message_bytes
    )
    .unwrap();
    writeln!(out, "\ntype {}TypedAppAdapter struct {{", ir.app_name).unwrap();
    writeln!(out, "\tInitConfig {}", ir.init_type).unwrap();
    writeln!(out, "}}\n").unwrap();
    render_codec(
        &mut out,
        &ir.app_name,
        "Init",
        &ir.init_type,
        &ir.init_fields,
        &format!("{}MaxInitBytes", ir.app_name),
    );
    render_codec(
        &mut out,
        &ir.app_name,
        "Model",
        &ir.model_type,
        &ir.model_fields,
        &format!("{}MaxModelBytes", ir.app_name),
    );
    render_codec(
        &mut out,
        &ir.app_name,
        "Message",
        &ir.message_type,
        &ir.message_fields,
        &format!("{}MaxMessageBytes", ir.app_name),
    );
    for mapper in sorted_by_id(&ir.mappers, |mapper| mapper.id) {
        render_codec(
            &mut out,
            &ir.app_name,
            &format!("Mapper{}Payload", mapper.id),
            &mapper.payload_type,
            &mapper.fields,
            &format!("{}MaxMessageBytes", ir.app_name),
        );
    }
    writeln!(
        out,
        "func {}EntryDescriptor() vogui.AppEntryDescriptor {{",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\treturn vogui.AppEntryDescriptor{{").unwrap();
    writeln!(out, "\t\tArtifactId: {},", vo_byte_array(&artifact_id)).unwrap();
    writeln!(out, "\t\tFactoryId: {}FactoryId,", ir.app_name).unwrap();
    writeln!(out, "\t\tAppBuildId: {},", vo_byte_array(&app_build_id)).unwrap();
    writeln!(
        out,
        "\t\tModelFingerprint: {},",
        vo_byte_array(&model_fingerprint)
    )
    .unwrap();
    writeln!(
        out,
        "\t\tMessageFingerprint: {},",
        vo_byte_array(&message_fingerprint)
    )
    .unwrap();
    writeln!(
        out,
        "\t\tRoleArtifactSetFingerprint: {},",
        vo_byte_array(&role_artifact_set_fingerprint)
    )
    .unwrap();
    writeln!(out, "\t\tTransactionMode: {}TransactionMode,", ir.app_name).unwrap();
    writeln!(out, "\t}}").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func __vo_entry_meta_v1_vogui_{}_{}_{}_{}(initBytes []byte) {{",
        factory_id,
        hex(&artifact_id),
        hex(&app_build_id),
        hex(&role_artifact_set_fingerprint),
    )
    .unwrap();
    writeln!(
        out,
        "\tapp, ok := New{}TypedApp(initBytes)\n\tif !ok {{ panic(\"generated Vogui init codec rejected target-island payload\") }}\n\tcontext := {}GeneratedInitContext{{}}\n\tmodel, effects, err := app.Init(context)\n\tif err != nil {{ panic(err.Error()) }}\n\trootContext := {}GeneratedRootContext{{}}\n\tviewBuilder := &{}GeneratedViewBuilder{{NextNode: 1}}\n\trootNode, err := app.View(model, rootContext, viewBuilder)\n\tif err != nil {{ panic(err.Error()) }}\n\tif err := viewBuilder.SetRoot(rootNode); err != nil {{ panic(err.Error()) }}\n\tsubscriptionsBuilder := &{}GeneratedSubscriptionsBuilder{{LogicalRoot: 1}}\n\tif err := app.Subscriptions(model, subscriptionsBuilder); err != nil {{ panic(err.Error()) }}\n\tif subscriptionsBuilder.Failure != nil {{ panic(subscriptionsBuilder.Failure.Error()) }}\n\tif err := vogui.TargetInit(model, effects, viewBuilder.Records, subscriptionsBuilder.Records); err != nil {{ panic(err.Error()) }}\n\tfor {{\n\t\tturn, err := vogui.TargetNextTurn()\n\t\tif err != nil {{ panic(err.Error()) }}\n\t\tif len(turn) < 36 {{ panic(\"invalid Vogui target turn envelope\") }}\n\t\tturnVersion := {}ReadU32(turn, 0)\n\t\theaderBytes := 36\n\t\teventSequence := uint64(0)\n\t\teventRevision := uint64(0)\n\t\tif turnVersion == 3 {{\n\t\t\tif len(turn) < 52 {{ panic(\"invalid sequenced Vogui target turn envelope\") }}\n\t\t\theaderBytes = 52\n\t\t\teventSequence = {}ReadU64(turn, 32)\n\t\t\teventRevision = {}ReadU64(turn, 40)\n\t\t}} else if turnVersion != 2 {{\n\t\t\tpanic(\"unsupported Vogui target turn envelope version\")\n\t\t}}\n\t\tmapperId := {}ReadU32(turn, 4)\n\t\tmonotonicMillis := {}ReadU64(turn, 8)\n\t\tsourceRoot := vogui.Handle{{Index: {}ReadU32(turn, 16), Generation: {}ReadU32(turn, 20)}}\n\t\tsourceView := vogui.Handle{{Index: {}ReadU32(turn, 24), Generation: {}ReadU32(turn, 28)}}\n\t\tpayloadLength := int({}ReadU32(turn, headerBytes-4))\n\t\tif payloadLength != len(turn)-headerBytes {{ panic(\"invalid Vogui target turn payload length\") }}\n\t\tmessage, ok := {}DispatchMapper(mapperId, turn[headerBytes:])\n\t\tif !ok {{ panic(\"generated Vogui mapper rejected target turn\") }}\n\t\tupdateContext := {}GeneratedUpdateContext{{Millis: monotonicMillis, Root: sourceRoot, View: sourceView, Sequence: eventSequence, Revision: eventRevision}}\n\t\tcandidate, updateResult, nextEffects, err := app.Update(model, message, updateContext)\n\t\tif err != nil {{ panic(err.Error()) }}\n\t\tviewBuilder = &{}GeneratedViewBuilder{{NextNode: 1}}\n\t\trootNode, err = app.View(candidate, rootContext, viewBuilder)\n\t\tif err != nil {{ panic(err.Error()) }}\n\t\tif err := viewBuilder.SetRoot(rootNode); err != nil {{ panic(err.Error()) }}\n\t\tsubscriptionMode, subscriptionRequests, ok := {}DecodeSubscriptionUpdate(updateResult)\n\t\tif !ok {{ panic(\"generated Vogui update result is invalid\") }}\n\t\tsubscriptionsBuilder = &{}GeneratedSubscriptionsBuilder{{LogicalRoot: 1}}\n\t\tif subscriptionMode == 1 {{\n\t\t\tif err := app.Subscriptions(candidate, subscriptionsBuilder); err != nil {{ panic(err.Error()) }}\n\t\t}} else if subscriptionMode == 2 {{\n\t\t\tfor _, request := range subscriptionRequests {{\n\t\t\t\townerBuilder := &{}GeneratedSubscriptionsBuilder{{LogicalRoot: request.LogicalRoot, ForcedOwner: request.Owner, ForcedOwnerRef: request.OwnerRef}}\n\t\t\t\tif err := {}DispatchSubscription(request.BuilderId, candidate, ownerBuilder); err != nil {{ panic(err.Error()) }}\n\t\t\t\tif ownerBuilder.Failure != nil {{ panic(ownerBuilder.Failure.Error()) }}\n\t\t\t\tsubscriptionsBuilder.Records = append(subscriptionsBuilder.Records, ownerBuilder.Records...)\n\t\t\t}}\n\t\t}}\n\t\tif subscriptionsBuilder.Failure != nil {{ panic(subscriptionsBuilder.Failure.Error()) }}\n\t\tif err := vogui.TargetCommit(candidate, updateResult, nextEffects, viewBuilder.Records, subscriptionsBuilder.Records); err != nil {{ panic(err.Error()) }}\n\t\tmodel = candidate\n\t}}\n}}\n",
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func __VoguiRun{}(app {}TypedAppAdapter) error {{",
        ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\tinitBytes, ok := {}EncodeInit(app.InitConfig)",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\tif !ok {{ return errors.New(\"generated init config exceeds descriptor limit\") }}"
    )
    .unwrap();
    writeln!(out, "\tdescriptor := {}EntryDescriptor()", ir.app_name).unwrap();
    writeln!(
        out,
        "\tdescriptorBytes := make([]byte, 0, 172)\n\tdescriptorBytes = append(descriptorBytes, descriptor.ArtifactId[:]...)\n\tdescriptorBytes = {}AppendU64(descriptorBytes, descriptor.FactoryId)\n\tdescriptorBytes = append(descriptorBytes, descriptor.AppBuildId[:]...)\n\tdescriptorBytes = append(descriptorBytes, descriptor.ModelFingerprint[:]...)\n\tdescriptorBytes = append(descriptorBytes, descriptor.MessageFingerprint[:]...)\n\tdescriptorBytes = append(descriptorBytes, descriptor.RoleArtifactSetFingerprint[:]...)\n\tdescriptorBytes = {}AppendU32(descriptorBytes, descriptor.TransactionMode)",
        ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(out, "\treturn vogui.RunEntry(descriptorBytes, initBytes)").unwrap();
    writeln!(out, "}}\n").unwrap();
    render_app_adapter(&mut out, ir);
    render_dispatch(&mut out, ir);
    writeln!(out, "type {}ScopeBuilderRecord struct {{", ir.app_name).unwrap();
    writeln!(out, "\tId uint32").unwrap();
    writeln!(out, "\tName string").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func {}ScopeBuilderTable() []{}ScopeBuilderRecord {{",
        ir.app_name, ir.app_name
    )
    .unwrap();
    out.push_str("\treturn []");
    out.push_str(&ir.app_name);
    out.push_str("ScopeBuilderRecord{\n");
    for scope in sorted_by_id(&ir.scopes, |scope| scope.id) {
        writeln!(out, "\t\t{{Id: {}, Name: {:?}}},", scope.id, scope.name).unwrap();
    }
    writeln!(out, "\t}}").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(out, "type {}MapperRecord struct {{", ir.app_name).unwrap();
    writeln!(out, "\tId uint32").unwrap();
    writeln!(out, "\tName string").unwrap();
    writeln!(out, "\tPayloadType string").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func {}MapperTable() []{}MapperRecord {{",
        ir.app_name, ir.app_name
    )
    .unwrap();
    out.push_str("\treturn []");
    out.push_str(&ir.app_name);
    out.push_str("MapperRecord{\n");
    for mapper in sorted_by_id(&ir.mappers, |mapper| mapper.id) {
        writeln!(
            out,
            "\t\t{{Id: {}, Name: {:?}, PayloadType: {:?}}},",
            mapper.id, mapper.name, mapper.payload_type
        )
        .unwrap();
    }
    writeln!(out, "\t}}").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "// factory {} constructs the adapter inside its target Ui VmIsland.",
        factory_id
    )
    .unwrap();
    writeln!(
        out,
        "// init={} update={} view={}",
        ir.methods.init, ir.methods.update, ir.methods.view
    )
    .unwrap();
    writeln!(
        out,
        "// subscriptions={} on_error={}",
        ir.methods.subscriptions, ir.methods.on_error
    )
    .unwrap();
    for scope in sorted_by_id(&ir.scopes, |scope| scope.id) {
        writeln!(
            out,
            "// scope-builder {} {} -> {}",
            scope.id, scope.name, scope.builder
        )
        .unwrap();
    }
    for mapper in sorted_by_id(&ir.mappers, |mapper| mapper.id) {
        writeln!(
            out,
            "// mapper {} {} ({}) -> {}",
            mapper.id, mapper.name, mapper.payload_type, mapper.map
        )
        .unwrap();
    }
    for subscription in sorted_by_id(&ir.subscriptions, |subscription| subscription.id) {
        writeln!(
            out,
            "// subscription-builder {} {} -> {}",
            subscription.id, subscription.name, subscription.build
        )
        .unwrap();
    }
    render_binary_helpers(&mut out, &ir.app_name);
    out
}

fn render_app_adapter(out: &mut String, ir: &AppAdapterIr) {
    writeln!(
        out,
        "type {}GeneratedInitContext struct {{}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedInitContext) Session() vogui.UiSessionRef {{",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\treturn vogui.TargetSession()").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func (context {}GeneratedInitContext) Capabilities() []byte {{",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\treturn []byte{{}}").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "type {}GeneratedUpdateContext struct {{\n\tMillis uint64\n\tRoot vogui.Handle\n\tView vogui.Handle\n\tSequence uint64\n\tRevision uint64\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedUpdateContext) Session() vogui.UiSessionRef {{\n\treturn vogui.TargetSession()\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedUpdateContext) SourceRoot() vogui.UiRootRef {{\n\treturn vogui.UiRootRef{{Session: vogui.TargetSession(), Root: context.Root}}\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedUpdateContext) SourceView() vogui.AppViewRef {{\n\treturn vogui.AppViewRef{{Session: vogui.TargetSession(), View: context.View}}\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedUpdateContext) SourceSurface() vogui.SurfaceRef {{\n\treturn vogui.SurfaceRef{{Index: context.View.Index, Generation: context.View.Generation}}\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedUpdateContext) EventSequence() uint64 {{ return context.Sequence }}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedUpdateContext) EventRevision() uint64 {{ return context.Revision }}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedUpdateContext) MonotonicMillis() uint64 {{\n\treturn context.Millis\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedUpdateContext) Capabilities() []byte {{\n\treturn []byte{{}}\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "type {}GeneratedRootContext struct {{}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedRootContext) Session() vogui.UiSessionRef {{ return vogui.TargetSession() }}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedRootContext) Root() vogui.UiRootRef {{ return vogui.UiRootRef{{Session: vogui.TargetSession(), Root: vogui.TargetIdentity()}} }}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedRootContext) View() vogui.AppViewRef {{ return vogui.AppViewRef{{Session: vogui.TargetSession(), View: vogui.TargetIdentity()}} }}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (context {}GeneratedRootContext) Surface() vogui.SurfaceRef {{\n\tidentity := vogui.TargetIdentity()\n\treturn vogui.SurfaceRef{{Index: identity.Index, Generation: identity.Generation}}\n}}\n",
        ir.app_name
    )
    .unwrap();
    for method in ["MetricsRevision", "ThemeRevision", "LocaleRevision"] {
        writeln!(
            out,
            "func (context {}GeneratedRootContext) {}() uint64 {{ return 1 }}\n",
            ir.app_name, method
        )
        .unwrap();
    }
    writeln!(
        out,
        "type {}GeneratedViewBuilder struct {{\n\tRecords []byte\n\tNextNode uint64\n\tNextStyle uint64\n\tThemeSet bool\n\tFailure error\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedViewBuilder) reserve(bytes int) bool {{\n\tif builder.Failure != nil {{ return false }}\n\tif bytes < 0 || len(builder.Records)+bytes > 16777216 {{ builder.Failure = errors.New(\"generated Vogui presentation exceeds provider limit\"); return false }}\n\treturn true\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedViewBuilder) Style(descriptor []byte) uint64 {{\n\tif len(descriptor) == 0 || len(descriptor) > 1048576 || !builder.reserve(13+len(descriptor)) {{ return 0 }}\n\tif builder.NextStyle == 0 {{ builder.NextStyle = 1 }}\n\tid := builder.NextStyle\n\tif id == 18446744073709551615 {{ builder.Failure = errors.New(\"generated Vogui style identity exhausted\"); return 0 }}\n\tbuilder.NextStyle++\n\tbuilder.Records = append(builder.Records, byte(7))\n\tbuilder.Records = {}AppendU64(builder.Records, id)\n\tbuilder.Records = {}AppendU32(builder.Records, uint32(len(descriptor)))\n\tbuilder.Records = append(builder.Records, descriptor...)\n\treturn id\n}}\n",
        ir.app_name, ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedViewBuilder) Theme(descriptor []byte) error {{\n\tif builder.ThemeSet {{ builder.Failure = errors.New(\"generated Vogui theme may only be set once\"); return builder.Failure }}\n\tif len(descriptor) == 0 || len(descriptor) > 1048576 || !builder.reserve(5+len(descriptor)) {{ return builder.Failure }}\n\tbuilder.ThemeSet = true\n\tbuilder.Records = append(builder.Records, byte(8))\n\tbuilder.Records = {}AppendU32(builder.Records, uint32(len(descriptor)))\n\tbuilder.Records = append(builder.Records, descriptor...)\n\treturn nil\n}}\n",
        ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedViewBuilder) Node(kind uint64, key string, properties []byte, children []uint64) uint64 {{\n\tif len(key) > 4294967295 || len(properties) > 4294967295 || len(children) > 4294967295 || !builder.reserve(33+len(key)+len(properties)+len(children)*8) {{ return 0 }}\n\tid := builder.NextNode\n\tif id == 0 {{ builder.Failure = errors.New(\"generated Vogui node identity exhausted\"); return 0 }}\n\tbuilder.NextNode++\n\tbuilder.Records = append(builder.Records, byte(1))\n\tbuilder.Records = {}AppendU64(builder.Records, id)\n\tbuilder.Records = {}AppendU64(builder.Records, kind)\n\tbuilder.Records = {}AppendU32(builder.Records, uint32(len(key)))\n\tbuilder.Records = {}AppendU32(builder.Records, uint32(len(properties)))\n\tbuilder.Records = {}AppendU32(builder.Records, uint32(len(children)))\n\tbuilder.Records = append(builder.Records, []byte(key)...)\n\tbuilder.Records = append(builder.Records, properties...)\n\tfor _, child := range children {{ builder.Records = {}AppendU64(builder.Records, child) }}\n\treturn id\n}}\n",
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedViewBuilder) Scope(builderId uint64, key string, child uint64) uint64 {{\n\tif len(key) > 4294967295 || !builder.reserve(29+len(key)) {{ return 0 }}\n\tid := builder.NextNode\n\tif id == 0 {{ builder.Failure = errors.New(\"generated Vogui scope identity exhausted\"); return 0 }}\n\tbuilder.NextNode++\n\tbuilder.Records = append(builder.Records, byte(2))\n\tbuilder.Records = {}AppendU64(builder.Records, id)\n\tbuilder.Records = {}AppendU64(builder.Records, builderId)\n\tbuilder.Records = {}AppendU64(builder.Records, child)\n\tbuilder.Records = {}AppendU32(builder.Records, uint32(len(key)))\n\tbuilder.Records = append(builder.Records, []byte(key)...)\n\treturn id\n}}\n",
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedViewBuilder) BindEvent(node uint64, eventKind uint64, mapperId uint64) error {{\n\tif !builder.reserve(25) {{ return builder.Failure }}\n\tbuilder.Records = append(builder.Records, byte(3))\n\tbuilder.Records = {}AppendU64(builder.Records, node)\n\tbuilder.Records = {}AppendU64(builder.Records, eventKind)\n\tbuilder.Records = {}AppendU64(builder.Records, mapperId)\n\treturn nil\n}}\n",
        ir.app_name, ir.app_name, ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedViewBuilder) BindRef(node uint64, refId uint64) error {{\n\tif !builder.reserve(17) {{ return builder.Failure }}\n\tbuilder.Records = append(builder.Records, byte(4))\n\tbuilder.Records = {}AppendU64(builder.Records, node)\n\tbuilder.Records = {}AppendU64(builder.Records, refId)\n\treturn nil\n}}\n",
        ir.app_name, ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedViewBuilder) BindResource(node uint64, resourceId uint64, descriptor []byte) error {{\n\tif node == 0 || resourceId == 0 || len(descriptor) == 0 || len(descriptor) > 1048576 || !builder.reserve(21+len(descriptor)) {{ return builder.Failure }}\n\tbuilder.Records = append(builder.Records, byte(6))\n\tbuilder.Records = {}AppendU64(builder.Records, node)\n\tbuilder.Records = {}AppendU64(builder.Records, resourceId)\n\tbuilder.Records = {}AppendU32(builder.Records, uint32(len(descriptor)))\n\tbuilder.Records = append(builder.Records, descriptor...)\n\treturn nil\n}}\n",
        ir.app_name, ir.app_name, ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedViewBuilder) SetRoot(root uint64) error {{\n\tif root == 0 {{ builder.Failure = errors.New(\"generated Vogui root identity is invalid\"); return builder.Failure }}\n\tif !builder.reserve(9) {{ return builder.Failure }}\n\tbuilder.Records = append(builder.Records, byte(5))\n\tbuilder.Records = {}AppendU64(builder.Records, root)\n\treturn nil\n}}\n",
        ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "type {}GeneratedSubscriptionsBuilder struct {{\n\tRecords []byte\n\tFailure error\n\tLogicalRoot uint64\n\tForcedOwner vogui.SubscriptionOwner\n\tForcedOwnerRef uint64\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func (builder *{}GeneratedSubscriptionsBuilder) Subscribe(key string, kind string, descriptor []byte, mapperId uint64) error {{\n\towner := builder.ForcedOwner\n\townerRef := builder.ForcedOwnerRef\n\tif owner == 0 {{ owner = vogui.SubscriptionOwnerUiRoot }}\n\treturn builder.SubscribeOwned(owner, ownerRef, key, kind, descriptor, mapperId)\n}}\n\nfunc (builder *{}GeneratedSubscriptionsBuilder) SubscribeOwned(owner vogui.SubscriptionOwner, ownerRef uint64, key string, kind string, descriptor []byte, mapperId uint64) error {{\n\tif builder.Failure != nil {{ return builder.Failure }}\n\tif builder.ForcedOwner != 0 && (owner != builder.ForcedOwner || ownerRef != builder.ForcedOwnerRef) {{ builder.Failure = errors.New(\"generated subscription builder emitted a different owner\"); return builder.Failure }}\n\tlogicalRoot := builder.LogicalRoot\n\tif owner == vogui.SubscriptionOwnerApp {{ logicalRoot = 0 }} else if logicalRoot == 0 {{ logicalRoot = 1 }}\n\tvalidOwner := (owner == vogui.SubscriptionOwnerApp || owner == vogui.SubscriptionOwnerUiRoot) && ownerRef == 0\n\tif owner == vogui.SubscriptionOwnerScope && ownerRef != 0 {{ validOwner = true }}\n\tif !validOwner || len(key) == 0 || len(key) > 65535 || len(kind) == 0 || len(kind) > 65535 || len(descriptor) > 4294967295 || mapperId == 0 || len(builder.Records)+35+len(key)+len(kind)+len(descriptor) > 16777216 {{ builder.Failure = errors.New(\"generated Vogui subscriptions exceed provider limit\"); return builder.Failure }}\n\tbuilder.Records = append(builder.Records, byte(4), byte(owner), byte(0))\n\tbuilder.Records = append(builder.Records, byte(len(key)), byte(len(key) >> 8), byte(len(kind)), byte(len(kind) >> 8))\n\tbuilder.Records = {}AppendU32(builder.Records, uint32(len(descriptor)))\n\tbuilder.Records = {}AppendU64(builder.Records, mapperId)\n\tbuilder.Records = {}AppendU64(builder.Records, ownerRef)\n\tbuilder.Records = {}AppendU64(builder.Records, logicalRoot)\n\tbuilder.Records = append(builder.Records, []byte(key)...)\n\tbuilder.Records = append(builder.Records, []byte(kind)...)\n\tbuilder.Records = append(builder.Records, descriptor...)\n\treturn nil\n}}\n",
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name,
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "type {}GeneratedSubscriptionBuildRequest struct {{\n\tOwner vogui.SubscriptionOwner\n\tLogicalRoot uint64\n\tOwnerRef uint64\n\tBuilderId uint32\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func {}DecodeSubscriptionUpdate(bytes []byte) (byte, []{}GeneratedSubscriptionBuildRequest, bool) {{",
        ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\tif len(bytes) == 0 {{ return 1, nil, true }}\n\tif len(bytes) < 8 || bytes[0] != 'V' || bytes[1] != 'G' || bytes[2] != 'U' || (bytes[3] != '1' && bytes[3] != '2') || bytes[5] != 0 {{ return 0, nil, false }}\n\tqualified := bytes[3] == '2'\n\trecordBytes := 16\n\tif qualified {{ recordBytes = 24 }}\n\tmode := bytes[4]\n\tcount := int(bytes[6]) | int(bytes[7]) << 8\n\tif len(bytes) != 8 + count*recordBytes {{ return 0, nil, false }}\n\tif (mode == 0 || mode == 1) && count == 0 {{ return mode, nil, true }}\n\tif mode != 2 || count == 0 || count > 4096 {{ return 0, nil, false }}\n\trequests := make([]{}GeneratedSubscriptionBuildRequest, 0, count)",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\tfor index := 0; index < count; index++ {{").unwrap();
    writeln!(
        out,
        "\t\toffset := 8 + index*recordBytes\n\t\towner := vogui.SubscriptionOwner(bytes[offset])\n\t\tif bytes[offset+1] != 0 || bytes[offset+2] != 0 || bytes[offset+3] != 0 {{ return 0, nil, false }}\n\t\tbuilderId := {}ReadU32(bytes, offset+4)\n\t\townerRef := {}ReadU64(bytes, offset+8)\n\t\tlogicalRoot := uint64(0)\n\t\tif qualified {{ logicalRoot = {}ReadU64(bytes, offset+16) }}\n\t\tvalidOwner := owner == vogui.SubscriptionOwnerApp && ownerRef == 0 && logicalRoot == 0\n\t\tif owner == vogui.SubscriptionOwnerUiRoot && ownerRef == 0 && (!qualified || logicalRoot != 0) {{ validOwner = true }}\n\t\tif owner == vogui.SubscriptionOwnerScope && ownerRef != 0 && (!qualified || logicalRoot != 0) {{ validOwner = true }}\n\t\tif !validOwner || builderId == 0 {{ return 0, nil, false }}",
        ir.app_name, ir.app_name, ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\t\tfor _, previous := range requests {{ if previous.Owner == owner && previous.LogicalRoot == logicalRoot && previous.OwnerRef == ownerRef {{ return 0, nil, false }} }}\n\t\trequests = append(requests, {}GeneratedSubscriptionBuildRequest{{Owner: owner, LogicalRoot: logicalRoot, OwnerRef: ownerRef, BuilderId: builderId}})\n\t}}\n\treturn mode, requests, true\n}}\n",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "func New{}TypedApp(initBytes []byte) (vogui.App, bool) {{",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\tinitConfig, ok := {}DecodeInit(initBytes)",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\tif !ok {{ return nil, false }}").unwrap();
    writeln!(
        out,
        "\treturn {}TypedAppAdapter{{InitConfig: initConfig}}, true",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func (app {}TypedAppAdapter) Init(context vogui.InitContext) ([]byte, []byte, error) {{",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\tmodel, effects, err := {}(app.InitConfig, context)",
        ir.methods.init
    )
    .unwrap();
    writeln!(out, "\tif err != nil {{ return nil, nil, err }}").unwrap();
    writeln!(out, "\tencoded, ok := {}EncodeModel(model)", ir.app_name).unwrap();
    writeln!(
        out,
        "\tif !ok {{ return nil, nil, errors.New(\"generated model exceeds descriptor limit\") }}"
    )
    .unwrap();
    writeln!(out, "\treturn encoded, effects, nil").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func (app {}TypedAppAdapter) Update(modelBytes []byte, messageBytes []byte, context vogui.UpdateContext) ([]byte, []byte, []byte, error) {{",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\tmodel, modelOK := {}DecodeModel(modelBytes)",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\tmessage, messageOK := {}DecodeMessage(messageBytes)",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\tif !modelOK || !messageOK {{ return nil, nil, nil, errors.New(\"generated model/message codec rejected input\") }}"
    )
    .unwrap();
    writeln!(
        out,
        "\tcandidate, updateResult, effects, err := {}(model, message, context)",
        ir.methods.update
    )
    .unwrap();
    writeln!(out, "\tif err != nil {{ return nil, nil, nil, err }}").unwrap();
    writeln!(
        out,
        "\tencoded, ok := {}EncodeModel(candidate)",
        ir.app_name
    )
    .unwrap();
    writeln!(
        out,
        "\tif !ok {{ return nil, nil, nil, errors.New(\"generated candidate model exceeds descriptor limit\") }}"
    )
    .unwrap();
    writeln!(out, "\treturn encoded, updateResult, effects, nil").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func (app {}TypedAppAdapter) View(modelBytes []byte, context vogui.RootContext, builder vogui.ViewBuilder) (uint64, error) {{",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\tmodel, ok := {}DecodeModel(modelBytes)", ir.app_name).unwrap();
    writeln!(
        out,
        "\tif !ok {{ return 0, errors.New(\"generated model codec rejected View input\") }}"
    )
    .unwrap();
    writeln!(out, "\treturn {}(model, context, builder)", ir.methods.view).unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func (app {}TypedAppAdapter) Subscriptions(modelBytes []byte, builder vogui.SubscriptionsBuilder) error {{",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\tmodel, ok := {}DecodeModel(modelBytes)", ir.app_name).unwrap();
    writeln!(
        out,
        "\tif !ok {{ return errors.New(\"generated model codec rejected Subscriptions input\") }}"
    )
    .unwrap();
    writeln!(out, "\treturn {}(model, builder)", ir.methods.subscriptions).unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func (app {}TypedAppAdapter) OnError(context []byte) uint32 {{",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\treturn {}(context)", ir.methods.on_error).unwrap();
    writeln!(out, "}}\n").unwrap();
}

fn render_dispatch(out: &mut String, ir: &AppAdapterIr) {
    writeln!(
        out,
        "func {}DispatchScope(builderId uint32, modelBytes []byte, context vogui.RootContext, builder vogui.ViewBuilder) (uint64, error) {{",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\tmodel, ok := {}DecodeModel(modelBytes)", ir.app_name).unwrap();
    writeln!(
        out,
        "\tif !ok {{ return 0, errors.New(\"generated model codec rejected Scope input\") }}"
    )
    .unwrap();
    writeln!(out, "\t_ = model").unwrap();
    for scope in sorted_by_id(&ir.scopes, |scope| scope.id) {
        writeln!(
            out,
            "\tif builderId == {} {{ return {}(model, context, builder) }}",
            scope.id, scope.builder
        )
        .unwrap();
    }
    writeln!(
        out,
        "\treturn 0, errors.New(\"unknown generated ScopeBuilderId\")"
    )
    .unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func {}DispatchMapper(mapperId uint32, payloadBytes []byte) ([]byte, bool) {{",
        ir.app_name
    )
    .unwrap();
    for mapper in sorted_by_id(&ir.mappers, |mapper| mapper.id) {
        writeln!(out, "\tif mapperId == {} {{", mapper.id).unwrap();
        writeln!(
            out,
            "\t\tpayload, ok := {}DecodeMapper{}Payload(payloadBytes)",
            ir.app_name, mapper.id
        )
        .unwrap();
        writeln!(out, "\t\tif !ok {{ return nil, false }}").unwrap();
        writeln!(out, "\t\tmessage := {}(payload)", mapper.map).unwrap();
        writeln!(out, "\t\treturn {}EncodeMessage(message)", ir.app_name).unwrap();
        writeln!(out, "\t}}").unwrap();
    }
    writeln!(out, "\treturn nil, false").unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func {}DispatchSubscription(builderId uint32, modelBytes []byte, builder vogui.SubscriptionsBuilder) error {{",
        ir.app_name
    )
    .unwrap();
    writeln!(out, "\tmodel, ok := {}DecodeModel(modelBytes)", ir.app_name).unwrap();
    writeln!(
        out,
        "\tif !ok {{ return errors.New(\"generated model codec rejected Subscription input\") }}"
    )
    .unwrap();
    writeln!(out, "\t_ = model").unwrap();
    for subscription in sorted_by_id(&ir.subscriptions, |subscription| subscription.id) {
        writeln!(
            out,
            "\tif builderId == {} {{ return {}(model, builder) }}",
            subscription.id, subscription.build
        )
        .unwrap();
    }
    writeln!(
        out,
        "\treturn errors.New(\"unknown generated SubscriptionBuilderId\")"
    )
    .unwrap();
    writeln!(out, "}}\n").unwrap();
}

fn render_codec(
    out: &mut String,
    app_name: &str,
    codec_name: &str,
    value_type: &str,
    fields: &[Field],
    max_bytes: &str,
) {
    writeln!(
        out,
        "func {}Encode{}(value {}) ([]byte, bool) {{",
        app_name, codec_name, value_type
    )
    .unwrap();
    writeln!(out, "\toutput := make([]byte, 0)").unwrap();
    for field in fields {
        render_encode_field(out, app_name, field);
    }
    writeln!(
        out,
        "\tif len(output) > int({}) {{ return nil, false }}",
        max_bytes
    )
    .unwrap();
    writeln!(out, "\treturn output, true").unwrap();
    writeln!(out, "}}\n").unwrap();

    writeln!(
        out,
        "func {}Decode{}(input []byte) ({}, bool) {{",
        app_name, codec_name, value_type
    )
    .unwrap();
    writeln!(out, "\tvalue := {}{{}}", value_type).unwrap();
    writeln!(
        out,
        "\tif len(input) > int({}) {{ return value, false }}",
        max_bytes
    )
    .unwrap();
    writeln!(out, "\toffset := 0").unwrap();
    for field in fields {
        render_decode_field(out, app_name, field);
    }
    writeln!(out, "\tif offset != len(input) {{ return value, false }}").unwrap();
    writeln!(out, "\treturn value, true").unwrap();
    writeln!(out, "}}\n").unwrap();
}

fn render_encode_field(out: &mut String, app_name: &str, field: &Field) {
    match field.field_type {
        FieldType::Bool => {
            writeln!(
                out,
                "\tif value.{} {{ output = append(output, 1) }} else {{ output = append(output, 0) }}",
                field.name
            )
            .unwrap();
        }
        FieldType::Int32 | FieldType::Uint32 => {
            writeln!(
                out,
                "\toutput = {}AppendU32(output, uint32(value.{}))",
                app_name, field.name
            )
            .unwrap();
        }
        FieldType::Int64 | FieldType::Uint64 => {
            writeln!(
                out,
                "\toutput = {}AppendU64(output, uint64(value.{}))",
                app_name, field.name
            )
            .unwrap();
        }
        FieldType::String => {
            writeln!(
                out,
                "\tif len(value.{0}) > 4294967295 {{ return nil, false }}\n\toutput = {1}AppendU32(output, uint32(len(value.{0})))\n\toutput = append(output, []byte(value.{0})...)",
                field.name, app_name
            )
            .unwrap();
        }
        FieldType::Bytes => {
            writeln!(
                out,
                "\tif len(value.{0}) > 4294967295 {{ return nil, false }}\n\toutput = {1}AppendU32(output, uint32(len(value.{0})))\n\toutput = append(output, value.{0}...)",
                field.name, app_name
            )
            .unwrap();
        }
    }
}

fn render_decode_field(out: &mut String, app_name: &str, field: &Field) {
    match field.field_type {
        FieldType::Bool => {
            writeln!(
                out,
                "\tif offset >= len(input) || input[offset] > 1 {{ return value, false }}\n\tvalue.{0} = input[offset] == 1\n\toffset++",
                field.name
            )
            .unwrap();
        }
        FieldType::Int32 => {
            writeln!(
                out,
                "\tif len(input) - offset < 4 {{ return value, false }}\n\tvalue.{0} = int32({1}ReadU32(input, offset))\n\toffset += 4",
                field.name, app_name
            )
            .unwrap();
        }
        FieldType::Uint32 => {
            writeln!(
                out,
                "\tif len(input) - offset < 4 {{ return value, false }}\n\tvalue.{0} = {1}ReadU32(input, offset)\n\toffset += 4",
                field.name, app_name
            )
            .unwrap();
        }
        FieldType::Int64 => {
            writeln!(
                out,
                "\tif len(input) - offset < 8 {{ return value, false }}\n\tvalue.{0} = int64({1}ReadU64(input, offset))\n\toffset += 8",
                field.name, app_name
            )
            .unwrap();
        }
        FieldType::Uint64 => {
            writeln!(
                out,
                "\tif len(input) - offset < 8 {{ return value, false }}\n\tvalue.{0} = {1}ReadU64(input, offset)\n\toffset += 8",
                field.name, app_name
            )
            .unwrap();
        }
        FieldType::String => {
            let length_name = format!("{}Length", field.name);
            render_decode_length(out, app_name, &length_name);
            writeln!(
                out,
                "\tvalue.{0} = string(input[offset:offset + {1}])\n\toffset += {1}",
                field.name, length_name
            )
            .unwrap();
        }
        FieldType::Bytes => {
            let length_name = format!("{}Length", field.name);
            render_decode_length(out, app_name, &length_name);
            writeln!(
                out,
                "\tvalue.{0} = make([]byte, {1})\n\tcopy(value.{0}, input[offset:offset + {1}])\n\toffset += {1}",
                field.name, length_name
            )
            .unwrap();
        }
    }
}

fn render_decode_length(out: &mut String, app_name: &str, length_name: &str) {
    writeln!(
        out,
        "\tif len(input) - offset < 4 {{ return value, false }}\n\t{length_name} := int({app_name}ReadU32(input, offset))\n\toffset += 4\n\tif {length_name} > len(input) - offset {{ return value, false }}"
    )
    .unwrap();
}

fn render_binary_helpers(out: &mut String, app_name: &str) {
    writeln!(
        out,
        "func {}AppendU32(output []byte, value uint32) []byte {{",
        app_name
    )
    .unwrap();
    writeln!(
        out,
        "\treturn append(output, byte(value), byte(value >> 8), byte(value >> 16), byte(value >> 24))"
    )
    .unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func {}AppendU64(output []byte, value uint64) []byte {{",
        app_name
    )
    .unwrap();
    writeln!(
        out,
        "\treturn append(output, byte(value), byte(value >> 8), byte(value >> 16), byte(value >> 24), byte(value >> 32), byte(value >> 40), byte(value >> 48), byte(value >> 56))"
    )
    .unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func {}ReadU32(input []byte, offset int) uint32 {{",
        app_name
    )
    .unwrap();
    writeln!(
        out,
        "\treturn uint32(input[offset]) | uint32(input[offset + 1]) << 8 | uint32(input[offset + 2]) << 16 | uint32(input[offset + 3]) << 24"
    )
    .unwrap();
    writeln!(out, "}}\n").unwrap();
    writeln!(
        out,
        "func {}ReadU64(input []byte, offset int) uint64 {{",
        app_name
    )
    .unwrap();
    writeln!(
        out,
        "\treturn uint64(input[offset]) | uint64(input[offset + 1]) << 8 | uint64(input[offset + 2]) << 16 | uint64(input[offset + 3]) << 24 | uint64(input[offset + 4]) << 32 | uint64(input[offset + 5]) << 40 | uint64(input[offset + 6]) << 48 | uint64(input[offset + 7]) << 56"
    )
    .unwrap();
    writeln!(out, "}}\n").unwrap();
}

#[allow(clippy::too_many_arguments)]
fn render_manifest(
    ir: &AppAdapterIr,
    app_build_id: [u8; 32],
    artifact_id: [u8; 32],
    model_fingerprint: [u8; 32],
    message_fingerprint: [u8; 32],
    transitive_model_abi: [u8; 32],
    factory_id: u64,
    cache_key: [u8; 32],
) -> String {
    format!(
        "format=1\ngenerator={GENERATOR_NAME}\ngenerator_version={GENERATOR_VERSION}\nschema_kind={SCHEMA_KIND}\napp={}\nfactory_id={factory_id}\napp_build_id={}\nartifact_id={}\nmodel_fingerprint={}\nmessage_fingerprint={}\ntransitive_model_abi={}\ntransaction_mode={}\ncache_key={}\n",
        ir.app_name,
        hex(&app_build_id),
        hex(&artifact_id),
        hex(&model_fingerprint),
        hex(&message_fingerprint),
        hex(&transitive_model_abi),
        ir.transaction_mode.wire_value(),
        hex(&cache_key),
    )
}

fn sorted_by_id<T>(values: &[T], id: impl Fn(&T) -> u32) -> Vec<&T> {
    let mut values: Vec<_> = values.iter().collect();
    values.sort_by_key(|value| id(value));
    values
}

fn valid_module_path(value: &str) -> bool {
    let segments = value.split('/').collect::<Vec<_>>();
    segments.len() >= 2
        && segments.iter().all(|segment| {
            !segment.is_empty()
                && *segment != "."
                && *segment != ".."
                && segment
                    .chars()
                    .next()
                    .is_some_and(|first| first == '_' || first.is_ascii_alphanumeric())
                && segment.chars().all(|character| {
                    character == '_'
                        || character == '-'
                        || character == '.'
                        || character.is_ascii_alphanumeric()
                })
        })
}

fn valid_identifier(value: &str) -> bool {
    let mut bytes = value.bytes();
    matches!(bytes.next(), Some(b'a'..=b'z' | b'A'..=b'Z' | b'_'))
        && bytes.all(|byte| byte.is_ascii_alphanumeric() || byte == b'_')
}

fn snake_case(value: &str) -> String {
    let mut out = String::new();
    for (index, ch) in value.chars().enumerate() {
        if ch.is_ascii_uppercase() && index > 0 {
            out.push('_');
        }
        out.push(ch.to_ascii_lowercase());
    }
    out
}

fn hex(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        write!(out, "{byte:02x}").unwrap();
    }
    out
}

fn vo_byte_array(bytes: &[u8; 32]) -> String {
    let mut output = String::from("[32]byte{");
    for (index, byte) in bytes.iter().enumerate() {
        if index > 0 {
            output.push_str(", ");
        }
        write!(output, "{byte}").unwrap();
    }
    output.push('}');
    output
}

fn field_error(
    source_path: &str,
    source: &str,
    field: &str,
    code: &'static str,
    stage: &'static str,
    message: &str,
) -> GeneratorDiagnostic {
    diagnostic(
        code,
        stage,
        source_path,
        field_span(source, field),
        message.to_string(),
    )
}

fn field_span(source: &str, field: &str) -> Range<usize> {
    source
        .find(field)
        .map(|start| start..start + field.len())
        .unwrap_or(0..source.len().min(1))
}

fn diagnostic(
    code: &'static str,
    stage: &'static str,
    source_path: &str,
    span: Range<usize>,
    message: String,
) -> GeneratorDiagnostic {
    GeneratorDiagnostic {
        code,
        stage,
        source_path: source_path.to_string(),
        span,
        message,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const MINIMAL_SCHEMA: &str = r#"
format = 1
canonical_module = "example.com/acme/vogui-smoke"
package = "main"
app = "SmokeApp"
model = "SmokeModel"
message = "SmokeMessage"
init = "SmokeInit"
transaction_mode = "immutable_value"
supports_neutral_snapshot = true
supports_migration = false

[limits]
max_init_bytes = 65536
max_model_bytes = 4194304
max_message_bytes = 262144
max_effects_per_update = 128
max_subscriptions = 256

[methods]
init = "InitApp"
update = "UpdateApp"
view = "ViewApp"
subscriptions = "BuildSubscriptions"
on_error = "OnAppError"

[[init_field]]
name = "Greeting"
type = "string"

[[model_field]]
name = "Count"
type = "uint64"

[[message_field]]
name = "Kind"
type = "uint32"
"#;

    #[test]
    fn ordinary_module_generation_is_deterministic_and_package_local() {
        let first = generate(
            "app.schema.toml",
            MINIMAL_SCHEMA,
            "0.1.4",
            "aarch64-apple-darwin",
            &[],
        )
        .unwrap();
        let second = generate(
            "app.schema.toml",
            MINIMAL_SCHEMA,
            "0.1.4",
            "aarch64-apple-darwin",
            &[],
        )
        .unwrap();

        assert_eq!(first, second);
        assert_eq!(first.output.artifacts[0].path, "smoke_app_app.vo");
        assert_eq!(
            first.output.artifacts[1].path,
            "generated/smoke_app_app.manifest"
        );
        let source = std::str::from_utf8(&first.output.artifacts[0].bytes).unwrap();
        assert!(source.contains("func (builder *SmokeAppGeneratedViewBuilder) Style("));
        assert!(source.contains("builder.Records = append(builder.Records, byte(7))"));
        assert!(source.contains("func (builder *SmokeAppGeneratedViewBuilder) Theme("));
        assert!(source.contains("builder.Records = append(builder.Records, byte(8))"));
        assert!(source.contains("\t_ = model"));
        assert!(source.contains("func __VoguiRunSmokeApp("));
    }

    #[test]
    fn invalid_module_path_keeps_governed_diagnostic_identity() {
        let invalid =
            MINIMAL_SCHEMA.replace("example.com/acme/vogui-smoke", "example.com//vogui-smoke");
        let diagnostics = generate(
            "broken.schema.toml",
            &invalid,
            "0.1.4",
            "aarch64-apple-darwin",
            &[],
        )
        .unwrap_err();

        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].code, "VOGUI-GEN-003");
        assert_eq!(diagnostics[0].stage, "validate");
        assert_eq!(diagnostics[0].source_path, "broken.schema.toml");
    }
}
