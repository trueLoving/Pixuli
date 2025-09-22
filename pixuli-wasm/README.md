# Pixuli WASM

Pixuli 的 WebAssembly 核心库，提供高性能的图片处理功能。

## 功能特性

### 🖼️ 图片压缩
- **WebP 压缩**: 支持有损和无损压缩
- **批量处理**: 支持多张图片同时压缩
- **质量控制**: 可调节压缩质量 (1-100)
- **性能优化**: 使用 Rust 实现，性能卓越

### 🔄 图片格式转换
- **多格式支持**: JPEG、PNG、WebP、GIF、BMP、TIFF
- **智能转换**: 自动处理透明度和颜色空间
- **尺寸调整**: 支持图片尺寸调整和宽高比保持
- **批量转换**: 支持多张图片批量格式转换

### 🤖 AI 图片分析
- **内容识别**: 自动识别图片中的物体和场景
- **颜色分析**: 提取主要颜色和色彩分布
- **标签生成**: 自动生成描述性标签
- **多模型支持**: 支持 TensorFlow、TensorFlow Lite、ONNX 等模型

## 技术架构

### 核心技术栈
- **Rust**: 主要开发语言
- **NAPI-RS**: Node.js 原生模块绑定
- **image-rs**: 图片处理核心库
- **webp**: WebP 格式支持
- **serde**: 序列化支持

### 构建系统
- **Cargo**: Rust 包管理器
- **NAPI**: 跨平台 Node.js 原生模块构建
- **Cross-compilation**: 支持多平台编译

## 安装使用

### 开发环境要求
- Rust 1.70+
- Node.js 16+
- 平台相关构建工具

### 构建命令
```bash
# 开发构建
npm run build:debug

# 生产构建
npm run build

# 查看构建产物
npm run artifacts
```

### API 使用示例

#### WebP 压缩
```typescript
import { compressToWebp } from 'pixuli-wasm'

const result = await compressToWebp(imageData, {
  quality: 80,
  lossless: false
})
```

#### 格式转换
```typescript
import { convertImageFormat } from 'pixuli-wasm'

const result = await convertImageFormat(imageData, {
  targetFormat: 'jpeg',
  quality: 85,
  preserveTransparency: false
})
```

#### AI 分析
```typescript
import { analyzeImageWithAi } from 'pixuli-wasm'

const result = await analyzeImageWithAi(imageData, {
  modelType: 0, // TensorFlow
  confidenceThreshold: 0.5
})
```

## API 参考

### 压缩相关
- `compressToWebp(imageData: number[], options?: WebPCompressOptions): WebPCompressResult`
- `batchCompressToWebp(imagesData: number[][], options?: WebPCompressOptions): WebPCompressResult[]`

### 格式转换
- `convertImageFormat(imageData: number[], options: FormatConversionOptions): FormatConversionResult`
- `batchConvertImageFormat(imagesData: number[][], options: FormatConversionOptions): FormatConversionResult[]`

### AI 分析
- `analyzeImageWithAi(imageData: number[], config: AiAnalysisConfig): ImageAnalysisResult`
- `analyzeImageWithTensorflow(imageData: number[], modelPath: string): ImageAnalysisResult`
- `analyzeImageWithTensorflowLite(imageData: number[], modelPath: string): ImageAnalysisResult`

### 工具函数
- `getImageInfo(imageData: number[]): string`
- `plus100(input: number): number` (测试函数)

## 类型定义

### WebP 压缩
```typescript
interface WebPCompressOptions {
  quality?: number      // 压缩质量 (0-100)
  lossless?: boolean    // 是否无损压缩
}

interface WebPCompressResult {
  data: number[]        // 压缩后的数据
  originalSize: number  // 原始大小
  compressedSize: number // 压缩后大小
  compressionRatio: number // 压缩率 (0-1)
  width: number         // 宽度
  height: number        // 高度
}
```

### 格式转换
```typescript
interface FormatConversionOptions {
  targetFormat: string           // 目标格式
  quality?: number              // 质量 (1-100)
  preserveTransparency?: boolean // 保持透明度
  lossless?: boolean            // 无损转换
  colorSpace?: string           // 颜色空间
  resize?: ResizeOptions        // 尺寸调整
}

interface FormatConversionResult {
  data: number[]         // 转换后的数据
  originalSize: number   // 原始大小
  convertedSize: number  // 转换后大小
  width: number          // 宽度
  height: number         // 高度
  originalWidth: number  // 原始宽度
  originalHeight: number // 原始高度
  conversionTime: number // 转换时间 (ms)
}
```

### AI 分析
```typescript
interface AiAnalysisConfig {
  modelType: AIModelType        // 模型类型
  modelPath?: string           // 模型路径
  apiEndpoint?: string         // API 端点
  apiKey?: string             // API 密钥
  useGpu?: boolean            // 是否使用 GPU
  confidenceThreshold?: number // 置信度阈值
}

interface ImageAnalysisResult {
  imageType: string           // 图片类型
  tags: string[]             // 标签列表
  description: string         // 图片描述
  confidence: number          // 置信度
  objects: DetectedObject[]   // 检测到的物体
  colors: ColorInfo[]         // 主要颜色
  sceneType: string          // 场景类型
  analysisTime: number       // 分析时间
  modelUsed: string          // 使用的模型
}
```

## 性能特点

### 压缩性能
- **WebP 压缩**: 比 JPEG 小 25-35%，比 PNG 小 25-50%
- **处理速度**: 单张 2MB 图片压缩 < 100ms
- **内存效率**: 流式处理，内存占用低

### 格式转换性能
- **多格式支持**: 6 种主流格式无缝转换
- **智能优化**: 根据目标格式自动优化参数
- **批量处理**: 支持并发处理多张图片

### AI 分析性能
- **模型支持**: 支持多种 AI 模型格式
- **推理速度**: 本地推理，响应迅速
- **准确率**: 基于成熟模型，识别准确

## 开发指南

### 添加新功能
1. 在 `src/` 目录下创建新的 Rust 模块
2. 使用 `#[napi]` 宏导出函数
3. 在 `lib.rs` 中导入并重新导出
4. 更新类型定义文件
5. 运行 `npm run build` 重新构建

### 调试技巧
- 使用 `console.log` 在 Rust 中输出调试信息
- 检查 `index.d.ts` 确保类型定义正确
- 使用 `npm run build:debug` 进行调试构建

### 常见问题
1. **构建失败**: 检查 Rust 版本和依赖
2. **类型错误**: 确保 NAPI 类型定义正确
3. **性能问题**: 使用 release 构建优化性能

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**Pixuli WASM** - 让图片处理更简单、更快速、更智能 🚀
