# Pixuli 文档目录说明

> **最后核对**：2026-06-17 · 适用分支 `main`

本目录（`docs/`）集中存放项目文档。终端用户日常操作见
**[GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)**（源稿：
[01-product/02-Product-User-Manual.md](01-product/02-Product-User-Manual.md)）。

---

## 按角色阅读（推荐路径）

| 角色               | 路径                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **终端用户**       | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) ← 源稿 [产品使用手册](01-product/02-Product-User-Manual.md)                                                        |
| **产品 / 测试**    | [PRS](01-product/01-Product-Requirements-Specification.md) → [三端交互规范](01-product/04-three-platform-interaction-spec.md) → [backlog](backlog.md)                       |
| **工程师**         | [00-System-Design](02-system-design/00-System-Design.md) → [15-apps-pixuli 工程](02-system-design/15-apps-pixuli-engineering.md) → 按需打开专题（插件 / 本地工作区 / 性能） |
| **插件作者**       | [04-Plugin-System](02-system-design/04-Plugin-System.md) §第二部分 · Skill：[storage-provider](../.cursor/skills/storage-provider/SKILL.md)                                 |
| **协作者 / Issue** | [REFACTOR_PLAN.md](../REFACTOR_PLAN.md) · [AGENTS.md](../AGENTS.md)                                                                                                         |

**当前架构（一句话）**：`apps/pixuli`（Web + Desktop + Capacitor Android）·
`@pixuli/core` · `@pixuli/ui` · `@pixuli/provider-*` ·
`archive/`（RN、wasm、server 等，非 workspace）。

---

## 01-product（产物 · 4 篇）

| 文档                                                                                            | SSOT 职责                          |
| ----------------------------------------------------------------------------------------------- | ---------------------------------- |
| [01-Product-Requirements-Specification.md](01-product/01-Product-Requirements-Specification.md) | 产品底线、需求、验收（REF-401）    |
| [02-Product-User-Manual.md](01-product/02-Product-User-Manual.md)                               | 用户手册源稿 → Wiki（REF-408）     |
| [03-Release-Versioning.md](01-product/03-Release-Versioning.md)                                 | 版本与 tag 策略（REF-409）         |
| [04-three-platform-interaction-spec.md](01-product/04-three-platform-interaction-spec.md)       | 三端 IA、旅程、交互差异（REF-601） |

---

## 02-system-design（技术 · 活跃文档）

以下为主目录**现行**技术文档；读架构请从 **00 → 15**，再按需深入。

| 文档                                                                                                | 职责                                                 |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [00-System-Design.md](02-system-design/00-System-Design.md)                                         | 整体架构、模块、数据流                               |
| [01-Three-Platform-Capability-Sharing.md](02-system-design/01-Three-Platform-Capability-Sharing.md) | 跨端资源共享与图片处理契约（文内部分 M2 段落为历史） |
| [02-Three-Platform-Design.md](02-system-design/02-Three-Platform-Design.md)                         | Capacitor 路线与三端复用（§二 RN 为历史背景）        |
| [03-Performance.md](02-system-design/03-Performance.md)                                             | 性能与虚拟化（REF-603 规划）                         |
| [04-Plugin-System.md](02-system-design/04-Plugin-System.md)                                         | 存储插件契约、开发指南、M3 回归                      |
| [05-TypeScript-JavaScript-Policy.md](02-system-design/05-TypeScript-JavaScript-Policy.md)           | TS/JS 策略（REF-410）                                |
| [10-local-workspace-sync.md](02-system-design/10-local-workspace-sync.md)                           | 本地工作区 + 同步（REF-607）                         |
| [15-apps-pixuli-engineering.md](02-system-design/15-apps-pixuli-engineering.md)                     | **三端工程 SSOT**：目录、脚本、构建、Capacitor       |

### 已归档快照（勿作现产品验收）

REF 已交付的 PoC / 矩阵 / Host 集成等仍保留原路径（便于 Issue 互链），文首已标
**📦 已归档**。索引见 **[archive/design/README.md](archive/design/README.md)**：

`06` Host 集成 · `07` Capacitor PoC · `09` 代码共享矩阵 · `11` Mobile 对齐矩阵 ·
`12` RN UI 评估 · `13` 原生插件 · `14` 真机冒烟

---

## 其他

| 路径                                       | 说明                                |
| ------------------------------------------ | ----------------------------------- |
| [backlog.md](backlog.md)                   | 已移除 / Won't Do / 延后（REF-402） |
| [03-business-design/](03-business-design/) | 业务设计暂缓，见该目录 README       |
| [archive/design/](archive/design/)         | 系统设计归档索引                    |

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

| 日期       | 变更                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 2026-06-17 | **P0 文档整理**：精简角色路径；`06`～`14` 标归档；新增 [archive/design/](archive/design/) 索引 |
| 2026-06-06 | REF-407：角色索引、架构摘要                                                                    |
| 2026-06-06 | 01-product 合并 PRS + 用户手册                                                                 |
| 2026-05-27 | REF-401/402/409/414 等初版索引                                                                 |
