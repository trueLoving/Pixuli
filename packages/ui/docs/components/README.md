# Pixuli UI 组件详细文档

本目录包含 Pixuli UI 组件库中所有组件的详细使用说明和 API 文档。

## 📋 组件列表

### 🖼️ 图片浏览器组件

#### [ImageBrowser](./image-browser.md)
主要的图片浏览器组件，集成了网格/列表视图切换、排序、筛选等功能。

**特性:**
- 支持网格和列表两种视图模式
- 内置排序功能（按创建时间、文件名、大小等）
- 内置筛选功能（按标签、文件类型等）
- 键盘导航支持
- 虚拟滚动优化
- 国际化支持

#### [ImageGrid](./image-grid.md)
网格视图组件，以卡片形式展示图片。

**特性:**
- 响应式网格布局
- 图片懒加载
- 悬停操作按钮
- 图片预览功能
- 国际化支持

#### [ImageList](./image-list.md)
列表视图组件，以表格形式展示图片。

**特性:**
- 紧凑的列表布局
- 可展开的详细信息
- 批量操作支持
- 国际化支持

#### [ImageFilter](./image-filter.md)
图片筛选组件，支持按多种条件筛选图片。

#### [ImageSorter](./image-sorter.md)
图片排序组件，支持多种排序方式。

#### [ViewToggle](./view-toggle.md)
视图模式切换组件，在网格和列表视图间切换。

### 📤 图片操作组件

#### [ImageUpload](./image-upload.md)
图片上传组件，支持单文件和批量上传。

**特性:**
- 拖拽上传支持
- 批量上传进度显示
- 文件类型验证
- 上传预览
- 国际化支持

#### [ImageEditModal](./image-edit-modal.md)
图片编辑模态框，用于编辑图片信息。

**特性:**
- 编辑图片名称、描述、标签
- 实时预览
- 键盘快捷键支持
- 国际化支持

#### [ImagePreviewModal](./image-preview-modal.md)
图片预览模态框，支持全屏查看图片。

#### [ImageUrlModal](./image-url-modal.md)
图片链接查看模态框，显示图片的在线访问地址。

### ⚙️ 配置组件

#### [GitHubConfigModal](./github-config-modal.md)
GitHub 配置模态框，用于配置 GitHub 存储。

**特性:**
- GitHub 仓库配置
- 配置导入/导出
- 配置验证
- 国际化支持

#### [UpyunConfigModal](./upyun-config-modal.md)
又拍云配置模态框，用于配置又拍云存储。

#### [KeyboardHelpModal](./keyboard-help-modal.md)
键盘快捷键帮助模态框。

### 🔍 搜索组件

#### [ImageSearch](./image-search.md)
图片搜索组件，支持按名称、标签等条件搜索。

## 🎣 Hooks 文档

### [性能优化 Hooks](./hooks/performance.md)
- useInfiniteScroll - 无限滚动 Hook
- useLazyLoad - 懒加载 Hook
- useVirtualScroll - 虚拟滚动 Hook

### [图片处理 Hooks](./hooks/image.md)
- useImageDimensions - 获取图片尺寸的 Hook
- useImageDimensionsFromUrl - 从 URL 获取图片尺寸的 Hook

### [键盘交互 Hooks](./hooks/keyboard.md)
- useKeyboard - 键盘事件管理 Hook

## 🛠️ 工具函数文档

### [图片处理工具](./utils/image.md)
- imageUtils - 图片尺寸和信息获取工具
- fileSizeUtils - 文件大小格式化工具

### [数据处理工具](./utils/data.md)
- filterUtils - 图片筛选工具
- sortUtils - 图片排序工具

### [交互工具](./utils/interaction.md)
- keyboardShortcuts - 键盘快捷键管理器
- toast - 消息提示工具

## 📝 使用指南

### 1. 选择需要的组件

根据您的需求选择合适的组件：

- **图片展示**: ImageBrowser, ImageGrid, ImageList
- **图片上传**: ImageUpload
- **图片编辑**: ImageEditModal
- **配置管理**: GitHubConfigModal, UpyunConfigModal
- **搜索功能**: ImageSearch

### 2. 查看组件文档

点击上方的组件链接查看详细的使用说明和 API 文档。

### 3. 导入和使用

```tsx
import { ImageBrowser, ImageUpload } from 'pixuli-ui/src'
import 'pixuli-ui/dist/index.css'

// 使用组件
<ImageBrowser
  images={images}
  onDeleteImage={handleDelete}
  onUpdateImage={handleUpdate}
/>
```

## 🔧 开发指南

### 组件设计原则

1. **职责分离**: 组件只负责 UI 展示和用户交互
2. **Props 驱动**: 通过 props 接收数据和回调函数
3. **类型安全**: 完整的 TypeScript 类型定义
4. **国际化支持**: 所有文本都支持翻译
5. **性能优化**: 内置懒加载、虚拟滚动等优化

### 自定义样式

所有组件都支持通过 `className` prop 添加自定义样式：

```tsx
<ImageBrowser
  className="my-custom-browser"
  images={images}
  onDeleteImage={handleDelete}
/>
```

```css
.my-custom-browser {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### 国际化使用

所有组件都支持国际化：

```tsx
import { zhCN, defaultTranslate } from 'pixuli-ui/src'

const t = defaultTranslate(zhCN)

<ImageBrowser
  images={images}
  t={t}
  onDeleteImage={handleDelete}
/>
```

## 📄 许可证

MIT License
