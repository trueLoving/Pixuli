# 贡献指南

感谢您对 Pixuli 项目的关注！本文档将帮助您了解如何参与项目开发。

## 📋 目录

- [环境要求](#环境要求)
- [项目设置](#项目设置)
- [开发流程](#开发流程)
- [项目结构](#项目结构)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [工作流程](#工作流程)
- [问题反馈](#问题反馈)

## 🔧 环境要求

### 通用要求

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0（必需，项目仅支持 pnpm）
- **Git** >= 2.0.0

### 桌面端开发

- **Rust** >= 1.70.0 - 用于构建 WASM 模块
- **平台支持**：
  - 🍎 macOS (x64, ARM64)
  - 🪟 Windows (x64)

### Web 端开发

- **现代浏览器** - 支持 Canvas API

### 移动端开发

#### Android 开发

- **Android Studio** - Android 开发环境
- **Android SDK** - Android SDK Platform 33 或更高版本
- **Java Development Kit (JDK)** - JDK 17

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

### 3. 构建 WASM 模块（仅桌面端需要）

```bash
# 构建 wasm 模块
pnpm run build:wasm
```

## 💻 开发流程

### 桌面端

```bash
# 开发模式
pnpm run dev:desktop

# 构建应用
pnpm run build:desktop
```

### Web 端

```bash
# 开发模式
pnpm dev:web

# 构建应用
pnpm build:web

# 预览构建结果
pnpm preview:web
```

### 移动端

#### Android

```bash
# 启动 Android 开发
pnpm dev:mobile --android

# 构建 Android APK
cd apps/mobile
pnpm android
```

## 📦 项目结构

### 桌面端 (apps/desktop)

```
apps/desktop/
├── src/                           # 源代码
│   ├── components/                # React 组件
│   ├── config/                    # 配置文件
│   ├── features/                  # 功能模块
│   ├── i18n/                      # 国际化配置
│   ├── layouts/                   # 布局组件
│   ├── pages/                     # 页面组件
│   ├── services/                  # 业务服务
│   └── stores/                    # 状态管理
├── electron/                      # Electron 主进程
│   ├── main/                      # 主进程代码
│   └── preload/                   # 预加载脚本
├── build/                         # 构建资源
├── dist/                          # 构建输出
└── release/                       # 分发文件
```

### Web 端 (apps/web)

```
apps/web/
├── src/                        # 源代码
│   ├── components/             # React 组件
│   ├── config/                  # 配置文件
│   ├── i18n/                    # 国际化配置
│   ├── services/               # 业务服务
│   ├── stores/                  # 状态管理
│   └── utils/                   # 工具函数
├── public/                      # 静态资源
├── api/                         # API 代理（用于 vercel）
└── dist/                        # 构建输出
```

### 移动端 (apps/mobile)

```
apps/mobile/
├── app/                         # Expo Router 路由（页面）
├── components/                  # 可复用组件
├── services/                    # 业务服务
├── stores/                      # 状态管理（Zustand）
├── hooks/                       # 自定义 Hooks
├── utils/                       # 工具函数
├── config/                      # 配置文件
├── constants/                   # 常量定义
├── i18n/                        # 国际化
├── assets/                      # 静态资源
└── android/                     # Android 原生代码
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
feat(desktop): 添加图片压缩功能

- 支持 WebP 格式压缩
- 可调节压缩质量
- 实时预览压缩效果

Closes #123
```

### Scope 范围

- `desktop` - 桌面端相关
- `web` - Web 端相关
- `mobile` - 移动端相关
- `common` - 共享包相关
- `wasm` - WASM 模块相关
- `docs` - 文档相关

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
git commit -m "feat(scope): 添加新功能"
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

### 通用资源

- [TypeScript 文档](https://www.typescriptlang.org/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [i18next 文档](https://www.i18next.com/)

### 桌面端资源

- [Electron 文档](https://electronjs.org/)
- [React 文档](https://reactjs.org/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)

### Web 端资源

- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)

### 移动端资源

- [React Native 文档](https://reactnative.dev/)
- [Expo 文档](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

## 🙏 致谢

感谢所有为 Pixuli 项目做出贡献的开发者！

---

如有任何问题，请通过 [Issues](https://github.com/trueLoving/Pixuli/issues)
联系我们。
