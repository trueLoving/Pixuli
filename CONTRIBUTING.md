# 贡献指南

## 环境

- Node.js >= 22 · pnpm >= 8 · Git
- Desktop：macOS 10.15+ 或 Windows 10+
- Android：Android Studio、SDK 33+、JDK 17

主应用不需要 Rust。历史 WASM / Nest Server / Expo RN 已移除。

## 设置

```bash
pnpm install
pnpm dev:web          # http://localhost:5500
pnpm test
pnpm ci
```

项目结构与能力见根 [README.md](./README.md)。产品规则见
[docs/product.md](docs/product.md)。

## 工作流

1. 从 `develop`（或仓库约定的默认开发分支）拉分支
2. 最小 diff；匹配现有命名与目录约定
3. `pnpm test`；必要时 `pnpm build:web`
4. PR 说明动机；关闭 Issue 用 `Fixes #n`

提交信息风格与现有历史一致（如 `feat(app):` / `docs:` + 简短中文说明）。

## 边界

- `@pixuli/core` 与 `provider-*` 禁止依赖 `app/src/ui`
- 存储只经插件契约；应用不直接堆 Git API 细节
- AI 助手上下文：[AGENTS.md](./AGENTS.md)

## 反馈

Issue /
Discussion：[github.com/trueLoving/Pixuli](https://github.com/trueLoving/Pixuli)
