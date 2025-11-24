import PageLayout from '../../components/PageLayout';

export default function CommunicationArchitecturePage() {
  return (
    <PageLayout
      title="WASM、Node 和 Web 通信架构设计"
      subtitle="详细的设计文档，涵盖 Electron 桌面应用中 WASM、Node 主进程和 Web 渲染进程之间的通信流程"
      icon="fas fa-network-wired"
    >
      <div className="content-card">
        <h1>🔗 WASM、Node 和 Web 通信架构设计</h1>

        <p>
          本文档详细描述了 Pixuli 桌面应用中 WASM 模块、Node.js 主进程和 Web
          渲染进程之间的通信架构和设计流程。
        </p>

        <hr />

        <h2>🎯 设计目标</h2>

        <h3>核心目标</h3>
        <ul>
          <li>
            <strong>安全性</strong>：通过 Context Isolation
            确保渲染进程和主进程的安全隔离
          </li>
          <li>
            <strong>性能</strong>：高效的进程间通信，最小化数据传输开销
          </li>
          <li>
            <strong>可维护性</strong>：清晰的通信接口和错误处理机制
          </li>
          <li>
            <strong>类型安全</strong>：完整的 TypeScript
            类型定义，确保接口一致性
          </li>
          <li>
            <strong>可扩展性</strong>：易于添加新的通信接口和功能
          </li>
        </ul>

        <h3>架构原则</h3>
        <ul>
          <li>
            <strong>进程隔离</strong>：渲染进程无法直接访问 Node.js API
          </li>
          <li>
            <strong>API 暴露</strong>：通过 Preload Script 安全地暴露 API
          </li>
          <li>
            <strong>异步通信</strong>：所有进程间通信都是异步的
          </li>
          <li>
            <strong>错误处理</strong>：完善的错误捕获和传递机制
          </li>
        </ul>

        <hr />

        <h2>🏗️ 整体架构</h2>

        <h3>三层架构模型</h3>
        <p>Pixuli 桌面应用采用三层架构，通过 Electron IPC 实现进程间通信：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`┌─────────────────────────────────────────────────┐
│          Web 层 (渲染进程)                    │
│  ┌─────────────────────────────────────┐  │
│  │   React 组件 / UI 逻辑               │  │
│  │   - ImageCompressionService          │  │
│  │   - ImageConvertService              │  │
│  │   - AIAnalysisModal                  │  │
│  └─────────────────────────────────────┘  │
│              ↓                             │
│  ┌─────────────────────────────────────┐  │
│  │   window.wasmAPI (暴露的 API)        │  │
│  │   - compressToWebp()                 │  │
│  │   - convertImageFormat()             │  │
│  │   - analyzeImage()                  │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓ IPC (ipcRenderer.invoke)
┌─────────────────────────────────────────────────┐
│      Preload Script (桥接层)                    │
│  ┌─────────────────────────────────────┐  │
│  │   contextBridge.exposeInMainWorld   │  │
│  │   - 安全地暴露 API 到 window         │  │
│  │   - 封装 ipcRenderer.invoke         │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓ IPC (ipcMain.handle)
┌─────────────────────────────────────────────────┐
│      Node 层 (主进程)                           │
│  ┌─────────────────────────────────────┐  │
│  │   IPC Handlers (wasmService.ts)      │  │
│  │   - ipcMain.handle('wasm:compress')  │  │
│  │   - ipcMain.handle('wasm:convert')   │  │
│  │   - ipcMain.handle('wasm:analyze')   │  │
│  └─────────────────────────────────────┘  │
│              ↓                               │
│  ┌─────────────────────────────────────┐  │
│  │   WASM 模块调用                       │  │
│  │   - compressToWebp()                 │  │
│  │   - convertImageFormat()              │  │
│  │   - analyzeImage()                   │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      WASM 层 (原生模块)                          │
│  ┌─────────────────────────────────────┐  │
│  │   pixuli-wasm (Rust 编译)            │  │
│  │   - 图片压缩 (WebP)                  │  │
│  │   - 格式转换                         │  │
│  │   - AI 图片分析                      │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘`}
          </pre>
        </div>

        <h3>通信流程</h3>
        <p>完整的通信流程包含以下步骤：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`1. Web 层调用
   ↓
   window.wasmAPI.compressToWebp(imageData, options)

2. Preload Script 转发
   ↓
   ipcRenderer.invoke('wasm:compress-to-webp', imageData, options)

3. Node 主进程接收
   ↓
   ipcMain.handle('wasm:compress-to-webp', async (_, imageData, options) => {
     return await compressToWebp(imageData, options);
   })

4. WASM 模块执行
   ↓
   compressToWebp(imageData, options) → WebPCompressResult

5. 结果返回
   ↓
   Node → Preload → Web → React 组件`}
          </pre>
        </div>

        <hr />

        <h2>📊 数据流设计</h2>

        <h3>请求数据流</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`Web 层 (React 组件)
  │
  │ 1. 用户操作触发
  │    ImageCompressionService.compressImage(file, options)
  │
  ▼
  │ 2. 文件转换为 Array<number>
  │    const arrayBuffer = await file.arrayBuffer();
  │    const imageData = Array.from(new Uint8Array(arrayBuffer));
  │
  ▼
  │ 3. 调用暴露的 API
  │    window.wasmAPI.compressToWebp(imageData, options)
  │
  ▼
Preload Script
  │ 4. 转发 IPC 调用
  │    ipcRenderer.invoke('wasm:compress-to-webp', imageData, options)
  │
  ▼
Node 主进程
  │ 5. IPC Handler 接收
  │    ipcMain.handle('wasm:compress-to-webp', async (_, imageData, options) => {
  │
  ▼
  │ 6. 调用 WASM 函数
  │    return await compressToWebp(imageData, options);
  │
  ▼
WASM 模块
  │ 7. Rust 代码执行
  │    - 图片解码
  │    - WebP 编码
  │    - 返回压缩结果
  │
  ▼
  │ 8. 结果返回 (WebPCompressResult)
  │    {
  │      data: Array<number>,
  │      originalSize: number,
  │      compressedSize: number,
  │      compressionRatio: number,
  │      width: number,
  │      height: number
  │    }`}
          </pre>
        </div>

        <h3>响应数据流</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`WASM 模块
  │
  │ 1. 返回处理结果
  │    WebPCompressResult
  │
  ▼
Node 主进程
  │ 2. IPC Handler 返回
  │    return result;
  │
  ▼
Preload Script
  │ 3. IPC Promise 解析
  │    Promise<WebPCompressResult>
  │
  ▼
Web 层
  │ 4. API 调用返回
  │    const result = await window.wasmAPI.compressToWebp(...);
  │
  ▼
  │ 5. 结果处理
  │    - 转换为 File 对象
  │    - 更新 UI 状态
  │    - 显示压缩结果`}
          </pre>
        </div>

        <hr />

        <h2>💻 技术实现</h2>

        <h3>1. Web 层实现</h3>
        <h4>服务层封装</h4>
        <p>在 Web 层，我们通过服务类封装 WASM API 调用，提供类型安全的接口：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// apps/desktop/src/services/imageCompressService.ts
export class ImageCompressionService {
  static async compressImage(
    imageFile: File,
    options?: WebPCompressOptions
  ): Promise<WebPCompressResult> {
    // 1. 检查 WASM API 是否可用
    if (!window.wasmAPI || !window.wasmAPI.compressToWebp) {
      throw new Error('WASM API 不可用');
    }

    // 2. 将 File 转换为 Array<number>
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageData = Array.from(new Uint8Array(arrayBuffer));

    // 3. 调用 WASM API
    const result = await window.wasmAPI.compressToWebp(
      imageData,
      options
    );

    return result;
  }
}`}
          </pre>
        </div>

        <h4>类型定义</h4>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// apps/desktop/src/services/types/wasm.ts
declare global {
  interface Window {
    wasmAPI: WasmAPI;
  }
}

export interface WasmAPI {
  compressToWebp: (
    imageData: number[],
    options?: WebPCompressOptions
  ) => Promise<WebPCompressResult>;

  convertImageFormat: (
    imageData: number[],
    options: FormatConversionOptions
  ) => Promise<FormatConversionResult>;

  analyzeImage: (
    imageData: number[],
    options?: AiAnalysisOptions
  ) => Promise<AiAnalysisResult>;

  // ... 其他方法
}`}
          </pre>
        </div>

        <h3>2. Preload Script 实现</h3>
        <p>
          Preload Script 作为桥接层，使用 contextBridge 安全地暴露 API，同时封装
          IPC 调用：
        </p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// apps/desktop/electron/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

// 使用 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('wasmAPI', {
  // WebP 压缩
  compressToWebp: (imageData: number[], options?: any) =>
    ipcRenderer.invoke('wasm:compress-to-webp', imageData, options),

  // 批量压缩
  batchCompressToWebp: (imagesData: number[][], options?: any) =>
    ipcRenderer.invoke('wasm:batch-compress-to-webp', imagesData, options),

  // 格式转换
  convertImageFormat: (imageData: number[], options: any) =>
    ipcRenderer.invoke('wasm:convert-image-format', imageData, options),

  // AI 分析
  analyzeImage: (imageData: number[], options?: any) =>
    ipcRenderer.invoke('wasm:analyze-image', imageData, options),

  // ... 其他方法
});`}
          </pre>
        </div>

        <h4>Context Isolation 安全机制</h4>
        <ul>
          <li>
            <strong>隔离上下文</strong>：Preload Script 运行在隔离的上下文中
          </li>
          <li>
            <strong>API 暴露</strong>：通过 contextBridge 安全地暴露有限的 API
          </li>
          <li>
            <strong>权限控制</strong>：渲染进程无法直接访问 Node.js API
          </li>
        </ul>

        <h3>3. Node 主进程实现</h3>
        <p>在主进程中，我们注册 IPC handlers 来处理来自渲染进程的请求：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// apps/desktop/electron/main/services/wasmService.ts
import { ipcMain } from 'electron';
import {
  compressToWebp,
  convertImageFormat,
  analyzeImage,
  // ... 其他 WASM 函数
} from 'pixuli-wasm';

export function registerWasmHandlers() {
  // WebP 压缩 IPC 处理器
  ipcMain.handle(
    'wasm:compress-to-webp',
    async (_, imageData: number[], options?: any) => {
      try {
        return await compressToWebp(imageData, options);
      } catch (error) {
        console.error('WebP compression error:', error);
        throw error;
      }
    }
  );

  // 格式转换 IPC 处理器
  ipcMain.handle(
    'wasm:convert-image-format',
    async (_, imageData: number[], options: any) => {
      try {
        return await convertImageFormat(imageData, options);
      } catch (error) {
        console.error('Image format conversion error:', error);
        throw error;
      }
    }
  );

  // AI 分析 IPC 处理器
  ipcMain.handle(
    'wasm:analyze-image',
    async (_, imageData: number[], options?: any) => {
      try {
        return await analyzeImage(imageData, options);
      } catch (error) {
        console.error('AI image analysis error:', error);
        throw error;
      }
    }
  );
}`}
          </pre>
        </div>

        <h4>Handler 注册</h4>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// apps/desktop/electron/main/index.ts
import { registerServiceHandlers } from './services';

// 应用启动时注册所有服务处理器
app.whenReady().then(() => {
  // 注册 IPC handlers
  registerServiceHandlers();

  // 创建窗口
  createWindow();
});

// apps/desktop/electron/main/services/index.ts
export function registerServiceHandlers() {
  registerWasmHandlers();    // 注册 WASM handlers
  registerGithubHandlers();   // 注册 GitHub handlers
  registerUpyunHandlers();    // 注册又拍云 handlers
  registerAiHandlers();       // 注册 AI handlers
  registerFileHandlers();     // 注册文件 handlers
}`}
          </pre>
        </div>

        <h3>4. WASM 模块</h3>
        <p>WASM 模块使用 Rust 编写，通过 NAPI-RS 编译为 Node.js 原生模块：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// packages/wasm/src/webp.rs (Rust 代码)
use napi_derive::napi;

#[napi]
pub fn compress_to_webp(
  image_data: Vec<u8>,
  options: Option<WebPCompressOptions>,
) -> Result<WebPCompressResult, napi::Error> {
  // 1. 解码图片
  let img = image::load_from_memory(&image_data)?;

  // 2. 转换为 WebP
  let webp_data = encode_webp(&img, options)?;

  // 3. 返回结果
  Ok(WebPCompressResult {
    data: webp_data,
    original_size: image_data.len(),
    compressed_size: webp_data.len(),
    compression_ratio: webp_data.len() as f64 / image_data.len() as f64,
    width: img.width(),
    height: img.height(),
  })
}`}
          </pre>
        </div>

        <hr />

        <h2>🔄 通信模式</h2>

        <h3>1. 请求-响应模式（Request-Response）</h3>
        <p>这是最常用的通信模式，用于同步操作，如图片压缩、格式转换等：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// Web 层
const result = await window.wasmAPI.compressToWebp(imageData, options);

// Preload Script
compressToWebp: (imageData, options) =>
  ipcRenderer.invoke('wasm:compress-to-webp', imageData, options)

// Node 主进程
ipcMain.handle('wasm:compress-to-webp', async (_, imageData, options) => {
  return await compressToWebp(imageData, options);
})`}
          </pre>
        </div>

        <h3>2. 事件监听模式（Event Listener）</h3>
        <p>用于主进程主动向渲染进程发送消息：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// Node 主进程发送消息
win.webContents.send('main-process-message', 'Hello from main process');

// Preload Script 暴露监听器
contextBridge.exposeInMainWorld('electronAPI', {
  onReceiveMessage: (callback: (message: string) => void) => {
    return ipcRenderer.on('main-process-message', (event, message) => {
      callback(message);
    });
  },
});

// Web 层监听消息
window.electronAPI.onReceiveMessage((message) => {
  console.log('Received:', message);
});`}
          </pre>
        </div>

        <h3>3. 批量处理模式（Batch Processing）</h3>
        <p>用于处理多个任务，提高效率：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// Web 层
const results = await window.wasmAPI.batchCompressToWebp(
  imagesData,  // number[][]
  options
);

// Node 主进程
ipcMain.handle(
  'wasm:batch-compress-to-webp',
  async (_, imagesData: number[][], options?: any) => {
    return await batchCompressToWebp(imagesData, options);
  }
);`}
          </pre>
        </div>

        <hr />

        <h2>📦 数据类型转换</h2>

        <h3>数据格式转换流程</h3>
        <p>在不同层之间传递数据时，需要进行格式转换：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`Web 层 (File 对象)
  │
  │ File → ArrayBuffer → Uint8Array → Array<number>
  │
  ▼
Preload Script (IPC 序列化)
  │
  │ Array<number> → JSON 序列化 → IPC 消息
  │
  ▼
Node 主进程 (IPC 反序列化)
  │
  │ IPC 消息 → JSON 反序列化 → Array<number>
  │
  ▼
WASM 模块 (Rust)
  │
  │ Array<number> → Vec<u8> → 图片处理 → Vec<u8>
  │
  ▼
Node 主进程 (返回)
  │
  │ Vec<u8> → Array<number> → JSON 序列化
  │
  ▼
Preload Script (IPC 反序列化)
  │
  │ IPC 消息 → JSON 反序列化 → Array<number>
  │
  ▼
Web 层 (File 对象)
  │
  │ Array<number> → Uint8Array → ArrayBuffer → File`}
          </pre>
        </div>

        <h3>转换代码示例</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// Web 层：File → Array<number>
const arrayBuffer = await imageFile.arrayBuffer();
const imageData = Array.from(new Uint8Array(arrayBuffer));

// Web 层：Array<number> → File
const result = await window.wasmAPI.compressToWebp(imageData, options);
const compressedData = new Uint8Array(result.data);
const compressedFile = new File(
  [compressedData],
  'compressed.webp',
  { type: 'image/webp' }
);`}
          </pre>
        </div>

        <hr />

        <h2>⚡ 性能优化</h2>

        <h3>1. 数据传输优化</h3>
        <ul>
          <li>
            <strong>数据压缩</strong>：对于大文件，考虑在传输前压缩
          </li>
          <li>
            <strong>流式传输</strong>：对于超大文件，考虑分块传输
          </li>
          <li>
            <strong>Transferable Objects</strong>：使用 ArrayBuffer
            等可转移对象减少拷贝
          </li>
        </ul>

        <h3>2. 批量处理优化</h3>
        <ul>
          <li>
            <strong>批量 API</strong>：使用批量处理 API 减少 IPC 调用次数
          </li>
          <li>
            <strong>并发控制</strong>：限制并发请求数量，避免资源耗尽
          </li>
          <li>
            <strong>任务队列</strong>：使用任务队列管理批量操作
          </li>
        </ul>

        <h3>3. 错误处理优化</h3>
        <ul>
          <li>
            <strong>错误分类</strong>：区分可恢复错误和不可恢复错误
          </li>
          <li>
            <strong>重试机制</strong>：对网络错误等可恢复错误实现自动重试
          </li>
          <li>
            <strong>错误缓存</strong>：避免重复处理已知错误
          </li>
        </ul>

        <hr />

        <h2>🔒 安全性设计</h2>

        <h3>1. Context Isolation</h3>
        <ul>
          <li>
            <strong>隔离上下文</strong>：启用 contextIsolation
            确保渲染进程和主进程隔离
          </li>
          <li>
            <strong>API 白名单</strong>：只暴露必要的 API，避免暴露过多权限
          </li>
          <li>
            <strong>输入验证</strong>：在主进程验证所有输入数据
          </li>
        </ul>

        <h3>2. 数据验证</h3>
        <ul>
          <li>
            <strong>类型检查</strong>：使用 TypeScript 确保类型安全
          </li>
          <li>
            <strong>数据校验</strong>：在主进程验证数据格式和大小
          </li>
          <li>
            <strong>边界检查</strong>：检查数组长度、文件大小等边界条件
          </li>
        </ul>

        <h3>3. 错误处理</h3>
        <ul>
          <li>
            <strong>错误捕获</strong>：所有 IPC handlers 都应包含错误处理
          </li>
          <li>
            <strong>错误日志</strong>：记录错误信息，便于调试和监控
          </li>
          <li>
            <strong>用户提示</strong>：将技术错误转换为用户友好的提示
          </li>
        </ul>

        <hr />

        <h2>📋 最佳实践</h2>

        <h3>1. API 设计</h3>
        <ul>
          <li>
            <strong>命名规范</strong>：使用清晰的命名，如
            'wasm:compress-to-webp'
          </li>
          <li>
            <strong>参数设计</strong>：使用对象参数，便于扩展
          </li>
          <li>
            <strong>返回值设计</strong>：返回结构化的结果对象
          </li>
        </ul>

        <h3>2. 错误处理</h3>
        <ul>
          <li>
            <strong>统一错误格式</strong>：使用统一的错误对象格式
          </li>
          <li>
            <strong>错误传播</strong>：确保错误能够正确传播到 Web 层
          </li>
          <li>
            <strong>错误恢复</strong>：实现错误恢复机制，提高用户体验
          </li>
        </ul>

        <h3>3. 性能监控</h3>
        <ul>
          <li>
            <strong>性能指标</strong>：记录 IPC 调用耗时
          </li>
          <li>
            <strong>性能分析</strong>：定期分析性能瓶颈
          </li>
          <li>
            <strong>性能优化</strong>：根据监控数据优化关键路径
          </li>
        </ul>

        <hr />

        <h2>🔍 调试技巧</h2>

        <h3>1. IPC 消息调试</h3>
        <ul>
          <li>
            <strong>日志记录</strong>：在关键点添加日志，记录 IPC 消息
          </li>
          <li>
            <strong>DevTools</strong>：使用 Electron DevTools 调试 IPC
          </li>
          <li>
            <strong>消息追踪</strong>：为每个请求添加唯一 ID，便于追踪
          </li>
        </ul>

        <h3>2. 数据验证</h3>
        <ul>
          <li>
            <strong>数据检查</strong>：在每层验证数据格式
          </li>
          <li>
            <strong>类型检查</strong>：使用 TypeScript 类型检查
          </li>
          <li>
            <strong>运行时检查</strong>：添加运行时数据验证
          </li>
        </ul>

        <h3>3. 性能分析</h3>
        <ul>
          <li>
            <strong>性能计时</strong>：使用 performance.now() 测量耗时
          </li>
          <li>
            <strong>性能分析工具</strong>：使用 Chrome DevTools 性能分析工具
          </li>
          <li>
            <strong>内存分析</strong>：监控内存使用，避免内存泄漏
          </li>
        </ul>

        <hr />

        <h2>📈 未来扩展</h2>

        <h3>功能扩展</h3>
        <ul>
          <li>
            <strong>Web Worker 集成</strong>：在 Web Worker 中运行 WASM 模块
          </li>
          <li>
            <strong>流式处理</strong>：支持大文件的流式处理
          </li>
          <li>
            <strong>进度反馈</strong>：实现长时间操作的进度反馈
          </li>
          <li>
            <strong>任务队列</strong>：实现任务队列管理，支持任务优先级
          </li>
        </ul>

        <h3>性能优化</h3>
        <ul>
          <li>
            <strong>数据压缩</strong>：在传输前压缩数据
          </li>
          <li>
            <strong>缓存机制</strong>：实现结果缓存，避免重复计算
          </li>
          <li>
            <strong>并发优化</strong>：优化并发处理能力
          </li>
        </ul>

        <h3>开发体验</h3>
        <ul>
          <li>
            <strong>类型生成</strong>：自动生成 TypeScript 类型定义
          </li>
          <li>
            <strong>Mock 数据</strong>：提供 Mock 数据用于开发测试
          </li>
          <li>
            <strong>测试工具</strong>：提供 IPC 通信测试工具
          </li>
        </ul>

        <hr />

        <h2>📝 总结</h2>

        <p>
          WASM、Node 和 Web 三层通信架构是 Pixuli
          桌面应用的核心设计。通过清晰的架构设计、完善的错误处理和性能优化，实现了安全、高效、可维护的进程间通信。
        </p>

        <p>
          设计充分考虑了 Electron 的安全模型和性能要求，通过 Context
          Isolation、类型安全和错误处理，确保了应用的安全性和稳定性。同时，通过合理的架构设计，为未来的功能扩展和性能优化留下了充足的空间。
        </p>

        <hr />

        <h2>📚 相关文档</h2>

        <ul>
          <li>
            <a href="/design/web-worker">Web Worker 使用设计方案</a> - 了解 Web
            Worker 的使用
          </li>
          <li>
            <a href="/design/operation-log">操作日志设计方案</a> -
            了解日志系统设计
          </li>
          <li>
            <a href="https://www.electronjs.org/docs/latest/tutorial/context-isolation">
              Electron Context Isolation
            </a>{' '}
            - Electron 官方文档
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
