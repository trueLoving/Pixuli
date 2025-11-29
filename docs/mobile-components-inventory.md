# 移动端组件清单

## 移动端现有组件列表

### 1. 核心组件

| 组件名              | 文件路径                         | 功能描述                         | 是否可迁移 | 优先级 |
| ------------------- | -------------------------------- | -------------------------------- | ---------- | ------ |
| **ImageGrid**       | `components/ImageGrid.tsx`       | 图片网格展示，支持下拉刷新       | ✅ 是      | 高     |
| **ImageBrowser**    | `components/ImageBrowser.tsx`    | 图片浏览器，支持缩放、旋转、编辑 | ⚠️ 部分    | 中     |
| **SlideShowPlayer** | `components/SlideShowPlayer.tsx` | 幻灯片播放器                     | ✅ 是      | 高     |
| **SearchAndFilter** | `components/SearchAndFilter.tsx` | 搜索和筛选组件                   | ✅ 是      | 高     |

### 2. 上传相关组件

| 组件名                   | 文件路径                              | 功能描述                     | 是否可迁移 | 优先级 |
| ------------------------ | ------------------------------------- | ---------------------------- | ---------- | ------ |
| **ImageUploadButton**    | `components/ImageUploadButton.tsx`    | 图片上传按钮，支持拍照和选择 | ⚠️ 部分    | 中     |
| **ImageUploadEditModal** | `components/ImageUploadEditModal.tsx` | 上传前编辑模态框             | ⚠️ 部分    | 低     |
| **ImageCropModal**       | `components/ImageCropModal.tsx`       | 图片裁剪模态框               | ⚠️ 部分    | 低     |

### 3. 编辑相关组件

| 组件名             | 文件路径                        | 功能描述                     | 是否可迁移 | 优先级 |
| ------------------ | ------------------------------- | ---------------------------- | ---------- | ------ |
| **ImageEditModal** | `components/ImageEditModal.tsx` | 图片编辑模态框（元数据编辑） | ✅ 是      | 中     |

### 4. 基础 UI 组件

| 组件名         | 文件路径                       | 功能描述     | 是否可迁移 | 优先级 |
| -------------- | ------------------------------ | ------------ | ---------- | ------ |
| **ThemedText** | `components/ThemedText.tsx`    | 主题文本组件 | ❌ 否      | -      |
| **ThemedView** | `components/ThemedView.tsx`    | 主题视图组件 | ❌ 否      | -      |
| **IconSymbol** | `components/ui/IconSymbol.tsx` | 图标组件     | ⚠️ 部分    | 低     |
| **HapticTab**  | `components/HapticTab.tsx`     | 触觉反馈标签 | ❌ 否      | -      |

## 迁移策略

### 高优先级（立即迁移）

1. **ImageGrid** - 核心展示组件，逻辑简单
2. **SlideShowPlayer** - 已有 Web 版本，需要适配
3. **SearchAndFilter** - 搜索逻辑可共享

### 中优先级（后续迁移）

4. **ImageBrowser** - 复杂交互，需要仔细设计
5. **ImageEditModal** - 编辑逻辑可共享
6. **ImageUploadButton** - 上传逻辑可共享，但平台差异大

### 低优先级（未来考虑）

7. **ImageCropModal** - 裁剪功能，平台差异大
8. **ImageUploadEditModal** - 上传前编辑，平台特定

## packages/common 中已有的组件

### 可直接适配的组件

- ✅ **EmptyState** - 空状态组件
- ✅ **Demo** - Demo 模式组件（已迁移，需 RN 适配）
- ✅ **VersionInfoModal** - 版本信息模态框
- ✅ **KeyboardHelpModal** - 键盘帮助模态框
- ✅ **GitHubConfigModal** - GitHub 配置模态框
- ✅ **GiteeConfigModal** - Gitee 配置模态框
- ✅ **SlideShowPlayer** - 幻灯片播放器（Web 版本）
- ✅ **ImageGrid** - 图片网格（Web 版本）
- ✅ **ImageBrowser** - 图片浏览器（Web 版本）
- ✅ **ImageFilter** - 图片筛选（Web 版本）
- ✅ **ImageSearch** - 图片搜索（Web 版本）

## 迁移顺序

### 阶段一：基础设施 + 简单组件

1. 创建平台检测层
2. 迁移 EmptyState
3. 迁移 Demo（RN 适配）
4. 迁移 VersionInfoModal

### 阶段二：核心展示组件

5. 迁移 ImageGrid
6. 迁移 SlideShowPlayer
7. 迁移 SearchAndFilter

### 阶段三：复杂交互组件

8. 迁移 ImageBrowser
9. 迁移 ImageEditModal
10. 迁移 ImageUpload（部分）
