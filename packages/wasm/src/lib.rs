//
// 1.3.0 wasm 版本需求
// AI 分析功能实现(目前只支持 Qwen 模型，后续再支持其他模型)
// 代码整理（分析->analyze、转换->convert、压缩->compress）归类到文件夹
//
//
// Pixuli WASM 图片处理库

#![deny(clippy::all)]

use napi_derive::napi;

// 导入模块
pub mod convert;
pub mod image;
pub mod compress;
pub mod analyze;

// 重新导出主要功能
pub use image::*;
pub use compress::*;

pub use convert::{
  batch_convert_image_format, convert_image_format, get_format_info, get_supported_formats,
  FormatConversionOptions, FormatConversionResult, ResizeOptions,
};

pub use analyze::{
  analyze_image, batch_analyze_images, check_model_availability,
  AIAnalysisOptions, AIAnalysisResult,
};

/// 简单的加法函数，用于测试WASM接口
#[napi]
pub fn plus_100(input: u32) -> u32 {
  input + 100
}

mod test {
  #[test]
  fn test_plus_100_function() {
    let result = crate::plus_100(50);
    assert_eq!(result, 150);
  }
}
