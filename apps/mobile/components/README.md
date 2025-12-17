# Components 目录说明

本目录包含移动端应用的所有 React Native 组件，按功能域进行分类组织。

## 目录结构

```
components/
│
├── ui/                                    # 基础 UI 组件 (5个)
│   ├── ThemedText.tsx                    # 主题化文本组件
│   ├── ThemedView.tsx                    # 主题化视图组件
│   ├── HapticTab.tsx                    # Tab 栏触觉反馈组件
│   ├── IconSymbol.tsx                   # 图标组件（通用）
│   ├── IconSymbol.ios.tsx              # 图标组件（iOS 特定）
│   └── index.ts                         # 统一导出
│
├── image/                                 # 图片相关组件 (7个)
│   ├── ImageGrid.tsx                    # 图片网格展示
│   ├── ImageBrowser.tsx                 # 图片浏览器（查看/缩放/删除）
│   ├── ImageUploadButton.tsx           # 图片上传按钮（FAB）
│   ├── SlideShowPlayer.tsx              # 幻灯片播放器
│   ├── index.ts                         # 统一导出
│   └── modals/                          # 图片相关模态框
│       ├── ImageEditModal.tsx          # 编辑图片元数据（名称/描述/标签）
│       ├── ImageCropModal.tsx          # 图片裁剪功能
│       ├── ImageUploadEditModal.tsx   # 上传前编辑（压缩/裁剪/元数据）
│       └── index.ts                    # 统一导出
│
├── settings/                              # 设置相关组件 (5个)
│   └── modals/                          # 设置模态框
│       ├── StorageConfigModal.tsx      # 存储配置（GitHub/Gitee）
│       ├── AddSourceModal.tsx          # 添加仓库源选择
│       ├── ThemeModal.tsx              # 主题设置（浅色/深色/自动）
│       ├── LanguageModal.tsx           # 语言设置（中文/英文）
│       ├── HelpModal.tsx               # 帮助文档
│       └── index.ts                    # 统一导出
│
├── navigation/                            # 导航相关组件 (1个)
│   ├── DrawerMenu.tsx                   # 侧边抽屉菜单（浏览模式/存储配置）
│   └── index.ts                         # 统一导出
│
└── search/                                # 搜索筛选组件 (1个)
    ├── SearchAndFilter.tsx              # 搜索和筛选功能（搜索框/筛选器/排序）
    └── index.ts                         # 统一导出
```

## 组件分类说明

### 1. `ui/` - 基础 UI 组件

**职责**: 提供基础的可复用 UI 元素，被所有其他组件依赖

**组件列表**:

- `ThemedText` - 主题化文本组件，支持浅色/深色主题
- `ThemedView` - 主题化视图组件，支持浅色/深色主题
- `IconSymbol` - 图标组件，使用 SF Symbols（iOS）和 Material Icons
- `HapticTab` - Tab 栏触觉反馈组件，提供触觉反馈增强用户体验

**使用示例**:

```typescript
import { ThemedText, ThemedView, IconSymbol } from '@/components/ui';

<ThemedView>
  <ThemedText>Hello World</ThemedText>
  <IconSymbol name="house.fill" size={24} color={colors.primary} />
</ThemedView>
```

### 2. `image/` - 图片相关组件

**职责**: 处理图片的展示、上传、编辑等功能

**组件分类**:

- **展示组件**: `ImageGrid`, `ImageBrowser`, `SlideShowPlayer`
- **操作组件**: `ImageUploadButton`
- **模态框**: `ImageEditModal`, `ImageCropModal`, `ImageUploadEditModal`

**组件说明**:

- `ImageGrid` - 图片网格展示，支持下拉刷新、无限滚动
- `ImageBrowser` - 图片浏览器，支持缩放、滑动切换、删除
- `ImageUploadButton` - 图片上传按钮，支持拍照、相册选择
- `SlideShowPlayer` - 幻灯片播放器，自动播放图片
- `ImageEditModal` - 编辑图片元数据（名称、描述、标签）
- `ImageCropModal` - 图片裁剪功能
- `ImageUploadEditModal` - 上传前编辑（压缩、裁剪、元数据）

**使用示例**:

```typescript
import { ImageGrid, ImageBrowser } from '@/components/image';
import { ImageEditModal } from '@/components/image/modals';

<ImageGrid
  images={images}
  onImagePress={handleImagePress}
  numColumns={2}
/>
```

### 3. `settings/` - 设置相关组件

**职责**: 应用设置和配置相关的模态框

**组件列表**:

- `StorageConfigModal` - 存储配置（GitHub/Gitee 仓库配置）
- `AddSourceModal` - 添加仓库源选择
- `ThemeModal` - 主题设置（浅色/深色/自动）
- `LanguageModal` - 语言设置（中文/英文）
- `HelpModal` - 帮助文档

**使用示例**:

```typescript
import { StorageConfigModal, ThemeModal } from '@/components/settings/modals';

<StorageConfigModal
  visible={visible}
  onClose={handleClose}
  type="github"
  onSave={handleSave}
/>
```

### 4. `navigation/` - 导航相关组件

**职责**: 应用导航相关的组件

**组件列表**:

- `DrawerMenu` - 侧边抽屉菜单，包含浏览模式切换和存储配置管理

**使用示例**:

```typescript
import { DrawerMenu } from '@/components/navigation';

<DrawerMenu
  visible={drawerVisible}
  onClose={() => setDrawerVisible(false)}
  onBrowseModeChange={handleBrowseModeChange}
  currentBrowseMode={browseMode}
/>
```

### 5. `search/` - 搜索筛选组件

**职责**: 搜索和筛选功能

**组件列表**:

- `SearchAndFilter` - 搜索和筛选功能，包含搜索框、筛选器、排序

**使用示例**:

```typescript
import { SearchAndFilter } from '@/components/search';

<SearchAndFilter
  currentBrowseMode={browseMode}
  onBrowseModeChange={handleBrowseModeChange}
/>
```

## 组件统计

| 分类            | 数量   | 说明                     |
| --------------- | ------ | ------------------------ |
| **UI 基础组件** | 5      | 可复用的基础 UI 元素     |
| **图片组件**    | 7      | 图片展示、上传、编辑相关 |
| **设置组件**    | 5      | 应用设置和配置           |
| **导航组件**    | 1      | 应用导航相关             |
| **搜索组件**    | 1      | 搜索和筛选功能           |
| **总计**        | **19** | -                        |

## 组件依赖关系

```
ui/ (基础层)
  ├── ThemedText, ThemedView, IconSymbol, HapticTab
  └── 被所有其他组件依赖

image/ (功能层)
  ├── ImageGrid, ImageBrowser, ImageUploadButton, SlideShowPlayer
  └── modals/ (ImageEditModal, ImageCropModal, ImageUploadEditModal)
  └── 依赖: ui/

settings/ (功能层)
  └── modals/ (StorageConfigModal, AddSourceModal, ThemeModal, LanguageModal, HelpModal)
  └── 依赖: ui/

navigation/ (功能层)
  └── DrawerMenu
  └── 依赖: ui/, settings/modals/StorageConfigModal

search/ (功能层)
  └── SearchAndFilter
  └── 依赖: ui/
```

## 导入方式

### 方式 1: 使用索引文件（推荐）

```typescript
// 基础 UI 组件
import { ThemedText, ThemedView, IconSymbol } from '@/components/ui';

// 图片组件
import { ImageGrid, ImageBrowser } from '@/components/image';
import { ImageEditModal } from '@/components/image/modals';

// 设置组件
import { StorageConfigModal, ThemeModal } from '@/components/settings/modals';

// 导航组件
import { DrawerMenu } from '@/components/navigation';

// 搜索组件
import { SearchAndFilter } from '@/components/search';
```

### 方式 2: 直接导入

```typescript
import { ThemedText } from '@/components/ui/ThemedText';
import { ImageGrid } from '@/components/image/ImageGrid';
import { StorageConfigModal } from '@/components/settings/modals/StorageConfigModal';
```

## 目录命名规范

- **小写字母**: 目录名使用小写字母
- **单数形式**: 目录名使用单数形式（如 `image` 而非 `images`）
- **功能分组**: 按功能域而非技术类型分组
- **modals 子目录**: 模态框组件统一放在 `modals/` 子目录
- **索引文件**: 每个目录都有 `index.ts` 文件，方便统一导入

## 开发指南

### 添加新组件

1. **确定组件分类**: 根据组件功能确定应该放在哪个目录
2. **创建组件文件**: 在对应目录创建组件文件
3. **更新索引文件**: 在目录的 `index.ts` 中添加导出
4. **更新文档**: 如有必要，更新本 README 文档

### 组件命名规范

- 组件文件名使用 PascalCase（如 `ImageGrid.tsx`）
- 组件导出名称与文件名保持一致
- 模态框组件以 `Modal` 结尾（如 `ImageEditModal.tsx`）

### 相对路径引用

组件内部引用其他组件时，使用相对路径：

- 同级目录: `./ComponentName`
- 上级目录: `../ComponentName`
- UI 组件: `../../ui/ComponentName`（从 modals 目录）或
  `../ui/ComponentName`（从功能目录）

## 未来扩展建议

### 可能的新分类

- `forms/` - 表单组件（如果未来有更多表单）
- `layout/` - 布局组件（如果未来有更多布局相关）
- `feedback/` - 反馈组件（Toast、Alert 等）
- `media/` - 媒体组件（如果未来支持视频等）

### 组件拆分建议

- 如果某个组件文件过大（>500行），考虑拆分为多个子组件
- 如果某个目录下组件过多（>10个），考虑进一步细分
- 保持组件的单一职责原则

## 注意事项

- 所有组件都应该支持主题（浅色/深色模式）
- 使用 `ThemedText` 和 `ThemedView` 而不是原生的 `Text` 和 `View`
- 图标使用 `IconSymbol` 组件，确保跨平台兼容性
- 模态框组件应该处理安全区域（Safe Area）
- 保持组件的可复用性和可测试性
