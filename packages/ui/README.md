# Pixuli UI

Pixuli
UI 是一个专为图片管理应用设计的 React 组件库，提供了完整的图片浏览、上传、编辑和管理功能。

## 🎯 设计理念

- **职责分离**: UI 组件只负责展示和交互，不包含业务逻辑
- **高度可复用**: 通过 props 接收回调函数，支持不同业务场景
- **性能优化**: 内置虚拟滚动、懒加载等性能优化功能
- **类型安全**: 完整的 TypeScript 类型定义
- **国际化支持**: 内置中英文语言包，支持自定义翻译

## 📦 安装

```bash
# 在 monorepo 中使用
pnpm add pixuli-ui

# 或直接导入源码
import { ImageBrowser } from 'pixuli-ui/src'
```

## 🧩 核心功能

### 组件库

- **ImageBrowser**: 图片浏览器组件，集成网格/列表视图、排序、筛选功能
- **ImageUpload**: 图片上传组件，支持单文件和批量上传、拖拽操作
- **ImageEditModal**: 图片编辑模态框，编辑图片名称、描述、标签等信息
- **ImagePreviewModal**: 图片预览模态框，支持全屏预览功能
- **GitHubConfigModal**: GitHub 配置模态框，配置 GitHub 仓库存储
- **GiteeConfigModal**: Gitee 配置模态框，配置 Gitee 仓库存储
- **KeyboardHelpModal**: 键盘快捷键帮助模态框
- **ImageSearch**: 图片搜索组件，支持按名称、标签等条件搜索

### Hooks

- **useInfiniteScroll**: 无限滚动 Hook，实现分页加载
- **useLazyLoad**: 懒加载 Hook，基于 Intersection Observer
- **useVirtualScroll**: 虚拟滚动 Hook，处理大量数据
- **useImageDimensions**: 获取图片尺寸的 Hook
- **useImageDimensionsFromUrl**: 从 URL 获取图片尺寸的 Hook
- **useKeyboard**: 键盘事件管理 Hook

### 工具函数

- **imageUtils**: 图片尺寸和信息获取工具
- **fileSizeUtils**: 文件大小格式化工具
- **filterUtils**: 图片筛选工具
- **sortUtils**: 图片排序工具
- **keyboardShortcuts**: 键盘快捷键管理器
- **toast**: 消息提示工具

## 🎣 技术特性

### 性能优化

- **虚拟滚动**: 处理大量图片数据
- **懒加载**: 按需加载图片资源
- **无限滚动**: 分页加载优化

### 开发体验

- **TypeScript**: 完整的类型定义
- **Hooks**: 丰富的自定义 Hooks
- **工具函数**: 图片处理、文件格式化等工具

## 📚 文档

- **[组件文档](./docs/components/)** - 详细的组件使用说明
- **[国际化文档](./docs/i18n/)** - 国际化功能使用指南和 Key 值参考

## 📄 许可证

MIT License
