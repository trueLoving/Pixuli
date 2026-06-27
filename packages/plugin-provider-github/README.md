# @pixuli/provider-github

Pixuli 官方 **GitHub 仓库图床**存储插件（M3 REF-302）。

- **npm 包名**：`@pixuli/provider-github`
- **Monorepo 目录**：`packages/plugin-provider-github`
- **插件 ID**：`github`
- **设计文档**：[03-plugin-system](../../docs/02-system-design/03-plugin-system.md)（§第一部分 体系设计、§第二部分 开发指南）

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

## 兼容层（`GitHubStorageService`）

过渡期仍可从本包导入 `GitHubStorageService`（委托
`GitHubStorageProvider`）。新代码请使用 `registerGitHubProvider` +
`StorageProvider` 契约（见 `docs/02-system-design/03-plugin-system.md`）。

## 依赖边界

- **仅依赖** `@pixuli/core`（types、platform、plugins）
- **禁止**依赖 `@pixuli/ui`、`react-dom`
  等 UI 层（REF-209，`pnpm lint:boundaries`）

## 测试（REF-309）

| 文件                                                | 说明                               |
| --------------------------------------------------- | ---------------------------------- |
| `src/__tests__/githubStorageProvider.test.ts`       | Provider 契约 + mock GitHub API    |
| `src/__tests__/register.test.ts`                    | Registry 注册                      |
| `src/__tests__/githubStorageService.compat.test.ts` | 兼容层 `GitHubStorageService` 冒烟 |
| `src/__tests__/helpers.ts`                          | 共用 mock `fetch` 响应             |

```bash
pnpm --filter @pixuli/provider-github test
```

## License

MIT
