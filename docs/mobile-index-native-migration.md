# 移动端 index.native.ts 迁移说明

## 📋 概述

创建了 `packages/common/src/index.native.ts` 作为 React
Native 环境的专用导出文件，实现 Web 和 Native 代码的完全分离。

## 🎯 设计目标

1. **完全分离**：Web 和 Native 使用不同的入口文件
2. **避免打包**：Web 环境不会打包 React Native 代码
3. **清晰结构**：移动端有专门的入口文件

## 📁 文件结构

```
packages/common/src/
├── index.ts              # Web/Desktop 专用导出
├── index.native.ts       # React Native 专用导出
└── components/
    ├── empty-state/
    │   ├── EmptyState.tsx        # 重新导出 Web 版本
    │   ├── EmptyState.web.tsx    # Web 实现
    │   └── EmptyState.native.tsx # React Native 实现
    └── demo/
        ├── Demo.tsx              # Web 实现（包含工具函数）
        └── Demo.native.tsx       # React Native 实现
```

## 🔄 引入方式

### Web/Desktop 端

```typescript
// 从主入口引入（默认 Web 版本）
import { EmptyState, Demo } from '@packages/common/src';
// 或直接引入 Web 版本
import EmptyState from '@packages/common/src/components/empty-state/EmptyState.web';
```

### React Native 端

```typescript
// 从 Native 入口引入
import {
  EmptyState,
  Demo,
  ImageItem,
  GitHubConfig,
} from '@packages/common/src/index.native';
```

## ✅ 已更新的文件

### packages/common

- ✅ 创建 `index.native.ts` - React Native 专用导出文件
- ✅ 创建 `EmptyState.web.tsx` - Web 专用实现
- ✅ 更新 `EmptyState.tsx` - 重新导出 Web 版本

### apps/mobile

已更新所有文件使用 `@packages/common/src/index.native`：

- ✅ `app/(tabs)/index.tsx`
- ✅ `app/(tabs)/settings/github.tsx`
- ✅ `app/(tabs)/settings/gitee.tsx`
- ✅ `components/ImageGrid.tsx`
- ✅ `components/ImageBrowser.tsx`
- ✅ `components/ImageEditModal.tsx`
- ✅ `components/SlideShowPlayer.tsx`
- ✅ `stores/imageStore.ts`
- ✅ `services/githubStorageService.ts`
- ✅ `services/giteeStorageService.ts`
- ✅ `utils/metadataCache.ts`
- ✅ `config/github.ts`
- ✅ `config/gitee.ts`
- ✅ `i18n/index.ts`

## 📝 index.native.ts 导出内容

### 类型导出

- `ImageItem`, `GitHubConfig`, `GiteeConfig` 等所有类型

### Services 导出

- `GitHubStorageService`
- `GiteeStorageService`
- `PlatformAdapter`

### 组件导出

- `EmptyState` - 从 `EmptyState.native.tsx` 导出
- `Demo` - 从 `Demo.native.tsx` 导出

### 工具函数导出

- `useDemoMode`, `downloadDemoConfig`, `getDemoGitHubConfig` 等
- `formatFileSize`, `filterUtils`, `imageUtils` 等

### 语言包导出

- `defaultTranslate`, `deepMerge`, `zhCN`, `enUS`

### 平台检测导出

- `Platform`, `isReactNative`, `isWeb`, `isDesktop`

## 🚫 不导出的内容

以下组件是 Web/Desktop 专用，不应在 `index.native.ts` 中导出：

- `Sidebar` - Web/Desktop 专用侧边栏
- `Header` - Web/Desktop 专用顶部栏
- `ImageBrowser` - Web 版本（移动端有自己的实现）
- `ImageGrid` - Web 版本（移动端有自己的实现）
- 其他 Web 专用组件

## 🔍 验证清单

- [x] `index.native.ts` 文件已创建
- [x] 移动端所有文件已更新引入路径
- [x] Web 端继续使用 `index.ts`（不受影响）
- [x] 无 TypeScript 编译错误
- [x] 无 Linter 错误

## 📚 使用示例

### 移动端引入示例

```typescript
// 引入类型
import { ImageItem, GitHubConfig } from '@packages/common/src/index.native';

// 引入组件
import { EmptyState, Demo } from '@packages/common/src/index.native';

// 引入工具函数
import { formatFileSize, useDemoMode } from '@packages/common/src/index.native';

// 引入语言包
import { deepMerge, zhCN, enUS } from '@packages/common/src/index.native';
```

## 🎯 优势

1. **完全分离**：Web 和 Native 代码完全分离，互不影响
2. **避免打包**：Web 构建时不会包含 React Native 代码
3. **类型安全**：TypeScript 可以正确识别平台特定的类型
4. **易于维护**：清晰的入口文件，便于管理
5. **Tree-shaking**：更好的代码优化

## 🔄 后续迁移

其他组件可以按照同样的模式迁移：

1. 创建 `.web.tsx` 和 `.native.tsx` 版本
2. 在 `index.native.ts` 中导出 Native 版本
3. 在 `index.ts` 中导出 Web 版本
4. 更新移动端引入路径
