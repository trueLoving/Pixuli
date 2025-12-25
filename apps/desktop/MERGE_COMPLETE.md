# Desktop 应用合并 Web 功能完成报告

## ✅ 已完成的工作

### 1. 配置修改

- ✅ 修改了 `vite.config.ts`，支持通过 `--mode web` 和 `--mode desktop`
  控制插件加载
  - Web 模式：加载 PWA 插件，不加载 Electron 插件
  - Desktop 模式：加载 Electron 插件，不加载 PWA 插件
- ✅ 修改了 `package.json`，添加了新的脚本命令：
  - `dev:web` - Web 模式开发
  - `dev:desktop` - Desktop 模式开发（默认）
  - `build:web` - Web 模式构建
  - `build:desktop` - Desktop 模式构建

### 2. 平台检测

- ✅ 创建了 `src/utils/platform.ts`，提供平台检测工具函数
- ✅ 创建了 `src/types/version.d.ts`，定义了全局类型

### 3. 代码合并

- ✅ 复制了 Web 的页面到 `src/pages-web/`
- ✅ 复制了 Web 的组件到 `src/components-web/`
- ✅ 复制了 Web 的 hooks 到 `src/hooks-web/`
- ✅ 复制了 Web 的 services 到 `src/services-web/`
- ✅ 复制了 Web 的 utils 到 `src/utils-web/`

### 4. App 组件

- ✅ 创建了 `App.web.tsx` - Web 版本的 App 组件
- ✅ 创建了 `App.desktop.tsx` - Desktop 版本的 App 组件
- ✅ 修改了 `App.tsx`，根据平台条件动态加载不同的 App

### 5. 初始化代码

- ✅ 修改了 `main.tsx`，根据平台条件加载不同的服务（PWA、性能监控等）

## 🚀 使用方式

### 开发模式

```bash
# Web 模式开发（不启动 Electron，支持 PWA）
pnpm --filter pixuli-desktop dev:web

# Desktop 模式开发（启动 Electron）
pnpm --filter pixuli-desktop dev:desktop
# 或
pnpm --filter pixuli-desktop dev
```

### 构建模式

```bash
# Web 模式构建
pnpm --filter pixuli-desktop build:web

# Desktop 模式构建（包含 Electron 打包）
pnpm --filter pixuli-desktop build:desktop
# 或
pnpm --filter pixuli-desktop build
```

## 📁 目录结构

```
apps/desktop/src/
├── App.tsx              # 主入口，根据平台加载不同 App
├── App.web.tsx          # Web 版本的 App
├── App.desktop.tsx      # Desktop 版本的 App
├── main.tsx             # 入口文件，根据平台初始化不同服务
├── pages/               # Desktop 专用页面
├── pages-web/           # Web 专用页面
├── components-web/      # Web 专用组件（PWA 等）
├── hooks-web/           # Web 专用 hooks
├── services-web/        # Web 专用服务（PWA、性能监控等）
├── utils-web/           # Web 专用工具（loading 等）
├── utils/               # 共享工具（平台检测等）
├── stores/              # 共享状态管理
├── config/              # 共享配置
└── i18n/                # 国际化（需要合并 Web 的语言包）
```

## ⚙️ 技术实现

### 平台检测

通过 Vite 的 `define` 配置注入全局变量：

- `__IS_WEB__`: 是否为 Web 平台
- `__IS_DESKTOP__`: 是否为 Desktop 平台

### 条件编译

- Electron 插件：仅在 Desktop 模式下加载
- PWA 插件：仅在 Web 模式下加载
- 平台特定代码：通过 `utils/platform.ts` 中的工具函数判断

### 动态导入

- App 组件：使用 `require()` 动态导入，避免在 Desktop 模式下加载 Web 代码
- 服务初始化：使用 `import()` 动态导入，避免在 Desktop 模式下加载 PWA 服务

## 📝 待完成的工作

1. **合并 i18n 配置**
   - 需要合并 Web 的 PWA 语言包到 desktop 的 i18n 配置
   - 支持条件加载平台特定的语言包

2. **合并 stores**
   - 需要合并 Web 版本的 `imageStore`（包含 PWA 离线同步功能）
   - Desktop 版本的 `imageStore` 有日志记录功能，需要合并

3. **测试验证**
   - 测试 Web 模式的开发服务器
   - 测试 Desktop 模式的开发服务器
   - 测试两种模式的构建

4. **更新根目录脚本**
   - 更新根目录的 `package.json` 脚本命令

## ⚠️ 注意事项

1. **路径引用**：Web 相关的代码使用 `-web` 后缀的目录，避免与 Desktop 代码冲突
2. **动态导入**：使用 `require()` 和 `import()`
   动态导入，避免在错误的模式下加载代码
3. **PWA 功能**：仅在 Web 模式下启用，Desktop 模式下不会加载
4. **Electron 功能**：仅在 Desktop 模式下启用，Web 模式下不会加载

## 🔄 后续优化

1. 逐步统一共享代码，减少重复
2. 考虑将 `-web` 后缀的目录整合到统一的目录结构中
3. 优化构建配置，确保两种模式的构建产物正确分离
