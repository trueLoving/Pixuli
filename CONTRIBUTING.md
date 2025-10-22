# 贡献指南

欢迎为 Pixuli 项目贡献代码！本指南将帮助您设置开发环境并了解不同场景下的开发流程。

## 🚀 快速开始

### 环境要求

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0 (必需，项目仅支持 pnpm)
- **Git** >= 2.0.0
- **Rust** >= 1.70.0 (用于构建 WASM 模块)

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli

# 安装所有依赖 (仅支持 pnpm)
pnpm install
```

> ⚠️ **重要**: 本项目使用 pnpm
> workspace 管理，**仅支持 pnpm 包管理工具**。请勿使用 npm 或 yarn，否则可能导致依赖安装失败或版本冲突。

### 📋 可用脚本命令

根目录提供了以下脚本命令：

```bash
# WASM 模块
pnpm build:wasm          # 构建 WASM 模块

# Web 端
pnpm dev:web             # 启动 Web 端开发服务器
pnpm build:web           # 构建 Web 端生产版本

# 桌面端
pnpm dev:desktop         # 启动桌面端开发模式
pnpm build:desktop       # 构建桌面端应用

# 文档
pnpm docs:dev            # 启动文档开发服务器
pnpm docs:build          # 构建文档生产版本

# 性能测试
pnpm benchmark           # 运行性能基准测试
```

## 🏗️ 项目结构

```
Pixuli/
├── apps/                   # 应用程序
│   ├── desktop/            # 桌面端应用 (Electron + React)
│   └── web/                # Web 端应用 (Vite + React)
├── packages/               # 共享包
│   ├── ui/                 # UI 组件库
│   ├── wasm/               # WASM 模块
├── docs/                   # 文档网站
├── benchmark/              # 性能测试
└── pnpm-workspace.yaml    # 工作空间配置
```

## 🎯 开发场景

### 🌐 Web 端开发

#### 环境设置

```bash
# 安装依赖 (仅支持 pnpm)
pnpm install

# 启动开发服务器
pnpm dev:web
```

#### 开发流程

1. **启动开发服务器**

   ```bash
   pnpm dev:web
   ```

   访问 [http://localhost:3000](http://localhost:3000)

2. **开发功能**
   - 修改 `apps/web/src/` 目录下的文件
   - 使用 `packages/ui` 组件库
   - 热重载自动更新

3. **构建生产版本**
   ```bash
   pnpm build:web
   ```

#### 技术栈

- **Vite** - 快速构建工具
- **React 18+** - 用户界面库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **pixuli-ui** - 内部组件库

#### 开发注意事项

- 使用 `packages/ui` 中的组件
- 遵循 Vite + React 开发规范
- 确保 TypeScript 类型安全
- 使用 Tailwind CSS 进行样式开发

### 🖥️ 桌面端开发

#### 环境设置

```bash
# 安装依赖 (仅支持 pnpm)
pnpm install

# 启动开发模式
pnpm dev:desktop
```

#### 开发流程

1. **启动开发模式**

   ```bash
   pnpm dev:desktop
   ```

   这会同时启动 Vite 开发服务器和 Electron 应用

2. **开发功能**
   - 修改 `apps/desktop/src/` 目录下的 React 组件
   - 修改 `apps/desktop/electron/` 目录下的主进程代码
   - 热重载自动更新

3. **构建应用**
   ```bash
   pnpm build:desktop
   ```

#### 技术栈

- **Electron** - 跨平台桌面应用框架
- **React 18+** - 用户界面库
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **pixuli-ui** - 内部组件库
- **pixuli-wasm** - WASM 图片处理

#### 开发注意事项

- 区分主进程和渲染进程代码
- 使用 IPC 进行进程间通信
- 遵循 Electron 安全最佳实践
- 测试不同平台的表现

### 🧩 组件库开发

#### 环境设置

```bash
# 安装依赖 (仅支持 pnpm)
pnpm install
```

#### 开发流程

1. **开发组件**
   - 在 `packages/ui/src/components/` 目录下创建组件
   - 编写 TypeScript 类型定义
   - 添加 CSS 样式

2. **测试组件**

   ```bash
   # 构建组件库(验证是否通过编译)
   pnpm build
   ```

3. **更新文档**
   - 更新 `docs/` 目录下的文档
   - 添加组件使用示例
   - 更新 API 文档

#### 技术栈

- **React 18+** - 用户界面库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架

### 🔧 WASM 模块开发

#### 环境设置

```bash
# 安装依赖 (仅支持 pnpm)
pnpm install

# 构建 WASM 模块
pnpm build:wasm
```

#### 开发流程

1. **修改 Rust 代码**
   - 在 `packages/wasm/src/` 目录下修改 Rust 代码
   - 更新 `packages/wasm/Cargo.toml` 配置

2. **构建 WASM**

   ```bash
   pnpm build:wasm
   ```

3. **测试性能**
   ```bash
   # 运行基准测试
   pnpm run benchmark
   ```

#### 技术栈

- **Rust** - 系统编程语言
- **NAPI-RS** - Node.js 原生模块绑定
- **image-rs** - Rust 图片处理库
- **WebAssembly** - 高性能计算

## 🧪 测试

- TODO

## 📝 代码规范

### Git 提交规范

使用 Conventional Commits 规范：

```bash
# 功能更新
git commit -m "feat: 添加图片批量上传功能"

# 修复问题
git commit -m "fix: 修复图片预览显示问题"

# 文档更新
git commit -m "docs: 更新组件使用文档"

# 性能优化
git commit -m "perf: 优化图片压缩性能"

# 重构代码
git commit -m "refactor: 重构图片处理逻辑"
```

### 代码风格

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写清晰的注释和文档
- **必须使用 pnpm 包管理工具**，禁止使用 npm 或 yarn

### 分支管理

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 创建修复分支
git checkout -b fix/bug-fix

# 创建文档分支
git checkout -b docs/update-readme
```

## 🚀 部署

### Web 端部署

```bash
# 构建生产版本
pnpm build:web
```

### 桌面端部署

```bash
# 构建应用
pnpm build:desktop
```

## 🤝 贡献流程

### 1. Fork 项目

1. 访问 [Pixuli GitHub](https://github.com/trueLoving/Pixuli)
2. 点击 "Fork" 按钮
3. 克隆你的 Fork 到本地

### 2. 创建分支

```bash
git checkout -b feature/your-feature-name
```

### 3. 开发功能

- 编写代码
- 添加测试
- 更新文档
- 确保所有测试通过

### 4. 提交更改

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

1. 访问你的 Fork 页面
2. 点击 "New Pull Request"
3. 填写 PR 描述
4. 等待代码审查

## 📚 相关资源

### 文档

- [组件库文档](../packages/ui/docs/)
- [API 文档](../docs/)
- [性能测试](../benchmark/README.md)

### 技术栈文档

- [Vite 文档](https://vitejs.dev/)
- [Electron 文档](https://electronjs.org/docs)
- [React Native 文档](https://reactnative.dev/docs)
- [Rust 文档](https://doc.rust-lang.org/)

### 工具文档

- [pnpm 文档](https://pnpm.io/) - **必需**，项目仅支持 pnpm
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## ❓ 常见问题

### Q: 为什么必须使用 pnpm？

A: 本项目使用 pnpm
workspace 管理 monorepo，pnpm 提供了更好的依赖管理和性能。使用其他包管理工具可能导致依赖安装失败或版本冲突。

### Q: 如何安装 pnpm？

A:

```bash
# 使用 npm 安装 pnpm
npm install -g pnpm

# 或使用其他方式
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Q: 如何调试 Electron 应用？

A: 使用 VS Code 调试配置，或通过 `--inspect` 参数启动。

### Q: WASM 模块构建失败怎么办？

A: 确保安装了 Rust 和 wasm-pack，检查 Cargo.toml 配置。

### Q: 如何添加新的图片格式支持？

A: 在 `packages/wasm/src/` 中添加新的处理逻辑，更新类型定义。

### Q: 组件库如何添加新组件？

A: 在 `packages/ui/src/components/` 中创建组件，更新导出和文档。

## 📞 联系我们

- **GitHub Issues**: [报告问题](https://github.com/trueLoving/Pixuli/issues)
- **GitHub Discussions**:
  [功能建议](https://github.com/trueLoving/Pixuli/discussions)

---

感谢您为 Pixuli 项目贡献代码！🎉
