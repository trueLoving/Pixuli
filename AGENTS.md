# Pixuli — AI Agent Guide

协作者与 Cursor / Copilot 等助手的仓库级上下文。用户文档见
[docs/](docs/README.md)。

## 产品底线（不可破坏）

| 项       | 约定                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| 三端     | Web · Desktop · Capacitor Android，共用 `app`                                   |
| 存储     | GitHub / Gitee 经 `StorageProvider`；无官方 Server                              |
| UI       | 共用 `app`（含 `src/ui`）                                                       |
| 分层     | features/stores · 薄 ui · layouts/platforms/boot；**core/provider 禁止依赖 ui** |
| 库内操作 | 仅本机；同步与复制链接分离；处理结果写回库且不自动 push                         |

进度：[PLANS.md](PLANS.md) ·
Issues。决策：[DECISIONS.md](DECISIONS.md)。产品/架构：[docs/product.md](docs/product.md)
· [docs/architecture.md](docs/architecture.md)。

## Monorepo

```text
app/          Web + Desktop + Mobile
website/      官网（pnpm dev:website → :5510）
examples/     示例与演示（如 plugin-example-kind）
packages/core/
packages/plugin-provider-github/
packages/plugin-provider-gitee/
packages/plugin-kind-pdf/      → @pixuli/kind-pdf
packages/plugin-kind-markdown/ → @pixuli/kind-markdown
packages/plugin-kind-text/     → @pixuli/kind-text
packages/plugin-kind-video/    → @pixuli/kind-video
packages/plugin-kind-image/    → @pixuli/kind-image
```

连接 UI：`@pixuli/provider-github/ui`、`@pixuli/provider-gitee/ui`（各自维护，无共享 git-ui 包）。

常用：`pnpm test` · `pnpm ci` · `pnpm dev:web` · `pnpm dev:desktop` ·
`pnpm dev:android` · `pnpm build:web`

`@pixuli/core` 与 `provider-*` 的 `exports` 直指 `src`，不必先
`build:packages`。

## 插件运行时

- 契约：`@pixuli/core/plugin-runtime`（Manifest / onload·onunload / enable）
- 启动：`app/src/plugins/runtime.ts`（Builtin + Desk/Mobile external
  Loader；设置内插件管理）
- UI 槽位：`app/src/plugins/uiRegistry` + `contribute*`（preview / thumbnail /
  editor / process；core 无 React）
- 激活存储：`storageType` + `storageConfig`（非 github/gitee 双轨）
- 说明：[docs/plugins-runtime.md](docs/plugins-runtime.md)

## 存储插件

- 经 Runtime 注册；对外仍 `app/src/storage/registry.ts`
- 创建：`storageRegistry.create(pluginId, ctx)`
- 契约：`@pixuli/core/plugins`
- Skill：[.cursor/skills/storage-provider](.cursor/skills/storage-provider/SKILL.md)

## 文件 Kind 插件

- 与 Storage 正交；经 Runtime 注册（`app/src/kinds/registry.ts`）
- 契约：`@pixuli/core/kinds`
- Kind：`@pixuli/kind-pdf` / `kind-markdown` / `kind-text` /
  `kind-video`；UI 在 onload 经 `PluginApi.ui` 贡献
- 用户安装插件（D2.9）：仅 Desktop +
  Mobile；**Web 禁止**。Desktop：`userData/plugins` + `registerExternal`；Mobile
  Loader PoC 已有
- 外部插件示例（Desk+Mobile 同一 `plugin/`）：`examples/plugin-example-kind/`
- 无 Kind 预览贡献时降级下载打开（`builtin.other`）

## 代码约束

- 默认 TypeScript（`.ts` / `.tsx`）
- 最小 diff；只改任务相关文件
- 完成功能后：`pnpm test`；涉及 Web 构建时考虑 `pnpm build:web`
- REF Issue：标题含编号；关闭用 `Fixes #n`；薄更新 [PLANS.md](PLANS.md)

## Cursor

Rules：`.cursor/rules/`（monorepo / storage-plugin / electron-desktop）。  
Skills：storage-provider · ref-issue-pr。
