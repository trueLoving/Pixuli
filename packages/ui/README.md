# @pixuli/ui

基于 React 的共享界面层：`exports["."]` 面向 Web/Desktop，`exports["./native"]`
面向 React Native。

## 当前内容（REF-202）

| 入口                | 内容                                              |
| ------------------- | ------------------------------------------------- |
| `@pixuli/ui`        | `useLazyLoad`、`useInfiniteScroll`、`useKeyboard` |
| `@pixuli/ui/native` | `EmptyState`、`VersionInfoModal`、`Demo`（RN）    |

Web 侧 L1/L2 组件仍在 `pixuli-common`，见 REF-203。

## 依赖

- `@pixuli/core` — 类型与工具
- `react`（peer）
- `react-dom`（Web，optional peer）
- `react-native` 及相关 Expo 模块（Native，optional peer）

`pixuli-common` 在迁移期间从此包 re-export，应用请逐步改为直接引用
`@pixuli/ui`。
