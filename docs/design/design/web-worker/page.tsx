import PageLayout from '../../../src/components/PageLayout';

export default function WebWorkerDesignPage() {
  return (
    <PageLayout
      title="Web Worker 使用设计方案"
      subtitle="详细的设计文档，涵盖 Web Worker 在 Pixuli 中的架构、实现和优化策略"
      icon="fas fa-cogs"
    >
      <div className="content-card">
        <h1>⚙️ Web Worker 使用设计方案</h1>

        <p>
          本文档详细描述了 Pixuli 项目中 Web Worker
          的使用设计方案，包括架构设计、实现细节、性能优化和最佳实践。
        </p>

        <hr />

        <h2>🎯 设计目标</h2>

        <h3>核心目标</h3>
        <ul>
          <li>
            <strong>性能优化</strong>：将 CPU
            密集型任务移到后台线程，避免阻塞主线程
          </li>
          <li>
            <strong>用户体验</strong>：保持 UI
            响应性，即使在处理大量数据时也能流畅交互
          </li>
          <li>
            <strong>可扩展性</strong>：支持大规模数据处理（10万+图片）
          </li>
          <li>
            <strong>资源管理</strong>：合理管理 Worker 资源，避免内存泄漏
          </li>
          <li>
            <strong>错误处理</strong>：完善的错误处理和恢复机制
          </li>
        </ul>

        <h3>应用场景</h3>
        <ul>
          <li>
            <strong>图片处理</strong>：压缩、格式转换、尺寸调整等
          </li>
          <li>
            <strong>批量操作</strong>：批量上传、批量处理、批量导出
          </li>
          <li>
            <strong>数据计算</strong>：日志查询、统计分析、数据转换
          </li>
          <li>
            <strong>WASM 模块</strong>：在 Worker 中运行 WASM
            模块，避免阻塞主线程
          </li>
        </ul>

        <hr />

        <h2>🏗️ 架构设计</h2>

        <h3>整体架构</h3>
        <p>
          Web Worker 系统采用分层架构，包含 Worker 管理层、任务队列层和执行层：
        </p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`┌─────────────────────────────────────────┐
│         主线程 (Main Thread)              │
│  ┌─────────────────────────────────────┐  │
│  │   WorkerManager (Worker 管理器)      │  │
│  │   - Worker 池管理                    │  │
│  │   - 任务队列管理                     │  │
│  │   - 生命周期管理                     │  │
│  └─────────────────────────────────────┘  │
│              ↓                              │
│  ┌─────────────────────────────────────┐  │
│  │   TaskQueue (任务队列)               │  │
│  │   - 任务优先级                       │  │
│  │   - 任务调度                         │  │
│  │   - 进度反馈                         │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Worker 线程池 (Worker Pool)         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Worker 1 │  │ Worker 2 │  │ Worker N ││
│  │          │  │          │  │          ││
│  │ - 图片   │  │ - 数据   │  │ - WASM   ││
│  │   处理   │  │   计算   │  │   模块   ││
│  └──────────┘  └──────────┘  └──────────┘│
└─────────────────────────────────────────┘`}
          </pre>
        </div>

        <h3>核心组件</h3>

        <h4>1. WorkerManager（Worker 管理器）</h4>
        <ul>
          <li>
            <strong>职责</strong>：管理 Worker 的生命周期、创建、销毁和复用
          </li>
          <li>
            <strong>功能</strong>：
            <ul>
              <li>Worker 池的创建和维护</li>
              <li>Worker 的健康检查</li>
              <li>Worker 的自动回收</li>
              <li>Worker 的性能监控</li>
            </ul>
          </li>
        </ul>

        <h4>2. TaskQueue（任务队列）</h4>
        <ul>
          <li>
            <strong>职责</strong>：管理待处理任务，实现任务调度和优先级控制
          </li>
          <li>
            <strong>功能</strong>：
            <ul>
              <li>任务入队和出队</li>
              <li>任务优先级排序</li>
              <li>任务状态跟踪</li>
              <li>进度反馈机制</li>
            </ul>
          </li>
        </ul>

        <h4>3. Worker Pool（Worker 池）</h4>
        <ul>
          <li>
            <strong>职责</strong>：维护多个 Worker 实例，实现并发处理
          </li>
          <li>
            <strong>功能</strong>：
            <ul>
              <li>动态 Worker 数量调整</li>
              <li>负载均衡</li>
              <li>Worker 复用</li>
              <li>资源限制管理</li>
            </ul>
          </li>
        </ul>

        <hr />

        <h2>📊 数据结构设计</h2>

        <h3>任务数据结构</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`interface WorkerTask {
  id: string;                    // 任务唯一标识
  type: TaskType;                // 任务类型
  priority: number;              // 优先级（数字越大优先级越高）
  data: any;                     // 任务数据
  options?: TaskOptions;         // 任务选项
  onProgress?: (progress: number) => void;  // 进度回调
  onComplete?: (result: any) => void;        // 完成回调
  onError?: (error: Error) => void;        // 错误回调
  createdAt: number;             // 创建时间
  startedAt?: number;            // 开始时间
  completedAt?: number;          // 完成时间
}

enum TaskType {
  IMAGE_COMPRESS = 'image_compress',
  IMAGE_CONVERT = 'image_convert',
  IMAGE_RESIZE = 'image_resize',
  BATCH_PROCESS = 'batch_process',
  DATA_CALCULATE = 'data_calculate',
  WASM_EXECUTE = 'wasm_execute',
  LOG_QUERY = 'log_query',
}

interface TaskOptions {
  timeout?: number;              // 超时时间（毫秒）
  retry?: number;                // 重试次数
  retryDelay?: number;           // 重试延迟（毫秒）
  maxConcurrency?: number;       // 最大并发数
}`}
          </pre>
        </div>

        <h3>Worker 状态数据结构</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`interface WorkerState {
  id: string;                    // Worker ID
  status: WorkerStatus;          // Worker 状态
  currentTask?: string;          // 当前任务 ID
  taskCount: number;             // 已完成任务数
  errorCount: number;            // 错误次数
  createdAt: number;            // 创建时间
  lastUsedAt: number;            // 最后使用时间
  memoryUsage?: number;          // 内存使用量
  cpuUsage?: number;             // CPU 使用率
}

enum WorkerStatus {
  IDLE = 'idle',                 // 空闲
  BUSY = 'busy',                 // 忙碌
  ERROR = 'error',               // 错误
  TERMINATED = 'terminated',     // 已终止
}`}
          </pre>
        </div>

        <hr />

        <h2>⚙️ 功能设计</h2>

        <h3>1. Worker 池管理</h3>
        <h4>动态 Worker 创建</h4>
        <ul>
          <li>
            <strong>按需创建</strong>：根据任务数量动态创建 Worker
          </li>
          <li>
            <strong>数量限制</strong>：最大 Worker 数量限制（默认 CPU 核心数）
          </li>
          <li>
            <strong>类型区分</strong>：不同类型的任务使用不同类型的 Worker
          </li>
        </ul>

        <h4>Worker 复用机制</h4>
        <ul>
          <li>
            <strong>空闲 Worker 复用</strong>：优先使用空闲的 Worker
          </li>
          <li>
            <strong>Worker 健康检查</strong>：定期检查 Worker 状态，移除异常
            Worker
          </li>
          <li>
            <strong>自动回收</strong>：长时间空闲的 Worker 自动终止
          </li>
        </ul>

        <h3>2. 任务队列管理</h3>
        <h4>任务优先级</h4>
        <ul>
          <li>
            <strong>优先级队列</strong>：使用优先队列实现任务调度
          </li>
          <li>
            <strong>优先级策略</strong>：
            <ul>
              <li>用户交互任务：最高优先级</li>
              <li>批量处理任务：中等优先级</li>
              <li>后台任务：低优先级</li>
            </ul>
          </li>
        </ul>

        <h4>任务调度策略</h4>
        <ul>
          <li>
            <strong>FIFO（先进先出）</strong>：相同优先级任务按顺序执行
          </li>
          <li>
            <strong>负载均衡</strong>：将任务分配到负载较低的 Worker
          </li>
          <li>
            <strong>并发控制</strong>：限制同时执行的任务数量
          </li>
        </ul>

        <h3>3. 进度反馈机制</h3>
        <h4>实时进度更新</h4>
        <ul>
          <li>
            <strong>进度事件</strong>：Worker 通过 postMessage 发送进度更新
          </li>
          <li>
            <strong>进度回调</strong>：主线程通过回调函数更新 UI
          </li>
          <li>
            <strong>批量任务进度</strong>：支持批量任务的总体进度和单项进度
          </li>
        </ul>

        <h3>4. 错误处理和恢复</h3>
        <h4>错误捕获</h4>
        <ul>
          <li>
            <strong>Worker 错误监听</strong>：监听 Worker 的 error 事件
          </li>
          <li>
            <strong>任务错误处理</strong>：捕获任务执行过程中的错误
          </li>
          <li>
            <strong>错误分类</strong>：区分可恢复错误和不可恢复错误
          </li>
        </ul>

        <h4>自动重试机制</h4>
        <ul>
          <li>
            <strong>重试策略</strong>：可配置的重试次数和重试延迟
          </li>
          <li>
            <strong>指数退避</strong>：重试延迟逐渐增加
          </li>
          <li>
            <strong>Worker 替换</strong>：错误 Worker 自动替换为新 Worker
          </li>
        </ul>

        <h3>5. 性能监控</h3>
        <h4>监控指标</h4>
        <ul>
          <li>
            <strong>任务执行时间</strong>：记录每个任务的执行时间
          </li>
          <li>
            <strong>Worker 利用率</strong>：统计 Worker 的使用率
          </li>
          <li>
            <strong>内存使用</strong>：监控 Worker 的内存占用
          </li>
          <li>
            <strong>错误率</strong>：统计任务失败率
          </li>
        </ul>

        <h4>性能优化建议</h4>
        <ul>
          <li>
            <strong>动态调整</strong>：根据性能指标动态调整 Worker 数量
          </li>
          <li>
            <strong>资源限制</strong>：设置 Worker 的内存和 CPU 使用限制
          </li>
          <li>
            <strong>任务拆分</strong>：将大任务拆分为多个小任务并行处理
          </li>
        </ul>

        <hr />

        <h2>💻 技术实现</h2>

        <h3>当前实现：WASM Worker</h3>
        <p>项目中已经实现了用于运行 WASM 模块的 Web Worker：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// packages/wasm/wasi-worker-browser.mjs
import {
  instantiateNapiModuleSync,
  MessageHandler,
  WASI,
} from '@napi-rs/wasm-runtime';

const handler = new MessageHandler({
  onLoad({ wasmModule, wasmMemory }) {
    const wasi = new WASI({
      print: function () {
        console.log.apply(console, arguments);
      },
      printErr: function () {
        console.error.apply(console, arguments);
      },
    });
    return instantiateNapiModuleSync(wasmModule, {
      childThread: true,
      wasi,
      overwriteImports(importObject) {
        importObject.env = {
          ...importObject.env,
          ...importObject.napi,
          ...importObject.emnapi,
          memory: wasmMemory,
        };
      },
    });
  },
});

globalThis.onmessage = function (e) {
  handler.handle(e);
};`}
          </pre>
        </div>

        <h3>WorkerManager 实现示例</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: WorkerTask[] = [];
  private maxWorkers: number;
  private activeTasks: Map<string, WorkerTask> = new Map();

  constructor(maxWorkers = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = maxWorkers;
  }

  // 创建 Worker
  private createWorker(type: TaskType): Worker {
    const workerUrl = this.getWorkerUrl(type);
    const worker = new Worker(workerUrl, { type: 'module' });

    worker.onmessage = (e) => {
      this.handleWorkerMessage(worker, e.data);
    };

    worker.onerror = (error) => {
      this.handleWorkerError(worker, error);
    };

    return worker;
  }

  // 提交任务
  async submitTask(task: WorkerTask): Promise<any> {
    return new Promise((resolve, reject) => {
      task.onComplete = resolve;
      task.onError = reject;

      this.taskQueue.push(task);
      this.taskQueue.sort((a, b) => b.priority - a.priority);

      this.processQueue();
    });
  }

  // 处理任务队列
  private processQueue() {
    while (this.taskQueue.length > 0 && this.activeTasks.size < this.maxWorkers) {
      const task = this.taskQueue.shift()!;
      const worker = this.getAvailableWorker(task.type);

      if (worker) {
        this.executeTask(worker, task);
      } else if (this.workers.size < this.maxWorkers) {
        const newWorker = this.createWorker(task.type);
        this.workers.set(task.id, newWorker);
        this.executeTask(newWorker, task);
      }
    }
  }

  // 执行任务
  private executeTask(worker: Worker, task: WorkerTask) {
    this.activeTasks.set(task.id, task);
    task.startedAt = Date.now();

    worker.postMessage({
      type: 'execute',
      taskId: task.id,
      data: task.data,
      options: task.options,
    });
  }

  // 处理 Worker 消息
  private handleWorkerMessage(worker: Worker, message: any) {
    const { taskId, type, data, error } = message;
    const task = this.activeTasks.get(taskId);

    if (!task) return;

    switch (type) {
      case 'progress':
        task.onProgress?.(data.progress);
        break;
      case 'complete':
        task.completedAt = Date.now();
        task.onComplete?.(data);
        this.activeTasks.delete(taskId);
        this.processQueue();
        break;
      case 'error':
        task.onError?.(new Error(error));
        this.activeTasks.delete(taskId);
        this.processQueue();
        break;
    }
  }
}`}
          </pre>
        </div>

        <h3>图片处理 Worker 示例</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`// image-processor.worker.ts
self.onmessage = async function (e) {
  const { taskId, type, data, options } = e.data;

  try {
    switch (type) {
      case 'compress':
        const result = await compressImage(data, options);
        self.postMessage({
          type: 'complete',
          taskId,
          data: result,
        });
        break;

      case 'convert':
        const converted = await convertImageFormat(data, options);
        self.postMessage({
          type: 'complete',
          taskId,
          data: converted,
        });
        break;

      default:
        throw new Error(\`Unknown task type: \${type}\`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      taskId,
      error: error.message,
    });
  }
};

async function compressImage(imageData: ImageData, options: any) {
  // 图片压缩逻辑
  // 支持进度反馈
  for (let i = 0; i < 100; i++) {
    // 处理进度
    self.postMessage({
      type: 'progress',
      taskId: options.taskId,
      data: { progress: i + 1 },
    });

    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return compressedData;
}`}
          </pre>
        </div>

        <hr />

        <h2>🚀 性能优化策略</h2>

        <h3>1. Worker 池优化</h3>
        <ul>
          <li>
            <strong>预热机制</strong>：应用启动时预创建少量 Worker
          </li>
          <li>
            <strong>懒加载</strong>：按需创建 Worker，避免资源浪费
          </li>
          <li>
            <strong>智能回收</strong>：空闲 Worker 自动回收，释放资源
          </li>
        </ul>

        <h3>2. 任务优化</h3>
        <ul>
          <li>
            <strong>任务拆分</strong>：将大任务拆分为多个小任务并行处理
          </li>
          <li>
            <strong>批量处理</strong>：合并相似任务，减少通信开销
          </li>
          <li>
            <strong>数据传递优化</strong>：使用 Transferable Objects
            减少数据拷贝
          </li>
        </ul>

        <h3>3. 内存管理</h3>
        <ul>
          <li>
            <strong>及时清理</strong>：任务完成后及时清理相关数据
          </li>
          <li>
            <strong>内存限制</strong>：设置 Worker 内存使用上限
          </li>
          <li>
            <strong>内存监控</strong>：定期检查内存使用情况
          </li>
        </ul>

        <h3>4. 通信优化</h3>
        <ul>
          <li>
            <strong>消息批处理</strong>：合并多个小消息为一个大消息
          </li>
          <li>
            <strong>减少序列化</strong>：使用结构化克隆算法优化数据传输
          </li>
          <li>
            <strong>Transferable Objects</strong>：使用 ArrayBuffer 等可转移对象
          </li>
        </ul>

        <hr />

        <h2>📈 性能目标</h2>

        <h3>当前性能指标</h3>
        <ul>
          <li>
            <strong>虚拟滚动 + Web Worker</strong>：10万图片加载优化至 2.8s
          </li>
          <li>
            <strong>图片压缩</strong>：单张 2MB 图片压缩时间小于 100ms
          </li>
          <li>
            <strong>批量处理</strong>：支持 100+ 图片并发处理
          </li>
        </ul>

        <h3>优化目标</h3>
        <ul>
          <li>
            <strong>响应时间</strong>：主线程响应时间保持在 16ms 以内（60fps）
          </li>
          <li>
            <strong>吞吐量</strong>：支持 1000+ 图片批量处理
          </li>
          <li>
            <strong>资源占用</strong>：Worker 内存占用控制在合理范围
          </li>
          <li>
            <strong>错误率</strong>：任务失败率低于 0.1%
          </li>
        </ul>

        <hr />

        <h2>🔒 安全性考虑</h2>

        <ul>
          <li>
            <strong>数据隔离</strong>：Worker 运行在独立的上下文中，无法访问 DOM
          </li>
          <li>
            <strong>输入验证</strong>：验证所有从主线程传入 Worker 的数据
          </li>
          <li>
            <strong>错误隔离</strong>：Worker 错误不会影响主线程
          </li>
          <li>
            <strong>资源限制</strong>：限制 Worker 可以使用的资源
          </li>
        </ul>

        <hr />

        <h2>📋 最佳实践</h2>

        <h3>1. Worker 选择</h3>
        <ul>
          <li>
            <strong>何时使用 Worker</strong>：
            <ul>
              <li>CPU 密集型任务（图片处理、数据计算）</li>
              <li>批量操作（批量上传、批量处理）</li>
              <li>长时间运行的任务</li>
            </ul>
          </li>
          <li>
            <strong>何时不使用 Worker</strong>：
            <ul>
              <li>需要访问 DOM 的操作</li>
              <li>简单的数据操作</li>
              <li>频繁的小任务（通信开销大于计算开销）</li>
            </ul>
          </li>
        </ul>

        <h3>2. 任务设计</h3>
        <ul>
          <li>
            <strong>任务粒度</strong>
            ：任务不应太小（通信开销）也不应太大（阻塞时间长）
          </li>
          <li>
            <strong>数据传递</strong>：尽量减少主线程和 Worker 之间的数据传递
          </li>
          <li>
            <strong>进度反馈</strong>：长时间任务应提供进度反馈
          </li>
        </ul>

        <h3>3. 错误处理</h3>
        <ul>
          <li>
            <strong>错误捕获</strong>：所有 Worker 操作都应包含错误处理
          </li>
          <li>
            <strong>错误恢复</strong>：实现自动重试和错误恢复机制
          </li>
          <li>
            <strong>错误上报</strong>：记录和上报 Worker 错误，便于调试
          </li>
        </ul>

        <h3>4. 性能监控</h3>
        <ul>
          <li>
            <strong>性能指标</strong>：监控任务执行时间、Worker 利用率等指标
          </li>
          <li>
            <strong>性能分析</strong>：定期分析性能瓶颈，优化关键路径
          </li>
          <li>
            <strong>性能测试</strong>：建立性能基准测试，确保优化效果
          </li>
        </ul>

        <hr />

        <h2>📈 未来扩展</h2>

        <h3>功能扩展</h3>
        <ul>
          <li>
            <strong>SharedWorker</strong>：支持多个页面共享 Worker
          </li>
          <li>
            <strong>Service Worker</strong>：集成 Service Worker 实现离线功能
          </li>
          <li>
            <strong>WebAssembly</strong>：更多 WASM 模块在 Worker 中运行
          </li>
          <li>
            <strong>GPU 加速</strong>：使用 WebGPU 进行 GPU 加速计算
          </li>
        </ul>

        <h3>性能优化</h3>
        <ul>
          <li>
            <strong>智能调度</strong>：基于机器学习的任务调度优化
          </li>
          <li>
            <strong>预测性加载</strong>：预测用户操作，提前创建 Worker
          </li>
          <li>
            <strong>自适应调整</strong>：根据设备性能自动调整 Worker 数量
          </li>
        </ul>

        <h3>开发体验</h3>
        <ul>
          <li>
            <strong>开发工具</strong>：Worker 调试工具和性能分析工具
          </li>
          <li>
            <strong>类型安全</strong>：完整的 TypeScript 类型定义
          </li>
          <li>
            <strong>测试支持</strong>：Worker 单元测试和集成测试框架
          </li>
        </ul>

        <hr />

        <h2>📝 总结</h2>

        <p>
          Web Worker 是 Pixuli
          项目中实现高性能图片处理和数据计算的关键技术。通过合理的架构设计、完善的错误处理和性能优化，可以显著提升用户体验和应用性能。
        </p>

        <p>
          设计充分考虑了可扩展性、可维护性和性能，为未来的功能扩展和性能优化留下了充足的空间。同时，通过最佳实践和性能监控，确保
          Worker 系统的稳定性和高效性。
        </p>

        <hr />

        <h2>📚 相关文档</h2>

        <ul>
          <li>
            <a href="/design/operation-log">操作日志设计方案</a> -
            了解日志系统设计
          </li>
          <li>
            <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API">
              MDN Web Workers API
            </a>{' '}
            - Web Worker 官方文档
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
