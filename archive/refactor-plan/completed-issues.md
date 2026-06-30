# 全部已完成 REF Issue（汇总）

> 自 [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) 归档 · 2026-06-17

| ID      | 标题                                                                                           | GitHub                                                  | 状态                                               |
| ------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| REF-101 | [M1] 移除 Web 幻灯片与时间线路由及页面                                                         | [#46](https://github.com/trueLoving/Pixuli/issues/46)   | ✅                                                 |
| REF-102 | [M1] 移除 Web 占位页 analyze / edit / generate                                                 | [#47](https://github.com/trueLoving/Pixuli/issues/47)   | ✅                                                 |
| REF-103 | [M1] 删除 common 增强展示组件（slideshow/timeline/photo-wall/gallery-3d/browse-mode-switcher） | [#48](https://github.com/trueLoving/Pixuli/issues/48)   | ✅                                                 |
| REF-104 | [M1] 移除 pptxgenjs 与幻灯片相关依赖                                                           | [#49](https://github.com/trueLoving/Pixuli/issues/49)   | ✅                                                 |
| REF-105 | [M1] 清理 browseMode 状态与路由同步逻辑                                                        | [#50](https://github.com/trueLoving/Pixuli/issues/50)   | ✅                                                 |
| REF-106 | [M1] 移动端移除浏览模式 Tab 与 SlideShowPlayer                                                 | [#51](https://github.com/trueLoving/Pixuli/issues/51)   | ✅                                                 |
| REF-107 | [M1] 更新 Web 侧栏/菜单为「图床 + 工具 + 设置」结构                                            | [#52](https://github.com/trueLoving/Pixuli/issues/52)   | ✅                                                 |
| REF-108 | [M1] 归档 packages/wasm 与 benchmark                                                           | [#54](https://github.com/trueLoving/Pixuli/issues/54)   | ✅                                                 |
| REF-109 | [M1] 移除 Electron WASM IPC 与 pixuli-wasm 依赖                                                | [#55](https://github.com/trueLoving/Pixuli/issues/55)   | ✅                                                 |
| REF-110 | [M1] 归档 server/ 并移出 pnpm workspace                                                        | [#56](https://github.com/trueLoving/Pixuli/issues/56)   | ✅                                                 |
| REF-111 | [M1] 删除 performance 与 devtools 未接入模块                                                   | [#57](https://github.com/trueLoving/Pixuli/issues/57)   | ✅                                                 |
| REF-112 | [M1] M1 回归：web / desktop / mobile 冒烟 + vitest                                             | [#58](https://github.com/trueLoving/Pixuli/issues/58)   | ✅                                                 |
| REF-201 | [M2] 新建 @pixuli/core 包（types/utils/platform/operationLog）                                 | [#60](https://github.com/trueLoving/Pixuli/issues/60)   | ✅                                                 |
| REF-202 | [M2] 新建 @pixuli/ui 包（web 入口 + native 子路径）                                            | [#61](https://github.com/trueLoving/Pixuli/issues/61)   | ✅                                                 |
| REF-203 | [M2] 迁移 L1/L2 组件至 ui（不含已删展示组件）                                                  | [#62](https://github.com/trueLoving/Pixuli/issues/62)   | ✅                                                 |
| REF-204 | [M2] webImageProcessor 与 toast 迁入 ui                                                        | [#69](https://github.com/trueLoving/Pixuli/issues/69)   | ✅                                                 |
| REF-205 | [M2] index.native 停止导出 webImageProcessor                                                   | [#63](https://github.com/trueLoving/Pixuli/issues/63)   | ✅                                                 |
| REF-206 | [M2] apps/pixuli 切换为 @pixuli/core + @pixuli/ui                                              | [#64](https://github.com/trueLoving/Pixuli/issues/64)   | ✅                                                 |
| REF-207 | [M2] apps/mobile 切换 import（core + ui/native）                                               | [#65](https://github.com/trueLoving/Pixuli/issues/65)   | ✅                                                 |
| REF-208 | [M2] 保留 pixuli-common 兼容 re-export（deprecated）                                           | [#66](https://github.com/trueLoving/Pixuli/issues/66)   | ✅                                                 |
| REF-209 | [M2] ESLint 边界：禁止 core→ui、provider→ui                                                    | [#67](https://github.com/trueLoving/Pixuli/issues/67)   | ✅                                                 |
| REF-210 | [M2] M2 回归与删除空壳 packages/common                                                         | [#68](https://github.com/trueLoving/Pixuli/issues/68)   | ✅                                                 |
| REF-301 | [M3] 在 core 定义 StorageProvider 与 Registry                                                  | [#70](https://github.com/trueLoving/Pixuli/issues/70)   | ✅                                                 |
| REF-302 | [M3] 实现 @pixuli/provider-github                                                              | [#71](https://github.com/trueLoving/Pixuli/issues/71)   | ✅                                                 |
| REF-303 | [M3] 实现 @pixuli/provider-gitee                                                               | [#72](https://github.com/trueLoving/Pixuli/issues/72)   | ✅                                                 |
| REF-304 | [M3] 重构 apps/pixuli imageStore 使用 Registry                                                 | [#73](https://github.com/trueLoving/Pixuli/issues/73)   | ✅                                                 |
| REF-305 | [M3] 重构 apps/mobile imageStore 使用 Registry                                                 | [#74](https://github.com/trueLoving/Pixuli/issues/74)   | ✅                                                 |
| REF-306 | [M3] 配置持久化增加 pluginId（导入/导出）                                                      | [#75](https://github.com/trueLoving/Pixuli/issues/75)   | ✅                                                 |
| REF-307 | [M3] 设置页源列表对接 registry.listManifests                                                   | [#76](https://github.com/trueLoving/Pixuli/issues/76)   | ✅                                                 |
| REF-308 | [M3] 编写插件开发文档（现合并于 03-plugin-system §第二部分）                                   | [#77](https://github.com/trueLoving/Pixuli/issues/77)   | ✅                                                 |
| REF-309 | [M3] provider 包单元测试迁移                                                                   | [#78](https://github.com/trueLoving/Pixuli/issues/78)   | ✅                                                 |
| REF-310 | [M3] M3 回归：GitHub/Gitee 全流程                                                              | [#79](https://github.com/trueLoving/Pixuli/issues/79)   | ✅                                                 |
| REF-311 | [M3] 删除 `packages/common` 整包                                                               | [#100](https://github.com/trueLoving/Pixuli/issues/100) | ✅                                                 |
| REF-312 | [Bug] 编辑仓库源时配置表单未回显                                                               | [#109](https://github.com/trueLoving/Pixuli/issues/109) | ✅                                                 |
| REF-313 | [Bug] Gitee 源图片 CORS / 代理导致无法加载                                                     | [#123](https://github.com/trueLoving/Pixuli/issues/123) | ✅                                                 |
| REF-401 | [M4] 更新 PRD：三端底线、展示裁剪、无官方 Server                                               | [#80](https://github.com/trueLoving/Pixuli/issues/80)   | ✅                                                 |
| REF-402 | [M4] 新增 docs/04-backlog.md 承接已移除/未做需求                                               | [#81](https://github.com/trueLoving/Pixuli/issues/81)   | ✅                                                 |
| REF-403 | [M4] 更新 README 结构、环境要求、维护范围                                                      | [#82](https://github.com/trueLoving/Pixuli/issues/82)   | ✅                                                 |
| REF-404 | [M4] 更新 CHANGELOG 记录 Breaking Changes                                                      | [#83](https://github.com/trueLoving/Pixuli/issues/83)   | ✅                                                 |
| REF-405 | [M4] CI：移除 benchmark workflow；desktop 构建去掉 wasm                                        | [#84](https://github.com/trueLoving/Pixuli/issues/84)   | ✅                                                 |
| REF-406 | [M4] archive/README 说明 wasm/server 归档策略                                                  | [#85](https://github.com/trueLoving/Pixuli/issues/85)   | ✅                                                 |
| REF-407 | [M4] 梳理整理 `docs/` 目录（纠错、去重、与现架构对齐）                                         | [#111](https://github.com/trueLoving/Pixuli/issues/111) | ✅                                                 |
| REF-408 | [M4] 梳理 GitHub Wiki 产品使用手册（新人从零上手）                                             | [#112](https://github.com/trueLoving/Pixuli/issues/112) | ✅                                                 |
| REF-409 | [M4] 历史发布版本梳理与后续版本发布策略                                                        | [#113](https://github.com/trueLoving/Pixuli/issues/113) | ✅                                                 |
| REF-410 | [M4] 技术栈梳理：TypeScript / JavaScript 统一策略                                              | [#125](https://github.com/trueLoving/Pixuli/issues/125) | ✅                                                 |
| REF-414 | [M4] AI 编程辅助：Agent 规则与 Skill 文件体系                                                  | [#129](https://github.com/trueLoving/Pixuli/issues/129) | ✅                                                 |
| REF-506 | [M5] 三端代码共享：现状盘点与分层差距文档                                                      | [#116](https://github.com/trueLoving/Pixuli/issues/116) | ✅                                                 |
| REF-508 | [M5] @pixuli/ui：L1/L2 组件 native 迁入评估清单                                                | [#119](https://github.com/trueLoving/Pixuli/issues/119) | ✅                                                 |
| REF-509 | [M5] Capacitor Android PoC：apps/pixuli Web 壳 + APK                                           | [#118](https://github.com/trueLoving/Pixuli/issues/118) | ✅                                                 |
| REF-510 | [M5] Capacitor 原生能力插件与 Web 运行时分支                                                   | [#120](https://github.com/trueLoving/Pixuli/issues/120) | ✅                                                 |
| REF-511 | [M5] 移动端拍照采集元数据（时间/文件/EXIF/位置/localPath）                                     | [#141](https://github.com/trueLoving/Pixuli/issues/141) | ✅                                                 |
| REF-512 | [M5] apps/pixuli 移动端 Web UI 适配（窄屏/安全区/触控）                                        | [#150](https://github.com/trueLoving/Pixuli/issues/150) | ✅                                                 |
| REF-513 | [M5] apps/mobile 功能对齐清单与 RN 工程归档                                                    | [#151](https://github.com/trueLoving/Pixuli/issues/151) | ✅ RN 已归档；Capacitor APK 安装说明已写入用户手册 |
| REF-514 | [M5] apps/pixuli 三端融合工程整理（目录/脚本/多目标构建）                                      | [#152](https://github.com/trueLoving/Pixuli/issues/152) | ✅ follow-up: layouts/vite 插件                    |
| REF-515 | [M5] CI/CD 三端单工程流水线（含 Android APK 发版）                                             | [#153](https://github.com/trueLoving/Pixuli/issues/153) | ✅                                                 |
| REF-516 | [三端融合] 以 Web/PC 为 SSOT 的 Mobile 功能对齐（总览）                                        | [#163](https://github.com/trueLoving/Pixuli/issues/163) | ✅ P0～P7                                          |
| REF-601 | [M6] 三端融合交互设计（统一体验与差异适配）                                                    | [#130](https://github.com/trueLoving/Pixuli/issues/130) | ✅                                                 |
| REF-607 | [M6] 本地工作区 + 远端同步与多形态 URL（Obsidian 式）                                          | [#144](https://github.com/trueLoving/Pixuli/issues/144) | ✅ P0～P7                                          |
