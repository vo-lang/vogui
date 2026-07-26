// Local browser artifact loader for the Vogui workspace extension.
export const voProviderEntrypoints = Object.freeze([
  "vogui-accessibility-dom",
  "vogui-dom-renderer",
  "vogui-interaction-bridge",
]);

export async function instantiateVoProvider(source, imports = {}) {
  const bytes = source instanceof ArrayBuffer
    ? source
    : await (await fetch(
      source ?? new URL("vogui_extension_bg.wasm", import.meta.url),
    )).arrayBuffer();
  const result = await WebAssembly.instantiate(bytes, imports);
  return result.instance ?? result;
}
