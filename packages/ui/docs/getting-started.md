# 快速开始指南

本指南将帮助您快速上手 Pixuli UI 组件库。

## 📦 安装

```bash
# 在 monorepo 中使用
pnpm add pixuli-ui

# 或直接导入源码
import { ImageBrowser } from 'pixuli-ui/src'
```

## 🚀 基本使用

### 1. 导入组件和样式

```tsx
import {
  ImageBrowser,
  ImageUpload,
  zhCN,
  defaultTranslate,
} from 'pixuli-ui/src';
import 'pixuli-ui/dist/index.css';
```

### 2. 设置国际化

```tsx
// 使用中文翻译
const t = defaultTranslate(zhCN);

// 或使用英文翻译
import { enUS } from 'pixuli-ui/src';
const t = defaultTranslate(enUS);
```

### 3. 使用图片浏览器

```tsx
function App() {
  const [images, setImages] = useState<ImageItem[]>([]);

  const handleDeleteImage = async (id: string, name: string) => {
    // 实现删除逻辑
    console.log('删除图片:', id, name);
  };

  const handleUpdateImage = async (data: ImageEditData) => {
    // 实现更新逻辑
    console.log('更新图片:', data);
  };

  return (
    <ImageBrowser
      images={images}
      onDeleteImage={handleDeleteImage}
      onUpdateImage={handleUpdateImage}
      t={t}
    />
  );
}
```

### 4. 使用图片上传

```tsx
function UploadPage() {
  const [uploading, setUploading] = useState(false);

  const handleUploadImage = async (data: ImageUploadData) => {
    setUploading(true);
    try {
      // 实现上传逻辑
      console.log('上传图片:', data);
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ImageUpload
      onUploadImage={handleUploadImage}
      onUploadMultipleImages={handleBatchUpload}
      loading={uploading}
      t={t}
    />
  );
}
```

### 5. 使用配置组件

```tsx
function ConfigPage() {
  const [showConfig, setShowConfig] = useState(false);
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);

  const handleSaveConfig = (config: GitHubConfig) => {
    setGithubConfig(config);
    localStorage.setItem('githubConfig', JSON.stringify(config));
    setShowConfig(false);
  };

  return (
    <GitHubConfigModal
      isOpen={showConfig}
      onClose={() => setShowConfig(false)}
      githubConfig={githubConfig}
      onSaveConfig={handleSaveConfig}
      onClearConfig={() => setGithubConfig(null)}
      t={t}
    />
  );
}
```

## 📝 类型定义

### 核心类型

```tsx
interface ImageItem {
  id: string;
  name: string;
  url: string;
  githubUrl: string;
  size: number;
  width: number;
  height: number;
  type: string;
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
}

interface ImageUploadData {
  file: File;
  name?: string;
  description?: string;
  tags?: string[];
}

interface ImageEditData {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
}
```

## 🎨 自定义样式

所有组件都支持通过 `className` prop 添加自定义样式：

```tsx
<ImageBrowser
  className="my-image-browser"
  images={images}
  onDeleteImage={handleDelete}
  onUpdateImage={handleUpdate}
  t={t}
/>
```

```css
.my-image-browser {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.my-image-browser .image-grid {
  gap: 16px;
}

.my-image-browser .image-card {
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.my-image-browser .image-card:hover {
  transform: translateY(-2px);
}
```

## 🔧 高级用法

### 自定义翻译

```tsx
const customTranslations = {
  'app.title': '我的图片管理器',
  'common.save': '保存设置',
  'image.upload.uploadButton': '开始上传',
};

const t = defaultTranslate({
  ...zhCN,
  ...customTranslations,
});
```

### 动态语言切换

```tsx
import { useState } from 'react';
import { defaultTranslate, zhCN, enUS } from 'pixuli-ui/src';

function App() {
  const [language, setLanguage] = useState('zh');

  const translations = language === 'zh' ? zhCN : enUS;
  const t = defaultTranslate(translations);

  return (
    <div>
      <button onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}>
        {language === 'zh' ? 'English' : '中文'}
      </button>

      <ImageBrowser
        images={images}
        t={t}
        onDeleteImage={handleDelete}
        onUpdateImage={handleUpdate}
      />
    </div>
  );
}
```

## 📚 更多文档

- **[组件详细文档](./components/)** - 各组件的详细使用说明和 API 文档
- **[国际化文档](./i18n/)** - 国际化功能使用指南和 Key 值参考

## ⚠️ 注意事项

1. **样式导入**: 记得导入组件库的 CSS 样式文件
2. **类型安全**: 建议使用 TypeScript 确保类型安全
3. **错误处理**: 上传和删除操作需要适当的错误处理
4. **国际化**: 使用国际化时确保传入完整的翻译函数
5. **性能优化**: 大量图片时建议使用虚拟滚动等优化功能
