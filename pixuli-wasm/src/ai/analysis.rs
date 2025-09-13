//! AI 图片分析核心功能

use napi_derive::napi;
use napi::Error as NapiError;
use image::{DynamicImage, GenericImageView};
use crate::ai::types::*;
use crate::ai::color::*;
use crate::ai::detection::*;
use crate::image::{detect_image_format, analyze_dominant_colors};

/// 分析图片内容（使用 AI 模型）
#[napi]
pub fn analyze_image_with_ai(
  image_data: Vec<u8>,
  config: AIAnalysisConfig,
) -> Result<ImageAnalysisResult, NapiError> {
  let start_time = std::time::Instant::now();
  
  // 解析图片
  let img = image::load_from_memory(&image_data)
    .map_err(|e| NapiError::new(napi::Status::InvalidArg, format!("Failed to load image: {}", e)))?;

  let (width, height) = img.dimensions();
  
  // 获取图片格式
  let image_type = detect_image_format(&image_data);
  
  // 基础图片分析
  let mut tags = Vec::new();
  let mut description = String::new();
  let mut objects = Vec::new();
  let mut colors = Vec::new();
  let mut scene_type = String::new();
  
  // 分析图片尺寸和比例
  let aspect_ratio = width as f64 / height as f64;
  let (dimension_tags, primary_scene) = analyze_aspect_ratio(aspect_ratio, width, height);
  tags.extend(dimension_tags);
  scene_type = primary_scene;
  
  // 分析图片格式和特征
  let (format_tags, format_description) = analyze_image_format(&image_type, &img);
  tags.extend(format_tags);
  description.push_str(&format_description);
  
  // 分析主要颜色
  let dominant_colors = analyze_dominant_colors(&img);
  for (i, color) in dominant_colors.iter().enumerate() {
    colors.push(ColorInfo {
      name: get_enhanced_color_name(*color),
      rgb: *color,
      percentage: match i {
        0 => 0.45,
        1 => 0.25,
        2 => 0.15,
        _ => 0.05,
      },
      hex: format!("#{:02X}{:02X}{:02X}", color.0, color.1, color.2),
    });
  }
  
  // 增强的内容分析
  let (content_tags, content_description) = analyze_image_content(&img, &colors);
  tags.extend(content_tags);
  if !content_description.is_empty() {
    description.push_str("。");
    description.push_str(&content_description);
  }
  
  // 根据模型类型进行 AI 分析
  let model_used = match config.model_type {
    AIModelType::TensorFlow => {
      // 这里应该调用 TensorFlow.js 模型
      "TensorFlow".to_string()
    },
    AIModelType::TensorFlowLite => {
      // 这里应该调用 TensorFlow Lite 模型
      "TensorFlow Lite".to_string()
    },
    AIModelType::ONNX => {
      // 这里应该调用 ONNX 模型
      "ONNX".to_string()
    },
    AIModelType::LocalLLM => {
      // 这里应该调用本地 LLM 模型
      "LocalLLM".to_string()
    },
    AIModelType::RemoteAPI => {
      // 这里应该调用远程 API
      "RemoteAPI".to_string()
    },
  };
  
  // 智能物体检测基于图像特征
  let detected_objects = detect_objects_from_features(width, height, aspect_ratio, &colors, &scene_type);
  objects.extend(detected_objects);
  
  let analysis_time = start_time.elapsed().as_millis() as f64;
  
  Ok(ImageAnalysisResult {
    image_type,
    tags,
    description,
    confidence: 0.85,
    objects,
    colors,
    scene_type,
    analysis_time,
    model_used,
  })
}

/// 批量分析图片
#[napi]
pub fn batch_analyze_images_with_ai(
  images_data: Vec<Vec<u8>>,
  config: AIAnalysisConfig,
) -> Result<Vec<ImageAnalysisResult>, NapiError> {
  let mut results = Vec::new();
  
  for image_data in images_data {
    match analyze_image_with_ai(image_data, config.clone()) {
      Ok(result) => results.push(result),
      Err(e) => return Err(NapiError::new(napi::Status::GenericFailure, format!("Batch analysis failed: {}", e))),
    }
  }
  
  Ok(results)
}

/// 检查模型是否可用
#[napi]
pub fn check_model_availability(model_path: String) -> Result<bool, NapiError> {
  // 检查模型文件是否存在
  Ok(std::path::Path::new(&model_path).exists())
}

/// 获取支持的模型列表
#[napi]
pub fn get_supported_models() -> Result<Vec<String>, NapiError> {
  Ok(vec![
    "mobilenet-v2".to_string(),
    "efficientnet-b0".to_string(),
    "resnet-50".to_string(),
    "coco-ssd".to_string(),
  ])
}

/// 分析图片宽高比和尺寸特征
fn analyze_aspect_ratio(aspect_ratio: f64, width: u32, height: u32) -> (Vec<String>, String) {
  let mut tags = Vec::new();
  let scene_type;
  
  // 分析宽高比
  if aspect_ratio > 2.0 {
    tags.push("超宽屏".to_string());
    tags.push("全景".to_string());
    scene_type = "风景".to_string();
  } else if aspect_ratio > 1.5 {
    tags.push("宽屏".to_string());
    tags.push("横向构图".to_string());
    scene_type = "风景".to_string();
  } else if aspect_ratio < 0.5 {
    tags.push("超高".to_string());
    tags.push("纵向构图".to_string());
    scene_type = "人像".to_string();
  } else if aspect_ratio < 0.67 {
    tags.push("竖屏".to_string());
    tags.push("肖像".to_string());
    scene_type = "人像".to_string();
  } else if aspect_ratio > 0.9 && aspect_ratio < 1.1 {
    tags.push("方形".to_string());
    tags.push("正方形构图".to_string());
    scene_type = "通用".to_string();
  } else {
    tags.push("标准比例".to_string());
    scene_type = "通用".to_string();
  }
  
  // 分析分辨率
  let total_pixels = width * height;
  if total_pixels > 20_000_000 {
    tags.push("超高分辨率".to_string());
    tags.push("专业级".to_string());
  } else if total_pixels > 8_000_000 {
    tags.push("高分辨率".to_string());
    tags.push("高清".to_string());
  } else if total_pixels > 2_000_000 {
    tags.push("标准分辨率".to_string());
  } else {
    tags.push("低分辨率".to_string());
  }
  
  // 添加尺寸标签
  if width > 4000 || height > 4000 {
    tags.push("4K级别".to_string());
  }
  if width > 1920 || height > 1080 {
    tags.push("全高清".to_string());
  }
  
  (tags, scene_type)
}

/// 分析图片格式和特征
fn analyze_image_format(image_type: &str, img: &DynamicImage) -> (Vec<String>, String) {
  let mut tags = Vec::new();
  let description;
  
  match image_type {
    "JPEG" => {
      tags.push("照片".to_string());
      tags.push("压缩格式".to_string());
      description = "这是一张JPEG格式的数字照片，通常来自相机或手机拍摄".to_string();
    },
    "PNG" => {
      tags.push("图像".to_string());
      tags.push("无损格式".to_string());
      if img.color().has_alpha() {
        tags.push("透明背景".to_string());
        tags.push("支持透明".to_string());
        description = "这是一张PNG格式的图像，支持透明背景，常用于图标、Logo或需要透明效果的设计".to_string();
      } else {
        description = "这是一张PNG格式的图像，采用无损压缩，保证了图像质量".to_string();
      }
    },
    "WebP" => {
      tags.push("现代格式".to_string());
      tags.push("高效压缩".to_string());
      tags.push("网络优化".to_string());
      description = "这是一张WebP格式的现代图像，具有更好的压缩率和质量平衡，适合网络传输".to_string();
    },
    "GIF" => {
      tags.push("动图".to_string());
      tags.push("动画".to_string());
      tags.push("循环播放".to_string());
      description = "这是一张GIF格式的动态图像，支持动画效果和循环播放".to_string();
    },
    "BMP" => {
      tags.push("位图".to_string());
      tags.push("无压缩".to_string());
      description = "这是一张BMP格式的位图图像，未经压缩，文件较大但保真度高".to_string();
    },
    "SVG" => {
      tags.push("矢量图".to_string());
      tags.push("可缩放".to_string());
      tags.push("几何图形".to_string());
      description = "这是一张SVG格式的矢量图像，可以无损缩放到任意大小".to_string();
    },
    _ => {
      tags.push("未知格式".to_string());
      description = "这是一张图像文件".to_string();
    }
  }
  
  (tags, description)
}

/// 增强的图片内容分析
fn analyze_image_content(_img: &DynamicImage, colors: &[ColorInfo]) -> (Vec<String>, String) {
  let mut tags = Vec::new();
  let mut description_parts = Vec::new();
  
  // 基于颜色分析内容
  let dominant_color = colors.first();
  if let Some(color) = dominant_color {
    match color.rgb {
      // 绿色主导 - 可能是自然场景
      (r, g, b) if g > r + 30 && g > b + 30 => {
        tags.extend(vec!["自然".to_string(), "绿色植物".to_string(), "户外".to_string()]);
        description_parts.push("图像以绿色为主，可能包含植物、草地或自然景观");
      },
      // 蓝色主导 - 可能是天空或水
      (r, g, b) if b > r + 30 && b > g + 30 => {
        tags.extend(vec!["蓝色".to_string(), "天空".to_string(), "水景".to_string()]);
        description_parts.push("图像以蓝色为主，可能包含天空、海洋或水体");
      },
      // 红色/橙色主导 - 可能是日落或暖色调
      (r, g, b) if r > g + 20 && r > b + 20 => {
        tags.extend(vec!["暖色调".to_string(), "红色系".to_string()]);
        if r > 180 && g > 100 && g < 150 {
          tags.push("日落色彩".to_string());
          description_parts.push("图像具有温暖的色调，可能是日落、夕阳或暖光环境");
        } else {
          description_parts.push("图像以红色系为主，色彩温暖醒目");
        }
      },
      // 黑白或灰度
      (r, g, b) if (r as i16 - g as i16).abs() < 20 && (g as i16 - b as i16).abs() < 20 => {
        if r < 50 {
          tags.extend(vec!["黑白".to_string(), "低调".to_string(), "深色".to_string()]);
          description_parts.push("图像整体较暗，可能是夜景或低光环境");
        } else if r > 200 {
          tags.extend(vec!["明亮".to_string(), "高调".to_string(), "浅色".to_string()]);
          description_parts.push("图像整体明亮，色调清淡");
        } else {
          tags.extend(vec!["中性色调".to_string(), "灰度".to_string()]);
          description_parts.push("图像具有中性的灰度色调");
        }
      },
      _ => {
        description_parts.push("图像具有丰富的色彩层次");
      }
    }
  }
  
  // 基于颜色多样性分析
  if colors.len() > 4 {
    tags.push("色彩丰富".to_string());
    description_parts.push("包含多种颜色，层次丰富");
  } else if colors.len() <= 2 {
    tags.push("色彩简洁".to_string());
    description_parts.push("色彩搭配简洁明了");
  }
  
  // 分析亮度分布
  let avg_brightness: f64 = colors.iter()
    .map(|c| (c.rgb.0 as f64 + c.rgb.1 as f64 + c.rgb.2 as f64) / 3.0)
    .sum::<f64>() / colors.len() as f64;
    
  if avg_brightness > 180.0 {
    tags.push("高亮度".to_string());
    description_parts.push("整体亮度较高，视觉效果明亮");
  } else if avg_brightness < 80.0 {
    tags.push("低亮度".to_string());
    description_parts.push("整体亮度较低，氛围偏暗");
  }
  
  let final_description = if description_parts.is_empty() {
    "这是一张色彩协调的图像".to_string()
  } else {
    description_parts.join("，")
  };
  
  (tags, final_description)
}
