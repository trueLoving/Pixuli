# Pixuli — 本地优先的资源工作区

> **无官方后端**：本机为 SSOT；经 GitHub /
> Gitee 插件**同步**，需要外链时**复制链接**。  
> 三端共用一份 `app`（Web PWA · Desktop Electron · Mobile Capacitor Android）。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)
[![pnpm](https://img.shields.io/badge/pnpm-10.18.3-orange.svg)](https://pnpm.io/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-2.0.0-blue.svg)](https://pixuli-web.vercel.app/)
[![Documentation](https://img.shields.io/badge/Documentation-Wiki-blue.svg)](https://github.com/trueLoving/Pixuli/wiki)

> ⚠️ **开发状态**：产品主路径已按
> [资源库 UI SSOT](docs/01-product/04-asset-library-ui.md)（v3.7）冻结；工程仍在迭代（见
> [PLANS.md](PLANS.md)）。升级前请阅读 [CHANGELOG.md](CHANGELOG.md)。

---

## 用户只记三句

1. **改库 = 只动本机**（添加 / 删改 / 移动均不自动上云）
2. **要远端一样 → 点同步**
3. **要给人看 → 复制链接**（仅本地时须先同步；外人能否打开取决于仓库是否公开等云策略）

北极星场景：个人站点 / 博客配图 —— 本机整理 → 同步到公开 GitHub/Gitee 仓 → 复制 raw 链接贴进 Markdown。

产品**不做**用户向「发布」流程或假「已发布」状态。细则见
[04-asset-library-ui.md](docs/01-product/04-asset-library-ui.md)。

---

## 什么是 Pixuli？

| 原则         | 说明                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| **本地优先** | 工作区目录是真相源；浏览、搜索、预览默认读本机                                        |
| **存储插件** | GitHub / Gitee 经 `StorageProvider`（`@pixuli/provider-*`）；**无**官方 NestJS Server |
| **外链**     | 同步推远端后复制 `publicUrl` / raw；私有仓会如实附注                                  |
| **三端**     | Web · Desktop · Android 共用 UI；官方连接近期只保 Git 双提供商                        |

已移除或延后（幻灯片、时间线、照片墙、全员 OAuth、Drive 等）见
[docs/04-backlog.md](docs/04-backlog.md) 与资源库 UI SSOT「延后」表。

---

## 维护范围

| 区域                           | 状态      | 说明                              |
| ------------------------------ | --------- | --------------------------------- |
| **Web**（`app`，Vite）         | ✅ 维护中 | PWA；开发 `http://localhost:5500` |
| **Desktop**（`app`，Electron） | ✅ 维护中 | 与 Web 共用 UI                    |
| **Mobile**（`app`，Capacitor） | ✅ 维护中 | Android；与 Web/Desktop 同一套 UI |
| **`@pixuli/core`**             | ✅ 维护中 | 类型、工具、插件 Registry         |
| **`@pixuli/provider-*`**       | ✅ 维护中 | 官方 GitHub / Gitee 存储插件      |

---

## 主要能力（当前）

| 模块       | 说明                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| **资源库** | 本地工作区文件夹、添加/删改（仅本机）、两态角标（仅本地 / 已同步）、Inspector |
| **同步**   | 显式 pull/push；活动栏待推送 N；不锁库                                        |
| **外链**   | 复制公网链接；无连接 / 仅本地 / 私有仓有明确引导                              |
| **连接**   | 设置中添加 GitHub / Gitee（PAT）；Token 仅存本机                              |
| **工具**   | 压缩、格式转换（产物仅本机；总开关与入口按排期打磨）                          |

---

## 项目结构

```text
Pixuli/
├── app/                    # Web + Desktop + Mobile
├── packages/
│   ├── core/               # @pixuli/core
│   ├── plugin-provider-github/
│   └── plugin-provider-gitee/
├── docs/                   # 产品 / 系统设计
├── PLANS.md                # 任务与进度（对齐 Issues）
├── 2.0.md · DECISIONS.md
└── .github/workflows/      # ci（main）· release-desktop / android（手动）
```

---

## 环境要求

| 工具        | 版本                       |
| ----------- | -------------------------- |
| **Node.js** | >= 22.0.0                  |
| **pnpm**    | >= 8.0.0（workspace 必需） |
| **Git**     | >= 2.0.0                   |

主应用**不需要** Rust。Desktop / Android 额外要求见下表。

| 平台               | 额外要求                        |
| ------------------ | ------------------------------- |
| **Desktop**        | macOS 10.15+ 或 Windows 10/11   |
| **Web**            | 支持 Canvas 的现代浏览器        |
| **Mobile Android** | Android Studio、SDK 33+、JDK 17 |

---

## 快速开始

```bash
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli
pnpm install

pnpm dev:web          # Web → http://localhost:5500
pnpm dev:desktop      # Desktop（Electron）
pnpm dev:android      # Android + Live Reload
```

### 构建与验证

```bash
pnpm build:web
pnpm build:desktop
pnpm build:android      # release APK
pnpm ci                 # lint + test + web/desktop 构建（推送到 main 时跑）
```

贡献约定见 [CONTRIBUTING.md](./CONTRIBUTING.md)。发版制度见
[05-release-versioning.md](docs/02-system-design/05-release-versioning.md)
（Desktop / Android 仅手动触发 Actions）。

---

## 下载

### Desktop

| 平台            | 获取方式                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| Windows / macOS | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) — `v{版本}-desktop` |

### Mobile（Android）

| 平台    | 获取方式                         |
| ------- | -------------------------------- |
| Android | Releases — `v{版本}-android` APK |

> 2.x Mobile 与 Web/Desktop 同源。历史 Expo RN 包（`v*-mobile`）已归档。

### Web

| 方式     | 链接                                                    |
| -------- | ------------------------------------------------------- |
| 在线演示 | [pixuli-web.vercel.app](https://pixuli-web.vercel.app/) |

---

## 文档

| 读者                  | 文档                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| **用户**              | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)                     |
| **资源库 UI（SSOT）** | [04-asset-library-ui.md](docs/01-product/04-asset-library-ui.md)             |
| **产品需求**          | [docs/01-product/](docs/01-product/)                                         |
| **进度 / 2.0 / 决策** | [PLANS.md](./PLANS.md) · [2.0.md](./2.0.md) · [DECISIONS.md](./DECISIONS.md) |
| **AI 助手**           | [AGENTS.md](./AGENTS.md)                                                     |
| **变更日志**          | [CHANGELOG.md](./CHANGELOG.md)                                               |

---

## 致谢

[Electron](https://electronjs.org/) · [React](https://reactjs.org/) ·
[Capacitor](https://capacitorjs.com/) · [Vite](https://vitejs.dev/) ·
[Zustand](https://zustand-demo.pmnd.rs/) · [pnpm](https://pnpm.io/)

⭐ 如果本项目对你有帮助，欢迎 Star！
