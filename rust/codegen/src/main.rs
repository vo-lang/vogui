use std::env;
use std::ffi::OsString;
use std::fs;
use std::io::Write as _;
use std::path::{Path, PathBuf};
use std::process;

fn main() {
    process::exit(run(env::args_os().skip(1).collect()));
}

fn run(args: Vec<OsString>) -> i32 {
    if args.len() == 1 && args[0] == "describe" {
        println!("protocol=vo.generator-provider/1");
        println!("name={}", vogui_codegen::GENERATOR_NAME);
        println!("version={}", vogui_codegen::GENERATOR_VERSION);
        println!("schema_kind={}", vogui_codegen::SCHEMA_KIND);
        return 0;
    }
    let options = match Options::parse(args) {
        Ok(options) => options,
        Err(error) => {
            eprintln!("[VOGUI-GEN-CLI-001] {error}");
            print_usage();
            return 2;
        }
    };
    let source = match fs::read_to_string(&options.schema) {
        Ok(source) => source,
        Err(error) => {
            eprintln!(
                "[VOGUI-GEN-CLI-002] failed to read {}: {error}",
                options.schema.display()
            );
            return 1;
        }
    };
    let source_path = options.schema.to_string_lossy();
    let generated = match vogui_codegen::generate(
        &source_path,
        &source,
        &options.toolchain,
        &options.target,
        &options.capabilities,
    ) {
        Ok(generated) => generated,
        Err(diagnostics) => {
            for diagnostic in diagnostics {
                eprintln!("{diagnostic}");
            }
            return 1;
        }
    };
    for artifact in &generated.output.artifacts {
        let destination = options.output_root.join(&artifact.path);
        if let Err(error) = write_atomically(&destination, &artifact.bytes) {
            eprintln!(
                "[VOGUI-GEN-CLI-003] failed to write {}: {error}",
                destination.display()
            );
            return 1;
        }
        println!(
            "artifact\t{}\t{}",
            artifact.path,
            hex(&artifact.content_digest)
        );
    }
    println!("cache-key\t{}", hex(&generated.output.cache_key));
    println!(
        "schema-fingerprint\t{}",
        hex(&generated.output.schema_fingerprint)
    );
    0
}

fn print_usage() {
    eprintln!(
        "usage: vogui-generator-provider generate --schema PATH --output-root PATH \
         --toolchain VERSION --target TRIPLE [--capability NAME]..."
    );
}

struct Options {
    schema: PathBuf,
    output_root: PathBuf,
    toolchain: String,
    target: String,
    capabilities: Vec<String>,
}

impl Options {
    fn parse(args: Vec<OsString>) -> Result<Self, String> {
        if args.first().is_none_or(|arg| arg != "generate") {
            return Err("expected `describe` or `generate`".to_string());
        }
        let mut schema = None;
        let mut output_root = None;
        let mut toolchain = None;
        let mut target = None;
        let mut capabilities = Vec::new();
        let mut index = 1;
        while index < args.len() {
            let key = args[index]
                .to_str()
                .ok_or_else(|| "option name must be UTF-8".to_string())?;
            let value = args
                .get(index + 1)
                .ok_or_else(|| format!("{key} requires a value"))?;
            match key {
                "--schema" => schema = Some(PathBuf::from(value)),
                "--output-root" => output_root = Some(PathBuf::from(value)),
                "--toolchain" => {
                    toolchain = Some(
                        value
                            .to_str()
                            .ok_or_else(|| "toolchain must be UTF-8".to_string())?
                            .to_string(),
                    )
                }
                "--target" => {
                    target = Some(
                        value
                            .to_str()
                            .ok_or_else(|| "target must be UTF-8".to_string())?
                            .to_string(),
                    )
                }
                "--capability" => capabilities.push(
                    value
                        .to_str()
                        .ok_or_else(|| "capability must be UTF-8".to_string())?
                        .to_string(),
                ),
                other => return Err(format!("unknown option {other}")),
            }
            index += 2;
        }
        capabilities.sort();
        capabilities.dedup();
        Ok(Self {
            schema: schema.ok_or_else(|| "missing --schema".to_string())?,
            output_root: output_root.ok_or_else(|| "missing --output-root".to_string())?,
            toolchain: toolchain.ok_or_else(|| "missing --toolchain".to_string())?,
            target: target.ok_or_else(|| "missing --target".to_string())?,
            capabilities,
        })
    }
}

fn write_atomically(path: &Path, bytes: &[u8]) -> std::io::Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| std::io::Error::other("output path has no parent"))?;
    fs::create_dir_all(parent)?;
    let file_name = path
        .file_name()
        .ok_or_else(|| std::io::Error::other("output path has no file name"))?;
    let temporary = parent.join(format!(
        ".{}.tmp-{}",
        file_name.to_string_lossy(),
        process::id()
    ));
    let mut file = fs::OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary)?;
    if let Err(error) = file.write_all(bytes).and_then(|()| file.sync_all()) {
        let _ = fs::remove_file(&temporary);
        return Err(error);
    }
    if let Err(error) = fs::rename(&temporary, path) {
        let _ = fs::remove_file(&temporary);
        return Err(error);
    }
    Ok(())
}

fn hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut output = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        output.push(char::from(HEX[(byte >> 4) as usize]));
        output.push(char::from(HEX[(byte & 0x0f) as usize]));
    }
    output
}
