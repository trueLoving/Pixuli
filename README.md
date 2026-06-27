# Pixuli — 基于 Git 的图床客户端

> **🖼️ Pixuli** — AI 图片分析、自动标签生成与批处理。在 **GitHub /
> Gitee 仓库**中管理图片的**三端**客户端（无官方自建服务端）。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)
[![pnpm](https://img.shields.io/badge/pnpm-10.18.3-orange.svg)](https://pnpm.io/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-2.0.0-blue.svg)](https://pixuli-web.vercel.app/)
[![Documentation](https://img.shields.io/badge/Documentation-Wiki-blue.svg)](https://github.com/trueLoving/Pixuli/wiki)

> ⚠️ **开发状态**：本项目**正在重构中**（M1～M6，见
> [REFACTOR_PLAN.md](REFACTOR_PLAN.md)）。`main`
> 分支的 API、目录与功能边界可能频繁变动，**尚不稳定**，暂不建议用于生产环境。升级或集成前请先阅读
> [CHANGELOG.md](CHANGELOG.md) 的 `[Unreleased]`。

---

## 什么是 Pixuli？

Pixuli 是一个 **Monorepo** 图片管理客户端。图片存放在你配置的 Git 仓库中；应用在
**Web（PWA）**、**Desktop（Electron）** 与 **Mobile（Capacitor Android）**
上提供浏览、上传、元数据与实用工具。

| 原则           | 说明                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **存储**       | 经 `StorageProvider` 插件接入 GitHub / Gitee（`@pixuli/provider-github`、`@pixuli/provider-gitee`） |
| **官方服务端** | **无** — `server/`（NestJS）已归档；如需自建 API 请用社区插件或自定义 Provider                      |
| **图片处理**   | Web/Desktop 渲染进程使用浏览器 **Canvas**（主构建路径已移除 Rust WASM）                             |
| **产品聚焦**   | 网格/列表图床（L2）+ 压缩/转换工具 + 设置                                                           |

已移除或延后的功能（幻灯片、时间线、照片墙等）见
[docs/04-backlog.md](docs/04-backlog.md)。重构追踪见
[REFACTOR_PLAN.md](REFACTOR_PLAN.md)。

> **文档语言**：仓库根目录 README / CHANGELOG /
> CONTRIBUTING 暂以**中文**为主；`docs/` 与 Wiki 策略见
> [REFACTOR_PLAN.md](REFACTOR_PLAN.md)（REF-415）。

---

## 维护范围

| 区域                                   | 状态      | 说明                                                               |
| -------------------------------------- | --------- | ------------------------------------------------------------------ |
| **Web**（`apps/pixuli`，Vite）         | ✅ 维护中 | PWA；开发地址 `http://localhost:5500`                              |
| **Desktop**（`apps/pixuli`，Electron） | ✅ 维护中 | 与 Web 共用 `@pixuli/ui`                                           |
| **Mobile**（`apps/pixuli`，Capacitor） | ✅ 维护中 | Android：`dev:android` / `build:android`；与 Web/Desktop 同一套 UI |
| **`@pixuli/core`**                     | ✅ 维护中 | 类型、工具、`StoragePluginRegistry`                                |
| **`@pixuli/ui`**                       | ✅ 维护中 | Web/Desktop/Mobile UI；`./native` 已弃用                           |
| **`@pixuli/provider-*`**               | ✅ 维护中 | 官方 GitHub/Gitee 存储插件                                         |
| **`archive/wasm`**                     | 📦 已归档 | 不在 workspace；仅供查阅                                           |
| **`archive/benchmark`**                | 📦 已归档 | 不在 workspace                                                     |
| **`archive/apps/mobile`**              | 📦 已归档 | Expo RN；仅供对照；请使用 `apps/pixuli` Capacitor                  |
| **`archive/server`**                   | 📦 已归档 | 不在 workspace；非官方交付物                                       |

---

## 主要功能（当前）

| 模块     | 说明                                                       |
| -------- | ---------------------------------------------------------- |
| **图床** | 网格/列表浏览、单张/批量上传、删除、元数据、搜索、全屏预览 |
| **工具** | WebP 压缩、格式转换（`/compress`、`/convert`）             |
| **存储** | GitHub / Gitee 源、切换源、导入/导出配置；Token 仅存本地   |
| **体验** | 明暗主题、中/英界面、快捷键、响应式布局、PWA（Web）        |

---

## 项目结构

```text
Pixuli/
├── apps/
│   └── pixuli/                          # Web + Desktop + Mobile（Vite + React + Electron + Capacitor）
├── packages/
│   ├── core/                            # @pixuli/core — 类型、Registry、工具
│   ├── ui/                              # @pixuli/ui — 共享 Web UI
│   ├── plugin-provider-github/          # @pixuli/provider-github
│   └── plugin-provider-gitee/           # @pixuli/provider-gitee
├── archive/                             # wasm、benchmark、server、apps/mobile（不在 workspace）
├── docs/                                # PRD、系统设计、backlog
├── REFACTOR_PLAN.md                     # 里程碑与 GitHub Issue 映射
└── pnpm-workspace.yaml
```

---

## 环境要求

### 所有协作者

| 工具        | 版本                                          |
| ----------- | --------------------------------------------- |
| **Node.js** | >= 22.0.0                                     |
| **pnpm**    | >= 8.0.0（**必需**；仓库使用 pnpm workspace） |
| **Git**     | >= 2.0.0                                      |

> 主应用**不需要** Rust 工具链。WASM 模块仅存在于 `archive/wasm/`。

### 按平台（可选）

| 平台               | 额外要求                                            |
| ------------------ | --------------------------------------------------- |
| **Desktop**        | macOS 10.15+ 或 Windows 10/11（运行/打包 Electron） |
| **Web**            | 支持 Canvas API 的现代浏览器                        |
| **Mobile Android** | Android Studio、SDK 33+、JDK 17                     |
| **Mobile iOS**     | Xcode（iOS 发版待定）                               |

---

## 快速开始

```bash
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli
pnpm install

# 开发
pnpm dev:web          # Web → http://localhost:5500
pnpm dev:desktop      # Desktop（Electron）
pnpm dev:android      # Mobile Android（Capacitor + Live Reload）
pnpm run:android      # 在 dev server 已起时重连
```

### 构建与验证

```bash
pnpm build:web
pnpm build:desktop
pnpm ci                 # lint + test + web/desktop 类型检查与构建（CI 门禁）
```

工作流、代码风格与提交约定见 **[CONTRIBUTING.md](./CONTRIBUTING.md)**。

---

## 下载

### Desktop

| 平台                | 获取方式                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| Windows             | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) — `.exe` |
| macOS Intel         | Releases — `mac-x64` `.dmg`                                               |
| macOS Apple Silicon | Releases — `mac-arm64` `.dmg`                                             |

### Web

| 方式     | 链接                                                    |
| -------- | ------------------------------------------------------- |
| 在线演示 | [pixuli-web.vercel.app](https://pixuli-web.vercel.app/) |
| Docker   | `docker run -d -p 8080:80 trueloving/pixuli-web:latest` |

### Mobile

| 平台    | 获取方式                                                                  |
| ------- | ------------------------------------------------------------------------- |
| Android | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) — `.apk` |

> **升级说明**：M1 重构前的 Release（如
> `v1.3.0-desktop`）可能仍含幻灯片与 WASM 等已移除能力。升级前请阅读
> [CHANGELOG.md](./CHANGELOG.md) 的 `[Unreleased]` 与
> [版本发布策略](docs/01-product/03-release-versioning.md)。

---

## 文档

| 读者                  | 文档                                                                              |
| --------------------- | --------------------------------------------------------------------------------- |
| **用户**              | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) — 安装、配置源、日常使用 |
| **产品**              | [docs/01-product/](docs/01-product/) — PRD、范围与裁剪、使用教程                  |
| **已移除 / 延后**     | [docs/04-backlog.md](docs/04-backlog.md)                                          |
| **开发者**            | [docs/README.md](docs/README.md) — 文档索引                                       |
| **贡献**              | [CONTRIBUTING.md](./CONTRIBUTING.md)                                              |
| **AI 助手**           | [AGENTS.md](./AGENTS.md) — Cursor Rules/Skills、Monorepo 上下文（REF-414）        |
| **重构计划**          | [REFACTOR_PLAN.md](./REFACTOR_PLAN.md)                                            |
| **变更日志**          | [CHANGELOG.md](./CHANGELOG.md)                                                    |
| **主应用**            | [apps/pixuli/README.md](./apps/pixuli/README.md)                                  |
| **Mobile（归档 RN）** | [archive/apps/mobile/README.md](./archive/apps/mobile/README.md)                  |

---

## 致谢

- [Electron](https://electronjs.org/) · [React](https://reactjs.org/) ·
  [Capacitor](https://capacitorjs.com/) · [Vite](https://vitejs.dev/) ·
  [Zustand](https://zustand-demo.pmnd.rs/) · [pnpm](https://pnpm.io/)

---

⭐ 如果本项目对你有帮助，欢迎 Star！
