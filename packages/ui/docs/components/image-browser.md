# ImageBrowser 组件

主要的图片浏览器组件，集成了网格/列表视图切换、排序、筛选等功能。

## 📋 基本用法

```tsx
import { ImageBrowser } from 'pixuli-ui/src';

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
    />
  );
}
```

## 🔧 Props

| 属性                        | 类型                                                        | 必需 | 默认值 | 说明               |
| --------------------------- | ----------------------------------------------------------- | ---- | ------ | ------------------ |
| `images`                    | `ImageItem[]`                                               | ✅   | -      | 图片数据数组       |
| `className`                 | `string`                                                    | ❌   | -      | 自定义 CSS 类名    |
| `onDeleteImage`             | `(id: string, name: string) => Promise<void>`               | ❌   | -      | 删除图片回调       |
| `onUpdateImage`             | `(data: ImageEditData) => Promise<void>`                    | ❌   | -      | 更新图片回调       |
| `getImageDimensionsFromUrl` | `(url: string) => Promise<{width: number, height: number}>` | ❌   | -      | 获取图片尺寸函数   |
| `formatFileSize`            | `(size: number) => string`                                  | ❌   | -      | 格式化文件大小函数 |
| `t`                         | `(key: string) => string`                                   | ❌   | -      | 翻译函数           |

## 📝 类型定义

### ImageItem

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
```

### ImageEditData

```tsx
interface ImageEditData {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
}
```

## 🎨 功能特性

### 视图模式切换

组件内置了网格和列表两种视图模式：

- **网格视图**: 以卡片形式展示图片，适合浏览
- **列表视图**: 以表格形式展示图片，适合管理

### 排序功能

支持多种排序方式：

- 按创建时间排序
- 按文件名排序
- 按文件大小排序
- 按图片尺寸排序

### 筛选功能

支持多种筛选条件：

- 按标签筛选
- 按文件类型筛选
- 按文件大小范围筛选
- 按日期范围筛选

### 键盘导航

支持完整的键盘操作：

- `↑↓←→` - 选择图片
- `Enter` - 预览图片
- `Delete` - 删除图片
- `E` - 编辑图片
- `F1` - 显示帮助

## 🌍 国际化支持

组件支持国际化，需要传入翻译函数：

```tsx
import { zhCN, defaultTranslate } from 'pixuli-ui/src'

const t = defaultTranslate(zhCN)

<ImageBrowser
  images={images}
  t={t}
  onDeleteImage={handleDelete}
  onUpdateImage={handleUpdate}
/>
```

### 相关翻译 Key

- `image.browse` - 浏览图片
- `image.filter.title` - 图片筛选
- `image.sorter.label` - 排序
- `image.viewMode.grid` - 网格
- `image.viewMode.list` - 列表

## 🎨 自定义样式

```tsx
<ImageBrowser
  className="my-image-browser"
  images={images}
  onDeleteImage={handleDelete}
  onUpdateImage={handleUpdate}
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

## 📱 响应式设计

组件采用响应式设计，自动适配不同屏幕尺寸：

- **桌面端**: 显示完整的筛选和排序功能
- **平板端**: 优化触摸操作体验
- **移动端**: 简化界面，突出核心功能

## 🔧 高级用法

### 自定义筛选器

```tsx
const customFilters = {
  tags: ['风景', '人物'],
  fileTypes: ['jpg', 'png'],
  sizeRange: {
    min: 1024,
    max: 1024 * 1024 * 10 // 10MB
  }
}

<ImageBrowser
  images={images}
  onDeleteImage={handleDelete}
  onUpdateImage={handleUpdate}
  // 可以通过子组件自定义筛选器
/>
```

### 自定义排序器

```tsx
const customSortOptions = [
  { value: 'createdAt', label: '按上传时间' },
  { value: 'name', label: '按文件名' },
  { value: 'size', label: '按文件大小' }
]

<ImageBrowser
  images={images}
  onDeleteImage={handleDelete}
  onUpdateImage={handleUpdate}
  // 可以通过子组件自定义排序器
/>
```

## ⚠️ 注意事项

1. **性能优化**: 大量图片时建议使用虚拟滚动
2. **图片尺寸**: 建议提供 `getImageDimensionsFromUrl` 函数获取准确尺寸
3. **文件大小**: 建议提供 `formatFileSize` 函数格式化文件大小显示
4. **错误处理**: 删除和更新操作需要适当的错误处理
5. **国际化**: 使用国际化时确保传入完整的翻译函数

## 🔗 相关组件

- [ImageGrid](./image-grid.md) - 网格视图组件
- [ImageList](./image-list.md) - 列表视图组件
- [ImageFilter](./image-filter.md) - 筛选组件
- [ImageSorter](./image-sorter.md) - 排序组件
- [ViewToggle](./view-toggle.md) - 视图切换组件
