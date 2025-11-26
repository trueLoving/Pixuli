# Pixuli Common

Pixuli
Common 是 Pixuli 项目的共享库，提供三端（Web、Desktop、Mobile）通用的 React 组件、Hooks、工具函数和服务。

## 📦 安装

```bash
# 在 monorepo 中使用
pnpm add pixuli-common

# 或直接导入源码
import { ImageBrowser } from 'pixuli-common/src'
```

## 🚀 功能模块

### 组件 (Components)

#### 图片浏览相关

- **ImageBrowser** - 图片浏览器主组件
- **ImageGrid** - 图片网格视图
- **ImageList** - 图片列表视图
- **ImageFilter** - 图片过滤器
- **ImageSorter** - 图片排序器
- **ImagePreviewModal** - 图片预览模态框
- **ImageUrlModal** - 图片 URL 模态框
- **ImageEditModal** - 图片编辑模态框

#### 图片上传相关

- **ImageUpload** - 图片上传组件
- **ImageCropModal** - 图片裁剪模态框

#### 其他组件

- **ImageSearch** - 图片搜索组件
- **SlideShowPlayer** - 幻灯片播放器
- **SlideShowSettings** - 幻灯片设置
- **PhotoWall** - 照片墙组件
- **Gallery3D** - 3D 画廊组件
- **BrowseModeSwitcher** - 浏览模式切换器
- **GitHubConfigModal** - GitHub 配置模态框
- **GiteeConfigModal** - Gitee 配置模态框
- **KeyboardHelpModal** - 键盘快捷键帮助模态框
- **LanguageSwitcher** - 语言切换器
- **Toaster** - 消息提示组件

### Hooks

- **useVirtualScroll** - 虚拟滚动 Hook
- **useLazyLoad** - 懒加载 Hook
- **useInfiniteScroll** - 无限滚动 Hook
- **useImageDimensions** - 图片尺寸 Hook
- **useImageInfo** - 图片信息 Hook
- **useImageDimensionsFromUrl** - 从 URL 获取图片尺寸 Hook
- **useKeyboard** - 键盘事件 Hook
- **useKeyboardShortcut** - 键盘快捷键 Hook
- **useKeyboardMultiple** - 多按键监听 Hook
- **useEscapeKey** - Escape 键 Hook
- **useEnterKey** - Enter 键 Hook
- **useArrowKeys** - 方向键 Hook
- **useNumberKeys** - 数字键 Hook
- **useLetterKeys** - 字母键 Hook

### 工具函数 (Utils)

- **toast** - 消息提示工具
- **fileSizeUtils** - 文件大小格式化工具
- **filterUtils** - 过滤工具函数
- **imageUtils** - 图片处理工具（压缩、转换、尺寸获取等）
- **keyboardShortcuts** - 键盘快捷键管理系统
- **sortUtils** - 排序工具函数
- **dateUtils** - 日期工具函数

### 服务 (Services)

- **GiteeStorageService** - Gitee 存储服务
- **GitHubStorageService** - GitHub 存储服务

### 类型定义 (Types)

- **image.ts** - 图片相关类型
- **github.ts** - GitHub 相关类型
- **gitee.ts** - Gitee 相关类型

### 国际化 (Locales)

- 支持中文（zh-CN）和英文（en-US）
- 提供语言包合并和默认翻译功能

## 📝 使用示例

### 基础组件使用

```tsx
import { ImageBrowser, ImageUpload, ImageSearch } from 'pixuli-common';

function App() {
  return (
    <>
      <ImageBrowser images={images} />
      <ImageUpload onUpload={handleUpload} />
      <ImageSearch onSearch={handleSearch} />
    </>
  );
}
```

### Hooks 使用

```tsx
import { useImageDimensions, useKeyboard } from 'pixuli-common';

function MyComponent() {
  const { dimensions, loading } = useImageDimensions(file);
  const { isPressed } = useKeyboard('Escape', () => {
    // 处理 Escape 键
  });

  return <div>...</div>;
}
```

### 工具函数使用

```tsx
import { formatFileSize, compressImage, keyboardManager } from 'pixuli-common';

// 格式化文件大小
const size = formatFileSize(1024 * 1024); // "1 MB"

// 压缩图片
const compressed = await compressImage(file, { quality: 0.8 });

// 注册快捷键
keyboardManager.register({
  key: 's',
  ctrlKey: true,
  description: '保存',
  action: () => save(),
  category: '通用',
});
```

## 🛠️ 开发

### 构建

```bash
pnpm build
```

### 开发模式（监听文件变化）

```bash
pnpm dev
```

### 测试

```bash
# 运行测试
pnpm test

# 监听模式
pnpm test:watch

# UI 模式
pnpm test:ui

# 覆盖率
pnpm test:coverage
```

## 📊 测试覆盖

包内包含完整的单元测试，覆盖：

- ✅ 所有 Hooks（6 个）
- ✅ 所有工具函数（7 个）
- ✅ 组件功能测试

测试使用 Vitest + React Testing Library，环境为 jsdom。

## 📄 许可证

MIT

## 👤 作者

trueLoving
