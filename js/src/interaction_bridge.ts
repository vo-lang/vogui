import type { Handle } from "./dom_renderer.js";

export interface ExternalFileHandle {
  readonly appSession: Handle;
  readonly file: Handle;
  readonly sizeBytes: bigint;
}

export type MimePayload =
  | { readonly kind: "inline"; readonly bytes: Uint8Array }
  | { readonly kind: "externalFile"; readonly file: ExternalFileHandle };

export interface MimeItem {
  readonly mime: string;
  readonly payload: MimePayload;
}

export interface MimeOffer {
  readonly items: readonly MimeItem[];
}

export interface FileChunk {
  readonly file: ExternalFileHandle;
  readonly offset: bigint;
  readonly bytes: Uint8Array;
  readonly eof: boolean;
}

export interface InteractionBridgeLimits {
  readonly maxMimeItems: number;
  readonly maxMimeBytes: number;
  readonly maxInlineBytes: number;
  readonly maxOpenFiles: number;
  readonly maxPendingRequests: number;
  readonly maxChunkBytes: number;
}

export interface InteractionBridge {
  readClipboard(acceptedMimes: readonly string[], deadlineMillis: bigint): Promise<MimeOffer>;
  writeClipboard(offer: MimeOffer, deadlineMillis: bigint): Promise<void>;
  readFile(
    file: ExternalFileHandle,
    offset: bigint,
    maxBytes: number,
    deadlineMillis: bigint,
  ): Promise<FileChunk>;
  releaseFile(file: ExternalFileHandle): void;
  offerFromDataTransfer(data: DataTransfer): MimeOffer;
  close(): void;
}

interface FileSlot {
  generation: number;
  file: File | undefined;
}

export class BrowserInteractionBridge implements InteractionBridge {
  readonly #appSession: Handle;
  readonly #limits: InteractionBridgeLimits;
  readonly #nowMillis: () => bigint;
  readonly #files: FileSlot[] = [];
  readonly #freeFiles: number[] = [];
  readonly #closeAbort = new AbortController();
  #pending = 0;
  #closed = false;

  constructor(
    appSession: Handle,
    limits: InteractionBridgeLimits,
    nowMillis: () => bigint = () => BigInt(Date.now()),
  ) {
    validateHandle(appSession);
    validateLimits(limits);
    this.#appSession = appSession;
    this.#limits = limits;
    this.#nowMillis = nowMillis;
  }

  async readClipboard(acceptedMimes: readonly string[], deadlineMillis: bigint): Promise<MimeOffer> {
    return await this.#request(deadlineMillis, async () => {
      if (navigator.clipboard.read === undefined) throw new Error("clipboard read unsupported");
      const accepted = new Set(acceptedMimes);
      const items: MimeItem[] = [];
      for (const clipboardItem of await navigator.clipboard.read()) {
        for (const mime of clipboardItem.types) {
          if (accepted.size !== 0 && !accepted.has(mime)) continue;
          const blob = await clipboardItem.getType(mime);
          if (blob.size > this.#limits.maxInlineBytes) throw new Error("clipboard item capacity");
          items.push({ mime, payload: { kind: "inline", bytes: new Uint8Array(await blob.arrayBuffer()) } });
        }
      }
      const offer = { items };
      validateOffer(offer, this.#limits);
      return offer;
    });
  }

  async writeClipboard(offer: MimeOffer, deadlineMillis: bigint): Promise<void> {
    validateOffer(offer, this.#limits);
    await this.#request(deadlineMillis, async () => {
      if (navigator.clipboard.write === undefined) throw new Error("clipboard write unsupported");
      const parts: Record<string, Blob> = {};
      for (const item of offer.items) {
        if (item.payload.kind !== "inline") throw new Error("external files cannot be written to clipboard");
        parts[item.mime] = new Blob([copyArrayBuffer(item.payload.bytes)], { type: item.mime });
      }
      await navigator.clipboard.write([new ClipboardItem(parts)]);
    });
  }

  async readFile(
    file: ExternalFileHandle,
    offset: bigint,
    maxBytes: number,
    deadlineMillis: bigint,
  ): Promise<FileChunk> {
    const local = this.#resolveFile(file);
    if (offset < 0n || offset > file.sizeBytes) throw new Error("invalid file offset");
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || maxBytes > this.#limits.maxChunkBytes) {
      throw new Error("invalid file chunk size");
    }
    return await this.#request(deadlineMillis, async () => {
      const end = offset + BigInt(maxBytes) > file.sizeBytes ? file.sizeBytes : offset + BigInt(maxBytes);
      const bytes = new Uint8Array(await local.slice(Number(offset), Number(end)).arrayBuffer());
      return {
        file,
        offset,
        bytes,
        eof: end === file.sizeBytes,
      };
    });
  }

  releaseFile(file: ExternalFileHandle): void {
    const slot = this.#requiredFileSlot(file);
    slot.file = undefined;
    slot.generation = nextGeneration(slot.generation);
    this.#freeFiles.push(file.file.index);
  }

  offerFromDataTransfer(data: DataTransfer): MimeOffer {
    this.#assertOpen();
    const items: MimeItem[] = [];
    for (const file of data.files) {
      items.push({
        mime: file.type === "" ? "application/octet-stream" : file.type,
        payload: { kind: "externalFile", file: this.#registerFile(file) },
      });
    }
    for (const mime of data.types) {
      if (mime === "Files") continue;
      const bytes = new TextEncoder().encode(data.getData(mime));
      items.push({ mime, payload: { kind: "inline", bytes } });
    }
    const offer = { items };
    validateOffer(offer, this.#limits);
    return offer;
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#closeAbort.abort();
    for (const slot of this.#files) {
      slot.file = undefined;
      slot.generation = nextGeneration(slot.generation);
    }
    this.#freeFiles.length = 0;
  }

  async #request<T>(deadlineMillis: bigint, operation: () => Promise<T>): Promise<T> {
    this.#assertOpen();
    if (deadlineMillis <= this.#nowMillis()) throw new Error("interaction deadline expired");
    if (this.#pending >= this.#limits.maxPendingRequests) throw new Error("interaction request capacity");
    this.#pending += 1;
    try {
      const value = await awaitBoundedInteraction(
        operation,
        deadlineMillis,
        this.#nowMillis,
        this.#closeAbort.signal,
      );
      if (deadlineMillis <= this.#nowMillis()) throw new Error("interaction deadline expired");
      this.#assertOpen();
      return value;
    } finally {
      this.#pending -= 1;
    }
  }

  #registerFile(file: File): ExternalFileHandle {
    if (this.#files.length - this.#freeFiles.length >= this.#limits.maxOpenFiles) {
      throw new Error("external file capacity");
    }
    const index = this.#freeFiles.pop();
    if (index === undefined) {
      const next = this.#files.length;
      if (next > 0xffff_ffff) throw new Error("external file handle exhausted");
      this.#files.push({ generation: 1, file });
      return {
        appSession: this.#appSession,
        file: { index: next, generation: 1 },
        sizeBytes: BigInt(file.size),
      };
    }
    const slot = this.#files[index];
    if (slot === undefined) throw new Error("corrupt external file free list");
    slot.file = file;
    return {
      appSession: this.#appSession,
      file: { index, generation: slot.generation },
      sizeBytes: BigInt(file.size),
    };
  }

  #resolveFile(handle: ExternalFileHandle): File {
    const slot = this.#requiredFileSlot(handle);
    if (slot.file === undefined || BigInt(slot.file.size) !== handle.sizeBytes) {
      throw new Error("stale external file");
    }
    return slot.file;
  }

  #requiredFileSlot(handle: ExternalFileHandle): FileSlot {
    if (!sameHandle(handle.appSession, this.#appSession)) throw new Error("wrong app session");
    validateHandle(handle.file);
    const slot = this.#files[handle.file.index];
    if (slot === undefined || slot.generation !== handle.file.generation || slot.file === undefined) {
      throw new Error("stale external file");
    }
    return slot;
  }

  #assertOpen(): void {
    if (this.#closed) throw new Error("interaction bridge closed");
  }
}

export interface BridgeRequest {
  readonly bridgeEpoch: bigint;
  readonly requestId: bigint;
  readonly deadlineMillis: bigint;
  readonly operation: "clipboardRead" | "clipboardWrite" | "fileRead" | "fileRelease";
  readonly payload: unknown;
}

export interface BridgeResponse {
  readonly bridgeEpoch: bigint;
  readonly requestId: bigint;
  readonly outcome: "ok" | "denied" | "unsupported" | "cancelled" | "failed";
  readonly payload?: unknown;
}

export interface BoundedBridgeTransport {
  request(request: BridgeRequest): Promise<BridgeResponse>;
  close(): void;
}

export class NativeWebViewInteractionBridge {
  readonly #transport: BoundedBridgeTransport;
  readonly #bridgeEpoch: bigint;
  readonly #maxPending: number;
  readonly #nowMillis: () => bigint;
  readonly #closeAbort = new AbortController();
  #nextRequestId = 1n;
  #pending = 0;
  #closed = false;

  constructor(
    transport: BoundedBridgeTransport,
    bridgeEpoch: bigint,
    maxPending: number,
    nowMillis: () => bigint = () => BigInt(Date.now()),
  ) {
    if (bridgeEpoch <= 0n || !Number.isSafeInteger(maxPending) || maxPending <= 0) {
      throw new Error("invalid native WebView bridge config");
    }
    this.#transport = transport;
    this.#bridgeEpoch = bridgeEpoch;
    this.#maxPending = maxPending;
    this.#nowMillis = nowMillis;
  }

  async request(
    operation: BridgeRequest["operation"],
    payload: unknown,
    deadlineMillis: bigint,
  ): Promise<BridgeResponse> {
    if (this.#closed) throw new Error("native WebView bridge closed");
    if (deadlineMillis <= this.#nowMillis()) throw new Error("interaction deadline expired");
    if (this.#pending >= this.#maxPending) throw new Error("native WebView bridge capacity");
    if (this.#nextRequestId > 0xffff_ffff_ffff_ffffn) {
      throw new Error("native WebView bridge request identity exhausted");
    }
    const requestId = this.#nextRequestId;
    this.#nextRequestId += 1n;
    this.#pending += 1;
    try {
      const response = await awaitBoundedInteraction(
        () => this.#transport.request({
          bridgeEpoch: this.#bridgeEpoch,
          requestId,
          deadlineMillis,
          operation,
          payload,
        }),
        deadlineMillis,
        this.#nowMillis,
        this.#closeAbort.signal,
      );
      if (response.bridgeEpoch !== this.#bridgeEpoch || response.requestId !== requestId) {
        throw new Error("native WebView bridge response identity mismatch");
      }
      return response;
    } finally {
      this.#pending -= 1;
    }
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#closeAbort.abort();
    this.#transport.close();
  }
}

async function awaitBoundedInteraction<T>(
  operation: () => Promise<T>,
  deadlineMillis: bigint,
  nowMillis: () => bigint,
  closeSignal: AbortSignal,
): Promise<T> {
  const remaining = deadlineMillis - nowMillis();
  if (remaining <= 0n) throw new Error("interaction deadline expired");
  if (closeSignal.aborted) throw new Error("interaction bridge closed");
  const delay = Math.min(0x7fff_ffff, Number(remaining));
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let removeCloseListener: (() => void) | undefined;
  const terminal = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("interaction deadline expired")),
      delay,
    );
    const onClose = () => reject(new Error("interaction bridge closed"));
    closeSignal.addEventListener("abort", onClose, { once: true });
    removeCloseListener = () => closeSignal.removeEventListener("abort", onClose);
  });
  try {
    const value = await Promise.race([
      Promise.resolve().then(operation),
      terminal,
    ]);
    if (deadlineMillis <= nowMillis()) throw new Error("interaction deadline expired");
    if (closeSignal.aborted) throw new Error("interaction bridge closed");
    return value;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    removeCloseListener?.();
  }
}

function validateOffer(offer: MimeOffer, limits: InteractionBridgeLimits): void {
  if (offer.items.length > limits.maxMimeItems) throw new Error("MIME item capacity");
  let mimeBytes = 0;
  let inlineBytes = 0;
  const names = new Set<string>();
  for (const item of offer.items) {
    if (item.mime.length === 0 || names.has(item.mime)) throw new Error("invalid MIME offer");
    names.add(item.mime);
    mimeBytes += new TextEncoder().encode(item.mime).byteLength;
    if (item.payload.kind === "inline") inlineBytes += item.payload.bytes.byteLength;
  }
  if (mimeBytes > limits.maxMimeBytes || inlineBytes > limits.maxInlineBytes) {
    throw new Error("MIME offer capacity");
  }
}

function validateLimits(limits: InteractionBridgeLimits): void {
  for (const value of Object.values(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error("invalid interaction bridge limits");
  }
}

function validateHandle(handle: Handle): void {
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
}

function sameHandle(left: Handle, right: Handle): boolean {
  return left.index === right.index && left.generation === right.generation;
}

function nextGeneration(current: number): number {
  if (current >= 0xffff_ffff) throw new Error("handle generation exhausted");
  return current + 1;
}

function copyArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
