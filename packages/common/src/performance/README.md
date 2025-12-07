# 性能监控模块

性能监控模块提供了跨平台的性能指标收集、分析和上报功能。

## 功能特性

- ✅ **多维度指标收集**：渲染性能、加载性能、内存使用、网络性能、用户交互
- ✅ **实时监控**：支持实时和批量上报
- ✅ **性能分析**：自动分析性能问题并提供优化建议
- ✅ **灵活上报**：支持控制台输出和HTTP上报
- ✅ **可配置**：丰富的配置选项，支持采样率、阈值等

## 快速开始

### Web端使用

性能监控已在web应用中自动初始化，无需额外配置。

```typescript
import { performanceService } from './services/performanceService';

// 获取当前性能指标
const metrics = performanceService.getMetrics();

// 分析性能
const analysis = performanceService.analyze();

// 手动收集并上报
performanceService.collectAndReport('render');
```

### 自定义配置

```typescript
import { performanceService } from './services/performanceService';

performanceService.init({
  enabled: true,
  sampleRate: 1.0, // 采样率 0-1
  reportInterval: 5000, // 上报间隔(ms)
  realtimeReport: false, // 是否实时上报
  thresholds: {
    fps: 55, // FPS阈值
    memoryUsage: 80, // 内存使用率阈值(%)
    longTask: 50, // 长任务阈值(ms)
    pageLoadTime: 3000, // 页面加载时间阈值(ms)
  },
  reportUrl: 'https://api.example.com/performance', // 上报URL
  consoleOutput: true, // 是否在控制台输出
});
```

## 性能指标说明

### 渲染性能 (Render Metrics)

- `fps`: 帧率 (FPS)
- `frameTime`: 单帧渲染时间 (ms)
- `repaintCount`: 重绘次数
- `reflowCount`: 重排次数
- `longTaskCount`: 长任务数量
- `longTaskDuration`: 长任务总耗时 (ms)

### 加载性能 (Load Metrics)

- `pageLoadTime`: 页面加载时间 (ms)
- `firstContentfulPaint`: 首屏渲染时间 (ms)
- `largestContentfulPaint`: 最大内容绘制时间 (ms)
- `domReadyTime`: DOM就绪时间 (ms)
- `resourceLoadTime`: 资源加载时间 (ms)
- `dnsTime`: DNS查询时间 (ms)
- `tcpTime`: TCP连接时间 (ms)
- `sslTime`: SSL握手时间 (ms)
- `ttfb`: Time To First Byte (ms)

### 内存使用 (Memory Metrics)

- `usedJSHeapSize`: 当前内存使用量 (MB)
- `totalJSHeapSize`: 总堆内存 (MB)
- `jsHeapSizeLimit`: 堆内存限制 (MB)
- `memoryUsage`: 内存使用率 (%)

### 网络性能 (Network Metrics)

- `requestCount`: 请求总数
- `successCount`: 成功请求数
- `errorCount`: 失败请求数
- `averageRequestTime`: 平均请求时间 (ms)
- `totalTransferSize`: 总传输大小 (KB)
- `cacheHitCount`: 缓存命中数
- `cacheHitRate`: 缓存命中率 (%)

### 用户交互 (Interaction Metrics)

- `clickResponseTime`: 点击响应时间 (ms)
- `scrollFps`: 滚动流畅度 (FPS)
- `inputDelay`: 输入延迟 (ms)

## 环境变量配置

在 `.env` 文件中配置：

```env
# 性能监控上报URL
VITE_PERFORMANCE_REPORT_URL=https://api.example.com/performance

# 是否在控制台输出性能数据 (默认: true)
VITE_PERFORMANCE_CONSOLE_OUTPUT=true
```

## 开发调试

在开发环境下，性能监控实例会挂载到
`window.__performanceMonitor`，可以在浏览器控制台中直接使用：

```javascript
// 获取性能指标
window.__performanceMonitor.getMetrics();

// 分析性能
window.__performanceMonitor.analyze();

// 手动收集
window.__performanceMonitor.collectAndReport('render');
```

## API参考

### PerformanceMonitor

性能监控主类，负责指标收集、分析和上报。

#### 方法

- `init()`: 初始化性能监控
- `collectAndReport(type?, options?)`: 收集并上报性能指标
- `getMetrics()`: 获取当前性能指标
- `analyze()`: 分析性能并返回分析结果
- `updateConfig(config)`: 更新配置
- `reset()`: 重置收集器
- `destroy()`: 销毁监控服务

### PerformanceService

Web端性能监控服务单例，提供便捷的API。

#### 方法

- `init(config?)`: 初始化性能监控
- `getMonitor()`: 获取性能监控实例
- `collectAndReport(type?)`: 收集并上报性能指标
- `getMetrics()`: 获取当前性能指标
- `analyze()`: 分析性能
- `updateConfig(config)`: 更新配置
- `destroy()`: 销毁性能监控

## 性能目标

根据性能设计文档，性能目标如下：

- **FPS**: > 55fps
- **页面加载时间**: < 3s
- **首屏渲染时间**: < 1s
- **内存使用率**: < 80%
- **长任务**: < 50ms

## 注意事项

1. 性能监控会收集性能数据，注意数据隐私
2. 上报数据量较大时，建议使用批量上报
3. 生产环境建议关闭控制台输出
4. 性能监控本身也会消耗一定资源，合理设置采样率
