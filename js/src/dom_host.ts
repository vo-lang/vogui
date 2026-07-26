import {
  DomRenderer,
  type DomApplyResult,
  type DomCommand,
  type DomMountMode,
  type DomPatchBatch,
  type DomRendererIdentity,
  type DomRendererLimits,
  type DomReturn,
  type Handle,
} from "./dom_renderer.js";
import {
  BrowserInteractionBridge,
  type InteractionBridgeLimits,
} from "./interaction_bridge.js";
import {
  DomReturnLane,
  type DomReturnLaneLimits,
} from "./ui_return_lane.js";

export interface BrowserDomRootConfig {
  readonly host: HTMLElement;
  readonly mode: DomMountMode;
  readonly identity: DomRendererIdentity;
  readonly rendererLimits: DomRendererLimits;
  readonly returnLimits: DomReturnLaneLimits;
  readonly interactionLimits: InteractionBridgeLimits;
  readonly onReturnAvailable?: () => void;
}

export interface BrowserDomRoot {
  readonly identity: DomRendererIdentity;
  readonly renderer: DomRenderer;
  readonly returns: DomReturnLane;
  readonly interaction: BrowserInteractionBridge;
}

interface OwnedRoot extends BrowserDomRoot {
  readonly host: HTMLElement;
}

export class BrowserDomHost {
  readonly #roots = new Map<string, OwnedRoot>();
  #closed = false;

  attachRoot(config: BrowserDomRootConfig): BrowserDomRoot {
    this.#assertOpen();
    const rootKey = handleKey(config.identity.root);
    if (this.#roots.has(rootKey)) throw new Error("DOM root already attached");
    const returns = new DomReturnLane(config.returnLimits, () => {
      config.host.setAttribute("data-vogui-overflow", "true");
      config.host.style.pointerEvents = "none";
    });
    const renderer = new DomRenderer(
      config.host,
      config.mode,
      config.identity,
      config.rendererLimits,
      (item) => {
        const admission = returns.enqueue(item);
        if (admission === "overflow" || admission === "closed") {
          config.host.setAttribute("data-vogui-return-unavailable", "true");
          config.host.style.pointerEvents = "none";
          return;
        }
        config.onReturnAvailable?.();
      },
    );
    const interaction = new BrowserInteractionBridge(
      config.identity.session,
      config.interactionLimits,
    );
    const owned: OwnedRoot = {
      host: config.host,
      identity: config.identity,
      renderer,
      returns,
      interaction,
    };
    this.#roots.set(rootKey, owned);
    return owned;
  }

  apply(root: Handle, batch: DomPatchBatch): DomApplyResult {
    return this.#root(root).renderer.apply(batch);
  }

  submitCommand(root: Handle, command: DomCommand): void {
    this.#root(root).renderer.submitCommand(command);
  }

  pollReturn(root: Handle): DomReturn | undefined {
    return this.#root(root).returns.poll();
  }

  drainReturns(root: Handle): DomReturn[] {
    return this.#root(root).returns.drain();
  }

  interaction(root: Handle): BrowserInteractionBridge {
    return this.#root(root).interaction;
  }

  detachRoot(root: Handle): DomReturn[] {
    const key = handleKey(root);
    const owned = this.#roots.get(key);
    if (owned === undefined) throw new Error("unknown DOM root");
    owned.renderer.close();
    owned.interaction.close();
    const terminal = owned.returns.drain();
    owned.returns.close();
    owned.host.removeAttribute("data-vogui-overflow");
    owned.host.removeAttribute("data-vogui-return-unavailable");
    owned.host.removeAttribute("data-vogui-poisoned");
    owned.host.style.pointerEvents = "";
    owned.host.hidden = false;
    this.#roots.delete(key);
    return terminal;
  }

  close(): Map<string, DomReturn[]> {
    if (this.#closed) return new Map();
    const terminal = new Map<string, DomReturn[]>();
    for (const root of [...this.#roots.values()]) {
      terminal.set(handleKey(root.identity.root), this.detachRoot(root.identity.root));
    }
    this.#closed = true;
    return terminal;
  }

  #root(root: Handle): OwnedRoot {
    this.#assertOpen();
    const owned = this.#roots.get(handleKey(root));
    if (owned === undefined) throw new Error("unknown DOM root");
    return owned;
  }

  #assertOpen(): void {
    if (this.#closed) throw new Error("DOM host closed");
  }
}

function handleKey(handle: Handle): string {
  if (
    !Number.isSafeInteger(handle.index) ||
    handle.index < 0 ||
    handle.index > 0xffff_ffff ||
    !Number.isSafeInteger(handle.generation) ||
    handle.generation <= 0 ||
    handle.generation > 0xffff_ffff
  ) {
    throw new Error("invalid handle");
  }
  return `${handle.index}:${handle.generation}`;
}
