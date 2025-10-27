//! AI 图片分析模块
//!
//! 提供基于 ONNX Runtime 的图片分析功能
//! 支持对象检测、场景识别、图片标注等 AI 能力

use napi_derive::napi;
use napi::Error as NapiError;
use image::{DynamicImage, GenericImageView};
use serde_json::json;
use std::path::Path;

/// AI 分析配置选项
#[napi(object)]
#[derive(Clone)]
pub struct AIAnalysisOptions {
    /// 模型路径
    pub model_path: Option<String>,
    /// 置信度阈值 (0.0-1.0)
    pub confidence_threshold: Option<f64>,
    /// 最大标签数量
    pub max_tags: Option<u32>,
    /// 是否启用颜色分析
    pub analyze_colors: Option<bool>,
    /// 是否启用对象检测
    pub detect_objects: Option<bool>,
}

/// 检测到的对象
#[napi(object)]
pub struct DetectedObject {
    pub name: String,
    pub confidence: f64,
    pub bbox: String, // JSON string
    pub category: String,
}

/// 颜色信息
#[napi(object)]
pub struct ColorInfo {
    pub name: String,
    pub rgb: Vec<u8>,
    pub hex: String,
    pub percentage: f64,
}

/// 图片信息
#[napi(object)]
pub struct ImageInfo {
    pub width: u32,
    pub height: u32,
    pub aspect_ratio: f64,
}

/// AI 分析结果
#[napi(object)]
pub struct AIAnalysisResult {
    /// 分析是否成功
    pub success: bool,
    /// 图片类型
    pub image_type: String,
    /// 标签 JSON string
    pub tags_json: String,
    /// 图片描述
    pub description: String,
    /// 置信度
    pub confidence: f64,
    /// 检测到的对象 JSON string
    pub objects_json: String,
    /// 主要颜色 JSON string
    pub colors_json: String,
    /// 场景类型
    pub scene_type: String,
    /// 分析耗时（毫秒）
    pub analysis_time: f64,
    /// 使用的模型
    pub model_used: String,
    /// 图片信息 JSON string
    pub image_info_json: String,
    /// 错误信息
    pub error: Option<String>,
}

/// 分析图片（单张）
#[napi]
pub fn analyze_image(image_data: Vec<u8>, options: Option<AIAnalysisOptions>) -> Result<AIAnalysisResult, NapiError> {
    let start_time = std::time::Instant::now();

    // 加载图片
    let img = image::load_from_memory(&image_data)
        .map_err(|e| NapiError::new(napi::Status::InvalidArg, format!("Failed to load image: {}", e)))?;

    let (width, height) = img.dimensions();

    // 获取选项
    let opts = options.unwrap_or(AIAnalysisOptions {
        model_path: None,
        confidence_threshold: Some(0.5),
        max_tags: Some(10),
        analyze_colors: Some(true),
        detect_objects: Some(true),
    });

    // 基本分析（目前不使用 ONNX，先提供基础实现）
    let (tags, description, confidence, objects_json, colors_json, scene_type) =
        perform_basic_analysis(&img, &opts);

    let analysis_time = start_time.elapsed().as_millis() as f64;

    let image_info = json!({
        "width": width,
        "height": height,
        "aspectRatio": width as f64 / height as f64,
    });

    Ok(AIAnalysisResult {
        success: true,
        image_type: get_image_type(&img),
        tags_json: serde_json::to_string(&tags).unwrap_or_default(),
        description,
        confidence,
        objects_json, // 已经是 JSON 字符串
        colors_json,  // 已经是 JSON 字符串
        scene_type,
        analysis_time,
        model_used: "Basic Analysis (Rust)".to_string(),
        image_info_json: serde_json::to_string(&image_info).unwrap_or_default(),
        error: None,
    })
}

/// 批量分析图片
#[napi]
pub fn batch_analyze_images(
    images_data: Vec<Vec<u8>>,
    options: Option<AIAnalysisOptions>
) -> Result<Vec<AIAnalysisResult>, NapiError> {
    let mut results = Vec::new();

    for image_data in images_data {
        match analyze_image(image_data, options.clone()) {
            Ok(result) => results.push(result),
            Err(e) => {
                // 返回错误结果而不是失败
                results.push(AIAnalysisResult {
                    success: false,
                    image_type: "unknown".to_string(),
                    tags_json: "[]".to_string(),
                    description: String::new(),
                    confidence: 0.0,
                    objects_json: "[]".to_string(),
                    colors_json: "[]".to_string(),
                    scene_type: "unknown".to_string(),
                    analysis_time: 0.0,
                    model_used: String::new(),
                    image_info_json: "{}".to_string(),
                    error: Some(e.to_string()),
                });
            }
        }
    }

    Ok(results)
}

/// 检查模型是否可用
#[napi]
pub fn check_model_availability(model_path: String) -> Result<bool, NapiError> {
    Ok(Path::new(&model_path).exists())
}

/// 执行基础分析
fn perform_basic_analysis(img: &DynamicImage, opts: &AIAnalysisOptions) -> (
    Vec<String>,
    String,
    f64,
    String, // objects as JSON string
    String, // colors as JSON string
    String,
) {
    let (width, height) = img.dimensions();

    // 分析主要颜色
    let colors_json = if opts.analyze_colors.unwrap_or(true) {
        let colors = analyze_dominant_colors(img);
        serde_json::to_string(&colors).unwrap_or_else(|_| "[]".to_string())
    } else {
        "[]".to_string()
    };

    // 基于图片特征生成描述
    let color_values: Vec<serde_json::Value> = serde_json::from_str(&colors_json).unwrap_or_default();
    let (tags, description, scene_type) = generate_description_from_features(width, height, &color_values);

    // 对象检测（基础实现）
    let objects_json = if opts.detect_objects.unwrap_or(true) {
        detect_objects_basic(img)
    } else {
        "[]".to_string()
    };

    let confidence = 0.75; // 基础分析的置信度

    (tags, description, confidence, objects_json, colors_json, scene_type)
}

/// 分析主要颜色
fn analyze_dominant_colors(img: &DynamicImage) -> Vec<serde_json::Value> {
    use std::collections::HashMap;

    let mut color_counts: HashMap<(u8, u8, u8), u32> = HashMap::new();

    // 采样分析
    let (width, height) = img.dimensions();
    let step_x = (width / 32).max(1);
    let step_y = (height / 32).max(1);

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

    let total_pixels = colors.iter().map(|(_, count)| *count as usize).sum::<usize>();

    colors
        .into_iter()
        .take(5)
        .enumerate()
        .map(|(i, (color, count))| {
            let rgb = vec![color.0, color.1, color.2];
            let hex = format!("#{:02x}{:02x}{:02x}", color.0, color.1, color.2);
            let percentage = count as f64 / total_pixels as f64;

            json!({
                "name": format!("Color {}", i + 1),
                "rgb": rgb,
                "hex": hex,
                "percentage": percentage
            })
        })
        .collect()
}

/// 基于图片特征生成描述
fn generate_description_from_features(
    width: u32,
    height: u32,
    colors: &[serde_json::Value]
) -> (Vec<String>, String, String) {
    let aspect_ratio = width as f64 / height as f64;

    let mut tags = Vec::new();
    let mut description_parts = Vec::new();
    let mut scene_type = String::from("普通图片");

    // ========== 方向标签 ==========
    if aspect_ratio > 1.8 {
        tags.push(String::from("横向"));
        tags.push(String::from("超宽屏"));
        description_parts.push(format!("一张横向超宽屏图片（{}×{}px）", width, height));
        scene_type = String::from("全景图");
    } else if aspect_ratio > 1.3 {
        tags.push(String::from("横向"));
        description_parts.push(format!("一张横向图片（{}×{}px）", width, height));
    } else if aspect_ratio < 0.56 {
        tags.push(String::from("纵向"));
        tags.push(String::from("竖屏"));
        description_parts.push(format!("一张纵向竖屏图片（{}×{}px）", width, height));
        scene_type = String::from("手机竖版图");
    } else if aspect_ratio < 0.78 {
        tags.push(String::from("纵向"));
        description_parts.push(format!("一张纵向图片（{}×{}px）", width, height));
    } else {
        tags.push(String::from("方形"));
        description_parts.push(format!("一张方形图片（{}×{}px）", width, height));
        scene_type = String::from("正方形图");
    }

    // ========== 画质标签 ==========
    let pixel_count = (width * height) as f64 / 1_000_000.0;
    if pixel_count > 12.0 {
        tags.push(String::from("超高清"));
        tags.push(String::from("大图"));
        if description_parts.len() > 1 {
            description_parts.insert(1, String::from("超高分辨率"));
        } else {
            description_parts.push(String::from("超高分辨率"));
        }
        scene_type = String::from("超高分辨率大图");
    } else if pixel_count > 6.0 {
        tags.push(String::from("高清"));
        tags.push(String::from("大图"));
        if description_parts.len() > 1 {
            description_parts.insert(1, String::from("高清分辨率"));
        }
        scene_type = String::from("高清大图");
    } else if pixel_count > 2.0 {
        tags.push(String::from("中等画质"));
        tags.push(String::from("标准尺寸"));
        scene_type = String::from("标准图");
    } else if pixel_count > 0.5 {
        tags.push(String::from("标清"));
        scene_type = String::from("普通图");
    } else {
        tags.push(String::from("低清"));
        tags.push(String::from("小图"));
        if !description_parts.is_empty() {
            description_parts.push(String::from("低分辨率"));
        }
        scene_type = String::from("缩略图");
    }

    // ========== 尺寸标签 ==========
    if width >= 4000 || height >= 4000 {
        tags.push(String::from("超大尺寸"));
    } else if width >= 2500 || height >= 2500 {
        tags.push(String::from("大尺寸"));
    } else if width < 500 && height < 500 {
        tags.push(String::from("小尺寸"));
    }

    // ========== 颜色分析 ==========
    if !colors.is_empty() {
        // 提取主要颜色
        let dominant_colors: Vec<String> = colors
            .iter()
            .take(3)
            .filter_map(|c| {
                c.get("hex")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            })
            .collect();

        if !dominant_colors.is_empty() {
            let color_desc = dominant_colors.join("、");
            description_parts.push(format!("主色调为 {}", color_desc));

            // 添加颜色类型标签
            if let Some(first_color) = colors.first() {
                if let Some(hex) = first_color.get("hex").and_then(|v| v.as_str()) {
                    if let Some(color_type) = detect_color_type(hex) {
                        tags.push(color_type);
                    }
                    // 检测是否色彩丰富
                    if colors.len() >= 3 {
                        tags.push(String::from("多彩"));
                    }
                }
            }
        }

        // 检测单色/渐变色
        if let Some(first_color) = colors.first() {
            if let Some(percentage) = first_color.get("percentage").and_then(|v| v.as_f64()) {
                if percentage > 0.7 {
                    tags.push(String::from("单色"));
                } else if percentage > 0.4 {
                    tags.push(String::from("主色调"));
                }
            }
        }
    }

    // ========== 构图标签 ==========
    if width > height * 3 {
        tags.push(String::from("横幅长图"));
    } else if height > width * 3 {
        tags.push(String::from("竖幅长图"));
    }

    // ========== 生成描述 ==========
    let description = if description_parts.is_empty() {
        format!("一张 {}×{} 像素的图片", width, height)
    } else if description_parts.len() == 1 {
        description_parts[0].clone()
    } else {
        format!("{}。{}", description_parts[0], description_parts[1..].join("，"))
    };

    (tags, description, scene_type)
}

/// 根据颜色判断图片类型
fn detect_color_type(hex: &str) -> Option<String> {
    let hex = hex.trim_start_matches('#');
    if hex.len() != 6 {
        return None;
    }

    let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
    let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
    let b = u8::from_str_radix(&hex[4..6], 16).ok()?;

    // 计算亮度（0.0-1.0）
    let brightness = (r as f64 * 0.299 + g as f64 * 0.587 + b as f64 * 0.114) / 255.0;

    // 判断饱和度
    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;

    // 低饱和度的颜色
    if delta < 30 {
        if brightness > 0.85 {
            return Some(String::from("洁白"));
        } else if brightness < 0.15 {
            return Some(String::from("纯黑"));
        } else if brightness > 0.7 {
            return Some(String::from("浅灰"));
        } else if brightness < 0.4 {
            return Some(String::from("深灰"));
        }
        return Some(String::from("灰调"));
    }

    // 高饱和度的颜色
    if brightness > 0.8 {
        // 明亮的高饱和度
        if r as f64 > g as f64 * 1.5 && r > b {
            return Some(String::from("亮红"));
        } else if g as f64 > r as f64 * 1.5 && g > b {
            return Some(String::from("亮绿"));
        } else if b as f64 > r as f64 * 1.5 && b > g {
            return Some(String::from("亮蓝"));
        }
        return Some(String::from("鲜艳"));
    } else if brightness < 0.3 {
        // 深色
        if r > g && r > b {
            return Some(String::from("深红"));
        } else if g > r && g > b {
            return Some(String::from("深绿"));
        } else if b > r && b > g {
            return Some(String::from("深蓝"));
        }
        return Some(String::from("暗调"));
    } else if brightness > 0.6 {
        // 中等亮度的浅色
        if r > g && r > b {
            if r as f64 / 255.0 > 0.8 && delta > 80 {
                return Some(String::from("粉红"));
            }
            return Some(String::from("浅红"));
        } else if g > r && g > b {
            return Some(String::from("浅绿"));
        } else if b > r && b > g {
            return Some(String::from("浅蓝"));
        }
        return Some(String::from("浅色"));
    } else {
        // 中等亮度的深色
        if r > g && r > b {
            return Some(String::from("暖红"));
        } else if b > r && b > g {
            return Some(String::from("冷蓝"));
        } else if g > r && g > b {
            return Some(String::from("自然绿"));
        }
    }

    // 判断色温
    if r > g && r > b {
        Some(String::from("暖色调"))
    } else if b > r && b > g {
        Some(String::from("冷色调"))
    } else if g > r && g > b {
        Some(String::from("自然色调"))
    } else {
        None
    }
}

/// 基础对象检测
fn detect_objects_basic(_img: &DynamicImage) -> String {
    // 这里可以集成 ONNX 模型进行真正的对象检测
    // 目前返回空 JSON 数组
    "[]".to_string()
}

/// 获取图片类型
fn get_image_type(img: &DynamicImage) -> String {
    match img {
        DynamicImage::ImageRgb8(_) => "RGB8",
        DynamicImage::ImageRgba8(_) => "RGBA8",
        DynamicImage::ImageLuma8(_) => "Luma8",
        DynamicImage::ImageLumaA8(_) => "LumaA8",
        _ => "Unknown",
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    fn generate_test_image(width: u32, height: u32) -> Vec<u8> {
        let img: RgbImage = ImageBuffer::from_fn(width, height, |x, y| {
            Rgb([(x * 255 / width) as u8, (y * 255 / height) as u8, 128])
        });

        let mut buffer = Vec::new();
        let encoder = image::codecs::png::PngEncoder::new(&mut buffer);
        encoder.encode(&img, width, height, image::ColorType::Rgb8).unwrap();
        buffer
    }

    #[test]
    fn test_analyze_image_basic() {
        let image_data = generate_test_image(100, 100);
        let result = analyze_image(image_data, None).unwrap();

        assert!(result.success);
        let tags: Vec<String> = serde_json::from_str(&result.tags_json).unwrap_or_default();
        assert!(!tags.is_empty());
        assert!(!result.description.is_empty());
        assert!(result.confidence > 0.0);
    }

    #[test]
    fn test_batch_analyze_images() {
        let images_data = vec![
            generate_test_image(100, 100),
            generate_test_image(200, 200),
        ];

        let results = batch_analyze_images(images_data, None).unwrap();
        assert_eq!(results.len(), 2);
        assert!(results[0].success);
        assert!(results[1].success);
    }
}
