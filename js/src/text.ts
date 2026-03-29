// Text measurement using Pretext — pure JS multiline text layout.
// Provides binary-encoded results for efficient Vo↔JS transfer.

import { prepare, prepareWithSegments, layout, layoutWithLines } from '@chenglou/pretext';

// ── Prepare cache ─────────────────────────────────────────────────────────────
// Keyed on font + text. LRU eviction at 500 entries.

const prepareCache = new Map<string, ReturnType<typeof prepare>>();
const prepareSegCache = new Map<string, ReturnType<typeof prepareWithSegments>>();
const CACHE_MAX = 500;

function cacheKey(text: string, font: string): string {
    return `${font}\0${text}`;
}

function evictOldest<V>(map: Map<string, V>): void {
    if (map.size >= CACHE_MAX) {
        const first = map.keys().next().value!;
        map.delete(first);
    }
}

function touchCacheEntry<V>(map: Map<string, V>, key: string, value: V): V {
    map.delete(key);
    map.set(key, value);
    return value;
}

type WhiteSpaceOption = { whiteSpace?: 'normal' | 'pre-wrap' };

function wsOption(whiteSpace: number): WhiteSpaceOption | undefined {
    return whiteSpace === 1 ? { whiteSpace: 'pre-wrap' } : undefined;
}

function getPrepared(text: string, font: string, ws: number = 0): ReturnType<typeof prepare> {
    const key = `${ws}\0${cacheKey(text, font)}`;
    let p = prepareCache.get(key);
    if (p) return touchCacheEntry(prepareCache, key, p);
    p = prepare(text, font, wsOption(ws));
    evictOldest(prepareCache);
    prepareCache.set(key, p);
    return p;
}

function getPreparedWithSegments(text: string, font: string, ws: number = 0): ReturnType<typeof prepareWithSegments> {
    const key = `${ws}\0${cacheKey(text, font)}`;
    let p = prepareSegCache.get(key);
    if (p) return touchCacheEntry(prepareSegCache, key, p);
    p = prepareWithSegments(text, font, wsOption(ws));
    evictOldest(prepareSegCache);
    prepareSegCache.set(key, p);
    return p;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Measure text height and line count.
 * Returns binary: [f64 LE height][i32 LE lineCount] = 12 bytes.
 */
export function measureText(
    text: string, font: string, maxWidth: number, lineHeight: number,
    whiteSpace: number = 0,
): Uint8Array {
    const p = getPrepared(text, font, whiteSpace);
    const result = layout(p, maxWidth, lineHeight);
    const buf = new ArrayBuffer(12);
    const view = new DataView(buf);
    view.setFloat64(0, result.height, true);
    view.setInt32(8, result.lineCount, true);
    return new Uint8Array(buf);
}

/**
 * Measure text and return per-line info.
 * Binary format:
 *   [f64 LE height]      8 bytes
 *   [i32 LE lineCount]   4 bytes
 *   [i32 LE numLines]    4 bytes
 *   per line:
 *     [u16 LE textLen]   2 bytes
 *     [u8[] text]         textLen bytes
 *     [f64 LE width]     8 bytes
 */
export function measureTextLines(
    text: string, font: string, maxWidth: number, lineHeight: number,
    whiteSpace: number = 0,
): Uint8Array {
    const p = getPreparedWithSegments(text, font, whiteSpace);
    const result = layoutWithLines(p, maxWidth, lineHeight);
    const encoder = new TextEncoder();
    const encoded = result.lines.map((l: any) => encoder.encode(l.text));

    // Calculate total size
    let size = 8 + 4 + 4; // height + lineCount + numLines
    for (const e of encoded) {
        size += 2 + e.length + 8; // u16 len + text bytes + f64 width
    }

    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    const bytes = new Uint8Array(buf);
    let off = 0;

    view.setFloat64(off, result.height, true); off += 8;
    view.setInt32(off, result.lineCount, true); off += 4;
    view.setInt32(off, result.lines.length, true); off += 4;

    for (let i = 0; i < result.lines.length; i++) {
        const line = result.lines[i] as any;
        const enc = encoded[i];
        view.setUint16(off, enc.length, true); off += 2;
        bytes.set(enc, off); off += enc.length;
        view.setFloat64(off, line.width, true); off += 8;
    }

    return new Uint8Array(buf, 0, off);
}

/**
 * Fill text with word wrapping on a Canvas 2D context.
 * Uses Pretext for line breaking, then draws each line with ctx.fillText.
 */
export function fillTextWrap(
    ctx: CanvasRenderingContext2D,
    text: string, x: number, y: number, maxWidth: number, lineHeight: number,
): void {
    const font = ctx.font;
    const p = getPreparedWithSegments(text, font);
    const { lines } = layoutWithLines(p, maxWidth, lineHeight);
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText((lines[i] as any).text, x, y + i * lineHeight);
    }
}
