use std::{
    collections::BTreeMap,
    ffi::c_void,
    sync::{Arc, Mutex},
};

use crate::{
    FontResolver, GlyphPosition, ResolvedFont, TextCacheKey, TextDirection, TextError, TextLayout,
    TextShaper,
};

const UTF8_ENCODING: u32 = 0x0800_0100;
const HORIZONTAL_ORIENTATION: i32 = 0;

#[repr(C)]
#[derive(Clone, Copy, Default)]
struct CgSize {
    width: f64,
    height: f64,
}

#[link(name = "CoreFoundation", kind = "framework")]
unsafe extern "C" {
    fn CFStringCreateWithBytes(
        allocator: *const c_void,
        bytes: *const u8,
        count: isize,
        encoding: u32,
        is_external_representation: u8,
    ) -> *const c_void;
    fn CFRelease(value: *const c_void);
}

#[link(name = "CoreText", kind = "framework")]
unsafe extern "C" {
    fn CTFontCreateWithName(name: *const c_void, size: f64, matrix: *const c_void)
        -> *const c_void;
    fn CTFontGetGlyphsForCharacters(
        font: *const c_void,
        characters: *const u16,
        glyphs: *mut u16,
        count: isize,
    ) -> u8;
    fn CTFontGetAdvancesForGlyphs(
        font: *const c_void,
        orientation: i32,
        glyphs: *const u16,
        advances: *mut CgSize,
        count: isize,
    ) -> f64;
    fn CTFontGetAscent(font: *const c_void) -> f64;
    fn CTFontGetDescent(font: *const c_void) -> f64;
    fn CTFontGetLeading(font: *const c_void) -> f64;
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
struct FaceKey {
    family: String,
    weight: u16,
    italic: bool,
    locale: String,
}

struct FontState {
    generation: u64,
    next_face_id: u64,
    by_key: BTreeMap<FaceKey, u64>,
    by_id: BTreeMap<u64, FaceKey>,
}

#[derive(Clone)]
pub struct MacCoreTextSystem {
    state: Arc<Mutex<FontState>>,
}

impl MacCoreTextSystem {
    pub fn new(generation: u64) -> Result<Self, TextError> {
        if generation == 0 {
            return Err(TextError::InvalidConfig);
        }
        Ok(Self {
            state: Arc::new(Mutex::new(FontState {
                generation,
                next_face_id: 1,
                by_key: BTreeMap::new(),
                by_id: BTreeMap::new(),
            })),
        })
    }

    pub fn resolver(&self) -> MacCoreTextFontResolver {
        MacCoreTextFontResolver {
            state: Arc::clone(&self.state),
        }
    }

    pub fn shaper(&self) -> MacCoreTextShaper {
        MacCoreTextShaper {
            state: Arc::clone(&self.state),
        }
    }

    pub fn advance_generation(&self) -> Result<u64, TextError> {
        let mut state = self.state.lock().map_err(|_| TextError::ShapeFailed)?;
        state.generation = state
            .generation
            .checked_add(1)
            .ok_or(TextError::ShapeFailed)?;
        state.by_key.clear();
        state.by_id.clear();
        state.next_face_id = 1;
        Ok(state.generation)
    }
}

pub struct MacCoreTextFontResolver {
    state: Arc<Mutex<FontState>>,
}

impl FontResolver for MacCoreTextFontResolver {
    fn resolve(
        &mut self,
        families: &[String],
        weight: u16,
        italic: bool,
        locale: &str,
    ) -> Result<ResolvedFont, TextError> {
        let family = families.first().ok_or(TextError::FontUnavailable)?;
        let key = FaceKey {
            family: family.clone(),
            weight,
            italic,
            locale: locale.to_string(),
        };
        let mut state = self.state.lock().map_err(|_| TextError::ShapeFailed)?;
        let face_id = if let Some(face_id) = state.by_key.get(&key).copied() {
            face_id
        } else {
            let face_id = state.next_face_id;
            state.next_face_id = state
                .next_face_id
                .checked_add(1)
                .ok_or(TextError::ShapeFailed)?;
            state.by_key.insert(key.clone(), face_id);
            state.by_id.insert(face_id, key);
            face_id
        };
        Ok(ResolvedFont {
            face_id,
            generation: state.generation,
        })
    }
}

pub struct MacCoreTextShaper {
    state: Arc<Mutex<FontState>>,
}

impl TextShaper for MacCoreTextShaper {
    fn shape(&mut self, font: &ResolvedFont, key: &TextCacheKey) -> Result<TextLayout, TextError> {
        let family = {
            let state = self.state.lock().map_err(|_| TextError::ShapeFailed)?;
            if font.generation != state.generation {
                return Err(TextError::FontUnavailable);
            }
            state
                .by_id
                .get(&font.face_id)
                .map(|key| key.family.clone())
                .ok_or(TextError::FontUnavailable)?
        };
        let font = CoreTextFont::new(&family, key.style.size_milli)?;
        shape_with_font(&font, key)
    }
}

struct CoreTextFont(*const c_void);

impl CoreTextFont {
    fn new(family: &str, size_milli: u32) -> Result<Self, TextError> {
        let family = CfString::new(family)?;
        let font =
            unsafe { CTFontCreateWithName(family.0, size_milli as f64 / 1000.0, std::ptr::null()) };
        if font.is_null() {
            Err(TextError::FontUnavailable)
        } else {
            Ok(Self(font))
        }
    }
}

impl Drop for CoreTextFont {
    fn drop(&mut self) {
        unsafe { CFRelease(self.0) };
    }
}

struct CfString(*const c_void);

impl CfString {
    fn new(value: &str) -> Result<Self, TextError> {
        let count = isize::try_from(value.len()).map_err(|_| TextError::TextCapacity)?;
        let string = unsafe {
            CFStringCreateWithBytes(std::ptr::null(), value.as_ptr(), count, UTF8_ENCODING, 0)
        };
        if string.is_null() {
            Err(TextError::FontUnavailable)
        } else {
            Ok(Self(string))
        }
    }
}

impl Drop for CfString {
    fn drop(&mut self) {
        unsafe { CFRelease(self.0) };
    }
}

fn shape_with_font(font: &CoreTextFont, key: &TextCacheKey) -> Result<TextLayout, TextError> {
    let characters = key.text.encode_utf16().collect::<Vec<_>>();
    if characters.is_empty() {
        return Ok(TextLayout {
            width_milli: 0,
            height_milli: key.style.line_height_milli as i32,
            baseline_milli: baseline(font, key.style.line_height_milli),
            glyphs: Vec::new(),
        });
    }
    let count = isize::try_from(characters.len()).map_err(|_| TextError::GlyphCapacity)?;
    let mut glyphs = vec![0_u16; characters.len()];
    let complete = unsafe {
        CTFontGetGlyphsForCharacters(font.0, characters.as_ptr(), glyphs.as_mut_ptr(), count)
    };
    if complete == 0 {
        return Err(TextError::FontUnavailable);
    }
    let mut advances = vec![CgSize::default(); glyphs.len()];
    unsafe {
        CTFontGetAdvancesForGlyphs(
            font.0,
            HORIZONTAL_ORIENTATION,
            glyphs.as_ptr(),
            advances.as_mut_ptr(),
            count,
        )
    };
    let line_height = key.style.line_height_milli as i32;
    let max_width = key.width_milli;
    let mut positioned = Vec::with_capacity(glyphs.len());
    let mut x = 0_i32;
    let mut y = 0_i32;
    let mut max_line_width = 0_i32;
    for (cluster, (glyph, advance)) in glyphs.into_iter().zip(advances).enumerate() {
        if glyph == 0 {
            continue;
        }
        let advance = points_to_milli(advance.width)?
            .checked_add(key.style.letter_spacing_milli)
            .ok_or(TextError::InvalidMetrics)?;
        if max_width > 0 && x > 0 && x.saturating_add(advance) > max_width {
            max_line_width = max_line_width.max(x);
            x = 0;
            y = y
                .checked_add(line_height)
                .ok_or(TextError::InvalidMetrics)?;
        }
        positioned.push(GlyphPosition {
            glyph_id: glyph as u32,
            cluster: cluster as u32,
            x_milli: x,
            y_milli: y,
            advance_milli: advance,
        });
        x = x.checked_add(advance).ok_or(TextError::InvalidMetrics)?;
    }
    max_line_width = max_line_width.max(x);
    if key.direction == TextDirection::RightToLeft {
        for glyph in &mut positioned {
            glyph.x_milli = max_line_width
                .checked_sub(glyph.x_milli)
                .and_then(|value| value.checked_sub(glyph.advance_milli))
                .ok_or(TextError::InvalidMetrics)?;
        }
        positioned.reverse();
    }
    Ok(TextLayout {
        width_milli: max_line_width,
        height_milli: y
            .checked_add(line_height)
            .ok_or(TextError::InvalidMetrics)?,
        baseline_milli: baseline(font, key.style.line_height_milli),
        glyphs: positioned,
    })
}

fn baseline(font: &CoreTextFont, line_height_milli: u32) -> i32 {
    let ascent = unsafe { CTFontGetAscent(font.0) };
    let descent = unsafe { CTFontGetDescent(font.0) };
    let leading = unsafe { CTFontGetLeading(font.0) };
    let total = (ascent + descent + leading).max(1.0);
    ((line_height_milli as f64 * ascent / total).round() as i64).clamp(0, line_height_milli as i64)
        as i32
}

fn points_to_milli(points: f64) -> Result<i32, TextError> {
    let milli = points * 1000.0;
    if !milli.is_finite() || milli < i32::MIN as f64 || milli > i32::MAX as f64 {
        return Err(TextError::InvalidMetrics);
    }
    Ok(milli.round() as i32)
}
