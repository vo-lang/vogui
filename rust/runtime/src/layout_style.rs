use std::collections::BTreeMap;

use vogui_protocol::v2::{Handle, UiRootId, UiSessionId};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Length {
    Auto,
    Px(i32),
    Percent(i32),
    Fraction(u16),
    MinContent,
    MaxContent,
    FitContent(i32),
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Edges<T> {
    pub top: T,
    pub right: T,
    pub bottom: T,
    pub left: T,
}

impl<T: Copy> Edges<T> {
    pub const fn all(value: T) -> Self {
        Self {
            top: value,
            right: value,
            bottom: value,
            left: value,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Axis {
    Horizontal,
    Vertical,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum LayoutMode {
    Block,
    Flex { axis: Axis, wrap: bool },
    Grid { columns: u16, dense: bool },
    Stack,
    Absolute,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Align {
    Start,
    Center,
    End,
    Stretch,
    Baseline,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Justify {
    Start,
    Center,
    End,
    SpaceBetween,
    SpaceAround,
    SpaceEvenly,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Overflow {
    Visible,
    Clip,
    Scroll,
    Auto,
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Layout {
    pub mode: LayoutMode,
    pub width: Length,
    pub height: Length,
    pub min_width: Length,
    pub min_height: Length,
    pub max_width: Length,
    pub max_height: Length,
    pub margin: Edges<Length>,
    pub padding: Edges<Length>,
    pub gap: Length,
    pub align_items: Align,
    pub justify_content: Justify,
    pub align_self: Option<Align>,
    pub aspect_ratio: Option<(u32, u32)>,
    pub overflow_x: Overflow,
    pub overflow_y: Overflow,
    pub inset: Edges<Length>,
}

impl Default for Layout {
    fn default() -> Self {
        Self {
            mode: LayoutMode::Block,
            width: Length::Auto,
            height: Length::Auto,
            min_width: Length::Auto,
            min_height: Length::Auto,
            max_width: Length::Auto,
            max_height: Length::Auto,
            margin: Edges::all(Length::Px(0)),
            padding: Edges::all(Length::Px(0)),
            gap: Length::Px(0),
            align_items: Align::Stretch,
            justify_content: Justify::Start,
            align_self: None,
            aspect_ratio: None,
            overflow_x: Overflow::Visible,
            overflow_y: Overflow::Visible,
            inset: Edges::all(Length::Auto),
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Color(pub u32);

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Visibility {
    Visible,
    Hidden,
    Collapsed,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum TextDirection {
    Locale,
    LeftToRight,
    RightToLeft,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum FontWeight {
    Light,
    Normal,
    Medium,
    Semibold,
    Bold,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Cursor {
    Default,
    Pointer,
    Text,
    Move,
    ResizeHorizontal,
    ResizeVertical,
    Hidden,
}

#[derive(Clone, Debug, Default, Eq, Ord, PartialEq, PartialOrd)]
pub struct StyleProperties {
    pub layout: Option<Layout>,
    pub foreground: Option<Color>,
    pub background: Option<Color>,
    pub border_color: Option<Color>,
    pub border_width: Option<i32>,
    pub corner_radius: Option<i32>,
    pub opacity_milli: Option<u16>,
    pub visibility: Option<Visibility>,
    pub cursor: Option<Cursor>,
    pub font_family: Option<String>,
    pub font_size: Option<i32>,
    pub font_weight: Option<FontWeight>,
    pub line_height: Option<i32>,
    pub direction: Option<TextDirection>,
}

impl StyleProperties {
    pub fn overlay(&mut self, overlay: &Self) {
        macro_rules! overlay_field {
            ($field:ident) => {
                if overlay.$field.is_some() {
                    self.$field = overlay.$field.clone();
                }
            };
        }
        overlay_field!(layout);
        overlay_field!(foreground);
        overlay_field!(background);
        overlay_field!(border_color);
        overlay_field!(border_width);
        overlay_field!(corner_radius);
        overlay_field!(opacity_milli);
        overlay_field!(visibility);
        overlay_field!(cursor);
        overlay_field!(font_family);
        overlay_field!(font_size);
        overlay_field!(font_weight);
        overlay_field!(line_height);
        overlay_field!(direction);
    }
}

#[derive(Clone, Copy, Debug, Default, Eq, Ord, PartialEq, PartialOrd)]
pub struct InteractionState {
    pub hovered: bool,
    pub focused: bool,
    pub pressed: bool,
    pub disabled: bool,
}

#[derive(Clone, Debug, Default, Eq, Ord, PartialEq, PartialOrd)]
pub struct StateStyles {
    pub hover: StyleProperties,
    pub focus: StyleProperties,
    pub pressed: StyleProperties,
    pub disabled: StyleProperties,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum ThemeMode {
    Light,
    Dark,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Contrast {
    Normal,
    High,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum MotionPreference {
    Full,
    Reduced,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Density {
    Compact,
    Standard,
    Comfortable,
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct ThemeEnvironment {
    pub mode: ThemeMode,
    pub contrast: Contrast,
    pub motion: MotionPreference,
    pub density: Density,
    pub typography_scale_milli: u16,
    pub locale: String,
    pub direction: TextDirection,
}

impl Default for ThemeEnvironment {
    fn default() -> Self {
        Self {
            mode: ThemeMode::Light,
            contrast: Contrast::Normal,
            motion: MotionPreference::Full,
            density: Density::Standard,
            typography_scale_milli: 1000,
            locale: "und".to_owned(),
            direction: TextDirection::Locale,
        }
    }
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum ThemeToken {
    Foreground,
    Background,
    Accent,
    Border,
    Surface,
    Error,
    Warning,
    Success,
    Control,
    Custom(String),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ThemeSnapshot {
    pub revision: u64,
    pub environment: ThemeEnvironment,
    pub tokens: BTreeMap<ThemeToken, StyleProperties>,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct StyleId {
    pub session: UiSessionId,
    pub handle: Handle,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct StyleStoreConfig {
    pub max_styles: usize,
    pub max_theme_tokens: usize,
    pub max_subtree_overrides: usize,
    pub max_string_bytes: usize,
}

impl Default for StyleStoreConfig {
    fn default() -> Self {
        Self {
            max_styles: 16_384,
            max_theme_tokens: 1024,
            max_subtree_overrides: 1024,
            max_string_bytes: 1024 * 1024,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum StyleError {
    InvalidConfig,
    WrongSession,
    StyleCapacity,
    ThemeTokenCapacity,
    OverrideCapacity,
    StringCapacity,
    InvalidStyle,
    InvalidThemeRevision,
    InvalidRoot,
    GenerationExhausted,
    Closed,
}

#[derive(Clone, Debug)]
struct StyleSlot {
    generation: u32,
    properties: StyleProperties,
    states: StateStyles,
}

#[derive(Clone, Debug)]
pub struct ResolvedStyle {
    pub style: StyleProperties,
    pub theme_revision: u64,
    pub reduced_motion: bool,
}

pub struct StyleStore {
    session: UiSessionId,
    config: StyleStoreConfig,
    slots: Vec<StyleSlot>,
    interned: BTreeMap<(StyleProperties, StateStyles), StyleId>,
    theme: ThemeSnapshot,
    root_overrides: BTreeMap<UiRootId, BTreeMap<ThemeToken, StyleProperties>>,
    closed: bool,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct StyleStoreOwnerSnapshot {
    pub styles: usize,
    pub theme_tokens: usize,
    pub root_overrides: usize,
    pub closed: bool,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct StyleStoreShutdownReport {
    pub released_styles: usize,
    pub released_theme_tokens: usize,
    pub released_root_overrides: usize,
}

impl StyleStore {
    pub fn new(
        session: UiSessionId,
        config: StyleStoreConfig,
        environment: ThemeEnvironment,
    ) -> Result<Self, StyleError> {
        if !session.is_valid()
            || config.max_styles == 0
            || config.max_styles > u32::MAX as usize
            || config.max_theme_tokens == 0
            || config.max_subtree_overrides == 0
            || config.max_string_bytes == 0
            || environment.locale.is_empty()
            || environment.typography_scale_milli == 0
        {
            return Err(StyleError::InvalidConfig);
        }
        Ok(Self {
            session,
            config,
            slots: Vec::new(),
            interned: BTreeMap::new(),
            theme: ThemeSnapshot {
                revision: 1,
                environment,
                tokens: BTreeMap::new(),
            },
            root_overrides: BTreeMap::new(),
            closed: false,
        })
    }

    pub const fn theme_revision(&self) -> u64 {
        self.theme.revision
    }

    pub fn theme(&self) -> &ThemeSnapshot {
        &self.theme
    }

    pub fn owner_snapshot(&self) -> StyleStoreOwnerSnapshot {
        StyleStoreOwnerSnapshot {
            styles: self.slots.len(),
            theme_tokens: self.theme.tokens.len(),
            root_overrides: self.root_overrides.len(),
            closed: self.closed,
        }
    }

    pub fn intern(
        &mut self,
        properties: StyleProperties,
        states: StateStyles,
    ) -> Result<StyleId, StyleError> {
        self.ensure_open()?;
        validate_style(&properties, self.config.max_string_bytes)?;
        validate_states(&states, self.config.max_string_bytes)?;
        let key = (properties, states);
        if let Some(style) = self.interned.get(&key) {
            return Ok(*style);
        }
        if self.slots.len() == self.config.max_styles {
            return Err(StyleError::StyleCapacity);
        }
        let id = StyleId {
            session: self.session,
            handle: Handle {
                index: self.slots.len() as u32,
                generation: 1,
            },
        };
        self.slots.push(StyleSlot {
            generation: 1,
            properties: key.0.clone(),
            states: key.1.clone(),
        });
        self.interned.insert(key, id);
        Ok(id)
    }

    pub fn set_theme(
        &mut self,
        environment: ThemeEnvironment,
        tokens: BTreeMap<ThemeToken, StyleProperties>,
    ) -> Result<u64, StyleError> {
        self.ensure_open()?;
        if environment.locale.is_empty() || environment.typography_scale_milli == 0 {
            return Err(StyleError::InvalidConfig);
        }
        if tokens.len() > self.config.max_theme_tokens {
            return Err(StyleError::ThemeTokenCapacity);
        }
        for style in tokens.values() {
            validate_style(style, self.config.max_string_bytes)?;
        }
        let revision = self
            .theme
            .revision
            .checked_add(1)
            .ok_or(StyleError::InvalidThemeRevision)?;
        self.theme = ThemeSnapshot {
            revision,
            environment,
            tokens,
        };
        Ok(revision)
    }

    pub fn set_root_overrides(
        &mut self,
        root: UiRootId,
        overrides: BTreeMap<ThemeToken, StyleProperties>,
    ) -> Result<(), StyleError> {
        self.ensure_open()?;
        if !root.is_valid() {
            return Err(StyleError::InvalidRoot);
        }
        if overrides.len() > self.config.max_subtree_overrides {
            return Err(StyleError::OverrideCapacity);
        }
        for style in overrides.values() {
            validate_style(style, self.config.max_string_bytes)?;
        }
        if overrides.is_empty() {
            self.root_overrides.remove(&root);
        } else {
            self.root_overrides.insert(root, overrides);
        }
        Ok(())
    }

    pub fn close_root(&mut self, root: UiRootId) {
        self.root_overrides.remove(&root);
    }

    pub fn resolve(
        &self,
        root: UiRootId,
        defaults: &StyleProperties,
        theme_tokens: &[ThemeToken],
        control_variant: &StyleProperties,
        reusable: StyleId,
        inline: &StyleProperties,
        state: InteractionState,
    ) -> Result<ResolvedStyle, StyleError> {
        self.ensure_open()?;
        if !root.is_valid() {
            return Err(StyleError::InvalidRoot);
        }
        let slot = self.style(reusable)?;
        let mut resolved = defaults.clone();
        for token in theme_tokens {
            if let Some(theme) = self
                .root_overrides
                .get(&root)
                .and_then(|overrides| overrides.get(token))
                .or_else(|| self.theme.tokens.get(token))
            {
                resolved.overlay(theme);
            }
        }
        resolved.overlay(control_variant);
        resolved.overlay(&slot.properties);
        resolved.overlay(inline);
        if state.hovered {
            resolved.overlay(&slot.states.hover);
        }
        if state.focused {
            resolved.overlay(&slot.states.focus);
        }
        if state.pressed {
            resolved.overlay(&slot.states.pressed);
        }
        if state.disabled {
            resolved.overlay(&slot.states.disabled);
        }
        if resolved.direction.is_none() {
            resolved.direction = Some(self.theme.environment.direction);
        }
        Ok(ResolvedStyle {
            style: resolved,
            theme_revision: self.theme.revision,
            reduced_motion: self.theme.environment.motion == MotionPreference::Reduced,
        })
    }

    pub fn shutdown(&mut self) -> StyleStoreShutdownReport {
        if self.closed {
            return StyleStoreShutdownReport::default();
        }
        let report = StyleStoreShutdownReport {
            released_styles: self.slots.len(),
            released_theme_tokens: self.theme.tokens.len(),
            released_root_overrides: self.root_overrides.len(),
        };
        self.slots.clear();
        self.interned.clear();
        self.root_overrides.clear();
        self.theme = ThemeSnapshot {
            revision: 0,
            environment: ThemeEnvironment::default(),
            tokens: BTreeMap::new(),
        };
        self.closed = true;
        report
    }

    fn ensure_open(&self) -> Result<(), StyleError> {
        if self.closed {
            Err(StyleError::Closed)
        } else {
            Ok(())
        }
    }

    fn style(&self, id: StyleId) -> Result<&StyleSlot, StyleError> {
        if id.session != self.session || !id.handle.is_valid() {
            return Err(StyleError::WrongSession);
        }
        self.slots
            .get(id.handle.index as usize)
            .filter(|slot| slot.generation == id.handle.generation)
            .ok_or(StyleError::InvalidStyle)
    }
}

fn validate_states(states: &StateStyles, max_string_bytes: usize) -> Result<(), StyleError> {
    validate_style(&states.hover, max_string_bytes)?;
    validate_style(&states.focus, max_string_bytes)?;
    validate_style(&states.pressed, max_string_bytes)?;
    validate_style(&states.disabled, max_string_bytes)
}

fn validate_style(properties: &StyleProperties, max_string_bytes: usize) -> Result<(), StyleError> {
    if properties
        .font_family
        .as_ref()
        .is_some_and(|family| family.len() > max_string_bytes)
    {
        return Err(StyleError::StringCapacity);
    }
    if properties
        .opacity_milli
        .is_some_and(|opacity| opacity > 1000)
        || properties.border_width.is_some_and(|value| value < 0)
        || properties.corner_radius.is_some_and(|value| value < 0)
        || properties.font_size.is_some_and(|value| value <= 0)
        || properties.line_height.is_some_and(|value| value <= 0)
        || properties
            .layout
            .as_ref()
            .is_some_and(|layout| !valid_layout(layout))
    {
        return Err(StyleError::InvalidStyle);
    }
    Ok(())
}

fn valid_layout(layout: &Layout) -> bool {
    !matches!(layout.mode, LayoutMode::Grid { columns: 0, .. })
        && layout
            .aspect_ratio
            .is_none_or(|(numerator, denominator)| numerator > 0 && denominator > 0)
        && [
            layout.width,
            layout.height,
            layout.min_width,
            layout.min_height,
            layout.max_width,
            layout.max_height,
            layout.margin.top,
            layout.margin.right,
            layout.margin.bottom,
            layout.margin.left,
            layout.padding.top,
            layout.padding.right,
            layout.padding.bottom,
            layout.padding.left,
            layout.gap,
            layout.inset.top,
            layout.inset.right,
            layout.inset.bottom,
            layout.inset.left,
        ]
        .into_iter()
        .all(valid_length)
}

fn valid_length(length: Length) -> bool {
    match length {
        Length::Px(value) | Length::FitContent(value) => value >= 0,
        Length::Percent(value) => value >= 0,
        Length::Fraction(value) => value > 0,
        Length::Auto | Length::MinContent | Length::MaxContent => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn handle(index: u32) -> Handle {
        Handle {
            index,
            generation: 1,
        }
    }

    #[test]
    fn resolution_obeys_theme_root_reusable_inline_and_state_precedence() {
        let session = handle(1);
        let root = handle(2);
        let mut environment = ThemeEnvironment::default();
        environment.motion = MotionPreference::Reduced;
        environment.direction = TextDirection::RightToLeft;
        let mut store =
            StyleStore::new(session, StyleStoreConfig::default(), environment.clone()).unwrap();
        store
            .set_theme(
                environment,
                BTreeMap::from([(
                    ThemeToken::Accent,
                    StyleProperties {
                        foreground: Some(Color(0x11)),
                        ..StyleProperties::default()
                    },
                )]),
            )
            .unwrap();
        store
            .set_root_overrides(
                root,
                BTreeMap::from([(
                    ThemeToken::Accent,
                    StyleProperties {
                        foreground: Some(Color(0x22)),
                        ..StyleProperties::default()
                    },
                )]),
            )
            .unwrap();
        let reusable = store
            .intern(
                StyleProperties {
                    background: Some(Color(0x33)),
                    ..StyleProperties::default()
                },
                StateStyles {
                    hover: StyleProperties {
                        cursor: Some(Cursor::Pointer),
                        ..StyleProperties::default()
                    },
                    ..StateStyles::default()
                },
            )
            .unwrap();
        let resolved = store
            .resolve(
                root,
                &StyleProperties::default(),
                &[ThemeToken::Accent],
                &StyleProperties::default(),
                reusable,
                &StyleProperties {
                    foreground: Some(Color(0x44)),
                    opacity_milli: Some(900),
                    ..StyleProperties::default()
                },
                InteractionState {
                    hovered: true,
                    ..InteractionState::default()
                },
            )
            .unwrap();
        assert_eq!(resolved.style.foreground, Some(Color(0x44)));
        assert_eq!(resolved.style.background, Some(Color(0x33)));
        assert_eq!(resolved.style.cursor, Some(Cursor::Pointer));
        assert_eq!(resolved.style.direction, Some(TextDirection::RightToLeft));
        assert!(resolved.reduced_motion);
    }

    #[test]
    fn invalid_style_fails_before_interning_or_theme_revision_change() {
        let mut store = StyleStore::new(
            handle(1),
            StyleStoreConfig::default(),
            ThemeEnvironment::default(),
        )
        .unwrap();
        let revision = store.theme_revision();
        let invalid = StyleProperties {
            opacity_milli: Some(1001),
            ..StyleProperties::default()
        };
        assert_eq!(
            store.intern(invalid.clone(), StateStyles::default()),
            Err(StyleError::InvalidStyle)
        );
        assert_eq!(
            store.set_theme(
                ThemeEnvironment::default(),
                BTreeMap::from([(ThemeToken::Accent, invalid)])
            ),
            Err(StyleError::InvalidStyle)
        );
        assert_eq!(store.theme_revision(), revision);
    }
}
