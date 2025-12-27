[English](./README.md) | 中文

# Pixuli - 智能图片管理应用

> **名称由来**：Pixuli 由 **Picture**（图片）+ **uli**
> 组合而成，寓意智能、友好的图片管理体验。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)
[![pnpm](https://img.shields.io/badge/pnpm-10.18.3-orange.svg)](https://pnpm.io/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-1.0.0-blue.svg)](https://pixuli-web.vercel.app/)
[![Documentation](https://img.shields.io/badge/Documentation-1.0.0-green.svg)](https://pixuli-docs.vercel.app/)

## 📖 项目初衷

Pixuli 项目来源于两个原因：

1. **实际需求**：在运营博客网站时遇到的图片管理问题，需要统一存储、智能压缩和批量处理能力。
2. **项目经历**：基于之前使用 Vue3 开发图片管理应用的经验，决定使用 React 技术栈重新实现，体验不同框架的设计理念，并在此基础上进行功能扩展和优化。

## 🖼️ 项目概述

Pixuli 是一个基于 Monorepo 架构的图片管理解决方案，支持多平台部署：

- **🖥️ 桌面端**：基于 Electron + React + TypeScript + Rust
  (WASM) 构建的跨平台桌面应用
- **🌐 Web 端**：基于 Vite + React + TypeScript 构建的 Web 应用，支持 PWA
- **📱 移动端**：基于 React Native + Expo 构建的移动应用

**核心技术栈**：

- **前端**：React 19.1.0 + TypeScript + Vite
- **桌面端**：Electron
- **移动端**：React Native + Expo
- **图片处理**：Rust (WASM) + NAPI-RS
- **状态管理**：Zustand
- **UI 组件**：共享组件库
- **云端存储**：GitHub / Gitee

## ✨ 主要功能

| 功能模块        | 功能描述                                                                           |
| --------------- | ---------------------------------------------------------------------------------- |
| 📸 **图片管理** | 智能浏览、拖拽上传、批量操作、标签系统、搜索功能、元数据编辑、全屏预览、幻灯片播放 |
| 🔧 **图片处理** | WebP 压缩、格式转换、尺寸调整、批量处理、上传前压缩                                |
| ☁️ **云端存储** | GitHub 集成、Gitee 集成、存储源切换、配置管理、版本控制、元数据存储                |
| 🎨 **用户体验** | 主题切换、多语言支持、键盘快捷键、响应式设计、PWA 支持                             |

## 🏗️ 项目结构

```
Pixuli/
├── apps/                     # 应用程序
│   ├── desktop/               # 桌面端应用 (Electron + React)
│   ├── web/                   # Web 端应用 (Vite + React)
│   └── mobile/                # 移动端应用 (React Native + Expo)
├── packages/                 # 共享包
│   ├── ui/                    # UI 组件库
│   └── wasm/                  # WASM 模块 (Rust)
├── docs/                     # 文档网站
├── benchmark/                # 性能测试
└── pnpm-workspace.yaml       # 工作空间配置
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0 (必需，项目仅支持 pnpm)
- **Git** >= 2.0.0
- **Rust** >= 1.70.0 (用于构建 WASM 模块，仅桌面端需要)
- **Android Studio** (用于 Android 开发，仅移动端需要)
- **XCode** (用于 IOS 开发，仅移动端需要)

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli

# 安装依赖
pnpm install

# 构建 WASM 模块 (仅桌面端需要)
pnpm build:wasm

# 启动开发模式
pnpm dev:web      # Web 端 (http://localhost:5500)
pnpm dev:desktop  # 桌面端
pnpm dev:mobile --android   # 移动端 Android
pnpm dev:mobile --ios   # 移动端 IOS
```

### 详细开发指南

想要了解更多开发细节？请查看我们的贡献指南：

- **[贡献指南](./CONTRIBUTING-ZH.md)** - 完整的开发指南，涵盖所有平台（桌面端、Web 端、移动端）
- **[Contributing Guide (English)](./CONTRIBUTING.md)** - Complete development
  guide covering all platforms (Desktop, Web, Mobile)

## 📦 制品下载

### 🖥️ 桌面端

桌面端应用支持 Windows 和 macOS 平台，可通过以下方式获取：

| 平台                    | 下载方式                                                         | 说明                                |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------------- |
| **Windows**             | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) | 下载 `.exe` 安装包                  |
| **macOS Intel**         | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) | 下载 `mac-x64` 版本的 `.dmg` 文件   |
| **macOS Apple Silicon** | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) | 下载 `mac-arm64` 版本的 `.dmg` 文件 |

**系统要求**：

- Windows: Windows 10/11 (64位), 4GB RAM, 2GB 可用磁盘空间
- macOS: macOS 10.15+, 4GB RAM, 2GB 可用磁盘空间

### 🌐 Web 端

Web 端应用支持在线访问和 Docker 部署：

| 方式         | 链接/说明                                                    | 说明               |
| ------------ | ------------------------------------------------------------ | ------------------ |
| **在线访问** | [Live Demo](https://pixuli-web.vercel.app/)                  | 直接访问，无需安装 |
| **Docker**   | [Docker Hub](https://hub.docker.com/r/trueloving/pixuli-web) | 使用 Docker 部署   |

#### Docker 部署

```bash
# 拉取并运行最新版本
docker run -d -p 8080:80 --name pixuli-web trueloving/pixuli-web:latest

# 或使用指定版本
docker run -d -p 8080:80 --name pixuli-web trueloving/pixuli-web:1.0.0
```

### 📱 移动端

移动端应用支持 iOS 和 Android 平台，可通过以下方式获取：

| 平台        | 下载方式                                                         | 说明               |
| ----------- | ---------------------------------------------------------------- | ------------------ |
| **Android** | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) | 下载 `.apk` 安装包 |

**系统要求**：

- Android: Android 8.0 (API 26) 或更高版本

## 📚 文档

| 文档类型     | 文档链接                                          | 描述                                 |
| ------------ | ------------------------------------------------- | ------------------------------------ |
| **功能文档** | [应用文档](./apps/pixuli/README.md)               | 应用功能和使用说明（Web 和 Desktop） |
|              | [Web 端文档](./apps/web/README.md)                | Web 端功能和使用说明                 |
|              | [移动端文档](./apps/mobile/README.md)             | 移动端功能和使用说明                 |
| **开发文档** | [贡献指南](./CONTRIBUTING-ZH.md)                  | 完整的开发指南                       |
|              | [Contributing Guide (English)](./CONTRIBUTING.md) | Complete development guide           |
| **更新日志** | [更新日志](./CHANGELOG-ZH.md)                     | 完整的版本更新历史                   |
|              | [Changelog (English)](./CHANGELOG.md)             | Complete version history             |

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [React Native](https://reactnative.dev/) - 移动应用框架
- [Vite](https://vitejs.dev/) - 快速构建工具
- [Rust](https://www.rust-lang.org/) - 高性能系统编程语言
- [NAPI-RS](https://napi.rs/) - Node.js 原生模块绑定
- [image-rs](https://github.com/image-rs/image) - Rust 图片处理库
- [Zustand](https://zustand-demo.pmnd.rs/) - 轻量级状态管理
- [pnpm](https://pnpm.io/) - 快速、节省磁盘空间的包管理器

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
