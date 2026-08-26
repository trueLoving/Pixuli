# Pixuli 存储插件体系

- **文档版本**：2.0
- **最后核对**：2026-08-25
- **相关**：[01-system-design](./01-system-design.md) ·
  [04-local-workspace-sync](./04-local-workspace-sync.md) ·
  [04-asset-library-ui](../01-product/04-asset-library-ui.md) ·
  Skill：[storage-provider](../../.cursor/skills/storage-provider/SKILL.md)

> 应用只经 `@pixuli/core/plugins` 与 Registry 使用存储；Git 细节在
> `@pixuli/provider-*`。**core / provider 禁止依赖 `app/src/ui`**。

---

## 一、架构

```text
app/src/storage/registry.ts
  bootstrap → registerGitHubProvider / registerGiteeProvider
  createConfiguredStorageProvider(pluginId, config)
        │
        ▼
StoragePluginRegistry.create(pluginId, ctx)
        │
        ▼
@pixuli/provider-*  implements StorageProvider
```

| 包                        | pluginId | 注册                     |
| ------------------------- | -------- | ------------------------ |
| `@pixuli/provider-github` | `github` | `registerGitHubProvider` |
| `@pixuli/provider-gitee`  | `gitee`  | `registerGiteeProvider`  |

`exports` 直指 `src`（含 `./register`）；Vite / vitest 直接编译，无需先
`build:packages`。

---

## 二、核心契约（摘要）

实现：`packages/core/src/plugins/` → `@pixuli/core/plugins`。以源码为准。

**Manifest**：`id`、`name`、`version`、`capabilities`、可选 `configSchema`
/ 能力位（sync、publicUrl 等）。**不含 Token**。

**StorageProvider**（配置后可用）：

- `configure(config)`
- `listImages` / `uploadImage` / `deleteImage`
- 可选 `updateImageMetadata`
- `getRawUrl`；同步扩展见 [04](./04-local-workspace-sync.md)（`sync` /
  `buildPublicUrl`）

**ProviderContext**：`platform`、`platformAdapter`、可选 `fetch` / `logger`。

**Registry**：`register(manifest, factory)` · `listManifests()` ·
`create(id, ctx)`（不自动 configure）。

---

## 三、包边界

| 允许                        | 禁止                                |
| --------------------------- | ----------------------------------- |
| provider → `@pixuli/core`   | provider / core → UI、React、`app/` |
| app → `provider-*/register` | UI → `@pixuli/provider-*`           |

---

## 四、新增 Provider（内置模式）

1. 建 `packages/plugin-provider-{id}/`：`manifest.ts` · `{id}StorageProvider.ts`
   · `register.ts` · `exports` 直指 src。
2. 仅依赖 `@pixuli/core`。
3. 在 `app/src/storage/registry.ts` 的 bootstrap 中 `registerXxxProvider`。
4. 扩展 `createConfiguredStorageProvider`（若新 config 形状）。
5. Vitest：`register.test.ts` + 行为测。
6. UI 配置表单由 **app** 提供（manifest 可带
   `configSchema`）；不要把 React 放进 provider。

热加载 / 插件市场：**未实现**（API 预留 `register`）；见 backlog / #102。

---

## 五、安全

- Token 只存客户端用户配置，不进 Manifest、不上官方 Server。
- 测试可注入 `fetch` mock。

---

## 六、验证

```bash
pnpm test --filter @pixuli/provider-github
pnpm test --filter @pixuli/provider-gitee
pnpm test --filter @pixuli/core
pnpm ci
```

---

## 七、修订

| 版本 | 日期       | 说明                         |
| ---- | ---------- | ---------------------------- |
| 2.0  | 2026-08-25 | 瘦身：现行契约 + 开发步骤    |
| 1.1  | —          | 曾合并设计 + 指南 + 回归清单 |
