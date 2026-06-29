# Pixuli 重构计划

> **版本**：3.2  
> **更新**：2026-06-17（`gh issue view` 与 GitHub 状态同步；#126 已重开）  
> **状态**：执行中

本文档是仓库级重构的**活跃 Issue 追踪**。M1～M4 已完成项、分阶段历史与 Issue 正文模板已迁入
[archive/refactor-plan/](archive/refactor-plan/)。

---

## 一、目标与原则

### 1.1 产品底线

| 项           | 约定                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| **三端**     | Web（含 PWA）、Desktop（Electron）、Mobile（Capacitor Android）；**单工程** `apps/pixuli`                      |
| **RN 工程**  | 已迁入 [`archive/apps/mobile/`](archive/apps/mobile/)（REF-513 ✅）                                            |
| **存储**     | GitHub / Gitee 经 `StorageProvider` 插件；**无官方 NestJS Server**                                             |
| **本地库**   | 用户指定本地工作目录 + 可选远端同步（REF-607 / [里程碑 #7](https://github.com/trueLoving/Pixuli/milestone/7)） |
| **对外主张** | AI 分析、自动标签、批处理与图床管理一体                                                                        |

### 1.2 架构要点

- **已归档**：`packages/wasm`、`benchmark/`、`server/`、`apps/mobile` → 见
  [archive/README.md](archive/README.md)
- **包结构**：`@pixuli/core` + `@pixuli/ui` + `@pixuli/provider-*`（M3 已删除
  `packages/common`）；**插件体系**待 REF-411 按 Obsidian 模型重设计（见 §1.6）
- **分层**：L1 业务 · L2 网格/列表 ·
  L3 各端平台能力；**core/provider 禁止依赖 ui**
- **展示裁剪**：幻灯片、时间线、照片墙、3D 画廊等已移除（M1 ✅）
- **Gitee 图片**：三端本地工作区浏览；公网分享走 `buildPublicUrl` 直链（REF-607
  P7 ✅）

### 1.3 里程碑概览

| 里程碑 | 名称               | 状态                                                                               |
| ------ | ------------------ | ---------------------------------------------------------------------------------- |
| M1     | 减负与归档         | ✅ 完成 → [M1-completed.md](archive/refactor-plan/M1-completed.md)                 |
| M2     | core / ui 拆分     | ✅ 完成 → [M2-completed.md](archive/refactor-plan/M2-completed.md)                 |
| M3     | 存储插件 P0        | ✅ 完成 → [M3-completed.md](archive/refactor-plan/M3-completed.md)                 |
| M4     | 文档与 CI          | ⏳ 11/16 → [M4-completed.md](archive/refactor-plan/M4-completed.md)                |
| M5     | 平台能力 L3        | ⏳ 9/16（含 REF-507 ❌）→ [M5-completed.md](archive/refactor-plan/M5-completed.md) |
| M6     | 产品体验与能力边界 | ⏳ 1/7 → [M6-completed.md](archive/refactor-plan/M6-completed.md)                  |

### 1.4 三端单工程（当前基线）

```text
apps/pixuli（Vite + React）
  ├── @pixuli/ui              Web L1/L2
  ├── src/platforms/*         Electron / Capacitor 分支
  └── imageStore / sourceStore  三端共用（本地工作区模式已落地）

archive/apps/mobile           Expo RN，只读对照
```

Capacitor 为主路线（方案 A）；REF-507（双份 store 抽离）已 ❌ 取消。交互 SSOT：
[04-three-platform-interaction-spec.md](docs/01-product/04-three-platform-interaction-spec.md)（REF-601
✅）。

**构建顺序（CI 与 release 一致）**：

```text
pnpm build:packages  →  pnpm build:web  →  build:desktop / build:android
```

工程细节：[06-apps-pixuli-engineering.md](docs/02-system-design/06-apps-pixuli-engineering.md)（REF-514
✅）。

### 1.5 当前执行焦点

| 优先级 | 方向                                                                  | Issue                                                                                                            |
| ------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **P0** | REF-607 P7：Gitee 代理全仓退役 + local-only 锁死                      | [#173](https://github.com/trueLoving/Pixuli/issues/173)                                                          |
| **P0** | REF-516 P7 / REF-515：三端 CI + Android APK 发版                      | [#153](https://github.com/trueLoving/Pixuli/issues/153)                                                          |
| **P1** | REF-416：Workspace 包 exports conditions（dev 免手动 build:packages） | [#146](https://github.com/trueLoving/Pixuli/issues/146)                                                          |
| **P1** | REF-602 / REF-603：M6 UI 与性能边界                                   | [#131](https://github.com/trueLoving/Pixuli/issues/131)、[#132](https://github.com/trueLoving/Pixuli/issues/132) |
| **P1** | REF-411：插件体系重设计（Obsidian 参考）                              | [#126](https://github.com/trueLoving/Pixuli/issues/126)                                                          |
| **P2** | REF-412 / REF-413：集成/冒烟测试                                      | [#127](https://github.com/trueLoving/Pixuli/issues/127) 等                                                       |
| **P2** | REF-501～505：Desktop L3 与 L3 能力矩阵文档                           | [#86](https://github.com/trueLoving/Pixuli/issues/86)～[#90](https://github.com/trueLoving/Pixuli/issues/90)     |

### 1.6 REF-411 — 插件体系重设计（Obsidian 参考）

**背景**：M3 已落地 `StorageProvider` +
`StoragePluginRegistry`，官方 GitHub/Gitee 以 monorepo 包编译期注册；原 REF-411「Host 运行时集成」（Vite/Electron/Serverless 胶水，见
[03-plugin-host-integration.md](archive/design/03-plugin-host-integration.md)）随 Gitee 代理退役（#173）**不再作为主线**。下一版插件体系应对齐
**Obsidian 式可扩展模型**，而非仅扩展 Host 钩子。

**参考 Obsidian 的核心要素**（Pixuli 需做三端与本地工作区适配，非逐字照搬）：

| 要素         | Obsidian                                      | Pixuli 目标态（REF-411 设计产出）                                                      |
| ------------ | --------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Manifest** | `manifest.json`：id、版本、最低应用版本、依赖 | 统一插件清单契约；区分官方内置 vs 社区扩展                                             |
| **生命周期** | `onload` / `onunload`；启用/禁用              | 插件加载、卸载、错误隔离；与 vault / 工作区绑定                                        |
| **API 面**   | `app.workspace`、`commands`、`settings` 等    | 向插件暴露 **Core API**（存储、工作区、命令、设置），**禁止**插件直接依赖 `@pixuli/ui` |
| **设置**     | 每插件独立设置页                              | 插件级配置 schema + 持久化；敏感字段仍仅本地                                           |
| **分发**     | 社区插件目录 / BRAT                           | 远期：目录或 sideload；M4 先定契约与官方插件迁移路径                                   |
| **隔离**     | 独立 scope、失败不拖垮主应用                  | 插件崩溃/超时策略；core/provider 边界保持 REF-209                                      |

**与现状关系**：

- [03-plugin-system.md](docs/02-system-design/03-plugin-system.md) 描述
  **M3 存储 Provider
  P0**，REF-411 完成后应演进为「通用插件体系 + 存储为一类插件」
- 官方 `@pixuli/provider-*`
  作为**首批内置插件**迁移到新 Registry，而非应用内硬编码
- **不在 REF-411 P0**：恢复 Gitee Host 代理；第三方插件商店 UI 可列为后续 Issue

**交付物（Issue [#126](https://github.com/trueLoving/Pixuli/issues/126)）**：

1. 设计文档：Obsidian 对照表、Pixuli Core API 草案、manifest / lifecycle 类型
2. `@pixuli/core` 插件契约与 Registry 演进方案（兼容 M3 `StorageProvider`
   或明确迁移层）
3. 官方 provider 注册方式改造路径；与 REF-416（exports）的模块解析约定
4. 验收：设计评审通过 + 至少一个官方插件（如 GitHub）按新模型 PoC 注册

---

## 二、进行中 Issue 追踪

**列说明**：`GitHub #`
为 Issue 编号；状态 ⬜ 未开工、⏳ 部分完成、✅ 已关闭（与 GitHub `CLOSED`
一致）。

**同步命令**（合并 PR 或改 Issue 状态后执行）：

```bash
gh issue list --label refactor --state open --json number,title,state
# 或按编号：gh issue view 126 --json number,state,title
```

**最近同步**：2026-06-17 — 进行中 18 条均为 GitHub `OPEN`；#126 曾因旧 Host 集成
`CLOSED`，已重开以匹配 Obsidian 重设计范围；#151（REF-513）仍
`OPEN`（主体已归档，Wiki 待 #153）。

### M4 — 文档与 CI（剩余 5 项）

| ID      | 标题                                                               | GitHub #                                                | 状态 |
| ------- | ------------------------------------------------------------------ | ------------------------------------------------------- | ---- |
| REF-411 | [M4] 插件体系重设计（Obsidian 式 manifest / lifecycle / Core API） | [#126](https://github.com/trueLoving/Pixuli/issues/126) | ⬜   |
| REF-416 | [M4] Workspace 包构建与 exports conditions                         | [#146](https://github.com/trueLoving/Pixuli/issues/146) | ⬜   |
| REF-412 | [M4] 集成测试体系设计与落地                                        | [#127](https://github.com/trueLoving/Pixuli/issues/127) | ⬜   |
| REF-413 | [M4] 冒烟测试矩阵与 CI 门禁                                        | [#128](https://github.com/trueLoving/Pixuli/issues/128) | ⬜   |
| REF-415 | [M4] 文档国际化（中/英）策略与目录设计                             | [#138](https://github.com/trueLoving/Pixuli/issues/138) | ⬜   |

> M4 已完成 11 项（REF-401～410、414）见
> [M4-completed.md](archive/refactor-plan/M4-completed.md)。REF-411 范围见
> **§1.6**（原 Host 集成文档
> [03-plugin-host-integration.md](archive/design/03-plugin-host-integration.md)
> 仅作历史参考）。

### M5 — 平台能力 L3（剩余 6 项 + 总线收尾）

| ID      | 标题                                          | GitHub #                                                | 状态  |
| ------- | --------------------------------------------- | ------------------------------------------------------- | ----- |
| REF-501 | [M5] 文档化 L3 能力矩阵                       | [#86](https://github.com/trueLoving/Pixuli/issues/86)   | ⬜    |
| REF-502 | [M5] `platforms/desktop` 目录约定             | [#87](https://github.com/trueLoving/Pixuli/issues/87)   | ⬜    |
| REF-503 | [M5] Desktop 离线浏览与上传队列               | [#88](https://github.com/trueLoving/Pixuli/issues/88)   | ⬜    |
| REF-504 | [M5] Desktop 自动更新 electron-updater        | [#89](https://github.com/trueLoving/Pixuli/issues/89)   | ⬜    |
| REF-505 | [M5] Desktop 系统托盘                         | [#90](https://github.com/trueLoving/Pixuli/issues/90)   | ⬜    |
| REF-515 | [M5] CI/CD 三端单工程流水线（含 Android APK） | [#153](https://github.com/trueLoving/Pixuli/issues/153) | ⏳    |
| REF-516 | [三端融合] Mobile 功能对齐总览                | [#163](https://github.com/trueLoving/Pixuli/issues/163) | ⏳ P7 |

> M5 已完成 9 项 + REF-507 ❌ 见
> [M5-completed.md](archive/refactor-plan/M5-completed.md)。GitHub
> [#151](https://github.com/trueLoving/Pixuli/issues/151)（REF-513）仍
> **OPEN**（RN 已归档，关闭条件含 #153 Wiki）。

#### REF-516 分阶段（[里程碑 #8](https://github.com/trueLoving/Pixuli/milestone/8)）

| 阶段   | 范围                                              | GitHub #                                                           | 状态 |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------ | ---- |
| P0～P6 | 对齐矩阵、移动 UI、业务/L3、工作区、验收、RN 归档 | #164～#166 等                                                      | ✅   |
| **P7** | CI APK 发版 + Wiki                                | [#153](https://github.com/trueLoving/Pixuli/issues/153)（#152 ✅） | ⏳   |

详情：[completed-phases.md § REF-516](archive/refactor-plan/completed-phases.md)。

### M6 — 产品体验与能力边界（6 项进行中）

| ID      | 标题                                   | GitHub #                                                | 状态  |
| ------- | -------------------------------------- | ------------------------------------------------------- | ----- |
| REF-602 | [M6] UI 优化：侧栏、主内容区与图片操作 | [#131](https://github.com/trueLoving/Pixuli/issues/131) | ⬜    |
| REF-603 | [M6] 大数据场景与产品性能边界          | [#132](https://github.com/trueLoving/Pixuli/issues/132) | ⬜    |
| REF-604 | [M6] 标签与描述管理 + AI 自动分析      | [#133](https://github.com/trueLoving/Pixuli/issues/133) | ⬜    |
| REF-605 | [M6] 图片批处理                        | [#134](https://github.com/trueLoving/Pixuli/issues/134) | ⬜    |
| REF-606 | [M6] 回收站机制                        | [#140](https://github.com/trueLoving/Pixuli/issues/140) | ⬜    |
| REF-607 | [M6] 本地工作区 + 远端同步与多形态 URL | [#144](https://github.com/trueLoving/Pixuli/issues/144) | ⏳ P7 |

#### REF-607 分阶段（[里程碑 #7](https://github.com/trueLoving/Pixuli/milestone/7)）

设计 SSOT：[05-local-workspace-sync.md §九](docs/02-system-design/05-local-workspace-sync.md#九分阶段交付)

| 阶段   | 范围                                                    | GitHub #                                                | 状态 |
| ------ | ------------------------------------------------------- | ------------------------------------------------------- | ---- |
| P0～P6 | 设计、Core vault、Desktop/Web/Mobile 适配器、local 模式 | #155～#161                                              | ✅   |
| **P7** | Gitee 代理退役 + remote-only 移除 + local-only 锁死     | [#173](https://github.com/trueLoving/Pixuli/issues/173) | ⏳   |

详情：[completed-phases.md § REF-607](archive/refactor-plan/completed-phases.md)。

**建议顺序**：**#173**（P7 收官）→ **#153**（CI APK）→ **#131** ∥ **#132** →
**#140** → **#133** → **#134**。

REF-601（交互规范）✅ 见
[M6-completed.md](archive/refactor-plan/M6-completed.md)。

---

## 三、GitHub Issue 操作（摘要）

完整步骤见 [archive/refactor-plan/](archive/refactor-plan/)
附带的 v2.0 原文 §二；日常只需：

1. **开 PR**：标题或分支含 `REF-xxx`；完整关闭 Issue 时用 `Fixes #n`
2. **更新本表**：合并后改对应行状态；大段已完成表移入 `archive/refactor-plan/`
3. **Label**：`refactor`、`m4`～`m6`、`priority:P0`～`P2`、`area:*`
4. **里程碑**：M4～M6 + GitHub
   [里程碑 #7](https://github.com/trueLoving/Pixuli/milestone/7) /
   [#8](https://github.com/trueLoving/Pixuli/milestone/8)

```bash
gh issue list --label refactor --state open
gh issue view 126 --json number,state,title
```

---

## 四、不在范围内（Won't Do）

| 项                                                 | 说明              |
| -------------------------------------------------- | ----------------- |
| 恢复 Slideshow / Timeline / PhotoWall / 3D Gallery | 已从产品移除      |
| 删除 Mobile 或 Desktop **产品能力**                | 三端为底线        |
| 主仓库恢复 Server / WASM 为必需构建                | 已归档            |
| 恢复 Gitee Host 图片代理为默认路径                 | REF-607 P7 退役中 |

---

## 五、进度汇总

| 里程碑   | Issue 数 | 已完成 | 已取消 | 进行中 | 进度    |
| -------- | -------- | ------ | ------ | ------ | ------- |
| M1       | 12       | 12     | —      | —      | 100%    |
| M2       | 10       | 10     | —      | —      | 100%    |
| M3       | 13       | 13     | —      | —      | 100%    |
| M4       | 16       | 11     | —      | 5      | 69%     |
| M5       | 16       | 9      | 1      | 6      | 56%     |
| M6       | 7        | 1      | —      | 6      | 14%     |
| **合计** | **74**   | **56** | **1**  | **17** | **76%** |

> 分阶段总线（REF-516 P7、REF-607 P7）未计入上表 Issue 数。

---

## 六、相关文档

| 主题                        | 文档                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| 已完成 Issue 归档           | [archive/refactor-plan/](archive/refactor-plan/)                                               |
| 代码归档                    | [archive/README.md](archive/README.md)                                                         |
| 系统架构                    | [01-system-design.md](docs/02-system-design/01-system-design.md)                               |
| 三端设计                    | [02-three-platform-design.md](archive/design/02-three-platform-design.md)                      |
| apps/pixuli 工程            | [06-apps-pixuli-engineering.md](docs/02-system-design/06-apps-pixuli-engineering.md)           |
| 插件体系（M3 现状）         | [03-plugin-system.md](docs/02-system-design/03-plugin-system.md)                               |
| 插件体系重设计（REF-411）   | **§1.6** · Obsidian 参考 · [#126](https://github.com/trueLoving/Pixuli/issues/126)             |
| Host 集成（历史，已非主线） | [03-plugin-host-integration.md](archive/design/03-plugin-host-integration.md)                  |
| 本地工作区                  | [05-local-workspace-sync.md](docs/02-system-design/05-local-workspace-sync.md)                 |
| Capacitor PoC               | [04-capacitor-android-poc.md](archive/design/04-capacitor-android-poc.md)                      |
| Mobile 对齐矩阵             | [06-mobile-feature-parity-matrix.md](archive/design/06-mobile-feature-parity-matrix.md)        |
| TS/JS 策略                  | [04-typescript-javascript-policy.md](docs/02-system-design/04-typescript-javascript-policy.md) |
| Agent / Skill               | [AGENTS.md](AGENTS.md)                                                                         |
| Backlog                     | [docs/04-backlog.md](docs/04-backlog.md)                                                       |

---

## 七、GitHub Project 看板列建议

| 列名        | 用途    |
| ----------- | ------- |
| Backlog     | 未开工  |
| In Progress | 进行中  |
| Review      | PR 已开 |
| Done        | 已合并  |

Issue **Milestone** 设为 M4～M6；状态用 Project 字段或 `status:in-progress`
等 label 维护。
