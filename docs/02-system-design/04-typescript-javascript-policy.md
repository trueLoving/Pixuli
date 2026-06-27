# TypeScript / JavaScript 统一策略

- **文档版本**：1.0
- **计划编号**：REF-410（M4 工程基线）
- **关联 Issue**：[#125](https://github.com/trueLoving/Pixuli/issues/125)
- **最后核对**：2026-05-27

---

## 一、决策结论

**默认使用 TypeScript**（`.ts` /
`.tsx`）。仓库内业务代码、Provider、UI、Electron、测试**一律 TypeScript**；仅保留经登记的
**JavaScript 例外**（含 Vercel `api/*.js` 与工具链配置）。

| 维度     | 选择                         | 说明                                                          |
| -------- | ---------------------------- | ------------------------------------------------------------- |
| 应用源码 | **TypeScript**               | `apps/pixuli`、`packages/*`；`archive/apps/mobile` 为只读归档 |
| 类型检查 | `strict: true`               | 各包 `tsconfig` 保持严格模式                                  |
| 构建     | Vite / Vitest / `tsc`        | 无「运行时裸 JS 业务模块」                                    |
| 新代码   | **禁止** 新增 `.js` 业务实现 | Code Review + 本文登记例外                                    |

---

## 二、全仓审计（REF-410 基线）

### 2.1 已迁移为 TypeScript

| 原路径                                     | 现路径                            | 说明                                           |
| ------------------------------------------ | --------------------------------- | ---------------------------------------------- |
| `constants.d.ts` 单独维护（无 `.js` 实现） | `constants.js` + `constants.d.ts` | 单常量；`.js` 供 Node/Vite SSR，`.d.ts` 供 tsc |

### 2.2 登记的 JavaScript 例外（保留）

| 文件                                                    | 原因                                                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`                                     | ESLint 9 flat config 官方推荐 `.mjs` 入口                                                                                              |
| `apps/pixuli/postcss.config.cjs`                        | PostCSS 常用 CJS 配置格式                                                                                                              |
| `apps/pixuli/tailwind.config.js`                        | Tailwind 配置；可被 Vite/PostCSS 直接加载                                                                                              |
| `apps/pixuli/api/gitee-proxy.js`                        | Vercel Serverless **产物**；由 `build:vercel-api`（esbuild）从 `gitee-proxy.entry.ts` 打包生成，Node 无法直接 `import` workspace `.ts` |
| `apps/pixuli/api/gitee-proxy.entry.ts`                  | Vercel 打包源；逻辑 SSOT 仍为 `@pixuli/provider-gitee/proxy/server`                                                                    |
| `packages/plugin-provider-gitee/src/proxy/constants.js` | 单常量 `GITEE_PROXY_PATH`；Node / Vite SSR / Electron main 无法解析同目录无扩展名 `.ts` 相对导入，保留 `.js`                           |
| `archive/**`                                            | 已归档，非 workspace，不参与主构建                                                                                                     |

### 2.3 已删除的冗余

| 路径                                | 原因                                           |
| ----------------------------------- | ---------------------------------------------- |
| `apps/pixuli/vercel/gitee-proxy.js` | 仅 re-export `api/gitee-proxy`，无独立路由引用 |

---

## 三、原则

1. **一致性**：同一包、同一功能域内不得 TS 与 JS 各实现一份逻辑。
2. **类型单一来源**：禁止长期「`.js` 实现 + `.d.ts` 声明」双文件维护。
3. **导入约定**：
   - 包内相对导入默认**无扩展名**；经 `package.json` exports 被 Vite SSR /
     Node 直载的模块，子依赖宜用**包路径**（如
     `@pixuli/provider-gitee/proxy/constants`），避免 `./foo`
     在 monorepo 根外解析失败。
   - Gitee `constants.js` 为登记例外；消费方通过 `/proxy/constants` 入口引用。
   - **dev-only Vite 插件**（Gitee 代理等）须在 `configureServer` 内 **动态
     `import()`**，避免 `vite build` / Vercel 加载 `vite.config.ts`
     时 Node 原生 ESM 静态解析 workspace 子图。
4. **Vercel Serverless**：源码为
   `api/gitee-proxy.entry.ts`；`pnpm build:vercel-api` 用 esbuild 打成
   `api/gitee-proxy.js`（登记例外，**勿手改产物**）。运行时 Node 不能解析
   `package.json` exports 指向的 `.ts`，故不可在 `api/*.js` 内直接
   `import '@pixuli/provider-gitee/proxy/server'`。`build:web` 已串联
   `build:vercel-api`。
5. **工具链例外**：新增 `.js`/`.mjs`/`.cjs` 须在 PR 中说明并更新本文 §2.2。

---

## 四、与插件 Host 集成的关系

Gitee 代理相关文件归属（REF-411 前置）：

| 环境     | 文件                                              | 语言                     |
| -------- | ------------------------------------------------- | ------------------------ |
| Web dev  | `apps/pixuli/plugins/viteGiteeProxyPlugin.ts`     | TS                       |
| Web 生产 | `api/gitee-proxy.entry.ts` → `api/gitee-proxy.js` | esbuild 打包 provider TS |
| 共享逻辑 | `@pixuli/provider-gitee/proxy/server`             | TS                       |
| 常量     | `@pixuli/provider-gitee/proxy/constants`          | JS（登记例外）           |

---

## 五、后续（REF-413 可选）

- CI 增加脚本：扫描 `apps/`、`packages/` 下未登记的 `.js` 文件并失败。
- 评估 `tailwind.config.ts`、`postcss.config` ESM 化（非阻塞）。

---

## 相关文档

- [REFACTOR_PLAN.md §9.1](../../REFACTOR_PLAN.md)
- [03-plugin-system.md](./03-plugin-system.md)（Gitee 代理 REF-313）
