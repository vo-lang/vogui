import {
  MAX_NODES_PER_SNAPSHOT,
  MAX_PATCH_OPS,
  MAX_STRING_BYTES,
  type FrameworkPacketHeader,
  type GenerationalHandle,
} from "../../protocol/generated/vogui_protocol.js";
import type {
  DomEventType,
  DomMutation,
  DomNodeKind,
  DomPatchBatch,
  DomProperty,
  DomRendererIdentity,
  Handle,
  PortableTag,
} from "./dom_renderer.js";

const decoder = new TextDecoder("utf-8", { fatal: true });
const portableElementTags = new Map<string, PortableTag>([
  ["div", "div"],
  ["span", "span"],
  ["p", "p"],
  ["a", "a"],
  ["input", "input"],
  ["textarea", "textarea"],
  ["img", "img"],
  ["ul", "ul"],
  ["ol", "ol"],
  ["li", "li"],
  ["thead", "thead"],
  ["tbody", "tbody"],
  ["tr", "tr"],
  ["th", "th"],
  ["td", "td"],
  ["option", "option"],
  ["nav", "nav"],
  ["section", "section"],
  ["image", "img"],
  ["button", "button"],
  ["text-field", "input"],
  ["toggle", "input"],
  ["slider", "input"],
  ["list", "ul"],
  ["grid", "div"],
  ["rich-text", "div"],
  ["icon", "span"],
  ["link", "a"],
  ["password-field", "input"],
  ["text-area", "textarea"],
  ["checkbox", "input"],
  ["switch", "input"],
  ["radio-group", "div"],
  ["select", "select"],
  ["list-box", "select"],
  ["combobox", "input"],
  ["form", "form"],
  ["label", "label"],
  ["help", "p"],
  ["error", "p"],
  ["progress", "progress"],
  ["spinner", "div"],
  ["tabs", "div"],
  ["disclosure", "button"],
  ["accordion", "section"],
  ["dialog", "dialog"],
  ["drawer", "dialog"],
  ["tooltip", "div"],
  ["popover", "div"],
  ["menu", "menu"],
  ["context-menu", "menu"],
  ["table", "table"],
  ["tree", "ul"],
  ["scroll-view", "div"],
  ["virtual-collection", "div"],
  ["portal", "div"],
  ["overlay", "div"],
  ["toast", "div"],
  ["focus-scope", "div"],
  ["live-region", "div"],
]);

export interface UiTransactionDecodeOptions {
  readonly replacement: boolean;
  readonly rendererGeneration: Handle;
  readonly maxPropertiesPerNode: number;
}

export function decodeUiTransaction(
  header: FrameworkPacketHeader,
  payload: Uint8Array,
  options: UiTransactionDecodeOptions,
): DomPatchBatch {
  if (
    !Number.isSafeInteger(options.maxPropertiesPerNode)
    || options.maxPropertiesPerNode <= 0
    || !validHandle(options.rendererGeneration)
  ) {
    throw new RangeError("invalid UI transaction decode options");
  }
  const reader = new BoundedReader(payload);
  const baseRevision = reader.u64();
  const newRevision = reader.u64();
  const root = reader.handle();
  const patchCount = reader.u32();
  if (patchCount > MAX_PATCH_OPS) throw new RangeError("UI transaction patch capacity");
  const mutations: DomMutation[] = [];
  for (let index = 0; index < patchCount; index += 1) {
    mutations.push(decodeMutation(reader, options.maxPropertiesPerNode));
  }
  reader.finish();
  if (!sameHandle(root, header.uiRoot)) {
    throw new RangeError("UI transaction root identity mismatch");
  }
  if (newRevision === 0n || newRevision < baseRevision) {
    throw new RangeError("invalid UI transaction revision");
  }
  const identity: DomRendererIdentity = {
    session: header.uiSession,
    root: header.uiRoot,
    uiRootEpoch: header.uiRootEpoch,
    appCodeEpoch: header.appCodeEpoch,
    rendererGeneration: options.rendererGeneration,
  };
  return {
    identity,
    baseRevision,
    newRevision,
    replacement: options.replacement,
    mutations,
  };
}

function decodeMutation(reader: BoundedReader, maxPropertiesPerNode: number): DomMutation {
  const tag = reader.u8();
  switch (tag) {
    case 1:
      return {
        kind: "create",
        node: reader.handle(),
        ...optionalParent(reader.optionalHandle()),
        index: reader.u32(),
      };
    case 2:
      return { kind: "remove", node: reader.handle() };
    case 3:
      return {
        kind: "move",
        node: reader.handle(),
        ...optionalParent(reader.optionalHandle()),
        index: reader.u32(),
      };
    case 4:
      return {
        kind: "setKind",
        node: reader.handle(),
        nodeKind: decodeNodeKind(reader),
      };
    case 5: {
      const node = reader.handle();
      const count = reader.u32();
      if (count > maxPropertiesPerNode) throw new RangeError("UI property capacity");
      const rawProperties = new Map<string, string>();
      for (let index = 0; index < count; index += 1) {
        const name = reader.string();
        if (rawProperties.has(name)) throw new RangeError("duplicate UI property");
        rawProperties.set(name, reader.string());
      }
      const acknowledgedEditSequence = decodeOptionalU64(
        rawProperties.get("confirmedEditSequence"),
        "confirmed edit sequence",
      );
      const properties = [...rawProperties].map(([name, value]) =>
        decodeProperty(name, value, acknowledgedEditSequence)
      );
      return { kind: "setProperties", node, properties };
    }
    case 6:
      return {
        kind: "bindEvent",
        node: reader.handle(),
        eventType: decodeEventType(reader.u8()),
        token: reader.handle(),
        policy: decodeEventPolicy(reader.u8()),
      };
    case 7:
      return { kind: "unbindEvent", token: reader.handle() };
    case 8:
      return {
        kind: "bindRef",
        node: reader.handle(),
        ref: reader.handle(),
        bindingGeneration: reader.u32(),
      };
    case 9:
      return { kind: "unbindRef", ref: reader.handle() };
    case 10:
      return {
        kind: "attachResource",
        node: reader.handle(),
        resource: reader.handle(),
        sourceRevision: reader.u64(),
      };
    case 11:
      return {
        kind: "detachResource",
        node: reader.handle(),
        resource: reader.handle(),
      };
    default:
      throw new RangeError("unknown UI mutation tag");
  }
}

function decodeEventType(tag: number): DomEventType {
  switch (tag) {
    case 1: return "press";
    case 2: return "textEdit";
    case 3: return "keyDown";
    case 4: return "keyUp";
    case 5: return "focusIn";
    case 6: return "focusOut";
    case 7: return "pointerDown";
    case 8: return "pointerUp";
    case 9: return "dragEnter";
    case 10: return "dragOver";
    case 11: return "dragLeave";
    case 12: return "drop";
    case 13: return "change";
    case 14: return "input";
    case 15: return "submit";
    case 16: return "dismiss";
    case 17: return "select";
    case 18: return "toggle";
    case 19: return "open";
    case 20: return "close";
    case 21: return "pointerMove";
    case 22: return "pointerCancel";
    case 23: return "wheel";
    case 24: return "contextMenu";
    case 25: return "compositionStart";
    case 26: return "compositionUpdate";
    case 27: return "compositionCommit";
    case 28: return "compositionCancel";
    default: throw new RangeError("unknown UI event kind");
  }
}

function decodeEventPolicy(flags: number): {
  preventDefault: boolean;
  stopPropagation: boolean;
  passive: boolean;
  once: boolean;
} {
  if ((flags & 0xf0) !== 0) throw new RangeError("unknown UI event policy flags");
  return {
    preventDefault: (flags & 1) !== 0,
    stopPropagation: (flags & 2) !== 0,
    passive: (flags & 4) !== 0,
    once: (flags & 8) !== 0,
  };
}

function decodeNodeKind(reader: BoundedReader): DomNodeKind {
  switch (reader.u8()) {
    case 1: {
      const kind = reader.string();
      const tag = portableElementTags.get(kind);
      if (tag === undefined) throw new RangeError(`unsupported portable control kind ${kind}`);
      return { kind: "element", tag };
    }
    case 2:
      return { kind: "text", text: reader.string() };
    default:
      throw new RangeError("unknown UI node kind");
  }
}

function decodeProperty(
  name: string,
  value: string,
  acknowledgedEditSequence: bigint,
): DomProperty {
  switch (name) {
    case "text":
      return { field: "text", value };
    case "type":
      if (value !== "text" && value !== "password" && value !== "checkbox" && value !== "range") {
        throw new RangeError("invalid input type property");
      }
      return { field: "inputType", value };
    case "value":
      return { field: "value", value, acknowledgedEditSequence };
    case "checked":
      return { field: "checked", value: decodeBoolean(value) };
    case "disabled":
      return { field: "disabled", value: decodeBoolean(value) };
    case "readOnly":
      return { field: "readOnly", value: decodeBoolean(value) };
    case "required":
      return { field: "required", value: decodeBoolean(value) };
    case "multiple":
      return { field: "multiple", value: decodeBoolean(value) };
    case "hidden":
      return { field: "hidden", value: decodeBoolean(value) };
    case "inert":
      return { field: "inert", value: decodeBoolean(value) };
    case "open":
      return { field: "open", value: decodeBoolean(value) };
    case "href":
      return { field: "href", value };
    case "alt":
      return { field: "alt", value };
    case "title":
      return { field: "title", value };
    case "placeholder":
      return { field: "placeholder", value };
    case "name":
      return { field: "name", value };
    case "min":
    case "max":
    case "step": {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) throw new RangeError(`invalid ${name} property`);
      return { field: "number", name, value: parsed };
    }
    case "rangeValue": {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) throw new RangeError("invalid range value property");
      return { field: "number", name: "value", value: parsed };
    }
    case "progressValue":
    case "progressMax": {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError(`invalid ${name} property`);
      return {
        field: "progressNumber",
        name: name === "progressValue" ? "value" : "max",
        value: parsed,
      };
    }
    case "tabIndex": {
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed)) throw new RangeError("invalid tabIndex property");
      return { field: "tabIndex", value: parsed };
    }
    case "role":
      return { field: "role", value };
    case "ariaLabel":
    case "accessibleName":
      return { field: "ariaLabel", value };
    case "ariaDescription":
    case "accessibleDescription":
      return { field: "ariaDescription", value };
    case "class":
    case "className":
      return { field: "className", value };
    case "resourceUrl":
      return { field: "resourceUrl", value };
    default:
      if (name.startsWith("style.")) {
        const token = name.slice("style.".length);
        if (!portableStyleToken(token)) throw new RangeError(`unsupported portable style token ${token}`);
        return { field: "styleToken", name: token, value };
      }
      if (portableNativeStyleToken(name)) {
        return { field: "nativeStyleToken", name, value };
      }
      if (name.startsWith("aria.")) {
        const token = name.slice("aria.".length);
        if (token.length === 0) throw new RangeError("empty aria token");
        return { field: "ariaState", name: token, value };
      }
      if (portableControlDataToken(name)) {
        return { field: "dataToken", name: portableDataName(name), source: name, value };
      }
      throw new RangeError(`unsupported portable DOM property ${name}`);
  }
}

function decodeOptionalU64(value: string | undefined, label: string): bigint {
  if (value === undefined) return 0n;
  if (!/^(0|[1-9][0-9]*)$/.test(value)) throw new RangeError(`invalid ${label}`);
  const parsed = BigInt(value);
  if (parsed > 0xffff_ffff_ffff_ffffn) throw new RangeError(`${label} exceeds u64`);
  return parsed;
}

const portableControlDataTokens = new Set([
  "resource", "fit", "widthMilli", "heightMilli", "defaultAction",
  "label", "locale", "direction", "selectable", "live",
  "route", "externalUrl", "target", "multiline", "editRevision",
  "confirmedEditSequence", "indeterminate", "active", "expanded",
  "valueMilli", "minimumMilli", "maximumMilli", "stepMilli", "orientation",
  "formId", "validationRevision", "valid", "submitting", "autocomplete",
  "activation", "loopFocus", "controls", "modal", "dismissOnEscape",
  "dismissOnBackdrop", "initialFocus", "returnFocus", "description",
  "anchor", "placement", "offsetMilli", "flip", "shift", "trapFocus",
  "itemCount", "firstVisible", "visibleCount", "overscan",
  "estimatedItemSizeMilli", "axis", "revision", "rowCount", "columnCount",
  "selectionMode", "sortColumn", "sortDirection", "virtualized",
  "politeness", "atomic", "relevant", "style",
]);

function portableControlDataToken(name: string): boolean {
  return portableControlDataTokens.has(name)
    || name.startsWith("option.")
    || name.startsWith("optionOrder.")
    || name.startsWith("selected.");
}

function portableNativeStyleToken(name: string): boolean {
  const base = [
    "columns",
    "width_milli",
    "height_milli",
    "min_width_milli",
    "min_height_milli",
    "max_width_milli",
    "max_height_milli",
    "margin_milli",
    "padding_milli",
    "gap_milli",
    "overflow",
    "color_rgba",
    "background_rgba",
    "border_rgba",
    "border_width_milli",
    "font_family",
    "font_size_milli",
    "font_weight",
    "line_height_milli",
    "direction",
  ];
  if (base.includes(name)) return true;
  const match = /^state\.(hover|focus|pressed|disabled)\.(.+)$/.exec(name);
  return match !== null && [
    "color_rgba",
    "background_rgba",
    "border_rgba",
    "border_width_milli",
    "font_family",
    "font_size_milli",
    "font_weight",
    "line_height_milli",
    "direction",
  ].includes(match[2]!);
}

function portableStyleToken(token: string): boolean {
  if (portableBaseStyleToken(token)) return true;
  for (const prefix of ["hover-", "focus-", "pressed-", "disabled-"]) {
    if (token.startsWith(prefix)) {
      return portableVisualStyleToken(token.slice(prefix.length));
    }
  }
  return false;
}

function portableBaseStyleToken(token: string): boolean {
  return portableVisualStyleToken(token)
    || [
      "display",
      "position",
      "flex-direction",
      "flex-wrap",
      "grid-template-columns",
      "grid-auto-flow",
      "width",
      "height",
      "min-width",
      "min-height",
      "max-width",
      "max-height",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "top",
      "right",
      "bottom",
      "left",
      "gap",
      "align-items",
      "justify-content",
      "align-self",
      "overflow-x",
      "overflow-y",
      "aspect-ratio",
    ].includes(token);
}

function portableVisualStyleToken(token: string): boolean {
  return [
    "color",
    "background-color",
    "border-color",
    "border-width",
    "border-radius",
    "opacity",
    "cursor",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "direction",
    "visibility",
  ].includes(token);
}

function portableDataName(name: string): string {
  const normalized = name.replace(/[^a-zA-Z0-9]/g, "");
  if (normalized.length === 0) throw new RangeError("empty portable data property");
  return normalized[0]!.toUpperCase() + normalized.slice(1);
}

function decodeBoolean(value: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new RangeError("invalid boolean property");
}

function optionalParent(parent: Handle | undefined): { readonly parent?: Handle } {
  return parent === undefined ? {} : { parent };
}

class BoundedReader {
  readonly #bytes: Uint8Array;
  #offset = 0;
  #stringBytes = 0;

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
  }

  u8(): number {
    return this.#take(1)[0]!;
  }

  u32(): number {
    const bytes = this.#take(4);
    return new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, true);
  }

  u64(): bigint {
    const bytes = this.#take(8);
    return new DataView(bytes.buffer, bytes.byteOffset, 8).getBigUint64(0, true);
  }

  handle(): Handle {
    const handle = { index: this.u32(), generation: this.u32() };
    if (!validHandle(handle)) throw new RangeError("invalid UI transaction handle");
    return handle;
  }

  optionalHandle(): Handle | undefined {
    const present = this.u8();
    if (present === 0) return undefined;
    if (present !== 1) throw new RangeError("invalid optional handle tag");
    return this.handle();
  }

  string(): string {
    const length = this.u32();
    const nextStringBytes = this.#stringBytes + length;
    if (!Number.isSafeInteger(nextStringBytes) || nextStringBytes > MAX_STRING_BYTES) {
      throw new RangeError("UI transaction string capacity");
    }
    this.#stringBytes = nextStringBytes;
    return decoder.decode(this.#take(length));
  }

  finish(): void {
    if (this.#offset !== this.#bytes.byteLength) {
      throw new RangeError("UI transaction trailing bytes");
    }
  }

  #take(length: number): Uint8Array {
    const end = this.#offset + length;
    if (!Number.isSafeInteger(end) || end > this.#bytes.byteLength) {
      throw new RangeError("truncated UI transaction");
    }
    const value = this.#bytes.subarray(this.#offset, end);
    this.#offset = end;
    return value;
  }
}

function validHandle(handle: GenerationalHandle): boolean {
  return Number.isInteger(handle.index)
    && handle.index >= 0
    && handle.index < 0xffff_ffff
    && Number.isInteger(handle.generation)
    && handle.generation > 0
    && handle.generation <= 0xffff_ffff;
}

function sameHandle(left: GenerationalHandle, right: GenerationalHandle): boolean {
  return left.index === right.index && left.generation === right.generation;
}

export const DEFAULT_DOM_RENDERER_LIMITS = Object.freeze({
  maxNodes: MAX_NODES_PER_SNAPSHOT,
  maxMutations: MAX_PATCH_OPS,
  maxPropertiesPerNode: 256,
  maxStringBytes: MAX_STRING_BYTES,
  maxPendingCommands: 256,
  maxFutureRevisionWindow: 1024n,
});
