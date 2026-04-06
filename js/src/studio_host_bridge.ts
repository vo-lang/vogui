// VoGUI Studio Host Bridge — WASM import entries for framework-specific host functions.
// Loaded by Studio via blob URL. Provides DOM ref access, text measurement, etc.
//
// The renderer module (studio_renderer.ts) exposes its ref registry on
// globalThis.__voguiRefRegistry. This bridge reads from that shared global.
//
// Contract: { buildImports }

import { measureText, measureTextLines } from './text';

// Context provided by Studio when building WASM imports.
// Abstracts over WASM memory access so this module never touches WebAssembly.Memory directly.
interface HostBridgeContext {
  readString(ptr: number, len: number): string;
  alloc(size: number): number;
  writeBytes(destPtr: number, bytes: Uint8Array): void;
  writeU32(ptr: number, value: number): void;
}

function getRef(name: string): HTMLElement | undefined {
  const registry = (globalThis as Record<string, unknown>).__voguiRefRegistry as
    | Map<string, HTMLElement>
    | undefined;
  return registry?.get(name);
}

export function buildImports(
  ctx: HostBridgeContext,
): Record<string, (...args: number[]) => number | void> {
  return {
    host_focus(ptr: number, len: number): void {
      const el = getRef(ctx.readString(ptr, len));
      if (el instanceof HTMLElement) el.focus();
    },

    host_blur(ptr: number, len: number): void {
      const el = getRef(ctx.readString(ptr, len));
      if (el instanceof HTMLElement) el.blur();
    },

    host_scroll_to(ptr: number, len: number, top: number): void {
      getRef(ctx.readString(ptr, len))?.scrollTo({ top });
    },

    host_scroll_into_view(ptr: number, len: number): void {
      getRef(ctx.readString(ptr, len))?.scrollIntoView();
    },

    host_select_text(ptr: number, len: number): void {
      const el = getRef(ctx.readString(ptr, len));
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.select();
    },

    host_measure_text(
      textPtr: number,
      textLen: number,
      fontPtr: number,
      fontLen: number,
      maxWidth: number,
      lineHeight: number,
      whiteSpace: number,
      outLenPtr: number,
    ): number {
      const text = ctx.readString(textPtr, textLen);
      const font = ctx.readString(fontPtr, fontLen);
      const result = measureText(text, font, maxWidth, lineHeight, whiteSpace);
      const destPtr = ctx.alloc(result.length);
      ctx.writeBytes(destPtr, result);
      ctx.writeU32(outLenPtr, result.length);
      return destPtr;
    },

    host_measure_text_lines(
      textPtr: number,
      textLen: number,
      fontPtr: number,
      fontLen: number,
      maxWidth: number,
      lineHeight: number,
      whiteSpace: number,
      outLenPtr: number,
    ): number {
      const text = ctx.readString(textPtr, textLen);
      const font = ctx.readString(fontPtr, fontLen);
      const result = measureTextLines(text, font, maxWidth, lineHeight, whiteSpace);
      const destPtr = ctx.alloc(result.length);
      ctx.writeBytes(destPtr, result);
      ctx.writeU32(outLenPtr, result.length);
      return destPtr;
    },
  };
}
