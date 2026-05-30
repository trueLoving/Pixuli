# @pixuli/ui

基于 React 的共享界面层：`exports["."]` 面向 Web/Desktop，`exports["./native"]`
面向 React Native。

## 子路径导出（节选）

| 入口                                 | 内容                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `@pixuli/ui`                         | Web：Image/Layout/Config、primitives、toast、keyboardShortcuts、locales 等 |
| `@pixuli/ui/native`                  | `EmptyState`、`VersionInfoModal`、`Demo`（RN）                             |
| `@pixuli/ui/locales`                 | 聚合语言包                                                                 |
| `@pixuli/ui/services/imageProcessor` | Web Canvas 图片压缩/转换                                                   |

## 依赖边界

- 依赖 `@pixuli/core`（类型、工具）
- **不得**被 `@pixuli/core` 或未来的 `provider-*` 包引用（见 REF-209
  ESLint 规则）

## 依赖

- `@pixuli/core` — 类型与工具
- `react`（peer）
- `react-dom`（Web，optional peer）
- `react-native` 及相关 Expo 模块（Native，optional peer）

`pixuli-common` 在迁移期间从此包 re-export（已 `@deprecated`），应用请使用
`@pixuli/ui` 直接引用。
