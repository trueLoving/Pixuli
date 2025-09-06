#![deny(clippy::all)]

use napi_derive::napi;
use image::{DynamicImage, GenericImageView};
use webp::{Encoder, PixelLayout};
use napi::Error as NapiError;

#[napi]
pub fn plus_100(input: u32) -> u32 {
  input + 100
}

/// WebP压缩配置
#[napi(object)]
#[derive(Clone)]
pub struct WebPCompressOptions {
  /// 压缩质量 (0-100)
  pub quality: Option<u8>,
  /// 是否使用无损压缩
  pub lossless: Option<bool>,
}

/// WebP压缩结果
#[napi(object)]
pub struct WebPCompressResult {
  /// 压缩后的数据
  pub data: Vec<u8>,
  /// 原始大小
  pub original_size: u32,
  /// 压缩后大小
  pub compressed_size: u32,
  /// 压缩率 (0-1)
  pub compression_ratio: f64,
  /// 压缩后的宽度
  pub width: u32,
  /// 压缩后的高度
  pub height: u32,
}

/// 压缩图片为WebP格式
#[napi]
pub fn compress_to_webp(
  image_data: Vec<u8>,
  options: Option<WebPCompressOptions>,
) -> Result<WebPCompressResult, NapiError> {
  // 解析图片
  let img = image::load_from_memory(&image_data)
    .map_err(|e| NapiError::new(napi::Status::InvalidArg, format!("Failed to load image: {}", e)))?;

  let (width, height) = img.dimensions();
  let original_size = image_data.len() as u32;

  // 转换为RGBA格式
  let rgba_img = img.to_rgba8();
  
  // 创建WebP编码器
  let encoder = Encoder::new(
    &rgba_img,
    PixelLayout::Rgba,
    width,
    height,
  );

  // 配置质量
  let quality = options
    .as_ref()
    .and_then(|opts| opts.quality)
    .unwrap_or(80) as f32;

  // 编码为WebP
  let webp_memory = encoder.encode(quality);
  let webp_data = webp_memory.to_vec();

  let compressed_size = webp_data.len() as u32;
  let compression_ratio = if original_size > 0 {
    1.0 - (compressed_size as f64 / original_size as f64)
  } else {
    0.0
  };

  Ok(WebPCompressResult {
    data: webp_data,
    original_size,
    compressed_size,
    compression_ratio,
    width,
    height,
  })
}

/// 批量压缩图片为WebP格式
#[napi]
pub fn batch_compress_to_webp(
  images_data: Vec<Vec<u8>>,
  options: Option<WebPCompressOptions>,
) -> Result<Vec<WebPCompressResult>, NapiError> {
  let mut results = Vec::new();
  
  for image_data in images_data {
    match compress_to_webp(image_data, options.clone()) {
      Ok(result) => results.push(result),
      Err(e) => return Err(NapiError::new(napi::Status::GenericFailure, format!("Batch compression failed: {}", e))),
    }
  }
  
  Ok(results)
}

/// 获取图片信息
#[napi]
pub fn get_image_info(image_data: Vec<u8>) -> Result<String, NapiError> {
  let img = image::load_from_memory(&image_data)
    .map_err(|e| NapiError::new(napi::Status::InvalidArg, format!("Failed to load image: {}", e)))?;

  let (width, height) = img.dimensions();
  let format = match img {
    DynamicImage::ImageRgb8(_) => "RGB8",
    DynamicImage::ImageRgba8(_) => "RGBA8",
    DynamicImage::ImageLuma8(_) => "Luma8",
    DynamicImage::ImageLumaA8(_) => "LumaA8",
    _ => "Unknown",
  };

  let info = serde_json::json!({
    "width": width,
    "height": height,
    "format": format,
    "size": image_data.len(),
    "channels": match img {
      DynamicImage::ImageRgb8(_) => 3,
      DynamicImage::ImageRgba8(_) => 4,
      DynamicImage::ImageLuma8(_) => 1,
      DynamicImage::ImageLumaA8(_) => 2,
      _ => 0,
    }
  });

  Ok(info.to_string())
}
