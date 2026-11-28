---
name: storage-provider
description: >-
  Implements or modifies Pixuli StorageProvider plugins (register, manifest,
  registry.create). Use when adding providers, editing @pixuli/provider-*,
  storageRegistry, createConfiguredStorageProvider, or StoragePluginRegistry.
---

# Storage Provider

## Quick map

| What               | Where                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| Registry factory   | `createStoragePluginRegistry()` — `@pixuli/core/plugins`                  |
| App registry       | `app/src/storage/registry.ts`                                             |
| Create + configure | `createConfiguredStorageProvider()` — `app/src/storage/createProvider.ts` |
| GitHub register    | `registerGitHubProvider` — `@pixuli/provider-github/register`             |
| Gitee register     | `registerGiteeProvider` — `@pixuli/provider-gitee/register`               |
| GitHub runtime     | `createGitHubRuntimePlugin` — `@pixuli/provider-github/runtime`           |
| Gitee runtime      | `createGiteeRuntimePlugin` — `@pixuli/provider-gitee/runtime`             |

## Add or change a provider

1. Read `docs/architecture.md`（存储插件节）与 `@pixuli/core/plugins` 源码
2. In provider package: `types.ts`（配置/API 形状，**勿放进 `@pixuli/core`**）→
   `manifest.ts`（含可选 `hostIntegrations`）→ `*StorageProvider.ts` →
   `register.ts` → `runtimePlugin.ts` → `package.json` `exports`（直指 `src`，含
   `/runtime`）
3. App：`pluginRuntime.registerBuiltin(create*RuntimePlugin)`（`app/src/plugins/runtime.ts`）；**勿**在 app 内再写 provider 注册包装
4. Extend `createConfiguredStorageProvider` if new `pluginId` / config type
5. Add Vitest: `register.test.ts` + `runtimePlugin.test.ts` + provider behavior
6. **Do not** add UI or depend on `app/src/ui` (`@/ui`) from provider or
   core；core 只认不透明 `StorageProviderConfig`

## ProviderContext

```typescript
storageRegistry.create(pluginId, {
  platform: 'web' | 'desktop' | 'mobile',
  platformAdapter: new DefaultPlatformAdapter(),
});
```

## Gitee-specific

- REF-607 P7：无 Host 图片代理；`buildPublicUrl` / `getRawUrl` 返回公网 raw 直链
- 复制链接：`image.publicUrl || image.githubUrl || image.url`

## Verify

```bash
pnpm test --filter @pixuli/provider-github
pnpm test --filter @pixuli/provider-gitee
pnpm test --filter @pixuli/core
```
