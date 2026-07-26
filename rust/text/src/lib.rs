use std::collections::{BTreeMap, VecDeque};

#[inline(never)]
pub fn vogui_profile_link_anchor() -> usize {
    module_path!().as_ptr() as usize
}

use vogui_protocol::v2::NodeId;

#[cfg(all(feature = "macos-coretext", target_os = "macos"))]
mod macos_coretext;
#[cfg(all(feature = "macos-coretext", target_os = "macos"))]
pub use macos_coretext::{MacCoreTextFontResolver, MacCoreTextShaper, MacCoreTextSystem};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum TextDirection {
    Auto,
    LeftToRight,
    RightToLeft,
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct TextStyle {
    pub families: Vec<String>,
    pub size_milli: u32,
    pub weight: u16,
    pub italic: bool,
    pub letter_spacing_milli: i32,
    pub line_height_milli: u32,
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct TextCacheKey {
    pub text: String,
    pub style: TextStyle,
    pub width_milli: i32,
    pub locale: String,
    pub direction: TextDirection,
    pub font_generation: u64,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct GlyphPosition {
    pub glyph_id: u32,
    pub cluster: u32,
    pub x_milli: i32,
    pub y_milli: i32,
    pub advance_milli: i32,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct TextLayout {
    pub width_milli: i32,
    pub height_milli: i32,
    pub baseline_milli: i32,
    pub glyphs: Vec<GlyphPosition>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TextConfig {
    pub max_cache_entries: usize,
    pub max_text_bytes: usize,
    pub max_glyphs_per_layout: usize,
    pub max_family_count: usize,
}

impl Default for TextConfig {
    fn default() -> Self {
        Self {
            max_cache_entries: 4096,
            max_text_bytes: 1024 * 1024,
            max_glyphs_per_layout: 100_000,
            max_family_count: 16,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TextError {
    InvalidConfig,
    InvalidStyle,
    TextCapacity,
    FamilyCapacity,
    FontUnavailable,
    ShapeFailed,
    GlyphCapacity,
    InvalidMetrics,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ResolvedFont {
    pub face_id: u64,
    pub generation: u64,
}

pub trait FontResolver {
    fn resolve(
        &mut self,
        families: &[String],
        weight: u16,
        italic: bool,
        locale: &str,
    ) -> Result<ResolvedFont, TextError>;
}

pub trait TextShaper {
    fn shape(&mut self, font: &ResolvedFont, key: &TextCacheKey) -> Result<TextLayout, TextError>;
}

pub struct TextEngine<F, S> {
    config: TextConfig,
    fonts: F,
    shaper: S,
    cache: BTreeMap<TextCacheKey, TextLayout>,
    order: VecDeque<TextCacheKey>,
    node_keys: BTreeMap<NodeId, TextCacheKey>,
}

impl<F: FontResolver, S: TextShaper> TextEngine<F, S> {
    pub fn new(config: TextConfig, fonts: F, shaper: S) -> Result<Self, TextError> {
        if config.max_cache_entries == 0
            || config.max_text_bytes == 0
            || config.max_glyphs_per_layout == 0
            || config.max_family_count == 0
        {
            return Err(TextError::InvalidConfig);
        }
        Ok(Self {
            config,
            fonts,
            shaper,
            cache: BTreeMap::new(),
            order: VecDeque::new(),
            node_keys: BTreeMap::new(),
        })
    }

    pub fn layout(
        &mut self,
        node: NodeId,
        text: &str,
        style: TextStyle,
        width_milli: i32,
        locale: &str,
        direction: TextDirection,
    ) -> Result<TextLayout, TextError> {
        validate_request(self.config, text, &style, width_milli, locale)?;
        let font = self
            .fonts
            .resolve(&style.families, style.weight, style.italic, locale)?;
        let key = TextCacheKey {
            text: text.to_string(),
            style,
            width_milli,
            locale: locale.to_string(),
            direction,
            font_generation: font.generation,
        };
        if let Some(layout) = self.cache.get(&key).cloned() {
            self.node_keys.insert(node, key);
            return Ok(layout);
        }
        let layout = self.shaper.shape(&font, &key)?;
        validate_layout(self.config, &layout)?;
        while self.cache.len() >= self.config.max_cache_entries {
            let Some(oldest) = self.order.pop_front() else {
                break;
            };
            self.cache.remove(&oldest);
            self.node_keys.retain(|_, node_key| node_key != &oldest);
        }
        self.cache.insert(key.clone(), layout.clone());
        self.order.push_back(key.clone());
        self.node_keys.insert(node, key);
        Ok(layout)
    }

    pub fn remove_node(&mut self, node: NodeId) {
        self.node_keys.remove(&node);
    }

    pub fn invalidate_font_generation(&mut self, generation: u64) {
        self.cache
            .retain(|key, _| key.font_generation == generation);
        self.order
            .retain(|key| key.font_generation == generation && self.cache.contains_key(key));
        self.node_keys
            .retain(|_, key| key.font_generation == generation && self.cache.contains_key(key));
    }

    pub fn clear(&mut self) {
        self.cache.clear();
        self.order.clear();
        self.node_keys.clear();
    }
}

fn validate_request(
    config: TextConfig,
    text: &str,
    style: &TextStyle,
    width_milli: i32,
    locale: &str,
) -> Result<(), TextError> {
    if text.len() > config.max_text_bytes || locale.len() > 128 {
        return Err(TextError::TextCapacity);
    }
    if style.families.is_empty() || style.families.len() > config.max_family_count {
        return Err(TextError::FamilyCapacity);
    }
    if style.size_milli == 0
        || style.line_height_milli == 0
        || !(1..=1000).contains(&style.weight)
        || width_milli < 0
    {
        return Err(TextError::InvalidStyle);
    }
    Ok(())
}

fn validate_layout(config: TextConfig, layout: &TextLayout) -> Result<(), TextError> {
    if layout.glyphs.len() > config.max_glyphs_per_layout {
        return Err(TextError::GlyphCapacity);
    }
    if layout.width_milli < 0
        || layout.height_milli < 0
        || layout.baseline_milli < 0
        || layout.baseline_milli > layout.height_milli
    {
        return Err(TextError::InvalidMetrics);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::Cell;
    use std::rc::Rc;
    use vogui_protocol::v2::Handle;

    #[derive(Clone)]
    struct Resolver {
        generation: Rc<Cell<u64>>,
        calls: Rc<Cell<usize>>,
    }

    impl FontResolver for Resolver {
        fn resolve(
            &mut self,
            _families: &[String],
            _weight: u16,
            _italic: bool,
            _locale: &str,
        ) -> Result<ResolvedFont, TextError> {
            self.calls.set(self.calls.get() + 1);
            Ok(ResolvedFont {
                face_id: 7,
                generation: self.generation.get(),
            })
        }
    }

    #[derive(Clone)]
    struct Shaper {
        calls: Rc<Cell<usize>>,
        invalid: Rc<Cell<bool>>,
    }

    impl TextShaper for Shaper {
        fn shape(
            &mut self,
            _font: &ResolvedFont,
            key: &TextCacheKey,
        ) -> Result<TextLayout, TextError> {
            self.calls.set(self.calls.get() + 1);
            Ok(TextLayout {
                width_milli: if self.invalid.get() {
                    -1
                } else {
                    key.width_milli
                },
                height_milli: 2_000,
                baseline_milli: 1_500,
                glyphs: vec![GlyphPosition {
                    glyph_id: 1,
                    cluster: 0,
                    advance_milli: 1_000,
                    ..GlyphPosition::default()
                }],
            })
        }
    }

    fn style() -> TextStyle {
        TextStyle {
            families: vec!["system-ui".into()],
            size_milli: 16_000,
            weight: 400,
            italic: false,
            letter_spacing_milli: 0,
            line_height_milli: 20_000,
        }
    }

    #[test]
    fn cache_identity_includes_font_generation_locale_direction_and_width() {
        let generation = Rc::new(Cell::new(1));
        let resolve_calls = Rc::new(Cell::new(0));
        let shape_calls = Rc::new(Cell::new(0));
        let invalid = Rc::new(Cell::new(false));
        let mut engine = TextEngine::new(
            TextConfig::default(),
            Resolver {
                generation: generation.clone(),
                calls: resolve_calls.clone(),
            },
            Shaper {
                calls: shape_calls.clone(),
                invalid,
            },
        )
        .unwrap();
        let node = Handle {
            index: 1,
            generation: 1,
        };
        let first = engine
            .layout(
                node,
                "hello",
                style(),
                20_000,
                "en-US",
                TextDirection::LeftToRight,
            )
            .unwrap();
        let cached = engine
            .layout(
                node,
                "hello",
                style(),
                20_000,
                "en-US",
                TextDirection::LeftToRight,
            )
            .unwrap();
        assert_eq!(cached, first);
        assert_eq!(shape_calls.get(), 1);
        assert_eq!(resolve_calls.get(), 2);

        generation.set(2);
        engine
            .layout(
                node,
                "hello",
                style(),
                20_000,
                "en-US",
                TextDirection::LeftToRight,
            )
            .unwrap();
        assert_eq!(shape_calls.get(), 2);
        engine.invalidate_font_generation(2);
    }

    #[test]
    fn invalid_metrics_and_request_limits_fail_before_cache_publication() {
        let generation = Rc::new(Cell::new(1));
        let calls = Rc::new(Cell::new(0));
        let invalid = Rc::new(Cell::new(true));
        let mut engine = TextEngine::new(
            TextConfig {
                max_text_bytes: 4,
                ..TextConfig::default()
            },
            Resolver {
                generation,
                calls: Rc::new(Cell::new(0)),
            },
            Shaper {
                calls: calls.clone(),
                invalid: invalid.clone(),
            },
        )
        .unwrap();
        let node = Handle {
            index: 1,
            generation: 1,
        };
        assert_eq!(
            engine.layout(
                node,
                "hello",
                style(),
                20_000,
                "en-US",
                TextDirection::LeftToRight,
            ),
            Err(TextError::TextCapacity),
        );
        assert_eq!(calls.get(), 0);

        assert_eq!(
            engine.layout(
                node,
                "okay",
                style(),
                20_000,
                "en-US",
                TextDirection::LeftToRight,
            ),
            Err(TextError::InvalidMetrics),
        );
        assert_eq!(calls.get(), 1);
        invalid.set(false);
        assert!(engine
            .layout(
                node,
                "okay",
                style(),
                20_000,
                "en-US",
                TextDirection::LeftToRight,
            )
            .is_ok());
        assert_eq!(calls.get(), 2);
    }
}
