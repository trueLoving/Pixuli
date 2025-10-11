//! 图片处理基础功能模块
//! 
//! 提供图片信息获取、格式检测等基础功能

use napi_derive::napi;
use image::{DynamicImage, GenericImageView};
use napi::Error as NapiError;
use serde_json;

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

/// 检测图片格式
pub fn detect_image_format(data: &[u8]) -> String {
  if data.len() < 4 {
    return "Unknown".to_string();
  }
  
  // 检查文件头
  if data.starts_with(&[0xFF, 0xD8, 0xFF]) {
    "JPEG".to_string()
  } else if data.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
    "PNG".to_string()
  } else if data.starts_with(b"GIF8") {
    "GIF".to_string()
  } else if data.starts_with(b"RIFF") && data.len() > 12 && &data[8..12] == b"WEBP" {
    "WebP".to_string()
  } else if data.starts_with(&[0x42, 0x4D]) {
    "BMP".to_string()
  } else {
    "Unknown".to_string()
  }
}

/// 分析主要颜色
pub fn analyze_dominant_colors(img: &DynamicImage) -> Vec<(u8, u8, u8)> {
  use std::collections::HashMap;
  
  let mut color_counts: HashMap<(u8, u8, u8), u32> = HashMap::new();
  
  // 简化采样
  let (width, height) = img.dimensions();
  let step_x = width / 32;
  let step_y = height / 32;
  
  for y in (0..height).step_by(step_y as usize) {
    for x in (0..width).step_by(step_x as usize) {
      if x < width && y < height {
        let pixel = img.get_pixel(x, y);
        let rgb = (pixel[0], pixel[1], pixel[2]);
        *color_counts.entry(rgb).or_insert(0) += 1;
      }
    }
  }
  
  // 获取最常见的颜色
  let mut colors: Vec<_> = color_counts.into_iter().collect();
  colors.sort_by(|a, b| b.1.cmp(&a.1));
  
  colors.into_iter().take(3).map(|(color, _)| color).collect()
}
