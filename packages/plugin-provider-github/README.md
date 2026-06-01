# @pixuli/provider-github

Pixuli 官方 **GitHub 仓库图床**存储插件（M3 REF-302）。

- **npm 包名**：`@pixuli/provider-github`
- **Monorepo 目录**：`packages/plugin-provider-github`
- **插件 ID**：`github`
- **设计文档**：[存储插件体系设计](../../docs/02-system-design/07-storage-plugin-system.md)

实现 GitHub Contents API + sidecar 元数据（`.metadata/`），符合
[`@pixuli/core/plugins`](../core/README.md) 中的 `StorageProvider` 契约。

## 导出

| 路径                               | 内容                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `@pixuli/provider-github`          | `GitHubStorageProvider`、`GitHubStorageService`（兼容层）、`githubManifest` |
| `@pixuli/provider-github/register` | `registerGitHubProvider(registry)`                                          |

## 注册到 Registry

```typescript
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { registerGitHubProvider } from '@pixuli/provider-github/register';

const registry = createStoragePluginRegistry();
registerGitHubProvider(registry);

const provider = registry.create('github', {
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

## 配置形状

与 [`GitHubConfig`](../core/src/types/github.ts) 一致：

| 字段     | 说明           |
| -------- | -------------- |
| `owner`  | 仓库所有者     |
| `repo`   | 仓库名         |
| `branch` | 分支           |
| `token`  | Personal Token |
| `path`   | 图片目录路径   |

## 兼容层（REF-304 前）

应用仍可通过 `pixuli-common/services` 使用旧 API：

```typescript
import { GitHubStorageService } from 'pixuli-common/services';

const service = new GitHubStorageService(config, {
  platform: 'web',
  platformAdapter,
});
await service.getImageList();
```

`GitHubStorageService` 内部委托给
`GitHubStorageProvider`，方法名保持与 M2 一致（如 `getImageList` → 内部
`listImages`）。

## 依赖边界

- **仅依赖** `@pixuli/core`（types、platform、plugins）
- **禁止**依赖 `@pixuli/ui`、`react-dom`
  等 UI 层（REF-209，`pnpm lint:boundaries`）

## 开发

```bash
pnpm --filter @pixuli/provider-github test
```

## License

MIT
