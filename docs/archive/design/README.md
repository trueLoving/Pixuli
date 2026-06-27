# 系统设计文档归档（REF 交付快照）

> **归档日期**：2026-06-17 ·
> **维护策略**：只读；Issue 关闭后的盘点/PoC/矩阵/历史选型迁入此处，**勿按本文验收现产品**。  
> 正文位于本目录；`docs/02-system-design/`
> 仅保留 6 篇活跃文档。

---

## 归档清单

| 文档                                                                                   | REF / Issue        | 归档原因                                     | 当前请读                                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [01-three-platform-capability-sharing.md](./01-three-platform-capability-sharing.md)   | M2/M3 共享层       | RN/`./native` 设计过时；Capacitor 已落地     | [06-apps-pixuli-engineering.md](../../02-system-design/06-apps-pixuli-engineering.md) · [01-system-design](../../02-system-design/01-system-design.md)   |
| [02-three-platform-design.md](./02-three-platform-design.md)                           | REF-509 选型背景   | Capacitor 方案 A 已交付；§二 RN 为历史       | [06-apps-pixuli-engineering.md](../../02-system-design/06-apps-pixuli-engineering.md)                                                                    |
| [03-plugin-host-integration.md](./03-plugin-host-integration.md)                       | REF-411（旧 Host） | Gitee Host 已移除；REF-411 → Obsidian 重设计 | [REFACTOR_PLAN §1.6](../../../REFACTOR_PLAN.md#16-ref-411--插件体系重设计obsidian-参考) · [03-plugin-system](../../02-system-design/03-plugin-system.md) |
| [04-capacitor-android-poc.md](./04-capacitor-android-poc.md)                           | REF-509 #118       | PoC ✅                                       | [06-apps-pixuli-engineering.md](../../02-system-design/06-apps-pixuli-engineering.md)                                                                    |
| [05-cross-platform-sharing-matrix.md](./05-cross-platform-sharing-matrix.md)           | REF-506 #116       | 代码级矩阵快照（2026-05-27）                 | [06-apps-pixuli-engineering.md](../../02-system-design/06-apps-pixuli-engineering.md)                                                                    |
| [06-mobile-feature-parity-matrix.md](./06-mobile-feature-parity-matrix.md)             | REF-516 P0 #164    | 旅程对齐矩阵 ✅                              | [04-three-platform-interaction-spec.md](../../01-product/04-three-platform-interaction-spec.md)                                                          |
| [07-ui-native-migration-assessment.md](./07-ui-native-migration-assessment.md)         | REF-508 #119       | RN UI 迁入评估 ✅                            | [06-apps-pixuli-engineering.md](../../02-system-design/06-apps-pixuli-engineering.md)                                                                    |
| [08-capacitor-native-plugins.md](./08-capacitor-native-plugins.md)                     | REF-510 #120       | L3 插件选型 ✅                               | [06-apps-pixuli-engineering.md](../../02-system-design/06-apps-pixuli-engineering.md)                                                                    |
| [09-capacitor-android-smoke-acceptance.md](./09-capacitor-android-smoke-acceptance.md) | REF-516 P6 #166    | 真机冒烟签收 ✅                              | [06-apps-pixuli-engineering.md](../../02-system-design/06-apps-pixuli-engineering.md)                                                                    |

---

## 活跃技术文档（`docs/02-system-design/`）

| 文档                                                                                            | 职责              |
| ----------------------------------------------------------------------------------------------- | ----------------- |
| [01-system-design.md](../../02-system-design/01-system-design.md)                               | 架构总览          |
| [02-performance.md](../../02-system-design/02-performance.md)                                   | 性能与虚拟化      |
| [03-plugin-system.md](../../02-system-design/03-plugin-system.md)                               | 存储插件          |
| [04-typescript-javascript-policy.md](../../02-system-design/04-typescript-javascript-policy.md) | TS/JS 策略        |
| [05-local-workspace-sync.md](../../02-system-design/05-local-workspace-sync.md)                 | 本地工作区        |
| [06-apps-pixuli-engineering.md](../../02-system-design/06-apps-pixuli-engineering.md)           | **三端工程 SSOT** |

其余编号（`01`～`09` 归档）仅存在于本目录。

---

## 与活跃文档的关系

- **产品交互 SSOT**：[04-three-platform-interaction-spec.md](../../01-product/04-three-platform-interaction-spec.md)
- **进行中 Issue**：[REFACTOR_PLAN.md](../../../REFACTOR_PLAN.md)
