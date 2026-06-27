# 系统设计文档归档（REF 交付快照）

> **归档日期**：2026-06-17 ·
> **维护策略**：只读；Issue 关闭后的盘点/PoC/矩阵/历史选型迁入此处，**勿按本文验收现产品**。  
> 原
> `docs/02-system-design/` 路径保留 **stub 重定向**（兼容 Issue/PR 链接）。

---

## 归档清单

| 文档                                                                                   | REF / Issue        | 归档原因                                     | 当前请读                                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [01-Three-Platform-Capability-Sharing.md](./01-Three-Platform-Capability-Sharing.md)   | M2/M3 共享层       | RN/`./native` 设计过时；Capacitor 已落地     | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md) · [00-System-Design](../../02-system-design/00-System-Design.md)   |
| [02-Three-Platform-Design.md](./02-Three-Platform-Design.md)                           | REF-509 选型背景   | Capacitor 方案 A 已交付；§二 RN 为历史       | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |
| [06-Plugin-Host-Integration.md](./06-Plugin-Host-Integration.md)                       | REF-411（旧 Host） | Gitee Host 已移除；REF-411 → Obsidian 重设计 | [REFACTOR_PLAN §1.6](../../../REFACTOR_PLAN.md#16-ref-411--插件体系重设计obsidian-参考) · [04-Plugin-System](../../02-system-design/04-Plugin-System.md) |
| [07-capacitor-android-poc.md](./07-capacitor-android-poc.md)                           | REF-509 #118       | PoC ✅                                       | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |
| [09-cross-platform-sharing-matrix.md](./09-cross-platform-sharing-matrix.md)           | REF-506 #116       | 代码级矩阵快照（2026-05-27）                 | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |
| [11-mobile-feature-parity-matrix.md](./11-mobile-feature-parity-matrix.md)             | REF-516 P0 #164    | 旅程对齐矩阵 ✅                              | [04-three-platform-interaction-spec.md](../../01-product/04-three-platform-interaction-spec.md)                                                          |
| [12-ui-native-migration-assessment.md](./12-ui-native-migration-assessment.md)         | REF-508 #119       | RN UI 迁入评估 ✅                            | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |
| [13-capacitor-native-plugins.md](./13-capacitor-native-plugins.md)                     | REF-510 #120       | L3 插件选型 ✅                               | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |
| [14-capacitor-android-smoke-acceptance.md](./14-capacitor-android-smoke-acceptance.md) | REF-516 P6 #166    | 真机冒烟签收 ✅                              | [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)                                                                    |

---

## 活跃技术文档（`docs/02-system-design/`）

| 文档                                                                                            | 职责              |
| ----------------------------------------------------------------------------------------------- | ----------------- |
| [00-System-Design.md](../../02-system-design/00-System-Design.md)                               | 架构总览          |
| [03-Performance.md](../../02-system-design/03-Performance.md)                                   | 性能与虚拟化      |
| [04-Plugin-System.md](../../02-system-design/04-Plugin-System.md)                               | 存储插件          |
| [05-TypeScript-JavaScript-Policy.md](../../02-system-design/05-TypeScript-JavaScript-Policy.md) | TS/JS 策略        |
| [10-local-workspace-sync.md](../../02-system-design/10-local-workspace-sync.md)                 | 本地工作区        |
| [15-apps-pixuli-engineering.md](../../02-system-design/15-apps-pixuli-engineering.md)           | **三端工程 SSOT** |

其余编号（`01`/`02`/`06`～`14`）为 **stub**，指向本目录正文。

---

## 与活跃文档的关系

- **产品交互 SSOT**：[04-three-platform-interaction-spec.md](../../01-product/04-three-platform-interaction-spec.md)
- **进行中 Issue**：[REFACTOR_PLAN.md](../../../REFACTOR_PLAN.md)
