# 插件运行时能力（架构结论）

> 现状与目标边界。产品底线见 [product.md](./product.md)；分层见
> [architecture.md](./architecture.md)。  
> 追踪：[#126](https://github.com/trueLoving/Pixuli/issues/126)（Obsidian 式体系）；热加载草案曾见 [#102](https://github.com/trueLoving/Pixuli/issues/102)（已关，待 #126 后再评）。

---

## 1. 现状（编译期内置）

| 类      | 注册入口                      | 契约                   |
| ------- | ----------------------------- | ---------------------- |
| Storage | `app/src/storage/registry.ts` | `@pixuli/core/plugins` |
| Kind    | `app/src/kinds/registry.ts`   | `@pixuli/core/kinds`   |

- 官方实现以 monorepo 包（`@pixuli/provider-*`、`@pixuli/kind-*`）**静态依赖 +
  bootstrap `register*`** 编入应用。
- **不支持**用户侧安装/卸载、任意 URL 热加载、插件市场。
- Registry /
  Manifest 已为扩展预留接口；缺的是 Loader 与生命周期，不是再加一套硬编码。

---

## 2. 目标态（先具备运行时，暂不对用户开放）

**原则：** 内置插件也走统一 Loader；用户安装入口、商店 UI 后置。

| 层             | 要做什么                                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| 统一插件模型   | Storage / Kind 之上的壳：统一 Manifest、`onload` / `onunload`、enable/disable |
| Plugin Loader  | 解析入口 → 校验 → 动态加载 → `registry.register`；支持 `unregister`           |
| Core API       | 宿主注入窄 API（workspace 读写、命令/设置 schema 等）；插件 ↛ `app/src/ui`    |
| 启用状态       | 持久化 `{ id, enabled, origin, version }`；启动按状态加载                     |
| 三端策略       | Desktop 可真动态加载；Web/Mobile 首版以 builtin / 打包内置为主                |
| 安全（最小集） | manifest 禁带 secret；单插件失败隔离；对内可用 allowlist                      |

「暂不开放」时：Loader 仅允许
`origin: 'builtin'`（monorepo 或打进包的目录），禁止 sideload / 目录商店。

---

## 3. 建议落地顺序

1. 设计定稿：统一 Manifest + Lifecycle + Core API（对齐 #126）。
2. Registry 演进：`register` / `unregister` / enable；Storage、Kind 作能力适配。
3. Builtin Loader PoC：启动经 Loader 加载例如 GitHub +
   PDF；去掉（或薄封装）app 硬编码 `register*`。
4. `pluginState` 持久化（仅 builtin、默认全开）。
5. **非目标（本阶段）**：商店 UI、第三方 sideload、Web 任意远程脚本。

---

## 4. 与当前 Kind 收纳的关系

- `@pixuli/kind-pdf` 仍是**编译期包**；与 Storage 一样，为将来 Builtin
  Loader 提供可注册单元。
- Kind 与 Storage **正交**：同步归 Storage；预览 / 缩略图 / 处理面板归 Kind。
- 预览 UI 经包 `/ui` 导出、由 app 注入 `readFile`；core 仍无 React。

---

## 5. 非目标（重申）

- 官方 Server、跨端统一插件市场后端。
- 在未完成 #126 契约前，不对终端用户暴露「安装插件」。
