# 📱 Pixuli Mobile - 智能图片管理移动应用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.82.0-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

## 📖 项目简介

pixuli Mobile 是 pixuli 智能图片管理生态系统的移动端应用，基于 React Native +
TypeScript 构建，提供跨平台的图片管理、AI 分析和云端同步功能。

## ✨ 主要功能

### 🖼️ 图片管理

- **智能浏览** - 网格布局展示图片，支持懒加载
- **拍照上传** - 支持相机拍照和相册选择
- **批量操作** - 批量上传、删除、重命名
- **格式支持** - JPEG, PNG, WebP, GIF, SVG, BMP
- **预览功能** - 全屏预览、缩放、旋转

### 🔧 图片处理

- **图片压缩** - 上传前可调节压缩质量（10%-100%），节省存储空间
- **格式转换** - 支持 JPEG、PNG、WebP 格式转换
- **尺寸调整** - 可自定义宽度和高度，支持保持宽高比
- **图片裁剪** - 支持拖动裁剪框选择区域，可调整裁剪框大小
- **处理预览** - 实时预览处理效果，显示处理前后的图片对比、文件大小、压缩率等统计信息

### 📋 图片详情

- **详细信息面板** - 显示文件大小、上传时间、URL、ID、创建时间、更新时间、图片类型等完整信息
- **分享功能** - 支持分享图片链接（先下载到本地再分享，支持超时控制）
- **复制链接** - 一键复制图片 URL 到剪贴板
- **快捷操作** - 分享按钮集成到顶部工具栏，与删除按钮同级，操作更便捷

### ☁️ 云端同步

- **GitHub 集成** - 使用 GitHub 仓库存储
- **离线同步** - 支持离线浏览和同步
- **版本控制** - 利用 Git 版本管理
- **团队协作** - 支持多人协作

## 🛠️ 技术架构

```mermaid
graph TB
    subgraph "React Native 移动应用"
        A[React Native 框架]
        B[TypeScript]
        C[Native Modules]
        D[Platform APIs]
    end

    subgraph "前端层"
        E[React 组件]
        F[状态管理 Zustand]
        G[导航管理 React Navigation]
        H[UI 组件库]
    end

    subgraph "业务逻辑层"
        I[图片管理服务]
        J[AI 分析服务]
        K[图片处理服务]
        L[GitHub 存储服务]
    end

    subgraph "原生集成"
        M[相机 API]
        N[文件系统 API]
        O[权限管理]
        P[图片选择器]
    end

    subgraph "共享模块"
        Q[pixuli UI 组件库]
        R[pixuli WASM 处理引擎]
        S[业务逻辑复用]
    end

    A --> B
    B --> E
    E --> F
    E --> G
    E --> H

    I --> Q
    J --> R
    K --> R
    L --> S

    C --> M
    C --> N
    C --> O
    C --> P

    style A fill:#e3f2fd
    style E fill:#e8f5e8
    style I fill:#fff3e0
    style Q fill:#fce4ec
```

## 🚀 快速开始

### 环境要求

- Node.js >= 22.0.0
- Android Studio (Android 开发)
- Xcode (iOS 开发，仅 macOS)
- CocoaPods (iOS 依赖管理)

### 安装依赖

```bash
# 根目录安装项目依赖
pnpm i
```

### 运行项目

```bash
# 运行 Android 版本
pnpm start --android
# 运行 iOS 版本 (仅 macOS)
pnpm start --ios
```

## 📁 项目结构

```
apps/mobile/
├── app/                     # Expo Router 路由（页面）
│   ├── _layout.tsx         # 根布局
│   └── (tabs)/             # Tab 导航组
│       ├── _layout.tsx     # Tab 布局
│       ├── index.tsx       # 首页（图片列表）
│       ├── settings.tsx    # 设置页面
│       └── settings/       # 设置子页面
│           └── github.tsx  # GitHub 配置页面
├── components/             # 可复用组件
│   ├── ImageBrowser.tsx    # 图片浏览器（全屏预览）
│   ├── ImageGrid.tsx       # 图片网格组件
│   ├── ImageUploadButton.tsx  # 图片上传按钮
│   ├── ImageUploadEditModal.tsx  # 上传前编辑模态框
│   ├── ImageEditModal.tsx  # 图片编辑模态框
│   ├── ImageCropModal.tsx  # 图片裁剪模态框
│   ├── SearchAndFilter.tsx # 搜索和筛选组件
│   ├── GitHubConfigModal.tsx  # GitHub 配置模态框
│   ├── ThemedText.tsx      # 主题文本组件
│   ├── ThemedView.tsx      # 主题视图组件
│   └── ui/                 # UI 组件
│       ├── IconSymbol.tsx  # 图标组件
│       └── IconSymbol.ios.tsx  # iOS 图标组件
├── services/               # 业务服务
│   └── githubStorageService.ts  # GitHub 存储服务
├── stores/                 # 状态管理（Zustand）
│   └── imageStore.ts       # 图片状态管理
├── hooks/                 # 自定义 Hooks
│   ├── useColorScheme.ts  # 颜色方案 Hook
│   └── useThemeColor.ts   # 主题颜色 Hook
├── utils/                 # 工具函数
│   ├── imageUtils.ts      # 图片处理工具
│   ├── metadataCache.ts   # 元数据缓存
│   └── toast.ts           # 提示消息工具
├── config/                # 配置文件
│   ├── github.ts          # GitHub 配置
│   └── theme.ts           # 主题配置
├── constants/             # 常量定义
│   └── theme.ts           # 主题常量
├── i18n/                  # 国际化
│   ├── index.ts           # i18n 初始化
│   ├── locales.ts         # 翻译文本
│   └── useI18n.ts         # i18n Hook
├── assets/                # 静态资源
│   └── images/            # 图片资源
├── android/               # Android 原生代码
├── scripts/               # 脚本文件
│   └── generate-icons.js  # 图标生成脚本
├── app.json              # Expo 配置
├── package.json           # 项目依赖
├── tsconfig.json          # TypeScript 配置
├── FEATURE_ROADMAP.md     # 功能路线图
└── README.md              # 项目说明
```

## 📦 构建发布

### Android 构建

```bash
pnpm android
```

### iOS 构建

```bash
pnpm ios
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**pixuli Mobile** - 让图片管理更智能，让创作更高效！ 📱✨
