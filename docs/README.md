# Pixuli 文档目录说明

> **最后核对**：2026-09-01 · 适用分支 `main`

本目录（`docs/`）集中存放项目文档。终端用户日常操作见
**[GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)**（源稿：
[01-product/02-product-user-manual.md](01-product/02-product-user-manual.md)）。

---

## 按角色阅读（推荐路径）

| 角色               | 路径                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **终端用户**       | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) ← 源稿 [产品使用手册](01-product/02-product-user-manual.md)                                                                                                                                |
| **产品 / 测试**    | [PRS](01-product/01-product-requirements-specification.md) → [三端交互](01-product/03-three-platform-interaction-spec.md) → [资源库 UI](01-product/04-asset-library-ui.md) → [品牌](01-product/05-brand-visual-ui.md) → [04-backlog](04-backlog.md) |
| **工程师**         | [01-system-design](02-system-design/01-system-design.md) → [app/README](../app/README.md) → 按需（插件 / 本地工作区 / 发版 / 性能）                                                                                                                 |
| **插件作者**       | [03-plugin-system](02-system-design/03-plugin-system.md) Skill：[storage-provider](../.cursor/skills/storage-provider/SKILL.md)                                                                                                                     |
| **协作者 / Issue** | [PLANS.md](../PLANS.md) · [2.0.md](../2.0.md) · [DECISIONS.md](../DECISIONS.md) · [AGENTS.md](../AGENTS.md)                                                                                                                                         |

**当前架构（一句话）**：`app`（Web + Desktop + Capacitor Android）·
`@pixuli/core` · `@pixuli/provider-*` · `app/src/ui`。

---

## 01-product（产物 · 5 篇）

| 文档                                                                                            | SSOT 职责                                            |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [01-product-requirements-specification.md](01-product/01-product-requirements-specification.md) | 产品底线、需求、验收                                 |
| [02-product-user-manual.md](01-product/02-product-user-manual.md)                               | 用户手册源稿 → Wiki                                  |
| [03-three-platform-interaction-spec.md](01-product/03-three-platform-interaction-spec.md)       | 三端壳层、断点、手势（REF-601）                      |
| [04-asset-library-ui.md](01-product/04-asset-library-ui.md)                                     | 资源库 UI：硬规则、精简 IA、同步、复制链接与外部访问 |
| [05-brand-visual-ui.md](01-product/05-brand-visual-ui.md)                                       | Logo 色板；empty / loading / 状态色                  |

发版制度：[05-release-versioning.md](02-system-design/05-release-versioning.md)。

---

## 02-system-design（技术 · 6 篇）

读架构：**01**，再按需打开插件 / 同步 / 性能 / 发版；三端脚本见
[app/README](../app/README.md)。

| 文档                                                                                        | SSOT 职责                              |
| ------------------------------------------------------------------------------------------- | -------------------------------------- |
| [01-system-design.md](02-system-design/01-system-design.md)                                 | 整体架构总览                           |
| [02-performance.md](02-system-design/02-performance.md)                                     | 列表/缩略性能边界（REF-603）           |
| [03-plugin-system.md](02-system-design/03-plugin-system.md)                                 | 存储插件契约与开发                     |
| [04-local-workspace-sync.md](02-system-design/04-local-workspace-sync.md)                   | 本地工作区 + 同步（现行摘要）          |
| [05-release-versioning.md](02-system-design/05-release-versioning.md)                       | SemVer / tag / 发版清单                |
| [06-sync-path-and-metadata-design.md](02-system-design/06-sync-path-and-metadata-design.md) | configRoot、metadata manifest、目录 UI |

产品 UI SSOT：壳层 [03](01-product/03-three-platform-interaction-spec.md)
· 资源库 [04](01-product/04-asset-library-ui.md) · 品牌
[05](01-product/05-brand-visual-ui.md)。

---

## 其他

| 路径                                                         | 说明                                |
| ------------------------------------------------------------ | ----------------------------------- |
| [04-backlog.md](04-backlog.md)                               | 已移除 / Won't Do / 延后（REF-402） |
| [03-business-design/README.md](03-business-design/README.md) | 业务设计目录说明（暂缓成文）        |

仓库根：[PLANS.md](../PLANS.md) · [2.0.md](../2.0.md) ·
[DECISIONS.md](../DECISIONS.md)。

---

## 文档分工

| 层级                 | 写什么                       | 不写什么               |
| -------------------- | ---------------------------- | ---------------------- |
| **01-product**       | 做什么、怎么验收、用户怎么用 | 实现细节、排期勾选看板 |
| **02-system-design** | 怎么做、API/架构、发版制度   | 重复 REF 已完成矩阵    |
| **PLANS.md**         | 与 GitHub 对齐的任务与进度   | 长篇设计正文           |
| **DECISIONS.md**     | 产品/架构为什么这样定        | Issue 进度表           |
| **Wiki**             | 终端用户发布面               | 与 PRS 矛盾的过时能力  |

---

## AI 编程辅助（REF-414）

| 资产          | 路径                      |
| ------------- | ------------------------- |
| Agent 总览    | [AGENTS.md](../AGENTS.md) |
| Cursor Rules  | `.cursor/rules/`          |
| Cursor Skills | `.cursor/skills/`         |

---

## 修订

| 日期       | 变更                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------- |
| 2026-08-31 | 新增 [06-sync-path-and-metadata-design](02-system-design/06-sync-path-and-metadata-design.md) |
| 2026-08-25 | `Plans`→`PLANS.md`；新增 `DECISIONS.md`；删 TS/JS 策略篇；`03-business-design/README.md`      |
| 2026-08-25 | 删除 `docs/archive`；`REFACTOR_PLAN`→`PLANS`；`2.0-release-feature-list`→`2.0.md`             |
| 2026-08-25 | **02-system-design 瘦身**：保留 7 篇                                                          |
| 2026-08-25 | **01-product 瘦身**：保留 5 篇                                                                |
| 2026-08-13 | 增补品牌 / 资源库 / UI 排期等（后经瘦身调整）                                                 |
| 2026-08-18 | 删除根目录 `archive/`；历史快照见 git tag `backup`                                            |
| 2026-06-17 | **P0**：角色路径；归档索引                                                                    |
| 2026-06-06 | REF-407：角色索引、架构摘要                                                                   |
