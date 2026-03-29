# VoGUI Text Measurement & Canvas Text Layout — Design Document

## Status: Draft (pending review)

## Problem Statement

VoGUI's Vo-side code has **zero knowledge of text physical dimensions**. All text
rendering is delegated to the browser via DOM nodes (`<span>`, `<h1>`, `<p>`, etc.)
or single-line `CanvasCtx.FillText`. This means:

1. **No virtual scroll** — `ForEach`/`ForRange` emits all items as DOM nodes; for a
   1000-item chat, that's 1000 DOM nodes. Proper virtualization requires knowing each
   item's pixel height before rendering.
2. **No Canvas multi-line text** — `CanvasCtx.FillText` draws a single line. Canvas 2D
   has no word-wrap. Game UIs (dialogue boxes, HUDs, labels) need multi-line text.
3. **No text-aware layout decisions** — truncation/ellipsis, shrink-wrap containers,
   masonry, balanced text, layout shift prevention all need text height prediction.

## Solution: Integrate Pretext as the text measurement engine

[Pretext](https://github.com/chenglou/pretext) is a pure JS/TS library that measures
and lays out multiline text without touching the DOM. It uses `canvas.measureText` as
ground truth, then does pure arithmetic for layout. It supports all languages (CJK,
bidi, emoji).

Key Pretext APIs we'll use:
- `prepare(text, font, options?)` — one-time text analysis + segment measurement
- `layout(prepared, maxWidth, lineHeight)` — returns `{ height, lineCount }`
- `prepareWithSegments(text, font, options?)` — richer structure for line-level access
- `layoutWithLines(prepared, maxWidth, lineHeight)` — returns individual lines
- `walkLineRanges(prepared, maxWidth, onLine)` — callback per line without allocating strings

## Architecture

```
┌─────────────────────────────────────┐
│  Vo code                            │
│                                     │
│  result := vogui.MeasureText(...)   │
│  ctx.FillTextWrap(text, x, y, ...) │
│  vogui.VirtualScroll(...)           │
└────────────┬────────────────────────┘
             │ extern call
             ▼
┌─────────────────────────────────────┐
│  Rust extern bridge                 │
│  (vogui/rust/ext/src/externs.rs     │
│   + standalone.rs)                  │
│                                     │
│  Synchronous: Vo → Rust → JS → Vo  │
│  Returns: height, lineCount, lines  │
└────────────┬────────────────────────┘
             │ host import (standalone)
             │ or wasm_bindgen (linked)
             ▼
┌─────────────────────────────────────┐
│  JS runtime                         │
│  (vogui/js/src/text.ts)             │
│                                     │
│  import { prepare, layout,          │
│    prepareWithSegments,             │
│    layoutWithLines } from pretext   │
│                                     │
│  host_measure_text(...)             │
│  host_measure_text_lines(...)       │
│  Canvas cmd "ftw" for FillTextWrap  │
└─────────────────────────────────────┘
```

## Detailed Design

### Layer 1: Vo Public API (`vogui/text.vo`)

New file `text.vo` in the vogui package:

```vo
package vogui

// TextMetrics contains the result of text measurement.
type TextMetrics struct {
    Height    float64  // Total pixel height of the text block
    LineCount int      // Number of lines after wrapping
}

// TextLine contains information about a single wrapped line.
type TextLine struct {
    Text  string   // The text content of this line
    Width float64  // Measured pixel width of this line
}

// TextLineMetrics contains full line-level measurement results.
type TextLineMetrics struct {
    Height    float64    // Total pixel height
    LineCount int        // Number of lines
    Lines     []TextLine // Per-line text and width
}

// MeasureText measures the height and line count of text wrapped to a given width.
//
// font is a CSS font shorthand string, e.g. "16px Inter", "bold 14px sans-serif".
// maxWidth is the maximum line width in pixels.
// lineHeight is the line height in pixels.
//
//   m := vogui.MeasureText("Hello world, this is a long paragraph...", "16px Inter", 300, 20)
//   fmt.Println(m.Height, m.LineCount)
func MeasureText(text string, font string, maxWidth float64, lineHeight float64) TextMetrics {
    height, lineCount := measureText(text, font, maxWidth, lineHeight)
    return TextMetrics{Height: height, LineCount: lineCount}
}

// MeasureTextLines measures text and returns per-line information.
// Use this when you need to know each line's content and width (e.g., for Canvas
// rendering, shrink-wrap width calculation, or balanced text layout).
//
//   m := vogui.MeasureTextLines("Hello world", "16px Inter", 300, 20)
//   for _, line := range m.Lines {
//       ctx.FillText(line.Text, 0, y)
//       y += 20
//   }
func MeasureTextLines(text string, font string, maxWidth float64, lineHeight float64) TextLineMetrics {
    return measureTextLines(text, font, maxWidth, lineHeight)
}

// MaxLineWidth returns the width of the widest line when text is wrapped to maxWidth.
// This is the "shrink-wrap" width — the tightest container that still fits the text.
//
//   w := vogui.MaxLineWidth("Hello world", "16px Inter", 300, 20)
func MaxLineWidth(text string, font string, maxWidth float64, lineHeight float64) float64 {
    m := MeasureTextLines(text, font, maxWidth, lineHeight)
    max := 0.0
    for _, line := range m.Lines {
        if line.Width > max {
            max = line.Width
        }
    }
    return max
}

// ============ Extern Declarations ============

// measureText returns (height, lineCount) for text wrapped to maxWidth.
func measureText(text string, font string, maxWidth float64, lineHeight float64) (float64, int)

// measureTextLines returns full line-level metrics. The return type is decoded
// from a binary response: [f64 height][i32 lineCount][i32 numLines]([u16 len][text][f64 width])...
func measureTextLines(text string, font string, maxWidth float64, lineHeight float64) TextLineMetrics
```

### Layer 1b: Canvas Multi-line Text (`canvas.vo` additions)

```vo
// FillTextWrap draws text with automatic word wrapping.
// Text is wrapped to maxWidth pixels, with lineHeight pixels between lines.
// Uses MeasureText internally for line breaking.
func (c *CanvasCtx) FillTextWrap(text string, x, y, maxWidth, lineHeight float64) {
    m := MeasureTextLines(text, c.currentFont, maxWidth, lineHeight)
    for i, line := range m.Lines {
        c.FillText(line.Text, x, y + float64(i) * lineHeight)
    }
}
```

Wait — this has a problem. `c.currentFont` doesn't exist; the font is set via
`c.cmd("font", font)` which goes to JS. The Vo side doesn't track the current font.

**Two options:**

A. **Track font on Vo side** — `SetFont` stores the font string in `CanvasCtx.font`.
   `FillTextWrap` uses it. Simple, no extra extern call.

B. **Pass font explicitly** — `FillTextWrap(text, font, x, y, maxWidth, lineHeight)`.
   No hidden state, but longer signature.

**Decision: Option A** — track font in CanvasCtx. It's the natural thing; the canvas
already has conceptual state (fill color, line width, etc.) even though it's not tracked
on the Vo side. We add `font` field tracking.

Actually, on reflection, there's an even better approach:

**Option C: Emit a new canvas command "ftw" that does wrapping on the JS side.**

This is better because:
- The measurement + rendering happen atomically in JS (no extra round-trip)
- JS has direct access to Pretext, which can produce lines and render them in one pass
- No need to track font state on Vo side (JS canvas context already has it)

```vo
// FillTextWrap draws text with automatic word wrapping.
// The current font (set via SetFont) is used for measurement.
// maxWidth: maximum line width in pixels.
// lineHeight: vertical distance between line baselines in pixels.
func (c *CanvasCtx) FillTextWrap(text string, x, y, maxWidth, lineHeight float64) {
    c.cmd("ftw", text, x, y, maxWidth, lineHeight)
}
```

**Decision: Option C.** The JS canvas executor handles "ftw" by using Pretext to
compute lines, then draws each line with `ctx.fillText`. This keeps the Vo API clean
and avoids state tracking issues.

### Layer 2: Rust Extern Bridge

#### Standalone WASM path (`standalone.rs`)

Add two new host imports and two new exports:

```rust
// New host imports
extern "C" {
    // Returns [f64 height LE][i32 lineCount LE] = 12 bytes
    fn host_measure_text(
        text_ptr: *const u8, text_len: u32,
        font_ptr: *const u8, font_len: u32,
        max_width: f64, line_height: f64,
        out_len: *mut u32,
    ) -> *const u8;

    // Returns binary: [f64 height][i32 lineCount][i32 numLines]
    //   then per line: [u16 textLen][textBytes][f64 width]
    fn host_measure_text_lines(
        text_ptr: *const u8, text_len: u32,
        font_ptr: *const u8, font_len: u32,
        max_width: f64, line_height: f64,
        out_len: *mut u32,
    ) -> *const u8;
}
```

Exports:
```rust
#[no_mangle]
pub extern "C" fn measureText(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (text, off) = read_bytes_arg(input, 0);
    let (font, off) = read_bytes_arg(input, off);
    let (max_width_bits, off) = read_value_arg(input, off);
    let (line_height_bits, _) = read_value_arg(input, off);
    let max_width = f64::from_bits(max_width_bits);
    let line_height = f64::from_bits(line_height_bits);

    let mut result_len: u32 = 0;
    let result_ptr = unsafe {
        host_measure_text(
            text.as_ptr(), text.len() as u32,
            font.as_ptr(), font.len() as u32,
            max_width, line_height,
            &mut result_len,
        )
    };

    // Result: [f64 height][i32 lineCount]
    let result = unsafe { std::slice::from_raw_parts(result_ptr, result_len as usize) };
    let height_bits = u64::from_le_bytes(result[0..8].try_into().unwrap());
    let line_count = i32::from_le_bytes(result[8..12].try_into().unwrap());

    // Encode as TAG_VALUE(height) + TAG_VALUE(lineCount)
    let mut buf = Vec::with_capacity(18);
    buf.push(TAG_VALUE);
    buf.extend_from_slice(&height_bits.to_le_bytes());
    buf.push(TAG_VALUE);
    buf.extend_from_slice(&(line_count as u64).to_le_bytes());
    alloc_output(&buf, out_len)
}
```

For `measureTextLines`, the output is more complex (variable-length line data).
We encode it as TAG_BYTES containing the full binary payload, and decode on the
Vo side.

#### Linked WASM path (`externs.rs`)

```rust
#[vo_fn("vogui", "measureText")]
pub fn measure_text(ctx: &mut ExternCallContext) -> ExternResult {
    let text = ctx.arg_str(slots::ARG_TEXT).to_string();
    let font = ctx.arg_str(slots::ARG_FONT).to_string();
    let max_width = ctx.arg_f64(slots::ARG_MAX_WIDTH);
    let line_height = ctx.arg_f64(slots::ARG_LINE_HEIGHT);
    let (height, line_count) = with_gui(|p| p.measure_text(&text, &font, max_width, line_height));
    ctx.ret_f64(slots::RET_0, height);
    ctx.ret_i64(slots::RET_1, line_count as i64);
    ExternResult::Ok
}
```

This adds `measure_text` and `measure_text_lines` to `GuiHost` and `VoguiPlatform`
traits.

#### Native path

For native (non-wasm), `GuiHost::measure_text` returns (0.0, 0) by default (noop).
A real native host (e.g., Studio Tauri) could implement it using cosmic-text or
similar. This is a future extension point; the API is ready for it.

### Layer 3: JS Runtime (`vogui/js/src/text.ts`)

New file:

```typescript
import { prepare, layout, prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

// Font-keyed cache: avoids re-preparing the same text+font combo.
// In practice, the same font is used many times with different text,
// so this cache is keyed on (text, font, whiteSpace).
// LRU eviction at 500 entries.
const prepareCache = new Map<string, any>();
const CACHE_MAX = 500;

function cacheKey(text: string, font: string): string {
    return `${font}\0${text}`;
}

function getPrepared(text: string, font: string): any {
    const key = cacheKey(text, font);
    let p = prepareCache.get(key);
    if (p) return p;
    p = prepare(text, font);
    if (prepareCache.size >= CACHE_MAX) {
        // Evict oldest entry
        const first = prepareCache.keys().next().value;
        prepareCache.delete(first);
    }
    prepareCache.set(key, p);
    return p;
}

function getPreparedWithSegments(text: string, font: string): any {
    // For line-level access, we always use prepareWithSegments.
    // This is not cached in the same map (different return type).
    return prepareWithSegments(text, font);
}

/** Measure text height and line count. Returns [f64 height LE, i32 lineCount LE]. */
export function measureText(text: string, font: string, maxWidth: number, lineHeight: number): Uint8Array {
    const p = getPrepared(text, font);
    const result = layout(p, maxWidth, lineHeight);
    const buf = new ArrayBuffer(12);
    const view = new DataView(buf);
    view.setFloat64(0, result.height, true);
    view.setInt32(8, result.lineCount, true);
    return new Uint8Array(buf);
}

/**
 * Measure text and return line-level info.
 * Binary format: [f64 height][i32 lineCount][i32 numLines]
 *   per line: [u16 textLen][textBytes...][f64 width]
 */
export function measureTextLines(
    text: string, font: string, maxWidth: number, lineHeight: number,
): Uint8Array {
    const p = prepareWithSegments(text, font);
    const result = layoutWithLines(p, maxWidth, lineHeight);
    const encoder = new TextEncoder();
    // Pre-encode all line texts
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
        const line = result.lines[i];
        const enc = encoded[i];
        view.setUint16(off, enc.length, true); off += 2;
        bytes.set(enc, off); off += enc.length;
        view.setFloat64(off, line.width, true); off += 8;
    }
    return new Uint8Array(buf, 0, off);
}
```

#### Canvas command handler addition (`canvas.ts`):

```typescript
case 'ftw': {
    // FillTextWrap: text, x, y, maxWidth, lineHeight
    const text = a[0] as string;
    const x = a[1] as number;
    const y = a[2] as number;
    const maxWidth = a[3] as number;
    const lineHeight = a[4] as number;
    const font = ctx.font; // current canvas font
    const p = prepareWithSegments(text, font);
    const { lines } = layoutWithLines(p, maxWidth, lineHeight);
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].text, x, y + i * lineHeight);
    }
    break;
}
```

### Layer 4: Host Import Wiring

#### Standalone WASM (`studio_wasm.ts` / `playground vo.ts`)

Add to `buildStandaloneImports()`:

```typescript
host_measure_text(
    textPtr: number, textLen: number,
    fontPtr: number, fontLen: number,
    maxWidth: number, lineHeight: number,
    outLenPtr: number,
): number {
    const text = readWasmString(ref, textPtr, textLen);
    const font = readWasmString(ref, fontPtr, fontLen);
    const result = measureText(text, font, maxWidth, lineHeight);
    // Write result into WASM memory
    const destPtr = wasmAlloc(ref, result.length);
    const mem = (ref.instance!.exports.memory as WebAssembly.Memory).buffer;
    new Uint8Array(mem, destPtr, result.length).set(result);
    new Uint32Array(mem, outLenPtr, 1)[0] = result.length;
    return destPtr;
},

host_measure_text_lines(
    textPtr: number, textLen: number,
    fontPtr: number, fontLen: number,
    maxWidth: number, lineHeight: number,
    outLenPtr: number,
): number {
    const text = readWasmString(ref, textPtr, textLen);
    const font = readWasmString(ref, fontPtr, fontLen);
    const result = measureTextLines(text, font, maxWidth, lineHeight);
    const destPtr = wasmAlloc(ref, result.length);
    const mem = (ref.instance!.exports.memory as WebAssembly.Memory).buffer;
    new Uint8Array(mem, destPtr, result.length).set(result);
    new Uint32Array(mem, outLenPtr, 1)[0] = result.length;
    return destPtr;
},
```

#### Linked WASM (wasm_bindgen path)

Add to `wasm_js` module in `lib.rs`:
```rust
#[wasm_bindgen(js_name = voguiMeasureText)]
pub fn measure_text(text: &str, font: &str, max_width: f64, line_height: f64) -> Vec<u8>;
```

And implement it in the JS glue that provides these bindings. Since the linked WASM
path uses `GuiHost`/`VoguiPlatform` traits, the JS host implementation calls into the
same `measureText` function from `text.ts`.

### `measureTextLines` return decoding (Vo side)

The `measureTextLines` extern returns a `[]byte` that gets decoded on the Vo side:

```vo
func measureTextLines(text string, font string, maxWidth float64, lineHeight float64) TextLineMetrics {
    data := measureTextLinesRaw(text, font, maxWidth, lineHeight)
    // Decode binary: [f64 height][i32 lineCount][i32 numLines][per line: u16 len, text, f64 width]
    // ... manual binary decoding ...
}
```

We need a raw extern that returns `[]byte`, and a Vo-side decoder. This follows the
same pattern as the binary render protocol encoder/decoder already in vogui.

## Dependencies

### JS side
- Add `@chenglou/pretext` to `vogui/js/package.json`
- New file: `vogui/js/src/text.ts`
- Modify: `vogui/js/src/canvas.ts` (add "ftw" command)
- Modify: `vogui/js/src/index.ts` (export text measurement functions)

### Vo side
- New file: `vogui/text.vo`
- Modify: `vogui/canvas.vo` (add `FillTextWrap`)
- Modify: `vogui/gui.vo` (add file to index)

### Rust side
- Modify: `vogui/rust/ext/src/externs.rs` (add `measureText`, `measureTextLines`)
- Modify: `vogui/rust/ext/src/standalone.rs` (add standalone exports + host imports)
- Modify: `vogui/rust/ext/src/lib.rs` (add to `GuiHost` / `VoguiPlatform` traits)

### Host integration
- Modify: `studio/src/lib/studio_wasm.ts` (add host imports to `buildStandaloneImports`)
- Modify: `playground/src/wasm/vo.ts` (add host imports if standalone path is used there)

## Binary Protocol for `measureTextLines`

The `measureTextLinesRaw` extern returns `[]byte` with this layout:

```
[f64 LE: height]         8 bytes
[i32 LE: lineCount]      4 bytes
[i32 LE: numLines]       4 bytes
for each line:
  [u16 LE: textByteLen]  2 bytes
  [u8: text bytes...]    textByteLen bytes
  [f64 LE: width]        8 bytes
```

This is decoded on the Vo side into `TextLineMetrics`.

## Design Decisions

### Why not async?

`MeasureText` is synchronous. Pretext's `prepare()` is ~19ms for 500 texts, and
`layout()` is ~0.09ms for the same batch. For a single text measurement, it's sub-ms.
Async would add complexity (fiber suspension, event loop round-trip) for no benefit.

The synchronous path already works well in the standalone WASM architecture:
Vo → standalone WASM → host_import (synchronous JS call) → return.

### Why not put Pretext in the Rust layer?

Pretext is a JS library that uses `canvas.measureText` as ground truth. It cannot run
in Rust/WASM without a real browser canvas context. The measurement must happen in JS.

### Why return binary instead of JSON?

JSON encode/decode is expensive for high-frequency calls (e.g., measuring 1000 list
items). Binary is zero-allocation on the JS side (just fill a DataView) and fast to
decode on the Vo side (direct byte reads).

### Why cache in JS, not Vo?

Pretext's `prepare()` does the expensive work (segmentation, glyph measurement). The
result is an opaque JS object that can't cross the WASM boundary. So caching must live
in JS. The Vo side can also cache `TextMetrics` results if needed, but the foundational
cache is in JS.

### What about native (non-web)?

The `GuiHost` trait gets default no-op implementations. A real native host can implement
`measure_text` using cosmic-text, fontdue, or similar. The Vo API is the same on all
platforms. For now, native returns (0.0, 0) and `FillTextWrap` does nothing — this is
acceptable because native Canvas rendering isn't the primary path (voplay uses wgpu).

### What about the `font` parameter requirement?

Every `MeasureText` call requires an explicit font string. This is by design:
- It matches how CSS works (you must know the font to predict dimensions)
- It matches Pretext's API
- It avoids hidden state that could get out of sync
- For Canvas users, you already call `SetFont("16px Inter")` — use the same string

## Future Extensions (not in this PR)

1. **VirtualScroll component** — uses `MeasureText` to pre-calculate item heights,
   renders only visible items + spacer. This is a pure Vo component on top of the
   measurement API.

2. **Text cursor/selection** — Pretext's cursor system can be exposed for building
   custom text editors on Canvas.

3. **pre-wrap mode** — Pass `{ whiteSpace: 'pre-wrap' }` to Pretext for textarea-like
   text where `\t` and `\n` are preserved.

4. **Balanced text layout** — Binary search a width using `walkLineRanges` to find
   the width where all lines are approximately equal. Useful for chat bubbles.

5. **Native text measurement** — Implement `GuiHost::measure_text` using cosmic-text
   for Studio native and voplay native targets.
