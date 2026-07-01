# REF-413 冒烟测试矩阵

> **Issue**：[#128](https://github.com/trueLoving/Pixuli/issues/128) ·
> **计划编号**：REF-413  
> **关联**：REF-602 P3（#131）将本矩阵作为 UI 回归门禁引用

---

## 1. 范围边界

| 类型                | 目标                           | 时长       |
| ------------------- | ------------------------------ | ---------- |
| **冒烟**            | 构建链 + 单测 + 应用壳层可加载 | ~5–10 分钟 |
| **集成**（REF-412） | 存储插件、同步、多步用户旅程   | 另立 Issue |

---

## 2. 本地命令

在仓库根目录：

```bash
# Web：packages 构建 + vitest + build:web
pnpm smoke:web

# Desktop：smoke:web + 类型检查 + vite desktop build
pnpm smoke:desktop

# 同上 Desktop 冒烟的简写
pnpm smoke

# Playwright 壳层（需本机已 build:packages；dev server 由 playwright 拉起）
pnpm smoke:e2e
```

组合子命令（`smoke:*` / `ci` 内部复用）：

- `pnpm check:types` — `pixuli-app` 的 `tsc`
- `pnpm check:desktop` — `vite build --mode desktop`（不含 electron-builder）

---

## 3. 矩阵

| 项               | 命令                        | 说明                                         |
| ---------------- | --------------------------- | -------------------------------------------- |
| Workspace 包构建 | `pnpm build:packages`       | `@pixuli/core`、`@pixuli/provider-gitee`     |
| 单元测试         | `pnpm test`                 | vitest workspace                             |
| Web 生产构建     | `pnpm build:web`            | `apps/pixuli/dist/`                          |
| Desktop TS       | `pnpm check:types`          | Renderer + electron 类型检查                 |
| Desktop Vite     | `pnpm check:desktop`        | 主进程/preload 编译（不含 electron-builder） |
| E2E 壳层         | `playwright test e2e/smoke` | `/photos` 标题与布局、设置弹窗               |

---

## 4. CI 建议

- **PR**：`pnpm ci`（build:packages + lint:boundaries + test + web +
  desktop 类型与 vite 构建）
- **可选加强**：`pnpm smoke:e2e` 作为 nightly 或 release 前手动步骤
- **Android**：见
  [`release-android.yml`](../../.github/workflows/release-android.yml) 手动发版

---

## 5. 修订记录

| 版本 | 日期       | 说明                                                    |
| ---- | ---------- | ------------------------------------------------------- |
| 1.0  | 2026-06-16 | REF-413 初稿；脚本 + Playwright smoke + REF-602 P3 引用 |
