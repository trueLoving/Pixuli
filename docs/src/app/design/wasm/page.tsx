import PageLayout from '../../../components/PageLayout';

export default function WasmDesignPage() {
  return (
    <PageLayout
      title="WASM 模块设计方案"
      subtitle="详细的设计文档，涵盖 WASM 模块的设计目的、架构、功能和应用场景"
      icon="fas fa-cube"
    >
      <div className="content-card">
        <h1>⚡ WASM 模块设计方案</h1>

        <p>
          本文档详细描述了 Pixuli 项目中
          WASM（WebAssembly）模块的设计方案，包括设计目的、负责内容、架构设计、应用场景和注意事项。
        </p>

        <hr />

        <h2>🎯 设计目的</h2>

        <h3>核心目标</h3>
        <ul>
          <li>
            <strong>高性能</strong>：使用 Rust
            实现图片处理功能，提供接近原生的性能
          </li>
          <li>
            <strong>跨平台</strong>：通过 NAPI-RS 编译为多平台原生模块，支持
            Windows、macOS、Linux
          </li>
          <li>
            <strong>内存安全</strong>：利用 Rust
            的内存安全特性，避免内存泄漏和缓冲区溢出
          </li>
          <li>
            <strong>类型安全</strong>：通过 TypeScript 类型定义确保接口类型安全
          </li>
          <li>
            <strong>可扩展性</strong>：模块化设计，易于添加新功能
          </li>
        </ul>

        <h3>解决的问题</h3>
        <ul>
          <li>
            <strong>性能瓶颈</strong>：JavaScript 处理大量图片时性能不足
          </li>
          <li>
            <strong>内存管理</strong>：需要精确控制内存使用，避免内存泄漏
          </li>
          <li>
            <strong>并发处理</strong>：支持批量图片处理，提高处理效率
          </li>
          <li>
            <strong>格式支持</strong>：支持多种图片格式的转换和处理
          </li>
        </ul>

        <hr />

        <h2>📦 负责内容</h2>

        <h3>核心功能模块</h3>

        <h4>1. 图片压缩模块 (compress)</h4>
        <ul>
          <li>
            <strong>WebP 压缩</strong>：支持有损和无损 WebP 格式压缩
          </li>
          <li>
            <strong>质量控制</strong>：可调节压缩质量（0-100）
          </li>
          <li>
            <strong>批量压缩</strong>：支持多张图片批量压缩处理
          </li>
          <li>
            <strong>压缩统计</strong>：返回详细的压缩统计信息（压缩率、大小等）
          </li>
        </ul>

        <h4>2. 图片格式转换模块 (convert)</h4>
        <ul>
          <li>
            <strong>多格式支持</strong>：支持 JPEG、PNG、WebP、GIF、BMP、TIFF
            格式转换
          </li>
          <li>
            <strong>智能转换</strong>：自动处理透明度和颜色空间
          </li>
          <li>
            <strong>尺寸调整</strong>：支持图片尺寸调整和宽高比保持
          </li>
          <li>
            <strong>批量转换</strong>：支持多张图片批量格式转换
          </li>
          <li>
            <strong>转换选项</strong>：支持质量、透明度、无损等选项配置
          </li>
        </ul>

        <h4>3. AI 图片分析模块 (analyze)</h4>
        <ul>
          <li>
            <strong>对象检测</strong>：检测图片中的对象和位置
          </li>
          <li>
            <strong>场景识别</strong>：识别图片场景类型
          </li>
          <li>
            <strong>颜色分析</strong>：分析图片主要颜色
          </li>
          <li>
            <strong>标签生成</strong>：自动生成图片标签
          </li>
          <li>
            <strong>描述生成</strong>：生成图片描述文本
          </li>
          <li>
            <strong>模型支持</strong>：支持 ONNX Runtime 模型（Qwen 等）
          </li>
        </ul>

        <h4>4. 图片信息模块 (image)</h4>
        <ul>
          <li>
            <strong>信息获取</strong>：获取图片尺寸、格式、通道数等信息
          </li>
          <li>
            <strong>格式检测</strong>：检测图片文件格式
          </li>
          <li>
            <strong>颜色分析</strong>：分析图片主要颜色
          </li>
        </ul>

        <h3>技术特性</h3>
        <ul>
          <li>
            <strong>异步支持</strong>：所有函数都支持异步调用
          </li>
          <li>
            <strong>错误处理</strong>：完善的错误处理和错误信息返回
          </li>
          <li>
            <strong>类型安全</strong>：完整的 TypeScript 类型定义
          </li>
          <li>
            <strong>测试覆盖</strong>：完整的单元测试和集成测试
          </li>
        </ul>

        <hr />

        <h2>🏗️ 架构设计</h2>

        <h3>模块架构</h3>
        <p>WASM 模块采用模块化设计，每个功能模块独立实现：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`┌─────────────────────────────────────────┐
│         WASM 模块 (pixuli-wasm)          │
│  ┌─────────────────────────────────────┐  │
│  │   lib.rs (主入口)                     │  │
│  │   - 模块导出                          │  │
│  │   - 公共接口                          │  │
│  └─────────────────────────────────────┘  │
│              ↓                             │
│  ┌─────────────────────────────────────┐  │
│  │   compress/ (压缩模块)              │  │
│  │   - compress_to_webp()             │  │
│  │   - batch_compress_to_webp()        │  │
│  │   - WebPCompressOptions            │  │
│  │   - WebPCompressResult              │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │   convert/ (转换模块)                │  │
│  │   - convert_image_format()         │  │
│  │   - batch_convert_image_format()    │  │
│  │   - FormatConversionOptions        │  │
│  │   - FormatConversionResult         │  │
│  │   - converters.rs (格式转换器)      │  │
│  │   - resize.rs (尺寸调整)            │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │   analyze/ (AI分析模块)             │  │
│  │   - analyze_image()                │  │
│  │   - batch_analyze_images()         │  │
│  │   - check_model_availability()     │  │
│  │   - AIAnalysisOptions               │  │
│  │   - AIAnalysisResult                │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │   image.rs (基础功能)                │  │
│  │   - get_image_info()               │  │
│  │   - detect_image_format()          │  │
│  │   - analyze_dominant_colors()       │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      NAPI-RS 绑定层                      │
│  ┌─────────────────────────────────────┐  │
│  │   #[napi] 宏                        │  │
│  │   - 自动生成 Node.js 绑定           │  │
│  │   - 类型转换                        │  │
│  │   - 错误处理                        │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Node.js 原生模块                     │
│  ┌─────────────────────────────────────┐  │
│  │   pixuli-wasm.node                  │  │
│  │   - Windows: .node                   │  │
│  │   - macOS: .node                    │  │
│  │   - Linux: .node                    │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘`}
          </pre>
        </div>

        <h3>技术栈</h3>
        <ul>
          <li>
            <strong>Rust</strong>：主要开发语言，提供高性能和内存安全
          </li>
          <li>
            <strong>NAPI-RS</strong>：Node.js 原生模块绑定框架
          </li>
          <li>
            <strong>image-rs</strong>：Rust 图片处理核心库
          </li>
          <li>
            <strong>webp</strong>：WebP 格式支持库
          </li>
          <li>
            <strong>serde</strong>：序列化支持
          </li>
          <li>
            <strong>ort</strong>：ONNX Runtime 绑定，用于 AI 分析
          </li>
          <li>
            <strong>ndarray</strong>：多维数组处理，用于 AI 计算
          </li>
        </ul>

        <h3>构建系统</h3>
        <ul>
          <li>
            <strong>Cargo</strong>：Rust 包管理器，管理依赖和构建
          </li>
          <li>
            <strong>NAPI</strong>：跨平台 Node.js 原生模块构建工具
          </li>
          <li>
            <strong>Cross-compilation</strong>：支持多平台交叉编译
          </li>
          <li>
            <strong>LTO</strong>：链接时优化，减小二进制大小
          </li>
        </ul>

        <h3>项目结构</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`packages/wasm/
├── src/
│   ├── lib.rs              # 主入口，模块导出
│   ├── image.rs            # 图片基础功能
│   ├── compress/
│   │   └── mod.rs          # WebP 压缩实现
│   ├── convert/
│   │   ├── mod.rs          # 格式转换主逻辑
│   │   ├── types.rs        # 类型定义
│   │   ├── converters.rs   # 格式转换器实现
│   │   └── resize.rs       # 尺寸调整逻辑
│   └── analyze/
│       └── mod.rs          # AI 分析实现
├── Cargo.toml              # Rust 依赖配置
├── build.rs                 # 构建脚本
├── index.js                 # Node.js 入口文件
├── index.d.ts               # TypeScript 类型定义
├── wasi-worker-browser.mjs  # Web Worker 支持
└── package.json             # NPM 包配置`}
          </pre>
        </div>

        <hr />

        <h2>💻 实现细节</h2>

        <h3>1. 压缩模块实现</h3>
        <h4>WebP 压缩流程</h4>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// src/compress/mod.rs
#[napi]
pub fn compress_to_webp(
  image_data: Vec<u8>,
  options: Option<WebPCompressOptions>,
) -> Result<WebPCompressResult, NapiError> {
  // 1. 解析图片
  let img = image::load_from_memory(&image_data)?;

  // 2. 转换为 RGB 格式
  let rgb_img = img.to_rgb8();

  // 3. 创建 WebP 编码器
  let encoder = if lossless {
    Encoder::new(&rgb_img, PixelLayout::Rgb, width, height)
      .encode_lossless()
  } else {
    Encoder::new(&rgb_img, PixelLayout::Rgb, width, height)
      .encode(quality)
  };

  // 4. 编码为 WebP
  let webp_data = encoder.to_vec();

  // 5. 返回结果
  Ok(WebPCompressResult {
    data: webp_data,
    original_size: image_data.len() as u32,
    compressed_size: webp_data.len() as u32,
    compression_ratio: compressed_size as f64 / original_size as f64,
    width,
    height,
  })
}`}
          </pre>
        </div>

        <h3>2. 格式转换模块实现</h3>
        <h4>格式转换流程</h4>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// src/convert/mod.rs
#[napi]
pub fn convert_image_format(
  image_data: Vec<u8>,
  options: FormatConversionOptions,
) -> Result<FormatConversionResult, NapiError> {
  // 1. 解析图片
  let img = image::load_from_memory(&image_data)?;

  // 2. 处理尺寸调整
  let resized_img = if let Some(resize) = &options.resize {
    img.resize(new_width, new_height, FilterType::Lanczos3)
  } else {
    img
  };

  // 3. 获取格式转换器
  let converter = get_converter(&target_format);

  // 4. 执行转换
  let converted_data = converter.convert(&resized_img, &conversion_options)?;

  // 5. 返回结果
  Ok(FormatConversionResult {
    data: converted_data,
    original_size: image_data.len() as u32,
    converted_size: converted_data.len() as u32,
    width: final_width,
    height: final_height,
    conversion_time: elapsed.as_millis() as f64,
  })
}`}
          </pre>
        </div>

        <h3>3. AI 分析模块实现</h3>
        <h4>AI 分析流程</h4>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// src/analyze/mod.rs
#[napi]
pub fn analyze_image(
  image_data: Vec<u8>,
  options: Option<AIAnalysisOptions>,
) -> Result<AIAnalysisResult, NapiError> {
  // 1. 加载图片
  let img = image::load_from_memory(&image_data)?;

  // 2. 执行基础分析
  let (tags, description, confidence, objects_json, colors_json, scene_type) =
    perform_basic_analysis(&img, &opts);

  // 3. 如果启用 AI 模型，执行深度分析
  if let Some(model_path) = &opts.model_path {
    // 使用 ONNX Runtime 进行 AI 分析
    // ...
  }

  // 4. 返回结果
  Ok(AIAnalysisResult {
    success: true,
    tags_json: serde_json::to_string(&tags)?,
    description,
    confidence,
    objects_json,
    colors_json,
    scene_type,
    analysis_time: elapsed.as_millis() as f64,
    // ...
  })
}`}
          </pre>
        </div>

        <h3>4. NAPI 绑定</h3>
        <p>使用 NAPI-RS 的 #[napi] 宏自动生成 Node.js 绑定：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// 使用 #[napi] 宏自动生成绑定
#[napi]
pub fn compress_to_webp(
  image_data: Vec<u8>,
  options: Option<WebPCompressOptions>,
) -> Result<WebPCompressResult, NapiError> {
  // 实现逻辑
}

// 自动生成：
// - JavaScript 函数签名
// - TypeScript 类型定义
// - 类型转换代码
// - 错误处理代码`}
          </pre>
        </div>

        <hr />

        <h2>🚀 应用场景</h2>

        <h3>1. 图片压缩场景</h3>
        <ul>
          <li>
            <strong>上传前压缩</strong>
            ：在上传到云端前压缩图片，减少上传时间和存储空间
          </li>
          <li>
            <strong>批量压缩</strong>：批量处理大量图片，提高处理效率
          </li>
          <li>
            <strong>质量优化</strong>
            ：根据需求调整压缩质量，平衡文件大小和图片质量
          </li>
        </ul>

        <h3>2. 格式转换场景</h3>
        <ul>
          <li>
            <strong>格式统一</strong>：将不同格式的图片转换为统一格式
          </li>
          <li>
            <strong>兼容性处理</strong>：转换为更兼容的格式（如 WebP 转 JPEG）
          </li>
          <li>
            <strong>尺寸调整</strong>：在转换时同时调整图片尺寸
          </li>
        </ul>

        <h3>3. AI 分析场景</h3>
        <ul>
          <li>
            <strong>自动标签</strong>：自动为图片生成标签，便于分类和搜索
          </li>
          <li>
            <strong>内容识别</strong>：识别图片中的对象和场景
          </li>
          <li>
            <strong>智能描述</strong>：生成图片描述，提升用户体验
          </li>
        </ul>

        <h3>4. 性能优化场景</h3>
        <ul>
          <li>
            <strong>批量处理</strong>：使用批量 API 减少 IPC 调用次数
          </li>
          <li>
            <strong>并发处理</strong>：在 Node 主进程中并发处理多张图片
          </li>
          <li>
            <strong>内存优化</strong>：流式处理，避免一次性加载大量图片到内存
          </li>
        </ul>

        <hr />

        <h2>⚙️ 性能特点</h2>

        <h3>压缩性能</h3>
        <ul>
          <li>
            <strong>压缩率</strong>：WebP 比 JPEG 小 25-35%，比 PNG 小 25-50%
          </li>
          <li>
            <strong>处理速度</strong>：单张 2MB 图片压缩时间小于 100ms
          </li>
          <li>
            <strong>内存占用</strong>：流式处理，内存占用低
          </li>
          <li>
            <strong>批量处理</strong>：支持并发处理，提高吞吐量
          </li>
        </ul>

        <h3>格式转换性能</h3>
        <ul>
          <li>
            <strong>格式支持</strong>：支持 6 种主流格式无缝转换
          </li>
          <li>
            <strong>智能优化</strong>：根据目标格式自动优化参数
          </li>
          <li>
            <strong>并发处理</strong>：支持并发处理多张图片
          </li>
        </ul>

        <h3>AI 分析性能</h3>
        <ul>
          <li>
            <strong>模型支持</strong>：支持 ONNX Runtime 模型
          </li>
          <li>
            <strong>GPU 加速</strong>：支持 GPU 加速（如果可用）
          </li>
          <li>
            <strong>批量分析</strong>：支持批量图片分析
          </li>
        </ul>

        <hr />

        <h2>⚠️ 注意事项</h2>

        <h3>1. 内存管理</h3>
        <ul>
          <li>
            <strong>大文件处理</strong>：对于超大文件，考虑分块处理或流式处理
          </li>
          <li>
            <strong>内存限制</strong>
            ：注意内存使用，避免处理过多大文件导致内存溢出
          </li>
          <li>
            <strong>及时释放</strong>：处理完成后及时释放内存
          </li>
        </ul>

        <h3>2. 错误处理</h3>
        <ul>
          <li>
            <strong>输入验证</strong>：验证输入数据格式和大小
          </li>
          <li>
            <strong>错误捕获</strong>：所有函数都应包含错误处理
          </li>
          <li>
            <strong>错误信息</strong>：提供清晰的错误信息，便于调试
          </li>
        </ul>

        <h3>3. 数据转换</h3>
        <ul>
          <li>
            <strong>类型转换</strong>：注意 Rust 类型和 JavaScript
            类型之间的转换
          </li>
          <li>
            <strong>数据拷贝</strong>：大文件传递时注意数据拷贝开销
          </li>
          <li>
            <strong>序列化</strong>：复杂数据结构需要序列化/反序列化
          </li>
        </ul>

        <h3>4. 平台兼容性</h3>
        <ul>
          <li>
            <strong>多平台构建</strong>：需要为每个平台单独构建
          </li>
          <li>
            <strong>依赖管理</strong>：注意平台特定的依赖（如 ONNX Runtime 库）
          </li>
          <li>
            <strong>测试</strong>：在不同平台上测试功能
          </li>
        </ul>

        <h3>5. 性能优化</h3>
        <ul>
          <li>
            <strong>编译优化</strong>：使用 release 模式编译，启用 LTO
          </li>
          <li>
            <strong>算法优化</strong>：选择高效的图片处理算法
          </li>
          <li>
            <strong>并发处理</strong>：合理使用并发，避免过度并发导致资源竞争
          </li>
        </ul>

        <h3>6. 安全性</h3>
        <ul>
          <li>
            <strong>输入验证</strong>：验证所有输入数据，防止恶意数据
          </li>
          <li>
            <strong>边界检查</strong>：检查数组边界，防止缓冲区溢出
          </li>
          <li>
            <strong>资源限制</strong>：限制处理文件大小和数量
          </li>
        </ul>

        <h3>7. 测试</h3>
        <ul>
          <li>
            <strong>单元测试</strong>：为每个函数编写单元测试
          </li>
          <li>
            <strong>集成测试</strong>：测试与 Node.js 的集成
          </li>
          <li>
            <strong>性能测试</strong>：建立性能基准测试
          </li>
          <li>
            <strong>边界测试</strong>：测试边界情况和异常情况
          </li>
        </ul>

        <hr />

        <h2>📋 使用示例</h2>

        <h3>1. 图片压缩示例</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// Web 层调用
import { ImageCompressionService } from '@/services/imageCompressService';

// 压缩单张图片
const result = await ImageCompressionService.compressImage(file, {
  quality: 80,
  lossless: false,
});

console.log('压缩率:', result.compressionRatio);
console.log('原始大小:', result.originalSize);
console.log('压缩后大小:', result.compressedSize);

// 批量压缩
const results = await ImageCompressionService.batchCompressImages(files, {
  quality: 80,
});`}
          </pre>
        </div>

        <h3>2. 格式转换示例</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// Web 层调用
import { ImageConvertService } from '@/services/imageConvertService';

// 转换格式
const result = await ImageConvertService.convertImage(file, {
  targetFormat: 'webp',
  quality: 90,
  preserveTransparency: true,
  resize: {
    width: 1920,
    height: 1080,
    maintainAspectRatio: true,
  },
});

// 批量转换
const results = await ImageConvertService.batchConvertImages(files, {
  targetFormat: 'jpeg',
  quality: 85,
});`}
          </pre>
        </div>

        <h3>3. AI 分析示例</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// Web 层调用
const result = await window.wasmAPI.analyzeImage(imageData, {
  modelPath: '/path/to/model.onnx',
  confidenceThreshold: 0.7,
  maxTags: 10,
  analyzeColors: true,
  detectObjects: true,
});

// 解析结果
const tags = JSON.parse(result.tagsJson);
const objects = JSON.parse(result.objectsJson);
const colors = JSON.parse(result.colorsJson);

console.log('标签:', tags);
console.log('描述:', result.description);
console.log('场景:', result.sceneType);`}
          </pre>
        </div>

        <hr />

        <h2>🔧 构建和部署</h2>

        <h3>开发环境要求</h3>
        <ul>
          <li>
            <strong>Rust</strong>：1.70+ 版本
          </li>
          <li>
            <strong>Node.js</strong>：16+ 版本
          </li>
          <li>
            <strong>平台工具</strong>：Windows (Visual Studio)、macOS
            (Xcode)、Linux (build-essential)
          </li>
        </ul>

        <h3>构建命令</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`# 开发构建（调试模式）
pnpm run build:debug

# 生产构建（优化模式）
pnpm run build

# 查看构建产物
pnpm run artifacts

# 运行测试
cargo test`}
          </pre>
        </div>

        <h3>构建优化</h3>
        <ul>
          <li>
            <strong>LTO</strong>：启用链接时优化，减小二进制大小
          </li>
          <li>
            <strong>Strip Symbols</strong>：移除调试符号，减小文件大小
          </li>
          <li>
            <strong>Release Mode</strong>：使用 release 模式编译，启用所有优化
          </li>
        </ul>

        <h3>多平台支持</h3>
        <ul>
          <li>
            <strong>Windows</strong>：x86_64-pc-windows-msvc
          </li>
          <li>
            <strong>macOS</strong>：x86_64-apple-darwin, aarch64-apple-darwin
          </li>
          <li>
            <strong>Linux</strong>：x86_64-unknown-linux-gnu
          </li>
        </ul>

        <hr />

        <h2>📈 性能指标</h2>

        <h3>压缩性能指标</h3>
        <ul>
          <li>
            <strong>压缩率</strong>：WebP 平均压缩率 30-50%
          </li>
          <li>
            <strong>处理速度</strong>：2MB 图片压缩时间 &lt; 100ms
          </li>
          <li>
            <strong>内存占用</strong>：单张图片处理内存占用 &lt; 50MB
          </li>
          <li>
            <strong>批量处理</strong>：支持 100+ 图片并发处理
          </li>
        </ul>

        <h3>格式转换性能指标</h3>
        <ul>
          <li>
            <strong>转换速度</strong>：2MB 图片转换时间 &lt; 150ms
          </li>
          <li>
            <strong>格式支持</strong>：支持 6 种主流格式
          </li>
          <li>
            <strong>质量保持</strong>：转换后质量损失 &lt; 5%
          </li>
        </ul>

        <h3>AI 分析性能指标</h3>
        <ul>
          <li>
            <strong>分析速度</strong>：单张图片分析时间 &lt; 500ms（CPU）
          </li>
          <li>
            <strong>准确率</strong>：基础分析准确率 75%+
          </li>
          <li>
            <strong>GPU 加速</strong>：使用 GPU 时速度提升 5-10 倍
          </li>
        </ul>

        <hr />

        <h2>🔒 安全性考虑</h2>

        <h3>1. 输入验证</h3>
        <ul>
          <li>
            <strong>数据格式</strong>：验证输入数据是否为有效的图片格式
          </li>
          <li>
            <strong>数据大小</strong>：限制输入数据大小，防止内存溢出
          </li>
          <li>
            <strong>参数范围</strong>：验证参数范围（如质量 0-100）
          </li>
        </ul>

        <h3>2. 内存安全</h3>
        <ul>
          <li>
            <strong>Rust 内存安全</strong>：利用 Rust 的所有权系统确保内存安全
          </li>
          <li>
            <strong>边界检查</strong>：所有数组访问都进行边界检查
          </li>
          <li>
            <strong>资源管理</strong>：使用 RAII 自动管理资源
          </li>
        </ul>

        <h3>3. 错误处理</h3>
        <ul>
          <li>
            <strong>错误类型</strong>：使用 Result 类型处理错误
          </li>
          <li>
            <strong>错误传播</strong>：错误能够正确传播到 JavaScript 层
          </li>
          <li>
            <strong>错误信息</strong>：提供清晰的错误信息
          </li>
        </ul>

        <hr />

        <h2>📋 最佳实践</h2>

        <h3>1. 代码组织</h3>
        <ul>
          <li>
            <strong>模块化</strong>：按功能将代码组织到不同模块
          </li>
          <li>
            <strong>可复用</strong>：提取公共逻辑为可复用函数
          </li>
          <li>
            <strong>文档化</strong>：为公共 API 编写文档注释
          </li>
        </ul>

        <h3>2. 错误处理</h3>
        <ul>
          <li>
            <strong>统一错误类型</strong>：使用统一的错误类型
          </li>
          <li>
            <strong>错误转换</strong>：将 Rust 错误转换为 NAPI 错误
          </li>
          <li>
            <strong>错误信息</strong>：提供有意义的错误信息
          </li>
        </ul>

        <h3>3. 性能优化</h3>
        <ul>
          <li>
            <strong>算法选择</strong>：选择高效的算法和数据结构
          </li>
          <li>
            <strong>内存优化</strong>：避免不必要的内存分配
          </li>
          <li>
            <strong>并发优化</strong>：合理使用并发，提高处理效率
          </li>
        </ul>

        <h3>4. 测试</h3>
        <ul>
          <li>
            <strong>单元测试</strong>：为每个函数编写单元测试
          </li>
          <li>
            <strong>集成测试</strong>：测试与 Node.js 的集成
          </li>
          <li>
            <strong>性能测试</strong>：建立性能基准测试
          </li>
        </ul>

        <hr />

        <h2>📈 未来扩展</h2>

        <h3>功能扩展</h3>
        <ul>
          <li>
            <strong>更多格式</strong>：支持更多图片格式（AVIF、HEIC 等）
          </li>
          <li>
            <strong>更多 AI 模型</strong>：支持更多 AI 模型（YOLO、CLIP 等）
          </li>
          <li>
            <strong>图片编辑</strong>：添加图片编辑功能（裁剪、旋转、滤镜等）
          </li>
          <li>
            <strong>视频处理</strong>：支持视频处理和转换
          </li>
        </ul>

        <h3>性能优化</h3>
        <ul>
          <li>
            <strong>SIMD 优化</strong>：使用 SIMD 指令加速计算
          </li>
          <li>
            <strong>GPU 加速</strong>：更多功能支持 GPU 加速
          </li>
          <li>
            <strong>并行处理</strong>：优化并行处理能力
          </li>
        </ul>

        <h3>开发体验</h3>
        <ul>
          <li>
            <strong>类型生成</strong>：自动生成 TypeScript 类型定义
          </li>
          <li>
            <strong>文档生成</strong>：自动生成 API 文档
          </li>
          <li>
            <strong>测试工具</strong>：提供测试工具和示例
          </li>
        </ul>

        <hr />

        <h2>📝 总结</h2>

        <p>
          WASM 模块是 Pixuli 项目的核心性能组件，通过 Rust
          实现提供了高性能的图片处理能力。通过模块化设计、完善的错误处理和性能优化，为应用提供了稳定、高效、可扩展的图片处理功能。
        </p>

        <p>
          设计充分考虑了跨平台兼容性、内存安全和性能优化，通过 NAPI-RS 实现了与
          Node.js
          的无缝集成。同时，通过完善的测试和文档，确保了代码质量和可维护性。
        </p>

        <hr />

        <h2>📚 相关文档</h2>

        <ul>
          <li>
            <a href="/design/communication-architecture">
              WASM、Node 和 Web 通信架构设计
            </a>{' '}
            - 了解通信架构
          </li>
          <li>
            <a href="/design/web-worker">Web Worker 使用设计方案</a> - 了解 Web
            Worker 集成
          </li>
          <li>
            <a href="https://napi.rs/">NAPI-RS 文档</a> - NAPI-RS 官方文档
          </li>
          <li>
            <a href="https://www.rust-lang.org/">Rust 官方文档</a> - Rust
            语言文档
          </li>
          <li>
            <a href="https://github.com/trueLoving/Pixuli">GitHub 仓库</a> -
            查看源代码
          </li>
        </ul>

        <p>
          <em>最后更新：2025年11月</em>
        </p>
      </div>
    </PageLayout>
  );
}
