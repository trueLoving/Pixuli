# 系统设计文档归档（REF 交付快照）

> **归档日期**：2026-06-17 ·
> **维护策略**：只读；Issue 关闭后的盘点/PoC/矩阵迁入此处索引，**勿按本文验收现产品**。

本目录索引仍位于 `docs/02-system-design/`
下的历史文稿（未物理搬迁，避免破坏 Issue/PR 链接）。文首已加 **📦 已归档**
标记。

---

## 归档清单

| 文档                                                                                                        | REF / Issue             | 归档原因                                                | 当前请读                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [06-Plugin-Host-Integration.md](../../02-system-design/06-Plugin-Host-Integration.md)                       | REF-411（旧 Host 集成） | Gitee Host 已移除；REF-411 已改为 Obsidian 式插件重设计 | [REFACTOR_PLAN §1.6](../../../REFACTOR_PLAN.md#16-ref-411--插件体系重设计obsidian-参考) · [04-Plugin-System](../../02-system-design/04-Plugin-System.md) |
| [07-capacitor-android-poc.md](../../02-system-design/07-capacitor-android-poc.md)                           | REF-509 #118            | PoC ✅；工程约定已收敛                                  | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |
| [09-cross-platform-sharing-matrix.md](../../02-system-design/09-cross-platform-sharing-matrix.md)           | REF-506 #116            | 代码级矩阵快照（2026-05-27）                            | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md) · [00-System-Design](../../02-system-design/00-System-Design.md)   |
| [11-mobile-feature-parity-matrix.md](../../02-system-design/11-mobile-feature-parity-matrix.md)             | REF-516 P0 #164         | 旅程对齐矩阵 ✅                                         | [04-three-platform-interaction-spec.md](../../01-product/04-three-platform-interaction-spec.md)                                                          |
| [12-ui-native-migration-assessment.md](../../02-system-design/12-ui-native-migration-assessment.md)         | REF-508 #119            | RN UI 迁入评估 ✅；RN 已归档                            | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |
| [13-capacitor-native-plugins.md](../../02-system-design/13-capacitor-native-plugins.md)                     | REF-510 #120            | L3 插件选型 ✅                                          | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |
| [14-capacitor-android-smoke-acceptance.md](../../02-system-design/14-capacitor-android-smoke-acceptance.md) | REF-516 P6 #166         | 真机冒烟签收 ✅                                         | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |

---

## 与活跃文档的关系

- **产品交互 SSOT**：[04-three-platform-interaction-spec.md](../../01-product/04-three-platform-interaction-spec.md)
- **工程与三端基线 SSOT**：[15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)
- **架构总览**：[00-System-Design.md](../../02-system-design/00-System-Design.md)
- **进行中 Issue**：[REFACTOR_PLAN.md](../../../REFACTOR_PLAN.md)

P1 可选：将上表文件物理迁入 `docs/archive/design/` 并留 stub 重定向。
