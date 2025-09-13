//! Pixuli WASM 图片处理库
//! 
//! 提供图片压缩、AI分析等功能的WebAssembly接口

#![deny(clippy::all)]

use napi_derive::napi;

// 导入模块
pub mod webp;
pub mod image;
pub mod ai;

// 重新导出主要功能
pub use webp::*;
pub use image::*;
pub use ai::*;

/// 简单的加法函数，用于测试WASM接口
#[napi]
pub fn plus_100(input: u32) -> u32 {
  input + 100
}
