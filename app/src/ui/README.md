# 应用内 UI（`app/src/ui`）

原 `@pixuli/ui` 已内联。从 `@/ui`
导入 Web 组件（网格/列表、配置 Modal、toast、locales、Canvas 图片处理）。

`native/` 为 RN 历史子路径，**不参与** Capacitor / tsc；仅作归档对照。

## 边界

- 可依赖 `@pixuli/core`（类型、工具）
- **禁止**依赖 `@pixuli/provider-*` 与 `src/storage/providers`（ESLint）
- **core / provider 禁止**依赖本目录
