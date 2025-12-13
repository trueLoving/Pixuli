//! 格式转换相关的类型定义
//!
//! 包含所有格式转换功能中使用的结构体和类型

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

/// 格式转换选项
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatConversionOptions {
    /// 目标格式
    pub target_format: String,
    /// 压缩质量 (1-100)
    pub quality: Option<u8>,
    /// 是否保持透明度
    pub preserve_transparency: Option<bool>,
    /// 是否无损转换
    pub lossless: Option<bool>,
    /// 颜色空间
    pub color_space: Option<String>,
    /// 尺寸调整选项
    pub resize: Option<ResizeOptions>,
}

/// 尺寸调整选项
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResizeOptions {
    /// 目标宽度
    pub width: Option<u32>,
    /// 目标高度
    pub height: Option<u32>,
    /// 是否保持宽高比
    pub maintain_aspect_ratio: Option<bool>,
}

/// 格式转换结果
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatConversionResult {
    /// 转换后的数据
    pub data: Vec<u8>,
    /// 原始大小
    pub original_size: u32,
    /// 转换后大小
    pub converted_size: u32,
    /// 转换后宽度
    pub width: u32,
    /// 转换后高度
    pub height: u32,
    /// 原始宽度
    pub original_width: u32,
    /// 原始高度
    pub original_height: u32,
    /// 转换时间 (毫秒)
    pub conversion_time: f64,
}

/// 支持的图片格式
#[derive(Debug, Clone, PartialEq)]
pub enum SupportedFormat {
    Jpeg,
    Png,
    WebP,
    Gif,
    Bmp,
    Tiff,
}

impl SupportedFormat {
    /// 从字符串解析格式
    pub fn from_string(format_str: &str) -> Option<Self> {
        match format_str.to_lowercase().as_str() {
            "jpeg" | "jpg" => Some(SupportedFormat::Jpeg),
            "png" => Some(SupportedFormat::Png),
            "webp" => Some(SupportedFormat::WebP),
            "gif" => Some(SupportedFormat::Gif),
            "bmp" => Some(SupportedFormat::Bmp),
            "tiff" | "tif" => Some(SupportedFormat::Tiff),
            _ => None,
        }
    }

    /// 获取格式的MIME类型
    pub fn mime_type(&self) -> &'static str {
        match self {
            SupportedFormat::Jpeg => "image/jpeg",
            SupportedFormat::Png => "image/png",
            SupportedFormat::WebP => "image/webp",
            SupportedFormat::Gif => "image/gif",
            SupportedFormat::Bmp => "image/bmp",
            SupportedFormat::Tiff => "image/tiff",
        }
    }

    /// 获取格式的文件扩展名
    pub fn extension(&self) -> &'static str {
        match self {
            SupportedFormat::Jpeg => "jpg",
            SupportedFormat::Png => "png",
            SupportedFormat::WebP => "webp",
            SupportedFormat::Gif => "gif",
            SupportedFormat::Bmp => "bmp",
            SupportedFormat::Tiff => "tiff",
        }
    }
}

/// 转换统计信息
#[derive(Debug, Clone)]
pub struct ConversionStats {
    /// 原始文件大小
    pub original_size: u32,
    /// 转换后文件大小
    pub converted_size: u32,
    /// 压缩率
    pub compression_ratio: f64,
    /// 转换时间
    pub conversion_time: f64,
}

impl ConversionStats {
    /// 创建新的转换统计信息
    pub fn new(original_size: u32, converted_size: u32, conversion_time: f64) -> Self {
        let compression_ratio = converted_size as f64 / original_size as f64;
        Self {
            original_size,
            converted_size,
            compression_ratio,
            conversion_time,
        }
    }

    /// 获取压缩节省的字节数
    pub fn bytes_saved(&self) -> i32 {
        self.original_size as i32 - self.converted_size as i32
    }

    /// 获取压缩节省的百分比
    pub fn compression_percentage(&self) -> f64 {
        (1.0 - self.compression_ratio) * 100.0
    }
}
