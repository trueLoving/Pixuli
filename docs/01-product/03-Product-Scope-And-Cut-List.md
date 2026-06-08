# 产品范围与裁剪清单

- **文档版本**：1.0
- **创建日期**：2026-05-27
- **关联**：REF-401、[REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) §1.1～§1.2
- **读者**：产品、开发、测试；与 PRD 配套使用

---

## 一、产品底线（不变）

| 项              | 说明                                                                                    |
| --------------- | --------------------------------------------------------------------------------------- |
| **交付形态**    | **Web（含 PWA）**、**Desktop（Electron）**、**Mobile（Expo）** 三端继续维护             |
| **存储后端**    | 以 **GitHub / Gitee 仓库**为图床；通过 `StorageProvider` 插件扩展                       |
| **官方 Server** | **不提供**官方 NestJS / 自建后端为一等公民；`server/` 已归档，仅社区或自建对接          |
| **对外主张**    | 🖼️ Pixuli — **AI-based image analysis, automatic tag generation, and batch processing** |

---

## 二、M1 展示裁剪（已从产品移除）

以下能力在 **M1（REF-101～107）**
已从主应用移除，**不再作为需求验收项**。详细需求与历史实现见
`docs/backlog.md`（REF-402 维护）。

| 已移除能力                       | 说明                                                            |
| -------------------------------- | --------------------------------------------------------------- |
| 幻灯片（Slideshow）              | 独立路由与播放器                                                |
| 时间线（Timeline）               | 按时间分组浏览                                                  |
| 照片墙（Photo Wall）             | 增强展示组件                                                    |
| 3D 画廊（Gallery 3D）            | 增强展示组件                                                    |
| 浏览模式多路由切换               | 文件/幻灯片/时间线 Tab；现统一为 **图床网格/列表**（`/photos`） |
| 占位页 analyze / edit / generate | 未接入主流程的独立路由（重定向至图床）                          |

**当前 Web/Desktop 主导航结构**：图床（`/photos`）· 实用工具（压缩
`/compress`、转换 `/convert`）· 设置。

---

## 三、不在官方范围内的能力

| 项                                 | 处理方式                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `packages/wasm`、WASM IPC          | 已归档至 `archive/`；Web/桌面图片处理以 Canvas 等为主                           |
| `benchmark/`                       | 已归档，非主构建路径                                                            |
| `server/`（NestJS）                | 已移出 workspace；**非官方交付物**                                              |
| `packages/common`（pixuli-common） | M3 REF-311 已删除；由 `@pixuli/core` + `@pixuli/ui` + `@pixuli/provider-*` 替代 |
| 官方 Upyun 等第三方图床            | 非 M3 P0；可经插件扩展，见 backlog                                              |

---

## 四、当前架构与包（产品视角）

```text
apps/pixuli     Web + Desktop 共用（Vite + React + Electron）
apps/mobile     Mobile（Expo + RN，过渡；长期倾向 Capacitor 复用 pixuli，见 M5）
packages/core   类型、工具、StoragePluginRegistry 契约
packages/ui     Web/Desktop 共享 UI（@pixuli/ui）；RN 子路径 ./native
packages/plugin-provider-github | plugin-provider-gitee  官方存储插件
archive/        wasm、benchmark、历史 server（不参与日常构建）
```

---

## 五、规划中能力（与里程碑对应）

| 里程碑 | 产品向交付                                                               | 计划 Issue   |
| ------ | ------------------------------------------------------------------------ | ------------ |
| **M4** | PRD/README/Wiki/CHANGELOG 与现架构一致                                   | REF-401～409 |
| **M5** | PWA 深化、Desktop L3（离线队列、自动更新、托盘）；Capacitor 三端共享 PoC | REF-501～510 |
| **M6** | 三端交互规范、侧栏/主内容/UI 操作优化、性能边界、标签/AI、批处理         | REF-601～605 |

---

## 六、相关文档

- [01-Product-Requirements-Document.md](01-Product-Requirements-Document.md) —
  PRD 主文档
- [02-Pixuli-Usage-Tutorial.md](02-Pixuli-Usage-Tutorial.md)
  — 用户使用教程（REF-408 Wiki 源稿）
- [04-Wiki-Sync-Guide.md](04-Wiki-Sync-Guide.md) —
  Wiki 目录与同步策略（REF-408）
- [07-storage-plugin-system.md](../02-system-design/07-storage-plugin-system.md)
  — 存储插件技术设计
- [backlog.md](../backlog.md) — 已移除/延后需求明细（REF-402）
- [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) — 重构总览与 Issue 追踪

---

_适用分支：重构主线的 `main`；文首版本与 PRD 修订历史同步更新。_
