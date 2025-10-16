# Pixuli UI

Pixuli UI 是一个专为图片管理应用设计的 React 组件库，提供了完整的图片浏览、上传、编辑和管理功能。

## 🎯 设计理念

- **职责分离**: UI 组件只负责展示和交互，不包含业务逻辑
- **高度可复用**: 通过 props 接收回调函数，支持不同业务场景
- **性能优化**: 内置虚拟滚动、懒加载等性能优化功能
- **类型安全**: 完整的 TypeScript 类型定义

## 📦 安装

```bash
# 在 monorepo 中使用
pnpm add @packages/ui

# 或直接导入源码
import { ImageBrowser } from '@packages/ui/src'
```

## 🧩 组件列表

### 主题系统组件

#### ThemeProvider
主题提供者组件，用于包装整个应用并提供主题上下文。**组件库不管理主题状态，只负责响应应用层传入的主题变化。**

```tsx
interface ThemeProviderProps {
  children: ReactNode
  currentTheme?: Theme
  themeMode?: ThemeMode
  onThemeChange?: (themeName: string) => void
  onModeChange?: (mode: ThemeMode) => void
  availableThemes?: Theme[]
}
```

**特性:**
- 纯响应式设计，不管理内部状态
- 支持浅色、深色、蓝色、绿色等多种预设主题
- 主题状态由应用层管理
- 完整的TypeScript类型支持

#### ThemeToggle
主题切换组件，提供多种样式变体。

```tsx
interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  variant?: 'button' | 'dropdown' | 'compact'
}
```

**特性:**
- 三种样式变体：按钮、下拉菜单、紧凑样式
- 支持主题模式切换（浅色/深色/自动）
- 支持预设主题选择
- 响应式设计

### 图片浏览器组件

#### ImageBrowser
主要的图片浏览器组件，集成了网格/列表视图切换、排序、筛选等功能。

```tsx
interface ImageBrowserProps {
  images: ImageItem[]
  className?: string
  onDeleteImage?: (id: string, name: string) => Promise<void>
  onUpdateImage?: (data: any) => Promise<void>
  getImageDimensionsFromUrl?: (url: string) => Promise<{ width: number; height: number }>
  formatFileSize?: (size: number) => string
}
```

**特性:**
- 支持网格和列表两种视图模式
- 内置排序功能（按创建时间、文件名、大小等）
- 内置筛选功能（按标签、文件类型等）
- 键盘导航支持
- 虚拟滚动优化

#### ImageGrid
网格视图组件，以卡片形式展示图片。

```tsx
interface ImageGridProps {
  images: ImageItem[]
  className?: string
  selectedImageIndex?: number
  onImageSelect?: (index: number) => void
  onDeleteImage?: (id: string, name: string) => Promise<void>
  onUpdateImage?: (data: any) => Promise<void>
  getImageDimensionsFromUrl?: (url: string) => Promise<{ width: number; height: number }>
  formatFileSize?: (size: number) => string
}
```

**特性:**
- 响应式网格布局
- 图片懒加载
- 悬停操作按钮
- 图片预览功能

#### ImageList
列表视图组件，以表格形式展示图片。

```tsx
interface ImageListProps {
  images: ImageItem[]
  className?: string
  selectedImageIndex?: number
  onImageSelect?: (index: number) => void
  onDeleteImage?: (id: string, name: string) => Promise<void>
  onUpdateImage?: (data: any) => Promise<void>
  getImageDimensionsFromUrl?: (url: string) => Promise<{ width: number; height: number }>
  formatFileSize?: (size: number) => string
}
```

**特性:**
- 紧凑的列表布局
- 可展开的详细信息
- 批量操作支持

#### ImageFilter
图片筛选组件，支持按多种条件筛选图片。

```tsx
interface FilterOptions {
  tags: string[]
  fileTypes: string[]
  dateRange: {
    start: string
    end: string
  }
  sizeRange: {
    min: number
    max: number
  }
}
```

#### ImageSorter
图片排序组件，支持多种排序方式。

```tsx
type SortField = 'name' | 'createdAt' | 'updatedAt' | 'size' | 'width' | 'height'
type SortOrder = 'asc' | 'desc'
```

#### ViewToggle
视图模式切换组件，在网格和列表视图间切换。

```tsx
type ViewMode = 'grid' | 'list'
```

### 图片操作组件

#### ImageUpload
图片上传组件，支持单文件和批量上传。

```tsx
interface ImageUploadProps {
  onUploadImage: (data: ImageUploadData) => Promise<void>
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<void>
  loading: boolean
  batchUploadProgress?: BatchUploadProgress | null
}
```

**特性:**
- 拖拽上传支持
- 批量上传进度显示
- 文件类型验证
- 上传预览

#### ImageEditModal
图片编辑模态框，用于编辑图片信息。

```tsx
interface ImageEditModalProps {
  image: ImageItem
  isOpen: boolean
  onClose: () => void
  onUpdateImage: (data: ImageEditData) => Promise<void>
  onSuccess?: (image: ImageItem) => void
  onCancel?: () => void
  loading?: boolean
  getImageDimensionsFromUrl?: (url: string) => Promise<{ width: number; height: number }>
}
```

**特性:**
- 编辑图片名称、描述、标签
- 实时预览
- 键盘快捷键支持

### 配置组件

#### GitHubConfigModal
GitHub 配置模态框，用于配置 GitHub 存储。

```tsx
interface GitHubConfigModalProps {
  isOpen: boolean
  onClose: () => void
  githubConfig?: GitHubConfig | null
  onSaveConfig: (config: GitHubConfig) => void
  onClearConfig: () => void
  platform?: 'web' | 'desktop'
}
```

**特性:**
- GitHub 仓库配置
- 配置导入/导出
- 配置验证

#### KeyboardHelpModal
键盘快捷键帮助模态框。

```tsx
interface KeyboardHelpModalProps {
  isOpen: boolean
  onClose: () => void
  categories: KeyboardCategory[]
}
```

## 🎣 Hooks

### 主题相关 Hooks

#### useThemeContext
获取主题上下文信息。

```tsx
const { 
  currentTheme, 
  themeMode, 
  setThemeMode, 
  setTheme, 
  availableThemes 
} = useThemeContext()
```

#### useThemeToggle
便捷的主题切换Hook。

```tsx
const { 
  themeMode, 
  toggleTheme, 
  cycleThemes, 
  setThemeMode, 
  setTheme 
} = useThemeToggle()
```

**注意：** 这些Hook只提供便捷的切换方法，实际的主题状态管理由应用层负责。

### 性能优化 Hooks

#### useInfiniteScroll
无限滚动 Hook，用于实现分页加载。

```tsx
const {
  visibleItems,
  hasMore,
  isLoading,
  loadMore,
  reset,
  containerRef,
  loadingRef
} = useInfiniteScroll(items, options)
```

#### useLazyLoad
懒加载 Hook，基于 Intersection Observer 实现。

```tsx
const { visibleItems, observeElement, unobserveElement } = useLazyLoad(options)
```

#### useVirtualScroll
虚拟滚动 Hook，用于处理大量数据。

```tsx
const {
  visibleItems,
  totalHeight,
  scrollTop,
  containerRef
} = useVirtualScroll(items, options)
```

### 图片处理 Hooks

#### useImageDimensions
获取图片尺寸的 Hook。

```tsx
const {
  dimensions,
  loading,
  error,
  loadDimensions,
  loadImageInfo,
  reset
} = useImageDimensions(file, options)
```

#### useImageDimensionsFromUrl
从 URL 获取图片尺寸的 Hook。

```tsx
const {
  dimensions,
  loading,
  error,
  loadDimensions,
  reset
} = useImageDimensionsFromUrl(url, options)
```

### 键盘交互 Hooks

#### useKeyboard
键盘事件管理 Hook。

```tsx
const {
  useKeyboardShortcut,
  useKeyboardMultiple,
  useEscapeKey,
  useEnterKey,
  useArrowKeys,
  useNumberKeys,
  useLetterKeys
} = useKeyboard()
```

## 🛠️ 工具函数

### 图片处理工具

#### imageUtils
- `getImageDimensions(file: File)`: 获取图片尺寸
- `getImageInfo(file: File)`: 获取图片详细信息
- `getImageDimensionsFromUrl(url: string)`: 从 URL 获取图片尺寸

#### fileSizeUtils
- `formatFileSize(bytes: number)`: 格式化文件大小
- `formatFileSizeChinese(bytes: number)`: 中文单位格式化
- `getShortFileSize(bytes: number)`: 简短格式

### 数据处理工具

#### filterUtils
- `filterImages(images: ImageItem[], filters: FilterOptions)`: 筛选图片
- `createDefaultFilters()`: 创建默认筛选条件

#### sortUtils
- `getSortedImages(images: ImageItem[], field: SortField, order: SortOrder)`: 排序图片

### 交互工具

#### keyboardShortcuts
- `keyboardManager`: 键盘快捷键管理器
- `COMMON_SHORTCUTS`: 常用快捷键常量
- `SHORTCUT_CATEGORIES`: 快捷键分类

#### toast
- `showSuccess(message: string)`: 显示成功消息
- `showError(message: string)`: 显示错误消息
- `showInfo(message: string)`: 显示信息消息
- `showLoading(message: string)`: 显示加载消息

#### themeUtils
- `applyThemeToDOM(theme: Theme)`: 应用主题到DOM
- `initializeDefaultTheme()`: 初始化默认主题

## 📝 类型定义

### 主题类型

```tsx
type ThemeMode = 'light' | 'dark' | 'auto'

interface ThemeColors {
  background: {
    primary: string
    secondary: string
    tertiary: string
  }
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
  }
  border: {
    primary: string
    secondary: string
    focus: string
  }
  status: {
    success: string
    warning: string
    error: string
    info: string
  }
  interactive: {
    primary: string
    primaryHover: string
    secondary: string
    secondaryHover: string
    disabled: string
  }
  shadow: {
    sm: string
    md: string
    lg: string
  }
}

interface Theme {
  name: string
  colors: ThemeColors
}

interface ThemeContextType {
  currentTheme: Theme
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  setTheme: (themeName: string) => void
  availableThemes: Theme[]
}
```

### 核心类型

```tsx
interface ImageItem {
  id: string
  name: string
  description?: string
  url: string
  githubUrl: string
  tags: string[]
  width: number
  height: number
  size: number
  createdAt: string
  updatedAt: string
}

interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch: string
  path: string
}

interface ImageUploadData {
  file: File
  name?: string
  description?: string
  tags?: string[]
}

interface ImageEditData {
  id: string
  name: string
  description: string
  tags: string[]
}
```

## 🚀 使用示例

### 主题系统使用

**重要：组件库不管理主题状态，主题状态由应用层管理。**

```tsx
import React, { useState, useEffect } from 'react'
import { ThemeProvider, ThemeToggle, ImageBrowser, applyThemeToDOM, themes } from '@packages/ui/src'
import '@packages/ui/dist/index.css'

function App() {
  // 应用层管理主题状态
  const [currentTheme, setCurrentTheme] = useState(themes.light)
  const [themeMode, setThemeMode] = useState('light')
  const [availableThemes] = useState(Object.values(themes))

  // 应用层处理主题切换
  const handleThemeChange = (themeName: string) => {
    const theme = availableThemes.find(t => t.name === themeName)
    if (theme) {
      setCurrentTheme(theme)
      // 应用层可以在这里添加持久化逻辑
      localStorage.setItem('selectedTheme', themeName)
    }
  }

  // 应用层处理模式切换
  const handleModeChange = (mode: string) => {
    setThemeMode(mode)
    // 应用层可以在这里添加持久化逻辑
    localStorage.setItem('themeMode', mode)
  }

  // 应用层初始化主题
  useEffect(() => {
    applyThemeToDOM(currentTheme)
  }, [currentTheme])

  return (
    <ThemeProvider
      currentTheme={currentTheme}
      themeMode={themeMode}
      onThemeChange={handleThemeChange}
      onModeChange={handleModeChange}
      availableThemes={availableThemes}
    >
      <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
        <header className="p-4 border-b border-theme-border-primary">
          <h1 className="text-2xl font-bold">我的应用</h1>
          <ThemeToggle variant="dropdown" />
        </header>
        
        <main className="p-4">
          <ImageBrowser 
            images={images}
            onDeleteImage={handleDeleteImage}
            onUpdateImage={handleUpdateImage}
          />
        </main>
      </div>
    </ThemeProvider>
  )
}
```

### 基本使用

```tsx
import { ImageBrowser, ImageUpload } from '@packages/ui/src'

function App() {
  const [images, setImages] = useState<ImageItem[]>([])
  
  const handleDeleteImage = async (id: string, name: string) => {
    // 实现删除逻辑
  }
  
  const handleUpdateImage = async (data: ImageEditData) => {
    // 实现更新逻辑
  }
  
  return (
    <div>
      <ImageUpload 
        onUploadImage={handleUploadImage}
        onUploadMultipleImages={handleUploadMultipleImages}
        loading={uploading}
        batchUploadProgress={progress}
      />
      
      <ImageBrowser
        images={images}
        onDeleteImage={handleDeleteImage}
        onUpdateImage={handleUpdateImage}
        getImageDimensionsFromUrl={getImageDimensionsFromUrl}
        formatFileSize={formatFileSize}
      />
    </div>
  )
}
```

### 自定义样式

```tsx
import { ImageBrowser } from '@packages/ui/src'
import './custom-styles.css'

<ImageBrowser
  images={images}
  className="custom-image-browser"
  onDeleteImage={handleDeleteImage}
  onUpdateImage={handleUpdateImage}
/>
```

## 🎨 样式定制

所有组件都使用 CSS 模块和 Tailwind CSS，支持自定义样式：

- 组件样式文件位于 `src/components/*/ComponentName.css`
- 支持通过 `className` prop 添加自定义样式
- 使用 CSS 变量进行主题定制

### 主题定制

主题系统使用 CSS 自定义属性，你可以在样式中直接使用这些变量：

```css
.my-component {
  background-color: var(--theme-background-primary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-primary);
  box-shadow: var(--theme-shadow-md);
}

.my-button {
  background-color: var(--theme-interactive-primary);
  color: var(--theme-text-inverse);
}

.my-button:hover {
  background-color: var(--theme-interactive-primaryHover);
}
```

### Tailwind CSS 集成

如果你使用 Tailwind CSS，可以使用预定义的主题类：

```tsx
<div className="bg-theme-background-primary text-theme-text-primary">
  <button className="bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover">
    主题按钮
  </button>
</div>
```

### 可用的 CSS 变量

- `--theme-background-primary` - 主背景色
- `--theme-background-secondary` - 次背景色
- `--theme-background-tertiary` - 第三背景色
- `--theme-text-primary` - 主文本色
- `--theme-text-secondary` - 次文本色
- `--theme-text-tertiary` - 第三文本色
- `--theme-text-inverse` - 反色文本
- `--theme-border-primary` - 主边框色
- `--theme-border-secondary` - 次边框色
- `--theme-border-focus` - 焦点边框色
- `--theme-status-success` - 成功状态色
- `--theme-status-warning` - 警告状态色
- `--theme-status-error` - 错误状态色
- `--theme-status-info` - 信息状态色
- `--theme-interactive-primary` - 主交互色
- `--theme-interactive-primaryHover` - 主交互悬停色
- `--theme-interactive-secondary` - 次交互色
- `--theme-interactive-secondaryHover` - 次交互悬停色
- `--theme-interactive-disabled` - 禁用交互色
- `--theme-shadow-sm` - 小阴影
- `--theme-shadow-md` - 中阴影
- `--theme-shadow-lg` - 大阴影

## 📄 许可证

MIT License