# 存储插件开发指南

- **文档版本**：1.0
- **所属目录**：`docs/02-system-design`
- **计划编号**：REF-308（M3 存储插件 P0）
- **关联 Issue**：[#77](https://github.com/trueLoving/Pixuli/issues/77)
- **前置阅读**：
  - [07-storage-plugin-system.md](./07-storage-plugin-system.md)
    — 架构、契约与 Registry 设计
  - [03-business-design/01-repository-source-management](../03-business-design/01-repository-source-management.md)
    — 仓库源业务模型

本文是面向**第三方与内部开发者**的实操文档：如何从零实现一个符合 Pixuli 约定的存储 Provider 包，并接入应用 Registry。架构背景与术语以
[07-storage-plugin-system.md](./07-storage-plugin-system.md)
为准，本文侧重**步骤、约定与安全**。

---

## 目录

- [一、读者与目标](#一读者与目标)
- [二、两种集成模式](#二两种集成模式)
- [三、快速开始（内置模式）](#三快速开始内置模式)
- [四、包结构与命名约定](#四包结构与命名约定)
- [五、实现清单（Manifest / Register / Provider）](#五实现清单manifest--register--provider)
- [六、配置与 configSchema](#六配置与-configschema)
- [七、安全：Token 与敏感数据](#七安全token-与敏感数据)
- [八、注册到应用与 UI 消费](#八注册到应用与-ui-消费)
- [九、测试与调试](#九测试与调试)
- [十、热加载（Backlog）](#十热加载backlog)
- [十一、最小示例骨架](#十一最小示例骨架)
- [十二、检查清单](#十二检查清单)

---

## 一、读者与目标

### 1.1 适合谁读

- 希望为 Pixuli 增加新图床后端（自建 API、其他 Git 托管、对象存储等）的开发者。
- 需要 fork Monorepo 或发布独立 npm 包 `@your-scope/provider-*` 的维护者。

### 1.2 读完应能完成

1. 创建一个仅依赖 `@pixuli/core` 的 Provider npm 包。
2. 实现 `StoragePluginManifest` + `registerXxxProvider(registry)` +
   `StorageProvider`。
3. 在 `apps/pixuli` 或 `apps/mobile` 的 `bootstrapStorageProviders()`
   中注册（内置模式）。
4. 理解 Token 仅存客户端、不得写入 Manifest 的安全边界。
5. （可选）为 REF-307 之后的动态表单准备 `configSchema`。

### 1.3 不在本文范围

- 插件市场 UI、从 URL 安装 bundle、签名校验（见
  [#102](https://github.com/trueLoving/Pixuli/issues/102)）。
- 图片处理类 Processor 插件（见
  [02-cross-image-process.md](./02-cross-image-process.md)）。

---

## 二、两种集成模式

| 模式                 | 适用场景                                             | 注册方式                                                                                         | M3 状态                     |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------- |
| **内置（官方路径）** | `@pixuli/provider-*` 作为 workspace 依赖，随应用发版 | 应用 `storage/registry.ts` 内 `bootstrapStorageProviders()` 调用 `registerXxxProvider(registry)` | **已支持**                  |
| **热加载**           | 社区/自建 Provider，不随主应用发版                   | Loader 下载并校验 bundle 后，调用同一 `registry.register(manifest, factory)` API                 | **API 预留，Loader 未实现** |

### 2.1 内置模式（推荐起步）

```text
packages/plugin-provider-{id}/
    manifest.ts ──► StoragePluginManifest
    register.ts ──► registerXxxProvider(registry)
    {id}StorageProvider.ts ──► implements StorageProvider
apps/pixuli|mobile/storage/registry.ts
    bootstrapStorageProviders()
        registerGitHubProvider(registry)
        registerGiteeProvider(registry)
        registerYourProvider(registry)   // 新增
```

### 2.2 热加载模式（计划中）

M3 保证以下在 **API 层面** 可行，便于后续 Loader 接入而无需改契约：

- `StoragePluginRegistry.register(manifest, factory)` 与 `listManifests()`。
- 重复注册同一 `pluginId` 抛出
  `StoragePluginAlreadyRegisteredError`（覆盖策略见 #102）。
- 用户已保存的 `StoredSourceEntry.pluginId`
  在插件未注册时，UI 显示「插件不可用」（REF-307）。

**尚未提供**：bundle 格式、HTTPS 源白名单、代码签名、沙箱隔离。第三方实现热加载时需自行承担安全评审。

---

## 三、快速开始（内置模式）

以下步骤假设在 Pixuli Monorepo 内新增
`packages/plugin-provider-example`（`pluginId: example`），仅作演示；生产环境请替换为真实后端 ID。

### 步骤 1：创建包目录

```text
packages/plugin-provider-example/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── src/
    ├── manifest.ts
    ├── register.ts
    ├── exampleStorageProvider.ts
    ├── index.ts
    └── __tests__/
        └── register.test.ts
```

### 步骤 2：`package.json`

```json
{
  "name": "@pixuli/provider-example",
  "version": "0.0.0",
  "description": "Pixuli example storage provider (documentation skeleton)",
  "type": "module",
  "license": "MIT",
  "exports": {
    ".": "./src/index.ts",
    "./register": "./src/register.ts"
  },
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "@pixuli/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.1.8"
  }
}
```

将包加入根目录 `pnpm-workspace.yaml`（若尚未包含 `packages/*` 通配则显式添加）。

### 步骤 3：实现 Manifest 与 Register

见 [§五](#五实现清单manifest--register--provider) 与
[§十一](#十一最小示例骨架)。

### 步骤 4：在应用中 Bootstrap

**Web / Desktop**（`apps/pixuli/src/storage/registry.ts`）：

```typescript
import { registerExampleProvider } from '@pixuli/provider-example/register';

export function bootstrapStorageProviders(): void {
  if (bootstrapped) return;
  registerGitHubProvider(storageRegistry);
  registerGiteeProvider(storageRegistry);
  registerExampleProvider(storageRegistry); // 新增
  bootstrapped = true;
}
```

**Mobile**（`apps/mobile/storage/registry.ts`）：同样增加 `register` 调用，并在
`apps/mobile/package.json` 增加 workspace 依赖。

### 步骤 5：配置 UI（M3 P0 过渡）

REF-307 之后，「添加源」列表来自 `storageRegistry.listManifests()`。若新插件
**无** 专用配置 Modal，需满足其一：

- `pluginId` 为 `github` / `gitee` 之一且复用现有 Modal（不推荐冒用）。
- 在 `@pixuli/ui` 或应用层增加该 `pluginId` 的配置表单（当前 P0 做法）。
- 提供 `configSchema`，待动态表单落地后自动渲染（REF-307 已预留字段）。

### 步骤 6：验证

```bash
pnpm --filter @pixuli/provider-example test
cd apps/pixuli && pnpm exec tsc --noEmit
```

手工：添加源 → 保存 `StoredSourceEntry`（含 `pluginId`）→ 列表 / 上传 / 删除。

---

## 四、包结构与命名约定

### 4.1 npm 包名

| 类型   | 约定                                               | 示例                      |
| ------ | -------------------------------------------------- | ------------------------- |
| 官方   | `@pixuli/provider-{pluginId}`                      | `@pixuli/provider-github` |
| 第三方 | `@your-scope/provider-{pluginId}` 或 scoped 私有包 | `@acme/provider-minio`    |

Monorepo **物理目录**可与 npm 名不同：`packages/plugin-provider-github` →
`@pixuli/provider-github`。

### 4.2 pluginId（全局唯一）

- 仅使用 **小写 ASCII**、`[a-z0-9-]`，建议 2～32 字符。
- **禁止**与已占用官方 ID 冲突：`github`、`gitee`（及未来官方预留表）。
- 第三方建议带前缀，如 `acme-minio`、`community-xxx`，降低冲突与钓鱼风险。
- `pluginId` 同时用于：`registry.create(pluginId)`、持久化
  `StoredSourceEntry.pluginId`、导入导出 JSON。

### 4.3 导出约定

每个 Provider 包 **必须** 提供：

| 子路径       | 内容                                                         |
| ------------ | ------------------------------------------------------------ |
| `.`          | `XxxStorageProvider`、`xxxManifest`（可选兼容 Service）      |
| `./register` | `registerXxxProvider(registry: StoragePluginRegistry): void` |

`register.ts` **仅** 依赖 `@pixuli/core/plugins`，不得 import `apps/*` 或
`@pixuli/ui`。

### 4.4 依赖边界

| 允许                                             | 禁止                               |
| ------------------------------------------------ | ---------------------------------- |
| `@pixuli/core`（`types`、`plugins`、`platform`） | `@pixuli/ui`、`react`、`react-dom` |
| `fetch`、`octokit` 等实现所需库                  | `pixuli-common`（REF-311 后删除）  |
| 经 `ProviderContext.platformAdapter` 读文件      | 直接 `import` 应用 store           |

CI 通过 `pnpm lint:boundaries` 强制执行（REF-209）。

---

## 五、实现清单（Manifest / Register / Provider）

### 5.1 Manifest

```typescript
// src/manifest.ts
import type { StoragePluginManifest } from '@pixuli/core/plugins';

export const exampleManifest: StoragePluginManifest = {
  id: 'example', // 全局唯一 pluginId
  name: 'Example Host',
  version: '0.1.0',
  icon: 'example', // 可选，供 UI 图标映射
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: false, // 不支持则 UI 应隐藏编辑元数据
    needsProxy: false, // Web 调 Gitee 等需代理时为 true
    maxUploadBytes: 5 * 1024 * 1024, // 可选
  },
  // 可选：供未来动态表单；不得含 token 等 secret
  configSchema: {
    type: 'object',
    required: ['endpoint', 'token'],
    properties: {
      endpoint: { type: 'string', title: 'API 地址' },
      token: { type: 'string', format: 'password', title: '访问令牌' },
      path: { type: 'string', default: 'images' },
    },
  },
};
```

**禁止**在 Manifest 中放置 `token`、`secret`、`apiKey` 默认值或示例真值。

### 5.2 Register

```typescript
// src/register.ts
import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import { ExampleStorageProvider } from './exampleStorageProvider';
import { exampleManifest } from './manifest';

export function registerExampleProvider(registry: StoragePluginRegistry): void {
  registry.register(exampleManifest, ctx => new ExampleStorageProvider(ctx));
}

export { exampleManifest };
```

### 5.3 Provider 类

必须实现 `@pixuli/core/plugins` 中的 `StorageProvider`：

| 方法                   | 说明                                                            |
| ---------------------- | --------------------------------------------------------------- |
| `readonly manifest`    | 通常 `= exampleManifest`                                        |
| `configure(config)`    | 保存并 narrow `StorageProviderConfig`；**之后**才可调用业务方法 |
| `validateConfig?`      | 保存前校验，返回 `{ ok, message? }`                             |
| `listImages`           | 返回 `ImageItem[]`                                              |
| `uploadImage`          | 入参 `ImageUploadData`（`file` 可为 `File \| string` URI）      |
| `deleteImage(path)`    | 仓库内路径 / 文件名，**不是** imageId                           |
| `updateImageMetadata?` | 与 capabilities.updateMetadata 一致                             |
| `getRawUrl(path)`      | CDN / raw 直链                                                  |

**Mobile 懒加载元数据**：可实现
`StorageProviderWithMetadata.loadImageMetadata`，见 `@pixuli/provider-github` 的
`GitHubStorageProvider`。

**平台差异**：文件读、Base64、MIME 通过 `ctx.platformAdapter`
完成，勿在 Provider 内写死 `document` / `FileReader`。

```typescript
// 构造时注入
constructor(ctx: ProviderContext) {
  this.platformAdapter = ctx.platformAdapter;
  this.fetchFn = ctx.fetch ?? globalThis.fetch.bind(globalThis);
}
```

### 5.4 配置形状（config）

- 契约层类型为 `StorageProviderConfig`（`Record<string, unknown>`）。
- 建议在包内定义 `ExampleConfig` 接口，并在 `configure` 内做 narrow（参考
  `narrowGitHubConfig`）。
- 若与官方字段一致（owner/repo/branch/token/path），可复用 `@pixuli/core/types`
  的 `GitHubConfig` / `GiteeConfig` 类型，但 **pluginId 仍应独立**。

持久化由应用写入 `StoredSourceEntry`（REF-306）：

```json
{
  "id": "abc",
  "label": "my/repo",
  "pluginId": "example",
  "config": { "endpoint": "https://...", "token": "...", "path": "images" },
  "createdAt": 0,
  "updatedAt": 0
}
```

---

## 六、配置与 configSchema

### 6.1 与 UI 的关系

| 阶段       | 行为                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- |
| M3 P0      | GitHub/Gitee 使用 `@pixuli/ui` 专用 Modal；其它 pluginId 需应用侧单独表单或暂不支持添加 |
| REF-307 后 | 「添加源」列表来自 `listManifests()`；有 `configSchema` 时可逐步改为动态表单            |

### 6.2 configSchema 建议

- 使用 JSON Schema 子集或项目约定的简化对象（见官方 manifest 演进）。
- 敏感字段标记 `format: "password"`，UI 掩码显示、日志脱敏。
- **不要**在 schema 的 `default` 中写真实 Token。

### 6.3 导入 / 导出单条配置

应用导出格式（REF-306）：

```json
{
  "version": "2.0",
  "pluginId": "github",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "config": {
    "owner": "...",
    "repo": "...",
    "token": "...",
    "branch": "main",
    "path": "images"
  }
}
```

Provider 文档应说明本插件 `config` 字段含义；工具函数见 `@pixuli/core/sources`
的 `buildPluginConfigExport` / `parsePluginConfigImport`。

---

## 七、安全：Token 与敏感数据

### 7.1 存储位置

| 数据                           | 存储位置                                                             | 禁止                                                |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------- |
| Personal Access Token、API Key | 客户端 `localStorage` / `AsyncStorage`（`StoredSourceEntry.config`） | 上传 Pixuli 官方服务器、写入 Manifest、明文写入仓库 |
| 插件代码                       | npm 包或（未来）签名的热加载 bundle                                  | 在代码中硬编码用户 Token                            |

### 7.2 Provider 实现要求

1. **仅通过 HTTPS** 调用远端 API；Mobile 代理需求通过应用层配置（如 Gitee
   `needsProxy`）。
2. **日志**：禁止 `console.log` 完整 `Authorization`
   头或 token 字段；错误信息勿回显 token。
3. **Manifest**：仅描述能力与表单结构，**零 secret**。
4. **热加载插件**（未来）：不得将用户 config 回传至插件作者服务器，除非用户明确知情同意（产品层策略，非 M3 范围）。

### 7.3 用户导出备份

导出 JSON 含 token 时，UI 应提示用户妥善保管；导入仅在本地解析，不经服务端。

### 7.4 依赖供应链

第三方包应锁定依赖版本、避免 postinstall 脚本读取环境变量中的用户配置。Monorepo 内置包接受
`pnpm lint:boundaries` 与 CI 审查。

---

## 八、注册到应用与 UI 消费

### 8.1 Registry 单例

各应用维护模块级单例（已存在）：

- `apps/pixuli/src/storage/registry.ts`
- `apps/mobile/storage/registry.ts`

对外辅助：

```typescript
listStoragePluginManifests(): StoragePluginManifest[];
isStoragePluginRegistered(pluginId: string): boolean;
```

### 8.2 imageStore 流程

```text
用户选择源 (StoredSourceEntry)
    → getRepoConfigFromSource(entry)
    → createConfiguredStorageProvider(entry.pluginId, config)
    → storageRegistry.create(pluginId, { platform, platformAdapter })
    → provider.configure(config)
    → listImages / uploadImage / ...
```

若 `!isStoragePluginRegistered(entry.pluginId)`：**不得**
`create`；侧栏显示不可用（REF-307）。

### 8.3 添加源 UI

```typescript
import { listStoragePluginManifests } from '../storage/registry';

const manifests = listStoragePluginManifests();
// 渲染 manifest.name、getManifestDescription(manifest, t)
// onSelect(manifest.id) → 打开配置 Modal → addSource({ pluginId, label, config })
```

---

## 九、测试与调试

### 9.1 Provider 包单测

| 用例               | 说明                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `register.test.ts` | `register` 后 `listManifests()` 含本 manifest；`create` 返回实例      |
| Provider 方法      | mock `fetch` 经 `ProviderContext.fetch` 注入；覆盖 list/upload/delete |
| `validateConfig`   | 缺字段时 `ok: false`                                                  |

```bash
pnpm --filter @pixuli/provider-{id} test
```

### 9.2 与 Registry 集成

```typescript
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { registerExampleProvider } from '@pixuli/provider-example/register';

const registry = createStoragePluginRegistry();
registerExampleProvider(registry);
const provider = registry.create('example', {
  platform: 'web',
  platformAdapter: new DefaultPlatformAdapter(),
});
provider.configure({
  /* ... */
});
```

### 9.3 手工回归

纳入 REF-310 清单：配置源、列表、上传、删除、切换源、导入导出含 `pluginId`。

---

## 十、热加载（Backlog）

关联 [#102](https://github.com/trueLoving/Pixuli/issues/102)。设计预期：

| 场景                 | 期望行为                                            |
| -------------------- | --------------------------------------------------- |
| Bootstrap 已注册     | 出现在「添加源」列表（M3 已实现）                   |
| 配置存在但插件未注册 | 源列表「插件不可用」，禁止 `create`（M3 已实现）    |
| 热加载安装新插件后   | 再次 `listManifests()`，新类型出现在添加列表        |
| `configSchema` 变更  | 编辑已有源时提示重新校验（与 REF-306 导入导出联动） |

Loader 实现前，第三方可将包发布为 npm，由用户自行 fork Pixuli 走 **内置模式**
集成。

---

## 十一、最小示例骨架

以下为可运行的**最小** Provider（`listImages`
返回空数组），用于验证注册链路与类型检查。完整 GitHub 实现见
`packages/plugin-provider-github`。

### `src/manifest.ts`

```typescript
import type { StoragePluginManifest } from '@pixuli/core/plugins';

export const exampleManifest: StoragePluginManifest = {
  id: 'example',
  name: 'Example',
  version: '0.0.1',
  icon: 'example',
  capabilities: {
    list: true,
    upload: false,
    delete: false,
    updateMetadata: false,
  },
};
```

### `src/exampleStorageProvider.ts`

```typescript
import type { ImageItem, ImageUploadData } from '@pixuli/core/types';
import type {
  ProviderContext,
  StorageProvider,
  StorageProviderConfig,
} from '@pixuli/core/plugins';
import { exampleManifest } from './manifest';

export class ExampleStorageProvider implements StorageProvider {
  readonly manifest = exampleManifest;
  private configured = false;

  constructor(_ctx: ProviderContext) {}

  configure(_config: StorageProviderConfig): void {
    this.configured = true;
  }

  async listImages(): Promise<ImageItem[]> {
    if (!this.configured) throw new Error('Example provider is not configured');
    return [];
  }

  async uploadImage(_data: ImageUploadData): Promise<ImageItem> {
    throw new Error('Example provider does not support upload');
  }

  async deleteImage(_path: string): Promise<void> {
    throw new Error('Example provider does not support delete');
  }

  getRawUrl(path: string): string {
    return `https://example.invalid/${path}`;
  }
}
```

### `src/register.ts`

```typescript
import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import { ExampleStorageProvider } from './exampleStorageProvider';
import { exampleManifest } from './manifest';

export function registerExampleProvider(registry: StoragePluginRegistry): void {
  registry.register(exampleManifest, ctx => new ExampleStorageProvider(ctx));
}

export { exampleManifest };
```

### `src/index.ts`

```typescript
export { ExampleStorageProvider } from './exampleStorageProvider';
export { exampleManifest } from './manifest';
```

### `src/__tests__/register.test.ts`

```typescript
import { describe, expect, it } from 'vitest';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { exampleManifest, registerExampleProvider } from '../register';

describe('registerExampleProvider', () => {
  it('registers manifest and creates provider', () => {
    const registry = createStoragePluginRegistry();
    registerExampleProvider(registry);
    expect(registry.listManifests()).toEqual([exampleManifest]);
    const provider = registry.create('example', {
      platform: 'web',
      platformAdapter: {
        /* mock */
      } as never,
    });
    provider.configure({});
    expect(provider.manifest.id).toBe('example');
  });
});
```

> **注意**：`pluginId: example` 仅用于文档与本地试验；合并到主分支前请勿与官方
> `github`/`gitee` 同时注册到生产 bootstrap，除非产品确认需要该后端。

---

## 十二、检查清单

发布或提交 Provider 前请确认：

- [ ] `pluginId` 全局唯一，未与 `github` / `gitee` 冲突
- [ ] 包名、目录、`register` 导出符合 §4
- [ ] 仅依赖 `@pixuli/core`（及实现必需的 HTTP 库）
- [ ] Manifest **无** secret；config 内 token 字段仅出现在用户持久化数据
- [ ] `configure` 之后才可 list/upload/delete
- [ ] `deleteImage` 使用路径参数，与 `imageStore` 调用方式一致
- [ ] `capabilities` 与实现一致（不支持的方法勿标 `true`）
- [ ] 单测通过；`tsc --noEmit` 通过
- [ ] 已在目标应用 `bootstrapStorageProviders` 注册（内置模式）
- [ ] README 说明 config 字段与 `pluginId`
- [ ] 安全：HTTPS、日志不脱敏 token

---

## 相关源码索引

| 路径                                      | 说明                            |
| ----------------------------------------- | ------------------------------- |
| `packages/core/src/plugins/types.ts`      | 契约定义                        |
| `packages/core/src/plugins/registry.ts`   | DefaultStoragePluginRegistry    |
| `packages/core/src/plugins/manifestUi.ts` | UI 辅助（描述文案、是否已注册） |
| `packages/core/src/sources/`              | StoredSourceEntry、导入导出     |
| `packages/plugin-provider-github/`        | 官方参考实现                    |
| `packages/plugin-provider-gitee/`         | 官方参考实现                    |
| `apps/pixuli/src/storage/registry.ts`     | Web/Desktop bootstrap           |
| `apps/mobile/storage/registry.ts`         | Mobile bootstrap                |

---

## 文档维护

- 契约变更时同步更新
  [07-storage-plugin-system.md](./07-storage-plugin-system.md)
  与本文 §五、§十一。
- 热加载 (#102) 落地后增补 §10 的 Loader API 与安全模型。
- REF-309 单测迁移完成后，在 §9 增加官方包的测试目录链接。
