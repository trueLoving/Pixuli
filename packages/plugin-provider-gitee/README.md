# @pixuli/provider-gitee

Pixuli 官方 **Gitee 仓库图床**存储插件（M3 REF-303）。

- **npm 包名**：`@pixuli/provider-gitee`
- **Monorepo 目录**：`packages/plugin-provider-gitee`
- **插件 ID**：`gitee`
- **设计文档**：[存储插件体系设计](../../docs/02-system-design/07-storage-plugin-system.md)

实现 Gitee API v5 + sidecar 元数据，符合
[`@pixuli/core/plugins`](../core/README.md) 中的 `StorageProvider`
契约。Manifest标注 `capabilities.needsProxy: true`（Web 部署常配合
`/api/gitee-proxy`）。

## 导出

| 路径                              | 内容                                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| `@pixuli/provider-gitee`          | `GiteeStorageProvider`、`GiteeStorageService`（兼容层）、`giteeManifest` |
| `@pixuli/provider-gitee/register` | `registerGiteeProvider(registry)`                                        |

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

## 兼容层（REF-304 前）

```typescript
import { GiteeStorageService } from 'pixuli-common/services';

const service = new GiteeStorageService(config, {
  platform: 'web',
  platformAdapter,
  useProxy: true, // Web/PWA 经 Vercel gitee-proxy
});
await service.getImageList();
```

## 依赖边界

- **仅依赖** `@pixuli/core`
- **禁止**依赖 `@pixuli/ui` 等 UI 层（REF-209）

## 开发

```bash
pnpm --filter @pixuli/provider-gitee test
```

## License

MIT
