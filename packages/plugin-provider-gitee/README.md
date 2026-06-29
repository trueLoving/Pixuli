# @pixuli/provider-gitee

Pixuli 官方 **Gitee 仓库图床**存储插件（M3 REF-303）。

- **npm 包名**：`@pixuli/provider-gitee`
- **Monorepo 目录**：`packages/plugin-provider-gitee`
- **插件 ID**：`gitee`
- **设计文档**：[03-plugin-system](../../docs/02-system-design/03-plugin-system.md)

实现 Gitee API v5 + sidecar 元数据，符合
[`@pixuli/core/plugins`](../core/README.md) 中的 `StorageProvider` 契约。REF-607
P7 后**不再**提供图片 Host 代理；预览走本地工作区，公网分享走 `buildPublicUrl` /
`getRawUrl` 直链。

## 导出

| 路径                              | 内容                                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| `@pixuli/provider-gitee`          | `GiteeStorageProvider`、`GiteeStorageService`（兼容层）、`giteeManifest` |
| `@pixuli/provider-gitee/register` | `registerGiteeProvider(registry)`                                        |
| `@pixuli/provider-gitee/manifest` | `giteeManifest`                                                          |

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

## 配置形状

与 [`GiteeConfig`](../core/src/types/gitee.ts) 一致：

| 字段     | 说明         |
| -------- | ------------ |
| `owner`  | 仓库所有者   |
| `repo`   | 仓库名       |
| `branch` | 分支         |
| `token`  | 私人令牌     |
| `path`   | 图片目录路径 |

## 兼容层（`GiteeStorageService`）

过渡期仍可从本包导入 `GiteeStorageService`。新代码请使用
`registerGiteeProvider` + `StorageProvider` 契约。

## 依赖边界

- **仅依赖** `@pixuli/core`
- **禁止**依赖 `@pixuli/ui` 等 UI 层（REF-209）

## 测试

```bash
pnpm --filter @pixuli/provider-gitee test
```

## License

MIT
