# @pixuli/ui

基于 React 的共享界面层：`exports["."]`
面向 Web/Desktop/Capacitor。`exports["./native"]`
为历史 RN 子路径（`archive/apps/mobile` 已归档，#151）；Capacitor 不引用。见
[07-ui-native-migration-assessment.md](../../archive/design/07-ui-native-migration-assessment.md)。

## 子路径导出（节选）

| 入口                                 | 内容                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `@pixuli/ui`                         | Web：Image/Layout/Config、primitives、toast、keyboardShortcuts、locales 等 |
| `@pixuli/ui/native`                  | RN 用（**已归档**，仅 `archive/apps/mobile` 只读参考）                     |
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

应用请直接使用 `@pixuli/ui`（REF-311 已删除历史包 `pixuli-common`）。
