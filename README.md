# Pixuli - 智能图片管理应用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)

## 🖼️ 项目概述

**Pixuli** 是一款现代化的跨平台图片管理桌面应用，基于 Electron + React + TypeScript 构建。它提供了直观的图片浏览、组织、编辑和管理功能，让您的图片库管理变得简单高效。

## ✨ 主要功能

```mermaid
graph TB
    A[Pixuli 智能图片管理] --> B[核心功能]
    A --> C[AI 智能功能]
    A --> D[图片处理功能]
    A --> E[用户体验优化]
    A --> F[云端存储]
    
    B --> B1[智能图片管理]
    B --> B2[拖拽上传]
    B --> B3[图片预览]
    B --> B4[图片信息编辑]
    B --> B5[标签系统]
    B --> B6[搜索功能]
    
    C --> C1[AI 图片分析]
    C --> C2[自动标签生成]
    C --> C3[智能描述]
    C --> C4[GGUF 模型支持]
    
    D --> D1[智能压缩]
    D --> D2[批量处理]
    D --> D3[格式转换]
    
    E --> E1[滚动加载]
    E --> E2[懒加载]
    E --> E3[响应式设计]
    
    F --> F1[GitHub 集成]
    F --> F2[版本控制]
    F --> F3[团队协作]
```

## 🛠️ 技术架构

```mermaid
graph LR
    A[Electron 主进程] --> B[React 应用]
    B --> C[组件层]
    B --> D[服务层]
    B --> E[状态管理]
    
    C --> C1[图片网格/列表]
    C --> C2[图片上传/AI分析]
    C --> C3[图片信息编辑]
    C --> C4[GitHub 配置]
    
    D --> D1[AI 分析服务]
    D --> D2[GGUF 模型服务]
    D --> D3[GitHub 存储服务]
    
    E --> E1[图片状态管理]
    E --> E2[配置状态管理]
    
    A --> F[GitHub API]
    A --> G[文件系统]
```

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

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 快速构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [TensorFlow.js](https://www.tensorflow.org/js) - 浏览器端机器学习
- [GGUF](https://github.com/ggerganov/gguf) - 优化的模型格式

## 📞 联系我们

- 项目主页: [https://github.com/trueLoving/pixuli](https://github.com/trueLoving/pixuli)
- 问题反馈: [Issues](https://github.com/trueLoving/pixuli/issues)

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
