# 插件运行时能力（架构结论）

> 现状与目标边界。产品底线见 [product.md](./product.md)；分层见
> [architecture.md](./architecture.md)。  
> 追踪：[#126](https://github.com/trueLoving/Pixuli/issues/126)（Obsidian 式体系）；热加载草案曾见 [#102](https://github.com/trueLoving/Pixuli/issues/102)（已关，待 #126 后再评）。

---

## 1. 现状（Builtin + Desktop external Loader PoC）

| 类      | 能力 registry                 | 启动                          |
| ------- | ----------------------------- | ----------------------------- |
| Storage | `@pixuli/core/plugins`        | `PluginRuntime` → onload 注册 |
| Kind    | `@pixuli/core/kinds`          | 同上                          |
| Runtime | `@pixuli/core/plugin-runtime` | `app/src/plugins/runtime.ts`  |
| UI 槽位 | `app/src/plugins/uiRegistry`  | Builtin Kind + 插件 onload    |

- 官方实现仍以 monorepo 包**静态依赖**提供工厂；经统一
  `PluginRuntime.registerBuiltin` + `startSync()` 加载。
- **三端策略（D2.9）**：Builtin 三端共用；**用户安装插件仅 Desktop + Mobile**；
  **Web 永不开放** sideload / 远程脚本。
- Desktop（已有 PoC）：扫描 `userData/plugins/*/manifest.json`，经
  `pixuli-plugin:` 协议 `import` 入口，`registerExternal` + `load`（见
  `app/src/plugins/externalLoader.ts`）。
- Mobile（待做）：应用私有目录同等 Loader；与 Desktop 共用 `discover` /
  `registerExternal` 契约。
- Web：仅 `registerBuiltin`；启动路径**不扫描** external。
- 支持 `load` / `unload` / `setEnabled`；状态默认持久化到
  `localStorage`（`pixuli.plugin-runtime.v1`）。
- origin：`builtin` | `external`。
- 安装 UI / 商店仍后置；Desktop 可先本机目录投放。

### 1.1 UI 槽位（App 拥有，core 无 React）

| 槽                         | 用途                   | 注册方                                               |
| -------------------------- | ---------------------- | ---------------------------------------------------- |
| `kind.preview`             | Inspector / Modal 预览 | Kind 插件 `contribute*Ui`、`contributeBuiltinKindUi` |
| `kind.thumbnail`           | 列表缩略图             | 同上（image/video/pdf）                              |
| `storage.connectionFields` | 添加/编辑源表单        | `contributeGitHubUi` / `contributeGiteeUi`           |
| `storage.sourceIcon`       | 源列表 / 向导图标      | 同上                                                 |

- App 壳：`KindPreviewHost`、`ConnectionWizard`、`StorageSourceIcon` —
  **按 registry 解析，不按 pluginId/kind 写死业务分支**；Wizard 持有不透明
  `StorageProviderConfig`。
- 无匹配预览时降级 `builtin.other`（下载打开）。
- `PluginApi.ui`（`PluginUiHost`）由 app 注入；官方插件在
  **onload 贡献 UI、onunload 注销**；`setEnabled(false)`
  同步卸 capability 与 UI。app 内置 Kind UI（image/…/other）仍由
  `contributeAllPluginUi` 注册； `ui.getKindCapabilities()` 提供通用
  `readFile`。
- **激活存储会话**：`storageType`（pluginId）+ `storageConfig`（一份
  `StorageProviderConfig`），不再 github/gitee 双轨；持久化
  `pixuli-storage-session.v1`（兼容旧分 key 迁移）。
- 后置槽：`kind.processPanel`、`kind.inspectorMeta`、configSchema 表单引擎。

---

## 2. 目标态（后续）

**原则：** 内置与将来第三方走同一 Runtime；商店 UI 后置。

| 层             | 状态                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| 统一插件模型   | Manifest + `onload` / `onunload` + enable — **已有**                      |
| Plugin Loader  | Builtin — **已有**；Desktop 目录 + `registerExternal` — **PoC 已有**      |
| Core API       | `{ storage, kinds, ui }` — **已有**；workspace / commands — 未做          |
| UI 槽位        | preview / thumbnail / connection / icon — **已有**                        |
| 启用状态       | Memory + localStorage — **已有**                                          |
| 三端策略       | Builtin 三端共用；external = Desktop（PoC）+ Mobile（待做）；**Web 禁止** |
| 安全（最小集） | 单插件 onload 失败隔离 — **已有**；签名 / allowlist — 未做                |

「暂不开放」：商店 UI、签名；**Web 用户安装为永久非目标**。

---

## 3. 建议落地顺序（更新）

1. ~~设计定稿：统一 Manifest + Lifecycle~~
2. ~~Registry `unregister` + Builtin Runtime~~
3. ~~app 经 Runtime 启动 GitHub / Gitee / PDF~~
4. ~~UI 槽位：Kind 预览 + Storage 连接~~
5. ~~PluginApi.ui + 官方包 UI 进 onload~~
6. ~~Desktop 动态加载 PoC（无安装 UI）~~
7. Mobile external Loader（应用私有目录，对齐 Desktop 契约）
8. Core API 扩展（workspace 读写等）与官方插件迁移文档
9. **后置**：商店 UI、签名 / allowlist
10. **永久非目标**：Web 用户安装 / 任意远程脚本

---

## 4. 与 Kind / Storage 的关系

- `@pixuli/kind-pdf` / `kind-markdown` / `kind-text`、`@pixuli/provider-*` 提供
  `create*RuntimePlugin()`（Gitee Pixuli 特化在
  `app/src/plugins/createPixuliGiteeRuntimePlugin.ts`）。
- Kind 与 Storage **正交**：同步归 Storage；预览等归 Kind。
- core 仍无 React；`PluginUiHost.component` 为 `unknown`；预览 / 连接 UI 经包
  `/ui`。
- Fixture：`app/electron/fixtures/sample-kind-plugin/`（验证 external 链路）。

---

## 5. 非目标（重申）

- 官方 Server、跨端统一插件市场后端。
- **Web 用户自行安装插件**（含任意远程脚本 / 浏览器 sideload）。
- 商店式安装 UI 可后置；Desktop / Mobile 本机目录投放不受此限。
