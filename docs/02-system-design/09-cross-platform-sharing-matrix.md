# 三端代码共享矩阵（现状盘点）

- **文档版本**：1.0
- **计划编号**：REF-506（M5）
- **关联 Issue**：[#116](https://github.com/trueLoving/Pixuli/issues/116)
- **相关文档**：
  - [02-Three-Platform-Design.md](./02-Three-Platform-Design.md)
    — 方案 A（Capacitor）/ C（双应用过渡）
  - [01-Three-Platform-Capability-Sharing.md](./01-Three-Platform-Capability-Sharing.md)
    — 资源共享与 L1/L2/L3 分层
  - [04-Plugin-System.md](./04-Plugin-System.md) —
    `StoragePluginRegistry`、多源持久化
  - PRD
    [§4.3 平台能力矩阵](../01-product/01-Product-Requirements-Specification.md#43-平台能力矩阵)
    — 产品向 L3 能力（REF-501 / #86）

> **说明**：Issue #116 初稿曾引用
> `06-unified-app-mobile-integration.md`；该编号已用于
> [06-Plugin-Host-Integration.md](./06-Plugin-Host-Integration.md)（REF-411）。**Mobile 融入
> `apps/pixuli` 的技术路线**以 **02-Three-Platform-Design** 为准。

---

## 一、盘点范围与方法

对照 `REFACTOR_PLAN.md` **§1.4.1**，对 `apps/pixuli`（Web + Desktop）与
`apps/mobile`（Expo RN）做**模块级**标注：

| 标注            | 含义                                                                  |
| --------------- | --------------------------------------------------------------------- |
| **共享**        | 已在 `@pixuli/core` / `@pixuli/ui` / `provider-*`，或两端文件实质相同 |
| **Web+Desktop** | 仅 `apps/pixuli`（Electron 与 Web 共用）                              |
| **Mobile**      | 仅 `apps/mobile`                                                      |
| **重复**        | 两端各有一份实现，行为应对齐但代码未合并                              |
| **可合并**      | 建议迁入 `@pixuli/core` 或 `packages/app-shared`（REF-507）           |
| **仅 L3**       | 平台能力，不强行塞进 core                                             |

**盘点日期**：2026-05-27 · 基线：`main`（REF-411/416 合并后）

---

## 二、架构总览

```text
┌─────────────────────────────────────────────────────────────────┐
│  apps/pixuli（Vite + React）     Web + Desktop 同一 UI 源码       │
├─────────────────────────────────────────────────────────────────┤
│  apps/mobile（Expo + RN）        独立 UI；共享 core / provider    │
├─────────────────────────────────────────────────────────────────┤
│  已共享：@pixuli/core、@pixuli/provider-*、Registry、类型、i18n 基座 │
│  仍分叉：imageStore / sourceStore、导航、RN 组件、部分持久化 key    │
└─────────────────────────────────────────────────────────────────┘
```

| 层级         | Web + Desktop                 | Mobile                                      | 共享程度         |
| ------------ | ----------------------------- | ------------------------------------------- | ---------------- |
| **L3 平台**  | Electron、PWA、`localStorage` | Expo、AsyncStorage、相机/相册               | 各端独立（预期） |
| **L2 UI**    | `@pixuli/ui` web              | `components/` + `@pixuli/ui/native`（极少） | **低**           |
| **L1 业务**  | `stores/` + `hooks/`          | `stores/` + 屏幕内联                        | **中**           |
| **基础设施** | `@pixuli/core`、`provider-*`  | 同上                                        | **高**           |

**路线决策**（见 02 §五）：**主路线 A — Capacitor**（`apps/pixuli`
dist + 原生壳）；**过渡 C
— 双应用 + 加深 L1 共享**（本矩阵服务 REF-507～509，在 A 未落地前避免双份改逻辑）。

---

## 三、共享矩阵（模块 / 目录级）

### 3.1 状态与数据（Stores）

| 模块            | pixuli                                | mobile                            | 标注                  | 后续 Issue                     |
| --------------- | ------------------------------------- | --------------------------------- | --------------------- | ------------------------------ |
| **imageStore**  | `src/stores/imageStore.ts` (~618 行)  | `stores/imageStore.ts` (~1007 行) | **重复** · **可合并** | REF-507 #117                   |
| **sourceStore** | `src/stores/sourceStore.ts` (~136 行) | `stores/sourceStore.ts` (~134 行) | **重复** · **可合并** | REF-507 #117                   |
| **uiStore**     | `src/stores/uiStore.ts` (~169 行)     | —                                 | **Web+Desktop**       | Capacitor 后自然覆盖 Mobile UI |
| **logStore**    | `src/stores/logStore.ts` (~173 行)    | `stores/logStore.ts` (~160 行)    | **重复** · **可合并** | REF-507（低优先级）            |

**imageStore 关键差异**

| 能力                     | Web+Desktop                    | Mobile               | 备注                                       |
| ------------------------ | ------------------------------ | -------------------- | ------------------------------------------ |
| `deleteMultipleImages`   | ✅                             | ❌ store 无此方法    | PRD §4.3 标 Mobile 批量删除 — **实现缺口** |
| 搜索/筛选状态            | `SearchContext` + `useUIState` | 内嵌 store           | 架构分叉                                   |
| 初始化                   | 构造时 sync 加载配置           | `initialize()` async | 合并时需统一生命周期                       |
| 列表刷新 / Provider 调用 | 已对齐 Registry                | 已对齐 Registry      | 行为一致，实现双份                         |

**sourceStore 关键差异**

| 项         | Web+Desktop                       | Mobile               |
| ---------- | --------------------------------- | -------------------- | ------------------------ |
| 持久化 API | `localStorage` sync               | `AsyncStorage` async |
| 存储 key   | `pixuli.sources.v3`（含 v2 迁移） | `pixuli.sources.v2`  | **需统一**（REF-507 P0） |
| 核心模型   | `@pixuli/core/sources`            | 同上                 | **共享**                 |

### 3.2 Hooks 与业务流程

| 模块                                                   | pixuli                                  | mobile                                       | 标注                                |
| ------------------------------------------------------ | --------------------------------------- | -------------------------------------------- | ----------------------------------- |
| `useImageOperations`                                   | `hooks/useImageOperations.ts`           | —                                            | **Web+Desktop**                     |
| `useSourceManagement`                                  | `hooks/useSourceManagement.ts`          | —                                            | **Web+Desktop**                     |
| `useConfigManagement`                                  | `hooks/useConfigManagement.ts`          | —                                            | **Web+Desktop**                     |
| `useAppInitialization`                                 | `hooks/useAppInitialization.ts`         | —                                            | **Web+Desktop**                     |
| `useSelectedSourceSync`                                | `hooks/useSelectedSourceSync.ts`        | —                                            | **Web+Desktop**                     |
| `useRouteSync` / `useKeyboardShortcuts` / `useUIState` | `hooks/*`                               | —                                            | **Web+Desktop**                     |
| 上传编排                                               | `AppMain` / `MainLayout` → `imageStore` | `ImageUploadButton` + `ImageUploadEditModal` | **重复**（UI 不同，store API 相似） |
| 主题                                                   | —                                       | `hooks/useColorScheme.ts` 等                 | **Mobile** · **仅 L3**              |

合并方向：将 hooks 内**无 DOM/RN 依赖**的流程迁入 core 工厂（REF-507），两端保留薄适配 hook。

### 3.3 导航

| 模块      | pixuli                  | mobile                                 | 标注                                 |
| --------- | ----------------------- | -------------------------------------- | ------------------------------------ |
| 路由库    | `react-router-dom`      | `expo-router`                          | **仅 L3**                            |
| 路由表    | `src/router/routes.tsx` | `app/(tabs)/*`                         | **平台专属**                         |
| 侧栏/抽屉 | `layouts/Sidebar.tsx`   | `components/navigation/DrawerMenu.tsx` | **重复 UI** · Capacitor 后可删 RN 版 |

### 3.4 配置 Modal 与存储设置

| 模块                   | 位置                                                | 标注                                            |
| ---------------------- | --------------------------------------------------- | ----------------------------------------------- |
| GitHub / Gitee 配置 UI | `@pixuli/ui` `config/*/web/*Modal.tsx`              | **共享 UI 包** · **Web+Desktop**                |
| 集成入口               | `layouts/MainLayout.tsx` + `uiStore`                | **Web+Desktop**                                 |
| `StorageConfigModal`   | `apps/mobile/components/settings/modals/` (~830 行) | **Mobile** · **重复**                           |
| 编辑态配置解析         | `utils/resolveModalRepoConfig.ts`                   | **Web+Desktop**（注释要求与 Mobile 编辑态对齐） |

长期：表单**校验与 save 流程**下沉 core（无 UI）；Capacitor 路线下 Mobile 直接复用
`@pixuli/ui` web Modal。

### 3.5 持久化适配

| 数据        | pixuli                            | mobile                            | storage key               | 标注                                            |
| ----------- | --------------------------------- | --------------------------------- | ------------------------- | ----------------------------------------------- |
| GitHub 配置 | `config/github.ts` + localStorage | `config/github.ts` + AsyncStorage | `pixuli-github-config`    | **重复** · key 一致                             |
| Gitee 配置  | `config/gitee.ts`                 | `config/gitee.ts`                 | `pixuli-gitee-config`     | **重复**；默认分支 web `main` / mobile `master` |
| 多源列表    | sourceStore                       | sourceStore                       | **v3 vs v2**              | **需统一**                                      |
| 选中源      | sourceStore                       | sourceStore                       | `pixuli.selectedSourceId` | key 一致                                        |
| 操作日志    | `services/logService.ts`          | `services/logService.ts`          | `pixuli-operation-logs`   | **重复** · core `OperationLogService` 已共享    |
| 搜索历史    | `utils/searchHistory.ts`          | —                                 | —                         | **Web+Desktop**                                 |
| 元数据缓存  | —                                 | `utils/metadataCache.ts`          | —                         | **Mobile**                                      |
| 语言偏好    | i18next detector                  | AsyncStorage `pixuli.language`    | **分叉** · 文案基座共享   |

建议抽象：`IKeyValueStorage`（sync/async 适配）供 sourceStore /
config 共用（REF-507 P0）。

### 3.6 Storage Registry / Provider 创建

| 模块                  | pixuli                          | mobile                      | 标注                                     |
| --------------------- | ------------------------------- | --------------------------- | ---------------------------------------- |
| `storage/registry.ts` | `src/storage/registry.ts`       | `storage/registry.ts`       | **共享**（~30 行相同）                   |
| `createProvider.ts`   | `src/storage/createProvider.ts` | `storage/createProvider.ts` | **微分叉**（platform、gitee 代理上下文） |
| Host bootstrap        | `hostBootstrapManifests.ts`     | —                           | **Web+Desktop** · REF-411                |

已在 `@pixuli/core`：`createStoragePluginRegistry`、`StorageProvider`
契约；`@pixuli/provider-*/register`。

### 3.7 上传流程

| 组件                                | 位置                                              | 标注                                             |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `UploadButton` / `ImageUploadModal` | `@pixuli/ui` web                                  | **共享** · **Web+Desktop**                       |
| 上传后处理                          | `imageStore.uploadImage` / `uploadMultipleImages` | **重复**（双端 store）                           |
| `ImageUploadEditModal`              | mobile `components/image/modals/` (~1208 行)      | **Mobile**（裁剪、压缩、expo-image-manipulator） |
| REF-511 元数据                      | 规划                                              | Capacitor / RN 双路线需验证                      |

### 3.8 筛选 / 搜索

| 模块        | pixuli                                           | mobile                          | 标注                                            |
| ----------- | ------------------------------------------------ | ------------------------------- | ----------------------------------------------- |
| 状态        | `contexts/SearchContext.tsx` + `useUIState`      | `imageStore` 内联               | **分叉**                                        |
| UI          | `@pixuli/ui` Search                              | `SearchAndFilter.tsx` (~513 行) | **重复 UI**                                     |
| 算法        | `@pixuli/core/utils` `filterImages`（photos 页） | store 内 `applyFiltersAndSort`  | **部分共享** · mobile 应改用 core（REF-507 P1） |
| 筛选 Tab 页 | 合并在 `/photos`                                 | `app/(tabs)/filter.tsx`         | **Mobile 专属路由**                             |

### 3.9 国际化

| 模块                          | 标注                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| `@pixuli/ui/locales` 基座     | **共享**                                                               |
| `apps/pixuli/src/i18n/*`      | **Web+Desktop** 增量                                                   |
| `apps/mobile/i18n/locales.ts` | **Mobile** 增量（tabs、upload 等）                                     |
| 检测器                        | browser + localStorage vs expo-localization + AsyncStorage · **仅 L3** |

### 3.10 平台适配

| 模块                                         | pixuli                 | mobile                                  | 标注                                |
| -------------------------------------------- | ---------------------- | --------------------------------------- | ----------------------------------- |
| `PlatformAdapter` / `DefaultPlatformAdapter` | 经 createProvider 注入 | 同上                                    | **共享**（`@pixuli/core/platform`） |
| `getAppPlatform()`                           | `utils/platform.ts`    | —                                       | **Web+Desktop**                     |
| Gitee 图片代理 Host                          | REF-411 Host 集成      | 无（直连 API）                          | **Web+Desktop** · **仅 L3**         |
| 图片处理                                     | Canvas（`@pixuli/ui`） | `expo-image-manipulator`                | **仅 L3**                           |
| `@pixuli/ui/native` 用量                     | —                      | `EmptyState`、`VersionInfoModal` 等极少 | **低**                              |

---

## 四、已在 `@pixuli/core` 的共享资产

| 类别         | 代表路径                                                              |
| ------------ | --------------------------------------------------------------------- |
| 类型 DTO     | `types/image.ts`、`types/github.ts`、`types/gitee.ts`、`types/log.ts` |
| 多源模型     | `sources/normalize.ts`、`sources/importExport.ts`                     |
| 存储插件     | `plugins/registry.ts`、`plugins/types.ts`                             |
| 平台契约     | `platform/platformAdapter.ts`                                         |
| 列表工具     | `utils/filterUtils.ts`、`utils/sortUtils.ts`                          |
| 操作日志引擎 | `operation-log/operationLogService.ts`                                |
| i18n 基座    | `locales/app/*.json`                                                  |

---

## 五、分阶段目标与 Issue 映射

对照 `REFACTOR_PLAN.md` **§1.4.3**：

| 阶段                   | 时机       | 交付                                                      | 本矩阵对应动作                              | Issue                     |
| ---------------------- | ---------- | --------------------------------------------------------- | ------------------------------------------- | ------------------------- |
| **P0 逻辑对齐**        | M3 末～M4  | Registry / `StoredSourceEntry` 行为一致；差异仅持久化适配 | ✅ M3 已达成；⚠️ `sources` key v2/v3 未统一 | —                         |
| **P1 共享包评估**      | M4         | 文档：可迁入 core 的 store 工厂清单                       | **本文档 §三、§六**                         | **REF-506 #116**（本文）  |
| **P2 Capacitor PoC**   | M5         | `apps/pixuli` + Capacitor 真机冒烟                        | 验证 §3.3～3.7 Web UI 可替代 RN             | **REF-509 #118**          |
| **P3 三端单工程发布**  | M5+        | CI 产出 Web/Desktop/iOS/Android                           | Wiki 与 REF-501 能力矩阵对齐                | REF-501 #86、REF-510 #120 |
| **P4 RN 退场（可选）** | PoC 通过后 | `apps/mobile` deprecated                                  | REF-508 评估不必再迁 RN 的组件              | **REF-508 #119**          |

**M5 建议实施顺序**（`REFACTOR_PLAN` §M5）：**#116（本文）** → **#117 ∥ #118** →
PoC 通过优先 **#118/#120/#141**，否则继续 **#117/#119**（方案 C）。

| 后续 Issue       | 标题                                 | 依赖本矩阵章节                                                                               |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| **#117** REF-507 | 抽取 imageStore/sourceStore 共享逻辑 | §3.1、§3.2、§3.5、§六                                                                        |
| **#119** REF-508 | `@pixuli/ui` L1/L2 native 迁入评估   | §3.4、§3.7、§3.8、§3.10                                                                      |
| **#118** REF-509 | Capacitor PoC                        | §二、§五 P2；02 文档 §六～§八                                                                |
| **#120** REF-510 | Capacitor 原生能力插件               | §3.10                                                                                        |
| **#141** REF-511 | 拍照元数据采集                       | §3.7                                                                                         |
| **#130** REF-601 | 三端融合交互设计                     | [04-three-platform-interaction-spec.md](../01-product/04-three-platform-interaction-spec.md) |

---

## 六、合并优先级（供 REF-507 拆分）

| 优先级 | 目标                                                                   | 理由                                         |
| ------ | ---------------------------------------------------------------------- | -------------------------------------------- |
| **P0** | 统一 `pixuli.sources.v3` + `IAsyncKeyValueStorage` 适配                | 阻碍跨端配置导入与 Capacitor 共用数据        |
| **P0** | 抽 `imageStore` 核心状态机（configure → list → upload → delete → log） | 最大重复块；补 Mobile `deleteMultipleImages` |
| **P1** | Mobile 改用 `filterImages` / `sortUtils`                               | 消除内联筛选                                 |
| **P1** | 统一 `logService` 薄适配工厂                                           | 已几乎相同                                   |
| **P2** | Config 校验/save 下沉 core（无 UI）                                    | 对齐 Web Modal 与 `StorageConfigModal`       |
| **P3** | Capacitor PoC 后 RN UI 退场清单                                        | REF-508，避免双份 L2 长期维护                |

**不建议合并（保持仅 L3）**：Electron 主进程、PWA SW、Expo 原生模块、Gitee
Vite/Electron Host、`metadataCache`（直至本地库 REF-607 统一策略）。

---

## 七、与 REF-501（#86）的关系

| 文档                   | 视角                                      |
| ---------------------- | ----------------------------------------- |
| **PRD §4.3** / REF-501 | 产品能力按端 ✅/⏳/—（PWA、托盘、相机等） |
| **本文 REF-506**       | **代码路径**级共享 / 重复 / 可合并        |

能力矩阵与代码矩阵应交叉引用：例如 PRD 标 Mobile「批量删除」时，本文 §3.1 记为
**store 未实现**，REF-507 需一并修复。

---

## 八、验收对照（#116）

- [x] 对照 §1.4.1 输出模块级共享矩阵
- [x] 覆盖 `imageStore`、`sourceStore`、导航、上传、配置 Modal、持久化
- [x] 链到 [02-Three-Platform-Design.md](./02-Three-Platform-Design.md)（方案 A
      / 过渡 C）
- [x] 写入 `docs/02-system-design/09-cross-platform-sharing-matrix.md`
- [x] P0～P4 与 #117/#118/#119/#120/#141/#130 对应关系
