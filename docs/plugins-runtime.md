# 插件运行时能力（架构结论）

> 现状与目标边界。产品底线见 [product.md](./product.md)；分层见
> [architecture.md](./architecture.md)。  
> 追踪：[#126](https://github.com/trueLoving/Pixuli/issues/126)（Obsidian 式体系）；热加载草案曾见 [#102](https://github.com/trueLoving/Pixuli/issues/102)（已关，待 #126 后再评）。

---

## 1. 现状（Builtin Loader + UI 槽位）

| 类      | 能力 registry                 | 启动                          |
| ------- | ----------------------------- | ----------------------------- |
| Storage | `@pixuli/core/plugins`        | `PluginRuntime` → onload 注册 |
| Kind    | `@pixuli/core/kinds`          | 同上                          |
| Runtime | `@pixuli/core/plugin-runtime` | `app/src/plugins/runtime.ts`  |
| UI 槽位 | `app/src/plugins/uiRegistry`  | `contributeAllPluginUi()`     |

- 官方实现仍以 monorepo 包**静态依赖**提供工厂；经统一
  `PluginRuntime.registerBuiltin` + `startSync()` 加载。
- 支持 `load` / `unload` / `setEnabled`；状态默认持久化到
  `localStorage`（`pixuli.plugin-runtime.v1`）。
- **不对用户开放**安装 UI / sideload / 任意 URL 热加载。

### 1.1 UI 槽位（App 拥有，core 无 React）

| 槽                         | 用途                   | 注册方                                       |
| -------------------------- | ---------------------- | -------------------------------------------- |
| `kind.preview`             | Inspector / Modal 预览 | `contributePdfUi`、`contributeBuiltinKindUi` |
| `kind.thumbnail`           | 列表缩略图             | 同上                                         |
| `storage.connectionFields` | 添加/编辑源表单        | `contributeGitHubUi` / `contributeGiteeUi`   |
| `storage.sourceIcon`       | 源列表 / 向导图标      | 同上                                         |

- App 壳：`KindPreviewHost`、`ConnectionWizard`、`StorageSourceIcon` —
  **按 registry 解析，不按 pluginId/kind 写死业务分支**；Wizard 持有不透明
  `StorageProviderConfig`。
- 插件经 `/ui` 的 `contribute*(registry)`
  注册；PDF：`@pixuli/kind-pdf/ui`；连接表单由
  `@pixuli/provider-github/ui`、`@pixuli/provider-gitee/ui`
  各自贡献（app 只对接这两个包，无共享 git-ui 包）。
- **激活存储会话**：`storageType`（pluginId）+ `storageConfig`（一份
  `StorageProviderConfig`），不再 github/gitee 双轨；持久化
  `pixuli-storage-session.v1`（兼容旧分 key 迁移）。
- 后置槽：`kind.processPanel`、`kind.inspectorMeta`、configSchema 表单引擎。

---

## 2. 目标态（后续）

**原则：** 内置与将来第三方走同一 Runtime；商店 UI 后置。

| 层             | 状态                                                        |
| -------------- | ----------------------------------------------------------- |
| 统一插件模型   | Manifest + `onload` / `onunload` + enable — **已有**        |
| Plugin Loader  | Builtin 工厂目录 — **已有**；Desktop 真动态 `import` — 未做 |
| Core API       | 现仅 `{ storage, kinds }`；workspace / commands — 未做      |
| UI 槽位        | preview / thumbnail / connection / icon — **已有**          |
| 启用状态       | Memory + localStorage — **已有**                            |
| 三端策略       | 当前三端共用 Builtin；Desktop 动态加载 — 未做               |
| 安全（最小集） | 单插件 onload 失败隔离 — **已有**；签名 / allowlist — 未做  |

「暂不开放」：Loader 仅 `origin: 'builtin'`。

---

## 3. 建议落地顺序（更新）

1. ~~设计定稿：统一 Manifest + Lifecycle~~
2. ~~Registry `unregister` + Builtin Runtime~~
3. ~~app 经 Runtime 启动 GitHub / Gitee / PDF~~
4. ~~UI 槽位：Kind 预览 + Storage 连接~~
5. Core API 扩展（workspace 读写等）与官方插件迁移文档
6. Desktop 动态加载 PoC（仍可隐藏 UI）
7. **非目标（仍后置）**：商店 UI、第三方 sideload、Web 任意远程脚本

---

## 4. 与 Kind / Storage 的关系

- `@pixuli/kind-pdf`、`@pixuli/provider-*` 提供 `create*RuntimePlugin()`（Gitee
  Pixuli 特化在 `app/src/plugins/createPixuliGiteeRuntimePlugin.ts`）。
- Kind 与 Storage **正交**：同步归 Storage；预览等归 Kind。
- core 仍无 React；预览 / 连接 UI 经包 `/ui`（Kind builtin 预览仍可在 app
  `contributeBuiltinKindUi`）。

---

## 5. 非目标（重申）

- 官方 Server、跨端统一插件市场后端。
- 不对终端用户暴露「安装插件」。
