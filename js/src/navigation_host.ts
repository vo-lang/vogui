import type { Handle } from "./dom_renderer.js";

export type NavigationMode = "primaryUrl" | "memory" | "namespace";

export interface NavigationLease {
  readonly window: Handle;
  readonly owner: Handle;
  readonly ownerEpoch: bigint;
  readonly generation: number;
  readonly mode: NavigationMode;
  readonly namespace: string;
}

export interface NavigationRoute {
  readonly path: string;
  readonly query: string;
  readonly fragment: string;
  readonly state: Uint8Array;
}

export interface NavigationRequest {
  readonly lease: NavigationLease;
  readonly route: NavigationRoute;
  readonly replace: boolean;
}

export interface NavigationLocationEvent {
  readonly sequence: bigint;
  readonly route: NavigationRoute;
}

export interface BrowserNavigationHostLimits {
  readonly maxPayloadBytes: number;
  readonly maxStateBytes: number;
  readonly maxMemoryEntries: number;
}

interface StoredRoute {
  readonly path: string;
  readonly query: string;
  readonly fragment: string;
  readonly state: number[];
}

export class BrowserNavigationHost {
  readonly #window: Window;
  readonly #lease: NavigationLease;
  readonly #limits: BrowserNavigationHostLimits;
  readonly #onLocation: (event: NavigationLocationEvent) => void;
  readonly #abort = new AbortController();
  readonly #memory: NavigationRoute[] = [];
  #memoryIndex = -1;
  #sequence = 0n;
  #closed = false;

  constructor(
    window: Window,
    lease: NavigationLease,
    limits: BrowserNavigationHostLimits,
    onLocation: (event: NavigationLocationEvent) => void,
  ) {
    validateLease(lease);
    if (
      !Number.isSafeInteger(limits.maxPayloadBytes)
      || limits.maxPayloadBytes <= 0
      || !Number.isSafeInteger(limits.maxStateBytes)
      || limits.maxStateBytes <= 0
      || !Number.isSafeInteger(limits.maxMemoryEntries)
      || limits.maxMemoryEntries <= 0
    ) {
      throw new Error("invalid navigation host limits");
    }
    this.#window = window;
    this.#lease = lease;
    this.#limits = limits;
    this.#onLocation = onLocation;
    if (lease.mode === "primaryUrl") {
      window.addEventListener("popstate", (event) => {
        if (this.#closed) return;
        const stored = readStoredRoute(event.state, lease);
        this.#emit(stored === undefined ? routeFromLocation(window.location) : restoreRoute(stored));
      }, { signal: this.#abort.signal });
    }
  }

  execute(payload: Uint8Array): NavigationLocationEvent {
    this.#assertOpen();
    if (payload.byteLength > this.#limits.maxPayloadBytes) {
      throw new Error("navigation payload capacity exceeded");
    }
    const request = decodeNavigationRequest(payload, this.#limits.maxStateBytes);
    if (!sameLease(request.lease, this.#lease)) throw new Error("navigation lease mismatch");
    switch (this.#lease.mode) {
      case "primaryUrl":
        this.#commitPrimary(request);
        break;
      case "memory":
      case "namespace":
        this.#commitMemory(request);
        break;
    }
    return this.#emit(request.route);
  }

  back(): NavigationLocationEvent | undefined {
    this.#assertOpen();
    if (this.#lease.mode === "primaryUrl") {
      this.#window.history.back();
      return undefined;
    }
    if (this.#memoryIndex <= 0) return undefined;
    this.#memoryIndex -= 1;
    return this.#emit(this.#memory[this.#memoryIndex]!);
  }

  forward(): NavigationLocationEvent | undefined {
    this.#assertOpen();
    if (this.#lease.mode === "primaryUrl") {
      this.#window.history.forward();
      return undefined;
    }
    if (this.#memoryIndex + 1 >= this.#memory.length) return undefined;
    this.#memoryIndex += 1;
    return this.#emit(this.#memory[this.#memoryIndex]!);
  }

  current(): NavigationRoute | undefined {
    this.#assertOpen();
    if (this.#lease.mode === "primaryUrl") return routeFromLocation(this.#window.location);
    return this.#memory[this.#memoryIndex];
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#abort.abort();
    this.#memory.length = 0;
    this.#memoryIndex = -1;
  }

  #commitPrimary(request: NavigationRequest): void {
    const url = `${request.route.path}${request.route.query}${request.route.fragment}`;
    const state = {
      voguiNavigation: {
        lease: leaseKey(this.#lease),
        route: storeRoute(request.route),
      },
    };
    if (request.replace) this.#window.history.replaceState(state, "", url);
    else this.#window.history.pushState(state, "", url);
  }

  #commitMemory(request: NavigationRequest): void {
    if (request.replace && this.#memoryIndex >= 0) {
      this.#memory[this.#memoryIndex] = copyRoute(request.route);
      return;
    }
    this.#memory.splice(this.#memoryIndex + 1);
    if (this.#memory.length === this.#limits.maxMemoryEntries) {
      this.#memory.shift();
      this.#memoryIndex -= 1;
    }
    this.#memory.push(copyRoute(request.route));
    this.#memoryIndex = this.#memory.length - 1;
  }

  #emit(route: NavigationRoute): NavigationLocationEvent {
    this.#sequence += 1n;
    const event = { sequence: this.#sequence, route: copyRoute(route) };
    this.#onLocation(event);
    return event;
  }

  #assertOpen(): void {
    if (this.#closed) throw new Error("navigation host closed");
  }
}

export function decodeNavigationRequest(
  bytes: Uint8Array,
  maxStateBytes: number,
): NavigationRequest {
  const reader = new NavigationReader(bytes);
  if (reader.ascii(4) !== "VGN1") throw new Error("invalid navigation request magic");
  const lease: NavigationLease = {
    window: { index: reader.u32(), generation: reader.u32() },
    owner: { index: reader.u32(), generation: reader.u32() },
    ownerEpoch: reader.u64(),
    generation: reader.u32(),
    mode: decodeMode(reader.u8()),
    namespace: "",
  };
  const replaceTag = reader.u8();
  if (replaceTag > 1) throw new Error("invalid navigation replace flag");
  const namespaceBytes = reader.u16();
  const routeBytes = reader.u32();
  const namespace = reader.text(namespaceBytes);
  const route = decodeRoute(reader.bytes(routeBytes), maxStateBytes);
  reader.finish();
  const qualifiedLease = { ...lease, namespace };
  validateLease(qualifiedLease);
  return { lease: qualifiedLease, route, replace: replaceTag === 1 };
}

export function encodeNavigationEvent(event: NavigationLocationEvent): Uint8Array {
  if (event.sequence <= 0n) throw new Error("invalid navigation event sequence");
  const route = encodeRoute(event.route);
  const output = new Uint8Array(16 + route.byteLength);
  output.set(new TextEncoder().encode("VGL1"));
  const view = new DataView(output.buffer);
  view.setBigUint64(4, event.sequence, true);
  view.setUint32(12, route.byteLength, true);
  output.set(route, 16);
  return output;
}

function decodeRoute(bytes: Uint8Array, maxStateBytes: number): NavigationRoute {
  const reader = new NavigationReader(bytes);
  if (reader.ascii(4) !== "VGR1") throw new Error("invalid navigation route magic");
  const pathBytes = reader.u16();
  const queryBytes = reader.u16();
  const fragmentBytes = reader.u16();
  if (reader.u16() !== 0) throw new Error("invalid navigation route reserved bytes");
  const stateBytes = reader.u32();
  if (stateBytes > maxStateBytes) throw new Error("navigation state capacity exceeded");
  const route = {
    path: reader.text(pathBytes),
    query: reader.text(queryBytes),
    fragment: reader.text(fragmentBytes),
    state: reader.bytes(stateBytes).slice(),
  };
  reader.finish();
  validateRoute(route);
  return route;
}

function encodeRoute(route: NavigationRoute): Uint8Array {
  validateRoute(route);
  const encoder = new TextEncoder();
  const path = encoder.encode(route.path);
  const query = encoder.encode(route.query);
  const fragment = encoder.encode(route.fragment);
  if (path.byteLength > 0xffff || query.byteLength > 0xffff || fragment.byteLength > 0xffff) {
    throw new Error("navigation route capacity exceeded");
  }
  const output = new Uint8Array(16 + path.byteLength + query.byteLength + fragment.byteLength + route.state.byteLength);
  output.set(encoder.encode("VGR1"));
  const view = new DataView(output.buffer);
  view.setUint16(4, path.byteLength, true);
  view.setUint16(6, query.byteLength, true);
  view.setUint16(8, fragment.byteLength, true);
  view.setUint32(12, route.state.byteLength, true);
  let offset = 16;
  for (const part of [path, query, fragment, route.state]) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function routeFromLocation(location: Location): NavigationRoute {
  return {
    path: location.pathname.length === 0 ? "/" : location.pathname,
    query: location.search,
    fragment: location.hash,
    state: new Uint8Array(),
  };
}

function validateRoute(route: NavigationRoute): void {
  if (
    route.path.length === 0
    || !route.path.startsWith("/")
    || route.path.includes("//")
    || (route.query.length > 0 && !route.query.startsWith("?"))
    || (route.fragment.length > 0 && !route.fragment.startsWith("#"))
  ) {
    throw new Error("invalid navigation route");
  }
}

function validateLease(lease: NavigationLease): void {
  validateHandle(lease.window);
  validateHandle(lease.owner);
  if (lease.ownerEpoch <= 0n || lease.generation <= 0 || !Number.isSafeInteger(lease.generation)) {
    throw new Error("invalid navigation lease");
  }
  if (lease.mode === "namespace") {
    if (lease.namespace.length === 0 || lease.namespace.startsWith("/") || lease.namespace.endsWith("/")) {
      throw new Error("invalid navigation namespace");
    }
  } else if (lease.namespace.length !== 0) {
    throw new Error("unexpected navigation namespace");
  }
}

function validateHandle(handle: Handle): void {
  if (
    !Number.isSafeInteger(handle.index)
    || handle.index < 0
    || handle.index > 0xffff_ffff
    || !Number.isSafeInteger(handle.generation)
    || handle.generation <= 0
    || handle.generation > 0xffff_ffff
  ) {
    throw new Error("invalid navigation handle");
  }
}

function decodeMode(tag: number): NavigationMode {
  if (tag === 1) return "primaryUrl";
  if (tag === 2) return "memory";
  if (tag === 3) return "namespace";
  throw new Error("invalid navigation mode");
}

function sameLease(left: NavigationLease, right: NavigationLease): boolean {
  return left.window.index === right.window.index
    && left.window.generation === right.window.generation
    && left.owner.index === right.owner.index
    && left.owner.generation === right.owner.generation
    && left.ownerEpoch === right.ownerEpoch
    && left.generation === right.generation
    && left.mode === right.mode
    && left.namespace === right.namespace;
}

function leaseKey(lease: NavigationLease): string {
  return `${lease.window.index}:${lease.window.generation}:${lease.owner.index}:${lease.owner.generation}:${lease.ownerEpoch}:${lease.generation}:${lease.namespace}`;
}

function storeRoute(route: NavigationRoute): StoredRoute {
  return { path: route.path, query: route.query, fragment: route.fragment, state: [...route.state] };
}

function restoreRoute(route: StoredRoute): NavigationRoute {
  return { path: route.path, query: route.query, fragment: route.fragment, state: Uint8Array.from(route.state) };
}

function copyRoute(route: NavigationRoute): NavigationRoute {
  return { ...route, state: route.state.slice() };
}

function readStoredRoute(state: unknown, lease: NavigationLease): StoredRoute | undefined {
  if (typeof state !== "object" || state === null || !("voguiNavigation" in state)) return undefined;
  const value = (state as { voguiNavigation?: unknown }).voguiNavigation;
  if (typeof value !== "object" || value === null) return undefined;
  const candidate = value as { lease?: unknown; route?: unknown };
  if (candidate.lease !== leaseKey(lease) || typeof candidate.route !== "object" || candidate.route === null) {
    return undefined;
  }
  const route = candidate.route as Partial<StoredRoute>;
  if (
    typeof route.path !== "string"
    || typeof route.query !== "string"
    || typeof route.fragment !== "string"
    || !Array.isArray(route.state)
  ) {
    return undefined;
  }
  return {
    path: route.path,
    query: route.query,
    fragment: route.fragment,
    state: route.state.filter((byte): byte is number => Number.isInteger(byte) && byte >= 0 && byte <= 255),
  };
}

class NavigationReader {
  readonly #bytes: Uint8Array;
  readonly #view: DataView;
  #offset = 0;

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
    this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  u8(): number {
    return this.take(1)[0]!;
  }

  u16(): number {
    this.require(2);
    const value = this.#view.getUint16(this.#offset, true);
    this.#offset += 2;
    return value;
  }

  u32(): number {
    this.require(4);
    const value = this.#view.getUint32(this.#offset, true);
    this.#offset += 4;
    return value;
  }

  u64(): bigint {
    this.require(8);
    const value = this.#view.getBigUint64(this.#offset, true);
    this.#offset += 8;
    return value;
  }

  ascii(length: number): string {
    return String.fromCharCode(...this.take(length));
  }

  text(length: number): string {
    return new TextDecoder("utf-8", { fatal: true }).decode(this.take(length));
  }

  bytes(length: number): Uint8Array {
    return this.take(length);
  }

  finish(): void {
    if (this.#offset !== this.#bytes.byteLength) throw new Error("trailing navigation bytes");
  }

  private require(length: number): void {
    if (this.#offset + length > this.#bytes.byteLength) throw new Error("truncated navigation payload");
  }

  private take(length: number): Uint8Array {
    this.require(length);
    const output = this.#bytes.subarray(this.#offset, this.#offset + length);
    this.#offset += length;
    return output;
  }
}
