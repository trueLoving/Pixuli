# 贡献指南

感谢你对 Pixuli 项目的关注！本文说明如何参与项目开发。

## 📋 目录

- [环境要求](#环境要求)
- [项目设置](#项目设置)
- [开发工作流](#开发工作流)
- [项目结构](#项目结构)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [协作流程](#协作流程)
- [AI 辅助开发](#ai-辅助开发)
- [反馈](#反馈)

## 🔧 环境要求

### 通用

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0（必需，项目仅支持 pnpm）
- **Git** >= 2.0.0

> 主应用**不需要** Rust 工具链。历史 WASM 见 `archive/wasm/`。

### Desktop 开发

- **平台**：macOS（x64、ARM64）或 Windows（x64）
- **额外**：macOS 10.15+ / Windows 10/11（运行 Electron）

### Web 开发

- **现代浏览器** — 需支持 Canvas API

### Mobile 开发

#### Android（Capacitor）

- **Android Studio** — Android 开发环境
- **Android SDK** — Platform 33 或更高
- **JDK** — 17

## 🚀 项目设置

### 1. 克隆仓库

```bash
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli
```

### 2. 安装依赖

```bash
# 在仓库根目录安装全部 workspace 依赖
pnpm install
```

## 💻 开发工作流

### Desktop

```bash
# 开发模式
pnpm dev:desktop

# 构建
pnpm build:desktop
```

### Web

```bash
# 开发模式
pnpm dev:web

# 构建
pnpm build:web

# 预览构建结果
pnpm preview:web
```

### Mobile

#### Android（Capacitor）

```bash
# 启动 Android 开发（模拟器或真机 + Live Reload）
pnpm dev:android

# 构建已签名的 release APK
pnpm build:android
```

## 📦 项目结构

### 主应用（apps/pixuli）

```text
apps/pixuli/
├── src/                           # 源码
│   ├── components/                # React 组件
│   ├── config/                    # 配置
│   ├── features/                  # 功能模块
│   ├── i18n/                      # 国际化
│   ├── layouts/                   # 布局
│   ├── pages/                     # 页面
│   ├── platforms/                 # Web / Desktop / Mobile 平台分支
│   ├── services/                  # 业务服务
│   └── stores/                    # 状态管理
├── electron/                      # Electron 主进程
│   ├── main/
│   └── preload/
├── android/                       # Capacitor Android 工程
├── build/                         # 构建资源
├── dist/                          # 构建输出
└── release/                       # 分发产物
```

### Mobile（已归档 Expo RN）

历史 RN 工程已迁入 `archive/apps/mobile/`（REF-513）。Mobile 开发与构建见上文
**Android（Capacitor）**；归档代码仅供只读参考。

## 📝 代码规范

### TypeScript

- 业务代码使用 TypeScript（`.ts` / `.tsx`）
- 避免使用 `any`，优先具体类型
- 用 interface 定义对象类型
- JS 例外见
  [04-typescript-javascript-policy.md](docs/02-system-design/04-typescript-javascript-policy.md)

### 组件

- 使用函数组件与 Hooks
- 组件文件 PascalCase 命名
- 优先命名导出（named export）
- 用 TypeScript 定义 Props 类型

### 文件命名

- 组件：`PascalCase.tsx`
- 工具 / 常量：`camelCase.ts`

### 代码风格

- 缩进 2 空格
- 字符串使用单引号 `'`
- 语句末尾分号
- 使用 ESLint 与 Prettier 保持一致

### 包边界

- `@pixuli/core` 与 `@pixuli/provider-*` **禁止**依赖 `@pixuli/ui`（REF-209）
- 存储仅经 `@pixuli/core/plugins` 契约 + provider 包；应用不直接写 Git API 细节

## 📤 提交规范

### Git 提交信息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### 提交类型

- `feat`：新功能
- `fix`：缺陷修复
- `docs`：文档
- `style`：格式（不影响逻辑）
- `refactor`：重构
- `perf`：性能
- `test`：测试
- `chore`：构建或工具

### 示例

```bash
feat(desktop): 添加图片压缩功能

- 支持 WebP 压缩
- 可调压缩质量
- 实时预览

Closes #123
```

### Scope 示例

- `desktop` — Desktop
- `web` — Web
- `mobile` — Mobile / Capacitor
- `core` / `ui` / `provider` — 对应 workspace 包
- `docs` — 文档

重构 Issue 请在标题或正文中含 **REF-xxx** 或 `Fixes #n`（完整关闭 Issue 时）。

## 🔄 协作流程

### 1. Fork 仓库

在 GitHub 上 Fork 到个人账户。

### 2. 创建分支

```bash
git checkout -b feat/your-feature-name
```

### 3. 开发

- 编写代码
- 按需补充测试（`pnpm test`）
- 更新相关文档

### 4. 提交

```bash
git add .
git commit -m "feat(scope): 添加新功能"
```

### 5. 推送

```bash
git push origin feat/your-feature-name
```

### 6. 创建 Pull Request

在 GitHub 上创建 PR，说明变更内容与测试方式。

### 7. Code Review

等待维护者 Review，按反馈修改。

## 🤖 AI 辅助开发

使用 **Cursor**、**Copilot** 等工具时：

- 先读 [AGENTS.md](AGENTS.md) — Monorepo 结构、存储插件、PR 约定
- Cursor **Rules** 在 `.cursor/rules/`；**Skills** 在
  `.cursor/skills/`（见 AGENTS.md 表格）
- 重构 Issue 使用 `REF-xxx`，追踪表见 [REFACTOR_PLAN.md](REFACTOR_PLAN.md)
- **架构边界**变更（新 provider、插件体系、TS/JS 例外）时再更新 Agent/Skill
  — 非每个功能 PR 都改
- 用户向文档在 `docs/` 与 [Wiki](https://github.com/trueLoving/Pixuli/wiki)；见
  [docs/README.md](docs/README.md)

## 📚 相关资源

### 通用

- [TypeScript 文档](https://www.typescriptlang.org/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [i18next 文档](https://www.i18next.com/)

### Desktop / Web

- [Electron 文档](https://electronjs.org/)
- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)

### Mobile

- [Capacitor 文档](https://capacitorjs.com/docs)
- [Expo 文档](https://docs.expo.dev/)（仅归档 RN 参考）

## 🙏 致谢

感谢所有为 Pixuli 贡献的开发者！

---

如有问题，请通过 [Issues](https://github.com/trueLoving/Pixuli/issues) 联系。
