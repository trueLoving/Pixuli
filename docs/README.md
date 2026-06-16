# Pixuli 文档目录说明

> **最后核对**：2026-05-27 · 适用分支 `main` · 维护 Issue
> [REF-407](https://github.com/trueLoving/Pixuli/issues/111)

本目录（`docs/`）集中存放项目文档，按职责分为子目录。终端用户日常操作见
**[GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)**（源稿：
[01-product/02-Product-User-Manual.md](01-product/02-Product-User-Manual.md)（含附录 Wiki 同步说明））。

---

## 按角色阅读

| 角色                | 建议路径                                                                                                                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **终端用户**        | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) ← 源稿 [产品使用手册](01-product/02-Product-User-Manual.md)                                                                                                                                      |
| **产品 / 测试**     | [产品需求规格说明书](01-product/01-Product-Requirements-Specification.md) → [backlog](backlog.md)（已移除项）                                                                                                                                             |
| **前端 / 多端开发** | [00-System-Design](02-system-design/00-System-Design.md) → [三端能力共享](02-system-design/01-Three-Platform-Capability-Sharing.md) → [三端设计](02-system-design/02-Three-Platform-Design.md) → [04-Plugin-System](02-system-design/04-Plugin-System.md) |
| **插件作者**        | [04-Plugin-System](02-system-design/04-Plugin-System.md)（§第二部分 开发指南）                                                                                                                                                                            |
| **协作者 / Issue**  | [REFACTOR_PLAN.md](../REFACTOR_PLAN.md) · AI 辅助 [AGENTS.md](../AGENTS.md)（REF-414）                                                                                                                                                                    |

---

## 目录结构

| 目录                   | 定位 | 说明                                                   |
| ---------------------- | ---- | ------------------------------------------------------ |
| **01-product**         | 产物 | PRD、使用教程、裁剪清单；描述「做什么」与「怎么用」。  |
| **（根目录）**         | 产物 | [backlog.md](backlog.md)：已移除/延后需求（REF-402）。 |
| **02-system-design**   | 技术 | 架构、跨端、插件、性能等；描述「怎么实现」。           |
| **03-business-design** | 业务 | 业务场景与规则（**暂缓编写**，见目录 README）。        |

**当前架构（摘要）**：`apps/pixuli`（Web+Desktop）· `apps/mobile` ·
`@pixuli/core` · `@pixuli/ui` · `@pixuli/provider-*` ·
`archive/`（wasm/server/benchmark，非 workspace）。

---

## 01-product（产物）

| 文档                                                                                            | 关注内容                                                                                      |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [01-Product-Requirements-Specification.md](01-product/01-Product-Requirements-Specification.md) | **基线产品需求规格说明书**：底线、裁剪、功能/非功能需求、路线图（REF-401 合并）。             |
| [02-Product-User-Manual.md](01-product/02-Product-User-Manual.md)                               | **产品使用手册（Wiki 源稿）**：配置源、上传、三端、FAQ；附录 Wiki 同步（REF-408 合并）。      |
| [03-Release-Versioning.md](01-product/03-Release-Versioning.md)                                 | **版本发布策略**（REF-409）：基线 **2.0.0**、三端统一 semver、`v*-{desktop,mobile,web}` tag。 |
| [04-three-platform-interaction-spec.md](01-product/04-three-platform-interaction-spec.md)       | **三端交互规范**（REF-601）：IA、旅程、差异矩阵、断点与验收路径（#130）。                     |

---

## 02-system-design（技术）

| 文档                                                                                                | 关注内容                                                                             |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [00-System-Design.md](02-system-design/00-System-Design.md)                                         | 整体架构、模块职责、数据流（REF-407 已对齐 M3 后结构）。                             |
| [01-Three-Platform-Capability-Sharing.md](02-system-design/01-Three-Platform-Capability-Sharing.md) | 三端能力共享：资源共享、`@pixuli/core`/`@pixuli/ui`、图片处理契约、日志。            |
| [02-Three-Platform-Design.md](02-system-design/02-Three-Platform-Design.md)                         | 三端设计方案：最大化代码复用（Capacitor 方案 A 等）。                                |
| [03-Performance.md](02-system-design/03-Performance.md)                                             | 列表虚拟化、懒加载、性能监控。                                                       |
| [04-Plugin-System.md](02-system-design/04-Plugin-System.md)                                         | Pixuli 插件体系：存储架构、开发指南、M3 回归清单（REF-301～311）。                   |
| [05-TypeScript-JavaScript-Policy.md](02-system-design/05-TypeScript-JavaScript-Policy.md)           | TS/JS 统一策略与例外登记（REF-410）。                                                |
| [06-Plugin-Host-Integration.md](02-system-design/06-Plugin-Host-Integration.md)                     | 插件 Host 集成：manifest、`registerHostIntegrations`（REF-411）。                    |
| [07-capacitor-android-poc.md](02-system-design/07-capacitor-android-poc.md)                         | Capacitor Android PoC：dev/prod 构建与冒烟清单（REF-509 #118）。                     |
| [09-cross-platform-sharing-matrix.md](02-system-design/09-cross-platform-sharing-matrix.md)         | 三端代码共享矩阵：pixuli vs mobile 现状（REF-506）。                                 |
| [11-mobile-feature-parity-matrix.md](02-system-design/11-mobile-feature-parity-matrix.md)           | **Mobile 功能对齐矩阵**：用户旅程、Capacitor 决策、#165 输入（REF-516 P0 / #164）。  |
| [10-local-workspace-sync.md](02-system-design/10-local-workspace-sync.md)                           | 本地工作区 + 远端同步：`LocalVault` / `SyncEngine` / Provider 扩展（REF-607 #144）。 |

---

## 03-business-design（业务）

| 文档                                      | 关注内容                                          |
| ----------------------------------------- | ------------------------------------------------- |
| [README.md](03-business-design/README.md) | 业务设计目录说明；原草稿已移除，将依据 PRS 重写。 |

---

## 文档间关系

- **01-product** 定需求与验收；**02-system-design**
  定技术；**03-business-design** 定业务流程（暂缓，见该目录 README）。
- **[backlog.md](backlog.md)**
  承接已移除、不做与延后项；勿按归档文档验收现产品。
- 遇 `packages/common`、幻灯片、官方 Server 主路径等表述，以 PRD +
  backlog 为准；系统设计文中若未标注「历史」则可能仍在迁移 REF-407 中。

---

## AI 编程辅助（REF-414）

面向 **Cursor / Copilot 等 AI 助手**与协作者，与用户向 `docs/`、Wiki
**职责分离**：

| 资产          | 路径                        | 何时更新                                              |
| ------------- | --------------------------- | ----------------------------------------------------- |
| Agent 总览    | [AGENTS.md](../AGENTS.md)   | 三端底线、包结构、PR 流程、Skill 清单                 |
| Cursor Rules  | `.cursor/rules/*.mdc`       | monorepo / storage-plugin / electron-desktop 边界变更 |
| Cursor Skills | `.cursor/skills/*/SKILL.md` | 新增 provider、Host 集成模式、REF 工作流变化          |

**不必**随每个功能 PR 改 Agent 文件；架构里程碑（M1～M4 合并）或插件 Host 契约变更时再同步。详见
[AGENTS.md §何时更新](../AGENTS.md#何时更新-agentskill)。

---

## 修订

| 日期       | 变更                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| 2026-06-06 | 01-product 合并为 `01-Product-Requirements-Specification` + `02-Product-User-Manual` |
| 2026-05-27 | 03-business-design 移除早期草稿，暂缓依 PRS 重写                                     |
| 2026-06-06 | REF-407：角色索引、架构摘要                                                          |
| 2026-05-27 | REF-401/402：PRD v2.0、backlog 索引                                                  |
| 2026-05-27 | REF-409：`03-Release-Versioning.md` 版本发布策略与历史盘点                           |
| 2026-05-27 | REF-414：`AGENTS.md`、`.cursor/rules/`、`.cursor/skills/` AI 编程辅助资产            |
