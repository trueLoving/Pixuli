# Pixuli Web - 智能图片管理 Web 应用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)

## 📖 项目概述

**Pixuli Web** 是 Pixuli Monorepo 中的 Web 应用部分，基于 React + TypeScript + Rust WebAssembly 构建的跨平台智能图片管理 Web 应用。

## ✨ 主要功能

```mermaid
graph TB
    A[Pixuli Web] --> B[图片管理]
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
    subgraph "Web 应用架构"
        A[React SPA]
        B[PWA 支持]
        C[浏览器 API]
        D[Service Worker]
    end
    
    subgraph "前端层 (React + TypeScript)"
        E[React 组件]
        F[状态管理 Zustand]
        G[UI 组件库]
        H[路由管理]
    end
    
    subgraph "业务逻辑层"
        I[图片管理服务]
        J[AI 分析服务]
        K[图片处理服务]
        L[GitHub 存储服务]
    end
    
    subgraph "AI 模型层"
        M[TensorFlow.js]
        N[ONNX.js]
        O[WebAssembly 模型]
        P[远程 API 处理器]
    end
    
    subgraph "核心模块"
        Q[pixuli-wasm WebAssembly]
        R[图片处理引擎]
        S[AI 分析引擎]
        T[格式转换引擎]
    end
    
    A --> B
    B --> D
    A --> E
    E --> F
    E --> G
    E --> H
    
    I --> Q
    J --> M
    J --> N
    J --> O
    J --> P
    K --> R
    L --> T
    
    M --> S
    N --> S
    O --> S
    P --> S
    
    Q --> R
    Q --> S
    Q --> T
    
    A --> C
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style E fill:#fff3e0
    style I fill:#fce4ec
    style Q fill:#f3e5f5
```

## 🤖 AI 模型支持

支持多种 AI 模型类型：
- **TensorFlow.js** (`.json`, `.bin`)
- **ONNX.js** (`.onnx`, `.ort`)
- **WebAssembly 模型** (`.wasm`)
- **远程 API** (OpenAI、Qwen、Claude、Gemini 等)

## 🚀 快速开始

### 环境要求
- Node.js >= 22.0.0
- pnpm
- 现代浏览器 (支持 WebAssembly)

### 安装和运行

```bash
# 从项目根目录
cd pixuli

# 安装所有依赖
pnpm install

# 开发模式
pnpm run --filter web dev

# 构建应用
pnpm run --filter web build

# 预览构建结果
pnpm run --filter web preview
```

### Web 应用特性

**优势**：
- ✅ 跨平台访问 (无需安装)
- ✅ PWA 支持 (可安装到桌面)
- ✅ 响应式设计
- ✅ 实时更新
- ✅ 云端同步
- ✅ 团队协作

**支持功能**：
- 🌐 浏览器文件上传
- 📱 移动端适配
- 🔄 离线缓存
- 🚀 快速加载
- 🔒 安全认证

## 📦 项目结构

```
apps/web/
├── src/                    # 源代码
│   ├── components/         # React 组件
│   ├── hooks/             # 自定义 Hooks
│   ├── services/          # 业务服务
│   ├── stores/            # 状态管理
│   ├── types/             # 类型定义
│   └── utils/             # 工具函数
├── public/                # 静态资源
│   ├── manifest.json      # PWA 配置
│   └── sw.js              # Service Worker
├── dist/                  # 构建输出
└── package.json           # 项目配置
```

## 🌐 部署

### 静态网站托管

**Vercel**:
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

**Netlify**:
```bash
# 构建
pnpm run build

# 部署到 Netlify
# 将 dist/ 目录上传到 Netlify
```

**GitHub Pages**:
```bash
# 构建
pnpm run build

# 推送到 gh-pages 分支
# GitHub Actions 会自动部署
```

### PWA 配置

应用支持 PWA，可以：
- 安装到桌面
- 离线使用
- 推送通知
- 后台同步

## 🔧 开发指南

### 添加新功能

1. 在 `src/components/` 中创建组件
2. 在 `src/services/` 中添加业务逻辑
3. 在 `src/stores/` 中管理状态
4. 更新类型定义

### WebAssembly 集成

```typescript
// 使用 pixuli-wasm WebAssembly 模块
import { compressToWebp, analyzeImageWithAi } from 'pixuli-wasm'

// 压缩图片
const compressed = await compressToWebp(imageData, { quality: 80 })

// AI 分析
const analysis = await analyzeImageWithAi(imageData, { model: 'tensorflow' })
```

### 性能优化

- 使用 React.memo 优化组件渲染
- 实现虚拟滚动处理大量图片
- 使用 Web Workers 处理重计算
- 实现图片懒加载和预加载

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [WebAssembly](https://webassembly.org/) - 高性能计算
- [TensorFlow.js](https://www.tensorflow.org/js) - 浏览器端机器学习

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
