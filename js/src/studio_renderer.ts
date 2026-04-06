// VoGUI Studio Renderer — self-contained RendererModule for render-island integration.
// Loaded by Studio via blob URL from VFS snapshot. Zero static Studio dependencies.
//
// Contract: { init, render, stop }

import { decodeBinaryRender } from './decoder';
import { render as renderGui } from './renderer';
import { injectStyles } from './styles';
import { setupKeyHandler } from './events';
import { installAudioBridge } from './audio';
import { refRegistry } from './refs';
import type { RendererConfig } from './types';

// Expose ref registry globally so the host bridge (loaded as a separate blob module)
// can access DOM refs created by this renderer.
(globalThis as Record<string, unknown>).__voguiRefRegistry = refRegistry;

// Minimal host interface — the renderer only uses these two methods.
// Studio may pass an object with additional fields; they are ignored.
interface RendererHost {
  sendEvent(handlerId: number, payload: string): Promise<unknown>;
  log(message: string): void;
}

let host: RendererHost | null = null;
let cleanupKeyHandler: (() => void) | null = null;

function config(): RendererConfig {
  return {
    onEvent: (handlerId: number, payload: string) => {
      void host?.sendEvent(handlerId, payload);
    },
  };
}

export async function init(incoming: RendererHost): Promise<void> {
  host = incoming;
  injectStyles();
  installAudioBridge();
  cleanupKeyHandler = setupKeyHandler(config());
}

export function render(container: HTMLElement, bytes: Uint8Array): void {
  const message = decodeBinaryRender(bytes);
  renderGui(container, message, config());
}

export function stop(): void {
  cleanupKeyHandler?.();
  cleanupKeyHandler = null;
  host = null;
}
