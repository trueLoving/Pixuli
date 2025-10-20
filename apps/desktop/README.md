# Pixuli Desktop - 智能图片管理桌面应用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)

## 📖 项目概述

**Pixuli Desktop** 是 Pixuli Monorepo 中的桌面应用部分，基于 Electron + React + TypeScript + Rust 构建的跨平台智能图片管理桌面应用。

## ✨ 主要功能

```mermaid
graph TB
    A[Pixuli Desktop] --> B[图片管理]
    A --> C[图片处理]
    A --> D[云端存储]
    
    B --> B1[智能浏览]
    B --> B2[拖拽上传]
    B --> B3[标签系统]
    B --> B4[搜索功能]
    B --> B5[元数据编辑]
    
    C --> C1[WebP 压缩]
    C --> C2[格式转换]
    C --> C3[批量处理]
    C --> C4[尺寸调整]
    C --> C5[质量控制]
    
    D --> D1[GitHub 集成]
    D --> D2[版本控制]
    D --> D3[团队协作]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
```

## 🛠️ 技术架构

```mermaid
graph TB
    subgraph "Electron 桌面应用"
        A[Electron 主进程]
        B[React 渲染进程]
        C[本地文件系统]
        D[系统 API]
    end
    
    subgraph "前端层 (React + TypeScript)"
        E[React 组件]
        F[状态管理 Zustand]
        G[UI 组件库]
        H[国际化 i18n]
    end
    
    subgraph "业务逻辑层"
        I[图片管理服务]
        J[图片处理服务]
        K[GitHub 存储服务]
    end
    
    subgraph "核心模块"
        L[pixuli-wasm]
        M[图片处理引擎]
        N[格式转换引擎]
    end
    
    A --> B
    B --> E
    E --> F
    E --> G
    E --> H
    
    I --> L
    J --> M
    K --> N
    
    L --> M
    L --> N
    
    A --> C
    A --> D
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style E fill:#fff3e0
    style I fill:#fce4ec
    style L fill:#f3e5f5
```

## 🚀 快速开始

### 环境要求
- Node.js >= 22.0.0
- pnpm
- Rust (用于构建 WASM 模块)

### 安装和运行

```bash
# 从项目根目录
cd pixuli

# 安装所有依赖
pnpm install

# 构建 wasm 模块
pnpm run build:wasm

# 桌面端：开发模式
pnpm run dev:desktop

# 桌面端：应用构建
pnpm run build:desktop
```

### 桌面应用特性

**优势**：
- ✅ 完整的本地文件系统访问
- ✅ 原生性能优化
- ✅ 系统集成和通知
- ✅ 离线功能支持
- ✅ 多窗口管理
- ✅ 键盘快捷键

**支持平台**：
- 🍎 macOS (x64, ARM64)
- 🪟 Windows (x64)

## 📦 项目结构

```
apps/desktop/
├── src/                           # 源代码
│   ├── components/                # React 组件
│   │   ├── image-compression/    # 图片压缩组件
│   │   ├── image-format-conversion/ # 格式转换组件
│   │   └── LanguageSwitcher.tsx   # 语言切换器
│   ├── config/                    # 配置文件
│   ├── hooks/                     # 自定义 Hooks
│   ├── i18n/                      # 国际化配置
│   ├── services/                  # 业务服务
│   ├── stores/                    # 状态管理
│   ├── types/                     # 类型定义
│   └── utils/                     # 工具函数
├── electron/                      # Electron 主进程
│   ├── main/                      # 主进程代码
│   │   ├── services/             # 主进程服务
│   │   ├── index.ts              # 主进程入口
│   │   └── update.ts             # 自动更新
│   └── preload/                   # 预加载脚本
├── build/                         # 构建资源
├── dist/                          # 构建输出
├── dist-electron/                 # Electron 构建输出
├── release/                       # 分发文件
├── electron-builder.json         # Electron 构建配置
├── vite.config.ts                # Vite 配置
└── tailwind.config.js            # Tailwind CSS 配置
```

## 🔧 开发指南

### 脚本命令

- `pnpm run dev` - 启动开发服务器
- `pnpm run build` - 构建应用并打包 Electron 应用

### 配置文件

- **electron-builder.json** - Electron 应用构建配置
- **vite.config.ts** - Vite 构建配置
- **tailwind.config.js** - Tailwind CSS 配置
- **tsconfig.json** - TypeScript 配置

### 核心依赖

- **Electron** - 桌面应用框架
- **React** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 构建工具
- **Tailwind CSS** - CSS 框架
- **Zustand** - 状态管理
- **pixuli-wasm** - 核心 WASM 模块

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Rust](https://www.rust-lang.org/) - 高性能系统编程语言
- [NAPI-RS](https://napi.rs/) - Node.js 原生模块绑定
- [image-rs](https://github.com/image-rs/image) - Rust 图片处理库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！