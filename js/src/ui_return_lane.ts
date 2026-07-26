import type { DomReturn } from "./dom_renderer.js";

export interface DomReturnLaneLimits {
  readonly maxItems: number;
  readonly maxBytes: number;
}

export type DomReturnAdmission = "accepted" | "coalesced" | "overflow" | "closed";

interface QueuedReturn {
  item: DomReturn;
  bytes: number;
}

export class DomReturnLane {
  readonly #limits: DomReturnLaneLimits;
  readonly #onReliableOverflow: () => void;
  readonly #queue: QueuedReturn[] = [];
  #bytes = 0;
  #frozen = false;
  #closed = false;

  constructor(limits: DomReturnLaneLimits, onReliableOverflow: () => void) {
    if (
      !Number.isSafeInteger(limits.maxItems) ||
      limits.maxItems < 2 ||
      !Number.isSafeInteger(limits.maxBytes) ||
      limits.maxBytes <= 0
    ) {
      throw new Error("invalid UiReturn lane limits");
    }
    this.#limits = limits;
    this.#onReliableOverflow = onReliableOverflow;
  }

  get frozen(): boolean {
    return this.#frozen;
  }

  enqueue(item: DomReturn): DomReturnAdmission {
    if (this.#closed) return "closed";
    const bytes = returnBytes(item);
    if (bytes > this.#limits.maxBytes) return this.#overflow();
    if (isContinuous(item)) {
      const index = this.#queue.length - 1;
      const previous = this.#queue[index];
      if (previous !== undefined && sameContinuousSource(previous.item, item)) {
        const nextBytes = this.#bytes - previous.bytes + bytes;
        if (nextBytes > this.#limits.maxBytes) return this.#overflow();
        this.#queue[index] = { item, bytes };
        this.#bytes = nextBytes;
        return "coalesced";
      }
    }
    const itemLimit = item.kind === "applyAck" ? this.#limits.maxItems : this.#limits.maxItems - 1;
    if (this.#queue.length >= itemLimit || this.#bytes + bytes > this.#limits.maxBytes) {
      return this.#overflow();
    }
    this.#queue.push({ item, bytes });
    this.#bytes += bytes;
    return "accepted";
  }

  poll(): DomReturn | undefined {
    const queued = this.#queue.shift();
    if (queued === undefined) return undefined;
    this.#bytes -= queued.bytes;
    return queued.item;
  }

  drain(): DomReturn[] {
    const items = this.#queue.map((queued) => queued.item);
    this.#queue.length = 0;
    this.#bytes = 0;
    return items;
  }

  close(): void {
    this.#closed = true;
    this.#queue.length = 0;
    this.#bytes = 0;
  }

  #overflow(): DomReturnAdmission {
    if (!this.#frozen) {
      this.#frozen = true;
      this.#onReliableOverflow();
    }
    return "overflow";
  }
}

function isContinuous(item: DomReturn): boolean {
  return item.kind === "event" && item.event.type === "dragOver";
}

function sameContinuousSource(left: DomReturn, right: DomReturn): boolean {
  return (
    left.kind === "event" &&
    right.kind === "event" &&
    left.event.type === right.event.type &&
    left.event.token.index === right.event.token.index &&
    left.event.token.generation === right.event.token.generation
  );
}

function returnBytes(item: DomReturn): number {
  switch (item.kind) {
    case "applyAck":
      return 48;
    case "commandResult":
      return 64;
    case "event": {
      const payload = item.event.payload;
      switch (payload.kind) {
        case "press":
          return 64;
        case "textEdit":
          return 96 + new TextEncoder().encode(payload.text).byteLength;
        case "key":
          return 96 + payload.physical.length + payload.logical.length;
        case "focus":
        case "pointer":
          return 96;
        case "drag":
          return 96 + payload.mimeTypes.reduce((bytes, mime) => bytes + mime.length, 0);
      }
    }
  }
}
