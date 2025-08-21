# Pixuli - 智能图片管理应用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 16.0.0](https://img.shields.io/static/v1?label=node&message=%3E=16.0.0&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

English | [简体中文](README.zh-CN.md)

## 🖼️ 项目概述

**Pixuli** 是一款现代化的跨平台图片管理桌面应用，基于 Electron + React + TypeScript 构建。它提供了直观的图片浏览、组织、编辑和管理功能，让您的图片库管理变得简单高效。

## ✨ 主要功能

### 🎯 核心功能
- **智能图片管理**: 自动分类和组织您的图片库
- **拖拽上传**: 支持多文件拖拽上传，操作简单直观
- **图片预览**: 快速预览和浏览图片，支持缩略图模式
- **图片编辑**: 内置图片裁剪、旋转、调整等基础编辑功能
- **标签系统**: 为图片添加标签，便于分类和搜索
- **搜索功能**: 快速搜索图片，支持文件名、标签、日期等条件

### 🚀 高级特性
- **自动更新**: 应用自动检测和下载更新
- **多窗口支持**: 支持同时打开多个图片管理窗口
- **跨平台**: 支持 Windows、macOS 和 Linux
- **性能优化**: 基于 Vite 构建，启动快速，响应灵敏

## 🛠️ 技术架构

### 技术栈
- **前端**: React 18 + TypeScript + Tailwind CSS
- **桌面**: Electron 33
- **构建**: Vite 5
- **状态管理**: Zustand
- **图片处理**: react-image-crop, react-dropzone

### 项目结构
```
Pixuli/
├── electron/              # Electron 主进程和预加载脚本
│   ├── main/             # 主进程代码
│   └── preload/          # 预加载脚本
├── src/                  # React 应用代码
│   ├── components/       # React 组件
│   ├── assets/          # 静态资源
│   └── type/            # TypeScript 类型定义
├── public/               # 公共静态资源
└── dist-electron/        # 构建输出目录
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- pnpm (推荐) 或 npm

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/your-username/pixuli.git

# 进入项目目录
cd pixuli

# 安装依赖
pnpm install
```

### 开发模式
```bash
# 启动开发服务器
pnpm run dev

# 同时启动 React 和 Electron
pnpm run electron:dev
```

### 构建应用
```bash
# 构建生产版本
pnpm run build

# 构建并打包桌面应用
pnpm run electron:build

# 构建特定平台
pnpm run dist:win      # Windows
pnpm run dist:mac      # macOS
pnpm run dist:linux    # Linux
```

## 🎨 界面预览

应用提供了现代化的用户界面，包括：
- 清晰的图片网格布局
- 直观的拖拽操作
- 响应式设计，适配不同屏幕尺寸
- 深色/浅色主题支持

## 🔧 开发指南

### 项目配置
- `vite.config.ts` - Vite 构建配置
- `electron-builder.json` - Electron 打包配置
- `tsconfig.json` - TypeScript 配置

### 调试
项目包含完整的调试配置，支持：
- VSCode 调试
- 热重载 (HMR)
- 源码映射

## 📦 打包和分发

### 构建配置
- 支持多平台打包
- 自动更新支持
- 应用签名和代码签名

### 发布流程
1. 运行 `pnpm run build` 构建应用
2. 运行 `pnpm run electron:build` 打包桌面应用
3. 在 `release/` 目录找到打包好的应用

## 🤝 贡献指南

我们欢迎社区贡献！请查看以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 快速构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

## 📞 联系我们

- 项目主页: [https://github.com/your-username/pixuli](https://github.com/your-username/pixuli)
- 问题反馈: [Issues](https://github.com/your-username/pixuli/issues)
- 功能建议: [Discussions](https://github.com/your-username/pixuli/discussions)

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
