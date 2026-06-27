---
name: gitee-host-integration
description: >-
  Integrates Gitee image proxy across Vite dev, Vercel serverless, and Electron
  main/preload. Use when fixing Gitee CORS, gitee-proxy, viteGiteeProxyPlugin,
  startGiteeProxyServer, giteeProxyBase, or @pixuli/provider-gitee/proxy paths.
---

# Gitee Host Integration

## Subpath rules (critical)

| Import                                  | Allowed in                                     |
| --------------------------------------- | ---------------------------------------------- |
| `@pixuli/provider-gitee/proxy/client`   | Renderer                                       |
| `@pixuli/provider-gitee/proxy/url`      | Renderer, provider                             |
| `@pixuli/provider-gitee/proxy/server`   | Vite dev middleware, Vercel entry (via bundle) |
| `@pixuli/provider-gitee/proxy/node`     | Electron main only                             |
| `@pixuli/provider-gitee/proxy` (barrel) | **Avoid** in app — pulls node modules          |

## Three hosts

### 1. Web dev

- `apps/pixuli/plugins/storageHostVitePlugin.ts` — REF-411 Host Bootstrap
- Scans `hostBootstrapManifests` → `registerHostIntegrations` → Gitee
  `proxy/vite`（tsup dist，内联 server 中间件）
- `pnpm build:packages` before `dev:web` / `dev:desktop`（REF-416）

### 2. Web production (Vercel)

- SSOT logic: `@pixuli/provider-gitee/proxy/server`
- Entry: `apps/pixuli/api/gitee-proxy.entry.ts`
- Build: `pnpm build:vercel-api` → `api/gitee-proxy.js` (committed artifact)
- **Never** hand-edit `gitee-proxy.js`; Node cannot import workspace `.ts` at
  runtime

### 3. Desktop

- Main / preload: `registerHostIntegrations(storageRegistry, …)` — manifest
  `electronMain` / `electronPreload` → `@pixuli/provider-gitee/host/electron`
- Renderer: `getGiteeProviderContextFields()` from `/proxy/client`

## Constants

- Use `@pixuli/provider-gitee/proxy/constants` (`.js` registered exception)
- Do not add `./constants.ts` relative imports in paths loaded by Node/Vite SSR
  outside package exports

## After changes

```bash
pnpm build:vercel-api   # if server proxy logic changed
pnpm dev:web            # smoke Gitee image load
pnpm dev:desktop        # smoke packaged proxy + preload
```

## Docs

- `docs/02-system-design/04-typescript-javascript-policy.md` §三、§四
- `docs/02-system-design/03-plugin-system.md` (REF-313)
- [03-plugin-host-integration.md](../../docs/archive/design/03-plugin-host-integration.md)（已归档）(REF-411
  ✅)
