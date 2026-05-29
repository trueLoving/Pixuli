# @pixuli/core

三端共享的业务内核：类型、平台适配、纯函数工具、操作日志与存储插件契约。

## 子路径导出

| 路径                         | 内容                                       |
| ---------------------------- | ------------------------------------------ |
| `@pixuli/core`               | 主入口                                     |
| `@pixuli/core/types`         | 图片、GitHub/Gitee、日志等类型             |
| `@pixuli/core/plugins`       | `StorageProvider` 接口与注册表（占位实现） |
| `@pixuli/core/platform`      | `PlatformAdapter`                          |
| `@pixuli/core/utils`         | filter、sort、fileSize、image 工具         |
| `@pixuli/core/locales`       | 应用级词条与 `deepMerge`                   |
| `@pixuli/core/operation-log` | `OperationLogService`                      |

## 依赖边界

不得依赖：`react-dom`、`lucide-react`、`react-hot-toast` 等 UI 库。

`pixuli-common` 在迁移期间从此包 re-export，应用侧请逐步改为直接引用
`@pixuli/core`。
