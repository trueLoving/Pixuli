# REF-602 UI 差距清单（对照 REF-601）

> **Issue**：[#131](https://github.com/trueLoving/Pixuli/issues/131) ·
> **计划编号**：REF-602  
> **交互 SSOT**：[04-three-platform-interaction-spec.md](../01-product/04-three-platform-interaction-spec.md)（REF-601 ✅）  
> **最后核对**：2026-06-16
> · 分支 `feat/ref-602-ui-131-p1`

本文对照 REF-601 记录 `apps/pixuli` + `@pixuli/ui`
**当前实现与目标差距**，供 #131 分 PR 签收。

---

## 一、侧栏（§3.1、§6.1）

| REF-601 要求                     | 现状（核对日）                                                | 差距 / 本 Issue 动作                                                       |
| -------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 一级：图床 / 工具 / 设置分区清晰 | 曾合并为单一「功能」；压缩/转换曾被 `TEMPORARILY_HIDDEN` 隐藏 | ✅ 侧栏 **工作区** 独立菜单 + `/workspace` 页；设置含同步/快捷键/版本/文档 |
| 窄屏汉堡 + 抽屉侧栏              | `mobileSidebarOpen` + overlay 已实现                          | ✅ 维持                                                                    |
| Desktop 可折叠                   | `sidebarCollapsed` + 72px 图标栏                              | ✅ 维持                                                                    |
| 当前源/工作区可见                | 远端源在设置「同步」表格；工作区在侧栏「工作区」菜单          | ✅ 本 PR                                                                   |
| 操作日志入口                     | Header 图标 + `Ctrl+Shift+L`                                  | ✅ 维持                                                                    |

---

## 二、主内容区 `/photos`（§3.2）

| REF-601 要求                          | 现状                                                     | 差距 / 动作                              |
| ------------------------------------- | -------------------------------------------------------- | ---------------------------------------- |
| 工具栏：搜索/筛选/排序/视图/上传/批量 | `ImageBrowser` 工具栏 + `SearchContext`                  | ✅ 基本齐全                              |
| 窄屏工具栏不重复标题统计              | `ImageContent` 与 `ImageBrowser` 双标题                  | ✅ 本 PR：窄屏隐藏 `image-content-stats` |
| 空态 / 加载 / 错误 + 重试             | `ContentFeedback` + `ImageLibraryEmpty` + 工具栏加载指示 | ✅ P1：统一空态/错误/重试与工具栏样式    |
| 虚拟滚动 / 分页（REF-603）            | 全量渲染                                                 | ⏳ #132 专责                             |

---

## 三、图片操作（§4、§6.3）

| 能力                  | 现状                       | 差距 / 动作                                   |
| --------------------- | -------------------------- | --------------------------------------------- |
| 预览 + 元数据 + 删除  | `ImagePreviewModal`        | ✅                                            |
| 复制链接              | `useImageCopyUrl` / 分享   | ✅ local + remote                             |
| 批量多选删除          | `BatchDeleteModal`         | ✅                                            |
| 右键 / 长按菜单项一致 | Web 右键；触控长按部分支持 | ⏳ 收敛为 `@pixuli/ui` 统一 `ImageActionMenu` |
| 3 次点击内达核心操作  | 预览约 1 击；删除 2～3 击  | ⏳ 预览层操作条布局优化                       |
| AI 分析               | 仅 Desktop Electron        | ⏳ REF-604                                    |

---

## 四、本 Issue 分阶段建议

| 阶段 | 范围                                               | 状态     |
| ---- | -------------------------------------------------- | -------- |
| P0   | 本文差距清单 + 侧栏 IA（图床/工具/设置）+ 窄屏去重 | ✅ #196  |
| P1   | 主内容工具栏视觉统一、空态/错误态                  | ⏳ 本 PR |
| P2   | 图片操作收敛 `@pixuli/ui`、预览层操作条            | 待办     |
| P3   | Before/After 截图、REF-413 冒烟路径                | 待办     |

---

## 五、相关文档

- [04-three-platform-interaction-spec.md](../01-product/04-three-platform-interaction-spec.md)
- [06-apps-pixuli-engineering.md](./06-apps-pixuli-engineering.md)
- [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) — REF-602 / #131
