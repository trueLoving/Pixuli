# 分阶段总线已完成阶段

> 自 [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) 归档 · 2026-06-17

## REF-516 — 三端融合（[里程碑 #8](https://github.com/trueLoving/Pixuli/milestone/8)）

父 Issue：[#163](https://github.com/trueLoving/Pixuli/issues/163)

| 阶段 | 标题                                  | GitHub #                                                                                                                                                                  | 状态    |
| ---- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| P0   | RN ↔ pixuli 功能对齐矩阵             | [#164](https://github.com/trueLoving/Pixuli/issues/164)                                                                                                                   | ✅      |
| P1   | ~~store 抽取（REF-507）~~ **❌ 取消** | [#117](https://github.com/trueLoving/Pixuli/issues/117)                                                                                                                   | ❌      |
| P2   | 移动端 Web UI（REF-512）              | [#150](https://github.com/trueLoving/Pixuli/issues/150)                                                                                                                   | ✅      |
| P3   | 业务能力补齐（Capacitor）             | [#165](https://github.com/trueLoving/Pixuli/issues/165)                                                                                                                   | ✅      |
| P4   | L3：REF-508 / REF-510 / REF-511       | [#119](https://github.com/trueLoving/Pixuli/issues/119)、[#120](https://github.com/trueLoving/Pixuli/issues/120)、[#141](https://github.com/trueLoving/Pixuli/issues/141) | ✅      |
| P5   | 本地工作区 Mobile（REF-607 P6）       | [#161](https://github.com/trueLoving/Pixuli/issues/161)                                                                                                                   | ✅      |
| P6   | 对齐验收与 RN 归档                    | [#166](https://github.com/trueLoving/Pixuli/issues/166)                                                                                                                   | ✅      |
| P7   | 工程整理 + CI APK                     | [#152](https://github.com/trueLoving/Pixuli/issues/152) ✅、[#153](https://github.com/trueLoving/Pixuli/issues/153)                                                       | ⏳ #153 |

## REF-607 — 本地工作区（[里程碑 #7](https://github.com/trueLoving/Pixuli/milestone/7)）

父 Issue：[#144](https://github.com/trueLoving/Pixuli/issues/144)
· 设计 SSOT：[05-local-workspace-sync.md §九](../../docs/02-system-design/05-local-workspace-sync.md#九分阶段交付)

| 阶段 | 标题                                                  | GitHub #                                                | 状态 |
| ---- | ----------------------------------------------------- | ------------------------------------------------------- | ---- |
| P0   | 技术设计：LocalVault + SyncEngine + Provider 扩展     | [#155](https://github.com/trueLoving/Pixuli/issues/155) | ✅   |
| P1   | Core 契约：`@pixuli/core/vault` 类型与单测            | [#156](https://github.com/trueLoving/Pixuli/issues/156) | ✅   |
| P2   | Desktop PoC：选目录、本地列表、手动 push              | [#157](https://github.com/trueLoving/Pixuli/issues/157) | ✅   |
| P3   | 索引与 pull：`index.json`、`scan()`、SyncEngine MVP   | [#158](https://github.com/trueLoving/Pixuli/issues/158) | ✅   |
| P4   | 应用切换：`imageStore` local 模式与迁移向导           | [#159](https://github.com/trueLoving/Pixuli/issues/159) | ✅   |
| P5   | Web：OPFS/IDB 虚拟工作区适配器                        | [#160](https://github.com/trueLoving/Pixuli/issues/160) | ✅   |
| P6   | Mobile：SAF / Capacitor 工作区适配器                  | [#161](https://github.com/trueLoving/Pixuli/issues/161) | ✅   |
| P7   | Gitee 代理退役 + `remote-only` 移除 + local-only 锁死 | [#173](https://github.com/trueLoving/Pixuli/issues/173) | ⏳   |
