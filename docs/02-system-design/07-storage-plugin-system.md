# 存储插件体系设计

- **文档版本**：1.0
- **所属目录**：`docs/02-system-design`
- **计划编号**：REF-301（M3 存储插件 P0）
- **关联 Issue**：[#70](https://github.com/trueLoving/Pixuli/issues/70)
- **相关文档**：
  - [00-System-Design](./00-System-Design.md) — 系统分层与数据流
  - [08-storage-plugin-authoring](./08-storage-plugin-authoring.md)
    — 插件开发实操（REF-308）
  - [03-business-design/01-repository-source-management](../03-business-design/01-repository-source-management.md)
    — 仓库源业务模型
  - [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) — M3 REF-301～311 任务表

---

## 目录

- [一、方案概述](#一方案概述)
- [二、专业术语](#二专业术语)
- [三、背景与动机](#三背景与动机)
- [四、总体架构](#四总体架构)
- [五、核心契约（@pixuli/core/plugins）](#五核心契约pixulicoreplugins)
- [六、Provider 包约定](#六provider-包约定)
- [七、应用集成](#七应用集成)
- [八、配置与持久化演进](#八配置与持久化演进)
- [九、与现有存储实现的映射](#九与现有存储实现的映射)
- [十、安全、错误与测试](#十安全错误与测试)
- [十一、M3 迁移路线图](#十一m3-迁移路线图)
- [十二、附录](#十二附录)

---

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
| **渐进迁移**       | M3 先落地 GitHub/Gitee 两个官方 provider；`pixuli-common` 在 REF-311 整包删除前作为过渡空壳。          |

### 1.3 范围

| 在范围内                                                      | 不在范围内（M3 P0）                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| GitHub / Gitee 仓库图床的 list / upload / delete / 元数据更新 | Pixuli Server、MinIO、S3 等后端模式                                |
| `StoragePluginRegistry` 注册与 `create(pluginId, ctx)`        | 插件热加载、远程下载第三方 provider                                |
| 三端 `imageStore` 改用 Registry                               | 非存储类插件（图片处理 Processor 插件，见 02-cross-image-process） |

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
  subgraph apps [应用层 apps/pixuli · apps/mobile]
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

- `packages/core/**` 不得 import `@pixuli/ui` 或 `packages/ui/**`。
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

Provider 实例在 **`configure(config)` 之后**
方可调用业务方法（与当前「构造时传入 config」等价，便于 Registry 统一创建流程）。

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
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `deleteImage` 参数             | 契约使用 **仓库内路径 / 文件名**（`path`）；`imageStore` 在调用前由 `ImageItem` 解析，不再传 `imageId` 双参数。                                 |
| `uploadImage` 入参             | 扩展 `ImageUploadData.file` 为 `File \| string`，Mobile URI 经 `PlatformAdapter` 处理（与现 `GitHubStorageService.uploadImage` 一致）。         |
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

- 实现代码自 `packages/common/src/services/*StorageService.ts`
  **搬移**（REF-302/303），逻辑保持行为等价。
- 单元测试自 `packages/common/src/services/__tests__/` **迁出**（REF-309）。

### 6.3 依赖规则

| 允许                                       | 禁止                      |
| ------------------------------------------ | ------------------------- |
| `@pixuli/core`（types、platform、plugins） | `@pixuli/ui`、`react-dom` |
| 平台 API（`fetch`、经 adapter 的文件读）   | 直接 import `apps/*`      |
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
- `imageStore` 内维护 **`type: 'github' | 'gitee'` → `pluginId`** 映射表。

### 8.2 目标态（REF-306）

- 持久化 **`StoredSourceEntry[]`**，显式含 `pluginId`。
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

| 层级                   | 内容                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| `@pixuli/core/plugins` | Registry register/create/list；重复 register 行为                                |
| `@pixuli/provider-*`   | 自 common 迁出的 API mock 单测（REF-309）                                        |
| apps `imageStore`      | 集成测试：mock registry + mock provider                                          |
| REF-310                | [10-m3-storage-regression-checklist.md](./10-m3-storage-regression-checklist.md) |

---

## 十一、M3 迁移路线图

| ID          | 内容                                          | 与本文关系                       |
| ----------- | --------------------------------------------- | -------------------------------- |
| **REF-301** | core 契约与 Registry **定稿 + 代码对齐**      | **本文档 + types/registry 补全** |
| REF-302     | `@pixuli/provider-github`                     | §6 实现 GitHub                   |
| REF-303     | `@pixuli/provider-gitee`                      | §6 实现 Gitee                    |
| REF-304/305 | apps imageStore → Registry                    | §7.2                             |
| REF-306     | 持久化 `pluginId`                             | §8.2                             |
| REF-307     | UI 读 `listManifests`                         | §7.3                             |
| REF-308     | 插件开发文档 `08-storage-plugin-authoring.md` | 基于本文扩展                     |
| REF-309     | 单测迁移                                      | §10.3                            |
| REF-310     | M3 回归                                       | §10.3                            |
| REF-311     | 删除 `packages/common`                        | §4.1 移除 legacy                 |

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

| 路径                                                   | 说明                                     |
| ------------------------------------------------------ | ---------------------------------------- |
| `packages/core/src/plugins/types.ts`                   | 契约定义                                 |
| `packages/core/src/plugins/registry.ts`                | DefaultStoragePluginRegistry             |
| `packages/common/src/services/githubStorageService.ts` | 已迁至 `packages/plugin-provider-github` |
| `packages/common/src/services/giteeStorageService.ts`  | 已迁至 `packages/plugin-provider-gitee`  |
| `apps/pixuli/src/stores/imageStore.ts`                 | 待 REF-304                               |
| `apps/mobile/stores/imageStore.ts`                     | 待 REF-305                               |

### C. 文档维护

- M3 各 REF 合并后，更新 [00-System-Design](./00-System-Design.md)
  中「模块与职责」一节，将 `packages/common` 替换为 provider 包描述。
- REF-308 产出
  [08-storage-plugin-authoring.md](./08-storage-plugin-authoring.md)
  作为本文的**开发者实操**补充。
