# @pixuli/example-kind-plugin

一份**同时支持 Desktop 与 Mobile** 的外部 Kind 示例插件。  
产物目录是 `plugin/`：可直接在 Pixuli 设置 → 插件 →「从文件夹安装」中选用。

> Web **不支持**用户安装第三方插件（D2.9）。本示例只面向 Desktop / Mobile。

## 目录

```text
examples/plugin-example-kind/
  README.md           ← 本文
  package.json
  plugin/             ← 离线安装用的插件包（只需这个文件夹）
    manifest.json     ← 磁盘清单（Loader 发现用）
    main.mjs          ← 单文件 ESM 入口
```

## 设计原则（跨端同一份代码）

| 原则                   | 说明                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **一份产物**           | Desktop / Mobile 安装同一 `plugin/` 目录，不要写 `if (Capacitor)` / `if (Electron)` |
| **单文件入口**         | `manifest.main` 指向一个 ESM 文件；**禁止**相对路径再 import 其它本地模块           |
| **零运行时依赖**       | Mobile 用 Blob 加载源码；不能依赖 `node_modules` 或 workspace 包                    |
| **声明能力，不握平台** | 例如 `ingest.preferredSources: ['file']`；相机/相册是否可用由 App 与平台取交        |
| **Kind ≠ Storage**     | 本示例只做 Kind（识别 `.example`）；同步仍走官方 Storage 插件                       |

官方 Builtin 包（如 `@pixuli/kind-text`）可以依赖 `@pixuli/core`
与 React，因为它们被打进应用。  
**外部离线插件**走另一条加载路径，约束更严——以本示例为准。

## 清单与入口契约

### `plugin/manifest.json`（磁盘清单）

```json
{
  "id": "ext.example-kind",
  "name": "Example Kind",
  "version": "0.1.0",
  "main": "main.mjs",
  "capabilities": ["kind"]
}
```

- `id`：全局唯一；建议 `ext.` 前缀，避免与 Builtin（如 `kind.image`）冲突
- `main`：相对本目录的入口文件名
- `capabilities`：`kind` 和/或 `storage`

### `plugin/main.mjs`（必须导出）

```js
export function createRuntimePlugin() {
  return {
    manifest: {
      /* id/name/version/origin/capabilities */
    },
    onload(api) {
      /* api.kinds / api.storage / api.ui */
    },
    onunload() {
      /* 注销 register 过的能力与 UI */
    },
  };
}
```

也允许 `export default createRuntimePlugin`。

`onload` 里常用：

- `api.kinds.register(kindManifest, factory)` / `unregister(id)`
- `api.ui.registerPreview` / `registerProcess` / …（进阶；组件类型需宿主可渲染）
- **不要**在插件内调用 Capacitor / Electron API

本示例会：

1. 注册 Kind：匹配 `*.example`
2. 声明 `ingest.accept`（`.example`），安装启用后会出现在上传可选类型中
3. **不**贡献 React 预览（无匹配预览时宿主降级
   `builtin.other`）；UI 见下方「进阶」

## 如何安装试用

### Desktop

1. 启动 Pixuli Desktop
2. 设置 → **插件** → **从文件夹安装**
3. 选中本仓库的 `examples/plugin-example-kind/plugin` 目录
4. 列表中出现 `Example Kind`；保持启用以加载

插件文件会被复制到 Electron `userData/plugins/<id>/`。

### Mobile（Android）

1. 将 `plugin/` 整夹放到设备可选取的位置（或开发时用调试手段写入）
2. 设置 → **插件** → **从文件夹安装**，用系统目录选择选中该文件夹
3. 文件写入应用私有 `Directory.Data/plugins/<id>/` 后加载

两端安装的是**同一目录内容**；无需两套工程。

### 卸载

设置 → **插件** → 已安装行的 **卸载**：删除本机 `plugins/<id>/`
目录，并从 Runtime 注销（builtin 无卸载按钮）。

### 验证

- 添加一个名为 `demo.example` 的文件到工作区（或上传）；上传 accept 应包含
  `EXAMPLE`
- Kind 匹配成功后，无专用 React 预览时会走
  `builtin.other`（下载打开）——符合当前 PoC
- 设置里关闭该插件后，`.example` 不应再被 Kind 识别 / 上传 accept 应收窄
- 卸载后列表不再出现该插件；重启也不会再被 discover

## 本地开发工作流建议

1. **改** `plugin/main.mjs` / `manifest.json`
2. Desktop：**再次「从文件夹安装」**覆盖同 id，然后**重启应用**（已加载的 ESM 工厂不会热替换）
3. 或开发期把目录直接放到：
   - Desktop：`userData/plugins/ext-example-kind/`
   - Mobile：应用 Data 下 `plugins/ext-example-kind/`  
     再冷启动

Loader / discover 自动化测试也指向本目录的 `plugin/`（见
`app/src/plugins/__tests__/externalLoader.test.ts`）。

## Desktop vs Mobile Loader 差异（作者无需分支）

|             | Desktop                               | Mobile                      |
| ----------- | ------------------------------------- | --------------------------- |
| 扫描根      | `userData/plugins`                    | `Directory.Data/plugins`    |
| 加载 `main` | IPC 读文本 → Blob / data URL `import` | 同左（Capacitor FS 读文本） |
| 安装 UI     | 系统目录对话框                        | `webkitdirectory` 选文件夹  |

对作者只要求：**合法的单文件 ESM + manifest**。差异全在 App Loader。

## 进阶：预览 / 处理 UI

外部插件若要贡献真正的 React 预览或 `kind.process`：

1. 用打包器把 UI **打进同一个 `main.mjs`**（IIFE/ESM bundle，无外部相对 import）
2. 或等待宿主提供稳定的 UI runtime（尚未作为外部插件契约）
3. Builtin 官方包继续用 monorepo 内 `@pixuli/kind-*` + `/ui`
   导出（不走离线安装）

当前示例故意保持零依赖，优先保证 **Desk+Mobile 都能装、能启停、能 match /
ingest**。

## 参考

- 运行时说明：[docs/plugins-runtime.md](../../docs/plugins-runtime.md)
- 三端策略 D2.9：[DECISIONS.md](../../DECISIONS.md)
- 契约：`@pixuli/core/plugin-runtime`、`@pixuli/core/kinds`
