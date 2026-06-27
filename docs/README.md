# Pixuli 文档目录说明

> **最后核对**：2026-06-17 · 适用分支 `main`

本目录（`docs/`）集中存放项目文档。终端用户日常操作见
**[GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)**（源稿：
[01-product/02-product-user-manual.md](01-product/02-product-user-manual.md)）。

---

## 按角色阅读（推荐路径）

| 角色               | 路径                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **终端用户**       | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) ← 源稿 [产品使用手册](01-product/02-product-user-manual.md)                                                |
| **产品 / 测试**    | [PRS](01-product/01-product-requirements-specification.md) → [三端交互规范](01-product/04-three-platform-interaction-spec.md) → [04-backlog](04-backlog.md)         |
| **工程师**         | [01-system-design](02-system-design/01-system-design.md) → [06-apps-pixuli 工程](02-system-design/06-apps-pixuli-engineering.md) → 按需（插件 / 本地工作区 / 性能） |
| **插件作者**       | [03-plugin-system](02-system-design/03-plugin-system.md) §第二部分 · Skill：[storage-provider](../.cursor/skills/storage-provider/SKILL.md)                         |
| **协作者 / Issue** | [REFACTOR_PLAN.md](../REFACTOR_PLAN.md) · [AGENTS.md](../AGENTS.md)                                                                                                 |

**当前架构（一句话）**：`apps/pixuli`（Web + Desktop + Capacitor Android）·
`@pixuli/core` · `@pixuli/ui` · `@pixuli/provider-*` ·
`archive/`（RN、wasm、server 等，非 workspace）。

---

## 01-product（产物 · 4 篇）

| 文档                                                                                            | SSOT 职责                          |
| ----------------------------------------------------------------------------------------------- | ---------------------------------- |
| [01-product-requirements-specification.md](01-product/01-product-requirements-specification.md) | 产品底线、需求、验收（REF-401）    |
| [02-product-user-manual.md](01-product/02-product-user-manual.md)                               | 用户手册源稿 → Wiki（REF-408）     |
| [03-release-versioning.md](01-product/03-release-versioning.md)                                 | 版本与 tag 策略（REF-409）         |
| [04-three-platform-interaction-spec.md](01-product/04-three-platform-interaction-spec.md)       | 三端 IA、旅程、交互差异（REF-601） |

---

## 02-system-design（技术 · 6 篇）

**现行**技术文档；读架构请 **01 → 06**，再按需深入。命名：`序号-kebab-case.md`。

| 文档                                                                                      | 职责                                           |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [01-system-design.md](02-system-design/01-system-design.md)                               | 整体架构、模块、数据流                         |
| [02-performance.md](02-system-design/02-performance.md)                                   | 性能与虚拟化（REF-603 规划）                   |
| [03-plugin-system.md](02-system-design/03-plugin-system.md)                               | 存储插件契约、开发指南                         |
| [04-typescript-javascript-policy.md](02-system-design/04-typescript-javascript-policy.md) | TS/JS 策略（REF-410）                          |
| [05-local-workspace-sync.md](02-system-design/05-local-workspace-sync.md)                 | 本地工作区 + 同步（REF-607）                   |
| [06-apps-pixuli-engineering.md](02-system-design/06-apps-pixuli-engineering.md)           | **三端工程 SSOT**：目录、脚本、构建、Capacitor |

历史 REF 快照（9 篇）见 **[archive/design/](../archive/design/)**；索引
[archive/design/README.md](../archive/design/README.md)。

---

## 其他

| 路径                                                               | 说明                                |
| ------------------------------------------------------------------ | ----------------------------------- |
| [04-backlog.md](04-backlog.md)                                     | 已移除 / Won't Do / 延后（REF-402） |
| [03-business-design/01-readme.md](03-business-design/01-readme.md) | 业务设计暂缓                        |
| [archive/design/](../archive/design/)                              | 系统设计归档（9 篇 + 索引）         |

---

## 文档分工

| 层级                 | 写什么                       | 不写什么              |
| -------------------- | ---------------------------- | --------------------- |
| **01-product**       | 做什么、怎么验收、用户怎么用 | 实现细节、REF 进度表  |
| **02-system-design** | 怎么做、API/架构             | 重复 REF 已完成矩阵   |
| **REFACTOR_PLAN**    | 进行中 Issue、优先级         | 长篇设计正文          |
| **Wiki**             | 终端用户发布面               | 与 PRS 矛盾的过时能力 |

---

## AI 编程辅助（REF-414）

| 资产          | 路径                      |
| ------------- | ------------------------- |
| Agent 总览    | [AGENTS.md](../AGENTS.md) |
| Cursor Rules  | `.cursor/rules/`          |
| Cursor Skills | `.cursor/skills/`         |

架构边界变更时再更新 Agent/Skill；详见 [AGENTS.md](../AGENTS.md)。

---

## 修订

| 日期       | 变更                                                |
| ---------- | --------------------------------------------------- |
| 2026-06-17 | **P2**：`docs/archive` 迁入根目录 `archive/design/` |
| 2026-06-17 | **P0**：角色路径；归档索引；`00` 过时表述修正       |
| 2026-06-06 | REF-407：角色索引、架构摘要                         |
