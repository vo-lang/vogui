module = "github.com/vo-lang/vogui"
vo = "^0.1.0"

[extension]
name = "vogui"

[extension.native]
library = "vo_vogui"
targets = ["aarch64-apple-darwin", "x86_64-pc-windows-msvc", "x86_64-unknown-linux-gnu"]

[extension.wasm]
kind = "standalone"
wasm = "vogui.wasm"

[extension.web.js]
host_bridge = "js/dist/studio_host_bridge.js"
protocol = "js/dist/studio_protocol.js"
renderer = "js/dist/studio_renderer.js"

[build.native]
kind = "cargo"
manifest = "rust/ext/Cargo.toml"
package = "vogui"

[build.wasm]
wasm = "web-artifacts/vogui.wasm"
