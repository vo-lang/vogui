//! Standalone C-ABI WASM exports for vogui.
//!
//! Each Vo extern function is exported under its protocol-v3 canonical key:
//!   `__vo_ext_<hex(canonical extern key)>`
//! with the exact C ABI:
//!   `fn(input_ptr: u32, input_len: u32, out_len_ptr: u32) -> output_ptr: u32`
//!
//! Host side effects (timers, navigation, text, audio, game loop) are declared as raw WASM
//! imports under the `"env"` namespace — the host provides them via
//! the importObject at instantiation time.

// Host-target builds compile this module solely for its source-contract tests.
#![cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]

use std::cell::Cell;
use std::mem::{size_of, MaybeUninit};

// ── Tag constants (mirrors ext_bridge.rs) ────────────────────────────────────

const TAG_SUSPEND: u8 = 0x01;
const TAG_HOST_OUTPUT: u8 = 0x02;
const TAG_NIL_ERROR: u8 = 0xE0;
const TAG_ERROR_STR: u8 = 0xE1;
const TAG_VALUE: u8 = 0xE2;
const TAG_BYTES: u8 = 0xE3;
const TAG_STRING: u8 = 0xE5;

const REPLAY_SOURCE_GUI_EVENT: u8 = 0;
const REPLAY_ENCODING_GUI_EVENT_I32_UTF8: u8 = 1;
const GUI_EVENT_SUSPEND_FRAME: [u8; 3] = [
    TAG_SUSPEND,
    REPLAY_SOURCE_GUI_EVENT,
    REPLAY_ENCODING_GUI_EVENT_I32_UTF8,
];
const WASM_PAGE_BYTES: usize = 64 * 1024;

// ── Host imports (resolved by the WASM host via importObject.env) ────────────

#[cfg_attr(target_arch = "wasm32", link(wasm_import_module = "env"))]
extern "C" {
    fn host_start_timeout(id: i32, ms: i32);
    fn host_clear_timeout(id: i32);
    fn host_start_interval(id: i32, ms: i32);
    fn host_clear_interval(id: i32);
    fn host_has_host_capability(ptr: *const u8, len: u32) -> i32;
    fn host_navigate(ptr: *const u8, len: u32);
    fn host_get_current_path(out_len: *mut u32) -> *const u8;
    fn host_set_title(ptr: *const u8, len: u32);
    fn host_set_meta(name_ptr: *const u8, name_len: u32, content_ptr: *const u8, content_len: u32);
    fn host_toast(
        msg_ptr: *const u8,
        msg_len: u32,
        typ_ptr: *const u8,
        typ_len: u32,
        duration_ms: i32,
    );
    fn host_start_anim_frame(id: i32);
    fn host_cancel_anim_frame(id: i32);
    fn host_start_game_loop(id: i32);
    fn host_stop_game_loop(id: i32);
    fn host_measure_text(
        text_ptr: *const u8,
        text_len: u32,
        font_ptr: *const u8,
        font_len: u32,
        max_width: f64,
        line_height: f64,
        white_space: i32,
        out_len: *mut u32,
    ) -> *const u8;
    fn host_measure_text_lines(
        text_ptr: *const u8,
        text_len: u32,
        font_ptr: *const u8,
        font_len: u32,
        max_width: f64,
        line_height: f64,
        white_space: i32,
        out_len: *mut u32,
    ) -> *const u8;
    fn host_audio_load_bytes(ptr: *const u8, len: u32) -> i32;
    fn host_audio_free(clip_id: i32);
    fn host_audio_play_sound(clip_id: i32, volume: f64, pitch: f64);
    fn host_audio_set_listener(
        px: f64,
        py: f64,
        pz: f64,
        fx: f64,
        fy: f64,
        fz: f64,
        ux: f64,
        uy: f64,
        uz: f64,
    );
    fn host_audio_play_sound_3d(
        clip_id: i32,
        px: f64,
        py: f64,
        pz: f64,
        volume: f64,
        ref_distance: f64,
        max_distance: f64,
    );
    fn host_audio_create_source_3d(
        clip_id: i32,
        px: f64,
        py: f64,
        pz: f64,
        volume: f64,
        ref_distance: f64,
        max_distance: f64,
    ) -> i32;
    fn host_audio_update_spatial();
    fn host_audio_set_source_3d_pos(source_id: i32, px: f64, py: f64, pz: f64);
    fn host_audio_set_source_3d_params(source_id: i32, volume: f64, pitch: f64);
    fn host_audio_remove_source_3d(source_id: i32);
    fn host_audio_play_music(clip_id: i32, volume: f64);
    fn host_audio_stop_music();
    fn host_audio_pause_music();
    fn host_audio_resume_music();
    fn host_audio_set_sfx_volume(volume: f64);
    fn host_audio_set_music_volume(volume: f64);
}

// ── Memory management ────────────────────────────────────────────────────────

#[no_mangle]
pub extern "C" fn vo_alloc(size: u32) -> *mut u8 {
    let mut allocation = Vec::<MaybeUninit<u8>>::with_capacity(size as usize);
    // SAFETY: uninitialized bytes are valid `MaybeUninit<u8>` values. Converting
    // to a boxed slice records the exact allocation layout for deallocation.
    unsafe {
        allocation.set_len(size as usize);
    }
    Box::into_raw(allocation.into_boxed_slice()).cast::<MaybeUninit<u8>>() as *mut u8
}

#[no_mangle]
/// Release an allocation previously returned by [`vo_alloc`].
///
/// # Safety
///
/// `ptr` and `size` must exactly match a live allocation returned by
/// [`vo_alloc`], and that allocation must not be used again after this call.
pub unsafe extern "C" fn vo_dealloc(ptr: *mut u8, size: u32) {
    if ptr.is_null() {
        panic!("standalone ABI: cannot deallocate a null pointer")
    }
    let allocation =
        std::ptr::slice_from_raw_parts_mut(ptr.cast::<MaybeUninit<u8>>(), size as usize);
    // SAFETY: the standalone ABI requires exactly the pointer and size returned
    // by `vo_alloc`; the boxed-slice layout is therefore identical.
    drop(unsafe { Box::from_raw(allocation) });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

#[cfg(target_arch = "wasm32")]
fn linear_memory_len() -> usize {
    core::arch::wasm32::memory_size::<0>()
        .checked_mul(WASM_PAGE_BYTES)
        .expect("standalone ABI: linear-memory size overflow")
}

#[cfg(not(target_arch = "wasm32"))]
fn linear_memory_len() -> usize {
    panic!("standalone ABI wrappers may only execute on wasm32")
}

fn checked_linear_memory_range(
    ptr: u32,
    len: u32,
    alignment: usize,
    label: &str,
) -> std::ops::Range<usize> {
    let start = ptr as usize;
    let byte_len = len as usize;
    if alignment == 0 || !alignment.is_power_of_two() {
        panic!("standalone ABI: invalid internal alignment for {label}")
    }
    if !start.is_multiple_of(alignment) {
        panic!("standalone ABI: unaligned {label} pointer {ptr}")
    }
    if byte_len != 0 && ptr == 0 {
        panic!("standalone ABI: null {label} pointer with non-empty range")
    }
    let end = start
        .checked_add(byte_len)
        .unwrap_or_else(|| panic!("standalone ABI: {label} range overflow"));
    if end > linear_memory_len() {
        panic!("standalone ABI: {label} range exceeds linear memory")
    }
    start..end
}

fn ranges_overlap(left: &std::ops::Range<usize>, right: &std::ops::Range<usize>) -> bool {
    left.start < right.end && right.start < left.end
}

struct InputCursor {
    range: std::ops::Range<usize>,
    offset: Cell<usize>,
}

impl InputCursor {
    fn read_exact(&self, len: usize, label: &str) -> &[u8] {
        let offset = self.offset.get();
        let relative_end = offset
            .checked_add(len)
            .unwrap_or_else(|| panic!("standalone ABI: {label} offset overflow"));
        if relative_end > self.range.len() {
            panic!("standalone ABI: truncated {label}")
        }
        let start = self
            .range
            .start
            .checked_add(offset)
            .unwrap_or_else(|| panic!("standalone ABI: {label} address overflow"));
        self.offset.set(relative_end);
        if len == 0 {
            &[]
        } else {
            // SAFETY: `raw_input` validated the complete range against the
            // non-shrinking wasm32 linear memory. The host keeps the input
            // immutable for the duration of the extension call.
            unsafe { std::slice::from_raw_parts(start as *const u8, len) }
        }
    }

    fn read_value(&self) -> u64 {
        u64::from_le_bytes(
            self.read_exact(size_of::<u64>(), "value argument")
                .try_into()
                .expect("standalone ABI: internal value width mismatch"),
        )
    }

    fn read_bytes(&self) -> &[u8] {
        let len = u32::from_le_bytes(
            self.read_exact(size_of::<u32>(), "byte argument length")
                .try_into()
                .expect("standalone ABI: internal length width mismatch"),
        ) as usize;
        self.read_exact(len, "byte argument payload")
    }

    fn read_str(&self, label: &str) -> &str {
        decode_utf8(self.read_bytes(), label)
    }

    fn finish(&self) {
        if self.offset.get() != self.range.len() {
            panic!("standalone ABI: trailing input bytes")
        }
    }
}

fn decode_utf8<'a>(bytes: &'a [u8], label: &str) -> &'a str {
    std::str::from_utf8(bytes)
        .unwrap_or_else(|error| panic!("standalone ABI: {label} is not UTF-8: {error}"))
}

fn value_as_i32(value: u64, label: &str) -> i32 {
    i32::try_from(value as i64)
        .unwrap_or_else(|_| panic!("standalone ABI: {label} does not fit an i32 host argument"))
}

fn raw_input(ptr: u32, len: u32, out_len: u32) -> InputCursor {
    let input = checked_linear_memory_range(ptr, len, 1, "input");
    let out_len = checked_linear_memory_range(out_len, 4, 1, "output length");
    if ranges_overlap(&input, &out_len) {
        panic!("standalone ABI: input overlaps output-length slot")
    }
    InputCursor {
        range: input,
        offset: Cell::new(0),
    }
}

fn alloc_output(data: &[u8], out_len: u32) -> u32 {
    let out_len_range = checked_linear_memory_range(out_len, 4, 1, "output length");
    let data_len = u32::try_from(data.len()).expect("standalone ABI: output exceeds 4 GiB");
    let ptr = vo_alloc(data_len);
    let ptr_u32 = u32::try_from(ptr as usize)
        .expect("standalone ABI: allocator returned a non-wasm32 pointer");
    let output_range = checked_linear_memory_range(ptr_u32, data_len, 1, "output");
    if ranges_overlap(&output_range, &out_len_range) {
        // SAFETY: `ptr` and `data_len` came directly from `vo_alloc` above.
        unsafe { vo_dealloc(ptr, data_len) };
        panic!("standalone ABI: allocator output overlaps output-length slot")
    }
    if !data.is_empty() {
        // SAFETY: both ranges were validated. `copy` also keeps this boundary
        // defined if a hostile host supplied an in-bounds but stale input range.
        unsafe {
            std::ptr::copy(data.as_ptr(), ptr, data.len());
        }
    }
    // SAFETY: the four-byte range was validated above. The ABI permits an
    // unaligned length slot, so copy the little-endian representation as bytes.
    unsafe {
        std::ptr::copy_nonoverlapping(
            data_len.to_le_bytes().as_ptr(),
            out_len_range.start as *mut u8,
            size_of::<u32>(),
        );
    }
    ptr_u32
}

fn take_host_output(ptr: *const u8, len: u32, label: &str) -> Vec<u8> {
    if ptr.is_null() {
        if len == 0 {
            return Vec::new();
        }
        panic!("standalone ABI: host returned null {label} with non-zero length")
    }
    let ptr_u32 =
        u32::try_from(ptr as usize).expect("standalone ABI: host returned a non-wasm32 pointer");
    let range = checked_linear_memory_range(ptr_u32, len, 1, label);
    let result = if range.is_empty() {
        Vec::new()
    } else {
        // SAFETY: the host range was validated and is copied before ownership
        // is returned to the Rust allocator.
        unsafe { std::slice::from_raw_parts(ptr, range.len()).to_vec() }
    };
    // SAFETY: host-result imports promise ownership of an exact `vo_alloc`
    // allocation with the returned length.
    unsafe { vo_dealloc(ptr.cast_mut(), len) };
    result
}

fn output_empty(out_len: u32) -> u32 {
    alloc_output(&[], out_len)
}

fn output_tag_value(v: u64, out_len: u32) -> u32 {
    let mut buf = [0u8; 9];
    buf[0] = TAG_VALUE;
    buf[1..9].copy_from_slice(&v.to_le_bytes());
    alloc_output(&buf, out_len)
}

fn output_value_and_nil_error(v: u64, out_len: u32) -> u32 {
    let mut buf = [0u8; 10];
    buf[0] = TAG_VALUE;
    buf[1..9].copy_from_slice(&v.to_le_bytes());
    buf[9] = TAG_NIL_ERROR;
    alloc_output(&buf, out_len)
}

fn error_message_bytes(msg: &str) -> &[u8] {
    let msg_bytes = msg.as_bytes();
    let mut msg_len = msg_bytes.len().min(u16::MAX as usize);
    while !msg.is_char_boundary(msg_len) {
        msg_len -= 1;
    }
    &msg_bytes[..msg_len]
}

fn output_value_and_error(v: u64, msg: &str, out_len: u32) -> u32 {
    let msg_bytes = error_message_bytes(msg);
    let msg_len = msg_bytes.len();
    let mut buf = Vec::with_capacity(12 + msg_len);
    buf.push(TAG_VALUE);
    buf.extend_from_slice(&v.to_le_bytes());
    buf.push(TAG_ERROR_STR);
    buf.extend_from_slice(&(msg_len as u16).to_le_bytes());
    buf.extend_from_slice(msg_bytes);
    alloc_output(&buf, out_len)
}

fn encode_length_prefixed(tag: u8, data: &[u8], label: &str) -> Vec<u8> {
    let len = u32::try_from(data.len()).expect("standalone ABI: byte result exceeds 4 GiB");
    let capacity = data
        .len()
        .checked_add(5)
        .unwrap_or_else(|| panic!("standalone ABI: {label} result size overflow"));
    let mut buf = Vec::with_capacity(capacity);
    buf.push(tag);
    buf.extend_from_slice(&len.to_le_bytes());
    buf.extend_from_slice(data);
    buf
}

fn output_tag_bytes(data: &[u8], out_len: u32) -> u32 {
    let buf = encode_length_prefixed(TAG_BYTES, data, "byte");
    alloc_output(&buf, out_len)
}

fn output_tag_string(data: &str, out_len: u32) -> u32 {
    let buf = encode_length_prefixed(TAG_STRING, data.as_bytes(), "string");
    alloc_output(&buf, out_len)
}

// ── Extern exports ───────────────────────────────────────────────────────────

// waitForEvent() -> (int, string)
// First call: suspend and declare the exact replay payload shape so the
// extension bridge can decode the resumed `(int, string)` result.
// Replay is handled by the ext bridge calling voCallExtReplay on JS side.
#[vo_ext::vo_wasm_export("vogui", "waitForEvent")]
pub extern "C" fn wait_for_event(ptr: u32, len: u32, out_len: u32) -> u32 {
    raw_input(ptr, len, out_len).finish();
    alloc_output(&GUI_EVENT_SUSPEND_FRAME, out_len)
}

// emitRenderBinary(data []byte)
// Extract the bytes arg and return TAG_HOST_OUTPUT + raw data.
#[vo_ext::vo_wasm_export("vogui", "emitRenderBinary")]
pub extern "C" fn emit_render_binary(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let data = input.read_bytes();
    input.finish();
    let mut buf = Vec::with_capacity(1 + data.len());
    buf.push(TAG_HOST_OUTPUT);
    buf.extend_from_slice(data);
    alloc_output(&buf, out_len)
}
#[vo_ext::vo_wasm_export("vogui", "HasHostCapability")]
pub extern "C" fn has_host_capability(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let name = input.read_str("host capability name");
    input.finish();
    let supported = unsafe { host_has_host_capability(name.as_ptr(), name.len() as u32) };
    let supported = match supported {
        0 => false,
        1 => true,
        value => panic!("standalone ABI: host capability returned invalid boolean {value}"),
    };
    output_tag_value(supported as u64, out_len)
}

// float64bits(f float64) -> int64
// Input: [u64 LE 8 bytes] (f64 bit pattern). Return same bits as TAG_VALUE.
#[vo_ext::vo_wasm_export("vogui", "float64bits")]
pub extern "C" fn float64_bits(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let v = input.read_value();
    input.finish();
    output_tag_value(v, out_len)
}

// float64frombits(bits int64) -> float64
#[vo_ext::vo_wasm_export("vogui", "float64frombits")]
pub extern "C" fn float64_from_bits(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let v = input.read_value();
    input.finish();
    // Input is i64 bits, output is the same bits reinterpreted as f64,
    // but since we're just passing the raw u64 through, TAG_VALUE works.
    output_tag_value(v, out_len)
}

// measureText(text string, font string, maxWidth float64, lineHeight float64, whiteSpace int) -> (float64, int)
#[vo_ext::vo_wasm_export("vogui", "measureText")]
pub extern "C" fn measure_text(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let text = input.read_str("measureText text");
    let font = input.read_str("measureText font");
    let max_width_bits = input.read_value();
    let line_height_bits = input.read_value();
    let white_space = input.read_value();
    input.finish();
    let max_width = f64::from_bits(max_width_bits);
    let line_height = f64::from_bits(line_height_bits);

    let mut result_len: u32 = 0;
    let result_ptr = unsafe {
        host_measure_text(
            text.as_ptr(),
            text.len() as u32,
            font.as_ptr(),
            font.len() as u32,
            max_width,
            line_height,
            value_as_i32(white_space, "measureText whiteSpace"),
            &mut result_len,
        )
    };

    // Result from host: [f64 LE height 8 bytes][i32 LE lineCount 4 bytes]
    let result = take_host_output(result_ptr, result_len, "measureText result");
    if result.len() != 12 {
        panic!(
            "standalone ABI: measureText host result has {} bytes; expected 12",
            result.len()
        )
    }
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

// measureTextLinesRaw(text string, font string, maxWidth float64, lineHeight float64, whiteSpace int) -> []byte
#[vo_ext::vo_wasm_export("vogui", "measureTextLinesRaw")]
pub extern "C" fn measure_text_lines_raw(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let text = input.read_str("measureTextLinesRaw text");
    let font = input.read_str("measureTextLinesRaw font");
    let max_width_bits = input.read_value();
    let line_height_bits = input.read_value();
    let white_space = input.read_value();
    input.finish();
    let max_width = f64::from_bits(max_width_bits);
    let line_height = f64::from_bits(line_height_bits);

    let mut result_len: u32 = 0;
    let result_ptr = unsafe {
        host_measure_text_lines(
            text.as_ptr(),
            text.len() as u32,
            font.as_ptr(),
            font.len() as u32,
            max_width,
            line_height,
            value_as_i32(white_space, "measureTextLinesRaw whiteSpace"),
            &mut result_len,
        )
    };

    let result = take_host_output(result_ptr, result_len, "measureTextLinesRaw result");
    output_tag_bytes(&result, out_len)
}

// startTimeout(id int, delayMs int)
#[vo_ext::vo_wasm_export("vogui", "startTimeout")]
pub extern "C" fn start_timeout(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let id = input.read_value();
    let ms = input.read_value();
    input.finish();
    unsafe {
        host_start_timeout(
            value_as_i32(id, "timeout id"),
            value_as_i32(ms, "timeout delay"),
        );
    }
    output_empty(out_len)
}

// clearTimeout(id int)
#[vo_ext::vo_wasm_export("vogui", "clearTimeout")]
pub extern "C" fn clear_timeout(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let id = input.read_value();
    input.finish();
    unsafe {
        host_clear_timeout(value_as_i32(id, "timeout id"));
    }
    output_empty(out_len)
}

// startInterval(id int, intervalMs int)
#[vo_ext::vo_wasm_export("vogui", "startInterval")]
pub extern "C" fn start_interval(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let id = input.read_value();
    let ms = input.read_value();
    input.finish();
    unsafe {
        host_start_interval(
            value_as_i32(id, "interval id"),
            value_as_i32(ms, "interval delay"),
        );
    }
    output_empty(out_len)
}

// clearInterval(id int)
#[vo_ext::vo_wasm_export("vogui", "clearInterval")]
pub extern "C" fn clear_interval(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let id = input.read_value();
    input.finish();
    unsafe {
        host_clear_interval(value_as_i32(id, "interval id"));
    }
    output_empty(out_len)
}

// navigate(path string)
#[vo_ext::vo_wasm_export("vogui", "navigate")]
pub extern "C" fn navigate(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let s = input.read_str("navigation path");
    input.finish();
    unsafe {
        host_navigate(s.as_ptr(), s.len() as u32);
    }
    output_empty(out_len)
}

// getCurrentPath() -> string
#[vo_ext::vo_wasm_export("vogui", "getCurrentPath")]
pub extern "C" fn get_current_path(ptr: u32, len: u32, out_len: u32) -> u32 {
    raw_input(ptr, len, out_len).finish();
    let mut path_len: u32 = 0;
    let path_ptr = unsafe { host_get_current_path(&mut path_len) };
    let path = take_host_output(path_ptr, path_len, "current path");
    if path.is_empty() {
        return output_tag_string("/", out_len);
    }
    let path = std::str::from_utf8(&path)
        .unwrap_or_else(|error| panic!("standalone ABI: current path is not UTF-8: {error}"));
    output_tag_string(path, out_len)
}

// setDocTitle(title string)
#[vo_ext::vo_wasm_export("vogui", "setDocTitle")]
pub extern "C" fn set_doc_title(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let s = input.read_str("document title");
    input.finish();
    unsafe {
        host_set_title(s.as_ptr(), s.len() as u32);
    }
    output_empty(out_len)
}

// setDocMeta(name string, content string)
#[vo_ext::vo_wasm_export("vogui", "setDocMeta")]
pub extern "C" fn set_doc_meta(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let name = input.read_str("document metadata name");
    let content = input.read_str("document metadata content");
    input.finish();
    unsafe {
        host_set_meta(
            name.as_ptr(),
            name.len() as u32,
            content.as_ptr(),
            content.len() as u32,
        );
    }
    output_empty(out_len)
}

// toastEmit(message string, typ string, durationMs int)
#[vo_ext::vo_wasm_export("vogui", "toastEmit")]
pub extern "C" fn toast_emit(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let msg = input.read_str("toast message");
    let typ = input.read_str("toast type");
    let dur = input.read_value();
    input.finish();
    unsafe {
        host_toast(
            msg.as_ptr(),
            msg.len() as u32,
            typ.as_ptr(),
            typ.len() as u32,
            value_as_i32(dur, "toast duration"),
        );
    }
    output_empty(out_len)
}

// startAnimFrame(id int)
#[vo_ext::vo_wasm_export("vogui", "startAnimFrame")]
pub extern "C" fn start_anim_frame(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let id = input.read_value();
    input.finish();
    unsafe {
        host_start_anim_frame(value_as_i32(id, "animation-frame id"));
    }
    output_empty(out_len)
}

// cancelAnimFrame(id int)
#[vo_ext::vo_wasm_export("vogui", "cancelAnimFrame")]
pub extern "C" fn cancel_anim_frame(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let id = input.read_value();
    input.finish();
    unsafe {
        host_cancel_anim_frame(value_as_i32(id, "animation-frame id"));
    }
    output_empty(out_len)
}

// startGameLoop(id int)
#[vo_ext::vo_wasm_export("vogui", "startGameLoop")]
pub extern "C" fn start_game_loop(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let id = input.read_value();
    input.finish();
    unsafe {
        host_start_game_loop(value_as_i32(id, "game-loop id"));
    }
    output_empty(out_len)
}

// stopGameLoop(id int)
#[vo_ext::vo_wasm_export("vogui", "stopGameLoop")]
pub extern "C" fn stop_game_loop(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let id = input.read_value();
    input.finish();
    unsafe {
        host_stop_game_loop(value_as_i32(id, "game-loop id"));
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioLoadBytes")]
pub extern "C" fn audio_load_bytes(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let data = input.read_bytes();
    input.finish();
    let id = unsafe { host_audio_load_bytes(data.as_ptr(), data.len() as u32) };
    if id <= 0 {
        return output_value_and_error(0, "audioLoadBytes failed", out_len);
    }
    output_value_and_nil_error(id as u64, out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioFree")]
pub extern "C" fn audio_free(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let clip_id = input.read_value();
    input.finish();
    unsafe {
        host_audio_free(value_as_i32(clip_id, "audio clip id"));
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioPlaySound")]
pub extern "C" fn audio_play_sound(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let clip_id = input.read_value();
    let volume_bits = input.read_value();
    let pitch_bits = input.read_value();
    input.finish();
    unsafe {
        host_audio_play_sound(
            value_as_i32(clip_id, "audio clip id"),
            f64::from_bits(volume_bits),
            f64::from_bits(pitch_bits),
        );
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioSetListener")]
pub extern "C" fn audio_set_listener(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let px = input.read_value();
    let py = input.read_value();
    let pz = input.read_value();
    let fx = input.read_value();
    let fy = input.read_value();
    let fz = input.read_value();
    let ux = input.read_value();
    let uy = input.read_value();
    let uz = input.read_value();
    input.finish();
    unsafe {
        host_audio_set_listener(
            f64::from_bits(px),
            f64::from_bits(py),
            f64::from_bits(pz),
            f64::from_bits(fx),
            f64::from_bits(fy),
            f64::from_bits(fz),
            f64::from_bits(ux),
            f64::from_bits(uy),
            f64::from_bits(uz),
        );
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioPlaySound3D")]
pub extern "C" fn audio_play_sound_3d(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let clip_id = input.read_value();
    let px = input.read_value();
    let py = input.read_value();
    let pz = input.read_value();
    let volume = input.read_value();
    let ref_distance = input.read_value();
    let max_distance = input.read_value();
    input.finish();
    unsafe {
        host_audio_play_sound_3d(
            value_as_i32(clip_id, "audio clip id"),
            f64::from_bits(px),
            f64::from_bits(py),
            f64::from_bits(pz),
            f64::from_bits(volume),
            f64::from_bits(ref_distance),
            f64::from_bits(max_distance),
        );
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioCreateSource3D")]
pub extern "C" fn audio_create_source_3d(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let clip_id = input.read_value();
    let px = input.read_value();
    let py = input.read_value();
    let pz = input.read_value();
    let volume = input.read_value();
    let ref_distance = input.read_value();
    let max_distance = input.read_value();
    input.finish();
    let id = unsafe {
        host_audio_create_source_3d(
            value_as_i32(clip_id, "audio clip id"),
            f64::from_bits(px),
            f64::from_bits(py),
            f64::from_bits(pz),
            f64::from_bits(volume),
            f64::from_bits(ref_distance),
            f64::from_bits(max_distance),
        )
    };
    if id <= 0 {
        return output_value_and_error(0, "audioCreateSource3D failed", out_len);
    }
    output_value_and_nil_error(id as u64, out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioUpdateSpatial")]
pub extern "C" fn audio_update_spatial(ptr: u32, len: u32, out_len: u32) -> u32 {
    raw_input(ptr, len, out_len).finish();
    unsafe {
        host_audio_update_spatial();
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioSetSource3DPos")]
pub extern "C" fn audio_set_source_3d_pos(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let source_id = input.read_value();
    let px = input.read_value();
    let py = input.read_value();
    let pz = input.read_value();
    input.finish();
    unsafe {
        host_audio_set_source_3d_pos(
            value_as_i32(source_id, "audio source id"),
            f64::from_bits(px),
            f64::from_bits(py),
            f64::from_bits(pz),
        );
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioSetSource3DParams")]
pub extern "C" fn audio_set_source_3d_params(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let source_id = input.read_value();
    let volume = input.read_value();
    let pitch = input.read_value();
    input.finish();
    unsafe {
        host_audio_set_source_3d_params(
            value_as_i32(source_id, "audio source id"),
            f64::from_bits(volume),
            f64::from_bits(pitch),
        );
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioRemoveSource3D")]
pub extern "C" fn audio_remove_source_3d(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let source_id = input.read_value();
    input.finish();
    unsafe {
        host_audio_remove_source_3d(value_as_i32(source_id, "audio source id"));
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioPlayMusic")]
pub extern "C" fn audio_play_music(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let clip_id = input.read_value();
    let volume = input.read_value();
    input.finish();
    unsafe {
        host_audio_play_music(
            value_as_i32(clip_id, "audio clip id"),
            f64::from_bits(volume),
        );
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioStopMusic")]
pub extern "C" fn audio_stop_music(ptr: u32, len: u32, out_len: u32) -> u32 {
    raw_input(ptr, len, out_len).finish();
    unsafe {
        host_audio_stop_music();
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioPauseMusic")]
pub extern "C" fn audio_pause_music(ptr: u32, len: u32, out_len: u32) -> u32 {
    raw_input(ptr, len, out_len).finish();
    unsafe {
        host_audio_pause_music();
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioResumeMusic")]
pub extern "C" fn audio_resume_music(ptr: u32, len: u32, out_len: u32) -> u32 {
    raw_input(ptr, len, out_len).finish();
    unsafe {
        host_audio_resume_music();
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioSetSFXVolume")]
pub extern "C" fn audio_set_sfx_volume(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let volume = input.read_value();
    input.finish();
    unsafe {
        host_audio_set_sfx_volume(f64::from_bits(volume));
    }
    output_empty(out_len)
}

#[vo_ext::vo_wasm_export("vogui", "audioSetMusicVolume")]
pub extern "C" fn audio_set_music_volume(ptr: u32, len: u32, out_len: u32) -> u32 {
    let input = raw_input(ptr, len, out_len);
    let volume = input.read_value();
    input.finish();
    unsafe {
        host_audio_set_music_volume(f64::from_bits(volume));
    }
    output_empty(out_len)
}

#[cfg(test)]
mod protocol_source_contract {
    use super::{
        decode_utf8, encode_length_prefixed, error_message_bytes, value_as_i32,
        GUI_EVENT_SUSPEND_FRAME, TAG_STRING,
    };

    const EXTERN_FUNCTIONS: &[&str] = &[
        "waitForEvent",
        "emitRenderBinary",
        "float64bits",
        "float64frombits",
        "measureText",
        "measureTextLinesRaw",
        "startTimeout",
        "clearTimeout",
        "startInterval",
        "clearInterval",
        "navigate",
        "getCurrentPath",
        "HasHostCapability",
        "setDocTitle",
        "setDocMeta",
        "toastEmit",
        "startAnimFrame",
        "cancelAnimFrame",
        "startGameLoop",
        "stopGameLoop",
        "audioLoadBytes",
        "audioFree",
        "audioPlaySound",
        "audioSetListener",
        "audioPlaySound3D",
        "audioCreateSource3D",
        "audioUpdateSpatial",
        "audioSetSource3DPos",
        "audioSetSource3DParams",
        "audioRemoveSource3D",
        "audioPlayMusic",
        "audioStopMusic",
        "audioPauseMusic",
        "audioResumeMusic",
        "audioSetSFXVolume",
        "audioSetMusicVolume",
    ];

    #[test]
    fn standalone_wrappers_match_the_authenticated_vogui_extern_catalog() {
        let source = include_str!("standalone.rs");
        let catalog = include_str!("externs.rs");
        let export_attribute = ["#[vo_ext::", "vo_wasm_export("].concat();
        let catalog_entry = ["vo_extension_", "entry!("].concat();
        let no_mangle = ["#[no_", "mangle]"].concat();
        let finish_call = [".fini", "sh();"].concat();
        let string_read = [".read_", "str("].concat();

        assert_eq!(
            source.matches(&export_attribute).count(),
            EXTERN_FUNCTIONS.len()
        );
        assert_eq!(
            source.matches(&finish_call).count(),
            EXTERN_FUNCTIONS.len(),
            "every standalone wrapper must reject trailing input",
        );
        assert_eq!(
            source.matches(&string_read).count(),
            11,
            "every Vo string argument must receive fatal UTF-8 validation",
        );
        assert_eq!(
            source.matches(&no_mangle).count(),
            2,
            "only alloc/dealloc stay unmangled"
        );
        for function in EXTERN_FUNCTIONS {
            assert!(
                source.contains(&format!("{export_attribute}\"vogui\", \"{function}\")]")),
                "standalone wrapper is missing the exact-export macro: {function}",
            );
            assert!(
                catalog.contains(&format!("{catalog_entry}\"vogui\", \"{function}\")")),
                "standalone wrapper is absent from the native/static extern catalog: {function}",
            );
        }

        for fragments in [
            ["Fo", "cus"],
            ["Bl", "ur"],
            ["Scroll", "To"],
            ["ScrollInto", "View"],
            ["Select", "Text"],
        ] {
            let stale = fragments.concat();
            assert!(
                !source.contains(&format!("pub extern \"C\" fn {stale}(")),
                "Vo facade function still has a legacy standalone export: {stale}",
            );
        }
        let stale_imports = [
            ["host_fo", "cus"],
            ["host_bl", "ur"],
            ["host_scroll_", "to"],
            ["host_scroll_into_", "view"],
            ["host_select_", "text"],
        ];
        for fragments in stale_imports {
            let stale_import = fragments.concat();
            assert!(
                !source.contains(&format!("fn {stale_import}(")),
                "removed legacy wrapper still retains host import: {stale_import}",
            );
        }

        let studio_bridge = include_str!("../../../js/src/studio_host_bridge.ts");
        for fragments in stale_imports {
            let stale_import = fragments.concat();
            assert!(
                !studio_bridge.contains(&stale_import),
                "Studio bridge still exposes a removed legacy import: {stale_import}",
            );
        }
    }

    #[test]
    fn gui_event_suspend_frame_declares_the_exact_replay_contract() {
        assert_eq!(GUI_EVENT_SUSPEND_FRAME, [0x01, 0, 1]);
    }

    #[test]
    fn string_result_uses_the_protocol_string_tag_and_utf8_byte_length() {
        assert_eq!(
            encode_length_prefixed(TAG_STRING, "路".as_bytes(), "string"),
            [0xE5, 3, 0, 0, 0, 0xE8, 0xB7, 0xAF],
        );
    }

    #[test]
    fn error_message_truncation_preserves_a_unicode_boundary() {
        let mut message = "a".repeat(u16::MAX as usize - 1);
        message.push('界');

        let encoded = error_message_bytes(&message);
        assert_eq!(encoded.len(), u16::MAX as usize - 1);
        assert!(std::str::from_utf8(encoded).is_ok());

        let exact_ascii = "a".repeat(u16::MAX as usize);
        assert_eq!(error_message_bytes(&exact_ascii), exact_ascii.as_bytes());
    }

    #[test]
    #[should_panic(expected = "standalone ABI: test string is not UTF-8")]
    fn string_arguments_reject_invalid_utf8() {
        let _ = decode_utf8(&[0xF0, 0x28, 0x8C, 0x28], "test string");
    }

    #[test]
    fn signed_i32_host_arguments_preserve_value_semantics() {
        assert_eq!(value_as_i32((-1_i64) as u64, "test"), -1);
        assert_eq!(value_as_i32(i32::MIN as i64 as u64, "test"), i32::MIN);
        assert_eq!(value_as_i32(i32::MAX as u64, "test"), i32::MAX);
    }

    #[test]
    #[should_panic(expected = "does not fit an i32 host argument")]
    fn signed_i32_host_arguments_reject_truncation() {
        let _ = value_as_i32(i32::MAX as u64 + 1, "test");
    }
}
