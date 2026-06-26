---
name: storage-provider
description: >-
  Implements or modifies Pixuli StorageProvider plugins (register, manifest,
  registry.create). Use when adding providers, editing @pixuli/provider-*,
  storageRegistry, createConfiguredStorageProvider, or StoragePluginRegistry.
---

# Storage Provider

## Quick map

| What               | Where                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| Registry factory   | `createStoragePluginRegistry()` — `@pixuli/core/plugins`                 |
| App registry       | `apps/pixuli/src/storage/registry.ts`                                    |
| Create + configure | `createConfiguredStorageProvider()` — `apps/*/storage/createProvider.ts` |
| GitHub register    | `registerGitHubProvider` — `@pixuli/provider-github/register`            |
| Gitee register     | `registerGiteeProvider` — `@pixuli/provider-gitee/register`              |

## Add or change a provider

1. Read `docs/02-system-design/04-Plugin-System.md` §第二部分
2. In provider package: `manifest.ts`（含可选 `hostIntegrations`）→
   `*StorageProvider.ts` → `register.ts` → `package.json` `exports`（REF-416：
   `development` + `dist`）
3. Register in both app `registry.ts` bootstrap functions
4. Extend `createConfiguredStorageProvider` if new `pluginId` / config type
5. Add Vitest: `register.test.ts` + provider behavior tests
6. **Do not** add UI or depend on `@pixuli/ui` from provider or core

## ProviderContext

```typescript
storageRegistry.create(pluginId, {
  platform: 'web' | 'desktop' | 'mobile',
  platformAdapter: new DefaultPlatformAdapter(),
  // Gitee Web/Desktop only:
  ...getGiteeProviderContextFields(__IS_WEB__),
});
```

## Gitee-specific

- `registerGiteeProvider` passes `proxyBaseUrl: ctx.giteeProxyBase` into
  provider
- Proxy URL building: `@pixuli/provider-gitee/proxy/url` in provider
  implementation
- Host 集成：在 `manifest.hostIntegrations` 声明；实现见
  `docs/02-system-design/06-Plugin-Host-Integration.md` 与 skill
  `gitee-host-integration`

## Verify

```bash
pnpm test --filter @pixuli/provider-github
pnpm test --filter @pixuli/provider-gitee
pnpm test --filter @pixuli/core
```
