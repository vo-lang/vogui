const WINDOW_COMMAND_MAGIC = 0x31435756;
const DOCUMENT_HEAD_MAGIC = 0x31484456;

export interface DocumentHeadEntry {
  readonly key: string;
  readonly tag: "meta" | "link" | "style" | "script";
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string;
}

export interface DocumentHeadDescriptor {
  readonly revision: bigint;
  readonly title: string;
  readonly language: string;
  readonly direction: "" | "ltr" | "rtl" | "auto";
  readonly entries: readonly DocumentHeadEntry[];
}

export type WindowCommand =
  | { readonly kind: "title"; readonly title: string }
  | { readonly kind: "focus" }
  | { readonly kind: "blur" }
  | { readonly kind: "cursor"; readonly cursor: string }
  | { readonly kind: "fullscreen" }
  | { readonly kind: "exit-fullscreen" }
  | { readonly kind: "document-head"; readonly head: DocumentHeadDescriptor };

export type WindowCommandOutcome =
  | { readonly kind: "completed"; readonly payload: Uint8Array }
  | { readonly kind: "denied"; readonly message: string }
  | { readonly kind: "unsupported"; readonly message: string }
  | { readonly kind: "failed"; readonly message: string };

export interface BrowserDocumentHostLimits {
  readonly maxCommandBytes: number;
  readonly maxHeadEntries: number;
  readonly maxStringBytes: number;
}

export class BrowserDocumentHost {
  readonly #window: Window;
  readonly #document: Document;
  readonly #limits: BrowserDocumentHostLimits;
  readonly #owner: string;
  #revision = 0n;
  #closed = false;

  constructor(
    window: Window,
    limits: BrowserDocumentHostLimits,
    owner = "default",
  ) {
    if (
      !Number.isSafeInteger(limits.maxCommandBytes)
      || limits.maxCommandBytes <= 0
      || !Number.isSafeInteger(limits.maxHeadEntries)
      || limits.maxHeadEntries <= 0
      || !Number.isSafeInteger(limits.maxStringBytes)
      || limits.maxStringBytes <= 0
      || owner.length === 0
    ) {
      throw new Error("invalid browser document host configuration");
    }
    this.#window = window;
    this.#document = window.document;
    this.#limits = limits;
    this.#owner = owner;
  }

  get revision(): bigint {
    return this.#revision;
  }

  async execute(payload: Uint8Array): Promise<WindowCommandOutcome> {
    if (this.#closed) return { kind: "failed", message: "document host closed" };
    if (payload.byteLength > this.#limits.maxCommandBytes) {
      return { kind: "failed", message: "window command capacity exceeded" };
    }
    let command: WindowCommand;
    try {
      command = decodeWindowCommand(payload, this.#limits);
    } catch (error) {
      return { kind: "failed", message: errorMessage(error) };
    }
    try {
      switch (command.kind) {
        case "title":
          this.#document.title = command.title;
          break;
        case "focus":
          this.#window.focus();
          break;
        case "blur":
          this.#window.blur();
          break;
        case "cursor":
          this.#document.documentElement.style.cursor = command.cursor;
          break;
        case "fullscreen":
          if (this.#document.documentElement.requestFullscreen === undefined) {
            return { kind: "unsupported", message: "fullscreen unsupported" };
          }
          await this.#document.documentElement.requestFullscreen();
          break;
        case "exit-fullscreen":
          if (this.#document.exitFullscreen === undefined) {
            return { kind: "unsupported", message: "fullscreen unsupported" };
          }
          if (this.#document.fullscreenElement !== null) await this.#document.exitFullscreen();
          break;
        case "document-head":
          this.#replaceHead(command.head);
          break;
      }
      return { kind: "completed", payload: new Uint8Array() };
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        return { kind: "denied", message: error.message };
      }
      return { kind: "failed", message: errorMessage(error) };
    }
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    for (const element of this.#ownedHeadElements()) element.remove();
    this.#document.documentElement.style.cursor = "";
  }

  #replaceHead(head: DocumentHeadDescriptor): void {
    if (head.revision <= this.#revision) throw new Error("stale document head revision");
    const fragment = this.#document.createDocumentFragment();
    for (const entry of head.entries) {
      const element = this.#document.createElement(entry.tag);
      element.setAttribute("data-vogui-head-owner", this.#owner);
      element.setAttribute("data-vogui-head-key", entry.key);
      for (const [name, value] of Object.entries(entry.attributes)) {
        element.setAttribute(name, value);
      }
      if (entry.text.length > 0) element.textContent = entry.text;
      fragment.appendChild(element);
    }
    for (const element of this.#ownedHeadElements()) element.remove();
    this.#document.head.appendChild(fragment);
    this.#document.title = head.title;
    setOptionalAttribute(this.#document.documentElement, "lang", head.language);
    setOptionalAttribute(this.#document.documentElement, "dir", head.direction);
    this.#revision = head.revision;
  }

  #ownedHeadElements(): Element[] {
    return [...this.#document.head.querySelectorAll("[data-vogui-head-owner]")]
      .filter((element) => element.getAttribute("data-vogui-head-owner") === this.#owner);
  }
}

export function decodeWindowCommand(
  payload: Uint8Array,
  limits: BrowserDocumentHostLimits,
): WindowCommand {
  const reader = new BinaryReader(payload);
  if (reader.u32() !== WINDOW_COMMAND_MAGIC) throw new Error("invalid window command magic");
  const commandBytes = reader.u16();
  const argumentBytes = reader.u32();
  if (commandBytes === 0 || commandBytes > 128 || argumentBytes > limits.maxStringBytes) {
    throw new Error("invalid window command lengths");
  }
  const command = reader.text(commandBytes);
  const argument = reader.bytes(argumentBytes);
  reader.finish();
  switch (command) {
    case "title":
      return { kind: "title", title: decodeText(argument) };
    case "focus":
    case "blur":
    case "fullscreen":
    case "exit-fullscreen":
      if (argument.byteLength !== 0) throw new Error("unexpected window command argument");
      return { kind: command };
    case "cursor":
      return { kind: "cursor", cursor: decodeText(argument) };
    case "document-head":
      return { kind: "document-head", head: decodeDocumentHead(argument, limits) };
    default:
      throw new Error(`unsupported window command ${command}`);
  }
}

export function encodeDocumentHead(head: DocumentHeadDescriptor): Uint8Array {
  if (head.revision <= 0n || head.entries.length > 0xffff) {
    throw new Error("invalid document head descriptor");
  }
  const writer = new BinaryWriter();
  writer.u32(DOCUMENT_HEAD_MAGIC);
  writer.u64(head.revision);
  writer.text32(head.title);
  writer.text32(head.language);
  writer.text32(head.direction);
  writer.u16(head.entries.length);
  for (const entry of head.entries) {
    writer.text16(entry.key);
    writer.u8(headTagCode(entry.tag));
    const attributes = Object.entries(entry.attributes).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    if (attributes.length > 0xffff) throw new Error("document head attribute capacity exceeded");
    writer.u16(attributes.length);
    for (const [name, value] of attributes) {
      writer.text16(name);
      writer.text32(value);
    }
    writer.text32(entry.text);
  }
  return writer.finish();
}

export function decodeDocumentHead(
  bytes: Uint8Array,
  limits: Pick<BrowserDocumentHostLimits, "maxHeadEntries" | "maxStringBytes">,
): DocumentHeadDescriptor {
  const reader = new BinaryReader(bytes);
  if (reader.u32() !== DOCUMENT_HEAD_MAGIC) throw new Error("invalid document head magic");
  const revision = reader.u64();
  if (revision === 0n) throw new Error("invalid document head revision");
  let stringBytes = 0;
  const text32 = (): string => {
    const length = reader.u32();
    stringBytes += length;
    if (stringBytes > limits.maxStringBytes) throw new Error("document head string capacity exceeded");
    return reader.text(length);
  };
  const text16 = (): string => {
    const length = reader.u16();
    stringBytes += length;
    if (stringBytes > limits.maxStringBytes) throw new Error("document head string capacity exceeded");
    return reader.text(length);
  };
  const title = text32();
  const language = text32();
  const direction = text32();
  if (direction !== "" && direction !== "ltr" && direction !== "rtl" && direction !== "auto") {
    throw new Error("invalid document direction");
  }
  const entryCount = reader.u16();
  if (entryCount > limits.maxHeadEntries) throw new Error("document head entry capacity exceeded");
  const keys = new Set<string>();
  const entries: DocumentHeadEntry[] = [];
  for (let index = 0; index < entryCount; index += 1) {
    const key = text16();
    if (key.length === 0 || keys.has(key)) throw new Error("invalid document head key");
    keys.add(key);
    const tag = decodeHeadTag(reader.u8());
    const attributeCount = reader.u16();
    const attributes: Record<string, string> = {};
    for (let attribute = 0; attribute < attributeCount; attribute += 1) {
      const name = text16();
      if (name.length === 0 || Object.hasOwn(attributes, name)) {
        throw new Error("invalid document head attribute");
      }
      attributes[name] = text32();
    }
    entries.push({ key, tag, attributes, text: text32() });
  }
  reader.finish();
  return { revision, title, language, direction, entries };
}

function headTagCode(tag: DocumentHeadEntry["tag"]): number {
  return tag === "meta" ? 1 : tag === "link" ? 2 : tag === "style" ? 3 : 4;
}

function decodeHeadTag(code: number): DocumentHeadEntry["tag"] {
  if (code === 1) return "meta";
  if (code === 2) return "link";
  if (code === 3) return "style";
  if (code === 4) return "script";
  throw new Error("invalid document head tag");
}

function setOptionalAttribute(element: Element, name: string, value: string): void {
  if (value.length === 0) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

class BinaryReader {
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
    const value = this.#view.getUint16(this.#offset, true);
    this.take(2);
    return value;
  }

  u32(): number {
    const value = this.#view.getUint32(this.#offset, true);
    this.take(4);
    return value;
  }

  u64(): bigint {
    const value = this.#view.getBigUint64(this.#offset, true);
    this.take(8);
    return value;
  }

  bytes(length: number): Uint8Array {
    return this.take(length);
  }

  text(length: number): string {
    return decodeText(this.take(length));
  }

  finish(): void {
    if (this.#offset !== this.#bytes.byteLength) throw new Error("trailing document host bytes");
  }

  private take(length: number): Uint8Array {
    if (!Number.isSafeInteger(length) || length < 0 || this.#offset + length > this.#bytes.byteLength) {
      throw new Error("truncated document host payload");
    }
    const value = this.#bytes.subarray(this.#offset, this.#offset + length);
    this.#offset += length;
    return value;
  }
}

class BinaryWriter {
  readonly #chunks: Uint8Array[] = [];
  #length = 0;

  u8(value: number): void {
    this.push(Uint8Array.of(value));
  }

  u16(value: number): void {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    this.push(bytes);
  }

  u32(value: number): void {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    this.push(bytes);
  }

  u64(value: bigint): void {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigUint64(0, value, true);
    this.push(bytes);
  }

  text16(value: string): void {
    const bytes = new TextEncoder().encode(value);
    if (bytes.byteLength > 0xffff) throw new Error("document head string too long");
    this.u16(bytes.byteLength);
    this.push(bytes);
  }

  text32(value: string): void {
    const bytes = new TextEncoder().encode(value);
    this.u32(bytes.byteLength);
    this.push(bytes);
  }

  finish(): Uint8Array {
    const output = new Uint8Array(this.#length);
    let offset = 0;
    for (const chunk of this.#chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output;
  }

  private push(bytes: Uint8Array): void {
    this.#chunks.push(bytes);
    this.#length += bytes.byteLength;
  }
}
