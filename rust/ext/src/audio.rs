//! Audio engine for the Vo ecosystem.
//!
//! Full audio playback — SFX, music, volume groups, 3D spatial audio —
//! with native (rodio) and WASM (WebAudio via JS bridge) backends.
//!
//! This is the single source of truth: both vogui and voplay use it.

// =============================================================================
// Native-only: ID generators + 3D math helpers
// =============================================================================

#[cfg(not(target_arch = "wasm32"))]
mod spatial_math {
    use std::sync::atomic::{AtomicU32, Ordering};

    static NEXT_CLIP_ID: AtomicU32 = AtomicU32::new(1);
    static NEXT_SOURCE_ID: AtomicU32 = AtomicU32::new(1);

    pub fn next_clip_id() -> u32 {
        NEXT_CLIP_ID.fetch_add(1, Ordering::Relaxed)
    }

    pub fn next_source_id() -> u32 {
        NEXT_SOURCE_ID.fetch_add(1, Ordering::Relaxed)
    }

    pub const EAR_HALF_SPACING: f32 = 0.1;

    pub fn distance3(a: [f32; 3], b: [f32; 3]) -> f32 {
        let dx = a[0] - b[0];
        let dy = a[1] - b[1];
        let dz = a[2] - b[2];
        (dx * dx + dy * dy + dz * dz).sqrt()
    }

    fn normalize3(v: [f32; 3]) -> [f32; 3] {
        let len = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
        if len <= f32::EPSILON {
            return [0.0, 0.0, 0.0];
        }
        [v[0] / len, v[1] / len, v[2] / len]
    }

    fn cross3(a: [f32; 3], b: [f32; 3]) -> [f32; 3] {
        [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ]
    }

    fn scale3(v: [f32; 3], s: f32) -> [f32; 3] {
        [v[0] * s, v[1] * s, v[2] * s]
    }

    fn add3(a: [f32; 3], b: [f32; 3]) -> [f32; 3] {
        [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
    }

    pub fn spatial_gain(distance: f32, ref_distance: f32, max_distance: f32) -> f32 {
        if distance > max_distance {
            return 0.0;
        }
        ref_distance / distance.max(ref_distance)
    }

    pub struct AudioListener {
        pub position: [f32; 3],
        pub forward: [f32; 3],
        pub up: [f32; 3],
    }

    pub fn default_ears() -> ([f32; 3], [f32; 3]) {
        ([-EAR_HALF_SPACING, 0.0, 0.0], [EAR_HALF_SPACING, 0.0, 0.0])
    }

    pub fn listener_ear_positions(
        position: [f32; 3],
        forward: [f32; 3],
        up: [f32; 3],
    ) -> ([f32; 3], [f32; 3]) {
        let fwd = normalize3(forward);
        let u = normalize3(up);
        let right = normalize3(cross3(fwd, u));
        let ear_offset = scale3(right, EAR_HALF_SPACING);
        (
            add3(position, scale3(ear_offset, -1.0)),
            add3(position, ear_offset),
        )
    }
}

// =============================================================================
// AudioEngine trait — full API including 3D spatial
// =============================================================================

/// Audio engine trait providing full playback + 3D spatial capabilities.
///
/// All methods take `&mut self`; callers wrap in `Mutex` if shared.
pub trait AudioEngine: Send {
    // --- basic ---
    fn load_bytes(&mut self, data: Vec<u8>) -> Result<u32, String>;
    fn free_clip(&mut self, id: u32);
    fn play_sound(&mut self, clip_id: u32, volume: f32, pitch: f32);
    fn play_music(&mut self, clip_id: u32, volume: f32);
    fn stop_music(&mut self);
    fn pause_music(&mut self);
    fn resume_music(&mut self);
    fn set_sfx_volume(&mut self, vol: f32);
    fn set_music_volume(&mut self, vol: f32);

    // --- 3D spatial ---
    fn set_listener(&mut self, position: [f32; 3], forward: [f32; 3], up: [f32; 3]);
    fn play_sound_3d(
        &mut self,
        clip_id: u32,
        source_pos: [f32; 3],
        volume: f32,
        ref_distance: f32,
        max_distance: f32,
    );
    fn create_source_3d(
        &mut self,
        clip_id: u32,
        position: [f32; 3],
        volume: f32,
        ref_distance: f32,
        max_distance: f32,
    ) -> Result<u32, String>;
    fn update_spatial_sources(&mut self);
    fn set_source_3d_position(&mut self, source_id: u32, position: [f32; 3]);
    fn remove_source_3d(&mut self, source_id: u32);
}

// =============================================================================
// Native backend (rodio)
// =============================================================================

#[cfg(not(target_arch = "wasm32"))]
mod native {
    use super::AudioEngine;
    use super::spatial_math::*;
    use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source, SpatialSink};
    use std::collections::HashMap;
    use std::io::Cursor;
    use std::sync::Arc;

    struct ClipData {
        bytes: Arc<[u8]>,
    }

    struct SpatialSource {
        sink: SpatialSink,
        emitter_position: [f32; 3],
        ref_distance: f32,
        max_distance: f32,
        base_volume: f32,
    }

    pub struct NativeAudioEngine {
        _stream: OutputStream,
        stream_handle: OutputStreamHandle,
        clips: HashMap<u32, ClipData>,
        music_sink: Option<Sink>,
        sfx_volume: f32,
        music_volume: f32,
        music_base_volume: f32,
        listener: Option<AudioListener>,
        spatial_sources: HashMap<u32, SpatialSource>,
    }

    // Safety: NativeAudioEngine is always behind a Mutex, only accessed from
    // one thread at a time. OutputStream is !Send on some platforms but we
    // never move it across threads.
    unsafe impl Send for NativeAudioEngine {}
    unsafe impl Sync for NativeAudioEngine {}

    fn update_spatial_source_with_listener(
        sfx_volume: f32,
        listener: &AudioListener,
        source: &mut SpatialSource,
    ) {
        let (left_ear, right_ear) =
            listener_ear_positions(listener.position, listener.forward, listener.up);
        source.sink.set_emitter_position(source.emitter_position);
        source.sink.set_left_ear_position(left_ear);
        source.sink.set_right_ear_position(right_ear);
        let gain = spatial_gain(
            distance3(listener.position, source.emitter_position),
            source.ref_distance,
            source.max_distance,
        );
        source
            .sink
            .set_volume(source.base_volume * gain * sfx_volume);
    }

    impl NativeAudioEngine {
        /// Create a new native audio engine.
        /// Returns None if no audio output device is available.
        pub fn new() -> Option<Self> {
            let (stream, stream_handle) = match OutputStream::try_default() {
                Ok(pair) => pair,
                Err(e) => {
                    log::warn!("vogui audio: no output device: {e}");
                    return None;
                }
            };
            Some(Self {
                _stream: stream,
                stream_handle,
                clips: HashMap::new(),
                music_sink: None,
                sfx_volume: 1.0,
                music_volume: 1.0,
                music_base_volume: 1.0,
                listener: None,
                spatial_sources: HashMap::new(),
            })
        }
    }

    impl AudioEngine for NativeAudioEngine {
        fn load_bytes(&mut self, data: Vec<u8>) -> Result<u32, String> {
            let shared: Arc<[u8]> = Arc::from(data);
            let test_cursor = Cursor::new(Arc::clone(&shared));
            Decoder::new(test_cursor).map_err(|e| format!("audio decode error: {e}"))?;
            let id = next_clip_id();
            self.clips.insert(id, ClipData { bytes: shared });
            Ok(id)
        }

        fn free_clip(&mut self, id: u32) {
            self.clips.remove(&id);
        }

        fn play_sound(&mut self, clip_id: u32, volume: f32, pitch: f32) {
            let clip = match self.clips.get(&clip_id) {
                Some(c) => c,
                None => {
                    log::warn!("vogui audio: clip {clip_id} not found");
                    return;
                }
            };
            let cursor = Cursor::new(Arc::clone(&clip.bytes));
            let source = match Decoder::new(cursor) {
                Ok(s) => s,
                Err(e) => {
                    log::warn!("vogui audio: decode error for clip {clip_id}: {e}");
                    return;
                }
            };
            let processed = source.speed(pitch).amplify(volume * self.sfx_volume);
            let _ = self.stream_handle.play_raw(processed.convert_samples());
        }

        fn play_music(&mut self, clip_id: u32, volume: f32) {
            self.stop_music();
            let clip = match self.clips.get(&clip_id) {
                Some(c) => c,
                None => {
                    log::warn!("vogui audio: music clip {clip_id} not found");
                    return;
                }
            };
            let cursor = Cursor::new(Arc::clone(&clip.bytes));
            let source = match Decoder::new(cursor) {
                Ok(s) => s,
                Err(e) => {
                    log::warn!("vogui audio: decode error for music clip {clip_id}: {e}");
                    return;
                }
            };
            if let Ok(sink) = Sink::try_new(&self.stream_handle) {
                self.music_base_volume = volume;
                sink.set_volume(volume * self.music_volume);
                sink.append(source.repeat_infinite());
                self.music_sink = Some(sink);
            }
        }

        fn stop_music(&mut self) {
            if let Some(sink) = self.music_sink.take() {
                sink.stop();
            }
        }

        fn pause_music(&mut self) {
            if let Some(ref sink) = self.music_sink {
                sink.pause();
            }
        }

        fn resume_music(&mut self) {
            if let Some(ref sink) = self.music_sink {
                sink.play();
            }
        }

        fn set_sfx_volume(&mut self, vol: f32) {
            self.sfx_volume = vol.clamp(0.0, 1.0);
            if let Some(listener) = self.listener.as_ref() {
                let sfx_volume = self.sfx_volume;
                for source in self.spatial_sources.values_mut() {
                    update_spatial_source_with_listener(sfx_volume, listener, source);
                }
            } else {
                for source in self.spatial_sources.values() {
                    source
                        .sink
                        .set_volume(source.base_volume * self.sfx_volume);
                }
            }
        }

        fn set_music_volume(&mut self, vol: f32) {
            self.music_volume = vol.clamp(0.0, 1.0);
            if let Some(ref sink) = self.music_sink {
                sink.set_volume(self.music_base_volume * self.music_volume);
            }
        }

        // --- 3D spatial ---

        fn set_listener(&mut self, position: [f32; 3], forward: [f32; 3], up: [f32; 3]) {
            self.listener = Some(AudioListener {
                position,
                forward,
                up,
            });
        }

        fn play_sound_3d(
            &mut self,
            clip_id: u32,
            source_pos: [f32; 3],
            volume: f32,
            ref_distance: f32,
            max_distance: f32,
        ) {
            let clip = match self.clips.get(&clip_id) {
                Some(c) => c,
                None => {
                    log::warn!("vogui audio: clip {clip_id} not found");
                    return;
                }
            };
            let (left_ear, right_ear) = match self.listener.as_ref() {
                Some(l) => listener_ear_positions(l.position, l.forward, l.up),
                None => default_ears(),
            };
            let gain = match self.listener.as_ref() {
                Some(l) => spatial_gain(
                    distance3(l.position, source_pos),
                    ref_distance,
                    max_distance,
                ),
                None => 1.0,
            };
            if gain <= 0.0 {
                return;
            }
            let sink = match SpatialSink::try_new(
                &self.stream_handle,
                source_pos,
                left_ear,
                right_ear,
            ) {
                Ok(s) => s,
                Err(_) => return,
            };
            let cursor = Cursor::new(Arc::clone(&clip.bytes));
            let source = match Decoder::new(cursor) {
                Ok(s) => s,
                Err(_) => return,
            };
            sink.set_volume(volume * gain * self.sfx_volume);
            sink.append(source);
            sink.detach();
        }

        fn create_source_3d(
            &mut self,
            clip_id: u32,
            position: [f32; 3],
            volume: f32,
            ref_distance: f32,
            max_distance: f32,
        ) -> Result<u32, String> {
            let clip = self
                .clips
                .get(&clip_id)
                .ok_or_else(|| format!("audio: clip {clip_id} not found"))?;
            let (left_ear, right_ear) = match self.listener.as_ref() {
                Some(l) => listener_ear_positions(l.position, l.forward, l.up),
                None => default_ears(),
            };
            let sink =
                SpatialSink::try_new(&self.stream_handle, position, left_ear, right_ear)
                    .map_err(|e| format!("audio: spatial sink error: {e}"))?;
            let cursor = Cursor::new(Arc::clone(&clip.bytes));
            let source = Decoder::new(cursor)
                .map_err(|e| format!("audio: decode error for clip {clip_id}: {e}"))?;
            sink.append(source.repeat_infinite());
            let mut spatial = SpatialSource {
                sink,
                emitter_position: position,
                ref_distance,
                max_distance,
                base_volume: volume,
            };
            if let Some(listener) = self.listener.as_ref() {
                update_spatial_source_with_listener(self.sfx_volume, listener, &mut spatial);
            } else {
                spatial.sink.set_volume(volume * self.sfx_volume);
            }
            let id = next_source_id();
            self.spatial_sources.insert(id, spatial);
            Ok(id)
        }

        fn update_spatial_sources(&mut self) {
            let Some(listener) = self.listener.as_ref() else {
                return;
            };
            let sfx_volume = self.sfx_volume;
            for source in self.spatial_sources.values_mut() {
                update_spatial_source_with_listener(sfx_volume, listener, source);
            }
            self.spatial_sources.retain(|_, s| !s.sink.empty());
        }

        fn set_source_3d_position(&mut self, source_id: u32, position: [f32; 3]) {
            let Some(source) = self.spatial_sources.get_mut(&source_id) else {
                return;
            };
            source.emitter_position = position;
            source.sink.set_emitter_position(position);
            if let Some(listener) = self.listener.as_ref() {
                update_spatial_source_with_listener(self.sfx_volume, listener, source);
            }
        }

        fn remove_source_3d(&mut self, source_id: u32) {
            if let Some(source) = self.spatial_sources.remove(&source_id) {
                source.sink.stop();
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
pub use native::NativeAudioEngine;

// =============================================================================
// WASM backend (WebAudio via JS bridge)
// =============================================================================

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
mod wasm {
    use super::*;

    mod js {
        use wasm_bindgen::prelude::*;

        #[wasm_bindgen]
        extern "C" {
            // --- basic ---
            #[wasm_bindgen(js_namespace = window, js_name = voAudioLoad)]
            pub fn audio_load(data: &[u8]) -> i32;

            #[wasm_bindgen(js_namespace = window, js_name = voAudioFree)]
            pub fn audio_free(clip_id: i32);

            #[wasm_bindgen(js_namespace = window, js_name = voAudioPlaySound)]
            pub fn audio_play_sound(clip_id: i32, volume: f32, pitch: f32);

            #[wasm_bindgen(js_namespace = window, js_name = voAudioPlayMusic)]
            pub fn audio_play_music(clip_id: i32, volume: f32);

            #[wasm_bindgen(js_namespace = window, js_name = voAudioStopMusic)]
            pub fn audio_stop_music();

            #[wasm_bindgen(js_namespace = window, js_name = voAudioPauseMusic)]
            pub fn audio_pause_music();

            #[wasm_bindgen(js_namespace = window, js_name = voAudioResumeMusic)]
            pub fn audio_resume_music();

            #[wasm_bindgen(js_namespace = window, js_name = voAudioSetSFXVolume)]
            pub fn audio_set_sfx_volume(vol: f32);

            #[wasm_bindgen(js_namespace = window, js_name = voAudioSetMusicVolume)]
            pub fn audio_set_music_volume(vol: f32);

            // --- 3D spatial ---
            #[wasm_bindgen(js_namespace = window, js_name = voAudioSetListener)]
            pub fn audio_set_listener(
                px: f32, py: f32, pz: f32,
                fx: f32, fy: f32, fz: f32,
                ux: f32, uy: f32, uz: f32,
            );

            #[wasm_bindgen(js_namespace = window, js_name = voAudioPlaySound3D)]
            pub fn audio_play_sound_3d(
                clip_id: i32,
                px: f32, py: f32, pz: f32,
                volume: f32,
                ref_distance: f32,
                max_distance: f32,
            );

            #[wasm_bindgen(js_namespace = window, js_name = voAudioCreateSource3D)]
            pub fn audio_create_source_3d(
                clip_id: i32,
                px: f32, py: f32, pz: f32,
                volume: f32,
                ref_distance: f32,
                max_distance: f32,
            ) -> i32;

            #[wasm_bindgen(js_namespace = window, js_name = voAudioUpdateSpatial)]
            pub fn audio_update_spatial();

            #[wasm_bindgen(js_namespace = window, js_name = voAudioSetSource3DPos)]
            pub fn audio_set_source_3d_pos(source_id: i32, px: f32, py: f32, pz: f32);

            #[wasm_bindgen(js_namespace = window, js_name = voAudioRemoveSource3D)]
            pub fn audio_remove_source_3d(source_id: i32);
        }
    }

    pub struct WasmAudioEngine;

    // Safety: WASM is single-threaded. All JS state lives on the JS side.
    unsafe impl Send for WasmAudioEngine {}
    unsafe impl Sync for WasmAudioEngine {}

    impl WasmAudioEngine {
        pub fn new() -> Option<Self> {
            Some(Self)
        }
    }

    impl AudioEngine for WasmAudioEngine {
        fn load_bytes(&mut self, data: Vec<u8>) -> Result<u32, String> {
            let id = js::audio_load(&data);
            if id < 0 {
                Err(format!("audio load failed (error code {})", id))
            } else {
                Ok(id as u32)
            }
        }

        fn free_clip(&mut self, id: u32) {
            js::audio_free(id as i32);
        }

        fn play_sound(&mut self, clip_id: u32, volume: f32, pitch: f32) {
            js::audio_play_sound(clip_id as i32, volume, pitch);
        }

        fn play_music(&mut self, clip_id: u32, volume: f32) {
            js::audio_play_music(clip_id as i32, volume);
        }

        fn stop_music(&mut self) {
            js::audio_stop_music();
        }

        fn pause_music(&mut self) {
            js::audio_pause_music();
        }

        fn resume_music(&mut self) {
            js::audio_resume_music();
        }

        fn set_sfx_volume(&mut self, vol: f32) {
            js::audio_set_sfx_volume(vol);
        }

        fn set_music_volume(&mut self, vol: f32) {
            js::audio_set_music_volume(vol);
        }

        fn set_listener(&mut self, position: [f32; 3], forward: [f32; 3], up: [f32; 3]) {
            js::audio_set_listener(
                position[0], position[1], position[2],
                forward[0], forward[1], forward[2],
                up[0], up[1], up[2],
            );
        }

        fn play_sound_3d(
            &mut self,
            clip_id: u32,
            source_pos: [f32; 3],
            volume: f32,
            ref_distance: f32,
            max_distance: f32,
        ) {
            js::audio_play_sound_3d(
                clip_id as i32,
                source_pos[0], source_pos[1], source_pos[2],
                volume,
                ref_distance,
                max_distance,
            );
        }

        fn create_source_3d(
            &mut self,
            clip_id: u32,
            position: [f32; 3],
            volume: f32,
            ref_distance: f32,
            max_distance: f32,
        ) -> Result<u32, String> {
            let id = js::audio_create_source_3d(
                clip_id as i32,
                position[0], position[1], position[2],
                volume,
                ref_distance,
                max_distance,
            );
            if id < 0 {
                Err(format!("audio create source 3d failed (error code {})", id))
            } else {
                Ok(id as u32)
            }
        }

        fn update_spatial_sources(&mut self) {
            js::audio_update_spatial();
        }

        fn set_source_3d_position(&mut self, source_id: u32, position: [f32; 3]) {
            js::audio_set_source_3d_pos(
                source_id as i32,
                position[0], position[1], position[2],
            );
        }

        fn remove_source_3d(&mut self, source_id: u32) {
            js::audio_remove_source_3d(source_id as i32);
        }
    }
}

#[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
pub use wasm::WasmAudioEngine;

#[cfg(all(target_arch = "wasm32", feature = "wasm-standalone"))]
mod standalone_wasm {
    use super::*;

    pub struct StandaloneWasmAudioEngine;

    unsafe impl Send for StandaloneWasmAudioEngine {}
    unsafe impl Sync for StandaloneWasmAudioEngine {}

    impl StandaloneWasmAudioEngine {
        pub fn new() -> Option<Self> {
            Some(Self)
        }
    }

    impl AudioEngine for StandaloneWasmAudioEngine {
        fn load_bytes(&mut self, _data: Vec<u8>) -> Result<u32, String> {
            Err("vogui standalone wasm audio is not supported yet".to_string())
        }

        fn free_clip(&mut self, _id: u32) {}

        fn play_sound(&mut self, _clip_id: u32, _volume: f32, _pitch: f32) {}

        fn play_music(&mut self, _clip_id: u32, _volume: f32) {}

        fn stop_music(&mut self) {}

        fn pause_music(&mut self) {}

        fn resume_music(&mut self) {}

        fn set_sfx_volume(&mut self, _vol: f32) {}

        fn set_music_volume(&mut self, _vol: f32) {}

        fn set_listener(&mut self, _position: [f32; 3], _forward: [f32; 3], _up: [f32; 3]) {}

        fn play_sound_3d(
            &mut self,
            _clip_id: u32,
            _source_pos: [f32; 3],
            _volume: f32,
            _ref_distance: f32,
            _max_distance: f32,
        ) {}

        fn create_source_3d(
            &mut self,
            _clip_id: u32,
            _position: [f32; 3],
            _volume: f32,
            _ref_distance: f32,
            _max_distance: f32,
        ) -> Result<u32, String> {
            Err("vogui standalone wasm audio is not supported yet".to_string())
        }

        fn update_spatial_sources(&mut self) {}

        fn set_source_3d_position(&mut self, _source_id: u32, _position: [f32; 3]) {}

        fn remove_source_3d(&mut self, _source_id: u32) {}
    }
}

#[cfg(all(target_arch = "wasm32", feature = "wasm-standalone"))]
pub use standalone_wasm::StandaloneWasmAudioEngine;

// =============================================================================
// Global singleton
// =============================================================================

use std::sync::{Mutex, OnceLock};

static GLOBAL_AUDIO: OnceLock<Option<Mutex<Box<dyn AudioEngine>>>> = OnceLock::new();

fn get_global_audio() -> Option<&'static Mutex<Box<dyn AudioEngine>>> {
    GLOBAL_AUDIO
        .get_or_init(|| {
            match create_audio_engine() {
                Some(engine) => Some(Mutex::new(engine)),
                None => {
                    log::warn!("vogui audio: no audio device available, audio will be silent");
                    None
                }
            }
        })
        .as_ref()
}

/// Access the global audio engine. Returns Err if no audio device is available.
/// Used by vogui externs and by external crates (e.g. voplay) that need to
/// load audio clips via their own file I/O layer.
pub fn with_global_audio<R>(
    f: impl FnOnce(&mut Box<dyn AudioEngine>) -> R,
) -> Result<R, String> {
    let audio_mutex =
        get_global_audio().ok_or_else(|| "vogui: no audio device available".to_string())?;
    let mut engine = audio_mutex.lock().unwrap();
    Ok(f(&mut engine))
}

/// Like `with_global_audio`, but for closures that return `Result`.
/// Flattens the double-Result so callers don't need `.and_then(|r| r)`.
pub fn with_global_audio_result<R>(
    f: impl FnOnce(&mut Box<dyn AudioEngine>) -> Result<R, String>,
) -> Result<R, String> {
    let audio_mutex =
        get_global_audio().ok_or_else(|| "vogui: no audio device available".to_string())?;
    let mut engine = audio_mutex.lock().unwrap();
    f(&mut engine)
}

// =============================================================================
// Factory
// =============================================================================

/// Create the platform-appropriate audio engine.
/// Returns None if no audio device is available (native only).
pub fn create_audio_engine() -> Option<Box<dyn AudioEngine>> {
    #[cfg(not(target_arch = "wasm32"))]
    {
        NativeAudioEngine::new().map(|e| Box::new(e) as Box<dyn AudioEngine>)
    }
    #[cfg(all(target_arch = "wasm32", not(feature = "wasm-standalone")))]
    {
        WasmAudioEngine::new().map(|e| Box::new(e) as Box<dyn AudioEngine>)
    }
    #[cfg(all(target_arch = "wasm32", feature = "wasm-standalone"))]
    {
        StandaloneWasmAudioEngine::new().map(|e| Box::new(e) as Box<dyn AudioEngine>)
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::spatial_math::*;

    #[test]
    fn spatial_gain_clamps_at_reference_distance() {
        assert!((spatial_gain(0.25, 1.0, 50.0) - 1.0).abs() < 1e-6);
        assert!((spatial_gain(1.0, 1.0, 50.0) - 1.0).abs() < 1e-6);
        assert!((spatial_gain(2.0, 1.0, 50.0) - 0.5).abs() < 1e-6);
    }

    #[test]
    fn spatial_gain_culls_at_max_distance() {
        assert_eq!(spatial_gain(60.0, 1.0, 50.0), 0.0);
    }

    #[test]
    fn listener_ear_positions_follow_forward_cross_up() {
        let (left, right) =
            listener_ear_positions([0.0, 0.0, 0.0], [0.0, 0.0, -1.0], [0.0, 1.0, 0.0]);
        assert!((left[0] + EAR_HALF_SPACING).abs() < 1e-6);
        assert!(left[1].abs() < 1e-6);
        assert!(left[2].abs() < 1e-6);
        assert!((right[0] - EAR_HALF_SPACING).abs() < 1e-6);
        assert!(right[1].abs() < 1e-6);
        assert!(right[2].abs() < 1e-6);
    }
}
