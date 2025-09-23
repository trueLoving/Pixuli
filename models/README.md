# Pixuli 本地化 AI 模型支持

本文档详细介绍了 Pixuli 项目支持的本地化 AI 模型类型、配置和使用方法。

## 支持的模型类型

Pixuli 支持以下 5 种 AI 模型类型：

### 1. TensorFlow 模型 (`tensorflow`)
- **类型标识**: `tensorflow`
- **文件格式**: `.onnx` 文件
- **用途**: 图像分类和目标检测
- **特点**: 功能强大，支持复杂模型
- **推荐场景**: 需要高精度分析的场景

### 2. TensorFlow Lite 模型 (`tensorflow-lite`)
- **类型标识**: `tensorflow-lite`
- **文件格式**: `.tflite` 文件
- **用途**: 轻量级图像分类
- **特点**: 体积小，运行速度快，适合移动端
- **推荐场景**: 快速分析和资源受限环境

### 3. ONNX 模型 (`onnx`)
- **类型标识**: `onnx`
- **文件格式**: `.onnx` 文件
- **用途**: 跨平台模型推理
- **特点**: 跨框架兼容性好，性能优化
- **推荐场景**: 需要跨平台部署的场景

### 4. 本地大语言模型 (`local-llm`)
- **类型标识**: `local-llm`
- **用途**: 本地运行的大语言模型
- **特点**: 完全本地化，无需网络连接
- **推荐场景**: 隐私敏感或离线环境

### 5. 远程 API 模型 (`remote-api`)
- **类型标识**: `remote-api`
- **用途**: 调用远程 AI 服务
- **特点**: 无需本地存储，功能强大
- **推荐场景**: 需要最新 AI 能力或本地资源不足

## 内置模型

### 通用分析模型

系统内置了一个通用的图片分析模型：

1. **通用图片分析模型**
   - 类型: TensorFlow
   - 用途: 通用图片分析
   - 基于图像特征分析
   - 无需额外文件
   - 状态: 内置，自动加载

### 手动导入模型

系统已移除自动下载功能，用户需要手动导入模型文件：

1. **通过界面导入**：
   - 打开 AI 模型管理界面
   - 点击"添加模型"按钮
   - 选择模型类型和文件路径
   - 配置模型参数

2. **支持的文件格式**：
   - TensorFlow Lite: `.tflite`
   - TensorFlow: `.pb`, `.json`, `.bin`
   - ONNX: `.onnx`
   - 其他格式: 根据模型类型选择

3. **推荐的外部模型**：
   - **YOLOv8**: 目标检测模型
   - **COCO SSD**: 目标检测模型
   - **MobileNet**: 图像分类模型
   - **CLIP**: 图像理解模型
   - **自定义模型**: 用户训练的模型

4. **模型文件位置**：
   - 项目 `models/` 目录中的文件需要手动添加到系统中
   - 用户可以通过"添加模型"功能选择这些文件

## 模型配置接口

### AIModelConfig 接口

```typescript
interface AIModelConfig {
  id: string                    // 模型唯一标识
  name: string                  // 模型显示名称
  type: 'tensorflow' | 'tensorflow-lite' | 'onnx' | 'local-llm' | 'remote-api'
  path?: string                 // 本地模型文件路径
  apiEndpoint?: string          // 远程 API 端点
  apiKey?: string              // API 密钥
  enabled: boolean             // 是否启用
  description?: string         // 模型描述
  version?: string             // 模型版本
  size?: number               // 模型大小（字节）
}
```

### AIAnalysisConfig 接口

```typescript
interface AIAnalysisConfig {
  model_type: AIModelType      // 模型类型枚举
  model_path?: string          // 模型路径
  api_endpoint?: string        // API 端点
  api_key?: string            // API 密钥
  use_gpu?: boolean           // 是否使用 GPU
  confidence_threshold?: number // 置信度阈值
}
```

## 分析结果结构

### ImageAnalysisResult 接口

```typescript
interface ImageAnalysisResult {
  image_type: string           // 图片类型/格式
  tags: string[]              // 标签列表
  description: string         // 图片描述
  confidence: number          // 置信度 (0-1)
  objects: DetectedObject[]   // 检测到的物体
  colors: ColorInfo[]         // 主要颜色
  scene_type: string          // 场景类型
  analysis_time: number       // 分析时间（毫秒）
  model_used: string          // 使用的模型
}
```

### DetectedObject 接口

```typescript
interface DetectedObject {
  name: string                // 物体名称
  confidence: number          // 置信度 (0-1)
  bbox: BoundingBox          // 边界框
  category: string           // 类别
}
```

## 使用方法

### 1. 模型管理

通过 `AIModelManager` 组件可以：
- 查看已安装的模型
- 下载新的模型
- 启用/禁用模型
- 配置模型参数

### 2. 图片分析

通过 `AIAnalysisModal` 组件可以：
- 选择分析模型
- 上传图片进行分析
- 查看分析结果
- 导出分析数据

### 3. 编程接口

```typescript
// 分析单张图片
const result = await analyzeImageWithAi(imageData, config)

// 批量分析图片
const results = await batchAnalyzeImagesWithAi(imagesData, config)

// 检查模型可用性
const available = await checkModelAvailability(modelPath)

// 获取支持的模型列表
const models = await getSupportedModels()
```

## 模型存储位置

- **用户数据目录**: `~/Library/Application Support/Pixuli/models/` (macOS)
- **项目模型目录**: `./models/`
- **模型文件命名**: `{modelId}/{filename}`

## 性能优化建议

1. **TensorFlow Lite 模型**: 适合快速分析和资源受限环境
2. **ONNX 模型**: 适合需要跨平台兼容的场景
3. **远程 API**: 适合需要最新 AI 能力或本地资源不足的情况
4. **本地 LLM**: 适合隐私敏感或完全离线的场景

## 扩展支持

项目采用模块化设计，可以轻松添加新的模型类型：

1. 在 `AIModelType` 枚举中添加新类型
2. 在 `modelDownloadService.ts` 中添加模型配置
3. 在 Rust 代码中实现对应的分析逻辑
4. 更新前端组件以支持新模型类型

## 注意事项

1. 首次使用需要下载模型文件，请确保网络连接正常
2. 大型模型可能需要较长的下载时间
3. 某些模型需要特定的硬件支持（如 GPU）
4. 远程 API 模型需要有效的 API 密钥
5. 模型文件会占用本地存储空间，请定期清理不需要的模型

## 故障排除

### 常见问题

1. **模型下载失败**
   - 检查网络连接
   - 确认下载源可访问
   - 查看控制台错误信息

2. **分析结果不准确**
   - 尝试不同的模型
   - 调整置信度阈值
   - 检查图片质量和格式

3. **性能问题**
   - 使用轻量级模型
   - 启用 GPU 加速（如果支持）
   - 减少图片分辨率

### 日志和调试

- 查看 Electron 主进程日志
- 检查 Rust 模块输出
- 使用浏览器开发者工具查看前端错误

---

*最后更新: 2024年12月*
