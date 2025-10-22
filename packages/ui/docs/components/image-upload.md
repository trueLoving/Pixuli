# ImageUpload 组件

图片上传组件，支持单文件和批量上传，提供拖拽上传、进度显示等功能。

## 📋 基本用法

```tsx
import { ImageUpload } from 'pixuli-ui/src';

function App() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<BatchUploadProgress | null>(null);

  const handleUploadImage = async (data: ImageUploadData) => {
    setUploading(true);
    try {
      // 实现单文件上传逻辑
      console.log('上传图片:', data);
      // 上传成功后更新图片列表
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadMultipleImages = async (data: MultiImageUploadData) => {
    setUploading(true);
    try {
      // 实现批量上传逻辑
      console.log('批量上传图片:', data);
      // 更新进度
      setProgress({
        total: data.files.length,
        completed: 0,
        failed: 0,
        items: [],
      });
    } catch (error) {
      console.error('批量上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ImageUpload
      onUploadImage={handleUploadImage}
      onUploadMultipleImages={handleUploadMultipleImages}
      loading={uploading}
      batchUploadProgress={progress}
    />
  );
}
```

## 🔧 Props

| 属性                     | 类型                                            | 必需 | 默认值 | 说明           |
| ------------------------ | ----------------------------------------------- | ---- | ------ | -------------- |
| `onUploadImage`          | `(data: ImageUploadData) => Promise<void>`      | ✅   | -      | 单文件上传回调 |
| `onUploadMultipleImages` | `(data: MultiImageUploadData) => Promise<void>` | ✅   | -      | 批量上传回调   |
| `loading`                | `boolean`                                       | ✅   | -      | 上传状态       |
| `batchUploadProgress`    | `BatchUploadProgress \| null`                   | ❌   | -      | 批量上传进度   |
| `t`                      | `(key: string) => string`                       | ❌   | -      | 翻译函数       |

## 📝 类型定义

### ImageUploadData

```tsx
interface ImageUploadData {
  file: File;
  name?: string;
  description?: string;
  tags?: string[];
}
```

### MultiImageUploadData

```tsx
interface MultiImageUploadData {
  files: File[];
  name?: string;
  description?: string;
  tags?: string[];
}
```

### BatchUploadProgress

```tsx
interface BatchUploadProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  items: UploadProgress[];
}

interface UploadProgress {
  id: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  message?: string;
}
```

## 🎨 功能特性

### 拖拽上传

支持拖拽文件到上传区域：

- 拖拽时显示激活状态
- 支持多文件拖拽
- 自动验证文件类型

### 文件选择

支持点击选择文件：

- 支持多文件选择
- 文件类型验证
- 文件大小限制

### 批量上传

支持批量上传多个文件：

- 显示总体进度
- 显示单个文件进度
- 支持失败重试

### 文件预览

上传前可以预览文件：

- 图片预览
- 文件信息显示
- 支持删除单个文件

## 🌍 国际化支持

组件支持国际化，需要传入翻译函数：

```tsx
import { zhCN, defaultTranslate } from 'pixuli-ui/src'

const t = defaultTranslate(zhCN)

<ImageUpload
  onUploadImage={handleUpload}
  onUploadMultipleImages={handleBatchUpload}
  loading={uploading}
  t={t}
/>
```

### 相关翻译 Key

- `image.upload.uploadButton` - 上传按钮
- `image.upload.batchUploadButton` - 批量上传按钮
- `image.upload.dragInactive` - 拖拽提示
- `image.upload.dragActive` - 拖拽激活状态
- `image.upload.supportedFormats` - 支持格式说明
- `image.upload.batchProgress` - 批量上传进度
- `image.upload.uploading` - 上传中状态

## 🎨 自定义样式

```tsx
<ImageUpload
  className="my-upload"
  onUploadImage={handleUpload}
  onUploadMultipleImages={handleBatchUpload}
  loading={uploading}
/>
```

```css
.my-upload {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.my-upload:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.my-upload .upload-area {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.my-upload .progress-bar {
  margin-top: 10px;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.my-upload .progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}
```

## 📱 响应式设计

组件采用响应式设计：

- **桌面端**: 显示完整的拖拽区域和进度信息
- **平板端**: 优化触摸操作体验
- **移动端**: 简化界面，突出文件选择功能

## 🔧 高级用法

### 自定义文件验证

```tsx
const validateFile = (file: File) => {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件类型');
  }

  // 检查文件大小
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('文件大小超过限制');
  }

  return true;
};

<ImageUpload
  onUploadImage={handleUpload}
  onUploadMultipleImages={handleBatchUpload}
  loading={uploading}
  // 可以在回调中实现自定义验证
/>;
```

### 自定义进度显示

```tsx
const [customProgress, setCustomProgress] =
  useState<BatchUploadProgress | null>(null);

const handleBatchUpload = async (data: MultiImageUploadData) => {
  setUploading(true);

  // 初始化进度
  const progress: BatchUploadProgress = {
    total: data.files.length,
    completed: 0,
    failed: 0,
    items: data.files.map(file => ({
      id: file.name,
      progress: 0,
      status: 'uploading' as const,
    })),
  };
  setCustomProgress(progress);

  // 逐个上传文件
  for (let i = 0; i < data.files.length; i++) {
    const file = data.files[i];
    try {
      // 上传文件
      await uploadSingleFile(file);

      // 更新进度
      setCustomProgress(prev => ({
        ...prev!,
        completed: prev!.completed + 1,
        items: prev!.items.map(item =>
          item.id === file.name
            ? { ...item, progress: 100, status: 'success' as const }
            : item
        ),
      }));
    } catch (error) {
      // 更新失败状态
      setCustomProgress(prev => ({
        ...prev!,
        failed: prev!.failed + 1,
        items: prev!.items.map(item =>
          item.id === file.name
            ? { ...item, status: 'error' as const, message: error.message }
            : item
        ),
      }));
    }
  }

  setUploading(false);
};

<ImageUpload
  onUploadImage={handleUpload}
  onUploadMultipleImages={handleBatchUpload}
  loading={uploading}
  batchUploadProgress={customProgress}
/>;
```

## ⚠️ 注意事项

1. **文件类型**: 默认支持常见图片格式，可通过验证函数自定义
2. **文件大小**: 建议设置合理的文件大小限制
3. **进度更新**: 批量上传时需要正确更新进度状态
4. **错误处理**: 上传失败时需要适当的错误提示
5. **国际化**: 使用国际化时确保传入完整的翻译函数

## 🔗 相关组件

- [ImageBrowser](./image-browser.md) - 图片浏览器组件
- [ImageEditModal](./image-edit-modal.md) - 图片编辑模态框
- [ImagePreviewModal](./image-preview-modal.md) - 图片预览模态框
