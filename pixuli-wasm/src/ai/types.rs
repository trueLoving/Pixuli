//! AI 分析相关的类型定义

use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// AI 模型类型
#[napi]
#[derive(Clone, Serialize, Deserialize)]
pub enum AIModelType {
  TensorFlow,
  TensorFlowLite,
  ONNX,
  LocalLLM,
  RemoteAPI,
}

/// AI 分析配置
#[napi(object)]
#[derive(Clone, Serialize, Deserialize)]
pub struct AIAnalysisConfig {
  /// 模型类型
  pub model_type: AIModelType,
  /// 模型路径（本地模型）
  pub model_path: Option<String>,
  /// API 端点（远程模型）
  pub api_endpoint: Option<String>,
  /// API 密钥
  pub api_key: Option<String>,
  /// 是否使用 GPU
  pub use_gpu: Option<bool>,
  /// 置信度阈值
  pub confidence_threshold: Option<f64>,
}

/// 图片分析结果
#[napi(object)]
#[derive(Clone, Serialize, Deserialize)]
pub struct ImageAnalysisResult {
  /// 图片类型/格式
  pub image_type: String,
  /// 标签列表
  pub tags: Vec<String>,
  /// 图片描述
  pub description: String,
  /// 置信度 (0-1)
  pub confidence: f64,
  /// 检测到的物体
  pub objects: Vec<DetectedObject>,
  /// 主要颜色
  pub colors: Vec<ColorInfo>,
  /// 场景类型
  pub scene_type: String,
  /// 分析时间（毫秒）
  pub analysis_time: f64,
  /// 使用的模型
  pub model_used: String,
}

/// 检测到的物体
#[napi(object)]
#[derive(Clone, Serialize, Deserialize)]
pub struct DetectedObject {
  /// 物体名称
  pub name: String,
  /// 置信度 (0-1)
  pub confidence: f64,
  /// 边界框
  pub bbox: BoundingBox,
  /// 类别
  pub category: String,
}

/// 边界框
#[napi(object)]
#[derive(Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  /// X坐标
  pub x: f64,
  /// Y坐标
  pub y: f64,
  /// 宽度
  pub width: f64,
  /// 高度
  pub height: f64,
}

/// 颜色信息
#[napi(object)]
#[derive(Clone, Serialize, Deserialize)]
pub struct ColorInfo {
  /// 颜色名称
  pub name: String,
  /// RGB值
  pub rgb: (u8, u8, u8),
  /// 占比
  pub percentage: f64,
  /// 十六进制值
  pub hex: String,
}
