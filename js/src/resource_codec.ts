import {
  MessageKind,
  type FrameworkPacketHeader,
} from "../../protocol/generated/vogui_protocol.js";
import type {
  DomRendererIdentity,
  DomResourcePublicationChunk,
  Handle,
} from "./dom_renderer.js";

const PUBLICATION_PREFIX_BYTES = 66;

export function decodeResourcePublication(
  header: FrameworkPacketHeader,
  payload: Uint8Array,
  rendererGeneration: Handle,
): DomResourcePublicationChunk {
  if (header.kind !== MessageKind.UiResourcePublication) {
    throw new RangeError("expected a UI resource publication packet");
  }
  if (payload.byteLength < PUBLICATION_PREFIX_BYTES) {
    throw new RangeError("truncated UI resource publication");
  }
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const resource = {
    index: view.getUint32(0, true),
    generation: view.getUint32(4, true),
  };
  const sourceRevision = view.getBigUint64(8, true);
  const resourceKind = view.getUint8(16);
  const contentHash = payload.slice(17, 49);
  const totalBytes = view.getUint32(49, true);
  const metadataBytes = view.getUint32(53, true);
  const offset = view.getUint32(57, true);
  const chunkBytes = view.getUint32(61, true);
  const finalTag = view.getUint8(65);
  const inlineMetadataBytes = offset === 0 ? metadataBytes : 0;
  const expected = PUBLICATION_PREFIX_BYTES + inlineMetadataBytes + chunkBytes;
  if (
    resource.index === 0xffff_ffff
    || resource.generation === 0
    || sourceRevision === 0n
    || resourceKind < 1
    || resourceKind > 6
    || totalBytes === 0
    || offset > totalBytes
    || chunkBytes > totalBytes - offset
    || (finalTag !== 0 && finalTag !== 1)
    || (finalTag === 1) !== (offset + chunkBytes === totalBytes)
    || expected !== payload.byteLength
  ) {
    throw new RangeError("invalid UI resource publication");
  }
  const metadataStart = PUBLICATION_PREFIX_BYTES;
  const chunkStart = metadataStart + inlineMetadataBytes;
  const identity: DomRendererIdentity = {
    session: header.uiSession,
    root: header.uiRoot,
    uiRootEpoch: header.uiRootEpoch,
    appCodeEpoch: header.appCodeEpoch,
    rendererGeneration,
  };
  return {
    identity,
    commitRevision: header.revision,
    sequence: header.sequence,
    resource,
    sourceRevision,
    resourceKind,
    contentHash,
    totalBytes,
    metadataBytes,
    offset,
    final: finalTag === 1,
    metadata: payload.slice(metadataStart, chunkStart),
    bytes: payload.slice(chunkStart),
  };
}

export function decodeResourceRetire(
  header: FrameworkPacketHeader,
  payload: Uint8Array,
  rendererGeneration: Handle,
): {
  readonly identity: DomRendererIdentity;
  readonly commitRevision: bigint;
  readonly resource: Handle;
  readonly sourceRevision: bigint;
} {
  if (header.kind !== MessageKind.UiResourceRetire || payload.byteLength !== 16) {
    throw new RangeError("invalid UI resource retirement packet");
  }
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const resource = {
    index: view.getUint32(0, true),
    generation: view.getUint32(4, true),
  };
  const sourceRevision = view.getBigUint64(8, true);
  if (resource.index === 0xffff_ffff || resource.generation === 0 || sourceRevision === 0n) {
    throw new RangeError("invalid UI resource retirement identity");
  }
  return {
    identity: {
      session: header.uiSession,
      root: header.uiRoot,
      uiRootEpoch: header.uiRootEpoch,
      appCodeEpoch: header.appCodeEpoch,
      rendererGeneration,
    },
    commitRevision: header.revision,
    resource,
    sourceRevision,
  };
}
