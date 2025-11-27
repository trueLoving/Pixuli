[English](./README.md) | 中文

# Pixuli Web - 智能图片管理 Web 应用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)

## 📖 项目概述

**Pixuli Web** 是一款基于 React + TypeScript +
Vite 构建的智能图片管理 Web 应用。使用 GitHub 和 Gitee 作为存储后端，提供完整的图片管理、上传、浏览和编辑功能。

**核心技术**：React + TypeScript + Vite

## ✨ 主要功能

| 功能模块        | 子功能       | 功能描述                                     |
| --------------- | ------------ | -------------------------------------------- |
| 📸 **图片管理** | 智能浏览     | 网格布局展示，支持懒加载和响应式布局         |
|                 | 拖拽上传     | 支持单张和批量图片上传                       |
|                 | 批量操作     | 批量上传和删除，实时显示操作进度             |
|                 | 标签系统     | 自定义标签，支持多标签管理和过滤             |
|                 | 搜索功能     | 按名称、描述、标签快速查找                   |
|                 | 元数据编辑   | 编辑图片名称、描述和标签                     |
|                 | 全屏预览     | 支持缩放和旋转操作                           |
|                 | 幻灯片播放   | 支持幻灯片模式浏览图片                       |
| 🔧 **图片处理** | 上传前压缩   | 可配置压缩选项（质量、尺寸、格式等）         |
| ☁️ **云端存储** | GitHub 集成  | 使用 GitHub 仓库作为图片存储后端             |
|                 | Gitee 集成   | 支持 Gitee 仓库，为国内用户提供更快访问      |
|                 | 存储源切换   | 灵活在 GitHub 和 Gitee 之间切换              |
|                 | 配置管理     | 支持配置的导入、导出和清除                   |
|                 | 版本控制     | 利用 Git 版本控制，完整记录操作历史          |
|                 | 元数据存储   | 将图片元数据存储为隐藏文件                   |
| 📱 **PWA 功能** | 安装到主屏幕 | 支持将应用安装到主屏幕，提供类似原生应用体验 |
|                 | 离线支持     | 支持离线访问和后台同步                       |
| ⌨️ **快捷键**   | 键盘快捷键   | 丰富的键盘快捷键支持，提升操作效率           |
| 🌐 **国际化**   | 多语言支持   | 完整的中文和英文界面切换                     |
| 🎨 **主题**     | 主题切换     | 支持浅色/深色主题切换                        |

**支持平台**：🌐 现代浏览器（Chrome、Firefox、Safari、Edge 等）|
📱 移动浏览器（iOS Safari、Chrome Mobile 等）

## 📸 功能详解

### 图片管理

Pixuli Web 提供强大的图片管理功能，让您轻松组织和浏览图片：

| 功能           | 描述                                   |
| -------------- | -------------------------------------- |
| **智能浏览**   | 网格布局展示，支持懒加载和响应式布局   |
| **拖拽上传**   | 支持单张和批量图片上传，直观的拖拽操作 |
| **批量操作**   | 批量上传和删除，实时显示操作进度       |
| **标签系统**   | 自定义标签，支持多标签管理和过滤       |
| **搜索功能**   | 按名称、描述、标签快速查找图片         |
| **元数据编辑** | 编辑图片名称、描述和标签               |
| **全屏预览**   | 沉浸式全屏预览体验，支持缩放和旋转操作 |
| **幻灯片播放** | 支持幻灯片模式浏览图片，多种过渡效果   |

### 图片处理

上传前图片处理，优化存储空间：

| 功能           | 描述                                 |
| -------------- | ------------------------------------ |
| **上传前压缩** | 可配置压缩选项（质量、尺寸、格式等） |

### 云端存储

基于 Git 的版本控制存储方案，提供安全可靠的云端存储服务：

| 功能            | 描述                                                    |
| --------------- | ------------------------------------------------------- |
| **GitHub 集成** | 使用 GitHub 仓库作为图片存储后端                        |
| **Gitee 集成**  | 支持 Gitee 仓库，为国内用户提供更快访问                 |
| **存储源切换**  | 灵活在 GitHub 和 Gitee 之间切换存储源                   |
| **配置管理**    | 支持配置的导入、导出和清除，方便迁移和备份              |
| **版本控制**    | 充分利用 Git 的版本控制功能，所有操作都有完整的历史记录 |
| **元数据存储**  | 将图片元数据存储为隐藏文件                              |

### PWA 功能

渐进式 Web 应用特性，提供类似原生应用的体验：

| 功能             | 描述                                         |
| ---------------- | -------------------------------------------- |
| **安装到主屏幕** | 支持将应用安装到主屏幕，提供类似原生应用体验 |
| **离线支持**     | 支持离线访问和后台同步                       |

### 用户体验

注重细节的用户体验设计，让使用更加便捷：

| 功能           | 描述                               |
| -------------- | ---------------------------------- |
| **键盘快捷键** | 丰富的键盘快捷键支持，提升操作效率 |
| **响应式设计** | 适配桌面和移动设备                 |
| **Toast 通知** | 实时反馈操作结果                   |
| **加载状态**   | 显示上传和处理进度                 |
| **主题切换**   | 支持浅色/深色主题切换              |
| **国际化支持** | 完整的中文和英文界面切换           |

## 🚀 快速开始

想要开始使用 Pixuli Web？请查看我们的[贡献指南](../../CONTRIBUTING-ZH.md)。

## 🐳 Docker 本地构建

### 前置要求

- 已安装 Docker（版本 >= 20.10）
- 已安装 Node.js（版本 >= 22.0.0）和 pnpm（版本 >= 8.0.0）
- 确保 Docker 服务正在运行

### 构建流程说明

**优化后的构建流程**：

1. 先在本地构建应用（生成 `dist` 目录）
2. 然后将构建产物复制到 Docker 镜像中
3. 使用 Nginx 提供静态文件服务

**优势**：

- ✅ 镜像体积更小（仅包含 Nginx，不包含 Node.js 构建环境）
- ✅ 构建速度更快（本地构建可以利用缓存）
- ✅ 减少镜像层数，优化存储空间

### 使用构建脚本（推荐）

1. **赋予脚本执行权限**：

   ```bash
   chmod +x apps/web/build-docker.sh
   ```

2. **执行构建脚本**：

   ```bash
   # 使用默认标签 latest（脚本会自动检测并构建应用）
   ./apps/web/build-docker.sh

   # 或指定版本标签
   ./apps/web/build-docker.sh 1.0.0
   ```

   脚本会自动执行以下步骤：
   - 检查是否存在 `dist` 目录
   - 如果不存在，自动执行 `pnpm build:web` 构建应用
   - 构建 Docker 镜像

3. **运行容器**：

   ```bash
   docker run -d -p 8080:80 --name pixuli-web pixuli-web:latest
   ```

4. **访问应用**：打开浏览器访问 `http://localhost:8080`

### 手动构建

如果不想使用脚本，也可以手动执行：

```bash
# 步骤 1: 在项目根目录构建应用
pnpm build:web

# 步骤 2: 构建 Docker 镜像（确保 dist 目录已存在）
docker build -f apps/web/Dockerfile -t pixuli-web:latest .

# 步骤 3: 运行容器
docker run -d -p 8080:80 --name pixuli-web pixuli-web:latest
```

### 常用 Docker 命令

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs -f pixuli-web

# 停止容器
docker stop pixuli-web

# 启动已停止的容器
docker start pixuli-web

# 删除容器
docker rm pixuli-web

# 删除镜像
docker rmi pixuli-web:latest

# 查看镜像列表和大小
docker images | grep pixuli-web
```

### 构建说明

- **构建上下文**：构建上下文为项目根目录，Dockerfile 位于 `apps/web/Dockerfile`
- **构建产物**：需要先执行 `pnpm build:web` 生成 `apps/web/dist` 目录
- **镜像内容**：仅包含 Nginx 和静态文件，不包含 Node.js 构建环境和启动脚本
- **镜像大小**：优化后镜像大小约 20-30MB（仅包含 Nginx Alpine 和静态文件）
- **端口映射**：容器内部使用 80 端口，映射到主机的 8080 端口（可自定义）

### 环境变量配置

环境变量需要在**构建时**通过 `.env`
文件配置。Vite 会在构建时将环境变量注入到应用代码中。

#### 配置步骤

1. **创建环境变量文件**：

   ```bash
   # 在 apps/web 目录下复制示例文件
   cd apps/web
   cp env.example .env

   # 编辑配置文件
   nano .env
   ```

2. **配置环境变量**：

   编辑 `.env` 文件，设置需要的环境变量：

   ```bash
   # 演示模式设置
   VITE_DEMO_MODE=false

   # GitHub 演示配置
   VITE_DEMO_GITHUB_OWNER=your-owner
   VITE_DEMO_GITHUB_REPO=your-repo
   VITE_DEMO_GITHUB_BRANCH=main
   VITE_DEMO_GITHUB_TOKEN=your-token
   VITE_DEMO_GITHUB_PATH=/images

   # Gitee 演示配置
   VITE_DEMO_GITEE_OWNER=your-owner
   VITE_DEMO_GITEE_REPO=your-repo
   VITE_DEMO_GITEE_BRANCH=main
   VITE_DEMO_GITEE_TOKEN=your-token
   VITE_DEMO_GITEE_PATH=/images

   # Gitee 代理配置
   VITE_USE_GITEE_PROXY=true
   ```

3. **重新构建应用和镜像**：

   ```bash
   # 构建应用（会自动读取 .env 文件）
   pnpm build:web

   # 构建 Docker 镜像
   ./apps/web/build-docker.sh
   ```

#### 支持的环境变量

参考 `apps/web/env.example` 文件，支持以下环境变量：

- `VITE_DEMO_MODE` - 演示模式开关
- `VITE_DEMO_GITHUB_OWNER` - GitHub 仓库所有者
- `VITE_DEMO_GITHUB_REPO` - GitHub 仓库名称
- `VITE_DEMO_GITHUB_BRANCH` - GitHub 分支名称
- `VITE_DEMO_GITHUB_TOKEN` - GitHub 访问令牌
- `VITE_DEMO_GITHUB_PATH` - GitHub 图片路径
- `VITE_DEMO_GITEE_OWNER` - Gitee 仓库所有者
- `VITE_DEMO_GITEE_REPO` - Gitee 仓库名称
- `VITE_DEMO_GITEE_BRANCH` - Gitee 分支名称
- `VITE_DEMO_GITEE_TOKEN` - Gitee 访问令牌
- `VITE_DEMO_GITEE_PATH` - Gitee 图片路径
- `VITE_USE_GITEE_PROXY` - 是否使用 Gitee 代理

#### 环境变量注入机制

- Vite 会在构建时读取 `.env` 文件中以 `VITE_` 开头的环境变量
- 环境变量会被注入到构建产物中，通过 `import.meta.env` 访问
- 环境变量在构建时确定，运行时无法修改

在应用代码中访问：

```typescript
// 访问环境变量
const demoMode = import.meta.env.VITE_DEMO_MODE;
const githubOwner = import.meta.env.VITE_DEMO_GITHUB_OWNER;
```

### 注意事项

- 如果修改了源代码，需要重新执行 `pnpm build:web` 后再构建 Docker 镜像
- `dist` 目录会被复制到镜像中，确保构建产物是最新的
- 构建脚本会自动检测 `dist` 目录，如果不存在会提示是否构建
- **环境变量在构建时注入**，修改 `.env` 文件后需要重新构建应用和镜像才能生效
- `.env` 文件应放在 `apps/web/` 目录下，Vite 会自动读取
- 建议将 `.env` 添加到 `.gitignore` 中，避免提交敏感信息

## 🤝 参与贡献

我们欢迎所有形式的贡献！如果您想参与项目开发，请查看
[贡献指南](../../CONTRIBUTING-ZH.md) 了解详细信息。

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Octokit](https://octokit.github.io/) - GitHub API 客户端
- [Lucide React](https://lucide.dev/) - 图标库
- [React Hot Toast](https://react-hot-toast.com/) - 通知组件
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理
- [i18next](https://www.i18next.com/) - 国际化框架

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
