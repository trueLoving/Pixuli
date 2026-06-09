# @pixuli/provider-gitee

Pixuli 官方 **Gitee 仓库图床**存储插件（M3 REF-303）。

- **npm 包名**：`@pixuli/provider-gitee`
- **Monorepo 目录**：`packages/plugin-provider-gitee`
- **插件 ID**：`gitee`
- **设计文档**：[04-Plugin-System](../../docs/02-system-design/04-Plugin-System.md)（§第一部分 体系设计、§第二部分 开发指南）

实现 Gitee API v5 + sidecar 元数据，符合
[`@pixuli/core/plugins`](../core/README.md) 中的 `StorageProvider`
契约。Manifest标注 `capabilities.needsProxy: true`（Web 部署常配合
`/api/gitee-proxy`）。

## 导出

| 路径                                  | 内容                                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `@pixuli/provider-gitee`              | `GiteeStorageProvider`、`GiteeStorageService`（兼容层）、`giteeManifest`、代理相关 re-export |
| `@pixuli/provider-gitee/register`     | `registerGiteeProvider(registry)`                                                            |
| `@pixuli/provider-gitee/proxy`        | 聚合导出（**勿在 Renderer 引用**，会打入 `node:http`）                                       |
| `@pixuli/provider-gitee/proxy/client` | `getGiteeProxyBase`、`getGiteeProviderContextFields`（Renderer 安全）                        |
| `@pixuli/provider-gitee/proxy/url`    | `getRealGiteeUrl`（Renderer 安全）                                                           |
| `@pixuli/provider-gitee/proxy/node`   | `startGiteeProxyServer`（Electron 主进程）                                                   |
| `@pixuli/provider-gitee/proxy/vite`   | `viteGiteeProxyPlugin`（仅 vite.config）                                                     |
| `@pixuli/provider-gitee/proxy/server` | `handleGiteeImageProxy`（Vercel Serverless / Node HTTP）                                     |

### 应用层接入代理

```typescript
// vite.config.ts（Web / 桌面 dev）
import { viteGiteeProxyPlugin } from '@pixuli/provider-gitee/proxy/vite';

// api/gitee-proxy.ts（Vercel）
import { handleGiteeImageProxy } from '@pixuli/provider-gitee/proxy/server';

// Electron main（打包版）
import { startGiteeProxyServer } from '@pixuli/provider-gitee/proxy/node';

// 创建 Provider 时注入桌面本地代理根
import { getGiteeProviderContextFields } from '@pixuli/provider-gitee/proxy/client';
registry.create('gitee', {
  platform: 'desktop',
  platformAdapter,
  ...getGiteeProviderContextFields(__IS_WEB__),
});
```

## 注册到 Registry

```typescript
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { registerGiteeProvider } from '@pixuli/provider-gitee/register';

const registry = createStoragePluginRegistry();
registerGiteeProvider(registry);

const provider = registry.create('gitee', {
  platform: 'web',
  platformAdapter: getPlatformAdapter(),
});
provider.configure({
  owner,
  repo,
  branch,
  token,
  path,
});
await provider.listImages();
```

通过 **兼容层**创建时，Web 端可显式开启代理（与现 `apps/pixuli` 行为一致）：

```typescript
import { GiteeStorageProvider } from '@pixuli/provider-gitee';

new GiteeStorageProvider(ctx, { useProxy: true });
```

## 配置形状

与 [`GiteeConfig`](../core/src/types/gitee.ts) 一致：

| 字段     | 说明         |
| -------- | ------------ |
| `owner`  | 仓库所有者   |
| `repo`   | 仓库名       |
| `branch` | 分支         |
| `token`  | 私人令牌     |
| `path`   | 图片目录路径 |

`useProxy` 不属于持久化 config，由构造 `GiteeStorageProvider` /
`GiteeStorageService` 时传入；Registry 默认
`useProxy: false`，REF-304 集成时再按平台/bootstrap 决策。

## 兼容层（`GiteeStorageService`）

过渡期仍可从本包导入 `GiteeStorageService`。新代码请使用
`registerGiteeProvider` + `StorageProvider` 契约。

## 依赖边界

- **仅依赖** `@pixuli/core`
- **禁止**依赖 `@pixuli/ui` 等 UI 层（REF-209）

## 测试（REF-309）

| 文件                                               | 说明                           |
| -------------------------------------------------- | ------------------------------ |
| `src/__tests__/giteeStorageProvider.test.ts`       | Provider 契约 + mock Gitee API |
| `src/__tests__/register.test.ts`                   | Registry 注册                  |
| `src/__tests__/giteeStorageService.compat.test.ts` | 兼容层冒烟                     |
| `src/__tests__/helpers.ts`                         | 共用 mock `fetch` 响应         |

```bash
pnpm --filter @pixuli/provider-gitee test
```

## License

MIT
