# PLANS

> **工作进度 SSOT** · 与 GitHub Issues **对齐**
> **最近同步**：2026-09-12（关闭 #133/#134/#140/#102；新建 #241～#245；排期如下）
> **状态**：执行中 · **主路径冻结**（添加 → 同步 → 复制链接）

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
| **外链**   | 同步 ≠ 外网可访问；主路径为**复制链接**（无用户向「发布」）                              |
| **包边界** | `@pixuli/core` + `@pixuli/provider-*`；UI 在 `app/src/ui`；core/provider **禁止**依赖 UI |

2.0 定位与相对 1.0 的差异见 [2.0.md](./2.0.md)；**为什么**见
[DECISIONS.md](./DECISIONS.md)。资源库 UI SSOT：
[04-asset-library-ui.md](docs/01-product/04-asset-library-ui.md)（v3.7）。

---

## 二、排期（按 Sprint）

> **纪律**：未完成 Sprint A 前，不半接入 Drive / 全员 OAuth / AI / 网格 / 任务抽屉。  
> 官方连接近期只保 GitHub + Gitee。对照 SSOT §十一 P0/P1。

| Sprint | 窗口（建议） | 目标 | Issue | 退出标准 |
| ------ | ------------ | ---- | ----- | -------- |
| **A** | 当前～1 周 | 主路径口径与文档对齐 | [#241](https://github.com/trueLoving/Pixuli/issues/241) REF-609 | README/PRS 与 v3.7 一致；无用户向「发布」；J0 文案可走通 |
| **A′** | 与 A 并行（非编码） | J0 自测摩擦记录 | （摩擦点再开子 Issue） | 添加→同步公开仓→复制 raw 可贴 Markdown；记下 3～5 个真实摩擦 |
| **B** | A 后～2～3 周 | 连接统一向导壳 | [#242](https://github.com/trueLoving/Pixuli/issues/242) REF-610 | 统一添加连接壳；PAT 可连可同步；无空壳 OAuth |
| **C** | B 后～3～4 周 | 库内效率三件套 | [#243](https://github.com/trueLoving/Pixuli/issues/243) REF-611 · [#244](https://github.com/trueLoving/Pixuli/issues/244) REF-612 · [#245](https://github.com/trueLoving/Pixuli/issues/245) REF-613 | 批量移动仅本机；全部中搜索；压缩开关+发送到压缩 |
| **D** | C 后 | 性能边界收尾 | [#132](https://github.com/trueLoving/Pixuli/issues/132) REF-603 | 大数据策略文档+缺口补齐；列表可用 |
| **E** | D 后 | 插件体系演进 | [#126](https://github.com/trueLoving/Pixuli/issues/126) REF-411 | manifest/lifecycle 设计落地（不挡主路径） |
| **P2** | 穿插 / 有余力 | 平台与工程 | [#88](https://github.com/trueLoving/Pixuli/issues/88) · [#89](https://github.com/trueLoving/Pixuli/issues/89) · [#127](https://github.com/trueLoving/Pixuli/issues/127) · [#138](https://github.com/trueLoving/Pixuli/issues/138) | 不阻塞 A～C |

### 当前应开工

1. **[#241](https://github.com/trueLoving/Pixuli/issues/241)** — 对外叙事对齐（Sprint A）
2. 并行：**J0 自测**（不建 Issue，除非出现可修缺陷）

### 资源库 UI P0（已完成）

| 项 | 状态 |
| -- | ---- |
| P0-1～P0-7 | ✅ |
| P0-8 PAT 连接去手工 | ✅ [#239](https://github.com/trueLoving/Pixuli/pull/239) |
| P0-9 复制链接三态 + 清除「发布」用户文案 | ✅ [#240](https://github.com/trueLoving/Pixuli/pull/240) |
| REF-608 | ✅ [#218](https://github.com/trueLoving/Pixuli/issues/218) CLOSED |

---

## 三、Issue 调整记录（2026-09-12）

### 已关闭（近期不做，保留历史）

| Issue | 标题 | 说明 |
| ----- | ---- | ---- |
| [#133](https://github.com/trueLoving/Pixuli/issues/133) | 标签与描述 + AI | 主路径冻结；未接模型前不做 |
| [#140](https://github.com/trueLoving/Pixuli/issues/140) | 回收站 | 非北极星刚需 |
| [#134](https://github.com/trueLoving/Pixuli/issues/134) | 宽范围图片批处理 | 已部分落地；拆到 #243/#244/#245 |
| [#102](https://github.com/trueLoving/Pixuli/issues/102) | 插件热加载 | 依赖 #126；暂无第三方安装需求 |

### 新建

| Issue | REF | 标题 | Sprint |
| ----- | --- | ---- | ------ |
| [#241](https://github.com/trueLoving/Pixuli/issues/241) | REF-609 | 对外叙事对齐：README/PRS | **A** |
| [#242](https://github.com/trueLoving/Pixuli/issues/242) | REF-610 | 连接统一向导壳（PAT；OAuth 可选） | **B** |
| [#243](https://github.com/trueLoving/Pixuli/issues/243) | REF-611 | 批量移动 / 库内拖放 | **C** |
| [#244](https://github.com/trueLoving/Pixuli/issues/244) | REF-612 | 在全部中搜索 | **C** |
| [#245](https://github.com/trueLoving/Pixuli/issues/245) | REF-613 | 压缩总开关 + 发送到压缩 | **C** |

### 明确延后（不建 Issue）

网格/列表（P1-6）、同步任务抽屉（P1-7）、shareLink 设置入口（P1-8）、Drive、全员强制 OAuth。

---

## 四、进行中 Issue（与 GitHub OPEN 对齐）

**状态约定**：⬜ 未开工 · ⏳ 进行中/部分完成 · ✅ 已关闭

### 排期内（优先）

| ID | 标题 | GitHub | Sprint | 状态 |
| -- | ---- | ------ | ------ | ---- |
| REF-609 | 对外叙事对齐：README/PRS | [#241](https://github.com/trueLoving/Pixuli/issues/241) | A | ⬜ **当前** |
| REF-610 | 连接统一向导壳 | [#242](https://github.com/trueLoving/Pixuli/issues/242) | B | ⬜ |
| REF-611 | 批量移动 / 库内拖放 | [#243](https://github.com/trueLoving/Pixuli/issues/243) | C | ⬜ |
| REF-612 | 在全部中搜索 | [#244](https://github.com/trueLoving/Pixuli/issues/244) | C | ⬜ |
| REF-613 | 压缩总开关 + 发送到压缩 | [#245](https://github.com/trueLoving/Pixuli/issues/245) | C | ⬜ |
| REF-603 | 大数据 / 性能边界 | [#132](https://github.com/trueLoving/Pixuli/issues/132) | D | ⏳ 部分 |
| REF-411 | 插件体系重设计 | [#126](https://github.com/trueLoving/Pixuli/issues/126) | E | ⬜ |

### P2（有余力）

| ID | 标题 | GitHub | 状态 |
| -- | ---- | ------ | ---- |
| REF-503 | Desktop 离线同步/上传队列 | [#88](https://github.com/trueLoving/Pixuli/issues/88) | ⬜ |
| REF-504 | Desktop 自动更新 | [#89](https://github.com/trueLoving/Pixuli/issues/89) | ⬜ |
| REF-412 | 集成测试体系 | [#127](https://github.com/trueLoving/Pixuli/issues/127) | ⬜ |
| REF-415 | 文档中/英策略 | [#138](https://github.com/trueLoving/Pixuli/issues/138) | ⬜ |

**OPEN 合计**：**11** 条（2026-09-12：关 4 + 建 5，相对原 10 条净 +1）。

---

## 五、近期已关闭（便于对照，不维护全量）

| Issue | 说明 |
| ----- | ---- |
| [#133](https://github.com/trueLoving/Pixuli/issues/133) / [#134](https://github.com/trueLoving/Pixuli/issues/134) / [#140](https://github.com/trueLoving/Pixuli/issues/140) / [#102](https://github.com/trueLoving/Pixuli/issues/102) | 2026-09-12 主路径冻结期关闭 / 拆分 |
| [#218](https://github.com/trueLoving/Pixuli/issues/218) | REF-608 资源库 UI 主路径 / 外链收敛 ✅ |
| [#240](https://github.com/trueLoving/Pixuli/pull/240) | P0-9 复制链接三态 |
| [#239](https://github.com/trueLoving/Pixuli/pull/239) | P0-8 PAT 去手工 |
| [#131](https://github.com/trueLoving/Pixuli/issues/131) | REF-602 UI 优化 ✅ |
| [#146](https://github.com/trueLoving/Pixuli/issues/146) | REF-416 workspace exports ✅ |
| [#144](https://github.com/trueLoving/Pixuli/issues/144) | REF-607 本地工作区 ✅ |
| [#163](https://github.com/trueLoving/Pixuli/issues/163) | REF-516 三端融合 ✅ |
| [#128](https://github.com/trueLoving/Pixuli/issues/128) | REF-413 冒烟 / CI ✅ |

---

## 六、不在范围（Won't Do）

| 项 | 说明 |
| -- | ---- |
| 恢复 Slideshow / Timeline / PhotoWall / 3D Gallery | 已从产品移除 |
| 删除 Mobile 或 Desktop **产品能力** | 三端为底线 |
| 主仓库恢复 Server / WASM 为必需构建 | 已移除 |
| 恢复 Gitee Host 图片代理为默认路径 | REF-607 P7 已退役 |
| 用户向「发布」流程 / 假发布态 | v3.3+ 已废止 |
| 主路径冻结期内上 OneDrive / 全员强制 OAuth | SSOT 明确延后 |

详见 [docs/04-backlog.md](docs/04-backlog.md)。

---

## 七、同步与协作

```bash
gh issue list --state open --json number,title,milestone,labels
gh issue view 241 --json number,state,title,milestone
gh issue list --label refactor --state open
```

1. **开 PR**：标题或分支含 `REF-xxx`；完整关闭时用 `Fixes #n`
2. **合并后**：更新本文件对应行；必要时改「最近同步」日期
3. **Label / Milestone**：与 GitHub 保持一致

Skill：[ref-issue-pr](.cursor/skills/ref-issue-pr/SKILL.md)。

---

## 八、相关文档

| 主题 | 文档 |
| ---- | ---- |
| 2.0 定位 | [2.0.md](./2.0.md) |
| 决策 | [DECISIONS.md](./DECISIONS.md) |
| 需求 | [docs/01-product/01-product-requirements-specification.md](docs/01-product/01-product-requirements-specification.md) |
| 资源库 UI | [docs/01-product/04-asset-library-ui.md](docs/01-product/04-asset-library-ui.md) |
| 架构 | [docs/02-system-design/01-system-design.md](docs/02-system-design/01-system-design.md) |
| 工程 | [app/README.md](app/README.md) |
| 插件 | [docs/02-system-design/03-plugin-system.md](docs/02-system-design/03-plugin-system.md) |
| 同步 | [docs/02-system-design/04-local-workspace-sync.md](docs/02-system-design/04-local-workspace-sync.md) |
| Agent | [AGENTS.md](AGENTS.md) |
