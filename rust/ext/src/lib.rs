//! VoGUI v2 - Declarative UI framework extern library for Vo.
//!
//! Two-layer state model:
//! - Vo layer: Application state (data, business logic, routing)
//! - JS layer: UI behavior state (dropdown open/close, tooltip, focus, animation)
//!
//! This crate provides extern function implementations for GUI operations.
//! VM management and event loop are handled by the caller (e.g., playground, studio).

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
use vo_runtime::ffi::ExternRegistry;
#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
use vo_vm::bytecode::ExternDef;

pub mod audio;

#[cfg(not(feature = "wasm-standalone"))]
mod externs;

// =============================================================================
// Native: GUI-specific GuiHost (generic host capabilities live in vo_ext::host)
// =============================================================================

#[cfg(not(target_arch = "wasm32"))]
pub trait GuiHost: Send + Sync + 'static {
    fn navigate(&self, _path: &str) {}
    fn get_current_path(&self) -> String {
        "/".to_string()
    }
    fn focus(&self, _ref_name: &str) {}
    fn blur(&self, _ref_name: &str) {}
    fn scroll_to(&self, _ref_name: &str, _top: i32) {}
    fn scroll_into_view(&self, _ref_name: &str) {}
    fn select_text(&self, _ref_name: &str) {}
    fn set_title(&self, _title: &str) {}
    fn set_meta(&self, _name: &str, _content: &str) {}
    fn toast(&self, _message: &str, _typ: &str, _duration_ms: i32) {}
    fn start_anim_frame(&self, _id: i32) {}
    fn cancel_anim_frame(&self, _id: i32) {}
    fn measure_text(
        &self,
        _text: &str,
        _font: &str,
        _max_width: f64,
        _line_height: f64,
        _white_space: i32,
    ) -> (f64, i32) {
        (0.0, 0)
    }
    fn measure_text_lines(
        &self,
        _text: &str,
        _font: &str,
        _max_width: f64,
        _line_height: f64,
        _white_space: i32,
    ) -> Vec<u8> {
        Vec::new()
    }
}

#[cfg(not(target_arch = "wasm32"))]
thread_local! {
    static GUI_HOST: std::cell::RefCell<Option<Box<dyn GuiHost>>> =
        const { std::cell::RefCell::new(None) };
}

#[cfg(not(target_arch = "wasm32"))]
pub fn set_gui_host(host: Box<dyn GuiHost>) {
    GUI_HOST.with(|p| {
        *p.borrow_mut() = Some(host);
    });
}

#[cfg(not(target_arch = "wasm32"))]
pub fn clear_gui_host() {
    GUI_HOST.with(|p| {
        *p.borrow_mut() = None;
    });
}

#[cfg(not(target_arch = "wasm32"))]
pub fn with_gui_host<F, R>(f: F) -> R
where
    F: FnOnce(&dyn GuiHost) -> R,
{
    GUI_HOST.with(|p| {
        let borrow = p.borrow();
        match borrow.as_ref() {
            Some(host) => f(host.as_ref()),
            None => f(&NoopGuiHost),
        }
    })
}

#[cfg(not(target_arch = "wasm32"))]
struct NoopGuiHost;

#[cfg(not(target_arch = "wasm32"))]
impl GuiHost for NoopGuiHost {}

// =============================================================================
// WASM: monolithic VoguiPlatform (vo-ext wasm has no platform module)
// =============================================================================

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
pub trait VoguiPlatform: Send + Sync + 'static {
    fn start_timeout(&self, id: i32, ms: i32);
    fn clear_timeout(&self, id: i32);
    fn start_interval(&self, id: i32, ms: i32);
    fn clear_interval(&self, id: i32);
    fn has_host_capability(&self, _name: &str) -> bool {
        false
    }
    fn start_tick_loop(&self, _id: i32) {}
    fn stop_tick_loop(&self, _id: i32) {}
    fn navigate(&self, _path: &str) {}
    fn get_current_path(&self) -> String {
        "/".to_string()
    }
    fn focus(&self, _ref_name: &str) {}
    fn blur(&self, _ref_name: &str) {}
    fn scroll_to(&self, _ref_name: &str, _top: i32) {}
    fn scroll_into_view(&self, _ref_name: &str) {}
    fn select_text(&self, _ref_name: &str) {}
    fn set_title(&self, _title: &str) {}
    fn set_meta(&self, _name: &str, _content: &str) {}
    fn toast(&self, _message: &str, _typ: &str, _duration_ms: i32) {}
    fn start_anim_frame(&self, _id: i32) {}
    fn cancel_anim_frame(&self, _id: i32) {}
    fn measure_text(
        &self,
        _text: &str,
        _font: &str,
        _max_width: f64,
        _line_height: f64,
        _white_space: i32,
    ) -> (f64, i32) {
        (0.0, 0)
    }
    fn measure_text_lines(
        &self,
        _text: &str,
        _font: &str,
        _max_width: f64,
        _line_height: f64,
        _white_space: i32,
    ) -> Vec<u8> {
        Vec::new()
    }
}

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
thread_local! {
    static PLATFORM: std::cell::RefCell<Option<Box<dyn VoguiPlatform>>> =
        const { std::cell::RefCell::new(None) };
}

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
pub fn set_platform(platform: Box<dyn VoguiPlatform>) {
    PLATFORM.with(|p| {
        *p.borrow_mut() = Some(platform);
    });
}

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
pub fn clear_platform() {
    PLATFORM.with(|p| {
        *p.borrow_mut() = None;
    });
}

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
pub fn with_platform<F, R>(f: F) -> R
where
    F: FnOnce(&dyn VoguiPlatform) -> R,
{
    PLATFORM.with(|p| {
        let borrow = p.borrow();
        match borrow.as_ref() {
            Some(platform) => f(platform.as_ref()),
            None => f(&NoopPlatform),
        }
    })
}

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
struct NoopPlatform;

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
impl VoguiPlatform for NoopPlatform {
    fn start_timeout(&self, _id: i32, _ms: i32) {}
    fn clear_timeout(&self, _id: i32) {}
    fn start_interval(&self, _id: i32, _ms: i32) {}
    fn clear_interval(&self, _id: i32) {}
}

// =============================================================================
// WASM platform (JS imports via wasm_bindgen)
// =============================================================================

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
pub struct WasmPlatform;

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
mod wasm_js {
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_name = startTimeout)]
        pub fn start_timeout(id: i32, ms: i32);

        #[wasm_bindgen(js_name = clearTimeout)]
        pub fn clear_timeout(id: i32);

        #[wasm_bindgen(js_name = startInterval)]
        pub fn start_interval(id: i32, ms: i32);

        #[wasm_bindgen(js_name = clearInterval)]
        pub fn clear_interval(id: i32);

        #[wasm_bindgen(js_name = navigate)]
        pub fn navigate(path: &str);

        #[wasm_bindgen(js_name = getCurrentPath)]
        pub fn get_current_path() -> String;

        #[wasm_bindgen(js_name = voguiFocus)]
        pub fn focus(ref_name: &str);

        #[wasm_bindgen(js_name = voguiBlur)]
        pub fn blur(ref_name: &str);

        #[wasm_bindgen(js_name = voguiScrollTo)]
        pub fn scroll_to(ref_name: &str, top: i32);

        #[wasm_bindgen(js_name = voguiScrollIntoView)]
        pub fn scroll_into_view(ref_name: &str);

        #[wasm_bindgen(js_name = voguiSelectText)]
        pub fn select_text(ref_name: &str);

        #[wasm_bindgen(js_name = voguiSetTitle)]
        pub fn set_title(title: &str);

        #[wasm_bindgen(js_name = voguiSetMeta)]
        pub fn set_meta(name: &str, content: &str);

        #[wasm_bindgen(js_name = voguiToast)]
        pub fn toast(message: &str, typ: &str, duration_ms: i32);

        #[wasm_bindgen(js_name = voguiStartAnimFrame)]
        pub fn start_anim_frame(id: i32);

        #[wasm_bindgen(js_name = voguiCancelAnimFrame)]
        pub fn cancel_anim_frame(id: i32);

        #[wasm_bindgen(js_name = voguiStartGameLoop)]
        pub fn start_tick_loop(id: i32);

        #[wasm_bindgen(js_name = voguiStopGameLoop)]
        pub fn stop_tick_loop(id: i32);
    }
}

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
impl VoguiPlatform for WasmPlatform {
    fn start_timeout(&self, id: i32, ms: i32) {
        wasm_js::start_timeout(id, ms);
    }
    fn clear_timeout(&self, id: i32) {
        wasm_js::clear_timeout(id);
    }
    fn start_interval(&self, id: i32, ms: i32) {
        wasm_js::start_interval(id, ms);
    }
    fn clear_interval(&self, id: i32) {
        wasm_js::clear_interval(id);
    }
    fn navigate(&self, path: &str) {
        wasm_js::navigate(path);
    }
    fn get_current_path(&self) -> String {
        wasm_js::get_current_path()
    }
    fn focus(&self, ref_name: &str) {
        wasm_js::focus(ref_name);
    }
    fn blur(&self, ref_name: &str) {
        wasm_js::blur(ref_name);
    }
    fn scroll_to(&self, ref_name: &str, top: i32) {
        wasm_js::scroll_to(ref_name, top);
    }
    fn scroll_into_view(&self, ref_name: &str) {
        wasm_js::scroll_into_view(ref_name);
    }
    fn select_text(&self, ref_name: &str) {
        wasm_js::select_text(ref_name);
    }
    fn set_title(&self, title: &str) {
        wasm_js::set_title(title);
    }
    fn set_meta(&self, name: &str, content: &str) {
        wasm_js::set_meta(name, content);
    }
    fn toast(&self, message: &str, typ: &str, duration_ms: i32) {
        wasm_js::toast(message, typ, duration_ms);
    }
    fn start_anim_frame(&self, id: i32) {
        wasm_js::start_anim_frame(id);
    }
    fn cancel_anim_frame(&self, id: i32) {
        wasm_js::cancel_anim_frame(id);
    }
    fn start_tick_loop(&self, id: i32) {
        wasm_js::start_tick_loop(id);
    }
    fn stop_tick_loop(&self, id: i32) {
        wasm_js::stop_tick_loop(id);
    }
}

// =============================================================================
// Public API
// =============================================================================

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
pub fn register_externs(registry: &mut ExternRegistry, externs: &[ExternDef]) {
    externs::vo_ext_register(registry, externs);
}

/// Keep this crate's explicit native entry table reachable so its linkme
/// catalog survives dead-code elimination. Call from the final binary's init
/// path when linking VoGUI as an rlib dependency.
#[cfg(all(not(target_arch = "wasm32"), not(feature = "wasm-standalone")))]
pub fn ensure_linked() {
    let _ = std::hint::black_box(externs::VO_EXT_ENTRIES);
}

#[cfg(all(test, not(target_arch = "wasm32"), not(feature = "wasm-standalone")))]
mod tests {
    use std::collections::BTreeSet;

    use vo_runtime::bytecode::ExternDef;
    use vo_runtime::ffi::{ExternRegistry, EXTERN_MODULE_OWNER_TABLE, EXTERN_TABLE};

    #[test]
    fn every_native_entry_registers_with_the_vogui_atomic_catalog_owner() {
        super::ensure_linked();
        assert!(!super::externs::VO_EXT_ENTRIES.is_empty());
        let mut names = BTreeSet::new();
        let definitions = super::externs::VO_EXT_ENTRIES
            .iter()
            .map(|entry| {
                let name = unsafe { entry.name_unchecked() }.to_string();
                assert!(names.insert(name.clone()), "duplicate VoGUI extern {name}");
                ExternDef::call_site_variadic(
                    name,
                    0,
                    entry
                        .effects()
                        .expect("generated extern effects must be valid"),
                    Vec::new(),
                )
            })
            .collect::<Vec<_>>();
        let linked_names = EXTERN_TABLE
            .iter()
            .filter_map(|entry| {
                let owner = unsafe { entry.module_owner_unchecked() };
                (owner == "github.com/vo-lang/vogui")
                    .then(|| unsafe { entry.name_unchecked() }.to_string())
            })
            .collect::<BTreeSet<_>>();
        assert_eq!(linked_names, names, "explicit and linkme catalogs diverged");
        let owner_declarations = EXTERN_MODULE_OWNER_TABLE
            .iter()
            .filter(|entry| {
                let bytes = unsafe {
                    std::slice::from_raw_parts(
                        entry.module_owner_ptr,
                        entry.module_owner_len as usize,
                    )
                };
                bytes == b"github.com/vo-lang/vogui"
            })
            .count();
        assert_eq!(owner_declarations, 1);
        let mut registry = ExternRegistry::new();

        registry
            .register_from_extension_catalogs(None, &definitions)
            .expect("VoGUI native entries must register through one atomic catalog");

        for name in names {
            let registered = registry
                .registered_by_name(&name)
                .expect("every VoGUI native extern must be registered");
            assert_eq!(
                registered.provider_module_owner(),
                Some("github.com/vo-lang/vogui"),
                "wrong provider owner for {name}",
            );
        }
    }
}

// =============================================================================
// Standalone C-ABI WASM exports (feature = "wasm-standalone")
// =============================================================================
//
// Follows the same ext_bridge calling convention as zip:
//   vo_alloc(size) → ptr
//   vo_dealloc(ptr, size)
//   <extern_name>(input_ptr, input_len, out_len_ptr) → output_ptr
//
// For host side effects (timers, DOM, game loop), the module declares raw
// WASM imports under the "env" namespace.  The host (voSetupExtModule)
// provides these in the importObject during WebAssembly.instantiate.
//
// Control tags for VM-level operations:
//   0x01 (TAG_SUSPEND)     → tells ext bridge to return HostEventWaitAndReplay
//   0x02 (TAG_HOST_OUTPUT) → tells ext bridge to call set_host_output

#[cfg(feature = "wasm-standalone")]
mod standalone;
