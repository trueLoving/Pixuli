# 贡献指南

感谢您对 Pixuli Mobile 项目的关注！本文档将帮助您了解如何参与项目开发。

## 📋 目录

- [环境要求](#环境要求)
- [项目设置](#项目设置)
- [开发流程](#开发流程)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试](#测试)
- [问题反馈](#问题反馈)

## 🔧 环境要求

### 必需工具

- **Node.js** >= 22.0.0
- **pnpm** >= 9.0.0（推荐使用 pnpm）
- **Git** - 版本控制

### Android 开发

- **Android Studio** - Android 开发环境
- **Android SDK** - Android SDK Platform 33 或更高版本
- **Java Development Kit (JDK)** - JDK 17

### iOS 开发（仅 macOS）

- **Xcode** >= 14.0
- **CocoaPods** - iOS 依赖管理工具
- **iOS Simulator** - iOS 模拟器

## 🚀 项目设置

### 1. 克隆仓库

```bash
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli
```

### 2. 安装依赖

```bash
# 从项目根目录安装所有依赖
pnpm install
```

### 3. 进入移动应用目录

```bash
cd apps/mobile
```

## 💻 开发流程

### 运行应用

#### Android

```bash
# 启动 Android 开发
pnpm dev --android
```

#### iOS（仅 macOS）

```bash
# 启动 iOS 开发
pnpm dev --ios
```

### 构建应用

#### Android

```bash
# 构建 Android APK
pnpm android
```

#### iOS（仅 macOS）

```bash
# 构建 iOS 应用
pnpm ios
```

## 📦 项目结构

```
apps/mobile/
├── app/                     # Expo Router 路由（页面）
│   ├── _layout.tsx         # 根布局
│   └── (tabs)/             # Tab 导航组
│       ├── _layout.tsx     # Tab 布局
│       ├── index.tsx       # 首页（图片列表）
│       ├── settings.tsx    # 设置页面
│       └── settings/       # 设置子页面
│           ├── github.tsx  # GitHub 配置页面
│           └── gitee.tsx   # Gitee 配置页面
├── components/             # 可复用组件
│   ├── ImageBrowser.tsx    # 图片浏览器（全屏预览）
│   ├── ImageGrid.tsx       # 图片网格组件
│   ├── ImageUploadButton.tsx  # 图片上传按钮
│   ├── ImageUploadEditModal.tsx  # 上传前编辑模态框
│   ├── ImageEditModal.tsx  # 图片编辑模态框
│   ├── ImageCropModal.tsx  # 图片裁剪模态框
│   ├── SlideShowPlayer.tsx # 幻灯片播放器
│   ├── SearchAndFilter.tsx # 搜索和筛选组件
│   ├── ThemedText.tsx      # 主题文本组件
│   ├── ThemedView.tsx      # 主题视图组件
│   └── ui/                 # UI 组件
│       ├── IconSymbol.tsx  # 图标组件
│       └── IconSymbol.ios.tsx  # iOS 图标组件
├── services/               # 业务服务
│   ├── githubStorageService.ts  # GitHub 存储服务
│   └── giteeStorageService.ts   # Gitee 存储服务
├── stores/                 # 状态管理（Zustand）
│   └── imageStore.ts       # 图片状态管理
├── hooks/                 # 自定义 Hooks
│   ├── useColorScheme.ts  # 颜色方案 Hook
│   └── useThemeColor.ts   # 主题颜色 Hook
├── utils/                 # 工具函数
│   ├── imageUtils.ts      # 图片处理工具
│   ├── metadataCache.ts   # 元数据缓存
│   └── toast.ts           # 提示消息工具
├── config/                # 配置文件
│   ├── github.ts          # GitHub 配置
│   ├── gitee.ts           # Gitee 配置
│   └── theme.ts           # 主题配置
├── constants/             # 常量定义
│   └── theme.ts           # 主题常量
├── i18n/                  # 国际化
│   ├── index.ts           # i18n 初始化
│   ├── locales.ts         # 翻译文本
│   └── useI18n.ts         # i18n Hook
├── assets/                # 静态资源
│   └── images/            # 图片资源
├── android/               # Android 原生代码
├── ios/                   # iOS 原生代码
├── scripts/               # 脚本文件
│   └── generate-icons.js  # 图标生成脚本
├── app.json              # Expo 配置
├── package.json           # 项目依赖
├── tsconfig.json          # TypeScript 配置
├── FEATURE_ROADMAP.md     # 功能路线图
├── CHANGELOG.md           # 更新日志
└── README.md              # 项目说明
```

## 🛠️ 开发指南

### 核心依赖

- **React Native** 0.81.5 - 跨平台移动应用框架
- **Expo** ~54.0.23 - React Native 开发工具链
- **TypeScript** ~5.9.2 - 类型安全的 JavaScript
- **Zustand** ^4.4.1 - 轻量级状态管理
- **React Navigation** ^7.1.8 - 导航管理
- **Expo Router** ~6.0.14 - 基于文件系统的路由
- **i18next** ^25.6.0 - 国际化框架

### 开发工具

- **ESLint** - 代码检查
- **TypeScript** - 类型检查
- **Expo Dev Tools** - 开发工具

### 常用命令

```bash
# Android 开发
pnpm dev --android

# iOS 开发（仅 macOS）
pnpm dev --ios
```

## 📝 代码规范

### TypeScript

- 使用 TypeScript 进行开发
- 所有文件使用 `.ts` 或 `.tsx` 扩展名
- 避免使用 `any` 类型，优先使用具体类型
- 使用接口（interface）定义对象类型

### 组件规范

- 使用函数式组件和 Hooks
- 组件文件使用 PascalCase 命名
- 组件应该导出为命名导出（named export）
- 使用 TypeScript 定义 Props 类型

### 文件命名

- 组件文件：`PascalCase.tsx`
- 工具文件：`camelCase.ts`
- 常量文件：`camelCase.ts`

### 代码风格

- 使用 2 个空格缩进
- 使用单引号（'）而不是双引号（"）
- 在语句末尾使用分号
- 使用 ESLint 和 Prettier 保持代码风格一致

## 📤 提交规范

### Git 提交信息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 提交类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 提交示例

```bash
feat(mobile): 添加幻灯片播放功能

- 支持自动播放和手动控制
- 添加多种过渡效果
- 支持顺序和随机播放模式

Closes #123
```

## 🔄 工作流程

### 1. Fork 仓库

在 GitHub 上 Fork 本项目到您的账户。

### 2. 创建分支

```bash
git checkout -b feat/your-feature-name
```

### 3. 进行开发

- 编写代码
- 添加测试
- 更新文档

### 4. 提交更改

```bash
git add .
git commit -m "feat: 添加新功能"
```

### 5. 推送分支

```bash
git push origin feat/your-feature-name
```

### 6. 创建 Pull Request

在 GitHub 上创建 Pull Request，详细描述您的更改。

### 7. 代码审查

等待维护者审查代码，根据反馈进行修改。

## 📚 相关资源

- [React Native 文档](https://reactnative.dev/)
- [Expo 文档](https://docs.expo.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [i18next 文档](https://www.i18next.com/)

## 🙏 致谢

感谢所有为 Pixuli Mobile 项目做出贡献的开发者！

---

如有任何问题，请通过 [Issues](https://github.com/trueLoving/Pixuli/issues)
联系我们。
