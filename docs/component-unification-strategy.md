# 组件统一化方案

将移动端组件与 Web/桌面端组件统一到 `packages/common` 的方案。

## 📊 当前状况分析

### packages/common 组件（Web/Desktop）

- **技术栈**：React + DOM + CSS
- **组件类型**：HTML 元素（div, button, input 等）
- **样式方案**：CSS 文件
- **依赖**：`react`, `react-dom`, `lucide-react`

### apps/mobile 组件（Mobile）

- **技术栈**：React Native
- **组件类型**：RN 原生组件（View, Text, TouchableOpacity 等）
- **样式方案**：StyleSheet API
- **依赖**：`react-native`, `expo-image`, `@expo/vector-icons`

### 共同点

- 都使用 React
- 都使用 TypeScript
- 都使用 Zustand 进行状态管理
- 共享类型定义（`ImageItem`, `GitHubConfig`, `GiteeConfig` 等）
- 共享服务层（`GitHubStorageService`, `GiteeStorageService`）

### 差异点

- UI 渲染层完全不同（DOM vs RN）
- 样式系统不同（CSS vs StyleSheet）
- 图标库不同（lucide-react vs @expo/vector-icons）
- 图片组件不同（img vs expo-image）
- 导航系统不同（路由 vs expo-router）

## 🎯 统一化目标

1. **代码复用**：最大化共享业务逻辑和类型定义
2. **一致性**：确保跨平台功能和行为一致
3. **可维护性**：减少重复代码，统一维护
4. **可扩展性**：便于添加新平台

## 🏗️ 方案选择

### 方案一：适配器模式（推荐）⭐

**核心思想**：在 `packages/common` 中创建平台适配层，组件内部根据平台选择实现。

**优点**：

- 单一代码库，统一维护
- 业务逻辑完全共享
- 类型安全
- 易于测试

**缺点**：

- 需要处理平台差异
- 组件体积可能稍大

**实现方式**：

```typescript
// packages/common/src/components/image-grid/ImageGrid.tsx
import { Platform } from './platform';

export function ImageGrid(props: ImageGridProps) {
  if (Platform.isReactNative) {
    return <ImageGridRN {...props} />;
  }
  return <ImageGridWeb {...props} />;
}
```

### 方案二：抽象层模式

**核心思想**：定义抽象接口，各平台提供具体实现。

**优点**：

- 平台实现完全独立
- 灵活性高

**缺点**：

- 代码重复
- 维护成本高
- 难以保证一致性

### 方案三：共享逻辑 + 平台 UI

**核心思想**：将业务逻辑提取到 common，UI 层在各平台实现。

**优点**：

- 逻辑复用
- UI 完全独立

**缺点**：

- 仍需要维护多套 UI
- 一致性难以保证

### 方案四：React Native Web

**核心思想**：使用 `react-native-web` 让 RN 组件在 Web 上运行。

**优点**：

- 单一实现
- 完全一致

**缺点**：

- Web 端性能可能不如原生 DOM
- 样式限制
- 需要重构现有 Web 组件

## 🚀 推荐方案：适配器模式 + 共享逻辑

结合方案一和方案三的优点，采用分层架构：

```
packages/common/
├── src/
│   ├── components/
│   │   ├── image-grid/
│   │   │   ├── ImageGrid.tsx          # 适配器入口
│   │   │   ├── ImageGrid.web.tsx      # Web 实现
│   │   │   ├── ImageGrid.native.tsx   # RN 实现
│   │   │   ├── useImageGrid.ts        # 共享逻辑 Hook
│   │   │   ├── ImageGrid.css          # Web 样式
│   │   │   └── ImageGrid.styles.ts    # RN 样式
│   │   └── ...
│   ├── platform/
│   │   ├── index.ts                   # 平台检测
│   │   ├── web.tsx                    # Web 适配器组件
│   │   └── native.tsx                 # RN 适配器组件
│   └── ...
```

## 📝 具体实现方案

### 1. 平台检测层

```typescript
// packages/common/src/platform/index.ts
export const Platform = {
  isReactNative:
    typeof window === 'undefined' ||
    (typeof navigator !== 'undefined' && navigator.product === 'ReactNative'),
  isWeb: typeof window !== 'undefined' && typeof document !== 'undefined',
  isDesktop: false, // 可以通过 Electron 检测
};

// 平台适配器组件
export const View = Platform.isReactNative
  ? require('react-native').View
  : 'div';

export const Text = Platform.isReactNative
  ? require('react-native').Text
  : 'span';

export const TouchableOpacity = Platform.isReactNative
  ? require('react-native').TouchableOpacity
  : 'button';
```

### 2. 组件适配器模式

```typescript
// packages/common/src/components/image-grid/ImageGrid.tsx
import { Platform } from '../../platform';
import { ImageGridWeb } from './ImageGrid.web';
import { ImageGridNative } from './ImageGrid.native';
import { useImageGrid } from './useImageGrid';

export interface ImageGridProps {
  images: ImageItem[];
  onImagePress?: (image: ImageItem) => void;
  numColumns?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ImageGrid(props: ImageGridProps) {
  const logic = useImageGrid(props);

  if (Platform.isReactNative) {
    return <ImageGridNative {...props} {...logic} />;
  }
  return <ImageGridWeb {...props} {...logic} />;
}
```

### 3. 共享业务逻辑

```typescript
// packages/common/src/components/image-grid/useImageGrid.ts
import { useMemo, useCallback } from 'react';
import { ImageItem } from '../../types/image';

export function useImageGrid(props: ImageGridProps) {
  const { images, onImagePress } = props;

  const handleImagePress = useCallback(
    (image: ImageItem) => {
      onImagePress?.(image);
    },
    [onImagePress],
  );

  const processedImages = useMemo(() => {
    // 共享的图片处理逻辑
    return images.map(img => ({
      ...img,
      // 处理逻辑
    }));
  }, [images]);

  return {
    processedImages,
    handleImagePress,
    // 其他共享逻辑
  };
}
```

### 4. Web 实现

```typescript
// packages/common/src/components/image-grid/ImageGrid.web.tsx
import React from 'react';
import './ImageGrid.css';

export function ImageGridWeb(props: ImageGridProps & ReturnType<typeof useImageGrid>) {
  const { processedImages, handleImagePress } = props;

  return (
    <div className="image-grid">
      {processedImages.map(image => (
        <div
          key={image.id}
          className="image-item"
          onClick={() => handleImagePress(image)}
        >
          <img src={image.url} alt={image.name} />
          <span>{image.name}</span>
        </div>
      ))}
    </div>
  );
}
```

### 5. React Native 实现

```typescript
// packages/common/src/components/image-grid/ImageGrid.native.tsx
import React from 'react';
import { FlatList, View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from './ImageGrid.styles';

export function ImageGridNative(props: ImageGridProps & ReturnType<typeof useImageGrid>) {
  const { processedImages, handleImagePress, numColumns = 2 } = props;

  return (
    <FlatList
      data={processedImages}
      numColumns={numColumns}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.imageItem}
          onPress={() => handleImagePress(item)}
        >
          <Image source={{ uri: item.url }} style={styles.image} />
          <Text style={styles.imageName}>{item.name}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={item => item.id}
    />
  );
}
```

## 🔄 迁移计划

### 阶段一：基础设施搭建

1. **创建平台检测层**

   ```bash
   packages/common/src/platform/
   ├── index.ts
   ├── web.tsx
   └── native.tsx
   ```

2. **创建共享类型和工具**
   - 确保所有类型定义在 common 中
   - 创建共享的工具函数

3. **设置构建配置**
   - 配置 tsup 支持多入口
   - 配置条件导出（package.json exports）

### 阶段二：迁移简单组件

优先迁移逻辑简单、平台差异小的组件：

1. **EmptyState**
   - 逻辑简单
   - 主要是展示
   - 平台差异小

2. **Demo**
   - 已迁移到 common
   - 需要添加 RN 适配

3. **VersionInfoModal**
   - 逻辑简单
   - 主要是展示

### 阶段三：迁移复杂组件

迁移需要复杂交互的组件：

1. **ImageGrid**
   - 提取共享逻辑
   - 创建 Web 和 RN 实现

2. **ImageBrowser**
   - 复杂的图片浏览逻辑
   - 需要处理平台差异

3. **SearchAndFilter**
   - 搜索和筛选逻辑
   - 模态框实现差异

4. **SlideShowPlayer**
   - 播放逻辑可以共享
   - UI 实现需要平台特定

### 阶段四：迁移业务组件

1. **Sidebar**
   - 导航逻辑共享
   - UI 适配（Web 侧边栏 vs RN 抽屉）

2. **Header**
   - 搜索逻辑共享
   - UI 适配

3. **ImageUpload**
   - 上传逻辑共享
   - 文件选择差异（Web 拖拽 vs RN 选择器）

## 📦 包结构设计

### package.json 配置

```json
{
  "name": "pixuli-common",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "web": "./dist/index.web.js",
      "native": "./dist/index.native.js",
      "default": "./dist/index.js"
    },
    "./platform": {
      "web": "./dist/platform/web.js",
      "native": "./dist/platform/native.js",
      "default": "./dist/platform/index.js"
    }
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-native": "^0.81.0"
  },
  "dependencies": {
    "lucide-react": "^0.263.1",
    "@expo/vector-icons": "^15.0.0",
    "zustand": "^4.4.1"
  }
}
```

### 构建配置

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig([
  // Web 构建
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    platform: 'browser',
    outDir: 'dist',
    external: ['react', 'react-dom'],
  },
  // React Native 构建
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    platform: 'node',
    outDir: 'dist',
    external: ['react', 'react-native'],
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        'process.env.PLATFORM': '"native"',
      };
    },
  },
]);
```

## 🎨 样式统一方案

### Web 样式（CSS）

```css
/* ImageGrid.css */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.image-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}
```

### React Native 样式（StyleSheet）

```typescript
// ImageGrid.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  imageGrid: {
    flex: 1,
    padding: 16,
  },
  imageItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
```

### 共享设计令牌

```typescript
// packages/common/src/design-tokens.ts
export const DesignTokens = {
  colors: {
    primary: '#7c3aed',
    secondary: '#4f46e5',
    background: '#ffffff',
    // ...
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};
```

## 🔧 工具函数统一

### 图标适配

```typescript
// packages/common/src/components/ui/Icon.tsx
import { Platform } from '../../platform';
import * as LucideIcons from 'lucide-react';
import { Ionicons } from '@expo/vector-icons';

export function Icon({ name, size, color }: IconProps) {
  if (Platform.isReactNative) {
    // 映射 lucide 图标名到 Ionicons
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'search': 'search',
      'filter': 'filter',
      // ...
    };
    return <Ionicons name={iconMap[name]} size={size} color={color} />;
  }

  const IconComponent = LucideIcons[name as keyof typeof LucideIcons];
  return <IconComponent size={size} color={color} />;
}
```

### 图片组件适配

```typescript
// packages/common/src/components/ui/Image.tsx
import { Platform } from '../../platform';

export function Image({ source, style, ...props }: ImageProps) {
  if (Platform.isReactNative) {
    const { Image: RNImage } = require('expo-image');
    return <RNImage source={{ uri: source }} style={style} {...props} />;
  }

  return <img src={source} style={style} {...props} />;
}
```

## 📋 迁移清单

### 高优先级组件

- [ ] **EmptyState** - 简单，迁移成本低
- [ ] **Demo** - 已部分迁移，需要 RN 适配
- [ ] **VersionInfoModal** - 简单展示组件
- [ ] **KeyboardHelpModal** - 展示组件
- [ ] **GitHubConfigModal** - 表单组件
- [ ] **GiteeConfigModal** - 表单组件

### 中优先级组件

- [ ] **ImageGrid** - 核心组件，需要仔细设计
- [ ] **ImageBrowser** - 复杂交互
- [ ] **SearchAndFilter** - 搜索逻辑共享
- [ ] **SlideShowPlayer** - 播放逻辑共享
- [ ] **ImageUpload** - 上传逻辑共享

### 低优先级组件

- [ ] **Sidebar** - 需要适配导航差异
- [ ] **Header** - 需要适配布局差异
- [ ] **PhotoWall** - 3D 效果，平台差异大
- [ ] **Gallery3D** - 3D 效果，平台差异大

## 🚨 注意事项

### 1. 平台特定功能

某些功能在特定平台上不可用或需要特殊处理：

- **文件拖拽**：Web 支持，RN 不支持
- **键盘快捷键**：Web/Desktop 支持，RN 不支持
- **右键菜单**：Web/Desktop 支持，RN 不支持（长按替代）

### 2. 性能考虑

- Web 端使用 DOM，性能较好
- RN 端使用原生组件，性能较好
- 避免在适配层做过多计算

### 3. 类型安全

- 使用 TypeScript 严格模式
- 为平台特定 API 创建类型定义
- 使用条件类型处理平台差异

### 4. 测试策略

- 单元测试：测试共享逻辑
- 集成测试：测试平台适配
- E2E 测试：测试完整流程

## 📚 参考资源

- [React Native Web](https://necolas.github.io/react-native-web/)
- [Expo Universal Modules](https://docs.expo.dev/modules/overview/)
- [Tamagui](https://tamagui.dev/) - 跨平台 UI 库
- [NativeBase](https://nativebase.io/) - 跨平台组件库

## ✅ 实施步骤总结

1. **创建平台检测层** (`packages/common/src/platform/`)
2. **创建共享工具和类型**
3. **迁移简单组件**（EmptyState, Demo, VersionInfoModal）
4. **迁移复杂组件**（ImageGrid, ImageBrowser）
5. **迁移业务组件**（Sidebar, Header）
6. **统一样式系统**
7. **完善文档和测试**

## 🎯 预期收益

1. **代码复用率提升 60-80%**
2. **维护成本降低 50%**
3. **功能一致性提升**
4. **开发效率提升**
5. **更好的类型安全**
