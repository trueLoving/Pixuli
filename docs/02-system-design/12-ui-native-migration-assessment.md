# @pixuli/ui L1/L2 与 RN 组件迁入评估（REF-508）

> **Issue**：[#119](https://github.com/trueLoving/Pixuli/issues/119) ·
> **计划编号**：REF-508  
> **父追踪**：[REF-516 P4](https://github.com/trueLoving/Pixuli/issues/163) ·
> [里程碑 #8](https://github.com/trueLoving/Pixuli/milestone/8)  
> **关联**：[09-cross-platform-sharing-matrix.md](./09-cross-platform-sharing-matrix.md) §三 ·
> [11-mobile-feature-parity-matrix.md](./11-mobile-feature-parity-matrix.md) §四

---

## 一、结论（执行摘要）

| 项                           | 决议                                                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **现阶段工作**               | **仅功能对齐**：在 `apps/pixuli`（Capacitor）补齐与 Web/Desktop 一致的用户能力（见 [11-mobile-feature-parity-matrix.md](./11-mobile-feature-parity-matrix.md)） |
| **Mobile 主路线**            | Capacitor 壳 + `@pixuli/ui` **web**；对齐验收以 pixuli 为准（#166）                                                                                             |
| **RN `archive/apps/mobile`** | **已归档**；`components/`、stores、屏幕在 `archive/apps/mobile/` 只读参考                                                                                       |
| `**@pixuli/ui/native`\*\*    | 仅被 RN 引用；Capacitor **零依赖**；随 #151 **与 RN 一并归档/删除**，不在过渡期单独演进                                                                         |
| **L3 缺口**                  | 在 pixuli 侧用 Capacitor 插件补齐（**#120** / **#141**），**不在 RN 实现**                                                                                      |

**验收（#119）**：明确「对齐在 Capacitor、RN 直接归档」边界；无「应在 RN 补做或迁 UI」的 L2 项。

**产品原则**：功能对齐 = 让用户在 Capacitor
Android 上完成与窄屏 Web 等价的旅程；**不是**让 RN 与 pixuli 代码趋同。

---

## 二、评估维度说明

| 标注                  | 含义                                                       | 现阶段动作                               |
| --------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| **功能对齐**          | pixuli / Capacitor 须达到的能力；Web 已有或 #120/#141 补齐 | 只在 `apps/pixuli` 实现或验收            |
| **RN 归档**           | `archive/apps/mobile` 与 `@pixuli/ui/native` 中的重复实现  | **已完成**（REF-513）                    |
| **需 Capacitor 插件** | 原生能力，非 React 组件                                    | `isNativeMobile()` + 插件（#120 / #141） |

> **不做**：向 RN 迁入 Web 组件、在 RN 修 parity、维护 `./native` 新能力。

---

## 三、L2 组件对照：`@pixuli/ui` web ↔ `apps/mobile`

| L2 能力           | `@pixuli/ui` web                           | `apps/mobile`（归档，不维护） | Capacitor 对齐目标 | 决策                    |
| ----------------- | ------------------------------------------ | ----------------------------- | ------------------ | ----------------------- |
| 空态引导          | `EmptyState`                               | `@pixuli/ui/native`           | web `EmptyState`   | **功能对齐** ✅         |
| 图片网格/列表     | `ImageBrowser` / `ImageGrid` / `ImageList` | 重复实现                      | web 组件           | **功能对齐** ✅         |
| 全屏预览          | `ImagePreviewModal`                        | `ImageBrowser` 内嵌           | web                | **功能对齐** ✅         |
| 单张/批量上传     | `ImageUpload` / `ImageUploadModal`         | `ImageUploadEditModal` 等     | web Modal          | **功能对齐** ✅（#165） |
| 批量删除          | `ImageBatchDeleteModal`                    | —                             | web                | **功能对齐** ✅（#165） |
| GitHub/Gitee 配置 | `*ConfigModal`                             | `StorageConfigModal`          | web Modal          | **功能对齐** ✅         |
| 多源类型选择      | `SourceTypeMenu`                           | `AddSourceModal`              | pixuli 特性层      | **功能对齐** ✅         |
| 搜索/筛选 UI      | `Search` + `SearchContext`                 | `SearchAndFilter`             | web + Context      | **功能对齐** ✅         |
| 侧栏/抽屉导航     | `Sidebar` + 窄屏抽屉                       | `DrawerMenu`                  | web 布局           | **功能对齐** ✅（#150） |
| 版本信息          | `VersionInfoModal` web                     | native 版                     | web                | **功能对齐** ✅         |
| 键盘帮助          | `KeyboardHelpModal`                        | —                             | web（可选隐藏）    | **功能对齐** ✅         |
| 操作日志          | `OperationLogModal`                        | 重复 Modal                    | pixuli 特性层      | **功能对齐** ✅         |
| 主题/语言         | `LanguageSwitcher` 等                      | `ThemeModal` 等               | 语言 ✅；主题降级  | **功能对齐** / 降级     |
| 帮助文档          | —                                          | `HelpModal`                   | Wiki 占位          | 低优                    |
| 图片编辑元数据    | 预览内操作                                 | 未接线                        | web                | **功能对齐** ✅         |
| 上传裁剪          | `ImageCropModal`（默认关）                 | expo manipulator              | 可选 web           | 降级                    |
| Demo 模式         | `Demo` web                                 | —                             | web                | 开发用                  |

RN 列仅作归档对照；**不在 RN 侧做任何补齐**。

---

## 四、L3 能力（非 L2 组件，须插件）

摘自
[11-mobile-feature-parity-matrix.md §四](./11-mobile-feature-parity-matrix.md#四rn-独有能力决策表119-ref-508-输入)：

| 能力                    | 决策                        | Issue   |
| ----------------------- | --------------------------- | ------- |
| 相机拍照                | **需 Capacitor 插件**       | #120    |
| 相册多选                | **需 Capacitor 插件**       | #120    |
| 保存到系统相册          | **需 Capacitor 插件**       | #120    |
| 分享图片文件            | **需 Capacitor 插件**       | #120    |
| 拍照 EXIF/GPS/localPath | **需 Capacitor 插件** + DTO | #141    |
| 触觉反馈                | **放弃**                    | —       |
| `metadataCache`（RN）   | **延期**（本地库统一后）    | REF-607 |

---

## 五、RN 与 `@pixuli/ui/native`（直接归档）

### 5.1 原则

- **现阶段**：不在 `apps/mobile` 或 `./native`
  投入对齐开发；仅保留仓库内只读对照（必要时）。
- **#151**：`apps/mobile` 整包 + `packages/ui/src/**/native` +
  `exports["./native"]` **一并**迁入 `archive/` 或删除，无渐进迁移。

### 5.2 当前 RN 对 `./native` 的引用（归档时删除即可）

| 符号               | RN 引用处                             | Capacitor 已用         |
| ------------------ | ------------------------------------- | ---------------------- |
| `EmptyState`       | `apps/mobile/app/(tabs)/index.tsx`    | web `EmptyState`       |
| `VersionInfoModal` | `apps/mobile/app/(tabs)/settings.tsx` | web `VersionInfoModal` |
| `DemoNative` 等    | 可选                                  | web `Demo`             |

### 5.3 `apps/mobile/components/`\*\*（归档清单，不迁 Capacitor）

```text
components/image/*           → 已由 pixuli ImageBrowser / ImageUpload 对齐
components/search/*          → SearchContext + @pixuli/ui Search
components/navigation/*      → pixuli Sidebar / 窄屏抽屉
components/settings/modals/*   → @pixuli/ui config modals + pixuli 特性 Modal
components/ui/*              → RN 专属；归档后删除
```

#151 执行时按上表整体移动，**不要求**逐项在 RN 侧收尾或删改（除已发生的死代码清理如
`filter.tsx`）。

---

## 六、`apps/mobile` 屏幕级映射

| RN 屏幕             | Capacitor 对齐  | 说明            |
| ------------------- | --------------- | --------------- |
| `(tabs)/index`      | `/photos`       | RN 归档，不对齐 |
| `(tabs)/settings`   | pixuli 侧栏设置 | 同上            |
| ~~`(tabs)/filter`~~ | Photos 内嵌搜索 | 已删 (#165)     |

---

## 七、与下游 Issue 的引用关系

| Issue               | 引用本文                         |
| ------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| **#120** REF-510    | §四；仅在 pixuli 接插件          | ✅ [13-capacitor-native-plugins.md](./13-capacitor-native-plugins.md)                  |
| **#141** REF-511    | §四；Capacitor 上传链            | ✅ [13-capacitor-native-plugins.md §6](./13-capacitor-native-plugins.md)               |
| **#151** REF-513    | §五 RN / `./native` **整体归档** |
| **#166** REF-516 P6 | 冒烟以 pixuli 为准               | [14-capacitor-android-smoke-acceptance.md](./14-capacitor-android-smoke-acceptance.md) |

---

## 八、REF-507 / store 说明（边界）

本评估界定 L2 **功能对齐范围**（Capacitor）与 RN **归档范围**。#119
**不**要求合并 store（REF-507 已取消）。Capacitor 用 `apps/pixuli` store；RN
store 随 #151 归档，**不做**双写或对齐。

---

## 九、修订记录

| 版本 | 日期       | 说明                                                              |
| ---- | ---------- | ----------------------------------------------------------------- |
| 1.0  | 2026-06-25 | REF-508 / #119 初稿                                               |
| 1.1  | 2026-06-25 | 明确：现阶段仅 Capacitor 功能对齐；RN/`./native` 待 #151 直接归档 |
