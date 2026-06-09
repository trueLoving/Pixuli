# TypeScript / JavaScript 统一策略

- **文档版本**：1.0
- **计划编号**：REF-410（M4 工程基线）
- **关联 Issue**：[#125](https://github.com/trueLoving/Pixuli/issues/125)
- **最后核对**：2026-05-27

---

## 一、决策结论

**默认使用 TypeScript**（`.ts` /
`.tsx`）。仓库内业务代码、Provider、UI、Electron、测试与 Serverless 入口**一律 TypeScript**；仅保留经登记的**工具链配置**
JavaScript 例外。

| 维度     | 选择                         | 说明                                       |
| -------- | ---------------------------- | ------------------------------------------ |
| 应用源码 | **TypeScript**               | `apps/pixuli`、`apps/mobile`、`packages/*` |
| 类型检查 | `strict: true`               | 各包 `tsconfig` 保持严格模式               |
| 构建     | Vite / Vitest / `tsc`        | 无「运行时裸 JS 业务模块」                 |
| 新代码   | **禁止** 新增 `.js` 业务实现 | Code Review + 本文登记例外                 |

---

## 二、全仓审计（REF-410 基线）

### 2.1 已迁移为 TypeScript

| 原路径                                                                     | 现路径               | 说明                                             |
| -------------------------------------------------------------------------- | -------------------- | ------------------------------------------------ |
| `packages/plugin-provider-gitee/src/proxy/constants.js` + `constants.d.ts` | `constants.ts`       | 单常量 `GITEE_PROXY_PATH`；原 JS 为 REF-313 过渡 |
| `apps/pixuli/api/gitee-proxy.js`                                           | `api/gitee-proxy.ts` | Vercel Serverless 薄封装，逻辑在 provider        |

### 2.2 登记的 JavaScript 例外（保留）

| 文件                             | 原因                                      |
| -------------------------------- | ----------------------------------------- |
| `eslint.config.mjs`              | ESLint 9 flat config 官方推荐 `.mjs` 入口 |
| `apps/pixuli/postcss.config.cjs` | PostCSS 常用 CJS 配置格式                 |
| `apps/pixuli/tailwind.config.js` | Tailwind 配置；可被 Vite/PostCSS 直接加载 |
| `archive/**`                     | 已归档，非 workspace，不参与主构建        |

### 2.3 已删除的冗余

| 路径                                | 原因                                           |
| ----------------------------------- | ---------------------------------------------- |
| `apps/pixuli/vercel/gitee-proxy.js` | 仅 re-export `api/gitee-proxy`，无独立路由引用 |

---

## 三、原则

1. **一致性**：同一包、同一功能域内不得 TS 与 JS 各实现一份逻辑。
2. **类型单一来源**：禁止长期「`.js` 实现 + `.d.ts` 声明」双文件维护。
3. **导入约定**：包内 TypeScript 模块使用**无扩展名**或项目
   `moduleResolution: bundler` 约定；`package.json` `exports` 指向 `.ts`
   源文件（workspace 内由 Vite/Vitest 解析）。
4. **Serverless**：Vercel `api/*.ts` 由平台编译；handler 复用
   `@pixuli/provider-*` 的 TypeScript 实现，入口文件仅做转发。
5. **工具链例外**：新增 `.js`/`.mjs`/`.cjs` 须在 PR 中说明并更新本文 §2.2。

---

## 四、与插件 Host 集成的关系

Gitee 代理相关文件归属（REF-411 前置）：

| 环境     | 文件                                          | 语言 |
| -------- | --------------------------------------------- | ---- |
| Web dev  | `apps/pixuli/plugins/viteGiteeProxyPlugin.ts` | TS   |
| Web 生产 | `apps/pixuli/api/gitee-proxy.ts`              | TS   |
| 共享逻辑 | `@pixuli/provider-gitee/proxy/server`         | TS   |
| 常量     | `@pixuli/provider-gitee/proxy/constants`      | TS   |

---

## 五、后续（REF-413 可选）

- CI 增加脚本：扫描 `apps/`、`packages/` 下未登记的 `.js` 文件并失败。
- 评估 `tailwind.config.ts`、`postcss.config` ESM 化（非阻塞）。

---

## 相关文档

- [REFACTOR_PLAN.md §9.1](../../REFACTOR_PLAN.md)
- [04-Plugin-System.md](./04-Plugin-System.md)（Gitee 代理 REF-313）
