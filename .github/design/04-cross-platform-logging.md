# 📝 跨端日志输出收集设计方案

本文档详细描述了 Pixuli 项目中跨平台（PC端、移动端、Web端）的日志输出收集方案。

---

## 🎯 设计目的

### 核心目标

- **统一日志接口**：提供跨平台的统一日志接口，简化日志使用
- **日志拦截收集**：自动拦截和收集所有 console 输出，便于调试和问题排查
- **日志管理**：提供日志过滤、搜索、导出等功能
- **跨平台支持**：支持 PC 端（Electron）、移动端（React
  Native）和 Web 端的日志收集
- **性能优化**：日志收集不影响应用性能
- **开发体验**：提供可视化的日志查看工具（DevTools）

### 解决的问题

- **日志分散**：不同平台的日志输出方式不同，难以统一管理
- **日志丢失**：控制台日志在刷新后丢失，无法追溯历史问题
- **调试困难**：生产环境无法查看控制台，难以定位问题
- **日志格式不统一**：不同开发者输出的日志格式不一致，难以分析
- **性能影响**：大量日志输出可能影响应用性能

---

## 📦 负责内容

### 核心功能模块

#### 1. 日志拦截服务 (LogInterceptorService)

##### 1.1 功能特性

- **自动拦截**：自动拦截所有 console 方法（log、info、warn、error、debug）
- **原始输出保留**：拦截后仍保留原始 console 输出，不影响正常调试
- **日志存储**：将拦截的日志存储在内存中，支持最大日志数量限制
- **事件通知**：支持监听器模式，实时通知日志变化
- **跨平台兼容**：Web 端使用 console 拦截，移动端支持手动添加日志

##### 1.2 日志数据结构

```typescript
interface LogEntry {
  id: string; // 唯一标识
  level: LogLevel; // 日志级别：log | info | warn | error | debug
  message: string; // 日志消息
  args: any[]; // 原始参数
  timestamp: number; // 时间戳
  stack?: string; // 堆栈信息（仅 error 和 warn）
}
```

##### 1.3 API 设计

```typescript
class LogInterceptorService {
  // 开始拦截日志
  start(): void;

  // 停止拦截日志
  stop(): void;

  // 手动添加日志（用于 Native 平台）
  addManualLog(level: LogLevel, message: string, args?: any[]): void;

  // 获取所有日志
  getLogs(): LogEntry[];

  // 获取指定级别的日志
  getLogsByLevel(level: LogLevel): LogEntry[];

  // 清空日志
  clearLogs(): void;

  // 添加日志监听器
  addListener(listener: LogListener): void;

  // 移除日志监听器
  removeListener(listener: LogListener): void;

  // 设置最大日志数量
  setMaxLogs(max: number): void;
}
```

#### 2. DevTools 组件

##### 2.1 功能特性

- **日志查看**：实时显示所有拦截的日志
- **日志过滤**：按日志级别过滤日志
- **自动滚动**：支持自动滚动到最新日志
- **日志导出**：支持导出日志为 JSON 文件
- **性能监控**：集成性能监控功能，显示性能指标
- **国际化支持**：支持中英文切换
- **可拖动图标**：浮球按钮支持拖动到任意位置
- **全屏显示**：面板高度撑满视口，提供更好的查看体验

##### 2.2 UI 设计

- **浮球按钮**：固定在右下角，可拖动到任意位置
- **侧边面板**：从右侧滑出，高度撑满视口
- **标签页**：日志和性能两个标签页
- **日志列表**：支持滚动查看，显示日志级别、时间、消息和堆栈信息
- **性能指标**：以卡片形式展示关键性能指标

#### 3. 跨平台适配

##### 3.1 Web 平台

- **实现方式**：拦截全局 console 对象的方法
- **优势**：自动捕获所有 console 输出
- **限制**：无法捕获非 console 的日志输出

##### 3.2 Electron 平台

- **实现方式**：与 Web 平台相同，通过拦截 console 方法
- **特殊处理**：支持主进程和渲染进程的日志收集
- **集成**：可集成 Electron 的日志系统

##### 3.3 React Native 平台

- **实现方式**：手动调用 `addManualLog` 方法添加日志
- **适配器**：提供 React Native 专用的日志适配器
- **集成**：可集成 React Native 的日志库（如 react-native-logs）

---

## 🏗️ 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                   应用层 (Apps)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   Web    │  │ Desktop  │  │  Mobile  │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
└───────┼─────────────┼──────────────┼──────────────────┘
        │             │              │
        └─────────────┼──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   packages/common          │
        │  ┌──────────────────────┐  │
        │  │  DevTools Component  │  │
        │  └──────────┬───────────┘  │
        │             │              │
        │  ┌──────────▼───────────┐  │
        │  │ LogInterceptorService│  │
        │  └──────────────────────┘  │
        └────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │      Platform APIs         │
        │  ┌──────────┐  ┌────────┐ │
        │  │ Console  │  │ Native │ │
        │  └──────────┘  └────────┘ │
        └────────────────────────────┘
```

### 模块关系

1. **LogInterceptorService**：核心服务，负责日志拦截和存储
2. **DevTools Component**：UI 组件，负责日志展示和交互
3. **Platform Adapters**：平台适配器，处理不同平台的差异

---

## 🔧 实现细节

### 1. 日志拦截实现

#### Web/Electron 平台

```typescript
// 保存原始 console 方法
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

// 拦截 console.log
console.log = (...args: any[]) => {
  originalConsole.log(...args); // 保留原始输出
  addLog('log', args); // 添加到日志收集
};
```

#### React Native 平台

```typescript
// 手动添加日志
logInterceptorService.addManualLog('info', 'User logged in', { userId: '123' });
```

### 2. 日志存储策略

- **内存存储**：日志存储在内存数组中
- **数量限制**：默认最多保存 1000 条日志，超出后删除最旧的日志
- **性能优化**：使用数组的 shift 方法删除旧日志，保持 O(1) 复杂度

### 3. 事件通知机制

- **监听器模式**：使用 Set 存储监听器，支持多个监听器
- **实时通知**：每次添加日志时立即通知所有监听器
- **错误处理**：监听器执行错误不影响日志收集

### 4. DevTools 组件实现

#### 拖动功能

```typescript
// 使用鼠标事件实现拖动
const handleMouseDown = (e: MouseEvent) => {
  setIsDragging(true);
  dragStartPos.current = {
    x: e.clientX - buttonPosition.x,
    y: e.clientY - buttonPosition.y,
  };
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging) return;
  // 计算新位置并限制在视口内
  setButtonPosition({ x: newX, y: newY });
};
```

#### 国际化支持

```typescript
// 使用翻译函数
const translate = t || defaultTranslate;
const title = translate('devtools.title');
```

---

## 📊 数据流

### 日志收集流程

```
Console Output
    │
    ├─→ Original Console (保留原始输出)
    │
    └─→ LogInterceptorService
            │
            ├─→ 格式化日志
            │
            ├─→ 存储到内存数组
            │
            ├─→ 检查数量限制
            │
            └─→ 通知监听器
                    │
                    └─→ DevTools Component
                            │
                            └─→ 更新 UI
```

### 日志查看流程

```
User Interaction
    │
    ├─→ 打开 DevTools
    │
    ├─→ 选择标签页（日志/性能）
    │
    ├─→ 应用过滤器
    │
    └─→ 显示过滤后的日志
```

---

## 🎨 UI/UX 设计

### 设计原则

1. **非侵入性**：浮球按钮不遮挡主要内容
2. **可拖动**：支持拖动到任意位置，适应不同屏幕布局
3. **全屏显示**：面板高度撑满，提供更好的查看体验
4. **响应式**：适配不同屏幕尺寸
5. **国际化**：支持中英文切换

### 视觉设计

- **浮球按钮**：渐变背景，圆形设计，带阴影效果
- **面板**：白色背景，从右侧滑出，高度撑满
- **日志项**：根据日志级别显示不同颜色边框和背景
- **性能指标**：卡片式布局，清晰展示关键指标

---

## 🔒 安全与隐私

### 数据安全

- **本地存储**：日志仅存储在本地内存，不发送到服务器
- **敏感信息过滤**：建议在日志中避免输出敏感信息（密码、token 等）
- **导出控制**：用户可手动导出日志，完全由用户控制

### 隐私保护

- **生产环境**：建议在生产环境禁用日志拦截或限制日志数量
- **日志清理**：提供清空日志功能，用户可随时清理
- **数据保留**：日志仅在内存中保留，刷新页面后自动清除

---

## 📈 性能考虑

### 优化策略

1. **数量限制**：限制最大日志数量，避免内存溢出
2. **异步处理**：日志格式化使用异步处理，不阻塞主线程
3. **批量更新**：UI 更新使用批量更新，减少渲染次数
4. **虚拟滚动**：如果日志数量很大，可考虑使用虚拟滚动

### 性能指标

- **内存占用**：1000 条日志约占用 1-2MB 内存
- **CPU 影响**：日志拦截对 CPU 影响可忽略不计
- **渲染性能**：DevTools 组件使用 React.memo 优化渲染

---

## 🧪 测试策略

### 单元测试

- **LogInterceptorService**：测试日志拦截、存储、过滤等功能
- **DevTools Component**：测试 UI 交互、国际化、拖动等功能

### 集成测试

- **跨平台测试**：测试 Web、Electron、React Native 平台的兼容性
- **性能测试**：测试大量日志时的性能表现

---

## 📚 使用示例

### Web 平台

```typescript
import { DevTools, logInterceptorService } from '@packages/common/src';

// 日志拦截会自动启动
// 使用 DevTools 组件
<DevTools performanceMonitor={monitor} t={t} />
```

### React Native 平台

```typescript
import { logInterceptorService } from '@packages/common/src';

// 手动添加日志
logInterceptorService.addManualLog('info', 'User action', { action: 'click' });
```

---

## 🔮 未来规划

### 功能扩展

1. **日志搜索**：支持关键词搜索日志
2. **日志分类**：支持按模块、功能分类日志
3. **日志持久化**：支持将日志保存到本地存储
4. **远程日志**：支持将日志发送到远程服务器
5. **日志分析**：提供日志分析工具，自动发现常见问题

### 性能优化

1. **虚拟滚动**：实现虚拟滚动，支持显示大量日志
2. **日志压缩**：对重复日志进行压缩
3. **采样策略**：在日志量过大时使用采样策略

---

## 📝 总结

跨端日志输出收集方案提供了统一的日志管理接口，支持 Web、Electron 和 React
Native 平台。通过自动拦截 console 输出和提供可视化的 DevTools 组件，大大提升了开发调试效率和问题排查能力。方案设计考虑了性能、安全、隐私等多个方面，确保在生产环境中也能安全使用。
