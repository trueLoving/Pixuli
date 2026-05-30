# pixuli-common（存储服务空壳，M3 前保留）

M2 迁移后，本包**仅**保留 GitHub/Gitee 存储实现与日志拦截服务，直至 M3 迁入
`@pixuli/provider-github` / `@pixuli/provider-gitee`。

类型、UI、工具、操作日志、图片处理等请使用：

- [`@pixuli/core`](../core/README.md)
- [`@pixuli/ui`](../ui/README.md)

## 入口

| 路径                            | 说明                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `pixuli-common/services`        | `GitHubStorageService`、`GiteeStorageService`（Web/Desktop） |
| `pixuli-common/services/native` | 同上（React Native）                                         |

## 开发

```bash
pnpm --filter pixuli-common test
```

## License

MIT
