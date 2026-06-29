# Pixuli — AI Agent Guide

> **REF-414** · 协作者与 Cursor/Copilot 等 AI 助手的仓库级上下文。用户向文档见
> [docs/](docs/README.md) 与
> [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)。

## 产品底线（不可破坏）

| 项          | 约定                                                                         |
| ----------- | ---------------------------------------------------------------------------- |
| **三端**    | Web（含 PWA）、Desktop（Electron）、Mobile（Capacitor，`apps/pixuli`）均维护 |
| **存储**    | GitHub / Gitee 经 `StorageProvider` 插件；**无官方 NestJS Server**           |
| **UI 共享** | Web + Desktop + Mobile 共用 `apps/pixuli` + `@pixuli/ui` web                 |
| **分层**    | L1 业务 · L2 网格/列表 · L3 各端平台能力；**core/provider 禁止依赖 ui**      |

重构追踪：[REFACTOR_PLAN.md](REFACTOR_PLAN.md)（Issue 映射、里程碑、§九 工程基线）。

## Monorepo 结构

```text
apps/pixuli/          Web + Desktop + Mobile/Capacitor（Vite + React + electron/ + android/）
packages/core/        @pixuli/core — types, StoragePluginRegistry, platform
packages/ui/          @pixuli/ui — web 入口（./native 已 deprecated，随 RN 归档）
packages/plugin-provider-github/   @pixuli/provider-github
packages/plugin-provider-gitee/    @pixuli/provider-gitee
archive/              wasm, server, benchmark, apps/mobile（非 workspace，勿接入主构建）
```

**常用命令**（根目录）：`pnpm test` · `pnpm build:packages` · `pnpm dev:web` ·
`pnpm dev:desktop` · `pnpm build:web` · `pnpm build:desktop` ·
`pnpm dev:android`（模拟器一键联调 + Live Reload）·
`run:android`（server 已起时重连）· `pnpm build:android`（已签名 release
APK；真机勿装 unsigned）

**Workspace 包消费（REF-416）**：`@pixuli/core`、`@pixuli/provider-gitee` 已
`tsup` 构建；`exports` 双轨 — Renderer dev 走 `development`（源码），SSR/Node走
`dist`。`dev:web` / `dev:desktop` 会先 `build:packages`。

## 存储插件（M3 已落地）

| 步骤         | 位置                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| 注册表单例   | `apps/pixuli/src/storage/registry.ts`                                         |
| 创建实例     | `createConfiguredStorageProvider()` → `storageRegistry.create(pluginId, ctx)` |
| 注册官方插件 | `registerGitHubProvider` · `registerGiteeProvider`（各包 `/register` 子路径） |
| 契约定义     | `@pixuli/core/plugins` — `StorageProvider`、`StoragePluginRegistry`           |

详细设计：[docs/02-system-design/03-plugin-system.md](docs/02-system-design/03-plugin-system.md)

三端工程（脚本/构建矩阵）：[06-apps-pixuli-engineering.md](docs/02-system-design/06-apps-pixuli-engineering.md)（REF-514）

### Gitee 存储插件（`@pixuli/provider-gitee`）

REF-607 P7 已退役 Gitee 图片 Host 代理。应用注册见
`src/storage/registerGiteeProvider.ts`；预览仅走本地工作区，复制链接使用
`publicUrl` / `buildPublicUrl`。

## 代码约束

- **默认 TypeScript**；登记 JS 例外见
  [04-typescript-javascript-policy.md](docs/02-system-design/04-typescript-javascript-policy.md)
- **包边界**：`core` ↛ `ui`；`provider-*` ↛ `ui`（REF-209 ESLint）
- **范围控制**：只改 Issue/PR 相关文件；勿顺手重构无关代码

## 开 PR 与 Issue 同步

1. 分支名或 PR 标题含计划编号，如 `REF-414` 或 `Fixes #129`
2. 合并意图用 `Fixes #n` / `Closes #n`（仅当本 PR 完整关闭 Issue）
3. Issue 关闭或部分完成时，更新 [REFACTOR_PLAN.md](REFACTOR_PLAN.md) 对应行
   **GitHub #** / **状态**
4. 文档变更：用户向 → `docs/01-product` / Wiki 源稿；技术向 →
   `docs/02-system-design`；Agent 向 → 本文 + `.cursor/`

## Cursor 资产

### Rules（`.cursor/rules/`）

| 文件                   | 作用                                   |
| ---------------------- | -------------------------------------- |
| `pixuli-monorepo.mdc`  | 全局：三端底线、包边界、TS 策略、测试  |
| `storage-plugin.mdc`   | 编辑 provider / registry / storage 时  |
| `electron-desktop.mdc` | 编辑 Electron / Vite 插件 / preload 时 |

### Skills（`.cursor/skills/`）

| Skill                | 触发场景                                       | 路径                                                                                 |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| **storage-provider** | 新增或修改 StorageProvider、register、manifest | [.cursor/skills/storage-provider/SKILL.md](.cursor/skills/storage-provider/SKILL.md) |
| **ref-issue-pr**     | 处理 REF-\* Issue、开 PR、同步 REFACTOR_PLAN   | [.cursor/skills/ref-issue-pr/SKILL.md](.cursor/skills/ref-issue-pr/SKILL.md)         |

### 何时更新 Agent/Skill

- 架构或包边界变更（M 里程碑合并后）
- 新增官方 provider 或 Host 集成模式（REF-411 等）
- 登记新的 TS/JS 例外或 ESLint 边界规则
- **不必**随每次功能 PR 更新；与 [docs/README.md](docs/README.md)
  用户文档职责分离

## 延伸阅读

| 主题       | 文档                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 系统架构   | [01-system-design.md](docs/02-system-design/01-system-design.md)                                                                                                   |
| 三端设计   | [06-apps-pixuli-engineering.md](docs/02-system-design/06-apps-pixuli-engineering.md) · 归档 [02-three-platform-design](archive/design/02-three-platform-design.md) |
| TS/JS 策略 | [04-typescript-javascript-policy.md](docs/02-system-design/04-typescript-javascript-policy.md)                                                                     |
| 版本发布   | [03-release-versioning.md](docs/01-product/03-release-versioning.md)                                                                                               |
| Backlog    | [docs/04-backlog.md](docs/04-backlog.md)                                                                                                                           |
