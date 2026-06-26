# Desktop（Electron）工程约定

REF-502 / REF-514：`apps/pixuli` 三端合一后，Desktop 相关代码分两层：

| 层级                    | 路径                     | 职责                                                            |
| ----------------------- | ------------------------ | --------------------------------------------------------------- |
| **L3 主进程 / preload** | `electron/`              | 窗口、托盘、文件系统 IPC、Gitee 代理 Host 等 Node/Electron API  |
| **L1 渲染进程适配**     | `src/platforms/desktop/` | `WorkspaceAdapter` 等薄封装，经 preload 暴露的 API 访问本地能力 |

- Vite **`--mode desktop`** 启用 `vite-plugin-electron`（入口见
  `vite.config.ts`）
- 构建产物：`dist-electron/main`、`dist-electron/preload` + `dist/` 静态资源 →
  `electron-builder` 安装包
- 勿在 Renderer 直接 `import` Node 模块；新 Desktop 能力优先 main/preload，再在
  `platforms/desktop` 暴露给业务
