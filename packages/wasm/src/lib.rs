//! Pixuli WASM 图片处理库
//!

#![deny(clippy::all)]

use napi_derive::napi;

// 导入模块
pub mod format_conversion;
pub mod image;
pub mod webp;

// 重新导出主要功能
pub use image::*;
pub use webp::*;

pub use format_conversion::{
  batch_convert_image_format, convert_image_format, get_format_info, get_supported_formats,
  FormatConversionOptions, FormatConversionResult, ResizeOptions,
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
