# Pixuli 产品需求规格说明书（基线）

- **文档版本**：2.1
- **创建日期**：2025-01-27
- **最后更新**：2026-06-06（合并 PRD + 范围裁剪清单）
- **适用分支**：`main`（M1～M3 重构后基线）
- **项目名称**：Pixuli — 智能图床客户端
- **读者**：产品、开发、测试、运维

---

## 一、文档概述

### 1.1 目的

本文档为 **M1～M3 重构后基线** 的单一产品需求规格说明，涵盖：

- 产品底线、范围与 M1 裁剪
- 功能与非功能需求及验收状态
- 架构摘要与路线图索引

### 1.2 范围

- 产品经理、项目经理：需求理解与排期
- 开发工程师：功能实现与接口设计
- 测试工程师：测试用例设计与验收标准
- 运维与部署：运行环境与约束

### 1.3 术语与缩写

| 术语     | 说明                                         |
| -------- | -------------------------------------------- |
| PRS      | 产品需求规格说明书（本文档）                 |
| PWA      | 渐进式 Web 应用（Progressive Web App）       |
| CRUD     | 创建 / 读取 / 更新 / 删除                    |
| Monorepo | 单一代码库管理多个包/应用                    |
| Provider | 存储插件实现（`StorageProvider`）            |
| Registry | `StoragePluginRegistry`，注册与创建 Provider |

---

## 二、产品底线与范围

### 2.1 产品底线（不变）

| 项              | 说明                                                                                    |
| --------------- | --------------------------------------------------------------------------------------- |
| **交付形态**    | **Web（含 PWA）**、**Desktop（Electron）**、**Mobile（Expo）** 三端继续维护             |
| **存储后端**    | 以 **GitHub / Gitee 仓库**为图床；通过 `StorageProvider` 插件扩展                       |
| **官方 Server** | **不提供**官方 NestJS / 自建后端为一等公民；`server/` 已归档，仅社区或自建对接          |
| **对外主张**    | 🖼️ Pixuli — **AI-based image analysis, automatic tag generation, and batch processing** |

### 2.2 M1 展示裁剪（已从产品移除）

以下能力在 **M1（REF-101～107）** 已从主应用移除，**不再作为需求验收项**。明细见
[backlog.md](../backlog.md)（REF-402）。

| 已移除能力                       | 说明                                                            |
| -------------------------------- | --------------------------------------------------------------- |
| 幻灯片（Slideshow）              | 独立路由与播放器                                                |
| 时间线（Timeline）               | 按时间分组浏览                                                  |
| 照片墙（Photo Wall）             | 增强展示组件                                                    |
| 3D 画廊（Gallery 3D）            | 增强展示组件                                                    |
| 浏览模式多路由切换               | 文件/幻灯片/时间线 Tab；现统一为 **图床网格/列表**（`/photos`） |
| 占位页 analyze / edit / generate | 未接入主流程的独立路由（重定向至图床）                          |

**当前 Web/Desktop 主导航**：图床（`/photos`）· 实用工具（压缩 `/compress`、转换
`/convert`）· 设置。

### 2.3 不在官方范围内的能力

| 项                                 | 处理方式                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `packages/wasm`、WASM IPC          | 已归档至 `archive/`；Web/桌面图片处理以 Canvas 等为主                           |
| `benchmark/`                       | 已归档，非主构建路径                                                            |
| `server/`（NestJS）                | 已移出 workspace；**非官方交付物**                                              |
| `packages/common`（pixuli-common） | M3 REF-311 已删除；由 `@pixuli/core` + `@pixuli/ui` + `@pixuli/provider-*` 替代 |
| 官方 Upyun 等第三方图床            | 非 M3 P0；可经插件扩展，见 backlog                                              |

### 2.4 当前架构与包（产品视角）

```text
apps/pixuli     Web + Desktop 共用（Vite + React + Electron）
apps/mobile     Mobile（Expo + RN，过渡；长期倾向 Capacitor 复用 pixuli，见 M5）
packages/core   类型、工具、StoragePluginRegistry 契约
packages/ui     Web/Desktop 共享 UI（@pixuli/ui）；RN 子路径 ./native
packages/plugin-provider-github | plugin-provider-gitee  官方存储插件
archive/        wasm、benchmark、历史 server（不参与日常构建）
```

### 2.5 规划中能力（里程碑）

| 里程碑 | 产品向交付                                   | 计划 Issue   |
| ------ | -------------------------------------------- | ------------ |
| **M4** | PRD/README/Wiki/CHANGELOG 与现架构一致       | REF-401～415 |
| **M5** | PWA 深化、Desktop L3；Capacitor 三端共享 PoC | REF-501～510 |
| **M6** | 三端交互规范、UI、性能边界、标签/AI、批处理  | REF-601～605 |

详见 [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md)。

---

## 三、项目概述

### 3.1 背景

Pixuli 源于两类需求：

1. **实际需求**：博客与网站运营中统一的图片存储、压缩与批量处理需求。
2. **技术实践**：在已有 Vue3 图片管理应用经验基础上，使用 React 技术栈重新实现，并扩展至多平台（Web、桌面、移动端）。

### 3.2 产品定位

Pixuli 是一款**基于 Monorepo 的智能图床客户端**，三端持续交付：

- **Web**：Vite + React，支持 PWA 与在线部署
- **Desktop**：与 Web **共用同一套 UI**（Electron 壳）
- **Mobile**：React Native + Expo（过渡）；长期目标为 Capacitor 复用
  `apps/pixuli`（见 M5）

**核心价值**：

- 以 **GitHub / Gitee 仓库**为存储后端（`@pixuli/provider-*` 插件）
- **官方不提供** NestJS Server；自托管后端仅社区/自建扩展
- 图床主界面为 **网格/列表**（§2.2 已裁剪增强展示）

### 3.3 目标用户

- 个人博客 / 静态站运营者：需要稳定、可版本化的图床
- 内容创作者：需要批量上传、压缩与格式转换
- 开发者与运维：需要自托管、可集成的图片管理能力

---

## 四、系统架构与技术栈

### 4.1 项目结构

```
Pixuli/
├── apps/
│   ├── pixuli/              # Web + Desktop 统一应用（Vite + React + Electron）
│   └── mobile/              # Mobile（Expo + RN，过渡）
├── packages/
│   ├── core/                # @pixuli/core — 类型、工具、插件 Registry 契约
│   ├── ui/                  # @pixuli/ui — Web/Desktop 共享 UI（./native 供 RN）
│   ├── plugin-provider-github/
│   └── plugin-provider-gitee/
├── archive/                 # wasm、benchmark、历史 server（非主构建）
├── docs/                    # 产品 / 系统设计 / 业务设计文档
└── REFACTOR_PLAN.md         # 重构与 Issue 追踪
```

### 4.2 技术栈概览

| 层级       | 技术                                | 说明                                    |
| ---------- | ----------------------------------- | --------------------------------------- |
| 前端框架   | React 19 + TypeScript               | Web/Desktop 统一 UI                     |
| 构建工具   | Vite                                | Web/Desktop 构建；Desktop 叠加 Electron |
| 桌面运行时 | Electron                            | 跨平台桌面                              |
| 移动端     | React Native + Expo                 | 独立工程；M5 Capacitor 为长期方向       |
| 状态管理   | Zustand                             | imageStore / sourceStore 等             |
| 存储插件   | StorageProvider + Registry          | 官方 GitHub/Gitee provider 包           |
| 图片处理   | Canvas API / expo-image-manipulator | Web/Desktop 渲染进程；Mobile 原生       |
| 云存储     | GitHub API / Gitee API              | Gitee Web 需图片代理（REF-313）         |

### 4.3 平台能力矩阵

> 幻灯片/时间线等已从产品移除（§2.2）。下表为**重构后目标态**；⏳ 项见 M5/M6。

| 能力                           | Web  | Desktop                    | Mobile        |
| ------------------------------ | ---- | -------------------------- | ------------- |
| 多仓库源（GitHub/Gitee 插件）  | ✅   | ✅                         | ✅            |
| 图床网格/列表 + 预览           | ✅   | ✅                         | ✅            |
| 图片 CRUD（单张）              | ✅   | ✅                         | ✅            |
| 批量上传 / 批量删除            | ✅   | ✅                         | ✅            |
| 批量元数据 / 批处理增强        | ⏳   | ⏳                         | ⏳ M6 REF-605 |
| 标签与描述 + AI 分析           | 部分 | 部分（Desktop 有 AI 基础） | ⏳ M6 REF-604 |
| 搜索与筛选                     | ✅   | ✅                         | ✅            |
| 操作日志                       | ✅   | ✅                         | ✅            |
| PWA（安装/离线壳）             | ✅   | —                          | —             |
| 压缩 / 格式转换工具页          | 部分 | 部分                       | ✅ 部分       |
| Desktop 离线队列/自动更新/托盘 | —    | ⏳ M5                      | —             |
| 大规模列表性能边界             | ⏳   | ⏳                         | ⏳ M6 REF-603 |
| 相机 / 相册                    | —    | —                          | ✅            |

---

## 五、功能需求

### 5.1 仓库源管理（已实现）

**概述**：用户可配置多个 GitHub 或 Gitee 仓库作为图片存储源，并可在源之间切换。M3 起通过
`StoragePluginRegistry` 与 `StoredSourceEntry`（含 `pluginId`）管理。

| ID           | 需求                                                     | 优先级 | 状态 | 平台   |
| ------------ | -------------------------------------------------------- | ------ | ---- | ------ |
| F-SOURCE-001 | 支持添加多个 GitHub 仓库源                               | P0     | ✅   | 全平台 |
| F-SOURCE-002 | 支持添加多个 Gitee 仓库源                                | P0     | ✅   | 全平台 |
| F-SOURCE-003 | 支持在已配置源之间切换为当前活跃源                       | P0     | ✅   | 全平台 |
| F-SOURCE-004 | 支持编辑与删除已有仓库源                                 | P0     | ✅   | 全平台 |
| F-SOURCE-005 | 配置持久化（Web/桌面：localStorage；移动：AsyncStorage） | P0     | ✅   | 全平台 |
| F-SOURCE-006 | 配置表单校验                                             | P1     | ✅   | 全平台 |
| F-SOURCE-007 | 配置导入、导出与清空                                     | P1     | ✅   | 全平台 |

**业务规则**：GitHub 与 Gitee 配置可并存；Token 等敏感信息仅本地持久化。

---

### 5.2 图片 CRUD（已实现）

#### 创建

| ID         | 需求                       | 优先级 | 状态 | 平台   |
| ---------- | -------------------------- | ------ | ---- | ------ |
| F-CRUD-C01 | 单张图片上传并带元数据     | P0     | ✅   | 全平台 |
| F-CRUD-C02 | 批量图片上传并显示进度     | P0     | ✅   | 全平台 |
| F-CRUD-C03 | 移动端：相机拍摄与相册选择 | P0     | ✅   | 移动端 |

#### 读取

| ID         | 需求                     | 优先级 | 状态 | 平台   |
| ---------- | ------------------------ | ------ | ---- | ------ |
| F-CRUD-R01 | 从当前源加载图片列表     | P0     | ✅   | 全平台 |
| F-CRUD-R02 | 以网格/列表形式展示图片  | P0     | ✅   | 全平台 |
| F-CRUD-R03 | 全屏预览、缩放、左右切换 | P0     | ✅   | 全平台 |
| F-CRUD-R04 | 查看单张图片元数据       | P1     | ✅   | 全平台 |
| F-CRUD-R05 | 下拉刷新以同步最新列表   | P1     | ✅   | 全平台 |
| F-CRUD-R06 | 移动端：元数据缓存       | P1     | ✅   | 移动端 |

#### 更新 / 删除

| ID         | 需求                           | 优先级 | 状态      | 平台   |
| ---------- | ------------------------------ | ------ | --------- | ------ |
| F-CRUD-U01 | 编辑图片元数据，支持重命名检测 | P0     | ✅        | 全平台 |
| F-CRUD-U02 | 批量编辑元数据                 | P1     | ⏳ 待实现 | 全平台 |
| F-CRUD-D01 | 单张图片删除并带确认           | P0     | ✅        | 全平台 |
| F-CRUD-D02 | 批量选择与批量删除             | P0     | ✅        | 全平台 |

---

### 5.3 图床浏览（L2：网格 / 列表）

**概述**：当前产品仅维护
**图床主界面**（`/photos`）：网格或列表展示当前源图片，支持预览与筛选。

| ID          | 需求                              | 优先级 | 状态      | 平台       |
| ----------- | --------------------------------- | ------ | --------- | ---------- |
| F-BROWSE-01 | 网格/列表展示，点击预览、左右切换 | P0     | ✅        | Web / 桌面 |
| F-BROWSE-02 | 幻灯片模式                        | —      | ❌ 已移除 | M1 REF-101 |
| F-BROWSE-03 | 时间线模式                        | —      | ❌ 已移除 | M1 REF-101 |
| F-BROWSE-04 | 侧栏：图床 + 工具 + 设置          | P1     | ✅        | Web / 桌面 |
| F-BROWSE-05 | 移动端图床列表与预览              | P0     | ✅        | 移动端     |

> 历史 [03-browse-mode.md](../03-business-design/03-browse-mode.md)
> 仅作归档参考。

---

### 5.4 操作日志（全平台已实现）

| ID       | 需求                             | 优先级 | 状态 | 平台                 |
| -------- | -------------------------------- | ------ | ---- | -------------------- |
| F-LOG-01 | 记录上传、删除、编辑、配置变更等 | P1     | ✅   | 全平台               |
| F-LOG-02 | 日志查看界面，支持筛选           | P1     | ✅   | Web/桌面；移动端弹窗 |
| F-LOG-03 | 展示统计                         | P2     | ✅   | 全平台               |
| F-LOG-04 | 导出 JSON/CSV                    | P2     | ✅   | 全平台               |
| F-LOG-05 | 移动端与 Web/桌面等效日志能力    | P2     | ✅   | 移动端               |

---

### 5.5 PWA 与离线（Web）

| ID       | 需求                      | 优先级 | 状态      | 平台 |
| -------- | ------------------------- | ------ | --------- | ---- |
| F-PWA-01 | Service Worker 与离线缓存 | P1     | ✅        | Web  |
| F-PWA-02 | 安装提示                  | P1     | ✅        | Web  |
| F-PWA-03 | 离线状态指示              | P1     | ✅        | Web  |
| F-PWA-04 | PWA 更新检测与提示        | P2     | ⏳ 待完善 | Web  |

---

### 5.6 图片处理工具（部分实现）

| 类别     | 代表 ID       | 状态摘要                    |
| -------- | ------------- | --------------------------- |
| 格式转换 | F-TOOL-CVT-01 | Web/桌面页面就绪；移动端 ✅ |
| 压缩     | F-TOOL-CMP-01 | Web/桌面页面就绪；移动端 ✅ |
| 编辑     | F-TOOL-EDT-01 | Web/桌面待补；移动端部分 ✅ |
| 分析     | F-TOOL-ANZ-01 | ⏳ 规划中                   |
| 生成     | F-TOOL-GEN-01 | ⏳ 规划中（含 Dify）        |

---

### 5.7 搜索与筛选、国际化、快捷键

| 模块     | 代表 ID         | 状态摘要           |
| -------- | --------------- | ------------------ |
| 搜索筛选 | F-SEARCH-01～03 | ✅；F-SEARCH-04 ⏳ |
| 国际化   | F-I18N-01       | ✅ 中英文          |
| 主题     | F-THEME-01      | ✅ 部分/全平台     |
| 快捷键   | F-KBD-01～02    | ✅ Web/桌面        |

---

### 5.8 Web/桌面扩展（规划）

代表需求：F-WEB-DESK-01～17（批量元数据、布局优化、离线队列、自动更新、托盘、AI、性能边界等）。多数为 ⏳，Desktop
L3 见 M5，体验见 M6。

---

### 5.9 移动端扩展（规划）

代表需求：F-MOBILE-01～16。F-MOBILE-01 批量上传 ✅；其余多为 ⏳。

---

### 5.10 官方服务端（已移出产品范围）

Pixuli **官方不提供** NestJS Server。`server/` 已归档。客户端默认路径仅为
**GitHub / Gitee 仓库插件**。社区/自建见 [backlog.md](../backlog.md)。

---

## 六、非功能需求

### 6.1 性能

| ID         | 需求                                         |
| ---------- | -------------------------------------------- |
| NF-PERF-01 | 多图场景列表可接受（懒加载、分页或虚拟滚动） |
| NF-PERF-02 | Web/桌面以 Canvas 为主；WASM 已归档          |
| NF-PERF-03 | 移动端元数据缓存                             |
| NF-PERF-04 | 超大规模库须定义性能边界（M6 REF-603）       |

### 6.2 安全与隐私

| ID        | 需求                   |
| --------- | ---------------------- |
| NF-SEC-01 | Token 仅存用户设备本地 |
| NF-SEC-02 | 自建后端非官方交付     |

### 6.3 兼容性

| ID           | 需求                                                |
| ------------ | --------------------------------------------------- |
| NF-COMPAT-01 | Web：现代浏览器（Chrome、Firefox、Safari、Edge 等） |
| NF-COMPAT-02 | 桌面：Windows 10/11 x64；macOS 10.15+（x64/ARM64）  |
| NF-COMPAT-03 | 移动端：Android 5.0+（API 21）；iOS 待定            |

### 6.4 可用性与可维护性

| ID          | 需求                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| NF-USAB-01  | 主流程支持中英双语，关键操作有反馈                                         |
| NF-MAINT-01 | 共享逻辑在 `@pixuli/core`；UI 在 `@pixuli/ui`；存储在 `@pixuli/provider-*` |

---

## 七、存储与扩展

### 7.1 默认存储：Git 仓库插件

- 官方插件：`@pixuli/provider-github`、`@pixuli/provider-gitee`
- 配置：`owner`、`repo`、`branch`、`token`、`path`；多源由 `sourceStore` 管理
- Gitee 图片在 Web/Desktop 需代理（REF-313）

### 7.2 非官方扩展

| 扩展方式               | 说明                                     |
| ---------------------- | ---------------------------------------- |
| 第三方 StorageProvider | 实现 Registry 契约后注册（REF-308）      |
| 自建 HTTP API / Server | 非官方；记入 [backlog.md](../backlog.md) |
| AI 分析                | Desktop 本地模型；产品化见 M6 REF-604    |

---

## 八、需求优先级

- **P0**：核心流程；缺失则产品不可用或体验严重受损。
- **P1**：重要功能，影响体验与差异化。
- **P2**：增强功能，可后续迭代。

---

## 九、附录

### 9.1 相关文档

| 文档                                                                           | 说明                      |
| ------------------------------------------------------------------------------ | ------------------------- |
| [02-Product-User-Manual.md](02-Product-User-Manual.md)                         | 产品使用手册（Wiki 源稿） |
| [backlog.md](../backlog.md)                                                    | 已移除/延后需求           |
| [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md)                                     | 重构计划与 Issue          |
| [07-storage-plugin-system.md](../02-system-design/07-storage-plugin-system.md) | 存储插件技术设计          |
| [项目 README](https://github.com/trueLoving/Pixuli/blob/main/README.md)        | 仓库概览                  |

### 9.2 修订历史

| 版本 | 日期       | 变更                                                                           |
| ---- | ---------- | ------------------------------------------------------------------------------ |
| 1.0  | 2025-01-27 | 初稿 PRD                                                                       |
| 2.0  | 2026-05-27 | REF-401：三端底线、M1 裁剪、无官方 Server、core/ui/provider                    |
| 2.1  | 2026-06-06 | 合并原 `03-Product-Scope-And-Cut-List.md` 为 §二；统一为基线产品需求规格说明书 |

---

_本文档随项目迭代更新；与 [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md)
冲突时以重构计划为准。_
