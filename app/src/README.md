# Pixuli App 源码（`app/src`）

三端（Web / Desktop / Mobile）共用应用壳与业务 feature。分层约定见仓库
[AGENTS.md](../../AGENTS.md)。

## 分层

```text
L1  features/* + stores/     业务与全局状态
L2  ui/                      薄 primitives / brand（@/ui）
L3  layouts/ + platforms/ + boot/ + router/   壳层与路由
```

| 路径                     | 职责                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| `features/library`       | 资源库 SSOT：`LibraryRoute`、`useLibraryRoute`、`LibraryWorkbench`、`imageStore` |
| `features/tools`         | 增强工具：`imageProcessor`、压缩/转换 Panel、`UtilityToolOverlay`                |
| `features/settings`      | 设置、源管理 hooks、配置 Modal、`sourceStore`                                    |
| `features/workspace`     | 本地工作区、folderTree、`workspaceStore`                                         |
| `features/operation-log` | 操作日志 UI + store + service（域内聚）                                          |
| `stores/`                | **跨 feature** 壳层全局 Zustand                                                  |
| `router/`                | `/library` 主路由、`LibraryRoute` lazy 加载、legacy redirect                     |
| `i18n/`                  | 文案 SSOT；壳层标语见 `brand.json` + `brandCopy.ts`                              |
| `ui/`                    | 禁止放复合业务 UI                                                                |

## 路由

- **主界面**：`/library`（资源库工作区）
- **增强工具**：无独立路由；`uiStore.currentUtilityTool` + `UtilityToolOverlay`
- **Legacy**：`/photos`、`/compress`、`/convert` 等 → redirect `/library`
- **深链**：`/library?tool=compress|convert`（读后清除 query）

## Store 放置规则

| 位置               | 何时使用                    | 示例                                                                     |
| ------------------ | --------------------------- | ------------------------------------------------------------------------ |
| `stores/`          | 壳层全局 UI 状态            | `uiStore`                                                                |
| `features/<name>/` | 单 feature 私有持久化或服务 | `settings/sourceStore`、`library/imageStore`、`workspace/workspaceStore` |

新增 store 前先问：是否被 2 个以上 feature 或 `App.tsx` 壳层直接依赖？是 →
`stores/`；否 → 留在 owning feature。

跨 feature 互调经端口契约，避免直接 import 对方 store：

- `workspaceImageBridge`（`library` ↔ `workspace`）
- `sourceSelectionPort`（`settings` ↔ `library` 源选中与仓库配置）
- `utilityToolPort`（`library` / `inspector` / 侧栏 → `tools` overlay）
- `copyLink` / `copyImageLink`（资源库复制公网链接）

## 导入约定

- 业务：`@/features/<name>`（**不要**从已删除的 `@/features` 聚合 barrel 导入）
- 薄 UI：`@/ui`
- 壳层 hooks：`@/hooks`（仅 init、路由同步、键盘、面板）
- 无域归属的纯函数：`@/utils`（当前仅 `clipboard`）
- 面板宽度常量：`constants/panelWidth.ts`（壳层 `usePanelResize`）
- 全局 ambient 类型：`types/*.d.ts`（FSA / SW / workspace API 等，无 barrel）

## 文案

- 域 JSON：`i18n/locales/{zh-CN,en-US}/*.json`
- 启动前可读：`brand.json` → `i18n/brandCopy.ts`（preloading / PWA / Electron）
- 工具文案：`tools.compress.*` / `tools.convert.*`（非 `*Page`）

## 常用命令

在仓库根目录：`pnpm test` · `pnpm dev:web` · `pnpm build:web`

更细的 UI 边界见 [ui/README.md](./ui/README.md)；壳层 hooks 见
[hooks/README.md](./hooks/README.md)。
