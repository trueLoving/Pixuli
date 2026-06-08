# Pixuli 文档目录说明

> **最后核对**：2026-05-27 · 适用分支 `main` · 维护 Issue
> [REF-407](https://github.com/trueLoving/Pixuli/issues/111)

本目录（`docs/`）集中存放项目文档，按职责分为子目录。终端用户日常操作见
**[GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)**（源稿：
[01-product/02-Product-User-Manual.md](01-product/02-Product-User-Manual.md)（含附录 Wiki 同步说明））。

---

## 按角色阅读

| 角色                | 建议路径                                                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **终端用户**        | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) ← 源稿 [产品使用手册](01-product/02-Product-User-Manual.md)                                                                                                                                                   |
| **产品 / 测试**     | [产品需求规格说明书](01-product/01-Product-Requirements-Specification.md) → [backlog](backlog.md)（已移除项）                                                                                                                                                          |
| **前端 / 多端开发** | [00-System-Design](02-system-design/00-System-Design.md) → [三端能力共享](02-system-design/01-Three-Platform-Capability-Sharing.md) → [三端设计](02-system-design/02-Three-Platform-Design.md) → [业务：仓库源](03-business-design/01-repository-source-management.md) |
| **插件作者**        | [04-Plugin-System](02-system-design/04-Plugin-System.md)（§第二部分 开发指南）                                                                                                                                                                                         |
| **协作者 / Issue**  | 仓库根 [REFACTOR_PLAN.md](../REFACTOR_PLAN.md)                                                                                                                                                                                                                         |

---

## 目录结构

| 目录                   | 定位 | 说明                                                   |
| ---------------------- | ---- | ------------------------------------------------------ |
| **01-product**         | 产物 | PRD、使用教程、裁剪清单；描述「做什么」与「怎么用」。  |
| **（根目录）**         | 产物 | [backlog.md](backlog.md)：已移除/延后需求（REF-402）。 |
| **02-system-design**   | 技术 | 架构、跨端、插件、性能等；描述「怎么实现」。           |
| **03-business-design** | 业务 | 业务流程与规则；描述「业务怎么运转」。                 |

**当前架构（摘要）**：`apps/pixuli`（Web+Desktop）· `apps/mobile` ·
`@pixuli/core` · `@pixuli/ui` · `@pixuli/provider-*` ·
`archive/`（wasm/server/benchmark，非 workspace）。

---

## 01-product（产物）

| 文档                                                                                            | 关注内容                                                                                 |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [01-Product-Requirements-Specification.md](01-product/01-Product-Requirements-Specification.md) | **基线产品需求规格说明书**：底线、裁剪、功能/非功能需求、路线图（REF-401 合并）。        |
| [02-Product-User-Manual.md](01-product/02-Product-User-Manual.md)                               | **产品使用手册（Wiki 源稿）**：配置源、上传、三端、FAQ；附录 Wiki 同步（REF-408 合并）。 |

---

## 02-system-design（技术）

| 文档                                                                                                | 关注内容                                                                  |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [00-System-Design.md](02-system-design/00-System-Design.md)                                         | 整体架构、模块职责、数据流（REF-407 已对齐 M3 后结构）。                  |
| [01-Three-Platform-Capability-Sharing.md](02-system-design/01-Three-Platform-Capability-Sharing.md) | 三端能力共享：资源共享、`@pixuli/core`/`@pixuli/ui`、图片处理契约、日志。 |
| [02-Three-Platform-Design.md](02-system-design/02-Three-Platform-Design.md)                         | 三端设计方案：最大化代码复用（Capacitor 方案 A 等）。                     |
| [03-Performance.md](02-system-design/03-Performance.md)                                             | 列表虚拟化、懒加载、性能监控。                                            |
| [04-Plugin-System.md](02-system-design/04-Plugin-System.md)                                         | Pixuli 插件体系：存储架构、开发指南、M3 回归清单（REF-301～311）。        |

---

## 03-business-design（业务）

| 文档                                                                                        | 关注内容                                                   |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [01-repository-source-management.md](03-business-design/01-repository-source-management.md) | 多源配置、切换、导入导出。                                 |
| [02-image-crud.md](03-business-design/02-image-crud.md)                                     | 上传、列表、预览、元数据、删除。                           |
| [03-browse-mode.md](03-business-design/03-browse-mode.md)                                   | **已归档**：幻灯片/时间线多模式（M1 已移除）；仅历史参考。 |

---

## 文档间关系

- **01-product** 定需求与验收；**02-system-design**
  定技术；**03-business-design** 定业务流程。
- **[backlog.md](backlog.md)**
  承接已移除、不做与延后项；勿按归档文档验收现产品。
- 遇 `packages/common`、幻灯片、官方 Server 主路径等表述，以 PRD +
  backlog 为准；系统设计文中若未标注「历史」则可能仍在迁移 REF-407 中。

---

## 修订

| 日期       | 变更                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| 2026-06-06 | 01-product 合并为 `01-Product-Requirements-Specification` + `02-Product-User-Manual` |
| 2026-06-06 | REF-407：角色索引、架构摘要、browse-mode 归档标注                                    |
| 2026-05-27 | REF-401/402：PRD v2.0、backlog 索引                                                  |
