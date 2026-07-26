import {
  MessageKind,
  decodeFrameworkPacket,
  encodeFrameworkPacket,
  type FrameworkPacketHeader,
} from "../../protocol/generated/vogui_protocol.js";
import {
  BrowserDomHost,
  type BrowserDomRoot,
} from "./dom_host.js";
import type { Handle } from "./dom_renderer.js";
import {
  DEFAULT_DOM_RENDERER_LIMITS,
  decodeUiTransaction,
} from "./transaction_codec.js";
import { encodeDomReturn } from "./return_codec.js";
import { decodeDomCommand } from "./command_codec.js";
import {
  decodeResourcePublication,
  decodeResourceRetire,
} from "./resource_codec.js";

interface StudioFrameworkLane {
  readonly binding: {
    readonly session: Handle;
    readonly sessionEpoch: number;
  };
  poll(): Promise<Uint8Array | null>;
  submit(payload: Uint8Array, requestId?: bigint): Promise<void>;
  close(): void;
}

interface FrameworkLaneCapability {
  open(role?: string): Promise<StudioFrameworkLane>;
}

interface AppSurfaceIdentity {
  readonly sessionId: number;
  readonly session: Handle;
  readonly sessionEpoch: bigint;
  readonly window: Handle;
  readonly view: Handle;
  readonly surface: Handle;
}

interface AppSurfaceLease {
  readonly descriptor: { readonly identity: AppSurfaceIdentity };
  readonly element: HTMLDivElement | HTMLCanvasElement;
  release(): void;
}

interface AppSurfaceCapability {
  readonly sessionId: number;
  resolve(surface: Handle): Promise<Readonly<{
    session: Handle;
    sessionEpoch: bigint;
    window: Handle;
    view: Handle;
    surface: Handle;
    kind: "game" | "ui" | "diagnostics";
    zOrder: number;
    inputPolicy: "observe" | "passthrough" | "interactive" | "exclusive";
  }>>;
  attach(descriptor: {
    readonly identity: AppSurfaceIdentity;
    readonly kind: "dom";
    readonly layer: number;
    readonly input: "opaque" | "transparent" | "passthrough";
    readonly label: string;
  }): AppSurfaceLease;
  publishHitRegions(
    identity: AppSurfaceIdentity,
    revision: bigint,
    regions: readonly Readonly<{
      xMilli: number;
      yMilli: number;
      widthMilli: number;
      heightMilli: number;
      input: "opaque" | "transparent";
    }>[],
  ): void;
  setLowerInputSuspended(identity: AppSurfaceIdentity, suspended: boolean): void;
}

interface StudioRendererHost {
  readonly framework: Readonly<{
    name: string;
    roles: readonly string[];
  }>;
  log(message: string): void;
  reportError(message: string): void;
  getCapability(name: "framework_lane"): FrameworkLaneCapability | null;
  getCapability(name: "app_surface"): AppSurfaceCapability | null;
}

interface RootRecord {
  readonly root: Handle;
  readonly element: HTMLDivElement;
  readonly owned: BrowserDomRoot;
  nextReturnSequence: bigint;
  nextHitRegionRevision: bigint;
  lowerInputSuspended: boolean;
  readonly resizeObserver: ResizeObserver;
  readonly abort: AbortController;
}

const RETURN_LIMITS = Object.freeze({
  maxItems: 4096,
  maxBytes: 4 * 1024 * 1024,
});
const INTERACTION_LIMITS = Object.freeze({
  maxMimeItems: 128,
  maxMimeBytes: 4 * 1024 * 1024,
  maxInlineBytes: 1024 * 1024,
  maxOpenFiles: 128,
  maxPendingRequests: 256,
  maxChunkBytes: 1024 * 1024,
});

class VoguiStudioRenderer {
  #host: StudioRendererHost | null = null;
  #dom = new BrowserDomHost();
  #roots = new Map<string, RootRecord>();
  #surfaceLeases = new Map<string, AppSurfaceLease>();
  #rendererGeneration: Handle = { index: 0, generation: 1 };
  #container: HTMLElement | null = null;
  #lane: StudioFrameworkLane | null = null;
  #surfaceCapability: AppSurfaceCapability | null = null;
  #polling = false;
  #returnInFlight = false;
  #retryReturn: { readonly root: RootRecord; readonly packet: Uint8Array } | null = null;
  #retryTimer: ReturnType<typeof setTimeout> | null = null;

  async init(host: StudioRendererHost): Promise<void> {
    if (this.#host !== null) throw new Error("Vogui renderer already initialized");
    if (!host.framework.roles.includes("renderer")) {
      throw new Error("Vogui renderer module was loaded without the renderer role");
    }
    const laneCapability = host.getCapability("framework_lane");
    const surfaceCapability = host.getCapability("app_surface");
    if (laneCapability === null || surfaceCapability === null) {
      throw new Error("Vogui renderer requires framework_lane and app_surface");
    }
    const lane = await laneCapability.open("ui-renderer");
    this.#host = host;
    this.#lane = lane;
    this.#surfaceCapability = surfaceCapability;
    this.#polling = true;
    void this.#pollFrameworkLane(host, lane);
    host.log(`Vogui DOM renderer ready for ${host.framework.name}`);
  }

  async render(container: HTMLElement, bytes: Uint8Array): Promise<void> {
    const host = this.#requireHost();
    try {
      if (this.#container !== null && this.#container !== container) {
        this.#resetRoots();
      }
      this.#container = container;
      if (bytes.byteLength !== 0) await this.#applyPacket(container, bytes);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      host.reportError(`Vogui DOM renderer rejected packet: ${message}`);
      throw error;
    }
  }

  async #applyPacket(container: HTMLElement | null, bytes: Uint8Array): Promise<void> {
      const packet = decodeFrameworkPacket(new Uint8Array(bytes));
      if (packet.header.kind === MessageKind.UiSurfaceControl) {
        await this.#applySurfaceControl(packet.header, packet.payload);
        return;
      }
      if (packet.header.kind === MessageKind.UiCommand) {
        const existing = this.#roots.get(handleKey(packet.header.uiRoot));
        if (existing === undefined) {
          throw new RangeError("Vogui command targets an unattached root");
        }
        this.#dom.submitCommand(existing.root, decodeDomCommand(
          packet.header,
          packet.payload,
          existing.owned.identity,
        ));
        this.#publishHitRegions(existing);
        this.#flushReturns();
        return;
      }
      if (packet.header.kind === MessageKind.UiResourcePublication) {
        const existing = this.#roots.get(handleKey(packet.header.uiRoot));
        if (existing === undefined) {
          throw new RangeError("Vogui resource publication targets an unattached root");
        }
        existing.owned.renderer.publishResource(decodeResourcePublication(
          packet.header,
          packet.payload,
          this.#rendererGeneration,
        ));
        return;
      }
      if (packet.header.kind === MessageKind.UiResourceRetire) {
        const existing = this.#roots.get(handleKey(packet.header.uiRoot));
        if (existing === undefined) {
          throw new RangeError("Vogui resource retirement targets an unattached root");
        }
        const retired = decodeResourceRetire(
          packet.header,
          packet.payload,
          this.#rendererGeneration,
        );
        existing.owned.renderer.retireResource(
          retired.identity,
          retired.commitRevision,
          retired.resource,
          retired.sourceRevision,
        );
        return;
      }
      if (packet.header.kind !== MessageKind.UiPatch
        && packet.header.kind !== MessageKind.UiSnapshot) {
        throw new RangeError(`unsupported Vogui renderer packet kind ${packet.header.kind}`);
      }
      const root = this.#root(container, packet.header);
      const batch = decodeUiTransaction(packet.header, packet.payload, {
        replacement: packet.header.kind === MessageKind.UiSnapshot,
        rendererGeneration: this.#rendererGeneration,
        maxPropertiesPerNode: DEFAULT_DOM_RENDERER_LIMITS.maxPropertiesPerNode,
      });
      this.#dom.apply(root.root, batch);
      this.#publishHitRegions(root);
      this.#flushReturns();
  }

  stop(): void {
    this.#polling = false;
    this.#lane?.close();
    this.#lane = null;
    this.#retryReturn = null;
    this.#returnInFlight = false;
    if (this.#retryTimer !== null) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    this.#resetRoots();
    for (const lease of this.#surfaceLeases.values()) lease.release();
    this.#surfaceLeases.clear();
    this.#surfaceCapability = null;
    this.#host = null;
    this.#container = null;
    this.#rendererGeneration = {
      index: this.#rendererGeneration.index,
      generation: this.#rendererGeneration.generation + 1,
    };
  }

  quiesceForCapture(): { stopped: number; roots: number } {
    return { stopped: 1, roots: this.#roots.size };
  }

  #root(container: HTMLElement | null, header: FrameworkPacketHeader): RootRecord {
    const key = handleKey(header.uiRoot);
    const existing = this.#roots.get(key);
    if (existing !== undefined) return existing;
    const element = document.createElement("div");
    element.dataset.voguiRoot = key;
    element.style.width = "100%";
    element.style.height = "100%";
    const surface = this.#surfaceLeases.get(key);
    const mount = surface?.element ?? container;
    if (mount === null) {
      throw new Error("Vogui root presentation arrived before UiSurfaceControl attach");
    }
    mount.appendChild(element);
    const owned = this.#dom.attachRoot({
      host: element,
      mode: "shadow",
      identity: {
        session: header.uiSession,
        root: header.uiRoot,
        uiRootEpoch: header.uiRootEpoch,
        appCodeEpoch: header.appCodeEpoch,
        rendererGeneration: this.#rendererGeneration,
      },
      rendererLimits: DEFAULT_DOM_RENDERER_LIMITS,
      returnLimits: RETURN_LIMITS,
      interactionLimits: INTERACTION_LIMITS,
      onReturnAvailable: () => this.#flushReturns(),
    });
    const abort = new AbortController();
    let record: RootRecord;
    const resizeObserver = new ResizeObserver(() => {
      if (this.#roots.get(key) === record) this.#publishHitRegions(record);
    });
    record = {
      root: header.uiRoot,
      element,
      owned,
      nextReturnSequence: 1n,
      nextHitRegionRevision: 1n,
      lowerInputSuspended: false,
      resizeObserver,
      abort,
    };
    this.#roots.set(key, record);
    resizeObserver.observe(element);
    element.addEventListener('scroll', () => this.#publishHitRegions(record), {
      capture: true,
      passive: true,
      signal: abort.signal,
    });
    return record;
  }

  #publishHitRegions(root: RootRecord): void {
    const capability = this.#surfaceCapability;
    const surface = this.#surfaceLeases.get(handleKey(root.root));
    if (capability === null || surface === undefined) return;
    capability.publishHitRegions(
      surface.descriptor.identity,
      root.nextHitRegionRevision,
      root.owned.renderer.interactiveHitRegions(),
    );
    root.nextHitRegionRevision += 1n;
    const modal = root.owned.renderer.hasModalInteraction();
    if (modal !== root.lowerInputSuspended) {
      capability.setLowerInputSuspended(surface.descriptor.identity, modal);
      root.lowerInputSuspended = modal;
    }
  }

  async #pollFrameworkLane(host: StudioRendererHost, lane: StudioFrameworkLane): Promise<void> {
    while (this.#polling && this.#lane === lane && this.#host === host) {
      try {
        const packet = await lane.poll();
        if (!this.#polling || this.#lane !== lane || this.#host !== host) return;
        if (packet === null) {
          await delay(8);
          continue;
        }
        await this.#applyPacket(this.#container, packet);
      } catch (error) {
        if (!this.#polling || this.#lane !== lane || this.#host !== host) return;
        const message = error instanceof Error ? error.message : String(error);
        host.reportError(`Vogui framework lane failed: ${message}`);
        this.#polling = false;
        return;
      }
    }
  }

  #flushReturns(): void {
    const host = this.#host;
    const lane = this.#lane;
    if (host === null || lane === null || this.#returnInFlight) return;
    let pending = this.#retryReturn;
    if (pending === null) {
      for (const root of this.#roots.values()) {
        const item = this.#dom.pollReturn(root.root);
        if (item === undefined) continue;
        const encoded = encodeDomReturn(item);
        pending = {
          root,
          packet: encodeFrameworkPacket({
            kind: encoded.kind,
            uiSession: root.owned.identity.session,
            uiRoot: root.owned.identity.root,
            uiRootEpoch: root.owned.identity.uiRootEpoch,
            appCodeEpoch: root.owned.identity.appCodeEpoch,
            revision: encoded.revision,
            sequence: root.nextReturnSequence,
          }, encoded.payload),
        };
        this.#retryReturn = pending;
        break;
      }
    }
    if (pending === null) return;
    this.#returnInFlight = true;
    void lane.submit(pending.packet).then(() => {
      if (this.#retryReturn !== pending) return;
      pending.root.nextReturnSequence += 1n;
      this.#retryReturn = null;
      this.#returnInFlight = false;
      host.log(`Vogui return submitted root=${handleKey(pending.root.root)}`);
      this.#flushReturns();
    }).catch((error) => {
      if (this.#retryReturn !== pending) return;
      this.#returnInFlight = false;
      host.log(`Vogui return lane backpressure: ${error instanceof Error ? error.message : String(error)}`);
      if (this.#retryTimer !== null) clearTimeout(this.#retryTimer);
      this.#retryTimer = setTimeout(() => {
        this.#retryTimer = null;
        this.#flushReturns();
      }, 16);
    });
  }

  #resetRoots(): void {
    this.#dom.close();
    for (const root of this.#roots.values()) {
      root.resizeObserver.disconnect();
      root.abort.abort();
      root.element.remove();
    }
    this.#roots.clear();
    this.#dom = new BrowserDomHost();
  }

  async #applySurfaceControl(
    header: FrameworkPacketHeader,
    payload: Uint8Array,
  ): Promise<void> {
    if (payload.byteLength !== 38) throw new RangeError("invalid Vogui UiSurfaceControl payload");
    const reader = new SurfaceControlReader(payload);
    const action = reader.u8();
    const session = reader.handle();
    const window = reader.handle();
    const view = reader.handle();
    const surface = reader.handle();
    const layer = reader.i32();
    const input = surfaceInputPolicy(reader.u8());
    reader.finish();
    const lane = this.#lane;
    const capability = this.#surfaceCapability;
    if (lane === null || capability === null) {
      throw new Error("Vogui App Surface capability is closed");
    }
    if (
      !sameHandle(session, lane.binding.session)
      || lane.binding.sessionEpoch < 1
    ) {
      throw new Error("Vogui UiSurfaceControl App Session mismatch");
    }
    const key = handleKey(header.uiRoot);
    if (action === 1) {
      if (this.#surfaceLeases.has(key)) throw new Error("duplicate Vogui App Surface");
      const route = await capability.resolve(surface);
      if (
        route.kind !== "ui"
        || !sameHandle(route.session, session)
        || route.sessionEpoch !== BigInt(lane.binding.sessionEpoch)
        || !sameHandle(route.window, window)
        || !sameHandle(route.view, view)
        || !sameHandle(route.surface, surface)
        || route.zOrder !== layer
        || hostInputPolicy(route.inputPolicy) !== input
      ) {
        throw new Error("Vogui UiSurfaceControl route does not match App Runtime authority");
      }
      const lease = capability.attach({
        identity: {
          sessionId: capability.sessionId,
          session,
          sessionEpoch: BigInt(lane.binding.sessionEpoch),
          window,
          view,
          surface,
        },
        kind: "dom",
        layer,
        input,
        label: `Vogui ${header.uiSession.index}:${header.uiRoot.index}`,
      });
      if (!(lease.element instanceof HTMLDivElement)) {
        lease.release();
        throw new Error("Vogui App Surface host returned a non-DOM element");
      }
      this.#surfaceLeases.set(key, lease);
      return;
    }
    if (action !== 2) throw new RangeError("unknown Vogui UiSurfaceControl action");
    const lease = this.#surfaceLeases.get(key);
    if (lease === undefined) throw new Error("unknown Vogui App Surface detach");
    if (
      !sameHandle(lease.descriptor.identity.session, session)
      || !sameHandle(lease.descriptor.identity.window, window)
      || !sameHandle(lease.descriptor.identity.view, view)
      || !sameHandle(lease.descriptor.identity.surface, surface)
    ) {
      throw new Error("Vogui UiSurfaceControl detach route mismatch");
    }
    const root = this.#roots.get(key);
    if (root !== undefined) {
      root.resizeObserver.disconnect();
      root.abort.abort();
      this.#dom.detachRoot(root.root);
      root.element.remove();
      this.#roots.delete(key);
    }
    lease.release();
    this.#surfaceLeases.delete(key);
  }

  #requireHost(): StudioRendererHost {
    if (this.#host === null) throw new Error("Vogui renderer is not initialized");
    return this.#host;
  }
}

function handleKey(handle: Handle): string {
  return `${handle.index}:${handle.generation}`;
}

function surfaceInputPolicy(value: number): "opaque" | "transparent" | "passthrough" {
  switch (value) {
    case 1: return "opaque";
    case 2: return "transparent";
    case 3: return "passthrough";
    default: throw new RangeError("invalid Vogui App Surface input policy");
  }
}

function hostInputPolicy(
  value: "observe" | "passthrough" | "interactive" | "exclusive",
): "opaque" | "transparent" | "passthrough" {
  switch (value) {
    case "observe":
    case "passthrough":
      return "passthrough";
    case "interactive":
      return "transparent";
    case "exclusive":
      return "opaque";
  }
}

function sameHandle(left: Handle, right: Handle): boolean {
  return left.index === right.index && left.generation === right.generation;
}

class SurfaceControlReader {
  #offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  u8(): number {
    return this.take(1)[0]!;
  }

  i32(): number {
    const bytes = this.take(4);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(0, true);
  }

  handle(): Handle {
    const bytes = this.take(8);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const handle = {
      index: view.getUint32(0, true),
      generation: view.getUint32(4, true),
    };
    if (handle.index === 0xffff_ffff || handle.generation === 0) {
      throw new RangeError("invalid Vogui App Surface handle");
    }
    return handle;
  }

  finish(): void {
    if (this.#offset !== this.bytes.byteLength) {
      throw new RangeError("trailing Vogui UiSurfaceControl bytes");
    }
  }

  private take(length: number): Uint8Array {
    const end = this.#offset + length;
    if (!Number.isSafeInteger(end) || end > this.bytes.byteLength) {
      throw new RangeError("truncated Vogui UiSurfaceControl payload");
    }
    const value = this.bytes.subarray(this.#offset, end);
    this.#offset = end;
    return value;
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export default new VoguiStudioRenderer();
