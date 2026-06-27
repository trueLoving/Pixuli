# Pixuli 插件体系

- **文档版本**：1.1（合并版）
- **所属目录**：`docs/02-system-design`
- **计划编号**：REF-301～311、REF-308、REF-310
- **关联 Issue**：[#70](https://github.com/trueLoving/Pixuli/issues/70)、[#77](https://github.com/trueLoving/Pixuli/issues/77)、[#79](https://github.com/trueLoving/Pixuli/issues/79)
- **相关文档**：
  - [00-System-Design](./00-System-Design.md)
  - [01-Product-Requirements-Specification §5.1](../01-product/01-Product-Requirements-Specification.md)（仓库源需求；业务设计文档暂缓）
  - [10-local-workspace-sync.md](./10-local-workspace-sync.md)（REF-607：Provider
    `sync` / `buildPublicUrl` 扩展，M6）
  - [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md)

本文合并
**存储插件体系设计**、**插件开发指南**、**M3 回归清单**，作为 Pixuli 存储 Provider 插件的单一入口文档。

## 目录

- [第一部分 存储插件体系设计](#第一部分-存储插件体系设计)
- [第二部分 存储插件开发指南](#第二部分-存储插件开发指南)
- [第三部分 M3 存储插件回归清单](#第三部分-m3-存储插件回归清单)

---

# 第一部分 存储插件体系设计

## 一、方案概述

### 1.1 目标

在 **M2 完成 `@pixuli/core` + `@pixuli/ui` 拆分**
的基础上，将 GitHub/Gitee 图床访问从 `pixuli-common`
中的**具体实现**抽离为可注册的**存储插件（Storage Provider）**，实现：

- **契约统一**：三端 `imageStore` 只依赖 `@pixuli/core` 的 `StorageProvider`
  接口，不感知 GitHub/Gitee API 细节。
- **实现可插拔**：官方 GitHub/Gitee 以独立 npm 包（`@pixuli/provider-github`、`@pixuli/provider-gitee`）注册；后续社区/自建 Server 可新增 provider 包而不改 core。
- **边界清晰**：`@pixuli/core` 仅定义类型与 Registry；**禁止** core /
  provider 依赖 `@pixuli/ui`（REF-209）。

### 1.2 设计原则

| 原则               | 说明                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **Core 无 UI**     | 插件契约、Registry、平台适配类型均在 `@pixuli/core`；UI 仅消费 manifest 列表（REF-307）。              |
| **Provider 无 UI** | 各 provider 包仅实现 API 调用与 Git 仓库语义，不包含 React 组件。                                      |
| **平台差异注入**   | 文件读尺寸、Base64、MIME 等通过 `ProviderContext.platformAdapter` 注入，不在 provider 内写死 Web API。 |
| **配置本地持久化** | Token 等敏感字段仅存客户端（localStorage / AsyncStorage），不上传官方服务。                            |
| **渐进迁移**       | M3 已落地 GitHub/Gitee 官方 provider；REF-311 已删除历史包 `pixuli-common`。                           |

### 1.3 范围

| 在范围内                                                      | 不在范围内（M3 P0）                                                                                                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub / Gitee 仓库图床的 list / upload / delete / 元数据更新 | Pixuli Server、MinIO、S3 等后端模式                                                                                                                        |
| `StoragePluginRegistry` 注册与 `create(pluginId, ctx)`        | 插件热加载、远程下载第三方 provider                                                                                                                        |
| 三端 `imageStore` 改用 Registry                               | 非存储类插件（图片处理 Processor 插件，见 [archive/design/01 §第二部分](../archive/design/01-Three-Platform-Capability-Sharing.md#第二部分-跨端图片处理)） |

---

## 二、专业术语

| 术语                | 英文              | 说明                                                                 |
| ------------------- | ----------------- | -------------------------------------------------------------------- |
| **存储插件**        | Storage Provider  | 实现 `StorageProvider` 接口、对应一种图床后端的 npm 包               |
| **插件清单**        | Manifest          | `StoragePluginManifest`：id、名称、版本、能力位、可选 configSchema   |
| **注册表**          | Registry          | `StoragePluginRegistry`：注册 factory、列举 manifest、按 id 创建实例 |
| **工厂**            | Factory           | `StorageProviderFactory`：`(ctx) => StorageProvider`                 |
| **Provider 上下文** | ProviderContext   | 创建实例时注入：platform、PlatformAdapter、fetch、logger             |
| **插件 ID**         | pluginId          | 全局唯一字符串，如 `github`、`gitee`；持久化与 Registry 查找键       |
| **仓库源**          | Repository Source | 用户配置的一条存储来源；M3 后期含 `pluginId + config`（REF-306）     |

---

## 三、背景与动机

### 3.1 M2 之后现状

```text
apps/pixuli ──► pixuli-common/services ──► GitHubStorageService / GiteeStorageService
apps/mobile ──► pixuli-common/services/native ──► 同上
                      │
                      └──► @pixuli/core（types、PlatformAdapter）
```

- `pixuli-common` 经 REF-210 已**仅保留**存储服务实现（~1.8k 行）与单测。
- 应用仍 **直接 `new GitHubStorageService(config)`**，源类型硬编码在
  `imageStore` 分支中。
- `@pixuli/core/plugins` 已有
  **占位契约**（`StorageProvider`、`DefaultStoragePluginRegistry`），尚未被应用使用。

### 3.2 目标架构（M3 完成后）

```text
apps/pixuli / apps/mobile
    │
    ├── bootstrapProviders(registry)   // 注册 github、gitee
    │
    └── imageStore
            storageProvider: StorageProvider | null
            registry.create(pluginId, ctx)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
@pixuli/provider-github   @pixuli/provider-gitee
        │                       │
        └───────────┬───────────┘
                    ▼
            @pixuli/core/plugins（契约 + Registry）
                    ▼
            @pixuli/core/types、platform
```

---

## 四、总体架构

### 4.1 分层

```mermaid
flowchart TB
  subgraph apps [应用层 apps/pixuli]
    Store[imageStore]
    Boot[bootstrapProviders]
  end

  subgraph providers [Provider 实现层]
    PG[@pixuli/provider-github]
    PE[@pixuli/provider-gitee]
  end

  subgraph core [@pixuli/core]
    Reg[StoragePluginRegistry]
    SP[StorageProvider 接口]
    PA[PlatformAdapter]
    Types[ImageItem · GitHubConfig · GiteeConfig]
  end

  subgraph legacy [过渡层 M3 末删除]
    Common[pixuli-common/services]
  end

  Boot --> Reg
  Store --> Reg
  Reg --> SP
  PG --> Reg
  PE --> Reg
  PG --> PA
  PE --> PA
  PG --> Types
  PE --> Types
  Common -.迁移前.-> PG
  Common -.迁移前.-> PE
```

### 4.2 包职责

| 包                        | 职责                                                       | 依赖           |
| ------------------------- | ---------------------------------------------------------- | -------------- |
| `@pixuli/core`            | 契约、`StoragePluginRegistry`、共享类型、`PlatformAdapter` | 无 UI          |
| `@pixuli/provider-github` | GitHub API + 元数据 sidecar 文件                           | `@pixuli/core` |
| `@pixuli/provider-gitee`  | Gitee API + 元数据 sidecar 文件                            | `@pixuli/core` |
| `@pixuli/ui`              | 配置 Modal、添加源 UI（REF-307 读 manifest）               | `@pixuli/core` |
| `pixuli-common`           | **过渡**：REF-302/303 迁出后删除（REF-311）                | —              |

### 4.3 ESLint 边界（REF-209）

- `packages/core/`** 不得 import `@pixuli/ui` 或 `packages/ui/**`。
- `packages/provider-*/**` 同上。
- 违反时在 CI `pnpm lint:boundaries` 失败。

---

## 五、核心契约（@pixuli/core/plugins）

> 实现位置：`packages/core/src/plugins/types.ts`、`registry.ts`  
> 导出：`@pixuli/core/plugins`

### 5.1 StoragePluginManifest

描述插件能力与 UI 展示信息，**不含**用户 Token。

```typescript
interface StoragePluginManifest {
  id: string; // 如 'github' | 'gitee'
  name: string;
  version: string;
  icon?: string;
  configSchema?: Record<string, unknown>; // JSON Schema 或简化字段描述，供 REF-307 动态表单
  capabilities: StorageCapabilities;
}

interface StorageCapabilities {
  list: boolean;
  upload: boolean;
  delete: boolean;
  updateMetadata: boolean;
  needsProxy?: boolean;
  maxUploadBytes?: number;
}
```

官方 GitHub/Gitee 插件 P0 能力均为 `true`（list/upload/delete/updateMetadata）。

### 5.2 StorageProvider

Provider 实例在 `**configure(config)`
之后\*\* 方可调用业务方法（与当前「构造时传入 config」等价，便于 Registry 统一创建流程）。

```typescript
interface StorageProvider {
  readonly manifest: StoragePluginManifest;

  configure(config: StorageProviderConfig): void | Promise<void>;

  validateConfig?(
    config: StorageProviderConfig,
  ): Promise<{ ok: boolean; message?: string }>;

  listImages(options?: ImageListOptions): Promise<ImageItem[]>;
  uploadImage(data: ImageUploadData): Promise<ImageItem>;
  deleteImage(path: string): Promise<void>;

  updateImageMetadata?(
    path: string,
    metadata: Partial<Pick<ImageItem, 'name' | 'description' | 'tags'>>,
  ): Promise<ImageItem>;

  getRawUrl(path: string): string;
}
```

**REF-301 需在 core 中补充/明确的点**（相对现有占位实现）：

| 项                             | 决策                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `deleteImage` 参数             | 契约使用 **仓库内路径 / 文件名**（`path`）；`imageStore` 在调用前由 `ImageItem` 解析，不再传 `imageId` 双参数。                                 |
| `uploadImage` 入参             | 扩展 `ImageUploadData.file` 为 `File                                                                                                            | string`，Mobile URI 经 `PlatformAdapter`处理（与现`GitHubStorageService.uploadImage` 一致）。 |
| `updateImageMetadata`          | 合并现 `updateImageInfo(id, fileName, metadata)`；`imageStore` 负责查 `fileName`。                                                              |
| `loadImageMetadata`            | 作为 **可选** 方法挂在扩展接口或 provider 类上，供 Mobile 懒加载；不强制写入最小 `StorageProvider`，REF-302 在 provider 包内导出 typed helper。 |
| `listImages` vs `getImageList` | 统一为 `listImages`；`imageStore` 迁移时改调用名。                                                                                              |

### 5.3 ProviderContext

```typescript
interface ProviderContext {
  platform: 'web' | 'desktop' | 'mobile';
  platformAdapter: PlatformAdapter;
  logger?: Pick<Console, 'log' | 'warn' | 'error'>;
  fetch?: typeof fetch; // 测试注入 mock
}
```

- Web/Desktop 通常 `DefaultPlatformAdapter` + 全局 `fetch`。
- Mobile 使用 RN 侧重写的 adapter（或 core 内
  `createMobilePlatformAdapter()`，REF-302 决策）。

### 5.4 StoragePluginRegistry

```typescript
interface StoragePluginRegistry {
  register(
    manifest: StoragePluginManifest,
    factory: StorageProviderFactory,
  ): void;
  get(id: string): StorageProviderFactory | undefined;
  getManifest(id: string): StoragePluginManifest | undefined;
  listManifests(): StoragePluginManifest[];
  create(id: string, ctx: ProviderContext): StorageProvider;
}
```

- 默认实现：`DefaultStoragePluginRegistry` / `createStoragePluginRegistry()`。
- `register` 时 **manifest.id 与 factory 一一对应**；重复 `register`
  同一 id 时抛出
  `StoragePluginAlreadyRegisteredError`（热加载覆盖策略见 #102）。
- `create` 仅构造实例，**不**自动 `configure`；由 `imageStore`
  在加载用户 config 后调用 `configure`。

### 5.5 类型与配置

| 类型                            | 位置                   | 用途                                                    |
| ------------------------------- | ---------------------- | ------------------------------------------------------- |
| `GitHubConfig`                  | `@pixuli/core/types`   | GitHub provider 的 config 形状                          |
| `GiteeConfig`                   | `@pixuli/core/types`   | Gitee provider 的 config 形状                           |
| `StorageProviderConfig`         | `@pixuli/core/plugins` | `Record<string, unknown>` 擦除；各 provider 内部 narrow |
| `ImageItem` / `ImageUploadData` | `@pixuli/core/types`   | 列表与上传 DTO                                          |

M3 后期（REF-306）持久化结构：

```typescript
interface StoredSourceEntry {
  id: string; // 用户源 ID（UUID）
  label: string;
  pluginId: string; // 'github' | 'gitee'
  config: StorageProviderConfig;
  createdAt: number;
  updatedAt: number;
}
```

---

## 六、Provider 包约定

### 6.1 包命名与导出

| 包名                      | pluginId | 注册函数                           |
| ------------------------- | -------- | ---------------------------------- |
| `@pixuli/provider-github` | `github` | `registerGitHubProvider(registry)` |
| `@pixuli/provider-gitee`  | `gitee`  | `registerGiteeProvider(registry)`  |

每个包 **exports**：

```json
{
  ".": "./src/index.ts",
  "./register": "./src/register.ts"
}
```

`register.ts` 仅依赖 `@pixuli/core/plugins`，将 manifest +
factory 注册到传入的 registry。

### 6.2 Factory 模式

```typescript
// @pixuli/provider-github（示意）
export function registerGitHubProvider(registry: StoragePluginRegistry): void {
  registry.register(githubManifest, ctx => new GitHubStorageProvider(ctx));
}

class GitHubStorageProvider implements StorageProvider {
  constructor(private readonly ctx: ProviderContext) {}
  configure(config: StorageProviderConfig): void {
    this.config = config as GitHubConfig;
  }
  // listImages / uploadImage / ...
}
```

- 实现代码自 ``@pixuli/core` / `@pixuli/ui`（原
  `packages/common`）/src/services/\*StorageService.ts`
  **搬移**（REF-302/303），逻辑保持行为等价。
- 单元测试自 ``@pixuli/core` / `@pixuli/ui`（原
  `packages/common`）/src/services/**tests**/` **迁出**（REF-309）。

### 6.3 依赖规则

| 允许                                       | 禁止                      |
| ------------------------------------------ | ------------------------- |
| `@pixuli/core`（types、platform、plugins） | `@pixuli/ui`、`react-dom` |
| 平台 API（`fetch`、经 adapter 的文件读）   | 直接 import `apps/`\*     |
| 可选 `octokit`（若精简 fetch 封装）        | `pixuli-common`           |

---

## 七、应用集成

### 7.1 Registry 引导（bootstrap）

各应用在入口或 store 模块初始化时：

```typescript
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { registerGitHubProvider } from '@pixuli/provider-github/register';
import { registerGiteeProvider } from '@pixuli/provider-gitee/register';

export const storageRegistry = createStoragePluginRegistry();

export function bootstrapStorageProviders(): void {
  registerGitHubProvider(storageRegistry);
  registerGiteeProvider(storageRegistry);
}
```

### 7.2 imageStore 改造（REF-304 / REF-305）

**Before（M2）**

```typescript
storageService: GitHubStorageService | GiteeStorageService | null;
// new GitHubStorageService(config, { platform, platformAdapter })
// await storageService.getImageList()
```

**After（M3）**

```typescript
storageProvider: StorageProvider | null;
pluginId: string | null;

function createProvider(
  pluginId: string,
  config: StorageProviderConfig,
): StorageProvider {
  const provider = storageRegistry.create(pluginId, {
    platform: currentPlatform,
    platformAdapter: getPlatformAdapter(),
  });
  provider.configure(config);
  return provider;
}

// await storageProvider.listImages()
```

- 切换源时：`pluginId` + `config` 来自 `StoredSourceEntry`（REF-306 后）或过渡期
  `{ type: 'github' | 'gitee', ...config }` 映射到 pluginId。
- 添加源 UI（REF-307）：`storageRegistry.listManifests()` 渲染可选插件列表。

### 7.3 与 @pixuli/ui 的协作

- 配置 Modal（`GitHubConfigModal` / `GiteeConfigModal`）仍在 `@pixuli/ui`；仅
  **类型** 来自 `@pixuli/core/types`。
- REF-307 后，通用「添加源」表单可根据 `manifest.configSchema`
  动态渲染；P0 可继续专用 Modal + 固定 pluginId。

---

## 八、配置与持久化演进

### 8.1 过渡期（REF-304/305）

- 继续读写 `localStorage` / `AsyncStorage` 中现有 JSON 结构。
- `imageStore` 内维护 `**type: 'github' | 'gitee'` → `pluginId`\*\* 映射表。

### 8.2 目标态（REF-306）

- 持久化 `**StoredSourceEntry[]**`，显式含 `pluginId`。
- 导入/导出 JSON 增加 `pluginId` 字段；旧格式导入时按 `type` 推断 pluginId。

---

## 九、与现有存储实现的映射

| 现有（pixuli-common）                                          | 插件契约（M3）                                    |
| -------------------------------------------------------------- | ------------------------------------------------- |
| `new XxxStorageService(config, { platform, platformAdapter })` | `registry.create(id, ctx)` + `configure(config)`  |
| `getImageList()`                                               | `listImages()`                                    |
| `uploadImage(data)`                                            | `uploadImage(data)`（扩展 file 类型）             |
| `deleteImage(imageId, fileName)`                               | `deleteImage(fileName)`                           |
| `updateImageInfo(id, fileName, meta)`                          | `updateImageMetadata(fileName, meta)`             |
| `loadImageMetadata(images, opts)`                              | provider 可选扩展 / Mobile 专用 helper            |
| `githubUrl` 字段 on `ImageItem`                                | 保留字段名（历史兼容）；Gitee 源同样写入 CDN 直链 |

---

## 十、安全、错误与测试

### 10.1 安全

- **Token** 仅存本地；provider 仅通过 HTTPS 调 GitHub/Gitee API。
- Manifest **不得** 包含 secret 字段；configSchema 标注 `format: password`
  供 UI 掩码显示（REF-308 文档化）。
- 日志禁止打印完整 Token（`logInterceptorService`
  若保留在 app 层，需过滤 Authorization）。

### 10.2 错误

- Provider 将 HTTP/API 错误转为 `Error` 抛出，消息对用户可读（中文），与现
  `GitHubStorageService` 行为一致。
- `validateConfig` 在保存前由 UI 或 store 调用，避免无效 config 进入持久化。

### 10.3 测试

| 层级                   | 内容                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `@pixuli/core/plugins` | Registry register/create/list；重复 register 行为             |
| `@pixuli/provider-`\*  | 自 common 迁出的 API mock 单测（REF-309）                     |
| apps `imageStore`      | 集成测试：mock registry + mock provider                       |
| REF-310                | [第三部分 M3 存储插件回归清单](#第三部分-m3-存储插件回归清单) |

---

## 十一、M3 迁移路线图

| ID          | 内容                                         | 与本文关系                       |
| ----------- | -------------------------------------------- | -------------------------------- |
| **REF-301** | core 契约与 Registry **定稿 + 代码对齐**     | **本文档 + types/registry 补全** |
| REF-302     | `@pixuli/provider-github`                    | §6 实现 GitHub                   |
| REF-303     | `@pixuli/provider-gitee`                     | §6 实现 Gitee                    |
| REF-304/305 | apps imageStore → Registry                   | §7.2                             |
| REF-306     | 持久化 `pluginId`                            | §8.2                             |
| REF-307     | UI 读 `listManifests`                        | §7.3                             |
| REF-308     | 插件开发文档 `04-Plugin-System.md §第二部分` | 基于本文扩展                     |
| REF-309     | 单测迁移                                     | §10.3                            |
| REF-310     | M3 回归                                      | §10.3                            |
| REF-311     | 删除 `packages/common`（**已完成**）         | §4.1 移除 legacy                 |

建议实施顺序：**301 → 302 ∥ 303 → 304 ∥ 305 → 309 → 310 →
311**；306/307 可与 304 并行（P1）。

---

## 十二、附录

### A. 官方插件 Manifest 示例

```typescript
const githubManifest: StoragePluginManifest = {
  id: 'github',
  name: 'GitHub',
  version: '1.0.0',
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: true,
  },
};
```

### B. 相关源码索引（M2 基线）

| 路径                                       | 说明                                          |
| ------------------------------------------ | --------------------------------------------- |
| `packages/core/src/plugins/types.ts`       | 契约定义                                      |
| `packages/core/src/plugins/registry.ts`    | DefaultStoragePluginRegistry                  |
| `packages/plugin-provider-github`          | GitHub provider + 可选 `GitHubStorageService` |
| `packages/plugin-provider-gitee`           | Gitee provider + 可选 `GiteeStorageService`   |
| `apps/pixuli/src/stores/imageStore.ts`     | REF-304 已对接 Registry                       |
| `archive/apps/mobile/stores/imageStore.ts` | REF-305 已对接 Registry（RN 已归档）          |

### C. 文档维护

- M3 各 REF 合并后，更新 [00-System-Design](./00-System-Design.md)
  中「模块与职责」一节，将 `packages/common` 替换为 provider 包描述。
- REF-308 产出 [第二部分 存储插件开发指南](#第二部分-存储插件开发指南)
  作为本文的**开发者实操**补充。

---

# 第二部分 存储插件开发指南

- [04-Plugin-System](./04-Plugin-System.md) — 架构、契约与 Registry 设计
- [01-Product-Requirements-Specification §5.1](../01-product/01-Product-Requirements-Specification.md)（仓库源需求；业务设计文档暂缓）— 仓库源业务模型

## 一、读者与目标

### 1.1 适合谁读

- 希望为 Pixuli 增加新图床后端（自建 API、其他 Git 托管、对象存储等）的开发者。
- 需要 fork Monorepo 或发布独立 npm 包 `@your-scope/provider-*` 的维护者。

### 1.2 读完应能完成

1. 创建一个仅依赖 `@pixuli/core` 的 Provider npm 包。
2. 实现 `StoragePluginManifest` + `registerXxxProvider(registry)` +
   `StorageProvider`。
3. 在 `apps/pixuli` 的 `bootstrapStorageProviders()` 中注册（内置模式）。
4. 理解 Token 仅存客户端、不得写入 Manifest 的安全边界。
5. （可选）为 REF-307 之后的动态表单准备 `configSchema`。

### 1.3 不在本文范围

- 插件市场 UI、从 URL 安装 bundle、签名校验（见
  [#102](https://github.com/trueLoving/Pixuli/issues/102)）。
- 图片处理类 Processor 插件（见
  [第二部分 跨端图片处理](#第二部分-跨端图片处理)）。

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

**RN（归档）**（`archive/apps/mobile/storage/registry.ts`）：历史参考；新 Mobile 仅
`apps/pixuli` bootstrap。

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
- `archive/apps/mobile/storage/registry.ts`（只读）

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

### 9.1 Provider 包单测（REF-309）

存储 API mock 单测位于各 `@pixuli/provider-*` 包内（自 `pixuli-common` 的
`services/__tests__` 迁出；`platformAdapter` 单测在 `@pixuli/core`）。

**官方包测试目录**

| 包                        | 文件                                                | 说明                                          |
| ------------------------- | --------------------------------------------------- | --------------------------------------------- |
| `@pixuli/provider-github` | `src/__tests__/githubStorageProvider.test.ts`       | 主测：`GitHubStorageProvider` + mock `fetch`  |
|                           | `src/__tests__/register.test.ts`                    | Registry 注册与 `create`                      |
|                           | `src/__tests__/githubStorageService.compat.test.ts` | 兼容层 `GitHubStorageService` 冒烟            |
|                           | `src/__tests__/helpers.ts`                          | 共用 `createMockResponse`                     |
| `@pixuli/provider-gitee`  | `src/__tests__/giteeStorageProvider.test.ts`        | 主测：`GiteeStorageProvider`（含 `useProxy`） |
|                           | `src/__tests__/register.test.ts`                    | 同上                                          |
|                           | `src/__tests__/giteeStorageService.compat.test.ts`  | 兼容层冒烟                                    |
|                           | `src/__tests__/helpers.ts`                          | 同上                                          |

| 用例               | 说明                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `register.test.ts` | `register` 后 `listManifests()` 含本 manifest；`create` 返回实例      |
| Provider 方法      | 先 `configure(config)`；mock `fetch`；覆盖 `listImages`/upload/delete |
| `validateConfig`   | 缺字段时 `ok: false`（若实现）                                        |

```bash
pnpm --filter @pixuli/provider-github test
pnpm --filter @pixuli/provider-gitee test
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
| `packages/plugin-provider-github/`        | 官方参考实现；单测见 §9.1       |
| `packages/plugin-provider-gitee/`         | 官方参考实现；单测见 §9.1       |
| `apps/pixuli/src/storage/registry.ts`     | Web/Desktop bootstrap           |
| `archive/apps/mobile/storage/registry.ts` | RN bootstrap（归档）            |

---

## 文档维护

- 契约变更时同步更新 [04-Plugin-System](./04-Plugin-System.md)
  与本文 §五、§十一。
- 热加载 (#102) 落地后增补 §10 的 Loader API 与安全模型。
- §9.1 已列出官方 provider 单测路径；新增官方包时同步更新该表。

---

# 第三部分 M3 存储插件回归清单

---

## 一、范围与目标

验证 M3 **StoragePluginRegistry + `@pixuli/provider-github/gitee`**
在三端（Web、Desktop、Mobile）的核心用户路径可用：

| 能力     | 说明                                          |
| -------- | --------------------------------------------- |
| 配置源   | 添加 / 编辑 / 删除 GitHub 或 Gitee 仓库源     |
| 列表     | 切换源后加载图片列表                          |
| 上传     | 单张上传（含元数据 sidecar）                  |
| 删除     | 单张删除（含元数据清理）                      |
| 切换源   | 多源并存时切换当前源                          |
| 导入导出 | 配置 JSON 含 `pluginId`（v2.0）；旧格式可导入 |

**不在本清单**：幻灯片/时间线等已裁剪功能；真实 API 限流/大文件性能（另测）。

---

## 二、自动化基线（合并 PR 前必绿）

在仓库根目录执行：

```bash
pnpm test
```

**签收（REF-310）**：`pnpm test` 全绿，**540** tests（37 files，2026-05-27）。

| 包 / 应用                           | 覆盖                                                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `@pixuli/core`                      | Registry、manifestUi、`sources` 归一化与 import/export                                                                                          |
| `@pixuli/provider-github` / `gitee` | Provider mock API、register                                                                                                                     |
| `@pixuli/ui`                        | ConfigModal 打开回显等                                                                                                                          |
| `apps/pixuli`                       | `uiStore.openConfigModalForEdit`、`resolveModalRepoConfig`、`useConfigManagement` 编辑保存、`useSourceManagement` 切源/删源、`storage/registry` |
| ~~`pixuli-common`~~                 | REF-311 已删除；存储见 `@pixuli/provider-`\*                                                                                                    |

### 2.1 单测与手工用例映射（代码路径）

| 手工 #                              | 自动化覆盖                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| W3                                  | `apps/pixuli/src/storage/__tests__/registry.test.ts`                               |
| W5–W6                               | `uiStore.test.ts`、`resolveModalRepoConfig.test.ts`、`useConfigManagement.test.ts` |
| W7、W15                             | `useSourceManagement.test.ts`                                                      |
| W12–W14                             | `@pixuli/core` `sources` import/export 单测                                        |
| M3                                  | `storageConfigEditInit.test.ts`（与 Mobile `StorageConfigModal` 编辑初始化同逻辑） |
| W9–W11、W1–W2、W4、W8、M1–M2、M4–M6 | 需真实仓库 Token，**手工签收**（见第四节）                                         |

---

## 三、测试账号与环境

- [ ] 准备 **GitHub** 测试仓库（私有/公有均可）与 \*\*Personal Access
  ```
  Token**（`repo` 权限）
  ```
- [ ] 准备 **Gitee** 测试仓库与 Token
- [ ] Web：`pnpm --filter pixuli dev`（或项目既定 web 脚本）
- [ ] Desktop：`pnpm --filter pixuli dev:desktop`（或 Electron 开发命令）
- [ ] Mobile（Capacitor）：`pnpm dev:android` / 真机安装 debug APK
- [ ] 可选：清空本地存储后测「首次添加源」（Web：`localStorage` 键
  ```
  `pixuli.sources.v3`）
  ```

---

## 四、Web / Desktop 手工用例

> Desktop 与 Web 共用 `apps/pixuli`，以下用例 **两端各跑一遍**（标记平台列）。

### 4.1 添加源

| #   | 步骤                                                                | 期望                                                       | Web | Desktop |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------- | --- | ------- |
| W1  | 侧边栏 → 添加源 → 选 **GitHub** → 填写 owner/repo/token/path → 保存 | 源出现在列表；自动选中；图片列表可加载（空仓库可为空列表） | ☐   | ☐       |
| W2  | 再添加 **Gitee** 源并保存                                           | 列表两条；切换 Gitee 后列表来自 Gitee 仓库                 | ☐   | ☐       |
| W3  | 添加源菜单仅显示 Registry 已注册插件（github、gitee）               | 与 `listStoragePluginManifests()` 一致                     | ☐   | ☐       |

### 4.2 编辑源（含 REF-312 / #109）

| #   | 步骤                                        | 期望                                                                            | Web | Desktop |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------- | --- | ------- |
| W4  | 保存 GitHub 源 A；再添加并选中 Gitee 源 B   | 当前选中为 B                                                                    | ☐   | ☐       |
| W5  | **不切换选中**，对源 A 右键/菜单 → **编辑** | 打开对应类型配置 Modal；**表单回显 A 的 owner/repo/token/path**（非 B、非空白） | ☑  | ☐       |
| W6  | 修改 path 或 branch → 保存 → 重新编辑 A     | 显示更新后的值                                                                  | ☐   | ☐       |

### 4.3 切换源与列表

| #   | 步骤               | 期望                             | Web | Desktop |
| --- | ------------------ | -------------------------------- | --- | ------- |
| W7  | 在 A、B 间切换选中 | 列表随源切换；loading/空态正常   | ☐   | ☐       |
| W8  | 刷新列表按钮       | 重新拉取当前源列表，无报错 Toast | ☐   | ☐       |

### 4.4 上传与删除

| #   | 步骤                                           | 期望                                             | Web | Desktop |
| --- | ---------------------------------------------- | ------------------------------------------------ | --- | ------- |
| W9  | 当前源上传一张 JPG/PNG                         | 列表出现新项；仓库 Contents API 可见文件         | ☐   | ☐       |
| W10 | 打开预览/元数据（若有）→ 修改描述或标签 → 保存 | 元数据 sidecar 更新或行为符合设计                | ☐   | ☐       |
| W11 | 删除该图片                                     | 列表移除；仓库中文件删除（或符合 provider 行为） | ☐   | ☐       |

### 4.5 配置导入导出（REF-306）

| #   | 步骤                                                | 期望                                          | Web | Desktop |
| --- | --------------------------------------------------- | --------------------------------------------- | --- | ------- |
| W12 | 在 GitHub 配置 Modal → 导出 JSON                    | 文件含 `version: "2.0"`、`pluginId: "github"` | ☐   | ☐       |
| W13 | 清除后 → 导入刚导出文件                             | 字段恢复；可保存为新源或更新                  | ☐   | ☐       |
| W14 | 导入旧版仅含 `type: "gitee"` 的 JSON（无 pluginId） | 归一化为 `pluginId: "gitee"` 并可保存         | ☐   | ☐       |

### 4.6 删除源

| #   | 步骤             | 期望                     | Web | Desktop |
| --- | ---------------- | ------------------------ | --- | ------- |
| W15 | 删除非当前选中源 | 列表更新；当前选中仍有效 | ☐   | ☐       |
| W16 | 删除当前选中源   | 选中回退或清空；无崩溃   | ☐   | ☐       |

---

## 五、Mobile 手工用例

| #   | 步骤                                      | 期望                                              | 完成 |
| --- | ----------------------------------------- | ------------------------------------------------- | ---- |
| M1  | 添加 GitHub 源并保存                      | 源列表可见；可进入图片 Tab                        | ☐    |
| M2  | 添加 Gitee 源；切换当前源                 | 列表随源切换                                      | ☐    |
| M3  | 编辑**非当前选中**的源（传入 `sourceId`） | `StorageConfigModal` 回显该源 config（#109 同类） | ☐    |
| M4  | 上传一张图片（相册/文件）                 | 成功；列表更新                                    | ☐    |
| M5  | 删除一张图片                              | 成功；列表更新                                    | ☐    |
| M6  | 配置导出/导入含 `pluginId`                | 与 Web 行为一致                                   | ☐    |

---

## 六、缺陷登记

| 现象                              | Issue                                                             | 状态                                                       |
| --------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| 编辑源时表单未回显（Web/Desktop） | [#109](https://github.com/trueLoving/Pixuli/issues/109) / REF-312 | 已修并签收：REF-312 PR；回归 W5 ☑                         |
| Gitee 图片无法加载（CORS/代理）   | [#123](https://github.com/trueLoving/Pixuli/issues/123) / REF-313 | ✅ Web dev / 桌面打包版代理；Vercel 沿用 `api/gitee-proxy` |
| （测试中发现新问题）              | 新建 Issue，label `m3` + `bug`                                    |                                                            |

---

## 七、签收

| 角色      | 姓名 | 日期       | 结论                                                                   |
| --------- | ---- | ---------- | ---------------------------------------------------------------------- |
| 开发      |      | 2026-05-27 | 自动化 ☑（540 tests）/ 手工 Web 部分 ☑（W5）/ Desktop ☐ / Mobile ☐   |
| 产品/测试 |      |            | REF-310 可关闭 ☑（自动化 + 关键路径手工；上传/删除待有 Token 时补测） |

全部必选用例通过后，在 [#79](https://github.com/trueLoving/Pixuli/issues/79)
勾选任务并关闭 Issue；REF-311（删除 `packages/common`）已完成，可进入 M4 /
REF-401。

---

## 相关文档

- [第一部分 §10.3](#十安全错误与测试)（体系设计）
- [第二部分 §9.3](#九测试与调试)（开发指南）
- [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) REF-310
