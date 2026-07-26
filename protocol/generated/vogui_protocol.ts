// @generated from framework schema. DO NOT EDIT.
export const SCHEMA_ID = "vogui.ui" as const;
export const PROTOCOL_MAJOR = 1;
export const PROTOCOL_MINOR = 0;
export const SCHEMA_IDENTITY = [170, 77, 1, 40, 73, 81, 15, 167, 46, 145, 6, 79, 113, 43, 133, 209] as const;
export const MAJOR_COMPAT_FINGERPRINT = [181, 26, 19, 162, 79, 63, 168, 175, 167, 128, 105, 18, 33, 50, 111, 184, 246, 83, 238, 6, 168, 79, 143, 249, 54, 63, 17, 246, 108, 114, 45, 199] as const;
export const EXACT_SCHEMA_FINGERPRINT = [85, 106, 224, 27, 73, 227, 12, 130, 248, 134, 115, 46, 117, 88, 51, 35, 40, 204, 22, 3, 131, 71, 161, 21, 123, 41, 214, 165, 207, 8, 240, 19] as const;
export const MAX_EVENT_PAYLOAD_BYTES = 65536;
export const MAX_NODES_PER_SNAPSHOT = 65536;
export const MAX_PACKET_BYTES = 1048576;
export const MAX_PATCH_OPS = 65536;
export const MAX_STRING_BYTES = 262144;
export const enum MessageKind {
  UiSnapshot = 1,
  UiPatch = 2,
  UiEvent = 3,
  UiCommand = 4,
  UiCommandResult = 5,
  UiApplyAck = 6,
  UiSurfaceControl = 7,
  UiResourcePublication = 8,
  UiResourceRetire = 9,
}
export const HEADER_BYTES = 56;
export interface GenerationalHandle { readonly index: number; readonly generation: number; }
export interface FrameworkPacketHeader {
  readonly kind: MessageKind;
  readonly uiSession: GenerationalHandle;
  readonly uiRoot: GenerationalHandle;
  readonly uiRootEpoch: number;
  readonly appCodeEpoch: bigint;
  readonly revision: bigint;
  readonly sequence: bigint;
  readonly payloadLen: number;
}
export interface FrameworkPacket { readonly header: FrameworkPacketHeader; readonly payload: Uint8Array; }
export function messageKindFromWire(value: number): MessageKind | null {
switch (value) {
    case 1: return MessageKind.UiSnapshot;
    case 2: return MessageKind.UiPatch;
    case 3: return MessageKind.UiEvent;
    case 4: return MessageKind.UiCommand;
    case 5: return MessageKind.UiCommandResult;
    case 6: return MessageKind.UiApplyAck;
    case 7: return MessageKind.UiSurfaceControl;
    case 8: return MessageKind.UiResourcePublication;
    case 9: return MessageKind.UiResourceRetire;
    default: return null;
}
}
function requireFrameworkMessageKind(value: number): MessageKind {
const kind = messageKindFromWire(value);
if (kind === null) throw new RangeError("unknown framework message kind");
return kind;
}
export function decodeFrameworkPacket(input: Uint8Array): FrameworkPacket {
if (!(input instanceof Uint8Array)) throw new TypeError("framework packet must be Uint8Array");
if (input.byteLength < HEADER_BYTES) throw new RangeError("truncated framework packet header");
if (input.byteLength > MAX_PACKET_BYTES) throw new RangeError("framework packet exceeds packet limit");
const view = new DataView(input.buffer, input.byteOffset, HEADER_BYTES);
const header: FrameworkPacketHeader = {
    kind: requireFrameworkMessageKind(view.getUint16(0, true)),
    uiSession: readFrameworkHandle(view, 4),
    uiRoot: readFrameworkHandle(view, 12),
    uiRootEpoch: view.getUint32(20, true),
    appCodeEpoch: view.getBigUint64(24, true),
    revision: view.getBigUint64(32, true),
    sequence: view.getBigUint64(40, true),
    payloadLen: view.getUint32(52, true),
  };
  if (header.payloadLen > MAX_PACKET_BYTES - HEADER_BYTES
    || input.byteLength !== HEADER_BYTES + header.payloadLen) {
    throw new RangeError("framework packet payload length mismatch");
}
return { header, payload: input.subarray(HEADER_BYTES) };
}
export function encodeFrameworkPacket(
header: Omit<FrameworkPacketHeader, "payloadLen">,
payload: Uint8Array,
): Uint8Array {
if (!(payload instanceof Uint8Array)) throw new TypeError("framework packet payload must be Uint8Array");
if (payload.byteLength > MAX_PACKET_BYTES - HEADER_BYTES) throw new RangeError("framework packet payload exceeds limit");
const output = new Uint8Array(HEADER_BYTES + payload.byteLength);
const view = new DataView(output.buffer);
  if (messageKindFromWire(header.kind) === null) throw new RangeError("unknown framework message kind");
  view.setUint16(0, header.kind, true);
  writeFrameworkHandle(view, 4, header.uiSession);
  writeFrameworkHandle(view, 12, header.uiRoot);
  validateFrameworkU32(header.uiRootEpoch, "ui_root_epoch");
  view.setUint32(20, header.uiRootEpoch, true);
  validateFrameworkU64(header.appCodeEpoch, "app_code_epoch");
  view.setBigUint64(24, header.appCodeEpoch, true);
  validateFrameworkU64(header.revision, "revision");
  view.setBigUint64(32, header.revision, true);
  validateFrameworkU64(header.sequence, "sequence");
  view.setBigUint64(40, header.sequence, true);
  view.setUint32(52, payload.byteLength, true);
  output.set(payload, HEADER_BYTES);
return output;
}
function readFrameworkHandle(view: DataView, offset: number): GenerationalHandle {
const handle = { index: view.getUint32(offset, true), generation: view.getUint32(offset + 4, true) };
validateFrameworkHandle(handle);
return handle;
}
function writeFrameworkHandle(view: DataView, offset: number, handle: GenerationalHandle): void {
validateFrameworkHandle(handle);
view.setUint32(offset, handle.index, true);
view.setUint32(offset + 4, handle.generation, true);
}
function validateFrameworkHandle(handle: GenerationalHandle): void {
if (!Number.isInteger(handle.index) || handle.index < 0 || handle.index >= 0xffffffff
|| !Number.isInteger(handle.generation) || handle.generation < 1 || handle.generation > 0xffffffff) {
throw new RangeError("invalid framework packet handle");
}
}
function validateFrameworkU16(value: number, label: string): void {
if (!Number.isInteger(value) || value < 0 || value > 0xffff) throw new RangeError(`invalid ${label}`);
}
function validateFrameworkU32(value: number, label: string): void {
if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) throw new RangeError(`invalid ${label}`);
}
function validateFrameworkU64(value: bigint, label: string): void {
if (typeof value !== "bigint" || value < 0n || value > 0xffffffffffffffffn) throw new RangeError(`invalid ${label}`);
}
