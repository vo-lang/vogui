use std::sync::Arc;

use vogui_layout::Rect;
use vogui_runtime::platform_renderer::PlatformApplyError;

use crate::{NativeFrame, NativePaintSubmission, NativePainter, PaintCommand};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct WgpuUiPainterConfig {
    pub max_pixels: usize,
    pub texture_token: u64,
}

impl Default for WgpuUiPainterConfig {
    fn default() -> Self {
        Self {
            max_pixels: 16_777_216,
            texture_token: 1,
        }
    }
}

pub struct WgpuPreparedUiFrame {
    width: u32,
    height: u32,
    pixels: Vec<u8>,
    revision: u64,
    device_generation: u64,
}

struct StagedDevice {
    device: Arc<wgpu::Device>,
    queue: Arc<wgpu::Queue>,
    generation: u64,
}

pub struct WgpuUiPainter {
    config: WgpuUiPainterConfig,
    device: Arc<wgpu::Device>,
    queue: Arc<wgpu::Queue>,
    device_generation: u64,
    texture: Option<wgpu::Texture>,
    texture_size: [u32; 2],
    next_fence_value: u64,
    staged: Option<StagedDevice>,
    hidden: bool,
    closed: bool,
}

impl WgpuUiPainter {
    pub fn new(
        config: WgpuUiPainterConfig,
        device: Arc<wgpu::Device>,
        queue: Arc<wgpu::Queue>,
        device_generation: u64,
    ) -> Result<Self, PlatformApplyError> {
        if config.max_pixels == 0 || config.texture_token == 0 || device_generation == 0 {
            return Err(error(101, b"invalid wgpu UI painter config", false));
        }
        Ok(Self {
            config,
            device,
            queue,
            device_generation,
            texture: None,
            texture_size: [0, 0],
            next_fence_value: 1,
            staged: None,
            hidden: false,
            closed: false,
        })
    }

    pub fn texture(&self) -> Option<&wgpu::Texture> {
        self.texture.as_ref()
    }

    pub const fn is_hidden(&self) -> bool {
        self.hidden
    }

    pub fn stage_device(
        &mut self,
        device: Arc<wgpu::Device>,
        queue: Arc<wgpu::Queue>,
        generation: u64,
    ) -> Result<(), PlatformApplyError> {
        if self.closed
            || generation == 0
            || generation <= self.device_generation
            || self.staged.is_some()
        {
            return Err(error(102, b"invalid staged wgpu device", false));
        }
        self.staged = Some(StagedDevice {
            device,
            queue,
            generation,
        });
        Ok(())
    }

    fn ensure_texture(&mut self, width: u32, height: u32) {
        if self.texture.is_some() && self.texture_size == [width, height] {
            return;
        }
        self.texture = Some(self.device.create_texture(&wgpu::TextureDescriptor {
            label: Some("vogui-retained-layer"),
            size: wgpu::Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Rgba8UnormSrgb,
            usage: wgpu::TextureUsages::COPY_DST
                | wgpu::TextureUsages::TEXTURE_BINDING
                | wgpu::TextureUsages::COPY_SRC,
            view_formats: &[],
        }));
        self.texture_size = [width, height];
    }
}

impl NativePainter for WgpuUiPainter {
    type Prepared = WgpuPreparedUiFrame;

    fn device_generation(&self) -> u64 {
        self.device_generation
    }

    fn prepare(&mut self, frame: &NativeFrame) -> Result<Self::Prepared, PlatformApplyError> {
        if self.closed || frame.device_generation != self.device_generation {
            return Err(error(103, b"stale wgpu UI device", true));
        }
        let width = scaled_pixels(
            frame.viewport.width_milli,
            frame.scale_numerator,
            frame.scale_denominator,
        )?;
        let height = scaled_pixels(
            frame.viewport.height_milli,
            frame.scale_numerator,
            frame.scale_denominator,
        )?;
        let pixel_count = (width as usize)
            .checked_mul(height as usize)
            .filter(|pixels| *pixels <= self.config.max_pixels)
            .ok_or_else(|| error(104, b"wgpu UI pixel capacity exceeded", false))?;
        let mut pixels = vec![0_u8; pixel_count * 4];
        rasterize(
            &mut pixels,
            width,
            height,
            frame.scale_numerator,
            frame.scale_denominator,
            &frame.commands,
        )?;
        Ok(WgpuPreparedUiFrame {
            width,
            height,
            pixels,
            revision: frame.tree_revision,
            device_generation: frame.device_generation,
        })
    }

    fn submit(
        &mut self,
        prepared: Self::Prepared,
    ) -> Result<NativePaintSubmission, PlatformApplyError> {
        if self.closed || prepared.device_generation != self.device_generation {
            return Err(error(105, b"stale prepared UI frame", true));
        }
        self.ensure_texture(prepared.width, prepared.height);
        let texture = self
            .texture
            .as_ref()
            .ok_or_else(|| error(106, b"missing wgpu UI texture", true))?;
        self.queue.write_texture(
            wgpu::TexelCopyTextureInfo {
                texture,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            &prepared.pixels,
            wgpu::TexelCopyBufferLayout {
                offset: 0,
                bytes_per_row: Some(prepared.width * 4),
                rows_per_image: Some(prepared.height),
            },
            wgpu::Extent3d {
                width: prepared.width,
                height: prepared.height,
                depth_or_array_layers: 1,
            },
        );
        let fence_value = self.next_fence_value;
        self.next_fence_value = self
            .next_fence_value
            .checked_add(1)
            .ok_or_else(|| error(107, b"wgpu UI fence exhausted", true))?;
        self.hidden = false;
        Ok(NativePaintSubmission {
            texture_token: self.config.texture_token,
            fence_value,
            device_generation: self.device_generation,
            content_revision: prepared.revision,
        })
    }

    fn rebind_device(&mut self, new_generation: u64) -> Result<(), PlatformApplyError> {
        let staged = self
            .staged
            .take()
            .ok_or_else(|| error(108, b"wgpu UI device was not staged", true))?;
        if staged.generation != new_generation || new_generation <= self.device_generation {
            self.staged = Some(staged);
            return Err(error(109, b"staged wgpu UI generation mismatch", true));
        }
        self.device = staged.device;
        self.queue = staged.queue;
        self.device_generation = staged.generation;
        self.texture = None;
        self.texture_size = [0, 0];
        self.next_fence_value = 1;
        self.hidden = true;
        Ok(())
    }

    fn hide_surface(&mut self) {
        self.hidden = true;
    }

    fn close(&mut self) {
        self.texture = None;
        self.staged = None;
        self.closed = true;
        self.hidden = true;
    }
}

fn scaled_pixels(
    milli: i32,
    scale_numerator: u32,
    scale_denominator: u32,
) -> Result<u32, PlatformApplyError> {
    if milli <= 0 || scale_numerator == 0 || scale_denominator == 0 {
        return Err(error(110, b"invalid UI viewport", false));
    }
    let numerator = u64::try_from(milli)
        .map_err(|_| error(110, b"invalid UI viewport", false))?
        .checked_mul(u64::from(scale_numerator))
        .ok_or_else(|| error(110, b"invalid UI viewport", false))?;
    let denominator = 1_000_u64
        .checked_mul(u64::from(scale_denominator))
        .ok_or_else(|| error(110, b"invalid UI viewport", false))?;
    u32::try_from(numerator.div_ceil(denominator))
        .map_err(|_| error(110, b"invalid UI viewport", false))
}

fn rasterize(
    pixels: &mut [u8],
    width: u32,
    height: u32,
    scale_numerator: u32,
    scale_denominator: u32,
    commands: &[PaintCommand],
) -> Result<(), PlatformApplyError> {
    let viewport = PixelRect {
        left: 0,
        top: 0,
        right: width,
        bottom: height,
    };
    let mut clips = vec![viewport];
    for command in commands {
        match command {
            PaintCommand::BeginClip(_, rect) => {
                let current = *clips.last().expect("viewport clip is always present");
                clips.push(intersect(
                    current,
                    pixel_rect(*rect, width, height, scale_numerator, scale_denominator),
                ));
            }
            PaintCommand::EndClip(_) => {
                if clips.len() == 1 {
                    return Err(error(111, b"unbalanced UI clip stack", false));
                }
                clips.pop();
            }
            PaintCommand::FillRect { rect, color, .. } => {
                fill(
                    pixels,
                    width,
                    intersect(
                        *clips.last().unwrap(),
                        pixel_rect(*rect, width, height, scale_numerator, scale_denominator),
                    ),
                    rgba(*color),
                );
            }
            PaintCommand::StrokeRect {
                rect,
                color,
                width_milli,
                ..
            } => {
                let bounds = intersect(
                    *clips.last().unwrap(),
                    pixel_rect(*rect, width, height, scale_numerator, scale_denominator),
                );
                let stroke =
                    scaled_pixels((*width_milli).max(1), scale_numerator, scale_denominator)?
                        .max(1);
                stroke_rect(pixels, width, bounds, stroke, rgba(*color));
            }
            PaintCommand::Text {
                rect,
                color,
                glyph_count,
                ..
            } => {
                let bounds = intersect(
                    *clips.last().unwrap(),
                    pixel_rect(*rect, width, height, scale_numerator, scale_denominator),
                );
                draw_glyph_spans(pixels, width, bounds, rgba(*color), *glyph_count);
            }
            PaintCommand::Image { rect, .. } => {
                let bounds = intersect(
                    *clips.last().unwrap(),
                    pixel_rect(*rect, width, height, scale_numerator, scale_denominator),
                );
                draw_checkerboard(pixels, width, bounds);
            }
            PaintCommand::Icon { rect, color, .. } => {
                let bounds = intersect(
                    *clips.last().unwrap(),
                    pixel_rect(*rect, width, height, scale_numerator, scale_denominator),
                );
                draw_icon_mask(pixels, width, bounds, rgba(*color));
            }
        }
    }
    if clips.len() != 1 {
        return Err(error(111, b"unbalanced UI clip stack", false));
    }
    Ok(())
}

fn draw_icon_mask(pixels: &mut [u8], width: u32, bounds: PixelRect, color: [u8; 4]) {
    if bounds.right <= bounds.left || bounds.bottom <= bounds.top {
        return;
    }
    let inset_x = ((bounds.right - bounds.left) / 5).max(1);
    let inset_y = ((bounds.bottom - bounds.top) / 5).max(1);
    let inner = PixelRect {
        left: bounds.left.saturating_add(inset_x),
        top: bounds.top.saturating_add(inset_y),
        right: bounds.right.saturating_sub(inset_x),
        bottom: bounds.bottom.saturating_sub(inset_y),
    };
    fill(pixels, width, inner, color);
}

fn stroke_rect(pixels: &mut [u8], width: u32, bounds: PixelRect, stroke: u32, color: [u8; 4]) {
    if bounds.right <= bounds.left || bounds.bottom <= bounds.top {
        return;
    }
    let stroke_x = stroke.min(bounds.right - bounds.left);
    let stroke_y = stroke.min(bounds.bottom - bounds.top);
    fill(
        pixels,
        width,
        PixelRect {
            bottom: bounds.top + stroke_y,
            ..bounds
        },
        color,
    );
    fill(
        pixels,
        width,
        PixelRect {
            top: bounds.bottom - stroke_y,
            ..bounds
        },
        color,
    );
    fill(
        pixels,
        width,
        PixelRect {
            right: bounds.left + stroke_x,
            ..bounds
        },
        color,
    );
    fill(
        pixels,
        width,
        PixelRect {
            left: bounds.right - stroke_x,
            ..bounds
        },
        color,
    );
}

#[derive(Clone, Copy)]
struct PixelRect {
    left: u32,
    top: u32,
    right: u32,
    bottom: u32,
}

fn pixel_rect(
    rect: Rect,
    width: u32,
    height: u32,
    scale_numerator: u32,
    scale_denominator: u32,
) -> PixelRect {
    let left = scaled_coordinate(
        i64::from(rect.x_milli),
        scale_numerator,
        scale_denominator,
        width,
        false,
    );
    let top = scaled_coordinate(
        i64::from(rect.y_milli),
        scale_numerator,
        scale_denominator,
        height,
        false,
    );
    let right = scaled_coordinate(
        i64::from(rect.x_milli) + i64::from(rect.width_milli),
        scale_numerator,
        scale_denominator,
        width,
        true,
    );
    let bottom = scaled_coordinate(
        i64::from(rect.y_milli) + i64::from(rect.height_milli),
        scale_numerator,
        scale_denominator,
        height,
        true,
    );
    PixelRect {
        left,
        top,
        right: right.max(left),
        bottom: bottom.max(top),
    }
}

fn scaled_coordinate(
    milli: i64,
    scale_numerator: u32,
    scale_denominator: u32,
    limit: u32,
    ceil: bool,
) -> u32 {
    if milli <= 0 {
        return 0;
    }
    let denominator = 1_000_u128 * u128::from(scale_denominator);
    let numerator = (milli as u128).saturating_mul(u128::from(scale_numerator));
    let scaled = if ceil {
        numerator.saturating_add(denominator - 1) / denominator
    } else {
        numerator / denominator
    };
    scaled.min(u128::from(limit)) as u32
}

fn intersect(left: PixelRect, right: PixelRect) -> PixelRect {
    let x = left.left.max(right.left);
    let y = left.top.max(right.top);
    PixelRect {
        left: x,
        top: y,
        right: left.right.min(right.right).max(x),
        bottom: left.bottom.min(right.bottom).max(y),
    }
}

fn rgba(color: u32) -> [u8; 4] {
    color.to_be_bytes()
}

fn fill(pixels: &mut [u8], width: u32, rect: PixelRect, color: [u8; 4]) {
    for y in rect.top..rect.bottom {
        for x in rect.left..rect.right {
            let offset = (y as usize * width as usize + x as usize) * 4;
            pixels[offset..offset + 4].copy_from_slice(&color);
        }
    }
}

fn draw_glyph_spans(
    pixels: &mut [u8],
    width: u32,
    rect: PixelRect,
    color: [u8; 4],
    glyph_count: usize,
) {
    if glyph_count == 0 || rect.right == rect.left || rect.bottom == rect.top {
        return;
    }
    let span_width = ((rect.right - rect.left) as usize / glyph_count.max(1)).max(1) as u32;
    for glyph in 0..glyph_count {
        let left = rect
            .left
            .saturating_add((glyph as u32).saturating_mul(span_width));
        if left >= rect.right {
            break;
        }
        fill(
            pixels,
            width,
            PixelRect {
                left,
                top: rect.top,
                right: left.saturating_add(span_width).min(rect.right),
                bottom: rect.bottom,
            },
            color,
        );
    }
}

fn draw_checkerboard(pixels: &mut [u8], width: u32, rect: PixelRect) {
    for y in rect.top..rect.bottom {
        for x in rect.left..rect.right {
            let color = if ((x / 8) + (y / 8)) % 2 == 0 {
                [192, 192, 192, 255]
            } else {
                [96, 96, 96, 255]
            };
            let offset = (y as usize * width as usize + x as usize) * 4;
            pixels[offset..offset + 4].copy_from_slice(&color);
        }
    }
}

fn error(code: u32, message: &[u8], poisoned: bool) -> PlatformApplyError {
    PlatformApplyError {
        code,
        diagnostic: message.to_vec(),
        platform_may_be_partially_visible: poisoned,
    }
}
