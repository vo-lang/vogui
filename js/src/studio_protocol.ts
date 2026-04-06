// VoGUI Studio Protocol — lightweight render bytes parser for metadata extraction.
// Loaded by Studio via blob URL. Bundles only the binary decoder and query logic.
//
// Contract: { findExternalWidgetHandlerId }

import { decodeBinaryRender } from './decoder';
import { findExternalWidgetHandlerId as findInMessage } from './query';

export function findExternalWidgetHandlerId(bytes: Uint8Array): number | null {
  return findInMessage(decodeBinaryRender(bytes));
}
