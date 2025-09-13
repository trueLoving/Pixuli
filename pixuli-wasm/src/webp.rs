//! WebP 图片压缩模块
//! 
//! 提供图片的 WebP 格式压缩功能，支持单张和批量压缩

use napi_derive::napi;
use image::GenericImageView;
use webp::{Encoder, PixelLayout};
use napi::Error as NapiError;

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

  // 获取选项
  let opts = options.unwrap_or(WebPCompressOptions {
    quality: Some(80),
    lossless: Some(false),
  });

  let quality = opts.quality.unwrap_or(80);
  let lossless = opts.lossless.unwrap_or(false);

  // 转换为RGB格式
  let rgb_img = img.to_rgb8();
  let (img_width, img_height) = rgb_img.dimensions();

  // 创建WebP编码器
  let encoder = if lossless {
    Encoder::new(&rgb_img, PixelLayout::Rgb, img_width, img_height).encode_lossless()
  } else {
    Encoder::new(&rgb_img, PixelLayout::Rgb, img_width, img_height).encode(quality as f32)
  };

  let webp_data = encoder.to_vec();
  let compressed_size = webp_data.len() as u32;
  let compression_ratio = compressed_size as f64 / original_size as f64;

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
