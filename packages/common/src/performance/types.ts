/**
 * 性能监控相关类型定义
 */

/**
 * 渲染性能指标
 */
export interface RenderMetrics {
  /** 帧率 (FPS) */
  fps: number;
  /** 单帧渲染时间 (ms) */
  frameTime: number;
  /** 重绘次数 */
  repaintCount: number;
  /** 重排次数 */
  reflowCount: number;
  /** 长任务数量 */
  longTaskCount: number;
  /** 长任务总耗时 (ms) */
  longTaskDuration: number;
}

/**
 * 加载性能指标
 */
export interface LoadMetrics {
  /** 页面加载时间 (ms) */
  pageLoadTime: number;
  /** 首屏渲染时间 (ms) */
  firstContentfulPaint: number;
  /** 最大内容绘制时间 (ms) */
  largestContentfulPaint: number;
  /** DOM 就绪时间 (ms) */
  domReadyTime: number;
  /** 资源加载时间 (ms) */
  resourceLoadTime: number;
  /** DNS 查询时间 (ms) */
  dnsTime: number;
  /** TCP 连接时间 (ms) */
  tcpTime: number;
  /** SSL 握手时间 (ms) */
  sslTime: number;
  /** TTFB (Time To First Byte) (ms) */
  ttfb: number;
}

/**
 * 内存使用指标
 */
export interface MemoryMetrics {
  /** 当前内存使用量 (MB) */
  usedJSHeapSize: number;
  /** 总堆内存 (MB) */
  totalJSHeapSize: number;
  /** 堆内存限制 (MB) */
  jsHeapSizeLimit: number;
  /** 内存使用率 (%) */
  memoryUsage: number;
}

/**
 * 网络性能指标
 */
export interface NetworkMetrics {
  /** 请求总数 */
  requestCount: number;
  /** 成功请求数 */
  successCount: number;
  /** 失败请求数 */
  errorCount: number;
  /** 平均请求时间 (ms) */
  averageRequestTime: number;
  /** 总传输大小 (KB) */
  totalTransferSize: number;
  /** 缓存命中数 */
  cacheHitCount: number;
  /** 缓存命中率 (%) */
  cacheHitRate: number;
}

/**
 * 用户交互指标
 */
export interface InteractionMetrics {
  /** 点击响应时间 (ms) */
  clickResponseTime: number;
  /** 滚动流畅度 (FPS) */
  scrollFps: number;
  /** 输入延迟 (ms) */
  inputDelay: number;
}

/**
 * 性能指标集合
 */
export interface PerformanceMetrics {
  /** 渲染性能 */
  render: RenderMetrics;
  /** 加载性能 */
  load: LoadMetrics;
  /** 内存使用 */
  memory: MemoryMetrics;
  /** 网络性能 */
  network: NetworkMetrics;
  /** 用户交互 */
  interaction: InteractionMetrics;
  /** 时间戳 */
  timestamp: number;
  /** 页面URL */
  url: string;
  /** 用户代理 */
  userAgent: string;
}

/**
 * 性能事件类型
 */
export type PerformanceEventType =
  | 'render'
  | 'load'
  | 'memory'
  | 'network'
  | 'interaction'
  | 'error';

/**
 * 性能事件
 */
export interface PerformanceEvent {
  /** 事件类型 */
  type: PerformanceEventType;
  /** 事件数据 */
  data: Partial<PerformanceMetrics>;
  /** 时间戳 */
  timestamp: number;
  /** 页面URL */
  url: string;
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  /** 是否启用监控 */
  enabled: boolean;
  /** 采样率 (0-1) */
  sampleRate: number;
  /** 上报间隔 (ms) */
  reportInterval: number;
  /** 是否实时上报 */
  realtimeReport: boolean;
  /** 性能阈值配置 */
  thresholds: {
    /** FPS 阈值 */
    fps: number;
    /** 内存使用率阈值 (%) */
    memoryUsage: number;
    /** 长任务阈值 (ms) */
    longTask: number;
    /** 页面加载时间阈值 (ms) */
    pageLoadTime: number;
  };
  /** 上报URL */
  reportUrl?: string;
  /** 是否在控制台输出 */
  consoleOutput?: boolean;
}

/**
 * 性能数据上报选项
 */
export interface ReportOptions {
  /** 是否立即上报 */
  immediate?: boolean;
  /** 是否批量上报 */
  batch?: boolean;
  /** 自定义数据 */
  customData?: Record<string, any>;
}

/**
 * 性能分析结果
 */
export interface PerformanceAnalysis {
  /** 性能评分 (0-100) */
  score: number;
  /** 性能等级 */
  level: 'excellent' | 'good' | 'fair' | 'poor';
  /** 性能问题列表 */
  issues: string[];
  /** 优化建议 */
  suggestions: string[];
  /** 指标详情 */
  metrics: PerformanceMetrics;
}
