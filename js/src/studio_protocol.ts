// VoGUI Studio Protocol — lightweight render bytes parser for metadata extraction.
// Loaded by Studio via blob URL. Bundles only the binary decoder and query logic.
//
// Contract: { findHostWidgetHandlerId }

import { decodeBinaryRender } from './decoder';
import { findHostWidgetHandlerId as findInMessage } from './query';

export function findHostWidgetHandlerId(bytes: Uint8Array): number | null {
  return findInMessage(decodeBinaryRender(bytes));
}
