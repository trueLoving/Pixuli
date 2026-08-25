# PLANS

> **工作进度 SSOT** · 与 GitHub Issues **对齐**  
> **最近同步**：2026-08-25（`gh issue list --state open`）  
> **状态**：执行中

本文件是仓库**唯一的任务与进度汇总表**。新增任务、更新进度、关闭项，都在这里维护，并与远程 Issue 保持一致。

| 操作         | 做法                                                               |
| ------------ | ------------------------------------------------------------------ |
| **加任务**   | 先 `gh issue create`（或网页开 Issue）→ 把编号与标题写入下方对应表 |
| **改进度**   | 改本表「状态」列；Issue 有实质推进时同步评论 / 改 label            |
| **关任务**   | PR 用 `Fixes #n` 关 Issue → 本表标 ✅ 或移出「进行中」             |
| **拉齐远程** | 见文末同步命令                                                     |

历史里程碑（M1～M3 等）已完成项不再展开；需要时可在 GitHub 按 milestone /
closed 查阅。

---

## 一、产品底线（不变）

| 项         | 约定                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| **三端**   | Web（PWA）+ Desktop（Electron）+ Mobile（Capacitor Android）；单工程 `app`               |
| **存储**   | GitHub / Gitee 经 `StorageProvider`；**无官方 NestJS Server**                            |
| **本地库** | 本地工作区为 SSOT；远端可选同步（REF-607 ✅）                                            |
| **包边界** | `@pixuli/core` + `@pixuli/provider-*`；UI 在 `app/src/ui`；core/provider **禁止**依赖 UI |

2.0 定位与相对 1.0 的差异见 [2.0.md](./2.0.md)；**为什么**见
[DECISIONS.md](./DECISIONS.md)。

---

## 二、当前焦点（建议顺序）

| 优先级      | 方向                          | Issue                                                                     |
| ----------- | ----------------------------- | ------------------------------------------------------------------------- |
| **P1**      | 插件体系重设计（Obsidian 式） | [#126](https://github.com/trueLoving/Pixuli/issues/126)                   |
| **P1**      | 大数据 / 性能边界             | [#132](https://github.com/trueLoving/Pixuli/issues/132)                   |
| **P1**      | 标签与描述 + AI               | [#133](https://github.com/trueLoving/Pixuli/issues/133)                   |
| **P1**      | 图片批处理                    | [#134](https://github.com/trueLoving/Pixuli/issues/134)                   |
| **P1**      | 回收站                        | [#140](https://github.com/trueLoving/Pixuli/issues/140)                   |
| **P2**      | Desktop 离线同步/上传队列     | [#88](https://github.com/trueLoving/Pixuli/issues/88)                     |
| **P2**      | Desktop 自动更新              | [#89](https://github.com/trueLoving/Pixuli/issues/89)                     |
| **P2**      | 集成测试体系                  | [#127](https://github.com/trueLoving/Pixuli/issues/127)                   |
| **P2**      | 文档中/英策略                 | [#138](https://github.com/trueLoving/Pixuli/issues/138)                   |
| **Backlog** | 存储插件热加载                | [#102](https://github.com/trueLoving/Pixuli/issues/102)（排在 #126 之后） |

---

## 三、进行中 Issue（与 GitHub OPEN 对齐）

**状态约定**：⬜ 未开工 · ⏳ 进行中/部分完成 · ✅ 已关闭（须与 GitHub `CLOSED`
一致）

### M4 — 文档与 CI

| ID      | 标题                                                          | GitHub                                                  | 状态 |
| ------- | ------------------------------------------------------------- | ------------------------------------------------------- | ---- |
| REF-411 | 插件体系重设计（Obsidian 式 manifest / lifecycle / Core API） | [#126](https://github.com/trueLoving/Pixuli/issues/126) | ⬜   |
| REF-412 | 集成测试体系设计与落地                                        | [#127](https://github.com/trueLoving/Pixuli/issues/127) | ⬜   |
| REF-415 | 文档国际化（中/英）策略与目录设计                             | [#138](https://github.com/trueLoving/Pixuli/issues/138) | ⬜   |

### M5 — 平台能力 L3

| ID      | 标题                              | GitHub                                                | 状态 |
| ------- | --------------------------------- | ----------------------------------------------------- | ---- |
| REF-503 | Desktop：离线时同步/上传队列      | [#88](https://github.com/trueLoving/Pixuli/issues/88) | ⬜   |
| REF-504 | Desktop 自动更新 electron-updater | [#89](https://github.com/trueLoving/Pixuli/issues/89) | ⬜   |

### M6 — 产品体验与能力边界

| ID      | 标题                               | GitHub                                                  | 状态                                                                                           |
| ------- | ---------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| REF-603 | 大数据场景与产品性能边界           | [#132](https://github.com/trueLoving/Pixuli/issues/132) | ⏳ 部分（虚拟窗口 + 缩略已落地，见 [02-performance](docs/02-system-design/02-performance.md)） |
| REF-604 | 标签与描述管理 + AI 自动分析       | [#133](https://github.com/trueLoving/Pixuli/issues/133) | ⬜                                                                                             |
| REF-605 | 图片批处理：上传、删除、更新、查看 | [#134](https://github.com/trueLoving/Pixuli/issues/134) | ⬜                                                                                             |
| REF-606 | 回收站机制：软删除与 30 天自动清理 | [#140](https://github.com/trueLoving/Pixuli/issues/140) | ⬜                                                                                             |

### Backlog（无里程碑）

| 标题                       | GitHub                                                  | 状态 |
| -------------------------- | ------------------------------------------------------- | ---- |
| 存储插件热加载与第三方安装 | [#102](https://github.com/trueLoving/Pixuli/issues/102) | ⬜   |

**OPEN 合计**：**10** 条（与 2026-08-25 远程一致）。

---

## 四、近期已关闭（便于对照，不维护全量）

| Issue                                                            | 说明                         |
| ---------------------------------------------------------------- | ---------------------------- |
| [#131](https://github.com/trueLoving/Pixuli/issues/131)          | REF-602 UI 优化 ✅           |
| [#146](https://github.com/trueLoving/Pixuli/issues/146)          | REF-416 workspace exports ✅ |
| [#144](https://github.com/trueLoving/Pixuli/issues/144) / P0～P7 | REF-607 本地工作区 ✅        |
| [#163](https://github.com/trueLoving/Pixuli/issues/163) / P0～P7 | REF-516 三端融合 ✅          |
| [#128](https://github.com/trueLoving/Pixuli/issues/128)          | REF-413 冒烟 / CI ✅         |

M1～M3、以及上表以外的 CLOSED 项以 GitHub 为准，本文件不重复罗列。

---

## 五、不在范围（Won't Do）

| 项                                                 | 说明              |
| -------------------------------------------------- | ----------------- |
| 恢复 Slideshow / Timeline / PhotoWall / 3D Gallery | 已从产品移除      |
| 删除 Mobile 或 Desktop **产品能力**                | 三端为底线        |
| 主仓库恢复 Server / WASM 为必需构建                | 已移除            |
| 恢复 Gitee Host 图片代理为默认路径                 | REF-607 P7 已退役 |

详见 [docs/04-backlog.md](docs/04-backlog.md)。

---

## 六、同步与协作

```bash
# 拉齐 OPEN 列表
gh issue list --state open --json number,title,milestone,labels

# 单条
gh issue view 126 --json number,state,title,milestone

# 仅 refactor 标签
gh issue list --label refactor --state open
```

1. **开 PR**：标题或分支含 `REF-xxx`；完整关闭时用 `Fixes #n`
2. **合并后**：更新本文件对应行；必要时改「最近同步」日期
3. **Label /
   Milestone**：与 GitHub 保持一致（`refactor`、`m4`～`m6`、`priority:*`）

Skill：[ref-issue-pr](.cursor/skills/ref-issue-pr/SKILL.md)。

---

## 七、相关文档

| 主题      | 文档                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| 2.0 定位  | [2.0.md](./2.0.md)                                                                                                   |
| 决策      | [DECISIONS.md](./DECISIONS.md)                                                                                       |
| 需求      | [docs/01-product/01-product-requirements-specification.md](docs/01-product/01-product-requirements-specification.md) |
| 资源库 UI | [docs/01-product/04-asset-library-ui.md](docs/01-product/04-asset-library-ui.md)                                     |
| 架构      | [docs/02-system-design/01-system-design.md](docs/02-system-design/01-system-design.md)                               |
| 工程      | [app/README.md](app/README.md)                                                                                       |
| 插件      | [docs/02-system-design/03-plugin-system.md](docs/02-system-design/03-plugin-system.md)                               |
| 同步      | [docs/02-system-design/05-local-workspace-sync.md](docs/02-system-design/05-local-workspace-sync.md)                 |
| Agent     | [AGENTS.md](AGENTS.md)                                                                                               |
