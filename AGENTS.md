# Pixuli — AI Agent Guide

> **REF-414** · 协作者与 Cursor/Copilot 等 AI 助手的仓库级上下文。用户向文档见
> [docs/](docs/README.md) 与
> [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)。

## 产品底线（不可破坏）

| 项          | 约定                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **三端**    | Web（含 PWA）、Desktop（Electron）、Mobile（Capacitor，`app`）均维护                                                                                   |
| **存储**    | GitHub / Gitee 经 `StorageProvider` 插件；**无官方 NestJS Server**                                                                                     |
| **UI 共享** | Web + Desktop + Mobile 共用 `app`（含 `src/ui`）                                                                                                       |
| **分层**    | L1 `features/`+`stores/` · L2 薄 `src/ui`（primitives/brand）· L3 `layouts/`+`platforms/`+`boot/`；壳 hooks 在 `hooks/`；**core/provider 禁止依赖 ui** |

进度追踪：[PLANS.md](PLANS.md)（与 GitHub Issues 对齐）；2.0 见
[2.0.md](2.0.md)；决策见 [DECISIONS.md](DECISIONS.md)。

## Monorepo 结构

```text
app/          Web + Desktop + Mobile/Capacitor（Vite + React + electron/ + android/）
packages/core/        @pixuli/core — types, StoragePluginRegistry, platform
packages/plugin-provider-github/   @pixuli/provider-github
packages/plugin-provider-gitee/    @pixuli/provider-gitee
```

**常用命令**（根目录）：`pnpm test` · `pnpm ci` · `pnpm dev:web` ·
`pnpm dev:desktop` · `pnpm build:web` · `pnpm build:desktop` ·
`pnpm dev:android`（模拟器一键联调 + Live Reload）·
`pnpm run:android`（server 已起时重连）· `pnpm build:android`（已签名 release
APK；debug 用 `build:android:debug`）

**Workspace 包消费（REF-416）**：`@pixuli/core` 与 `provider-*` 的 `exports`
直指 `src`；Vite / vitest 直接编译源码，**不必**先 `build:packages`。

## 存储插件（M3 已落地）

| 步骤         | 位置                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| 注册表单例   | `app/src/storage/registry.ts`                                                 |
| 创建实例     | `createConfiguredStorageProvider()` → `storageRegistry.create(pluginId, ctx)` |
| 注册官方插件 | `registerGitHubProvider` · `registerGiteeProvider`（各包 `/register` 子路径） |
| 契约定义     | `@pixuli/core/plugins` — `StorageProvider`、`StoragePluginRegistry`           |

详细设计：[docs/02-system-design/03-plugin-system.md](docs/02-system-design/03-plugin-system.md)

三端工程脚本：见 [app/README.md](app/README.md) 与根
`package.json`（`pnpm dev:*` / `build:*` / `ci`）。

### Gitee 存储插件（`@pixuli/provider-gitee`）

REF-607 P7 已退役 Gitee 图片 Host 代理。应用注册见
`src/storage/registerGiteeProvider.ts`；预览仅走本地工作区，复制链接使用
`publicUrl` / `buildPublicUrl`。

## 代码约束

- **默认 TypeScript**（`.ts` / `.tsx`）；见 [DECISIONS.md](DECISIONS.md) D2.6
- **包边界**：`core` ↛ `ui`；`provider-*` ↛ `ui`（REF-209 ESLint）
- **范围控制**：只改 Issue/PR 相关文件；勿顺手重构无关代码

## 开 PR 与 Issue 同步

1. 分支名或 PR 标题含计划编号，如 `REF-414` 或 `Fixes #129`
2. 合并意图用 `Fixes #n` / `Closes #n`（仅当本 PR 完整关闭 Issue）
3. Issue 关闭或部分完成时，更新 [PLANS.md](PLANS.md)
   对应行（须与远程 Issue 状态一致） **GitHub #** / **状态**
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
| **ref-issue-pr**     | 处理 REF-\* Issue、开 PR、同步 PLANS.md        | [.cursor/skills/ref-issue-pr/SKILL.md](.cursor/skills/ref-issue-pr/SKILL.md)         |

### 何时更新 Agent/Skill

- 架构或包边界变更（M 里程碑合并后）
- 新增官方 provider 或 Host 集成模式（REF-411 等）
- 登记新的 TS/JS 例外或 ESLint 边界规则
- **不必**随每次功能 PR 更新；与 [docs/README.md](docs/README.md)
  用户文档职责分离

## 延伸阅读

| 主题              | 文档                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 进度 / 2.0 / 决策 | [PLANS.md](PLANS.md) · [2.0.md](2.0.md) · [DECISIONS.md](DECISIONS.md)                                                                                                          |
| 系统架构          | [01-system-design.md](docs/02-system-design/01-system-design.md) · [app/README](app/README.md)                                                                                  |
| 三端设计          | [三端交互规范](docs/01-product/03-three-platform-interaction-spec.md) · [资源库 UI](docs/01-product/04-asset-library-ui.md) · [品牌视觉](docs/01-product/05-brand-visual-ui.md) |
| 版本发布          | [05-release-versioning.md](docs/02-system-design/05-release-versioning.md)                                                                                                      |
| Backlog           | [docs/04-backlog.md](docs/04-backlog.md)                                                                                                                                        |
