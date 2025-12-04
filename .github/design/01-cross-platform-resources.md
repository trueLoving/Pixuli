# 🔄 跨端资源共享设计方案

本文档详细描述了 Pixuli 项目中跨端（移动端、PC端、Web端）资源共享的设计方案，基于
`packages/common` 共享库的实际实现。

---

## 🎯 设计目标

### 核心目标

- **代码复用**：最大化代码复用率，减少重复开发
- **一致性**：保证三端功能和体验的一致性
- **可维护性**：统一的资源库，便于维护和更新
- **性能优化**：针对不同平台进行性能优化
- **类型安全**：完整的 TypeScript 类型定义，确保跨端类型一致性

### 设计原则

- **分层设计**：业务逻辑层、适配层、平台层分离
- **平台适配**：通过适配层和平台特定实现处理平台差异
- **渐进增强**：基础功能通用，高级功能平台特定
- **类型优先**：使用 TypeScript 确保类型安全
- **纯函数原则**：组件实现必须为纯函数，通过 Props 获取外部数据

---

## 🏗️ 整体架构

### 平台运行环境区分

Pixuli 项目中的三端运行环境可以简化为两类：

1. **Web 端运行环境**（包括 PC 端和 Web 端）
   - PC 端：基于 Electron，本质上运行在浏览器环境中
   - Web 端：直接运行在浏览器环境中
   - **共同特征**：使用 HTML 元素（`<div>`, `<button>` 等）和 DOM API

2. **React Native 端运行环境**（移动端）
   - 运行在 React Native 环境中
   - **特征**：使用 React Native 组件（`<View>`, `<TouchableOpacity>`
     等）和 React- Native API

### 三层架构模型

Pixuli 跨端资源共享采用三层架构，通过 Monorepo 实现代码共享：

```
┌─────────────────────────────────────────────────┐
│         资源共享层 (packages/common)               │
│  ┌─────────────────────────────────────┐  │
│  │   组件 (Components)                   │  │
│  │   - Web 版本组件                      │  │
│  │   - React Native 版本组件            │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │   Hooks                              │  │
│  │   - 共享 Hooks                       │  │
│  │   - 平台特定 Hooks                   │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │   工具函数 (Utils)                    │  │
│  │   - 纯函数工具                        │  │
│  │   - 平台适配工具                      │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │   服务 (Services)                    │  │
│  │   - 业务服务                         │  │
│  │   - 平台适配服务                     │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │   类型定义 (Types)                    │  │
│  │   - 共享类型                         │  │
│  │   - 平台特定类型                     │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │   语言包 (Locales)                    │  │
│  │   - 国际化资源                       │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         平台导出层 (Export Layer)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ index.ts     │  │ index.ts     │  │ index.   ││
│  │ (Web/Desktop)│  │ (Web/Desktop)│  │ native.ts││
│  │              │  │              │  │ (Mobile) ││
│  │ - Web组件    │  │ - Desktop    │  │          ││
│  │ - Desktop    │  │   组件       │  │ - RN组件 ││
│  │   组件       │  │              │  │          ││
│  └──────────────┘  └──────────────┘  └──────────┘│
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         平台层 (Platform Layer)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ Desktop      │  │ Web          │  │ Mobile   ││
│  │ (Electron)   │  │ (Browser)    │  │ (RN/Expo)││
│  │              │  │              │  │          ││
│  │ - React      │  │ - React      │  │ - React  ││
│  │ - Electron   │  │ - Vite       │  │   Native ││
│  │ - Node.js    │  │ - PWA        │  │ - Expo   ││
│  └──────────────┘  └──────────────┘  └──────────┘│
└─────────────────────────────────────────────────┘
```

### 目录结构

```
packages/common/
├── src/
│   ├── index.ts                    # Web/Desktop 平台导出
│   ├── index.native.ts             # React Native 平台导出
│   │
│   ├── components/                 # 组件目录
│   │   ├── demo/                   # 平台特定组件示例
│   │   │   ├── common/             # 共享代码
│   │   │   │   ├── types.ts
│   │   │   │   ├── utils.ts
│   │   │   │   └── hooks.ts
│   │   │   ├── web/                # Web 版本
│   │   │   │   └── Demo.web.tsx
│   │   │   └── native/             # React Native 版本
│   │   │       └── Demo.native.tsx
│   │   │
│   │   └── ...                     # 其他组件
│   │
│   ├── hooks/                      # Hooks 目录
│   │   ├── useKeyboard.ts          # 共享 Hooks
│   │   ├── useLazyLoad.ts
│   │   ├── useInfiniteScroll.ts
│   │   └── index.ts
│   │
│   ├── utils/                      # 工具函数目录
│   │   ├── toast.ts
│   │   ├── fileSizeUtils.ts
│   │   ├── filterUtils.ts
│   │   ├── imageUtils.ts
│   │   ├── keyboardShortcuts.ts
│   │   └── sortUtils.ts
│   │
│   ├── services/                   # 服务目录
│   │   ├── githubStorageService.ts
│   │   ├── giteeStorageService.ts
│   │   └── platformAdapter.ts      # 平台适配器
│   │
│   ├── types/                      # 类型定义目录
│   │   ├── image.ts
│   │   ├── github.ts
│   │   └── gitee.ts
│   │
│   └── locales/                    # 国际化目录
│       ├── index.ts
│       └── app/
│           ├── en-US.json
│           └── zh-CN.json
│
└── package.json
```

---

## 📦 资源共享策略

### 1. 组件实现策略

#### 平台区分标志

组件的运行环境通过**元素的使用**来区分：

- **Web 端组件**：使用 HTML 元素（`<div>`, `<button>`, `<input>` 等）和 DOM API
- **React Native 端组件**：使用 React Native 组件（`<View>`,
  `<TouchableOpacity>`, `<TextInput>` 等）和 RN API

#### 组件实现原则

1. **纯函数原则**：所有组件必须实现为纯函数
   - 组件不维护内部状态（或仅维护 UI 状态）
   - 通过 Props 获取外部数据（如 `ImageBrowser` 通过 `images`
     prop 获取图片数据）
   - 通过回调函数（如 `onDeleteImage`）与外部通信

2. **平台特定实现**：
   - 每个组件根据运行环境提供两种实现：
     - `.web.tsx` - Web/Desktop 版本（使用 HTML 元素）
     - `.native.tsx` - React Native 版本（使用 RN 组件）

3. **共享代码提取**：
   - 将平台无关的代码提取到 `common/` 目录
   - 包括：类型定义、工具函数、共享 Hooks

#### 组件分类

**完全共享组件**：

- 使用标准 React API，不依赖平台特定 API
- 通过 Props 适配平台差异
- 三端通用（但需要分别实现 Web 和 Native 版本）

**平台特定组件**：

- 需要平台特定 API 时，创建 `.web.tsx` 和 `.native.tsx` 版本
- 共享代码提取到 `common/` 目录
- 通过不同的导出文件导出

### 2. 工具函数策略

#### 实现原则

1. **纯函数**：工具函数必须为纯函数，不依赖外部状态
2. **平台无关**：尽可能使用平台无关的实现
3. **平台适配**：需要平台特定功能时，通过参数注入平台适配器

#### 工具函数分类

- **完全共享**：纯逻辑函数，不依赖平台 API（如 `filterUtils`, `sortUtils`）
- **平台适配**：需要平台特定功能时，通过适配器处理（如文件操作）

### 3. 服务层策略

#### 实现原则

1. **平台适配器模式**：通过 `PlatformAdapter` 接口处理平台差异
2. **依赖注入**：服务类通过构造函数注入平台适配器
3. **统一接口**：提供统一的业务接口，隐藏平台差异

#### 服务分类

- **业务服务**：`GitHubStorageService`, `GiteeStorageService` 等
- **平台适配服务**：`PlatformAdapter` 及其实现

### 4. Hooks 策略

#### 实现原则

1. **共享 Hooks**：纯逻辑 Hooks，不依赖平台 API（如 `useInfiniteScroll`）
2. **平台特定 Hooks**：需要平台特定功能时，提供平台特定实现（如 `useKeyboard`
   在 Web 端可用，RN 端需要特殊处理）

### 5. 类型定义策略

#### 实现原则

1. **共享类型**：定义平台无关的类型
2. **平台特定类型**：通过联合类型或条件类型处理平台差异
3. **类型安全**：确保跨端类型一致性

### 6. 语言包策略

#### 实现原则

1. **统一格式**：使用 JSON 格式存储翻译资源
2. **共享使用**：三端使用相同的语言包文件
3. **动态加载**：支持运行时切换语言

---

## 🔧 平台适配方案

### 1. 平台特定导出

**实现方式**：通过不同的入口文件区分平台

- `index.ts` - Web/Desktop 平台导出
- `index.native.ts` - React Native 平台导出

**构建配置**：

- Web/Desktop：使用 `index.ts` 作为入口
- React Native：通过 Metro bundler 配置使用 `index.native.ts`

### 2. 组件平台分离

**目录结构**：

```
components/my-component/
├── common/              # 共享代码（必须）
│   ├── types.ts        # 共享类型
│   ├── utils.ts        # 共享工具函数
│   └── hooks.ts        # 共享 Hooks
├── web/                 # Web 版本（必须）
│   └── MyComponent.web.tsx
└── native/              # React Native 版本（必须）
    └── MyComponent.native.tsx
```

**导出方式**：

- `index.ts` 导出 Web 版本
- `index.native.ts` 导出 React Native 版本

### 3. 平台适配器

**接口定义**：通过 `PlatformAdapter` 接口定义平台差异处理

**实现方式**：

- `DefaultPlatformAdapter` - 默认实现（Web 端）
- 各平台可提供自定义适配器实现

**使用方式**：服务类通过构造函数注入平台适配器

---

## 💻 实现策略

### 1. 组件实现策略

#### 纯函数原则

所有组件必须实现为纯函数：

- **输入**：通过 Props 获取外部数据
- **输出**：通过回调函数与外部通信
- **副作用**：最小化副作用，仅处理 UI 交互

#### Props 设计

- **数据 Props**：组件所需的数据（如 `images: ImageItem[]`）
- **回调 Props**：与外部通信的回调函数（如
  `onDeleteImage: (id: string) => void`）
- **配置 Props**：组件配置选项（如 `hideFilter?: boolean`）
- **平台特定 Props**：平台特定的配置（如 React Native 的 `colorScheme`）

### 2. 平台检测策略

**当前实现**：通过不同的导出文件和构建配置区分平台，而不是运行时检测

- **导出文件**：`index.ts` vs `index.native.ts`
- **构建配置**：Web/Desktop 使用 `index.ts`，React Native 使用 `index.native.ts`

### 3. 代码组织策略

#### 共享代码提取

将平台无关的代码提取到 `common/` 目录：

- **类型定义**：共享的 TypeScript 类型
- **工具函数**：共享的工具函数
- **Hooks**：共享的 React Hooks

#### 平台特定实现

平台特定的实现放在对应的目录：

- **Web 版本**：`web/` 目录
- **React Native 版本**：`native/` 目录

---

## 🎨 UI/UX 适配策略

### 1. 样式适配

#### Web/Desktop 样式

- 使用 CSS 文件或 CSS-in-JS
- 使用标准 CSS 特性（Flexbox、Grid 等）

#### React Native 样式

- 使用 `StyleSheet.create`
- 使用 React Native 样式属性
- 支持主题适配（通过 `colorScheme` prop）

### 2. 交互适配

#### Web/Desktop 交互

- 键盘快捷键支持
- 鼠标事件处理
- DOM API 交互

#### React Native 交互

- 触摸手势支持
- React Native 事件处理
- 原生 API 交互

---

## 📋 最佳实践

### 1. 组件设计原则

#### 完全共享 vs 平台特定

**完全共享组件**：

- 使用标准 React API
- 不依赖平台特定 API（DOM、RN API 等）
- 通过 Props 适配平台差异
- 但仍需要分别实现 Web 和 Native 版本（因为元素使用不同）

**平台特定组件**：

- 需要平台特定 API 时，创建 `.web.tsx` 和 `.native.tsx` 版本
- 共享代码提取到 `common/` 目录
- 通过不同的导出文件导出

#### 代码组织

```
components/my-component/
├── common/              # 共享代码（必须）
│   ├── types.ts        # 共享类型
│   ├── utils.ts        # 共享工具函数
│   └── hooks.ts        # 共享 Hooks
├── web/                 # Web 版本（必须）
│   └── MyComponent.web.tsx
└── native/              # React Native 版本（必须）
    └── MyComponent.native.tsx
```

### 2. 平台适配器使用

#### 创建自定义适配器

各平台可以创建自定义的平台适配器，实现 `PlatformAdapter`
接口，处理平台特定的差异。

### 3. 类型安全

#### 平台特定类型

通过联合类型或条件类型处理平台差异，确保类型安全。

---

## ⚠️ 注意事项

### 1. 平台差异处理

#### API 差异

- **文件系统**：
  - Desktop：使用 Node.js `fs`（通过 Electron IPC）
  - Web：使用 `FileReader` API
  - Mobile：使用 `expo-file-system`

- **存储**：
  - Desktop：使用 Electron `store`
  - Web：使用 `localStorage`
  - Mobile：使用 `AsyncStorage`

- **网络请求**：
  - Desktop：可使用 Node.js `http` 或 `fetch`
  - Web：使用 `fetch`
  - Mobile：使用 React Native `fetch`

#### UI 差异

- **组件库**：
  - Desktop/Web：使用 HTML 元素（`<div>`, `<button>` 等）
  - Mobile：使用 React Native 组件（`<View>`, `<TouchableOpacity>` 等）

- **样式**：
  - Desktop/Web：使用 CSS
  - Mobile：使用 `StyleSheet`

- **事件处理**：
  - Desktop/Web：使用 DOM 事件（`onClick`, `onKeyDown` 等）
  - Mobile：使用 React Native 事件（`onPress`, `onLongPress` 等）

### 2. 构建配置

#### Web/Desktop 构建

使用 `index.ts` 作为入口文件。

#### React Native 构建

通过 Metro bundler 配置使用 `index.native.ts` 作为入口文件。

### 3. 依赖管理

#### 共享依赖

在 `package.json` 的 `dependencies` 中定义共享依赖。

#### 平台特定依赖

在 `package.json` 的 `peerDependencies` 或 `optionalDependencies`
中定义平台特定依赖。

---

## 📈 代码复用统计

### 资源共享比例

- **组件**：约 60-70% 代码共享（通过 `common/` 目录）
- **工具函数**：约 90% 代码共享
- **服务层**：约 80% 代码共享（通过平台适配器）
- **Hooks**：约 70% 代码共享
- **类型定义**：约 95% 代码共享
- **语言包**：100% 代码共享

### 总体代码复用率

**约 75-80%** 的代码在三端共享，20-25% 的代码需要平台特定实现。

---

## 📋 开发指南

### 1. 创建新组件

#### 步骤

1. 创建组件目录结构
2. 在 `common/` 目录中定义共享类型、工具函数、Hooks
3. 在 `web/` 目录中实现 Web 版本（使用 HTML 元素）
4. 在 `native/` 目录中实现 React Native 版本（使用 RN 组件）
5. 在 `index.ts` 和 `index.native.ts` 中导出对应版本

#### 原则

- 组件必须为纯函数
- 通过 Props 获取外部数据
- 通过回调函数与外部通信
- Web 版本使用 HTML 元素，Native 版本使用 RN 组件

### 2. 创建平台适配器

各平台可以创建自定义的平台适配器，实现 `PlatformAdapter`
接口，处理平台特定的差异。

### 3. 测试策略

#### 共享代码测试

对 `common/` 目录中的共享代码进行单元测试。

#### 平台特定组件测试

对 Web 和 Native 版本分别进行测试。

---

## 📝 总结

Pixuli 跨端资源共享设计方案通过以下方式实现了高效的代码复用：

1. **平台区分**：根据运行环境（元素使用）区分 Web 端和 React Native 端
2. **组件实现**：每个组件提供 Web 和 Native 两种实现，必须为纯函数
3. **资源共享**：包括组件、工具函数、服务、Hooks、类型定义、语言包
4. **平台适配器**：通过 `PlatformAdapter` 接口处理平台差异
5. **共享代码提取**：将平台无关代码提取到 `common/` 目录
6. **平台特定导出**：通过 `index.ts` 和 `index.native.ts` 区分平台

通过这种设计，我们实现了：

- ✅ 高代码复用率（75-80%）
- ✅ 统一的用户体验
- ✅ 易于维护和扩展
- ✅ 类型安全的开发体验
- ✅ 清晰的平台边界

---

## 📚 相关文档

- [WASM 模块设计方案](./02-wasm.md) - 了解 WASM 模块设计
- [性能优化设计方案](./03-performance) - 了解性能优化策略

---

最后更新：2025年11月
