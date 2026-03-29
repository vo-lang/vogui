//! Standalone C-ABI WASM exports for vogui.
//!
//! Each Vo extern function is exported as:
//!   `fn <name>(input_ptr, input_len, out_len_ptr) -> output_ptr`
//!
//! Host side effects (timers, DOM, game loop) are declared as raw WASM
//! imports under the `"env"` namespace — the host provides them via
//! the importObject at instantiation time.

// ── Tag constants (mirrors ext_bridge.rs) ────────────────────────────────────

const TAG_SUSPEND:     u8 = 0x01;
const TAG_HOST_OUTPUT: u8 = 0x02;
const TAG_VALUE:       u8 = 0xE2;
const TAG_BYTES:       u8 = 0xE3;

// ── Host imports (resolved by the WASM host via importObject.env) ────────────

extern "C" {
    fn host_start_timeout(id: i32, ms: i32);
    fn host_clear_timeout(id: i32);
    fn host_start_interval(id: i32, ms: i32);
    fn host_clear_interval(id: i32);
    fn host_navigate(ptr: *const u8, len: u32);
    fn host_get_current_path(out_len: *mut u32) -> *const u8;
    fn host_focus(ptr: *const u8, len: u32);
    fn host_blur(ptr: *const u8, len: u32);
    fn host_scroll_to(ptr: *const u8, len: u32, top: i32);
    fn host_scroll_into_view(ptr: *const u8, len: u32);
    fn host_select_text(ptr: *const u8, len: u32);
    fn host_set_title(ptr: *const u8, len: u32);
    fn host_set_meta(name_ptr: *const u8, name_len: u32, content_ptr: *const u8, content_len: u32);
    fn host_toast(msg_ptr: *const u8, msg_len: u32, typ_ptr: *const u8, typ_len: u32, duration_ms: i32);
    fn host_start_anim_frame(id: i32);
    fn host_cancel_anim_frame(id: i32);
    fn host_start_game_loop(id: i32);
    fn host_stop_game_loop(id: i32);
    fn host_measure_text(
        text_ptr: *const u8, text_len: u32,
        font_ptr: *const u8, font_len: u32,
        max_width: f64, line_height: f64,
        white_space: i32,
        out_len: *mut u32,
    ) -> *const u8;
    fn host_measure_text_lines(
        text_ptr: *const u8, text_len: u32,
        font_ptr: *const u8, font_len: u32,
        max_width: f64, line_height: f64,
        white_space: i32,
        out_len: *mut u32,
    ) -> *const u8;
}

// ── Memory management ────────────────────────────────────────────────────────

#[no_mangle]
pub extern "C" fn vo_alloc(size: u32) -> *mut u8 {
    let mut buf = Vec::<u8>::with_capacity(size as usize);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn vo_dealloc(ptr: *mut u8, size: u32) {
    unsafe { drop(Vec::from_raw_parts(ptr, 0, size as usize)) };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

fn raw_input<'a>(ptr: *const u8, len: u32) -> &'a [u8] {
    if len == 0 { return &[]; }
    unsafe { std::slice::from_raw_parts(ptr, len as usize) }
}

fn alloc_output(data: &[u8], out_len: *mut u32) -> *mut u8 {
    unsafe { *out_len = data.len() as u32; }
    let ptr = vo_alloc(data.len() as u32);
    unsafe { std::ptr::copy_nonoverlapping(data.as_ptr(), ptr, data.len()); }
    ptr
}

fn read_value_arg(buf: &[u8], off: usize) -> (u64, usize) {
    let v = u64::from_le_bytes(buf[off..off + 8].try_into().unwrap());
    (v, off + 8)
}

fn read_bytes_arg(buf: &[u8], off: usize) -> (&[u8], usize) {
    let len = u32::from_le_bytes(buf[off..off + 4].try_into().unwrap()) as usize;
    (&buf[off + 4..off + 4 + len], off + 4 + len)
}

fn output_empty(out_len: *mut u32) -> *mut u8 {
    alloc_output(&[], out_len)
}

fn output_tag_value(v: u64, out_len: *mut u32) -> *mut u8 {
    let mut buf = [0u8; 9];
    buf[0] = TAG_VALUE;
    buf[1..9].copy_from_slice(&v.to_le_bytes());
    alloc_output(&buf, out_len)
}

fn output_tag_bytes(data: &[u8], out_len: *mut u32) -> *mut u8 {
    let mut buf = Vec::with_capacity(5 + data.len());
    buf.push(TAG_BYTES);
    buf.extend_from_slice(&(data.len() as u32).to_le_bytes());
    buf.extend_from_slice(data);
    alloc_output(&buf, out_len)
}

// ── Extern exports ───────────────────────────────────────────────────────────

// waitForEvent() -> (int, string)
// First call: return TAG_SUSPEND so ext bridge suspends the fiber.
// Replay is handled by the ext bridge calling voCallExtReplay on JS side.
#[no_mangle]
pub extern "C" fn waitForEvent(_ptr: *const u8, _len: u32, out_len: *mut u32) -> *mut u8 {
    alloc_output(&[TAG_SUSPEND], out_len)
}

// emitRenderBinary(data []byte)
// Extract the bytes arg and return TAG_HOST_OUTPUT + raw data.
#[no_mangle]
pub extern "C" fn emitRenderBinary(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (data, _) = read_bytes_arg(input, 0);
    let mut buf = Vec::with_capacity(1 + data.len());
    buf.push(TAG_HOST_OUTPUT);
    buf.extend_from_slice(data);
    alloc_output(&buf, out_len)
}

// float64bits(f float64) -> int64
// Input: [u64 LE 8 bytes] (f64 bit pattern). Return same bits as TAG_VALUE.
#[no_mangle]
pub extern "C" fn float64bits(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (v, _) = read_value_arg(input, 0);
    output_tag_value(v, out_len)
}

// float64frombits(bits int64) -> float64
#[no_mangle]
pub extern "C" fn float64frombits(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (v, _) = read_value_arg(input, 0);
    // Input is i64 bits, output is the same bits reinterpreted as f64,
    // but since we're just passing the raw u64 through, TAG_VALUE works.
    output_tag_value(v, out_len)
}

// measureText(text string, font string, maxWidth float64, lineHeight float64, whiteSpace int) -> (float64, int)
#[no_mangle]
pub extern "C" fn measureText(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (text, off) = read_bytes_arg(input, 0);
    let (font, off) = read_bytes_arg(input, off);
    let (max_width_bits, off) = read_value_arg(input, off);
    let (line_height_bits, off) = read_value_arg(input, off);
    let (white_space, _) = read_value_arg(input, off);
    let max_width = f64::from_bits(max_width_bits);
    let line_height = f64::from_bits(line_height_bits);

    let mut result_len: u32 = 0;
    let result_ptr = unsafe {
        host_measure_text(
            text.as_ptr(), text.len() as u32,
            font.as_ptr(), font.len() as u32,
            max_width, line_height,
            white_space as i32,
            &mut result_len,
        )
    };

    // Result from host: [f64 LE height 8 bytes][i32 LE lineCount 4 bytes]
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

// measureTextLinesRaw(text string, font string, maxWidth float64, lineHeight float64, whiteSpace int) -> []byte
#[no_mangle]
pub extern "C" fn measureTextLinesRaw(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (text, off) = read_bytes_arg(input, 0);
    let (font, off) = read_bytes_arg(input, off);
    let (max_width_bits, off) = read_value_arg(input, off);
    let (line_height_bits, off) = read_value_arg(input, off);
    let (white_space, _) = read_value_arg(input, off);
    let max_width = f64::from_bits(max_width_bits);
    let line_height = f64::from_bits(line_height_bits);

    let mut result_len: u32 = 0;
    let result_ptr = unsafe {
        host_measure_text_lines(
            text.as_ptr(), text.len() as u32,
            font.as_ptr(), font.len() as u32,
            max_width, line_height,
            white_space as i32,
            &mut result_len,
        )
    };

    let result = unsafe { std::slice::from_raw_parts(result_ptr, result_len as usize) };
    output_tag_bytes(result, out_len)
}

// startTimeout(id int, delayMs int)
#[no_mangle]
pub extern "C" fn startTimeout(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (id, off) = read_value_arg(input, 0);
    let (ms, _) = read_value_arg(input, off);
    unsafe { host_start_timeout(id as i32, ms as i32); }
    output_empty(out_len)
}

// clearTimeout(id int)
#[no_mangle]
pub extern "C" fn clearTimeout(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (id, _) = read_value_arg(input, 0);
    unsafe { host_clear_timeout(id as i32); }
    output_empty(out_len)
}

// startInterval(id int, intervalMs int)
#[no_mangle]
pub extern "C" fn startInterval(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (id, off) = read_value_arg(input, 0);
    let (ms, _) = read_value_arg(input, off);
    unsafe { host_start_interval(id as i32, ms as i32); }
    output_empty(out_len)
}

// clearInterval(id int)
#[no_mangle]
pub extern "C" fn clearInterval(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (id, _) = read_value_arg(input, 0);
    unsafe { host_clear_interval(id as i32); }
    output_empty(out_len)
}

// navigate(path string)
#[no_mangle]
pub extern "C" fn navigate(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (s, _) = read_bytes_arg(input, 0);
    unsafe { host_navigate(s.as_ptr(), s.len() as u32); }
    output_empty(out_len)
}

// getCurrentPath() -> string
#[no_mangle]
pub extern "C" fn getCurrentPath(_ptr: *const u8, _len: u32, out_len: *mut u32) -> *mut u8 {
    let mut path_len: u32 = 0;
    let path_ptr = unsafe { host_get_current_path(&mut path_len) };
    if path_ptr.is_null() || path_len == 0 {
        return output_tag_bytes(b"/", out_len);
    }
    let path = unsafe { std::slice::from_raw_parts(path_ptr, path_len as usize) };
    let result = output_tag_bytes(path, out_len);
    // Host allocated this — we must free it.
    vo_dealloc(path_ptr as *mut u8, path_len);
    result
}

// Focus(refName string)
#[no_mangle]
pub extern "C" fn Focus(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (s, _) = read_bytes_arg(input, 0);
    unsafe { host_focus(s.as_ptr(), s.len() as u32); }
    output_empty(out_len)
}

// Blur(refName string)
#[no_mangle]
pub extern "C" fn Blur(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (s, _) = read_bytes_arg(input, 0);
    unsafe { host_blur(s.as_ptr(), s.len() as u32); }
    output_empty(out_len)
}

// ScrollTo(refName string, top int)
#[no_mangle]
pub extern "C" fn ScrollTo(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (s, off) = read_bytes_arg(input, 0);
    let (top, _) = read_value_arg(input, off);
    unsafe { host_scroll_to(s.as_ptr(), s.len() as u32, top as i32); }
    output_empty(out_len)
}

// ScrollIntoView(refName string)
#[no_mangle]
pub extern "C" fn ScrollIntoView(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (s, _) = read_bytes_arg(input, 0);
    unsafe { host_scroll_into_view(s.as_ptr(), s.len() as u32); }
    output_empty(out_len)
}

// SelectText(refName string)
#[no_mangle]
pub extern "C" fn SelectText(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (s, _) = read_bytes_arg(input, 0);
    unsafe { host_select_text(s.as_ptr(), s.len() as u32); }
    output_empty(out_len)
}

// setDocTitle(title string)
#[no_mangle]
pub extern "C" fn setDocTitle(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (s, _) = read_bytes_arg(input, 0);
    unsafe { host_set_title(s.as_ptr(), s.len() as u32); }
    output_empty(out_len)
}

// setDocMeta(name string, content string)
#[no_mangle]
pub extern "C" fn setDocMeta(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (name, off) = read_bytes_arg(input, 0);
    let (content, _) = read_bytes_arg(input, off);
    unsafe { host_set_meta(name.as_ptr(), name.len() as u32, content.as_ptr(), content.len() as u32); }
    output_empty(out_len)
}

// toastEmit(message string, typ string, durationMs int)
#[no_mangle]
pub extern "C" fn toastEmit(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (msg, off1) = read_bytes_arg(input, 0);
    let (typ, off2) = read_bytes_arg(input, off1);
    let (dur, _) = read_value_arg(input, off2);
    unsafe { host_toast(msg.as_ptr(), msg.len() as u32, typ.as_ptr(), typ.len() as u32, dur as i32); }
    output_empty(out_len)
}

// startAnimFrame(id int)
#[no_mangle]
pub extern "C" fn startAnimFrame(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (id, _) = read_value_arg(input, 0);
    unsafe { host_start_anim_frame(id as i32); }
    output_empty(out_len)
}

// cancelAnimFrame(id int)
#[no_mangle]
pub extern "C" fn cancelAnimFrame(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (id, _) = read_value_arg(input, 0);
    unsafe { host_cancel_anim_frame(id as i32); }
    output_empty(out_len)
}

// startGameLoop(id int)
#[no_mangle]
pub extern "C" fn startGameLoop(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (id, _) = read_value_arg(input, 0);
    unsafe { host_start_game_loop(id as i32); }
    output_empty(out_len)
}

// stopGameLoop(id int)
#[no_mangle]
pub extern "C" fn stopGameLoop(ptr: *const u8, len: u32, out_len: *mut u32) -> *mut u8 {
    let input = raw_input(ptr, len);
    let (id, _) = read_value_arg(input, 0);
    unsafe { host_stop_game_loop(id as i32); }
    output_empty(out_len)
}
