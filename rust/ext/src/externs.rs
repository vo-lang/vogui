//! GUI extern functions implemented with vo-ext macros.

use vo_ext::prelude::*;
use vo_runtime::objects::string;

use crate::audio::{with_global_audio, with_global_audio_result};

// =============================================================================
// Platform dispatch helpers
// =============================================================================

#[cfg(target_arch = "wasm32")]
fn with_host<F, R>(f: F) -> R where F: FnOnce(&dyn crate::VoguiPlatform) -> R {
    crate::with_platform(f)
}

#[cfg(not(target_arch = "wasm32"))]
fn with_gui<F, R>(f: F) -> R where F: FnOnce(&dyn crate::GuiHost) -> R {
    crate::with_gui_host(f)
}
#[cfg(target_arch = "wasm32")]
fn with_gui<F, R>(f: F) -> R where F: FnOnce(&dyn crate::VoguiPlatform) -> R {
    crate::with_platform(f)
}

// =============================================================================
// App Externs
// =============================================================================

#[vo_fn("vogui", "waitForEvent")]
pub fn wait_for_event(ctx: &mut ExternCallContext) -> ExternResult {
    // Replay path: host attached event data via wake_host_event_with_data
    if let Some(_token) = ctx.take_resume_host_event_token() {
        let data = ctx.take_resume_host_event_data()
            .expect("waitForEvent woke but no resume data");
        // Decode: [i32 handler_id LE][UTF-8 payload]
        let handler_id = i32::from_le_bytes(data[..4].try_into().unwrap());
        let payload = std::str::from_utf8(&data[4..]).unwrap();
        ctx.ret_i64(slots::RET_0, handler_id as i64);
        let payload_ref = vo_runtime::objects::string::from_rust_str(ctx.gc(), payload);
        ctx.ret_ref(slots::RET_1, payload_ref);
        return ExternResult::Ok;
    }

    // First call: generate token, block fiber
    let token = ctx.next_host_event_token();
    ExternResult::HostEventWaitAndReplay { token }
}

#[vo_fn("vogui", "emitRenderBinary")]
pub fn emit_render_binary(ctx: &mut ExternCallContext) -> ExternResult {
    let data = ctx.arg_bytes(slots::ARG_DATA).to_vec();
    ctx.set_host_output(data);
    ExternResult::Ok
}

#[vo_fn("vogui", "float64bits")]
pub fn float64_bits(ctx: &mut ExternCallContext) -> ExternResult {
    let f = ctx.arg_f64(slots::ARG_F);
    ctx.ret_i64(slots::RET_0, f.to_bits() as i64);
    ExternResult::Ok
}

#[vo_fn("vogui", "float64frombits")]
pub fn float64_from_bits(ctx: &mut ExternCallContext) -> ExternResult {
    let bits = ctx.arg_i64(slots::ARG_BITS) as u64;
    ctx.ret_f64(slots::RET_0, f64::from_bits(bits));
    ExternResult::Ok
}

// =============================================================================
// Text Measurement Externs
// =============================================================================

#[vo_fn("vogui", "measureText")]
pub fn measure_text(ctx: &mut ExternCallContext) -> ExternResult {
    let text = ctx.arg_str(slots::ARG_TEXT).to_string();
    let font = ctx.arg_str(slots::ARG_FONT).to_string();
    let max_width = ctx.arg_f64(slots::ARG_MAX_WIDTH);
    let line_height = ctx.arg_f64(slots::ARG_LINE_HEIGHT);
    let white_space = ctx.arg_i64(slots::ARG_WHITE_SPACE) as i32;
    let (height, line_count) = with_gui(|p| p.measure_text(&text, &font, max_width, line_height, white_space));
    ctx.ret_f64(slots::RET_0, height);
    ctx.ret_i64(slots::RET_1, line_count as i64);
    ExternResult::Ok
}

#[vo_fn("vogui", "measureTextLinesRaw")]
pub fn measure_text_lines_raw(ctx: &mut ExternCallContext) -> ExternResult {
    let text = ctx.arg_str(slots::ARG_TEXT).to_string();
    let font = ctx.arg_str(slots::ARG_FONT).to_string();
    let max_width = ctx.arg_f64(slots::ARG_MAX_WIDTH);
    let line_height = ctx.arg_f64(slots::ARG_LINE_HEIGHT);
    let white_space = ctx.arg_i64(slots::ARG_WHITE_SPACE) as i32;
    let data = with_gui(|p| p.measure_text_lines(&text, &font, max_width, line_height, white_space));
    let gc_ref = ctx.alloc_bytes(&data);
    ctx.ret_ref(slots::RET_0, gc_ref);
    ExternResult::Ok
}

// =============================================================================
// Timer Externs
// =============================================================================

#[vo_fn("vogui", "startTimeout")]
pub fn start_timeout(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    let delay_ms = ctx.arg_i64(slots::ARG_DELAY_MS) as i32;
    #[cfg(not(target_arch = "wasm32"))]
    vo_ext::host::timer::start_timeout(id, delay_ms);
    #[cfg(target_arch = "wasm32")]
    with_host(|p| p.start_timeout(id, delay_ms));
    ExternResult::Ok
}

#[vo_fn("vogui", "clearTimeout")]
pub fn clear_timeout(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    #[cfg(not(target_arch = "wasm32"))]
    vo_ext::host::timer::clear_timeout(id);
    #[cfg(target_arch = "wasm32")]
    with_host(|p| p.clear_timeout(id));
    ExternResult::Ok
}

#[vo_fn("vogui", "startInterval")]
pub fn start_interval(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    let interval_ms = ctx.arg_i64(slots::ARG_INTERVAL_MS) as i32;
    #[cfg(not(target_arch = "wasm32"))]
    vo_ext::host::timer::start_interval(id, interval_ms);
    #[cfg(target_arch = "wasm32")]
    with_host(|p| p.start_interval(id, interval_ms));
    ExternResult::Ok
}

#[vo_fn("vogui", "clearInterval")]
pub fn clear_interval(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    #[cfg(not(target_arch = "wasm32"))]
    vo_ext::host::timer::clear_interval(id);
    #[cfg(target_arch = "wasm32")]
    with_host(|p| p.clear_interval(id));
    ExternResult::Ok
}

// =============================================================================
// Router Externs
// =============================================================================

#[vo_fn("vogui", "navigate")]
pub fn navigate(ctx: &mut ExternCallContext) -> ExternResult {
    let path = ctx.arg_str(slots::ARG_PATH).to_string();
    with_gui(|p| p.navigate(&path));
    ExternResult::Ok
}

#[vo_fn("vogui", "getCurrentPath")]
pub fn get_current_path(ctx: &mut ExternCallContext) -> ExternResult {
    let path = with_gui(|p| p.get_current_path());
    let gc_ref = string::from_rust_str(ctx.gc(), &path);
    ctx.ret_ref(slots::RET_0, gc_ref);
    ExternResult::Ok
}

#[vo_fn("vogui", "HasHostCapability")]
pub fn has_host_capability(ctx: &mut ExternCallContext) -> ExternResult {
    let name = ctx.arg_str(slots::ARG_NAME).to_string();
    #[cfg(not(target_arch = "wasm32"))]
    let result = vo_ext::host::capability::has(&name);
    #[cfg(target_arch = "wasm32")]
    let result = with_host(|p| p.has_host_capability(&name));
    ctx.ret_bool(slots::RET_0, result);
    ExternResult::Ok
}

// =============================================================================
// Ref / DOM Access Externs
// =============================================================================

#[vo_fn("vogui", "Focus")]
pub fn focus(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    with_gui(|p| p.focus(&ref_name));
    ExternResult::Ok
}

#[vo_fn("vogui", "Blur")]
pub fn blur(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    with_gui(|p| p.blur(&ref_name));
    ExternResult::Ok
}

#[vo_fn("vogui", "ScrollTo")]
pub fn scroll_to(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    let top = ctx.arg_i64(slots::ARG_TOP) as i32;
    with_gui(|p| p.scroll_to(&ref_name, top));
    ExternResult::Ok
}

#[vo_fn("vogui", "ScrollIntoView")]
pub fn scroll_into_view(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    with_gui(|p| p.scroll_into_view(&ref_name));
    ExternResult::Ok
}

#[vo_fn("vogui", "SelectText")]
pub fn select_text(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    with_gui(|p| p.select_text(&ref_name));
    ExternResult::Ok
}

// =============================================================================
// Head Management Externs
// =============================================================================

#[vo_fn("vogui", "setDocTitle")]
pub fn set_doc_title(ctx: &mut ExternCallContext) -> ExternResult {
    let title = ctx.arg_str(slots::ARG_TITLE).to_string();
    with_gui(|p| p.set_title(&title));
    ExternResult::Ok
}

#[vo_fn("vogui", "setDocMeta")]
pub fn set_doc_meta(ctx: &mut ExternCallContext) -> ExternResult {
    let name = ctx.arg_str(slots::ARG_NAME).to_string();
    let content = ctx.arg_str(slots::ARG_CONTENT).to_string();
    with_gui(|p| p.set_meta(&name, &content));
    ExternResult::Ok
}

// =============================================================================
// Animation Frame & Game Loop Externs
// =============================================================================

#[vo_fn("vogui", "startAnimFrame")]
pub fn start_anim_frame(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    with_gui(|p| p.start_anim_frame(id));
    ExternResult::Ok
}

#[vo_fn("vogui", "cancelAnimFrame")]
pub fn cancel_anim_frame(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    with_gui(|p| p.cancel_anim_frame(id));
    ExternResult::Ok
}

#[vo_fn("vogui", "startGameLoop")]
pub fn start_game_loop(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    #[cfg(not(target_arch = "wasm32"))]
    vo_ext::host::tick::start_tick_loop(id);
    #[cfg(target_arch = "wasm32")]
    with_host(|p| p.start_tick_loop(id));
    ExternResult::Ok
}

#[vo_fn("vogui", "stopGameLoop")]
pub fn stop_game_loop(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    #[cfg(not(target_arch = "wasm32"))]
    vo_ext::host::tick::stop_tick_loop(id);
    #[cfg(target_arch = "wasm32")]
    with_host(|p| p.stop_tick_loop(id));
    ExternResult::Ok
}

// =============================================================================
// Toast Extern
// =============================================================================

#[vo_fn("vogui", "toastEmit")]
pub fn toast_emit(ctx: &mut ExternCallContext) -> ExternResult {
    let message = ctx.arg_str(slots::ARG_MESSAGE).to_string();
    let typ = ctx.arg_str(slots::ARG_TYP).to_string();
    let duration_ms = ctx.arg_i64(slots::ARG_DURATION_MS) as i32;
    with_gui(|p| p.toast(&message, &typ, duration_ms));
    ExternResult::Ok
}

// =============================================================================
// Audio Externs
// =============================================================================

fn write_u32_handle_result(
    ctx: &mut ExternCallContext,
    value_slot: u16,
    error_slot: u16,
    result: Result<u32, String>,
) {
    use vo_runtime::builtins::error_helper::{write_error_to, write_nil_error};
    match result {
        Ok(id) => {
            ctx.ret_u64(value_slot, id as u64);
            write_nil_error(ctx, error_slot);
        }
        Err(msg) => {
            ctx.ret_u64(value_slot, 0);
            write_error_to(ctx, error_slot, &msg);
        }
    }
}

#[vo_fn("vogui", "audioLoadBytes")]
pub fn audio_load_bytes(ctx: &mut ExternCallContext) -> ExternResult {
    let data = ctx.arg_bytes(0).to_vec();
    write_u32_handle_result(ctx, 0, 1, with_global_audio_result(|engine| engine.load_bytes(data)));
    ExternResult::Ok
}

#[vo_fn("vogui", "audioFree")]
pub fn audio_free(ctx: &mut ExternCallContext) -> ExternResult {
    let clip_id = ctx.arg_u64(0) as u32;
    let _ = with_global_audio(|engine| engine.free_clip(clip_id));
    ExternResult::Ok
}

#[vo_fn("vogui", "audioPlaySound")]
pub fn audio_play_sound(ctx: &mut ExternCallContext) -> ExternResult {
    let clip_id = ctx.arg_u64(0) as u32;
    let volume = ctx.arg_f64(1) as f32;
    let pitch = ctx.arg_f64(2) as f32;
    let _ = with_global_audio(|engine| engine.play_sound(clip_id, volume, pitch));
    ExternResult::Ok
}

#[vo_fn("vogui", "audioSetListener")]
pub fn audio_set_listener(ctx: &mut ExternCallContext) -> ExternResult {
    let px = ctx.arg_f64(0) as f32;
    let py = ctx.arg_f64(1) as f32;
    let pz = ctx.arg_f64(2) as f32;
    let fx = ctx.arg_f64(3) as f32;
    let fy = ctx.arg_f64(4) as f32;
    let fz = ctx.arg_f64(5) as f32;
    let ux = ctx.arg_f64(6) as f32;
    let uy = ctx.arg_f64(7) as f32;
    let uz = ctx.arg_f64(8) as f32;
    let _ = with_global_audio(|engine| engine.set_listener([px, py, pz], [fx, fy, fz], [ux, uy, uz]));
    ExternResult::Ok
}

#[vo_fn("vogui", "audioPlaySound3D")]
pub fn audio_play_sound_3d(ctx: &mut ExternCallContext) -> ExternResult {
    let clip_id = ctx.arg_u64(0) as u32;
    let px = ctx.arg_f64(1) as f32;
    let py = ctx.arg_f64(2) as f32;
    let pz = ctx.arg_f64(3) as f32;
    let volume = ctx.arg_f64(4) as f32;
    let ref_distance = ctx.arg_f64(5) as f32;
    let max_distance = ctx.arg_f64(6) as f32;
    let _ = with_global_audio(|engine| {
        engine.play_sound_3d(clip_id, [px, py, pz], volume, ref_distance, max_distance)
    });
    ExternResult::Ok
}

#[vo_fn("vogui", "audioCreateSource3D")]
pub fn audio_create_source_3d(ctx: &mut ExternCallContext) -> ExternResult {
    let clip_id = ctx.arg_u64(0) as u32;
    let px = ctx.arg_f64(1) as f32;
    let py = ctx.arg_f64(2) as f32;
    let pz = ctx.arg_f64(3) as f32;
    let volume = ctx.arg_f64(4) as f32;
    let ref_distance = ctx.arg_f64(5) as f32;
    let max_distance = ctx.arg_f64(6) as f32;
    write_u32_handle_result(ctx, 0, 1, with_global_audio_result(|engine| {
        engine.create_source_3d(clip_id, [px, py, pz], volume, ref_distance, max_distance)
    }));
    ExternResult::Ok
}

#[vo_fn("vogui", "audioUpdateSpatial")]
pub fn audio_update_spatial(_ctx: &mut ExternCallContext) -> ExternResult {
    let _ = with_global_audio(|engine| engine.update_spatial_sources());
    ExternResult::Ok
}

#[vo_fn("vogui", "audioSetSource3DPos")]
pub fn audio_set_source_3d_pos(ctx: &mut ExternCallContext) -> ExternResult {
    let source_id = ctx.arg_u64(0) as u32;
    let px = ctx.arg_f64(1) as f32;
    let py = ctx.arg_f64(2) as f32;
    let pz = ctx.arg_f64(3) as f32;
    let _ = with_global_audio(|engine| engine.set_source_3d_position(source_id, [px, py, pz]));
    ExternResult::Ok
}

#[vo_fn("vogui", "audioRemoveSource3D")]
pub fn audio_remove_source_3d(ctx: &mut ExternCallContext) -> ExternResult {
    let source_id = ctx.arg_u64(0) as u32;
    let _ = with_global_audio(|engine| engine.remove_source_3d(source_id));
    ExternResult::Ok
}

#[vo_fn("vogui", "audioPlayMusic")]
pub fn audio_play_music(ctx: &mut ExternCallContext) -> ExternResult {
    let clip_id = ctx.arg_u64(0) as u32;
    let volume = ctx.arg_f64(1) as f32;
    let _ = with_global_audio(|engine| engine.play_music(clip_id, volume));
    ExternResult::Ok
}

#[vo_fn("vogui", "audioStopMusic")]
pub fn audio_stop_music(_ctx: &mut ExternCallContext) -> ExternResult {
    let _ = with_global_audio(|engine| engine.stop_music());
    ExternResult::Ok
}

#[vo_fn("vogui", "audioPauseMusic")]
pub fn audio_pause_music(_ctx: &mut ExternCallContext) -> ExternResult {
    let _ = with_global_audio(|engine| engine.pause_music());
    ExternResult::Ok
}

#[vo_fn("vogui", "audioResumeMusic")]
pub fn audio_resume_music(_ctx: &mut ExternCallContext) -> ExternResult {
    let _ = with_global_audio(|engine| engine.resume_music());
    ExternResult::Ok
}

#[vo_fn("vogui", "audioSetSFXVolume")]
pub fn audio_set_sfx_volume(ctx: &mut ExternCallContext) -> ExternResult {
    let vol = ctx.arg_f64(0) as f32;
    let _ = with_global_audio(|engine| engine.set_sfx_volume(vol));
    ExternResult::Ok
}

#[vo_fn("vogui", "audioSetMusicVolume")]
pub fn audio_set_music_volume(ctx: &mut ExternCallContext) -> ExternResult {
    let vol = ctx.arg_f64(0) as f32;
    let _ = with_global_audio(|engine| engine.set_music_volume(vol));
    ExternResult::Ok
}

// =============================================================================
// Export all entries for registration
// =============================================================================

#[cfg(not(target_arch = "wasm32"))]
vo_ext::export_extensions!();

#[cfg(target_arch = "wasm32")]
vo_ext::export_extensions!(
    __EXT_vogui_waitForEvent,
    __EXT_vogui_emitRenderBinary,
    __EXT_vogui_float64bits,
    __EXT_vogui_float64frombits,
    __EXT_vogui_measureText,
    __EXT_vogui_measureTextLinesRaw,
    __EXT_vogui_startTimeout,
    __EXT_vogui_clearTimeout,
    __EXT_vogui_startInterval,
    __EXT_vogui_clearInterval,
    __EXT_vogui_navigate,
    __EXT_vogui_getCurrentPath,
    __EXT_vogui_HasHostCapability,
    __EXT_vogui_Focus,
    __EXT_vogui_Blur,
    __EXT_vogui_ScrollTo,
    __EXT_vogui_ScrollIntoView,
    __EXT_vogui_SelectText,
    __EXT_vogui_setDocTitle,
    __EXT_vogui_setDocMeta,
    __EXT_vogui_toastEmit,
    __EXT_vogui_startAnimFrame,
    __EXT_vogui_cancelAnimFrame,
    __EXT_vogui_startGameLoop,
    __EXT_vogui_stopGameLoop,
    // audio
    __EXT_vogui_audioLoadBytes,
    __EXT_vogui_audioFree,
    __EXT_vogui_audioPlaySound,
    __EXT_vogui_audioSetListener,
    __EXT_vogui_audioPlaySound3D,
    __EXT_vogui_audioCreateSource3D,
    __EXT_vogui_audioUpdateSpatial,
    __EXT_vogui_audioSetSource3DPos,
    __EXT_vogui_audioRemoveSource3D,
    __EXT_vogui_audioPlayMusic,
    __EXT_vogui_audioStopMusic,
    __EXT_vogui_audioPauseMusic,
    __EXT_vogui_audioResumeMusic,
    __EXT_vogui_audioSetSFXVolume,
    __EXT_vogui_audioSetMusicVolume
);

// =============================================================================
// Registration function
// =============================================================================

use vo_runtime::ffi::ExternRegistry;
use vo_vm::bytecode::ExternDef;

/// Register all GUI extern functions into the provided registry.
pub fn vo_ext_register(registry: &mut ExternRegistry, externs: &[ExternDef]) {
    #[cfg(not(target_arch = "wasm32"))]
    {
        registry.register_from_linkme(externs);
    }

    #[cfg(target_arch = "wasm32")]
    {
        fn find_id(externs: &[ExternDef], name: &str) -> Option<u32> {
            externs.iter().position(|d| d.name == name).map(|i| i as u32)
        }
        for entry in VO_EXT_ENTRIES {
            if let Some(id) = find_id(externs, entry.name()) {
                entry.register(registry, id);
            }
        }
    }
}
