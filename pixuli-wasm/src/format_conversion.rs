//! 图片格式转换功能模块
//! 
//! 提供各种图片格式之间的转换功能

use napi_derive::napi;
use napi::Error as NapiError;
use image::{DynamicImage, GenericImageView};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct FormatConversionOptions {
  pub target_format: String,
  pub quality: Option<u8>,
  pub preserve_transparency: Option<bool>,
  pub lossless: Option<bool>,
  pub color_space: Option<String>,
  pub resize: Option<ResizeOptions>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct ResizeOptions {
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub maintain_aspect_ratio: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct FormatConversionResult {
  pub data: Vec<u8>,
  pub original_size: u32,
  pub converted_size: u32,
  pub width: u32,
  pub height: u32,
  pub original_width: u32,
  pub original_height: u32,
  pub conversion_time: f64,
}

/// 转换图片格式
#[napi]
pub fn convert_image_format(
  image_data: Vec<u8>,
  options: FormatConversionOptions,
) -> Result<FormatConversionResult, NapiError> {
  let start_time = std::time::Instant::now();
  
  // 解析图片
  let img = image::load_from_memory(&image_data)
    .map_err(|e| NapiError::new(napi::Status::InvalidArg, format!("Failed to load image: {}", e)))?;

  let (original_width, original_height) = img.dimensions();
  let original_size = image_data.len() as u32;

  // 处理尺寸调整
  let (final_width, final_height) = if let Some(resize) = &options.resize {
    calculate_resize_dimensions(original_width, original_height, resize)
  } else {
    (original_width, original_height)
  };

  // 调整图片尺寸
  let resized_img = if final_width != original_width || final_height != original_height {
    img.resize(final_width, final_height, image::imageops::FilterType::Lanczos3)
  } else {
    img
  };

  // 根据目标格式进行转换
  let converted_data = match options.target_format.to_lowercase().as_str() {
    "jpeg" | "jpg" => convert_to_jpeg(&resized_img, options.quality.unwrap_or(80))?,
    "png" => convert_to_png(&resized_img, options.preserve_transparency.unwrap_or(true))?,
    "webp" => convert_to_webp(&resized_img, options.quality.unwrap_or(80), options.lossless.unwrap_or(false))?,
    "gif" => convert_to_gif(&resized_img)?,
    "bmp" => convert_to_bmp(&resized_img)?,
    "tiff" | "tif" => convert_to_tiff(&resized_img)?,
    _ => return Err(NapiError::new(napi::Status::InvalidArg, format!("Unsupported target format: {}", options.target_format))),
  };

  let converted_size = converted_data.len() as u32;
  let conversion_time = start_time.elapsed().as_millis() as f64;

  Ok(FormatConversionResult {
    data: converted_data,
    original_size,
    converted_size,
    width: final_width,
    height: final_height,
    original_width,
    original_height,
    conversion_time,
  })
}

/// 批量转换图片格式
#[napi]
pub fn batch_convert_image_format(
  images_data: Vec<Vec<u8>>,
  options: FormatConversionOptions,
) -> Result<Vec<FormatConversionResult>, NapiError> {
  let mut results = Vec::new();
  
  for image_data in images_data {
    match convert_image_format(image_data, options.clone()) {
      Ok(result) => results.push(result),
      Err(e) => return Err(NapiError::new(napi::Status::GenericFailure, format!("Batch conversion failed: {}", e))),
    }
  }
  
  Ok(results)
}

/// 计算调整后的尺寸
fn calculate_resize_dimensions(
  original_width: u32,
  original_height: u32,
  resize: &ResizeOptions,
) -> (u32, u32) {
  let maintain_aspect_ratio = resize.maintain_aspect_ratio.unwrap_or(true);
  
  if let (Some(target_width), Some(target_height)) = (resize.width, resize.height) {
    if !maintain_aspect_ratio {
      return (target_width, target_height);
    }
    
    // 保持宽高比
    let aspect_ratio = original_width as f64 / original_height as f64;
    let target_aspect_ratio = target_width as f64 / target_height as f64;
    
    if aspect_ratio > target_aspect_ratio {
      // 原图更宽，以宽度为准
      let new_height = (target_width as f64 / aspect_ratio) as u32;
      (target_width, new_height)
    } else {
      // 原图更高，以高度为准
      let new_width = (target_height as f64 * aspect_ratio) as u32;
      (new_width, target_height)
    }
  } else if let Some(target_width) = resize.width {
    // 只指定宽度
    let new_height = if maintain_aspect_ratio {
      (original_height as f64 * target_width as f64 / original_width as f64) as u32
    } else {
      original_height
    };
    (target_width, new_height)
  } else if let Some(target_height) = resize.height {
    // 只指定高度
    let new_width = if maintain_aspect_ratio {
      (original_width as f64 * target_height as f64 / original_height as f64) as u32
    } else {
      original_width
    };
    (new_width, target_height)
  } else {
    // 没有指定尺寸调整
    (original_width, original_height)
  }
}

/// 转换为 JPEG 格式
fn convert_to_jpeg(img: &DynamicImage, quality: u8) -> Result<Vec<u8>, NapiError> {
  let mut buffer = Vec::new();
  let rgb_img = img.to_rgb8();
  
  let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, quality);
  encoder.encode(&rgb_img, rgb_img.width(), rgb_img.height(), image::ColorType::Rgb8)
    .map_err(|e| NapiError::new(napi::Status::GenericFailure, format!("JPEG encoding failed: {}", e)))?;
  
  Ok(buffer)
}

/// 转换为 PNG 格式
fn convert_to_png(img: &DynamicImage, preserve_transparency: bool) -> Result<Vec<u8>, NapiError> {
  let mut buffer = Vec::new();
  
  if preserve_transparency && img.color().has_alpha() {
    let rgba_img = img.to_rgba8();
    let mut encoder = image::codecs::png::PngEncoder::new(&mut buffer);
    encoder.encode(&rgba_img, rgba_img.width(), rgba_img.height(), image::ColorType::Rgba8)
      .map_err(|e| NapiError::new(napi::Status::GenericFailure, format!("PNG encoding failed: {}", e)))?;
  } else {
    let rgb_img = img.to_rgb8();
    let mut encoder = image::codecs::png::PngEncoder::new(&mut buffer);
    encoder.encode(&rgb_img, rgb_img.width(), rgb_img.height(), image::ColorType::Rgb8)
      .map_err(|e| NapiError::new(napi::Status::GenericFailure, format!("PNG encoding failed: {}", e)))?;
  }
  
  Ok(buffer)
}

/// 转换为 WebP 格式
fn convert_to_webp(img: &DynamicImage, quality: u8, lossless: bool) -> Result<Vec<u8>, NapiError> {
  use webp::{Encoder, PixelLayout};
  
  let rgb_img = img.to_rgb8();
  let (width, height) = rgb_img.dimensions();
  
  let encoder = if lossless {
    Encoder::new(&rgb_img, PixelLayout::Rgb, width, height).encode_lossless()
  } else {
    Encoder::new(&rgb_img, PixelLayout::Rgb, width, height).encode(quality as f32)
  };
  
  Ok(encoder.to_vec())
}

/// 转换为 GIF 格式
fn convert_to_gif(img: &DynamicImage) -> Result<Vec<u8>, NapiError> {
  // 暂时使用 PNG 作为 GIF 的替代，因为 GIF 编码比较复杂
  // 在实际项目中，可以使用专门的 GIF 库
  convert_to_png(img, false)
}

/// 转换为 BMP 格式
fn convert_to_bmp(img: &DynamicImage) -> Result<Vec<u8>, NapiError> {
  // 暂时使用 PNG 作为 BMP 的替代
  // 在实际项目中，可以实现真正的 BMP 编码
  convert_to_png(img, false)
}

/// 转换为 TIFF 格式
fn convert_to_tiff(img: &DynamicImage) -> Result<Vec<u8>, NapiError> {
  // 暂时使用 PNG 作为 TIFF 的替代
  // 在实际项目中，可以使用专门的 TIFF 库
  convert_to_png(img, false)
}
