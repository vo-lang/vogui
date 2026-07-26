import {
  MAX_EVENT_PAYLOAD_BYTES,
  MessageKind,
} from "../../protocol/generated/vogui_protocol.js";
import type {
  DelegatedDomEvent,
  DomCommandOutcome,
  DomReturn,
  Handle,
} from "./dom_renderer.js";

const encoder = new TextEncoder();

export interface EncodedDomReturn {
  readonly kind: MessageKind.UiApplyAck | MessageKind.UiEvent | MessageKind.UiCommandResult;
  readonly revision: bigint;
  readonly payload: Uint8Array;
}

export function encodeDomReturn(item: DomReturn): EncodedDomReturn {
  switch (item.kind) {
    case "applyAck":
      return {
        kind: MessageKind.UiApplyAck,
        revision: item.appliedRevision,
        payload: new Uint8Array(0),
      };
    case "event":
      return {
        kind: MessageKind.UiEvent,
        revision: item.event.appliedRevision,
        payload: encodeEvent(item.event),
      };
    case "commandResult": {
      const writer = new ByteWriter(MAX_EVENT_PAYLOAD_BYTES);
      writer.u64(item.result.requestId);
      writer.u8(commandOutcomeTag(item.result.outcome));
      if (item.result.outcome.kind === "measured") {
        writer.handle(item.result.target);
        writer.u32(item.result.bindingGeneration);
        writer.u64(item.result.outcome.layoutRevision);
        writer.u64(item.result.outcome.layoutRevision);
        writer.u8(1);
        writer.i64(cssPixelsToMilli(item.result.outcome.x));
        writer.i64(cssPixelsToMilli(item.result.outcome.y));
        writer.i64(cssPixelsToMilli(item.result.outcome.width));
        writer.i64(cssPixelsToMilli(item.result.outcome.height));
      }
      return {
        kind: MessageKind.UiCommandResult,
        revision: item.result.appliedRevision,
        payload: writer.finish(),
      };
    }
  }
}

function encodeEvent(event: DelegatedDomEvent): Uint8Array {
  const writer = new ByteWriter(MAX_EVENT_PAYLOAD_BYTES);
  writer.handle(event.token);
  writer.handle(event.node);
  writer.u8(eventTypeTag(event.type));
  switch (event.payload.kind) {
    case "press":
      writer.u8(1);
      break;
    case "textEdit":
      writer.u8(2);
      writer.u64(event.payload.editSequence);
      writer.string(event.payload.text);
      writer.u32(event.payload.selectionStartUtf8);
      writer.u32(event.payload.selectionEndUtf8);
      writer.bool(event.payload.composing);
      break;
    case "key":
      writer.u8(3);
      writer.string(event.payload.physical);
      writer.string(event.payload.logical);
      writer.bool(event.payload.repeat);
      writer.bool(event.payload.alt);
      writer.bool(event.payload.control);
      writer.bool(event.payload.meta);
      writer.bool(event.payload.shift);
      break;
    case "focus":
      writer.u8(4);
      writer.bool(event.payload.focused);
      writer.optionalHandle(event.payload.relatedNode);
      break;
    case "pointer":
      writer.u8(5);
      writer.u32(event.payload.pointerId);
      writer.string(event.payload.pointerType);
      writer.i32(event.payload.xMilli);
      writer.i32(event.payload.yMilli);
      writer.i32(event.payload.button);
      writer.u32(event.payload.buttons);
      break;
    case "drag":
      writer.u8(6);
      writer.u32(event.payload.mimeTypes.length);
      for (const mime of event.payload.mimeTypes) writer.string(mime);
      writer.i32(event.payload.xMilli);
      writer.i32(event.payload.yMilli);
      break;
  }
  return writer.finish();
}

function eventTypeTag(type: DelegatedDomEvent["type"]): number {
  switch (type) {
    case "press": return 1;
    case "textEdit": return 2;
    case "keyDown": return 3;
    case "keyUp": return 4;
    case "focusIn": return 5;
    case "focusOut": return 6;
    case "pointerDown": return 7;
    case "pointerUp": return 8;
    case "dragEnter": return 9;
    case "dragOver": return 10;
    case "dragLeave": return 11;
    case "drop": return 12;
    case "change": return 13;
    case "input": return 14;
    case "submit": return 15;
    case "dismiss": return 16;
    case "select": return 17;
    case "toggle": return 18;
    case "open": return 19;
    case "close": return 20;
    case "pointerMove": return 21;
    case "pointerCancel": return 22;
    case "wheel": return 23;
    case "contextMenu": return 24;
    case "compositionStart": return 25;
    case "compositionUpdate": return 26;
    case "compositionCommit": return 27;
    case "compositionCancel": return 28;
  }
  throw new Error(`unsupported delegated DOM event type: ${String(type)}`);
}

function commandOutcomeTag(outcome: DomCommandOutcome): number {
  switch (outcome.kind) {
    case "executed": return 1;
    case "measured": return 2;
    case "staleBinding": return 3;
    case "deadlineExpired": return 4;
    case "futureRevision": return 5;
    case "capacity": return 6;
    case "unsupported": return 7;
    case "rendererUnavailable": return 8;
  }
}

class ByteWriter {
  readonly #maxBytes: number;
  #bytes = new Uint8Array(128);
  #length = 0;

  constructor(maxBytes: number) {
    this.#maxBytes = maxBytes;
  }

  u8(value: number): void {
    this.#ensure(1);
    this.#bytes[this.#length] = requireInteger(value, 0xff, "u8");
    this.#length += 1;
  }

  bool(value: boolean): void {
    this.u8(value ? 1 : 0);
  }

  u32(value: number): void {
    this.#ensure(4);
    new DataView(this.#bytes.buffer).setUint32(
      this.#length,
      requireInteger(value, 0xffff_ffff, "u32"),
      true,
    );
    this.#length += 4;
  }

  i32(value: number): void {
    if (!Number.isSafeInteger(value) || value < -0x8000_0000 || value > 0x7fff_ffff) {
      throw new RangeError("invalid i32");
    }
    this.#ensure(4);
    new DataView(this.#bytes.buffer).setInt32(this.#length, value, true);
    this.#length += 4;
  }

  i64(value: bigint): void {
    if (typeof value !== "bigint"
      || value < -0x8000_0000_0000_0000n
      || value > 0x7fff_ffff_ffff_ffffn) {
      throw new RangeError("invalid i64");
    }
    this.#ensure(8);
    new DataView(this.#bytes.buffer).setBigInt64(this.#length, value, true);
    this.#length += 8;
  }

  u64(value: bigint): void {
    if (typeof value !== "bigint" || value < 0n || value > 0xffff_ffff_ffff_ffffn) {
      throw new RangeError("invalid u64");
    }
    this.#ensure(8);
    new DataView(this.#bytes.buffer).setBigUint64(this.#length, value, true);
    this.#length += 8;
  }

  handle(handle: Handle): void {
    this.u32(handle.index);
    if (handle.generation === 0) throw new RangeError("invalid handle generation");
    this.u32(handle.generation);
  }

  optionalHandle(handle: Handle | undefined): void {
    if (handle === undefined) {
      this.u8(0);
      return;
    }
    this.u8(1);
    this.handle(handle);
  }

  string(value: string): void {
    const bytes = encoder.encode(value);
    this.u32(bytes.byteLength);
    this.#write(bytes);
  }

  finish(): Uint8Array {
    return this.#bytes.slice(0, this.#length);
  }

  #write(bytes: Uint8Array): void {
    this.#ensure(bytes.byteLength);
    this.#bytes.set(bytes, this.#length);
    this.#length += bytes.byteLength;
  }

  #ensure(additional: number): void {
    const required = this.#length + additional;
    if (!Number.isSafeInteger(required) || required > this.#maxBytes) {
      throw new RangeError("Vogui return payload capacity");
    }
    if (required <= this.#bytes.byteLength) return;
    let capacity = this.#bytes.byteLength;
    while (capacity < required) capacity = Math.min(this.#maxBytes, capacity * 2);
    const next = new Uint8Array(capacity);
    next.set(this.#bytes);
    this.#bytes = next;
  }
}

function cssPixelsToMilli(value: number): bigint {
  if (!Number.isFinite(value)) throw new RangeError("non-finite CSS measurement");
  const milli = Math.round(value * 1000);
  if (!Number.isSafeInteger(milli)) throw new RangeError("CSS measurement exceeds wire range");
  return BigInt(milli);
}

function requireInteger(value: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > max) {
    throw new RangeError(`invalid ${label}`);
  }
  return value;
}
