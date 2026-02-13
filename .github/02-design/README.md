# Pixuli 设计文档

本目录存放 Pixuli 项目的架构与方案设计文档，用于跨端协作、排期与对外展示。文档与产品需求（`.github/01-product/`）和代码实现保持同步更新。

---

## 文档索引

| 序号 | 文档                                                                                                       | 主题概要                | 关键内容                                                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | [01-cross-platform-resources.md](./01-cross-platform-resources.md)                                         | 跨端资源共享            | 基于 `packages/common` 的三端（Web/Desktop/Mobile）代码复用、三层架构（资源共享层 / 平台导出层 / 平台层）、组件/Hooks/服务/类型/国际化拆分与平台适配策略 |
| 02   | [02-cross-image-process.md](./02-cross-image-process.md)                                                   | 跨端图片处理            | 统一接口 + 平台适配器：Web/PC 用 Rust WASM（压缩/转换/分析/编辑），Mobile 用 expo-image-manipulator；ImageProcessorService 抽象、批量处理与格式支持      |
| 03   | [03-performance.md](./03-performance.md)                                                                   | 性能优化与监控          | 虚拟滚动、懒加载、无限滚动、Web Worker/后台线程数据处理、资源优化；性能指标收集与上报、性能面板与告警，跨平台适配                                        |
| 04   | [04-cross-platform-logging.md](./04-cross-platform-logging.md)                                             | 跨端日志收集            | LogInterceptorService 拦截 console、日志存储与过滤、DevTools 可视化、导出与跨平台（Web/Electron/React Native）一致体验                                   |
| 05   | [05-Dify-Integration-And-Image-Processing-Design.md](./05-Dify-Integration-And-Image-Processing-Design.md) | Dify 接入与图片处理选型 | 图片分析（image→text）、图片生成（text→image）的 Dify 工作流 API 设计；压缩/编辑/格式转换采用传统方式（WASM/Sharp/原生），智能编辑可选 Dify              |

---

## 各文档简介（便于展示到文档站/README）

### 01 - 跨端资源共享设计方案

- **目标**：最大化三端代码复用，保证功能与体验一致，便于维护与类型安全。
- **要点**：Web/Desktop 与 React Native 的运行环境区分；`packages/common`
  内组件、Hooks、工具、服务、类型、语言包的分层与平台导出；纯函数与平台适配原则。

### 02 - 跨端高性能图片处理方案设计

- **目标**：跨端统一的图片处理 API，Web/PC 高性能（WASM），Mobile 轻量（原生）。
- **要点**：压缩（WebP/JPEG/PNG）、格式转换、基础信息与 AI 分析、编辑（裁剪/旋转/翻转/滤镜）；统一接口与平台适配器，批量处理与错误处理。

### 03 - 性能优化与监控设计方案

- **目标**：提升加载与渲染性能、控制内存与带宽，并可持续监控与告警。
- **要点**：虚拟列表、懒加载与无限滚动、Worker/后台线程数据处理、资源与代码分割；性能指标收集、上报、可视化与跨平台适配。

### 04 - 跨端日志输出收集设计方案

- **目标**：统一日志接口、拦截收集 console、支持过滤/导出与可视化，且不拖累性能。
- **要点**：LogInterceptorService
  API、LogEntry 结构、监听器与最大条数限制；DevTools 浮球与面板、级别过滤与导出。

### 05 - Dify 工作流接入与图片处理方案设计

- **目标**：明确图片分析/生成通过 Dify 工作流接入方式，以及压缩/编辑/转换的实现选型。
- **要点**：Dify 工作流 run
  API、分析（image→text）与生成（text→image）的输入输出约定、配置与安全；压缩/转换/基础编辑用 WASM/服务端/原生，智能编辑可选 Dify；与 PRD 及可选 Pixuli
  Server 的衔接。

---

## 使用说明

- **阅读顺序**：可按 01 → 02 → 03 → 04 → 05 理解整体架构，再按需求查阅单篇。
- **关联**：设计文档与 [01-product](../01-product/) 下的 PRD 对应，实现分布在
  `apps/`、`packages/common`、`packages/wasm`、`server/`。
- **展示**：本 README 的「文档索引」与「各文档简介」可直接用于文档站、项目 README 或对外导航。
