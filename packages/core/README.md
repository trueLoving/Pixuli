# @pixuli/core

三端共享的业务内核：类型、平台适配、纯函数工具、操作日志与存储插件契约。

## 子路径导出

| 路径                         | 内容                                                      |
| ---------------------------- | --------------------------------------------------------- |
| `@pixuli/core`               | 主入口                                                    |
| `@pixuli/core/types`         | 图片、GitHub/Gitee、日志等类型                            |
| `@pixuli/core/plugins`       | `StorageProvider` 契约、`StoragePluginRegistry`、配置类型 |
| `@pixuli/core/platform`      | `PlatformAdapter`                                         |
| `@pixuli/core/utils`         | filter、sort、fileSize、image 工具                        |
| `@pixuli/core/locales`       | 应用级词条与 `deepMerge`                                  |
| `@pixuli/core/operation-log` | `OperationLogService`                                     |

## 依赖边界

不得依赖：`react-dom`、`lucide-react`、`react-hot-toast`、`@pixuli/ui`
等 UI 库。

根目录 `pnpm lint:boundaries` 通过 ESLint `import/no-restricted-paths` 与
`no-restricted-imports` 强制执行（REF-209）。

`pixuli-common` 仅保留 GitHub/Gitee 存储服务（见 M3
provider 迁移），不再 re-export 本包能力。
