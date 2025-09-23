# Pixuli - 智能图片管理应用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)

## 📖 项目初衷

基于之前使用 **Vue3 + Composition API + Pinia + Vue-Router** 开发图片管理应用的经验，决定尝试使用 **React** 技术栈重新实现，体验不同框架的设计理念。

**之前项目成果**：
- 虚拟滚动+Web Worker，10万图加载优化至2.8s
- WASM WebP编码，压缩率78%，CDN流量↓62%
- TensorFlow+Llama，图像描述准召率92%+

**实际需求驱动**：在运营博客网站时遇到的图片管理问题，需要统一存储、智能压缩、AI辅助、批量处理。

**技术栈对比**：

| 方面 | Vue3项目 | React项目 |
|------|----------|-----------|
| 框架 | Vue3 + Composition API | React + Hooks |
| 状态管理 | Pinia | Zustand |
| 路由 | Vue Router | React Router |
| 构建工具 | Vite | Vite |

## 🖼️ 项目概述

**Pixuli** 是一款现代化的跨平台图片管理桌面应用，基于 Electron + React + TypeScript + Rust 构建。

## ✨ 主要功能

```mermaid
graph TB
    A[Pixuli 智能图片管理] --> B[图片管理]
    A --> C[图片处理]
    A --> D[AI 分析]
    A --> E[云端存储]
    
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
    
    D --> D1[内容识别]
    D --> D2[智能标签]
    D --> D3[颜色分析]
    D --> D4[多模型支持]
    
    E --> E1[GitHub 集成]
    E --> E2[版本控制]
    E --> E3[团队协作]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#fce4ec
    style E fill:#f3e5f5
```

## 🛠️ 技术架构

```mermaid
graph TB
    subgraph "前端层 (React + TypeScript)"
        A[Electron 渲染进程]
        B[React 组件]
        C[状态管理 Zustand]
        D[UI 组件库]
    end
    
    subgraph "业务逻辑层"
        E[图片管理服务]
        F[AI 分析服务]
        G[图片处理服务]
        H[GitHub 存储服务]
    end
    
    subgraph "AI 模型层"
        I[TensorFlow 处理器]
        J[TensorFlow Lite 处理器]
        K[ONNX 处理器]
        L[本地 LLM 处理器]
        M[远程 API 处理器]
    end
    
    subgraph "后端层 (Rust + NAPI)"
        N[pixuli-wasm]
        O[图片处理引擎]
        P[AI 分析引擎]
        Q[格式转换引擎]
    end
    
    subgraph "系统层"
        R[Electron 主进程]
        S[文件系统]
        T[GitHub API]
        U[本地存储]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H
    
    E --> N
    F --> I
    F --> J
    F --> K
    F --> L
    F --> M
    G --> O
    H --> Q
    
    I --> P
    J --> P
    K --> P
    L --> P
    M --> P
    
    N --> O
    N --> P
    N --> Q
    
    R --> S
    R --> T
    R --> U
    R --> A
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#fce4ec
    style E fill:#f3e5f5
    style F fill:#e1f5fe
    style G fill:#e8f5e8
    style H fill:#fff3e0
    style I fill:#fce4ec
    style J fill:#f3e5f5
    style K fill:#e1f5fe
    style L fill:#e8f5e8
    style M fill:#fff3e0
    style N fill:#fce4ec
    style O fill:#f3e5f5
    style P fill:#e1f5fe
    style Q fill:#e8f5e8
    style R fill:#fff3e0
    style S fill:#fce4ec
    style T fill:#f3e5f5
    style U fill:#e1f5fe
```

## 🤖 AI 模型支持

支持 5 种 AI 模型类型：
- **TensorFlow** (`.pb`, `.pbtxt`, `.json`, `.bin`, `.ckpt`, `.h5`)
- **TensorFlow Lite** (`.tflite`)
- **ONNX** (`.onnx`, `.ort`)
- **本地 LLM** (Llama、Mistral 等)
- **远程 API** (OpenAI、Qwen、Claude、Gemini 等)

## 🚀 快速开始

### 环境要求
- Node.js >= 22.0.0
- pnpm

### 安装和运行
```bash
# 克隆项目
git clone https://github.com/trueLoving/pixuli.git
cd pixuli

# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建应用
pnpm run build
pnpm run electron:build
```

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
