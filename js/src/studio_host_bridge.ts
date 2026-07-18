// VoGUI Studio Host Bridge — WASM import entries for framework-specific host functions.
// Loaded by Studio via blob URL. Provides text-measurement host functions.
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

export function buildImports(
  ctx: HostBridgeContext,
): Record<string, (...args: number[]) => number | void> {
  return {
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
