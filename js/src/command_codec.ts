import type {
  DomCommand,
  DomCommandKind,
  DomRendererIdentity,
  Handle,
} from "./dom_renderer.js";
import {
  MessageKind,
  type FrameworkPacketHeader,
} from "../../protocol/generated/vogui_protocol.js";

const COMMAND_PREFIX_BYTES = 34;

export function decodeDomCommand(
  header: FrameworkPacketHeader,
  payload: Uint8Array,
  identity: DomRendererIdentity,
): DomCommand {
  if (header.kind !== MessageKind.UiCommand) {
    throw new RangeError("framework packet is not a Vogui command");
  }
  if (payload.byteLength < COMMAND_PREFIX_BYTES) {
    throw new RangeError("truncated Vogui command");
  }
  const reader = new CommandReader(payload);
  const requestId = reader.u64();
  const target = reader.handle();
  const expectedBindingGeneration = reader.u32();
  const deadlineMillis = reader.u64();
  const kind = reader.string16();
  const commandPayload = reader.bytes32();
  reader.finish();
  if (requestId !== header.sequence) {
    throw new RangeError("Vogui command request/sequence mismatch");
  }
  const command = decodeCommandKind(kind, commandPayload);
  if (command.kind === "beginAnimation") {
    const animation = new DataView(
      commandPayload.buffer,
      commandPayload.byteOffset,
      commandPayload.byteLength,
    );
    if (
      animation.getUint32(28, true) !== expectedBindingGeneration
      || animation.getBigUint64(32, true) !== header.revision
      || animation.getBigUint64(40, true) !== deadlineMillis
    ) {
      throw new RangeError("Vogui animation barrier does not match its command envelope");
    }
  }
  if (
    (command.kind === "beginAnimation" || command.kind === "cancelAnimation")
    && (
      command.animationRoot.index !== header.uiRoot.index
      || command.animationRoot.generation !== header.uiRoot.generation
      || command.animationNode.index !== target.index
      || command.animationNode.generation !== target.generation
    )
  ) {
    throw new RangeError("Vogui animation command identity does not match its command envelope");
  }
  return {
    identity,
    requestId,
    sequence: header.sequence,
    deadlineMillis,
    minAppliedRevision: header.revision,
    target,
    expectedBindingGeneration,
    command,
  };
}

function decodeCommandKind(kind: string, payload: Uint8Array): DomCommandKind {
  switch (kind) {
    case "focus":
      if (payload.byteLength === 0) return { kind: "focus", preventScroll: false };
      if (payload.byteLength === 1 && payload[0]! <= 1) {
        return { kind: "focus", preventScroll: payload[0]! === 1 };
      }
      break;
    case "blur":
      if (payload.byteLength === 0) return { kind: "blur" };
      break;
    case "scroll":
    case "scrollIntoView":
      if (payload.byteLength === 0) {
        return { kind: "scrollIntoView", block: "nearest", inline: "nearest" };
      }
      if (payload.byteLength === 2) {
        return {
          kind: "scrollIntoView",
          block: scrollPosition(payload[0]!),
          inline: scrollPosition(payload[1]!),
        };
      }
      break;
    case "measure":
      if (payload.byteLength === 0) return { kind: "measure" };
      break;
    case "selection":
    case "setSelection":
      if (payload.byteLength === 8) {
        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
        return {
          kind: "setSelection",
          startUtf8: view.getUint32(0, true),
          endUtf8: view.getUint32(4, true),
        };
      }
      break;
    case "cancelComposition":
      if (payload.byteLength === 0) return { kind: "cancelComposition" };
      break;
    case "animation.begin":
      return decodeAnimationBegin(payload);
    case "animation.cancel":
      return decodeAnimationCancel(payload);
  }
  return { kind: "unsupported", name: kind, payload: new Uint8Array(payload) };
}

function decodeAnimationBegin(payload: Uint8Array): DomCommandKind {
  const magic = payload.byteLength < 4 ? "" : ascii(payload, 0, 4);
  if (magic === "VGA2") return decodeAnimationBeginV2(payload);
  if (payload.byteLength !== 88 || magic !== "VGA1") {
    return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
  }
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const identity = animationIdentity(view, 4);
  const property = view.getUint32(48, true);
  const fromMilli = view.getBigInt64(52, true);
  const toMilli = view.getBigInt64(60, true);
  const durationMillis = view.getBigUint64(68, true);
  const delayMillis = view.getBigUint64(76, true);
  const easing = view.getUint32(84, true);
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  if (
    property === 0
    || fromMilli < -maxSafe
    || fromMilli > maxSafe
    || toMilli < -maxSafe
    || toMilli > maxSafe
    || durationMillis === 0n
    || durationMillis > maxSafe
    || delayMillis > maxSafe
    || easing === 0
  ) {
    return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
  }
  return {
    kind: "beginAnimation",
    ...identity,
    property,
    curve: 1,
    values: [
      { offset: 0, valueMilli: fromMilli },
      { offset: 1, valueMilli: toMilli },
    ],
    fromMilli,
    toMilli,
    durationMillis,
    delayMillis,
    easing,
  };
}

function decodeAnimationBeginV2(payload: Uint8Array): DomCommandKind {
  if (payload.byteLength < 72) {
    return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
  }
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const identity = animationIdentity(view, 4);
  const property = view.getUint32(48, true);
  const curve = view.getUint8(52);
  const reserved = view.getUint8(53);
  const frameCount = view.getUint16(54, true);
  const delayMillis = view.getBigUint64(56, true);
  const durationMillis = view.getBigUint64(64, true);
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  if (
    property < 1
    || property > 11
    || curve < 1
    || curve > 3
    || reserved !== 0
    || durationMillis === 0n
    || durationMillis > maxSafe
    || delayMillis > maxSafe
  ) {
    return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
  }
  let values: readonly { readonly offset: number; readonly valueMilli: bigint }[];
  let easing = 1;
  let fromMilli = 0n;
  let toMilli = 0n;
  if (curve === 1) {
    if (frameCount !== 0 || payload.byteLength !== 92) {
      return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
    }
    fromMilli = view.getBigInt64(72, true);
    toMilli = view.getBigInt64(80, true);
    easing = view.getUint32(88, true);
    if (easing < 1 || easing > 4) {
      return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
    }
    values = [
      { offset: 0, valueMilli: fromMilli },
      { offset: 1, valueMilli: toMilli },
    ];
  } else if (curve === 2) {
    if (
      frameCount < 2
      || frameCount > 256
      || payload.byteLength !== 72 + frameCount * 12
    ) {
      return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
    }
    const decoded = [];
    let previous = -1;
    for (let index = 0; index < frameCount; index += 1) {
      const offset = 72 + index * 12;
      const offsetMilli = view.getUint16(offset, true);
      if (
        view.getUint16(offset + 2, true) !== 0
        || offsetMilli <= previous
        || (index === 0 && offsetMilli !== 0)
        || (index === frameCount - 1 && offsetMilli !== 1000)
      ) {
        return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
      }
      previous = offsetMilli;
      const valueMilli = view.getBigInt64(offset + 4, true);
      if (valueMilli < -maxSafe || valueMilli > maxSafe) {
        return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
      }
      decoded.push({
        offset: offsetMilli / 1000,
        valueMilli,
      });
    }
    values = decoded;
    fromMilli = decoded[0]!.valueMilli;
    toMilli = decoded[decoded.length - 1]!.valueMilli;
  } else {
    if (frameCount !== 0 || payload.byteLength !== 100) {
      return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
    }
    fromMilli = view.getBigInt64(72, true);
    toMilli = view.getBigInt64(80, true);
    const stiffnessMilli = view.getUint32(88, true);
    const dampingMilli = view.getUint32(92, true);
    const massMilli = view.getUint32(96, true);
    if (
      stiffnessMilli === 0
      || dampingMilli === 0
      || massMilli === 0
      || fromMilli < -maxSafe
      || fromMilli > maxSafe
      || toMilli < -maxSafe
      || toMilli > maxSafe
    ) {
      return { kind: "unsupported", name: "animation.begin", payload: new Uint8Array(payload) };
    }
    values = springAnimationValues(
      fromMilli,
      toMilli,
      durationMillis,
      stiffnessMilli,
      dampingMilli,
      massMilli,
    );
  }
  return {
    kind: "beginAnimation",
    ...identity,
    property,
    curve: curve as 1 | 2 | 3,
    values,
    fromMilli,
    toMilli,
    durationMillis,
    delayMillis,
    easing,
  };
}

function springAnimationValues(
  fromMilli: bigint,
  toMilli: bigint,
  durationMillis: bigint,
  stiffnessMilli: number,
  dampingMilli: number,
  massMilli: number,
): readonly { readonly offset: number; readonly valueMilli: bigint }[] {
  let value = Number(fromMilli);
  const target = Number(toMilli);
  let velocity = 0;
  if (!Number.isSafeInteger(value) || !Number.isSafeInteger(target)) {
    throw new RangeError("spring animation value exceeds browser range");
  }
  const stiffness = stiffnessMilli / 1000;
  const damping = dampingMilli / 1000;
  const mass = massMilli / 1000;
  const steps = 60;
  const deltaSeconds = Number(durationMillis) / 1000 / steps;
  const values = [{ offset: 0, valueMilli: fromMilli }];
  for (let index = 1; index < steps; index += 1) {
    const acceleration = (-stiffness * (value - target) - damping * velocity) / mass;
    velocity += acceleration * deltaSeconds;
    value += velocity * deltaSeconds;
    if (!Number.isFinite(value)) throw new RangeError("spring animation diverged");
    values.push({ offset: index / steps, valueMilli: BigInt(Math.round(value)) });
  }
  values.push({ offset: 1, valueMilli: toMilli });
  return values;
}

function decodeAnimationCancel(payload: Uint8Array): DomCommandKind {
  if (payload.byteLength !== 28 || ascii(payload, 0, 4) !== "VGI1") {
    return { kind: "unsupported", name: "animation.cancel", payload: new Uint8Array(payload) };
  }
  return {
    kind: "cancelAnimation",
    ...animationIdentity(
      new DataView(payload.buffer, payload.byteOffset, payload.byteLength),
      4,
    ),
  };
}

function animationIdentity(
  view: DataView,
  offset: number,
): { animationKey: string; animationRoot: Handle; animationNode: Handle } {
  const values: number[] = [];
  for (let index = 0; index < 6; index += 1) values.push(view.getUint32(offset + index * 4, true));
  if (values[1] === 0 || values[3] === 0 || values[5] === 0) {
    throw new RangeError("invalid Vogui animation identity");
  }
  return {
    animationKey: values.join(":"),
    animationRoot: { index: values[0]!, generation: values[1]! },
    animationNode: { index: values[2]!, generation: values[3]! },
  };
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function scrollPosition(value: number): ScrollLogicalPosition {
  switch (value) {
    case 1:
      return "start";
    case 2:
      return "center";
    case 3:
      return "end";
    case 4:
      return "nearest";
    default:
      throw new RangeError("invalid Vogui scroll position");
  }
}

class CommandReader {
  #offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  u16(): number {
    return this.takeView(2).getUint16(0, true);
  }

  u32(): number {
    return this.takeView(4).getUint32(0, true);
  }

  u64(): bigint {
    return this.takeView(8).getBigUint64(0, true);
  }

  handle(): Handle {
    const handle = { index: this.u32(), generation: this.u32() };
    if (handle.index === 0xffffffff || handle.generation === 0) {
      throw new RangeError("invalid Vogui command handle");
    }
    return handle;
  }

  string16(): string {
    const bytes = this.take(this.u16());
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }

  bytes32(): Uint8Array {
    return this.take(this.u32());
  }

  finish(): void {
    if (this.#offset !== this.bytes.byteLength) {
      throw new RangeError("trailing Vogui command bytes");
    }
  }

  private take(length: number): Uint8Array {
    const end = this.#offset + length;
    if (!Number.isSafeInteger(end) || end > this.bytes.byteLength) {
      throw new RangeError("truncated Vogui command payload");
    }
    const value = this.bytes.subarray(this.#offset, end);
    this.#offset = end;
    return value;
  }

  private takeView(length: number): DataView {
    const value = this.take(length);
    return new DataView(value.buffer, value.byteOffset, value.byteLength);
  }
}
