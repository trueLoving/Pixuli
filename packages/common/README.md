# pixuli-common（兼容层，已废弃）

> **@deprecated** 本包仅用于 M2 迁移期的兼容 re-export。新代码请使用
> [`@pixuli/core`](../core/README.md) 与 [`@pixuli/ui`](../ui/README.md)。

## 迁移对照

| 原 `pixuli-common` 用法                       | 请改用                                                                             |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| 类型（`ImageItem`、`GitHubConfig` 等）        | `@pixuli/core/types`                                                               |
| 工具（`filterImages`、`formatFileSize` 等）   | `@pixuli/core/utils`                                                               |
| 操作日志                                      | `@pixuli/core/operation-log`                                                       |
| Web UI 组件、toast、快捷键、locales           | `@pixuli/ui` 及子路径                                                              |
| Native UI（`EmptyState`、`VersionInfoModal`） | `@pixuli/ui/native`                                                                |
| Web 图片处理                                  | `@pixuli/ui/services/imageProcessor`                                               |
| GitHub/Gitee 存储服务                         | `pixuli-common/services` 或 `pixuli-common/services/native`（M3 迁至 provider 包） |

## 入口

| 路径                            | 说明                                                        |
| ------------------------------- | ----------------------------------------------------------- |
| `pixuli-common`                 | Web/Desktop barrel（deprecated）                            |
| `pixuli-common/native`          | React Native barrel（deprecated，不含 `webImageProcessor`） |
| `pixuli-common/services`        | 存储与日志服务（Web）                                       |
| `pixuli-common/services/native` | 存储与日志服务（Mobile）                                    |

## 开发

```bash
pnpm --filter pixuli-common test
```

## License

MIT
