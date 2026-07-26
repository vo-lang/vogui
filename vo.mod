format = 1
module = "github.com/vo-lang/vogui"
version = "0.1.0"
vo = "0.1.0"
default_profile = "web-full"

[capabilities.app]
packages = ["github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/effects", "github.com/vo-lang/vogui/vo/update"]

[capabilities.reconciler]

[capabilities.protocol]

[capabilities.semantics-core]

[capabilities.fake-renderer]

[capabilities.resource-core]
packages = ["github.com/vo-lang/vogui/vo/resources"]

[capabilities.router]
packages = ["github.com/vo-lang/vogui/vo/router"]

[capabilities.input]

[capabilities.text-ime]

[capabilities.browser-host]
targets = ["wasm32-unknown-unknown"]

[capabilities.portable-layout]
packages = ["github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/style"]

[capabilities.portable-controls]
requires = ["portable-layout"]

[capabilities.dom-renderer]

[capabilities.retained-gpu-renderer]
targets = ["aarch64-apple-darwin"]

[capabilities.browser-accessibility]

[capabilities.native-accessibility]
targets = ["aarch64-apple-darwin"]

[capabilities.native-webview-host]
requires = ["dom-renderer"]
targets = ["aarch64-apple-darwin"]

[capabilities.gpu-native-host]
requires = ["retained-gpu-renderer"]
targets = ["aarch64-apple-darwin"]

[capabilities.animation]
packages = ["github.com/vo-lang/vogui/vo/animation"]

[capabilities.resource-watch]

[capabilities.advanced-resource-formats]

[capabilities.virtual-collection]

[capabilities.inspection]

[capabilities.editor-widgets]
requires = ["portable-controls"]
packages = ["github.com/vo-lang/vogui/vo/canvas"]

[capabilities.transparent-surface]

[capabilities.dom-unsafe]
requires = ["dom-renderer"]
packages = ["github.com/vo-lang/vogui/vo/domunsafe"]

[profiles.headless]
capabilities = ["app", "fake-renderer", "protocol", "reconciler", "semantics-core"]

[profiles.web-minimal]
capabilities = ["app", "browser-host", "dom-renderer", "input", "portable-layout", "protocol", "reconciler", "resource-core", "semantics-core", "text-ime"]

[profiles.web-full]
extends = "web-minimal"
capabilities = ["advanced-resource-formats", "animation", "browser-accessibility", "portable-controls", "resource-watch", "router"]

[profiles.web-editor]
extends = "web-full"
capabilities = ["editor-widgets", "inspection", "virtual-collection"]

[profiles.native-webview-minimal]
capabilities = ["app", "dom-renderer", "input", "native-webview-host", "portable-layout", "protocol", "reconciler", "resource-core", "semantics-core", "text-ime"]

[profiles.native-webview-full]
extends = "native-webview-minimal"
capabilities = ["advanced-resource-formats", "animation", "browser-accessibility", "portable-controls", "resource-watch", "router"]

[profiles.native-webview-editor]
extends = "native-webview-full"
capabilities = ["editor-widgets", "inspection", "virtual-collection"]

[profiles.native-gpu-minimal]
capabilities = ["app", "gpu-native-host", "input", "native-accessibility", "portable-layout", "protocol", "reconciler", "resource-core", "retained-gpu-renderer", "semantics-core", "text-ime"]

[profiles.native-gpu-full]
extends = "native-gpu-minimal"
capabilities = ["advanced-resource-formats", "animation", "portable-controls", "resource-watch", "router"]

[profiles.native-gpu-editor]
extends = "native-gpu-full"
capabilities = ["editor-widgets", "inspection", "virtual-collection"]

[profiles.web-overlay-minimal]
extends = "web-minimal"
capabilities = ["transparent-surface"]

[profiles.native-webview-overlay-minimal]
extends = "native-webview-minimal"
capabilities = ["transparent-surface"]

[profiles.native-gpu-overlay-minimal]
extends = "native-gpu-minimal"
capabilities = ["transparent-surface"]

[extension]
name = "vogui"

[extension.wasm]
kind = "standalone"
wasm = "vogui_extension_bg.wasm"

[build.wasm]
wasm = "rust/pkg-web/vogui_extension_bg.wasm"

[extension.web]
provider_role = "ui-logic"
provider_roles = ["ui-logic", "ui-renderer", "surface-host", "accessibility", "diagnostics"]
capabilities = ["app_surface", "framework_lane", "vogui.run-entry", "vogui.target-commit", "vogui.target-init", "vogui.target-next-turn"]

[extension.web.js]
logic = "js/src/logic_provider.ts"
protocol = "protocol/generated/vogui_protocol.ts"
renderer = "js/src/studio_renderer.ts"

[[extension.source_recipes]]
derive = true
capabilities = ["app", "fake-renderer", "protocol", "reconciler", "semantics-core"]
target = "aarch64-apple-darwin"
toolchain = "0.1.4"
schema_inputs = ["vogui-app-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2"]
vo_packages = ["github.com/vo-lang/vogui/vo/core"]
cargo_features = ["crate:vogui-headless-renderer", "crate:vogui-protocol", "crate:vogui-runtime"]
role_outputs = [
  { role = "ui-logic", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "ui-renderer", kind = "extension-native", name = "libvogui_extension.dylib" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["app", "dom-renderer", "input", "native-webview-host", "portable-layout", "protocol", "reconciler", "resource-core", "semantics-core", "text-ime"]
target = "aarch64-apple-darwin"
toolchain = "0.1.4"
schema_inputs = ["vogui-app-protocol-v1", "vogui-dom-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources"]
cargo_features = ["crate:vo-app-host-native", "crate:vogui-protocol", "crate:vogui-runtime"]
js_entrypoints = ["vogui-dom-renderer", "vogui-interaction-bridge"]
role_outputs = [
  { role = "ui-logic", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "ui-renderer", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "surface-host", kind = "extension-native", name = "libvogui_extension.dylib" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["advanced-resource-formats", "animation", "app", "browser-accessibility", "dom-renderer", "input", "native-webview-host", "portable-controls", "portable-layout", "protocol", "reconciler", "resource-core", "resource-watch", "router", "semantics-core", "text-ime"]
target = "aarch64-apple-darwin"
toolchain = "0.1.4"
schema_inputs = ["vogui-accessibility-protocol-v1", "vogui-app-protocol-v1", "vogui-dom-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/animation", "github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources", "github.com/vo-lang/vogui/vo/router"]
cargo_features = ["crate:vo-app-host-native", "crate:vogui-protocol", "crate:vogui-runtime"]
js_entrypoints = ["vogui-accessibility-dom", "vogui-dom-renderer", "vogui-interaction-bridge"]
role_outputs = [
  { role = "ui-logic", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "ui-renderer", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "surface-host", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "accessibility", kind = "extension-native", name = "libvogui_extension.dylib" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["advanced-resource-formats", "animation", "app", "browser-accessibility", "dom-renderer", "editor-widgets", "input", "inspection", "native-webview-host", "portable-controls", "portable-layout", "protocol", "reconciler", "resource-core", "resource-watch", "router", "semantics-core", "text-ime", "virtual-collection"]
target = "aarch64-apple-darwin"
toolchain = "0.1.4"
schema_inputs = ["vogui-accessibility-protocol-v1", "vogui-app-protocol-v1", "vogui-dom-protocol-v1", "vogui-inspection-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/animation", "github.com/vo-lang/vogui/vo/canvas", "github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources", "github.com/vo-lang/vogui/vo/router"]
cargo_features = ["crate:vo-app-host-native", "crate:vogui-inspection", "crate:vogui-protocol", "crate:vogui-runtime"]
js_entrypoints = ["vogui-accessibility-dom", "vogui-dom-renderer", "vogui-editor-widgets", "vogui-interaction-bridge"]
role_outputs = [
  { role = "ui-logic", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "ui-renderer", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "surface-host", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "accessibility", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "diagnostics", kind = "extension-native", name = "libvogui_extension.dylib" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["app", "gpu-native-host", "input", "native-accessibility", "portable-layout", "protocol", "reconciler", "resource-core", "retained-gpu-renderer", "semantics-core", "text-ime"]
target = "aarch64-apple-darwin"
toolchain = "0.1.4"
schema_inputs = ["vogui-accessibility-protocol-v1", "vogui-app-protocol-v1", "vogui-provider-protocol-v1", "vogui-render-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-render-abi-v1", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources"]
cargo_features = ["crate:vo-app-host-native", "crate:vogui-layout", "crate:vogui-native-accessibility", "crate:vogui-native-renderer", "crate:vogui-protocol", "crate:vogui-runtime", "crate:vogui-text"]
role_outputs = [
  { role = "ui-logic", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "ui-renderer", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "surface-host", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "accessibility", kind = "extension-native", name = "libvogui_extension.dylib" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["advanced-resource-formats", "animation", "app", "gpu-native-host", "input", "native-accessibility", "portable-controls", "portable-layout", "protocol", "reconciler", "resource-core", "resource-watch", "retained-gpu-renderer", "router", "semantics-core", "text-ime"]
target = "aarch64-apple-darwin"
toolchain = "0.1.4"
schema_inputs = ["vogui-accessibility-protocol-v1", "vogui-app-protocol-v1", "vogui-provider-protocol-v1", "vogui-render-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-render-abi-v1", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/animation", "github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources", "github.com/vo-lang/vogui/vo/router"]
cargo_features = ["crate:vo-app-host-native", "crate:vogui-layout", "crate:vogui-native-accessibility", "crate:vogui-native-renderer", "crate:vogui-protocol", "crate:vogui-runtime", "crate:vogui-text"]
role_outputs = [
  { role = "ui-logic", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "ui-renderer", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "surface-host", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "accessibility", kind = "extension-native", name = "libvogui_extension.dylib" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["advanced-resource-formats", "animation", "app", "editor-widgets", "gpu-native-host", "input", "inspection", "native-accessibility", "portable-controls", "portable-layout", "protocol", "reconciler", "resource-core", "resource-watch", "retained-gpu-renderer", "router", "semantics-core", "text-ime", "virtual-collection"]
target = "aarch64-apple-darwin"
toolchain = "0.1.4"
schema_inputs = ["vogui-accessibility-protocol-v1", "vogui-app-protocol-v1", "vogui-inspection-protocol-v1", "vogui-provider-protocol-v1", "vogui-render-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-render-abi-v1", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/animation", "github.com/vo-lang/vogui/vo/canvas", "github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources", "github.com/vo-lang/vogui/vo/router"]
cargo_features = ["crate:vo-app-host-native", "crate:vogui-inspection", "crate:vogui-layout", "crate:vogui-native-accessibility", "crate:vogui-native-renderer", "crate:vogui-protocol", "crate:vogui-runtime", "crate:vogui-text"]
role_outputs = [
  { role = "ui-logic", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "ui-renderer", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "surface-host", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "accessibility", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "diagnostics", kind = "extension-native", name = "libvogui_extension.dylib" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["app", "dom-renderer", "input", "native-webview-host", "portable-layout", "protocol", "reconciler", "resource-core", "semantics-core", "text-ime", "transparent-surface"]
target = "aarch64-apple-darwin"
toolchain = "0.1.4"
schema_inputs = ["vogui-app-protocol-v1", "vogui-dom-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources"]
cargo_features = ["crate:vo-app-host-native", "crate:vogui-protocol", "crate:vogui-runtime"]
js_entrypoints = ["vogui-dom-renderer", "vogui-interaction-bridge"]
role_outputs = [
  { role = "ui-logic", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "ui-renderer", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "surface-host", kind = "extension-native", name = "libvogui_extension.dylib" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["app", "gpu-native-host", "input", "native-accessibility", "portable-layout", "protocol", "reconciler", "resource-core", "retained-gpu-renderer", "semantics-core", "text-ime", "transparent-surface"]
target = "aarch64-apple-darwin"
toolchain = "0.1.4"
schema_inputs = ["vogui-accessibility-protocol-v1", "vogui-app-protocol-v1", "vogui-provider-protocol-v1", "vogui-render-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-render-abi-v1", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources"]
cargo_features = ["crate:vo-app-host-native", "crate:vogui-layout", "crate:vogui-native-accessibility", "crate:vogui-native-renderer", "crate:vogui-protocol", "crate:vogui-runtime", "crate:vogui-text"]
role_outputs = [
  { role = "ui-logic", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "ui-renderer", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "surface-host", kind = "extension-native", name = "libvogui_extension.dylib" },
  { role = "accessibility", kind = "extension-native", name = "libvogui_extension.dylib" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["app", "fake-renderer", "protocol", "reconciler", "semantics-core"]
target = "wasm32-unknown-unknown"
toolchain = "0.1.4"
schema_inputs = ["vogui-app-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2"]
vo_packages = ["github.com/vo-lang/vogui/vo/core"]
cargo_features = ["crate:vogui-headless-renderer", "crate:vogui-protocol", "crate:vogui-runtime"]
role_outputs = [
  { role = "ui-logic", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-logic", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "ui-renderer", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-renderer", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["app", "browser-host", "dom-renderer", "input", "portable-layout", "protocol", "reconciler", "resource-core", "semantics-core", "text-ime"]
target = "wasm32-unknown-unknown"
toolchain = "0.1.4"
schema_inputs = ["vogui-app-protocol-v1", "vogui-dom-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources"]
cargo_features = ["crate:vogui-protocol", "crate:vogui-runtime"]
js_entrypoints = ["vogui-dom-renderer", "vogui-interaction-bridge"]
role_outputs = [
  { role = "ui-logic", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-logic", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "ui-renderer", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-renderer", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "surface-host", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "surface-host", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["advanced-resource-formats", "animation", "app", "browser-accessibility", "browser-host", "dom-renderer", "input", "portable-controls", "portable-layout", "protocol", "reconciler", "resource-core", "resource-watch", "router", "semantics-core", "text-ime"]
target = "wasm32-unknown-unknown"
toolchain = "0.1.4"
schema_inputs = ["vogui-accessibility-protocol-v1", "vogui-app-protocol-v1", "vogui-dom-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/animation", "github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources", "github.com/vo-lang/vogui/vo/router"]
cargo_features = ["crate:vogui-protocol", "crate:vogui-runtime"]
js_entrypoints = ["vogui-accessibility-dom", "vogui-dom-renderer", "vogui-interaction-bridge"]
role_outputs = [
  { role = "ui-logic", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-logic", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "ui-renderer", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-renderer", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "surface-host", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "surface-host", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "accessibility", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "accessibility", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["advanced-resource-formats", "animation", "app", "browser-accessibility", "browser-host", "dom-renderer", "editor-widgets", "input", "inspection", "portable-controls", "portable-layout", "protocol", "reconciler", "resource-core", "resource-watch", "router", "semantics-core", "text-ime", "virtual-collection"]
target = "wasm32-unknown-unknown"
toolchain = "0.1.4"
schema_inputs = ["vogui-accessibility-protocol-v1", "vogui-app-protocol-v1", "vogui-dom-protocol-v1", "vogui-inspection-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/animation", "github.com/vo-lang/vogui/vo/canvas", "github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources", "github.com/vo-lang/vogui/vo/router"]
cargo_features = ["crate:vogui-inspection", "crate:vogui-protocol", "crate:vogui-runtime"]
js_entrypoints = ["vogui-accessibility-dom", "vogui-dom-renderer", "vogui-editor-widgets", "vogui-interaction-bridge"]
role_outputs = [
  { role = "ui-logic", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-logic", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "ui-renderer", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-renderer", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "surface-host", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "surface-host", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "accessibility", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "accessibility", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "diagnostics", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "diagnostics", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
]

[[extension.source_recipes]]
derive = true
capabilities = ["app", "browser-host", "dom-renderer", "input", "portable-layout", "protocol", "reconciler", "resource-core", "semantics-core", "text-ime", "transparent-surface"]
target = "wasm32-unknown-unknown"
toolchain = "0.1.4"
schema_inputs = ["vogui-app-protocol-v1", "vogui-dom-protocol-v1", "vogui-provider-protocol-v1"]
abi_inputs = ["vogui-provider-abi-v2", "vogui-surface-abi-v1"]
vo_packages = ["github.com/vo-lang/vogui/vo/controls", "github.com/vo-lang/vogui/vo/core", "github.com/vo-lang/vogui/vo/resources"]
cargo_features = ["crate:vogui-protocol", "crate:vogui-runtime"]
js_entrypoints = ["vogui-dom-renderer", "vogui-interaction-bridge"]
role_outputs = [
  { role = "ui-logic", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-logic", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "ui-renderer", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "ui-renderer", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
  { role = "surface-host", kind = "extension-js-glue", name = "vogui_extension.js" },
  { role = "surface-host", kind = "extension-wasm", name = "vogui_extension_bg.wasm" },
]

[[extension.generator]]
name = "vogui.typed-app"
version = "4"
schema_kind = "vogui.app"

[extension.generator.artifacts]
"aarch64-apple-darwin" = "vogui-generator-provider"
"x86_64-apple-darwin" = "vogui-generator-provider"
"aarch64-unknown-linux-gnu" = "vogui-generator-provider"
"x86_64-unknown-linux-gnu" = "vogui-generator-provider"
"x86_64-pc-windows-msvc" = "vogui-generator-provider.exe"
