# Mobile 功能对齐矩阵（RN ↔ pixuli ↔ Capacitor）

> **文档状态**：📦 **已归档（只读快照）** · 2026-06-17  
> **归档原因**：REF-516 P0 #164 ✅；产品交互 SSOT 已收敛至
> [04-three-platform-interaction-spec.md](../../docs/01-product/04-three-platform-interaction-spec.md)。  
> **当前请读**：[04-three-platform-interaction-spec.md](../../docs/01-product/04-three-platform-interaction-spec.md)
> · 索引 [README.md](./README.md)

- **文档版本**：1.0
- **计划编号**：REF-516 P0
- **关联 Issue**：[#164](https://github.com/trueLoving/Pixuli/issues/164)
  · 父 Issue [#163](https://github.com/trueLoving/Pixuli/issues/163)
- **盘点日期**：2026-05-27 · 基线：`main`（REF-607 P1～P3 ✅、REF-507 ❌ 取消）
- **SSOT 原则**：**`apps/pixuli`（Web + Desktop + Capacitor 目标）**
  为产品行为准绳；`archive/apps/mobile`（RN）仅作历史对照，已归档
- **相关文档**：
  - [04-three-platform-interaction-spec.md](../../docs/01-product/04-three-platform-interaction-spec.md)
    — REF-601 旅程与 IA（§2.1、§3、§四）
  - [05-cross-platform-sharing-matrix.md](./05-cross-platform-sharing-matrix.md)
    — REF-506 代码级重复/缺口（§三）
  - [01-product-requirements-specification.md](../../docs/01-product/01-product-requirements-specification.md)
    — PRD §4.3 产品能力矩阵（REF-501 / #86）
  - [04-capacitor-android-poc.md](./04-capacitor-android-poc.md) — REF-509
    PoC 与冒烟清单

> **与 REF-506 的分工**：`09-*.md`
> 回答「**哪份代码重复**」；本文回答「**用户能做什么、Capacitor 要不要补、RN 独有怎么办**」。

---

## 一、图例

| 列                 | 含义                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **pixuli**         | `apps/pixuli` + `@pixuli/ui` web（Web / Desktop / Capacitor 共用）                                                                   |
| **RN**             | `archive/apps/mobile`（Expo，已归档）                                                                                                |
| **Capacitor 目标** | 以 pixuli 窄屏 + 原生壳为准；缺口在 Capacitor 路线补齐或书面降级                                                                     |
| **决策**           | **实现** = Capacitor 须达到 pixuli 同等能力 · **降级** = 保留差异并文档化 · **放弃** = RN 独有且产品不保留 · **已有** = 无需额外工作 |

能力标注：**✅** 完整 · **△** 部分 / 接线未完成 · **—** 无 · **⏳**
规划（REF-607 等）

---

## 二、用户旅程对齐矩阵

对照
[REF-601 §2.1](../../docs/01-product/04-three-platform-interaction-spec.md#21-核心旅程现状--远端图床)
核心旅程。

### 2.1 配置仓库源

| ID    | 能力                     | pixuli    | RN  | Capacitor 目标 | 决策     | 备注 / Issue                                                                              |
| ----- | ------------------------ | --------- | --- | -------------- | -------- | ----------------------------------------------------------------------------------------- |
| J1-01 | 添加 GitHub 源           | ✅        | ✅  | ✅             | **已有** | pixuli：`GitHubConfigModal`；RN：`StorageConfigModal`                                     |
| J1-02 | 添加 Gitee 源            | ✅        | ✅  | ✅             | **已有** | Gitee 图片经 Host 代理（Web/Desktop）；Capacitor 生产需 `VITE_GITEE_PROXY_ORIGIN`（#150） |
| J1-03 | 编辑 / 删除源            | ✅        | ✅  | ✅             | **已有** |                                                                                           |
| J1-04 | 切换当前源               | ✅        | ✅  | ✅             | **已有** | 侧栏 vs 抽屉，壳不同                                                                      |
| J1-05 | 配置导入 JSON            | ✅        | ✅  | ✅             | **已有** |                                                                                           |
| J1-06 | 配置导出 JSON            | ✅        | —   | ✅             | **已有** | Capacitor：`exportJsonFile` 复制剪贴板；Web 下载文件 — **#165** ✅                        |
| J1-07 | 多源 `pixuli.sources.v3` | ✅        | △   | ✅             | **已有** | RN 仍用 v2 key；Capacitor 走 pixuli store，**不单独修 RN**                                |
| J1-08 | 本地工作区绑定           | △ Desktop | —   | ⏳             | **实现** | Desktop `workspaceStore` ✅；Web #160、Mobile #161 — **REF-607**                          |

### 2.2 浏览图床

| ID    | 能力               | pixuli     | RN  | Capacitor 目标 | 决策     | 备注 / Issue                                                 |
| ----- | ------------------ | ---------- | --- | -------------- | -------- | ------------------------------------------------------------ |
| J2-01 | 网格视图           | ✅         | ✅  | ✅             | **已有** |                                                              |
| J2-02 | 列表视图 + 切换    | ✅         | —   | ✅             | **已有** | Capacitor 复用 `ImageViewToggle`                             |
| J2-03 | 全屏预览 / 切换    | ✅         | ✅  | ✅             | **已有** | 窄屏默认全屏 — **#150**                                      |
| J2-04 | 下拉刷新列表       | △ 按钮刷新 | ✅  | **实现**       | **降级** | Capacitor 可保留按钮；可选加 pull-to-refresh — **#165** 低优 |
| J2-05 | 无限滚动 / 分页    | ✅         | △   | ✅             | **已有** | REF-603 大库边界另议                                         |
| J2-06 | 空态 / 加载 / 错误 | ✅         | ✅  | ✅             | **已有** |                                                              |

### 2.3 搜索、筛选、排序

| ID    | 能力                     | pixuli    | RN               | Capacitor 目标 | 决策     | 备注 / Issue                                                       |
| ----- | ------------------------ | --------- | ---------------- | -------------- | -------- | ------------------------------------------------------------------ |
| J3-01 | 关键词搜索               | ✅        | ✅               | ✅             | **已有** |                                                                    |
| J3-02 | 搜索历史                 | ✅        | —                | △              | **降级** | 非 P0；可后置                                                      |
| J3-03 | 按标签筛选               | ✅        | ✅               | ✅             | **已有** |                                                                    |
| J3-04 | 按图片类型筛选           | ✅        | —                | ✅             | **已有** | RN 无 type 筛选 UI                                                 |
| J3-05 | 尺寸 / 日期筛选          | —         | △ store 有 UI 无 | —              | **放弃** | RN 未暴露；pixuli/core 亦无；不纳入 Capacitor P0                   |
| J3-06 | 排序（名称/时间/大小等） | ✅        | ✅               | ✅             | **已有** |                                                                    |
| J3-07 | 独立 filter Tab          | —         | — 已删除         | —              | **放弃** | RN `filter.tsx` 已移除；Capacitor 用 Photos 内嵌搜索 — **#165** ✅ |
| J3-08 | IA：筛选入口一处         | ✅ Header | △ 首页+隐藏 Tab  | ✅             | **已有** | 对齐 REF-601 §3.1                                                  |

### 2.4 上传

| ID    | 能力                   | pixuli         | RN  | Capacitor 目标 | 决策     | 备注 / Issue                                                             |
| ----- | ---------------------- | -------------- | --- | -------------- | -------- | ------------------------------------------------------------------------ |
| J4-01 | 单张上传 + 元数据      | ✅             | ✅  | ✅             | **已有** |                                                                          |
| J4-02 | 批量上传 + 进度        | ✅             | —   | ✅             | **实现** | RN store 有 `uploadMultipleImages` 无 UI — **#165**                      |
| J4-03 | 相册选择               | ✅ 文件选择    | ✅  | **实现**       | **实现** | Capacitor `@capacitor/camera` 或 file picker — **#120**                  |
| J4-04 | 相机拍摄               | —              | ✅  | **实现**       | **实现** | pixuli 无；Capacitor 插件 — **#120**                                     |
| J4-05 | 上传前裁剪             | △ 组件有默认关 | ✅  | **降级**       | **降级** | RN `ImageUploadEditModal` 完整；pixuli 可开 `enableCrop` — **#165** 可选 |
| J4-06 | 上传前压缩             | △ 组件有默认关 | ✅  | **降级**       | **降级** | 同上；独立 `/compress` 页已覆盖 Web                                      |
| J4-07 | 拖放上传               | ✅             | —   | —              | **放弃** | 触控端不适用                                                             |
| J4-08 | 拍照元数据（EXIF/GPS） | —              | △   | ⏳             | **实现** | **#141** REF-511                                                         |

### 2.5 单张操作

| ID    | 能力                  | pixuli           | RN       | Capacitor 目标 | 决策     | 备注 / Issue                                                    |
| ----- | --------------------- | ---------------- | -------- | -------------- | -------- | --------------------------------------------------------------- |
| J5-01 | 编辑元数据            | ✅               | △ 未接线 | ✅             | **已有** | RN `ImageEditModal` 存在未接入 Browser — **不阻塞** Capacitor   |
| J5-02 | 复制远端链接          | ✅               | ✅       | ✅             | **已有** | REF-607 目标态多 URL 类型 — **#159** 后                         |
| J5-03 | 单张删除 + 确认       | ✅               | ✅       | ✅             | **已有** |                                                                 |
| J5-04 | 刷新元数据            | ✅               | ✅       | ✅             | **已有** |                                                                 |
| J5-05 | 保存到相册 / 分享文件 | —                | ✅       | **实现**       | **实现** | Capacitor Share / Filesystem — **#120**                         |
| J5-06 | AI 分析标签           | △ Electron 无 UI | —        | ⏳             | **延期** | REF-604 #133；Capacitor 显示「仅桌面可用」占位 — REF-601 §八 P5 |

### 2.6 批量操作

| ID    | 能力           | pixuli | RN  | Capacitor 目标 | 决策     | 备注 / Issue                                                    |
| ----- | -------------- | ------ | --- | -------------- | -------- | --------------------------------------------------------------- |
| J6-01 | 多选模式 UI    | ✅     | —   | ✅             | **已有** | Capacitor 复用 `ImageBatchDeleteModal`                          |
| J6-02 | 批量删除       | ✅     | —   | ✅             | **已有** | RN 无 `deleteMultipleImages` — **不修 RN**，Capacitor 用 pixuli |
| J6-03 | 批量元数据编辑 | ⏳     | —   | ⏳             | **延期** | REF-605 #134                                                    |

### 2.7 设置与辅助

| ID    | 能力                 | pixuli   | RN  | Capacitor 目标 | 决策     | 备注 / Issue                             |
| ----- | -------------------- | -------- | --- | -------------- | -------- | ---------------------------------------- |
| J7-01 | 语言切换             | ✅       | ✅  | ✅             | **已有** |                                          |
| J7-02 | 主题 light/dark/auto | △ 仅系统 | ✅  | **降级**       | **降级** | 可选补 `ThemeModal` 等价 — **#165** 低优 |
| J7-03 | 操作日志查看 / 导出  | ✅       | ✅  | ✅             | **已有** |                                          |
| J7-04 | 版本信息             | ✅       | ✅  | ✅             | **已有** |                                          |
| J7-05 | 键盘快捷键帮助       | ✅       | —   | —              | **放弃** | 仅键鼠端 — REF-601 §5.3                  |
| J7-06 | Demo 模式            | ✅       | —   | —              | **放弃** | 开发用                                   |
| J7-07 | 帮助文档入口         | △        | ✅  | △              | **降级** |                                          |

### 2.8 图片工具（侧栏工具页）

| ID    | 能力                   | pixuli | RN  | Capacitor 目标 | 决策     | 备注 / Issue                               |
| ----- | ---------------------- | ------ | --- | -------------- | -------- | ------------------------------------------ |
| J8-01 | `/compress` 压缩工具页 | ✅     | —   | ✅             | **已有** | Capacitor 同 Web 路由；窄屏排版 — **#150** |
| J8-02 | `/convert` 格式转换页  | ✅     | —   | ✅             | **已有** | 同上                                       |

### 2.9 平台独占（非旅程 P0，须决策）

| ID    | 能力                      | pixuli      | RN         | Capacitor 目标 | 决策     | 备注 / Issue                      |
| ----- | ------------------------- | ----------- | ---------- | -------------- | -------- | --------------------------------- |
| L3-01 | PWA 安装 / 离线指示       | ✅ Web      | —          | △              | **降级** | Capacitor 非 PWA                  |
| L3-02 | Desktop 本地工作区 + 同步 | ✅ Electron | —          | —              | **已有** | Web #160、Mobile #161             |
| L3-03 | Electron 托盘 / 自动更新  | ⏳          | —          | —              | **延期** | REF-503～505                      |
| L3-04 | 触觉反馈                  | —           | ✅         | **降级**       | **放弃** | 非产品底线                        |
| L3-05 | Gitee 渲染代理            | ✅ Host     | — 直连 API | **实现**       | **已有** | Capacitor 生产代理 env — **#150** |

---

## 三、覆盖 `05-cross-platform-sharing-matrix.md` §三「重复 / 缺口」

| §三 条目                            | 本文 ID          | Capacitor 决策摘要                                                 |
| ----------------------------------- | ---------------- | ------------------------------------------------------------------ |
| 3.1 imageStore 重复                 | J6-02, J4-02     | **不抽离 store**（REF-507 取消）；Capacitor 用 pixuli `imageStore` |
| 3.1 `deleteMultipleImages` 缺口     | J6-02            | Capacitor **已有**（pixuli）                                       |
| 3.1 sourceStore v2/v3               | J1-07            | Capacitor **已有** v3                                              |
| 3.2 hooks 仅 pixuli                 | —                | Capacitor **已有**                                                 |
| 3.3 导航重复                        | J3-08            | 侧栏 + 汉堡抽屉 — **#150**                                         |
| 3.4 StorageConfigModal vs web Modal | J1-01～06        | Capacitor 复用 `@pixuli/ui` web Modal — **已有**                   |
| 3.5 持久化 key 分叉                 | J1-07            | Capacitor 用 localStorage / Capacitor Preferences — **#165** 评估  |
| 3.7 上传流程 / ImageUploadEditModal | J4-01～06        | 批量上传 **#165**；相机 **#120**                                   |
| 3.8 筛选 UI 分叉 / filter Tab       | J3-07, J3-08     | 合并为 Photos 一处 — **已有**                                      |
| 3.10 图片处理 L3                    | J4-04～05, L3-04 | **#119/#120/#141**                                                 |

---

## 四、RN 独有能力决策表（#119 REF-508 输入）

| RN 能力                | 产品是否需要 | 决策     | Capacitor 实现路径                                  | Issue     |
| ---------------------- | ------------ | -------- | --------------------------------------------------- | --------- |
| 相机拍照上传           | 是           | **实现** | `@capacitor/camera` 或 `@capacitor-community/media` | #120      |
| 相册多选               | 是           | **实现** | File picker / Photos API                            | #120      |
| 上传前裁剪压缩         | 是           | **降级** | pixuli `ImageUpload` 开开关或 RN 流合并进 web Modal | #165 可选 |
| 保存到系统相册         | 中           | **实现** | `@capacitor-community/media`                        | #120      |
| 分享图片文件           | 中           | **实现** | `@capacitor/share`                                  | #120      |
| 主题设置页             | 低           | **降级** | 可后置                                              | #165 低优 |
| 触觉反馈               | 低           | **放弃** | —                                                   | —         |
| 抽屉源管理             | —            | **放弃** | 改用侧栏抽屉（同 Web）                              | #150      |
| `filter.tsx` 独立 Tab  | —            | **放弃** | 删除死路由                                          | #165      |
| `metadataCache`        | 中           | **延期** | REF-607 本地库统一后评估                            | #159+     |
| Expo image-manipulator | —            | **放弃** | Canvas / web 工具链                                 | —         |

**验收**：无未决策的「仅 RN」能力（均已上表或链至 #119/#120/#141）。

---

## 五、#165（REF-516 P3 业务补齐）输入清单

按优先级排序，Capacitor 路线在 `apps/pixuli` 实现（RN 已归档，不再维护）。

| 优先级 | 任务                     | 旅程 ID      | 验收要点                                                 | 状态             |
| ------ | ------------------------ | ------------ | -------------------------------------------------------- | ---------------- |
| **P0** | 批量删除可用性确认       | J6-02        | 窄屏多选 → 删除 2 张 → 列表更新（pixuli 已有，回归即可） | ✅ #178          |
| **P0** | 批量上传入口             | J4-02        | `multiple` + `uploadMultipleImages` + 进度条             | ✅ #178          |
| **P0** | 配置导出 JSON            | J1-06        | GitHub/Gitee Modal 导出；Capacitor 复制剪贴板            | ✅               |
| **P1** | 删除 `filter.tsx` 死路由 | J3-07        | 无隐藏重复页；仅 Photos 搜索入口                         | ✅ RN 死文件已删 |
| **P1** | Gitee 生产代理验证       | J1-02, L3-05 | Android release 包图片可加载                             | ⏳ #166          |
| **P2** | 上传裁剪/压缩默认策略    | J4-05, J4-06 | 与产品确认是否默认开启                                   | 书面降级         |
| **P2** | 主题设置（可选）         | J7-02        | 对齐 RN `ThemeModal` 或书面降级                          | 书面降级         |
| **P2** | pull-to-refresh（可选）  | J2-04        | 与 REF-601「步骤一致」权衡                               | 书面降级         |

父 Issue：[#165](https://github.com/trueLoving/Pixuli/issues/165)

---

## 六、#119 / #120 / #141（REF-516 P4 L3）输入清单

| Issue            | 范围                   | 来自本文                                                                       | 决策摘要                                                                                                                   |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **#119** REF-508 | RN 组件不必迁入清单    | [07-ui-native-migration-assessment.md](./07-ui-native-migration-assessment.md) | ✅ 功能对齐在 pixuli；RN 待 #151 整体归档                                                                                  |
| **#120** REF-510 | Capacitor 原生插件选型 | J4-03, J4-04, J5-05, L3-05                                                     | Camera、Filesystem、Share；`isNativeMobile()` 分支 — ✅ [08-capacitor-native-plugins.md](./08-capacitor-native-plugins.md) |
| **#141** REF-511 | 拍照元数据             | J4-08                                                                          | ✅ EXIF/GPS/localPath → `captureMetadata` / sidecar `capture`                                                              |

**#120 最小插件集（建议）**：

1. `@capacitor/camera` — 拍照 / 相册
2. `@capacitor/filesystem` — 临时文件与路径
3. `@capacitor/share` — 分享
4. （可选）`@capacitor/preferences` — 若需替代 localStorage 边缘场景

---

## 七、#151（REF-513 RN 归档）Checklist 勾选来源

对照 [Issue #151](https://github.com/trueLoving/Pixuli/issues/151)
归档前置条件：

| #151 Checklist 项      | 勾选依据（本文）                                                                                                                                          | 当前状态                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| #118 真机冒烟          | [04-capacitor-android-poc.md §六](./04-capacitor-android-poc.md) · [09-capacitor-android-smoke-acceptance.md](./09-capacitor-android-smoke-acceptance.md) | ⏳ **#166 签收中**（待真机填表）         |
| #120 相机/相册 L3      | §四、§六 #120                                                                                                                                             | ✅ 代码已交付（真机确认 → #166 §2.2）    |
| #141 拍照元数据        | J4-08                                                                                                                                                     | ✅ **#141 已交付**（列表反序列化待后续） |
| #119 仅 RN 能力决策    | §四 + [07-ui-native-migration-assessment.md](./07-ui-native-migration-assessment.md)                                                                      | ✅ **#119 已交付**                       |
| ~~#117~~ store 覆盖 RN | REF-507 取消；pixuli store 为三端 SSOT                                                                                                                    | ✅ **已满足**（#117 已关闭）             |
| Wiki / APK 发版说明    | REF-515 #153                                                                                                                                              | ⏳                                       |
| **功能对齐矩阵 SSOT**  | **本文档**                                                                                                                                                | ✅ **#164 交付**                         |
| P3 业务补齐完成        | §五 #165                                                                                                                                                  | ✅                                       |
| P6 验收冒烟            | #166 · [09-capacitor-android-smoke-acceptance.md](./09-capacitor-android-smoke-acceptance.md)                                                             | ⏳ 待真机                                |

`REFACTOR_PLAN.md` §1.9.2 归档 Checklist 与上表同步。

---

## 八、与 PRD §4.3 / REF-501 交叉索引

| PRD §4.3 能力    | 本文旅程     | pixuli    | RN 现状      | Capacitor 目标 |
| ---------------- | ------------ | --------- | ------------ | -------------- |
| 多仓库源         | J1           | ✅        | ✅           | ✅             |
| 网格/列表 + 预览 | J2           | ✅        | △ 无列表     | ✅             |
| 图片 CRUD 单张   | J5           | ✅        | △ 编辑未接线 | ✅             |
| 批量上传/删除    | J4-02, J6    | ✅        | ❌           | ✅（#165）     |
| 搜索与筛选       | J3           | ✅        | △            | ✅             |
| 操作日志         | J7-03        | ✅        | ✅           | ✅             |
| 相机/相册        | J4-03, J4-04 | △         | ✅           | ✅（#120）     |
| 图片处理工具     | J8           | ✅        | ❌           | ✅             |
| 本地工作区       | J1-08, L3-02 | △ Desktop | —            | ⏳ REF-607     |

PRD 标 Mobile「批量删除 ✅」与 RN **实现不符**
— 以本文为准；Capacitor 以 pixuli 为准达标。

---

## 九、REF-601 核心路径验收映射

| REF-601 §八 路径    | Capacitor 依赖本文                  |
| ------------------- | ----------------------------------- |
| **P1** 配置并浏览   | J1 + J2                             |
| **P2** 上传单张     | J4-01                               |
| **P3** 复制远端链接 | J5-02                               |
| **P4** 批量删除     | J6-02（pixuli 已有，#165 回归窄屏） |

---

## 十、修订记录

| 版本 | 日期       | 说明                                                                  |
| ---- | ---------- | --------------------------------------------------------------------- |
| 1.0  | 2026-05-27 | REF-516 P0 / #164 初稿：旅程矩阵、§三 覆盖、#165/#119/#151 输入清单   |
| 1.1  | 2026-06-25 | #119 链至 12-ui-native-migration-assessment；#165 ✅；filter Tab 已删 |
| 1.2  | 2026-06-16 | #120 ✅：Capacitor Camera/Share；矩阵 §六/§七 更新                    |
| 1.3  | 2026-06-17 | #166：链至 09-capacitor-android-smoke-acceptance.md                   |
