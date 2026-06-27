# 变更日志

本文记录 Pixuli 各平台（Desktop、Web、Mobile）的重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循
[语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

> **M1 减负与归档**（REF-101～REF-112，2025–2026）。详细 backlog：[docs/04-backlog.md](docs/04-backlog.md)。重构追踪：[REFACTOR_PLAN.md](REFACTOR_PLAN.md)。

适用于重构分支 `main` 上的
**Web**、**Desktop**、**Mobile**。**基线产品版本：2.0.0**（三端统一 semver，相对 1.x 为 MAJOR）。下次打 tag 预计为
`v2.0.0-desktop`、`v2.0.0-android`、`v2.0.0-web`。见
[03-release-versioning.md](docs/01-product/03-release-versioning.md)（REF-409）。

### ⚠️ 破坏性变更

#### 产品 — 已移除（不计划恢复）

- **幻灯片（Slideshow）** — 独立路由、播放器、自动播放
- **时间线（Timeline）** — 按时间分组浏览
- **照片墙（Photo Wall）** 与 **3D 画廊** — 增强展示组件
- **浏览模式 Tab** — 文件 / 幻灯片 / 时间线切换；改为 `/photos` 图床网格/列表
- **Web 占位路由** — `analyze`、`edit`、`generate`（重定向至 `/photos`）
- **Mobile（归档 RN）** — 浏览模式 Tab 与 `SlideShowPlayer`
  已移除；主线为 Capacitor + `apps/pixuli`

**新导航（Web/Desktop）：** 照片 · 压缩 · 转换 · 设置。

#### 架构 — 移除或归档

- **`packages/wasm`** — 迁至 `archive/wasm/`；移出 `pnpm` workspace
- **`benchmark/`** — 迁至 `archive/benchmark/`
- **`server/`**（NestJS）— 迁至 `archive/server/`；**非**官方交付物
- **`apps/mobile`**（Expo RN）— 迁至
  `archive/apps/mobile/`（REF-513）；Mobile 由 Capacitor 交付
- **Electron WASM IPC** 与 **`pixuli-wasm`** 依赖 — 已从 Desktop 构建移除
- **`performance` / `devtools`** — 未接入 UI 模块已删
- **`pptxgenjs`** 及幻灯片相关依赖 — 已移除

#### 行为变更

- **图片处理** — Web/Desktop 渲染进程使用
  **Canvas**；主应用构建与运行**不再需要** Rust WASM
- **Desktop 开发** — **不再需要** Rust 工具链（WASM 已归档）
- **Gitee 图片** — `apps/pixuli` 已移除 Host 代理，改为本地工作区 + 直连 raw
  URL；全仓收官见 REF-607 P7（#173）
- **三端工程** — Web / Desktop / Mobile 共用 `apps/pixuli` +
  `@pixuli/ui`（REF-514、REF-516）

### 迁移说明

| 若你曾使用…                                | 现在…                                                           |
| ------------------------------------------ | --------------------------------------------------------------- |
| 幻灯片 / 时间线 / 照片墙                   | 使用 `/photos` 网格/列表；见 [backlog](docs/04-backlog.md)      |
| Desktop WASM / Rust AI                     | Canvas 处理；WASM 见 `archive/wasm/`                            |
| 官方 NestJS Server                         | 自建见 `archive/server/` 或自定义 `StorageProvider`             |
| Expo RN `apps/mobile`                      | 使用 Capacitor Android APK；归档代码见 `archive/apps/mobile/`   |
| Release `v1.3.0-desktop` / `v1.0.0-mobile` | 1.x 线；升级目标为 **2.0.0**（非 1.4.x）；请先读 `[Unreleased]` |

---

## 🖥️ Desktop

### [Unreleased]

见上方 **[Unreleased](#unreleased)** 中 M1 破坏性变更。

#### 🔧 变更（重构分支）

- Desktop 与 Web 共用 `apps/pixuli` + `@pixuli/ui`
- 工程整理见 REF-514（#152）

---

### [1.3.0][1.3.0] - 2025-11-21

#### ✨ 新增

- **增强元数据标签**：支持多标签；修复上传时标签丢失
- **图片浏览器 UI**：统一卡片高度；修复列表模式问题
- **仓库源管理布局**：改为纵向列表；折叠动画
- **上传组件增强**：支持压缩

#### 🔧 变更

- 修复 Desktop 上传/编辑/删除时全屏 loading 卡死
- 优化图片尺寸与文件大小获取
- 优化 Gitee 存储服务元数据加载
- 优化 release-desktop 流水线；支持选分支与平台发版
- 代码优化与功能改进

#### 🐛 修复

- 修复 TypeScript 编译错误
- 修复 Gitee 元数据加载问题
- 修复标签相关缺陷

#### 🗑️ 移除

- **又拍云（Upyun）仓库源** — 已移除

#### 🎯 技术

- 全平台升级至 React 19.1.0
- 实现幻灯片功能并迁入 common 组件库

> **历史注记（REF-409）：** 幻灯片已在 post-M1 的 `main`
> 分支移除。安装本 Release 的旧版本仍含幻灯片。

---

### [1.2.0][1.2.0] - 2025-10-26

#### ✨ 新增

- **操作日志**：完整记录与查看
- **批量删除图片**
- **Gitee 存储**：与 GitHub 双源；配置页、导入/导出、清空；可与 GitHub 共存
- **系统托盘**：可从托盘打开压缩/转换独立窗口
- **版本信息查看**
- **左侧菜单折叠**（状态持久化）
- **ESC 快捷键**关闭对话框
- **预览增强**：左右键切换当前预览图
- **AI 分析优化**：迁移至 Rust WASM；优化标签与描述生成
- **图片尺寸优化**

#### 🔧 变更

- 重构目录与数据管理
- 组件国际化与压缩服务整理
- 优化 WASM 构建与校验
- 多架构 Mac 与 Linux 支持
- 优化 electron-builder；排除 pixuli-wasm 无用文件
- 修复 Desktop 布局滚动
- 统一 Dialog 开关方式
- 优化 App.tsx 状态归属

#### 🎯 技术

- 重构为 Monorepo
- Web/Desktop 共用组件迁入 packages/ui
- Desktop 替换重复组件
- 移除 Tailwind，改用自定义 CSS
- 增加 Prettier
- 语言包重构；Toast 国际化修复
- Electron CSP 优化

---

### [1.1.0][1.1.0] - 2025-09-15

#### ✨ 新增

- **图片压缩**：独立压缩窗口；WebP；可调质量；批量与预览
- **格式转换**：JPEG / PNG / WebP；批量与预览
- **GitHub 配置增强**：导入/导出/清空
- **又拍云存储**（后续版本已移除）
- **菜单栏**
- **国际化改进**
- **布局优化**

#### 🔧 变更

- 修复构建问题
- 优化文档结构
- 修复 wasm import 持久化问题

---

### [1.0.0][1.0.0] - 2025-09-13

> **发布说明：** Git tag `v1.0.0-desktop` 对应本条目；GitHub
> Release 页面于 2025-11-12 发布但**无**安装包。见
> [03-release-versioning.md](docs/01-product/03-release-versioning.md)。

#### ✨ 新增

- Desktop 首个版本
- **图片管理**：网格、拖拽上传、全屏预览、元数据、搜索、标签
- **GitHub 集成**：配置管理；仓库作图床后端
- **主题**：明暗切换
- **多语言**：中/英
- **多窗口**：主窗口、压缩、转换、AI 分析

#### 🎯 技术

- Electron + React + TypeScript
- Rust WASM 高性能图片处理
- macOS（x64、ARM64）与 Windows（x64）
- WASM 重构与 AI 优化

---

## 🌐 Web

### [Unreleased]

见上方 **[Unreleased](#unreleased)** 中 M1 破坏性变更。

#### 🔧 变更（重构分支）

- PWA 与网格/列表图床为主 UX；三端单工程 `apps/pixuli`

> **说明：** 下方旧版 Web `[Unreleased]`
> 草稿（如曾写「新增幻灯片」）描述 M1 之前工作，在下次发版前以本节
> **破坏性变更** 为准。

---

## 📱 Mobile

### [Unreleased]

见上方 **[Unreleased](#unreleased)** 中 M1 破坏性变更。

#### ⚠️ 破坏性变更（摘要）

- 归档 RN 的浏览模式 Tab 与幻灯片播放器已移除
- 主线：**Capacitor Android** + 与 Web/Desktop 同一套 UI（REF-509～516）

---

### [1.0.0][1.0.0-mobile] - 2025-11-21

> **M1 前 Release。** 含幻灯片与浏览模式；重构分支已移除。从该 tag 升级请先读
> `[Unreleased]`。

#### ✨ 新增

- Android 首个版本（Expo RN）
- **图片管理**：浏览、上传、删除、预览
- **图片处理**：压缩、转换、尺寸调整、裁剪
- **云存储**：GitHub、Gitee
- **搜索与筛选**：名称、标签/尺寸/日期、排序
- **相机**：拍照上传、拍后编辑
- **幻灯片**：自动播放、顺序/随机、转场、循环、控制条、缩略图列表、信息面板
- **主题**：明/暗/跟随系统
- **多语言**：中/英
- **响应式布局**

#### 🎯 技术

- React Native 0.81.5 · Expo SDK 54 · TypeScript

#### ⚠️ 已知问题

- iOS 尚未发版
- 批量上传开发中

---

[Unreleased]: https://github.com/trueLoving/Pixuli/compare/v1.3.0-desktop...HEAD

<!-- Desktop -->

[1.3.0]: https://github.com/trueLoving/Pixuli/releases/tag/v1.3.0-desktop
[1.2.0]: https://github.com/trueLoving/Pixuli/releases/tag/v1.2.0-desktop
[1.1.0]: https://github.com/trueLoving/Pixuli/releases/tag/v1.1.0-desktop
[1.0.0]: https://github.com/trueLoving/Pixuli/releases/tag/v1.0.0-desktop

<!-- Mobile -->

[1.0.0-mobile]: https://github.com/trueLoving/Pixuli/releases/tag/v1.0.0-mobile
