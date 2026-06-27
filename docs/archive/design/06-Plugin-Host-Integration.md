# 插件 Host 运行时集成

> **文档状态**：📦 **已归档（只读快照）** · 2026-06-17  
> **归档原因**：Gitee Host 代理已从 `apps/pixuli`
> 移除；REF-411 范围已改为 Obsidian 式插件重设计（[#126](https://github.com/trueLoving/Pixuli/issues/126)）。  
> **当前请读**：[REFACTOR_PLAN §1.6](../../REFACTOR_PLAN.md#16-ref-411--插件体系重设计obsidian-参考)
> · [04-Plugin-System.md](../../02-system-design/04-Plugin-System.md) · 索引
> [README.md](./README.md)

- **文档版本**：1.0
- **计划编号**：REF-411（M4）· 模块解析 REF-416
- **关联 Issue**：[#126](https://github.com/trueLoving/Pixuli/issues/126)
- **相关文档**：[04-Plugin-System.md](../../02-system-design/04-Plugin-System.md)
  ·
  [05-TypeScript-JavaScript-Policy.md](../../02-system-design/05-TypeScript-JavaScript-Policy.md)

---

## 背景

`StorageProvider`
覆盖应用运行时（list/upload/delete）。部分插件还需调整**宿主环境**（Vite
dev、Electron main/preload、Vercel
Serverless）。Gitee 图片代理（REF-313）须在宿主侧提供 HTTP 中间件或本地服务。

REF-411 前，`apps/pixuli` 按插件 ID 硬编码 Gitee 胶水。现改为 manifest 声明 +
Host Bootstrap 扫描。

## 契约（`@pixuli/core/plugins`）

`StoragePluginManifest.hostIntegrations[]` 每项：

| 字段         | 说明                                                                |
| ------------ | ------------------------------------------------------------------- |
| `kind`       | `viteDevServer` · `electronMain` · `electronPreload` · `serverless` |
| `module`     | package exports 子路径（如 `@pixuli/provider-gitee/proxy/vite`）    |
| `exportName` | 该模块的命名导出函数                                                |

API：

- `listHostIntegrations(registry, kind?)`
- `registerHostIntegrations(registry, hostCtx)`
- `createStorageHostVitePlugin(registry)` — 供直接传入完整 Registry 的场景

## 应用层（`apps/pixuli`）

| 宿主              | 集成方式                                                                             |
| ----------------- | ------------------------------------------------------------------------------------ |
| Web / Desktop dev | `plugins/storageHostVitePlugin.ts` → 轻量 manifest 列表 + `registerHostIntegrations` |
| Web 生产          | `api/gitee-proxy.entry.ts` → `pnpm build:vercel-api`（消费 dist）                    |
| Electron main     | `registerHostIntegrations(..., electronMain)`                                        |
| Electron preload  | `registerHostIntegrations(..., electronPreload)`                                     |

**禁止**：`vite.config.ts` 顶层静态 `import @pixuli/core/plugins`（Node
ESM 无法解析 workspace 源码子路径）。

## Gitee 样例（`@pixuli/provider-gitee`）

- `manifest.ts` — 四项 `hostIntegrations`
- `host/electron.ts` — `setupGiteeElectronMainHost` ·
  `exposeGiteeElectronPreload`
- `proxy/viteGiteeProxyPlugin.ts` — Vite dev 中间件（逻辑内联，dist 自包含）

## 与 REF-416（exports + dist）

- Renderer dev：`development` → 源码
- SSR / Node：`import` → `packages/*/dist`
- `pnpm dev:web` 会先 `build:packages`；改 `packages/core`
  后 Renderer 仍热更新，Host 边界需重建 dist 或跑
  `pnpm --filter @pixuli/core dev`（watch）
