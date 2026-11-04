# Pixuli — 本地优先的资源工作区

> **无官方后端**：本机为 SSOT；经 GitHub / Gitee **同步**；需要外链时
> **复制链接**。  
> 三端共用一份 `app`（Web PWA · Desktop Electron · Mobile Capacitor Android）。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)
[![pnpm](https://img.shields.io/badge/pnpm-10.18.3-orange.svg)](https://pnpm.io/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-2.0.0-blue.svg)](https://pixuli-web.vercel.app/)

---

## 用户只记三句

1. **改库 = 只动本机**（添加 / 删改 / 移动 / 处理均不自动上云）
2. **要远端一样 → 点同步**
3. **要给人看 → 复制链接**（仅本地时先同步；外人能否打开取决于仓库是否公开）

北极星：个人站点 / 博客配图 —— 本机整理 → 同步到公开 GitHub/Gitee 仓 → 复制 raw 链接贴进 Markdown。

不做用户向「发布」。规则见 [docs/product.md](docs/product.md)；上手见
[docs/guide.md](docs/guide.md)。

---

## 主要能力

| 模块       | 说明                                                                |
| ---------- | ------------------------------------------------------------------- |
| **资源库** | 本机文件夹浏览、添加/删改（仅本机）、仅本地 / 已同步角标、Inspector |
| **同步**   | 显式 pull/push；待推送角标；不锁库                                  |
| **外链**   | 复制公网链接；无连接 / 仅本地 / 私有仓有引导                        |
| **连接**   | 设置中统一向导添加 GitHub / Gitee（PAT 仅本机）                     |
| **处理**   | 选中图片 → 裁剪 / 转换，结果写回原文件夹（仅本机）                  |
| **官网**   | `website/` 产品介绍与使用场景（`pnpm dev:website`）                 |

---

## 项目结构

```text
Pixuli/
├── app/                 # Web + Desktop + Mobile
├── website/             # 官网
├── packages/
│   ├── core/            # @pixuli/core
│   ├── plugin-provider-github/
│   └── plugin-provider-gitee/
├── docs/                # guide · product · architecture
├── PLANS.md · DECISIONS.md · AGENTS.md
└── .github/workflows/
```

---

## 快速开始

```bash
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli
pnpm install

pnpm dev:web          # http://localhost:5500
pnpm dev:desktop
pnpm dev:android
pnpm ci               # lint + test + 构建门禁
```

| 工具    | 版本                   |
| ------- | ---------------------- |
| Node.js | >= 22                  |
| pnpm    | >= 8（workspace 必需） |

Desktop：macOS 10.15+ / Windows 10+。Android：Android Studio、SDK 33+、JDK
17。贡献见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 下载与 Demo

| 端      | 获取                                                                          |
| ------- | ----------------------------------------------------------------------------- |
| Web     | [pixuli-web.vercel.app](https://pixuli-web.vercel.app/)                       |
| Desktop | [Releases](https://github.com/trueLoving/Pixuli/releases) · `v{版本}-desktop` |
| Android | Releases · `v{版本}-android` APK                                              |

---

## 文档

| 读者     | 文档                                                                           |
| -------- | ------------------------------------------------------------------------------ |
| 用户     | [docs/guide.md](docs/guide.md)                                                 |
| 产品规则 | [docs/product.md](docs/product.md)                                             |
| 架构     | [docs/architecture.md](docs/architecture.md)                                   |
| 进度     | [PLANS.md](./PLANS.md) · [Issues](https://github.com/trueLoving/Pixuli/issues) |
| 决策     | [DECISIONS.md](./DECISIONS.md)                                                 |
| AI 助手  | [AGENTS.md](./AGENTS.md)                                                       |
| 变更     | [CHANGELOG.md](./CHANGELOG.md)                                                 |

---

## 致谢

[Electron](https://electronjs.org/) · [React](https://reactjs.org/) ·
[Capacitor](https://capacitorjs.com/) · [Vite](https://vitejs.dev/) ·
[Zustand](https://zustand-demo.pmnd.rs/) · [pnpm](https://pnpm.io/)
