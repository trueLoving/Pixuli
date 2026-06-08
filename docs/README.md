# Pixuli 文档目录说明

> **最后核对**：2026-06-06 · 适用分支 `main` · 维护 Issue
> [REF-407](https://github.com/trueLoving/Pixuli/issues/111)

本目录（`docs/`）集中存放项目文档，按职责分为子目录。终端用户日常操作见
**[GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)**（源稿：
[01-product/02-Pixuli-Usage-Tutorial.md](01-product/02-Pixuli-Usage-Tutorial.md)，同步说明见
[04-Wiki-Sync-Guide.md](01-product/04-Wiki-Sync-Guide.md)）。

---

## 按角色阅读

| 角色                | 建议路径                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **终端用户**        | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) ← 源稿 [使用教程](01-product/02-Pixuli-Usage-Tutorial.md)                                                                          |
| **产品 / 测试**     | [PRD](01-product/01-Product-Requirements-Document.md) → [范围与裁剪](01-product/03-Product-Scope-And-Cut-List.md) → [backlog](backlog.md)（已移除项）                                       |
| **前端 / 多端开发** | [00-System-Design](02-system-design/00-System-Design.md) → [存储插件](02-system-design/07-storage-plugin-system.md) → [业务：仓库源](03-business-design/01-repository-source-management.md) |
| **插件作者**        | [08-storage-plugin-authoring](02-system-design/08-storage-plugin-authoring.md)                                                                                                              |
| **协作者 / Issue**  | 仓库根 [REFACTOR_PLAN.md](../REFACTOR_PLAN.md)                                                                                                                                              |

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

| 文档                                                                                  | 关注内容                                                                |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [01-Product-Requirements-Document.md](01-product/01-Product-Requirements-Document.md) | PRD v2.0：三端底线、图床网格/列表、存储插件、无官方 Server（REF-401）。 |
| [02-Pixuli-Usage-Tutorial.md](01-product/02-Pixuli-Usage-Tutorial.md)                 | **用户使用教程（Wiki 源稿）**：配置源、上传、三端差异、FAQ（REF-408）。 |
| [03-Product-Scope-And-Cut-List.md](01-product/03-Product-Scope-And-Cut-List.md)       | M1 裁剪、非官方范围、包结构（REF-401）。                                |
| [04-Wiki-Sync-Guide.md](01-product/04-Wiki-Sync-Guide.md)                             | Wiki 目录规划、与源稿同步策略（REF-408）。                              |

---

## 02-system-design（技术）

| 文档                                                                                                                      | 关注内容                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [00-System-Design.md](02-system-design/00-System-Design.md)                                                               | 整体架构、模块职责、数据流（REF-407 已对齐 M3 后结构）。 |
| [01-cross-platform-resources.md](02-system-design/01-cross-platform-resources.md)                                         | 跨端共享：`@pixuli/core` / `@pixuli/ui` 分层与导出策略。 |
| [02-cross-image-process.md](02-system-design/02-cross-image-process.md)                                                   | 图片处理契约与各端实现（Web：Canvas；Mobile：原生）。    |
| [03-performance.md](02-system-design/03-performance.md)                                                                   | 列表虚拟化、懒加载、性能监控。                           |
| [04-cross-platform-logging.md](02-system-design/04-cross-platform-logging.md)                                             | 跨端日志与 DevTools。                                    |
| [05-Dify-Integration-And-Image-Processing-Design.md](02-system-design/05-Dify-Integration-And-Image-Processing-Design.md) | Dify 与图片处理选型。                                    |
| [06-unified-app-mobile-integration.md](02-system-design/06-unified-app-mobile-integration.md)                             | Mobile 与 pixuli 统一（Capacitor 路线）。                |
| [07-storage-plugin-system.md](02-system-design/07-storage-plugin-system.md)                                               | M3 存储插件体系（REF-301～311）。                        |
| [08-storage-plugin-authoring.md](02-system-design/08-storage-plugin-authoring.md)                                         | 第三方 Provider 开发指南（REF-308）。                    |
| [10-m3-storage-regression-checklist.md](02-system-design/10-m3-storage-regression-checklist.md)                           | M3 存储回归清单（REF-310）。                             |

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

| 日期       | 变更                                                             |
| ---------- | ---------------------------------------------------------------- |
| 2026-06-06 | REF-407：角色索引、架构摘要、browse-mode 归档标注、Wiki 源稿链接 |
| 2026-05-27 | REF-401/402：PRD v2.0、backlog 索引                              |
