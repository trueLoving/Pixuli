# @pixuli/core

三端共享的业务内核：类型、平台适配、纯函数工具、操作日志与存储插件契约。

## 子路径导出

| 路径                         | 内容                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `@pixuli/core`               | 主入口                                                             |
| `@pixuli/core/types`         | 图片、GitHub/Gitee、日志等类型                                     |
| `@pixuli/core/plugins`       | `StorageProvider` 契约、`StoragePluginRegistry`、`manifestUi` 辅助 |
| `@pixuli/core/sources`       | `StoredSourceEntry` 持久化归一化、单条配置导入/导出                |
| `@pixuli/core/platform`      | `PlatformAdapter`                                                  |
| `@pixuli/core/utils`         | filter、sort、fileSize、image 工具                                 |
| `@pixuli/core/locales`       | 应用级词条与 `deepMerge`                                           |
| `@pixuli/core/operation-log` | `OperationLogService`                                              |

## 依赖边界

不得依赖：`react-dom`、`lucide-react`、`react-hot-toast`、`@pixuli/ui`
等 UI 库。

根目录 `pnpm lint:boundaries` 通过 ESLint `import/no-restricted-paths` 与
`no-restricted-imports` 强制执行（REF-209）。

存储实现见 `@pixuli/provider-github`、`@pixuli/provider-gitee`（REF-311 已删除
`pixuli-common`）。
