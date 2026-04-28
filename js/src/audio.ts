// VoGUI Audio — WebAudio bridge for WASM.
//
// Installs window.voAudio* functions that the Rust WasmAudioEngine calls
// via wasm_bindgen. Handles async decoding transparently: clips are usable
// immediately after load (playback silently skips if decode is still pending).

interface AudioClip {
  raw: ArrayBuffer;
  buffer: AudioBuffer | null;
  decoding: boolean;
}

interface SpatialSource {
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode;
  pannerNode: PannerNode;
  clipId: number;
  volume: number;
  refDistance: number;
  maxDistance: number;
}

let ctx: AudioContext | null = null;
const clips = new Map<number, AudioClip>();
const spatialSources = new Map<number, SpatialSource>();

let nextClipId = 1;
let nextSourceId = 1;
let sfxVolume = 1.0;
let musicVolume = 1.0;

let musicSourceNode: AudioBufferSourceNode | null = null;
let musicGainNode: GainNode | null = null;
let musicClipId = 0;
let musicBaseVolume = 1.0;
let musicPaused = false;
let musicStartTime = 0;
let musicStartOffset = 0;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function ensureDecoded(clip: AudioClip, clipId: number): void {
  if (clip.buffer || clip.decoding) return;
  clip.decoding = true;
  const audioCtx = getCtx();
  // Must copy because decodeAudioData detaches the buffer
  const copy = clip.raw.slice(0);
  audioCtx.decodeAudioData(copy).then(decoded => {
    clip.buffer = decoded;
    clip.decoding = false;
  }).catch(e => {
    console.warn(`voAudio: decode failed for clip ${clipId}:`, e);
    clip.decoding = false;
  });
}

// =============================================================================
// Basic audio
// =============================================================================

function voAudioLoad(data: Uint8Array): number {
  const id = nextClipId++;
  // Copy into a plain ArrayBuffer (data.buffer may be SharedArrayBuffer)
  const raw = new ArrayBuffer(data.byteLength);
  new Uint8Array(raw).set(data);
  const clip: AudioClip = { raw, buffer: null, decoding: false };
  clips.set(id, clip);
  ensureDecoded(clip, id);
  return id;
}

function voAudioFree(clipId: number): void {
  clips.delete(clipId);
}

function voAudioPlaySound(clipId: number, volume: number, pitch: number): void {
  const clip = clips.get(clipId);
  if (!clip || !clip.buffer) return;
  const audioCtx = getCtx();
  const source = audioCtx.createBufferSource();
  source.buffer = clip.buffer;
  source.playbackRate.value = pitch;
  const gain = audioCtx.createGain();
  gain.gain.value = volume * sfxVolume;
  source.connect(gain).connect(audioCtx.destination);
  source.start();
}

function voAudioPlayMusic(clipId: number, volume: number): void {
  voAudioStopMusic();
  const clip = clips.get(clipId);
  if (!clip || !clip.buffer) return;
  const audioCtx = getCtx();
  const source = audioCtx.createBufferSource();
  source.buffer = clip.buffer;
  source.loop = true;
  const gain = audioCtx.createGain();
  gain.gain.value = volume * musicVolume;
  source.connect(gain).connect(audioCtx.destination);
  source.start();
  musicSourceNode = source;
  musicGainNode = gain;
  musicClipId = clipId;
  musicBaseVolume = volume;
  musicPaused = false;
  musicStartTime = audioCtx.currentTime;
  musicStartOffset = 0;
}

function voAudioStopMusic(): void {
  if (musicSourceNode) {
    try { musicSourceNode.stop(); } catch (_) { /* already stopped */ }
    musicSourceNode.disconnect();
    musicSourceNode = null;
  }
  if (musicGainNode) {
    musicGainNode.disconnect();
    musicGainNode = null;
  }
  musicPaused = false;
  musicStartOffset = 0;
}

function voAudioPauseMusic(): void {
  if (!musicSourceNode || musicPaused) return;
  const audioCtx = getCtx();
  musicStartOffset += audioCtx.currentTime - musicStartTime;
  try { musicSourceNode.stop(); } catch (_) { /* */ }
  musicSourceNode.disconnect();
  musicSourceNode = null;
  musicPaused = true;
}

function voAudioResumeMusic(): void {
  if (!musicPaused || !musicGainNode) return;
  const clip = clips.get(musicClipId);
  if (!clip || !clip.buffer) return;
  const audioCtx = getCtx();
  const source = audioCtx.createBufferSource();
  source.buffer = clip.buffer;
  source.loop = true;
  source.connect(musicGainNode).connect(audioCtx.destination);
  source.start(0, musicStartOffset % clip.buffer.duration);
  musicSourceNode = source;
  musicStartTime = audioCtx.currentTime;
  musicPaused = false;
}

function voAudioSetSFXVolume(vol: number): void {
  sfxVolume = Math.max(0, Math.min(1, vol));
}

function voAudioSetMusicVolume(vol: number): void {
  musicVolume = Math.max(0, Math.min(1, vol));
  if (musicGainNode) {
    musicGainNode.gain.value = musicBaseVolume * musicVolume;
  }
}

// =============================================================================
// 3D Spatial Audio
// =============================================================================

function voAudioSetListener(
  px: number, py: number, pz: number,
  fx: number, fy: number, fz: number,
  ux: number, uy: number, uz: number,
): void {
  const audioCtx = getCtx();
  const listener = audioCtx.listener;
  if (listener.positionX) {
    listener.positionX.value = px;
    listener.positionY.value = py;
    listener.positionZ.value = pz;
    listener.forwardX.value = fx;
    listener.forwardY.value = fy;
    listener.forwardZ.value = fz;
    listener.upX.value = ux;
    listener.upY.value = uy;
    listener.upZ.value = uz;
  } else {
    // Fallback for older browsers
    listener.setPosition(px, py, pz);
    listener.setOrientation(fx, fy, fz, ux, uy, uz);
  }
}

function voAudioPlaySound3D(
  clipId: number,
  px: number, py: number, pz: number,
  volume: number,
  refDistance: number,
  maxDistance: number,
): void {
  const clip = clips.get(clipId);
  if (!clip || !clip.buffer) return;
  const audioCtx = getCtx();
  const source = audioCtx.createBufferSource();
  source.buffer = clip.buffer;
  const panner = audioCtx.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = refDistance;
  panner.maxDistance = maxDistance;
  panner.rolloffFactor = 1;
  panner.positionX.value = px;
  panner.positionY.value = py;
  panner.positionZ.value = pz;
  const gain = audioCtx.createGain();
  gain.gain.value = volume * sfxVolume;
  source.connect(panner).connect(gain).connect(audioCtx.destination);
  source.start();
}

function voAudioCreateSource3D(
  clipId: number,
  px: number, py: number, pz: number,
  volume: number,
  refDistance: number,
  maxDistance: number,
): number {
  const clip = clips.get(clipId);
  if (!clip || !clip.buffer) return -1;
  const audioCtx = getCtx();
  const source = audioCtx.createBufferSource();
  source.buffer = clip.buffer;
  source.loop = true;
  const panner = audioCtx.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = refDistance;
  panner.maxDistance = maxDistance;
  panner.rolloffFactor = 1;
  panner.positionX.value = px;
  panner.positionY.value = py;
  panner.positionZ.value = pz;
  const gain = audioCtx.createGain();
  gain.gain.value = volume * sfxVolume;
  source.connect(panner).connect(gain).connect(audioCtx.destination);
  source.start();
  const id = nextSourceId++;
  spatialSources.set(id, {
    sourceNode: source,
    gainNode: gain,
    pannerNode: panner,
    clipId,
    volume,
    refDistance,
    maxDistance,
  });
  return id;
}

function voAudioUpdateSpatial(): void {
  // No-op on web: the browser's AudioContext + PannerNode handle spatial
  // updates automatically. Persistent sources are cleaned up by
  // voAudioRemoveSource3D when explicitly removed.
}

function voAudioSetSource3DPos(sourceId: number, px: number, py: number, pz: number): void {
  const src = spatialSources.get(sourceId);
  if (!src) return;
  src.pannerNode.positionX.value = px;
  src.pannerNode.positionY.value = py;
  src.pannerNode.positionZ.value = pz;
}

function voAudioSetSource3DParams(sourceId: number, volume: number, pitch: number): void {
  const src = spatialSources.get(sourceId);
  if (!src) return;
  src.volume = Math.max(0, volume);
  src.gainNode.gain.value = src.volume * sfxVolume;
  if (src.sourceNode) {
    src.sourceNode.playbackRate.value = Math.max(0.01, pitch);
  }
}

function voAudioRemoveSource3D(sourceId: number): void {
  const src = spatialSources.get(sourceId);
  if (!src) return;
  if (src.sourceNode) {
    try { src.sourceNode.stop(); } catch (_) { /* */ }
    src.sourceNode.disconnect();
  }
  src.gainNode.disconnect();
  src.pannerNode.disconnect();
  spatialSources.delete(sourceId);
}

// =============================================================================
// Install on window
// =============================================================================

export function installAudioBridge(): void {
  const w = window as any;
  w.voAudioLoad = voAudioLoad;
  w.voAudioFree = voAudioFree;
  w.voAudioPlaySound = voAudioPlaySound;
  w.voAudioPlayMusic = voAudioPlayMusic;
  w.voAudioStopMusic = voAudioStopMusic;
  w.voAudioPauseMusic = voAudioPauseMusic;
  w.voAudioResumeMusic = voAudioResumeMusic;
  w.voAudioSetSFXVolume = voAudioSetSFXVolume;
  w.voAudioSetMusicVolume = voAudioSetMusicVolume;
  w.voAudioSetListener = voAudioSetListener;
  w.voAudioPlaySound3D = voAudioPlaySound3D;
  w.voAudioCreateSource3D = voAudioCreateSource3D;
  w.voAudioUpdateSpatial = voAudioUpdateSpatial;
  w.voAudioSetSource3DPos = voAudioSetSource3DPos;
  w.voAudioSetSource3DParams = voAudioSetSource3DParams;
  w.voAudioRemoveSource3D = voAudioRemoveSource3D;
}
