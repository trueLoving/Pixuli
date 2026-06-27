# Pixuli 产品 Backlog（已移除 / 未做 / 延后）

- **文档版本**：1.0
- **创建日期**：2026-05-27
- **维护**：REF-402；与
  [REFACTOR_PLAN.md](../REFACTOR_PLAN.md)、[产品需求规格说明书](01-product/01-product-requirements-specification.md)
  配套
- **读者**：产品、开发、协作者；承接**不在当前主线**的需求，避免 PRD 与系统设计文档混杂历史项

---

## 如何使用本文档

| 状态标签      | 含义                                                               |
| ------------- | ------------------------------------------------------------------ |
| **已移除**    | M1 等已从代码删除，**不计划恢复**（见 REFACTOR_PLAN §五）          |
| **不做**      | 产品/架构明确排除，非排期遗漏                                      |
| **已归档**    | 代码在 `archive/`，非日常构建                                      |
| **延后**      | 仍可能做，已有里程碑或 Issue；细节以 PRD §4.10/§4.11 与 M5/M6 为准 |
| **社区/插件** | 官方不做一等公民，可由插件或 fork 实现                             |

新增条目：注明来源 PRD ID（如有）、关联 Issue、一句话原因。

---

## 一、已移除（M1，不恢复）

> 摘要见
> [01-product-requirements-specification.md](01-product/01-product-requirements-specification.md)
> §二。

| 能力                               | 说明                                 | 计划/Issue  |
| ---------------------------------- | ------------------------------------ | ----------- |
| 幻灯片（Slideshow）                | 独立路由、播放器、自动轮播           | REF-101 #46 |
| 时间线（Timeline）                 | 按时间分组浏览                       | REF-101 #46 |
| 照片墙（Photo Wall）               | 增强展示组件                         | REF-103 #48 |
| 3D 画廊（Gallery 3D）              | 增强展示组件                         | REF-103 #48 |
| 浏览模式多 Tab                     | 文件/幻灯片/时间线侧栏切换           | REF-105 #50 |
| 占位页 analyze / edit / generate   | 未接入主流程；路由重定向至 `/photos` | REF-102 #47 |
| 移动端幻灯片 Tab / SlideShowPlayer | 与 Web 展示裁剪一致                  | REF-106 #51 |
| pptxgenjs 等幻灯片依赖             | 随展示裁剪移除                       | REF-104 #49 |
| performance 未接入模块             | UI 性能演示，未产品化                | REF-111 #57 |
| devtools 未接入模块                | 开发调试组件，未产品化               | REF-111 #57 |

**历史业务/设计文档**：`docs/03-business-design/`
早期草稿已移除；幻灯片/时间线等裁剪说明见本节上表与
[03-business-design/01-readme.md](03-business-design/01-readme.md)。

---

## 二、明确不做（Won't Do）

与 [REFACTOR_PLAN.md §五](../REFACTOR_PLAN.md) 一致。

| 项                                                 | 说明                           |
| -------------------------------------------------- | ------------------------------ |
| 恢复 Slideshow / Timeline / PhotoWall / 3D Gallery | 产品聚焦图床 L2（网格/列表）   |
| 取消 Mobile 或 Desktop 任一交付端                  | 三端为底线                     |
| 官方 NestJS Server 为一等公民                      | 图床客户端定位；见 §三         |
| 主仓库 WASM 为**必需**构建路径                     | 已归档；见 §四                 |
| 官方维护 Upyun / 又拍云等第三方图床                | M3 P0 仅 GitHub/Gitee 官方插件 |

---

## 三、官方 Server（已移出，仅社区/自建）

`server/` 已归档，**非**官方交付。历史 PRD
§4.12 中的服务端能力仅作 backlog 记录，供社区或自建对接参考：

| 原需求 ID       | 能力概要                                    | 备注                     |
| --------------- | ------------------------------------------- | ------------------------ |
| F-SERVER-01     | MCP Server                                  | 非官方                   |
| F-SERVER-02     | 中心化图片仓库 API                          | 与 Git 仓库图床定位冲突  |
| F-SERVER-03     | JWT / RBAC 认证                             | 自建场景自选             |
| F-SERVER-04～16 | 智能搜索、任务队列、Redis、监控、GraphQL 等 | 见归档 `archive/server/` |

**客户端默认路径**：仅 `StorageProvider` + GitHub/Gitee 插件。若需 HTTP
API 图床，请实现独立 Provider 或社区 fork，不在本仓库 P0 排期。

---

## 四、已归档技术路径

| 路径              | 原用途                           | 现状                                                               |
| ----------------- | -------------------------------- | ------------------------------------------------------------------ |
| `packages/wasm`   | Rust WASM 图片处理、Electron IPC | `archive/wasm/`；Web/桌面以 Canvas 等为主                          |
| `benchmark/`      | WASM vs JS 性能对比              | `archive/benchmark/`                                               |
| `server/`         | NestJS 可选后端                  | `archive/server/` 或移出 workspace                                 |
| `packages/common` | 旧共享包 pixuli-common           | REF-311 已删；由 `@pixuli/core` + `@pixuli/ui` + `provider-*` 替代 |

远期「高性能处理」可走独立 Processor 插件，非恢复 WASM 主路径。

---

## 五、延后 / 规划中（仍可能实现）

以下**未删除**，但不在 M3 主线；以 PRD 与里程碑 Issue 为准。

### 5.1 M5 — 平台能力 L3

| 方向                       | 代表需求（PRD） | Issue                      |
| -------------------------- | --------------- | -------------------------- |
| Desktop 离线浏览与上传队列 | F-WEB-DESK-06   | REF-503 #88                |
| Desktop 自动更新           | F-WEB-DESK-16   | REF-504 #89                |
| Desktop 系统托盘           | F-WEB-DESK-17   | REF-505 #90                |
| Capacitor 三端共享         | —               | REF-509 #118、REF-510 #120 |
| PWA / L3 能力矩阵文档      | —               | REF-501 #86                |

### 5.2 M6 — 产品体验与能力边界

| 方向                        | 代表需求（PRD）              | Issue        |
| --------------------------- | ---------------------------- | ------------ |
| 三端融合交互规范            | —                            | REF-601 #130 |
| 侧栏 / 主内容 / 图片操作 UI | F-WEB-DESK-02～03 等         | REF-602 #131 |
| 大规模列表性能边界          | F-WEB-DESK-14、NF-PERF-04    | REF-603 #132 |
| 标签/描述 + AI 自动分析     | F-WEB-DESK-08、F-CRUD-U02    | REF-604 #133 |
| 图片批处理增强              | F-CRUD-U02、batch processing | REF-605 #134 |

### 5.3 PRD 中仍为 ⏳ 的其它项（未单独开 Issue 时）

| 类别          | 示例 ID                      | 说明                                                     |
| ------------- | ---------------------------- | -------------------------------------------------------- |
| 搜索增强      | F-SEARCH-04                  | 高级搜索、历史                                           |
| Web 工具页    | F-TOOL-CVT/CMP/EDT-01        | 压缩/转换/编辑页逻辑待补全                               |
| 图片分析/生成 | F-TOOL-ANZ-01、F-TOOL-GEN-01 | Dify 集成设计待功能开发后补充（原 `05-Dify` 文档已移除） |
| 体验增强      | F-WEB-DESK-04～05、07～15    | 私有仓库、错误处理、手势、收藏、统计等                   |
| 移动端扩展    | F-MOBILE-02～16              | 批量元数据、布局、离线等                                 |
| PWA           | F-PWA-04                     | 更新检测待完善                                           |

完整列表见
[01-product-requirements-specification.md](01-product/01-product-requirements-specification.md)
§4.10～§4.11；新能力优先挂 M5/M6 Issue 再改 PRD。

---

## 六、存储与集成扩展（非官方 P0）

| 项                                            | 说明                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 第三方图床 Provider（Upyun、S3、自建 API 等） | 实现 `StorageProvider` 后注册；见 [03-plugin-system §第二部分](02-system-design/03-plugin-system.md#第二部分-存储插件开发指南) |
| 插件热加载 / 远程安装                         | REFACTOR_PLAN Backlog #102                                                                                                     |
| 社区 MCP / Server 对接                        | 见 §三                                                                                                                         |

---

## 七、相关文档

| 文档                                                                                                       | 关系                      |
| ---------------------------------------------------------------------------------------------------------- | ------------------------- |
| [01-product/01-product-requirements-specification.md](01-product/01-product-requirements-specification.md) | 基线产品需求与范围        |
| [01-product/02-product-user-manual.md](01-product/02-product-user-manual.md)                               | 产品使用手册（Wiki 源稿） |
| [REFACTOR_PLAN.md](../REFACTOR_PLAN.md)                                                                    | 里程碑与 Issue 追踪       |
| [docs/README.md](README.md)                                                                                | 文档索引                  |

---

## 修订历史

| 版本 | 日期       | 变更                                                                 |
| ---- | ---------- | -------------------------------------------------------------------- |
| 1.0  | 2026-05-27 | REF-402 初稿：承接 M1 移除、Won't Do、Server/WASM 归档、M5/M6 延后项 |
