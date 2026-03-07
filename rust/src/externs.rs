//! GUI extern functions implemented with vo-ext macros.

use vo_ext::prelude::*;
use vo_runtime::objects::string;

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

// =============================================================================
// Timer Externs
// =============================================================================

#[vo_fn("vogui", "startTimeout")]
pub fn start_timeout(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    let delay_ms = ctx.arg_i64(slots::ARG_DELAY_MS) as i32;
    crate::with_platform(|p| p.start_timeout(id, delay_ms));
    ExternResult::Ok
}

#[vo_fn("vogui", "clearTimeout")]
pub fn clear_timeout(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    crate::with_platform(|p| p.clear_timeout(id));
    ExternResult::Ok
}

#[vo_fn("vogui", "startInterval")]
pub fn start_interval(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    let interval_ms = ctx.arg_i64(slots::ARG_INTERVAL_MS) as i32;
    crate::with_platform(|p| p.start_interval(id, interval_ms));
    ExternResult::Ok
}

#[vo_fn("vogui", "clearInterval")]
pub fn clear_interval(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    crate::with_platform(|p| p.clear_interval(id));
    ExternResult::Ok
}

// =============================================================================
// Router Externs
// =============================================================================

#[vo_fn("vogui", "navigate")]
pub fn navigate(ctx: &mut ExternCallContext) -> ExternResult {
    let path = ctx.arg_str(slots::ARG_PATH).to_string();
    crate::with_platform(|p| p.navigate(&path));
    ExternResult::Ok
}

#[vo_fn("vogui", "getCurrentPath")]
pub fn get_current_path(ctx: &mut ExternCallContext) -> ExternResult {
    let path = crate::with_platform(|p| p.get_current_path());
    let gc_ref = string::from_rust_str(ctx.gc(), &path);
    ctx.ret_ref(slots::RET_0, gc_ref);
    ExternResult::Ok
}

// =============================================================================
// Ref / DOM Access Externs
// =============================================================================

#[vo_fn("vogui", "Focus")]
pub fn focus(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    crate::with_platform(|p| p.focus(&ref_name));
    ExternResult::Ok
}

#[vo_fn("vogui", "Blur")]
pub fn blur(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    crate::with_platform(|p| p.blur(&ref_name));
    ExternResult::Ok
}

#[vo_fn("vogui", "ScrollTo")]
pub fn scroll_to(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    let top = ctx.arg_i64(slots::ARG_TOP) as i32;
    crate::with_platform(|p| p.scroll_to(&ref_name, top));
    ExternResult::Ok
}

#[vo_fn("vogui", "ScrollIntoView")]
pub fn scroll_into_view(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    crate::with_platform(|p| p.scroll_into_view(&ref_name));
    ExternResult::Ok
}

#[vo_fn("vogui", "SelectText")]
pub fn select_text(ctx: &mut ExternCallContext) -> ExternResult {
    let ref_name = ctx.arg_str(slots::ARG_REF_NAME).to_string();
    crate::with_platform(|p| p.select_text(&ref_name));
    ExternResult::Ok
}

// =============================================================================
// Head Management Externs
// =============================================================================

#[vo_fn("vogui", "setDocTitle")]
pub fn set_doc_title(ctx: &mut ExternCallContext) -> ExternResult {
    let title = ctx.arg_str(slots::ARG_TITLE).to_string();
    crate::with_platform(|p| p.set_title(&title));
    ExternResult::Ok
}

#[vo_fn("vogui", "setDocMeta")]
pub fn set_doc_meta(ctx: &mut ExternCallContext) -> ExternResult {
    let name = ctx.arg_str(slots::ARG_NAME).to_string();
    let content = ctx.arg_str(slots::ARG_CONTENT).to_string();
    crate::with_platform(|p| p.set_meta(&name, &content));
    ExternResult::Ok
}

// =============================================================================
// Animation Frame & Game Loop Externs
// =============================================================================

#[vo_fn("vogui", "startAnimFrame")]
pub fn start_anim_frame(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    crate::with_platform(|p| p.start_anim_frame(id));
    ExternResult::Ok
}

#[vo_fn("vogui", "cancelAnimFrame")]
pub fn cancel_anim_frame(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    crate::with_platform(|p| p.cancel_anim_frame(id));
    ExternResult::Ok
}

#[vo_fn("vogui", "startGameLoop")]
pub fn start_game_loop(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    crate::with_platform(|p| p.start_game_loop(id));
    ExternResult::Ok
}

#[vo_fn("vogui", "stopGameLoop")]
pub fn stop_game_loop(ctx: &mut ExternCallContext) -> ExternResult {
    let id = ctx.arg_i64(slots::ARG_ID) as i32;
    crate::with_platform(|p| p.stop_game_loop(id));
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
    crate::with_platform(|p| p.toast(&message, &typ, duration_ms));
    ExternResult::Ok
}

// =============================================================================
// Export all entries for registration
// =============================================================================

#[cfg(target_arch = "wasm32")]
vo_ext::export_extensions!(
    __EXT_vogui_waitForEvent,
    __EXT_vogui_emitRenderBinary,
    __EXT_vogui_float64bits,
    __EXT_vogui_startTimeout,
    __EXT_vogui_clearTimeout,
    __EXT_vogui_startInterval,
    __EXT_vogui_clearInterval,
    __EXT_vogui_navigate,
    __EXT_vogui_getCurrentPath,
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
    __EXT_vogui_stopGameLoop
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
