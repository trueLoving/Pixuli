# Pixuli 架构说明

> 技术总览。产品规则见 [product.md](./product.md)；工程脚本见
> [app/README.md](../app/README.md)。

---

## 1. 原则

| 项       | 约定                                                        |
| -------- | ----------------------------------------------------------- |
| 三端     | Web + Desktop + Capacitor Android，共用 `app`               |
| 存储     | `StorageProvider` + `@pixuli/provider-*`；**无官方 Server** |
| 本地优先 | LocalVault 为 SSOT；同步显式触发                            |
| 包边界   | `core` / `provider-*` **禁止**依赖 `app/src/ui`             |
| 语言     | 业务默认 TypeScript                                         |

---

## 2. 分层

```text
用户：Web / Desktop / Capacitor
        │
        ▼
┌────────────── app ──────────────┐
│ layouts · features · stores · ui │
│ platforms/* · storage/registry   │
└────────┬────────────┬───────────┘
         ▼            ▼
  @pixuli/core   @pixuli/provider-*
  Vault · Sync   github / gitee
  plugins        （仅依赖 core）
```

| 层          | 职责                                             |
| ----------- | ------------------------------------------------ |
| app         | 路由、状态、壳、工作区适配、注册 provider、UI    |
| core        | 类型、Registry、LocalVault / Sync 契约、平台抽象 |
| provider-\* | 云 API、sync、`buildPublicUrl`；无 React         |

UI 分层：L1 `features/`+`stores/` · L2 薄 `src/ui` · L3
`layouts/`+`platforms/`+`boot/`。

---

## 3. 数据流

1. **浏览**：读本地 Vault 索引 → 当前文件夹浅层列表（虚拟窗口）。
2. **库内增删改 / 处理**：只写本地；`syncState: local-only` 等，不自动 enqueue
   push。
3. **同步**：用户触发 SyncEngine → Provider pull / push；不锁库。
4. **外链**：已同步资源用 `publicUrl` / `buildPublicUrl`；与同步分离。

Token 与连接配置仅存客户端。

**个人配置文件**（`pixuli-user-config`，`@pixuli/core/user-config`）：同一信封、
`blocks` 分块（现为 `preferences` /
`sources`）。导入按块覆盖、未知块跳过。设置 ·「个人配置备份」为整包入口（可选勾选远端）；设置 · 同步只读写
`sources` 块。旧 `pixuli-settings` / 单插件 JSON 仍可导入。

---

## 4. 存储插件

- 注册：`app/src/storage/registry.ts` → `registerGitHubProvider` /
  `registerGiteeProvider`（各包 `/register`）。
- 创建：`storageRegistry.create(pluginId, ctx)` →
  `createConfiguredStorageProvider`。
- 契约：`@pixuli/core/plugins`（`StorageProvider`、`StoragePluginRegistry`、manifest
  / capabilities）。
- 包 `exports` 直指 `src`；Vite / vitest 直接编译，不必先 `build:packages`。

实现细节以源码与
[`.cursor/skills/storage-provider`](../.cursor/skills/storage-provider/SKILL.md)
为准。远期 Obsidian 式通用插件见 Issue
[#126](https://github.com/trueLoving/Pixuli/issues/126)。

---

## 5. 本地工作区与同步（摘要）

- 远端配置 `path` =
  **configRoot**；工作区相对路径与远端（相对 configRoot）**1:1**。
- `.pixuli/` **永不同步**；各目录 `.metadata/manifest.json`
  描述本层文件并参与同步。
- UI：含根「/」在内，选中目录只看本层文件 + 子文件夹入口；进子夹再看里面（可懒拉取脏层）。整库摊平仅用于「在全部中搜索」。
- 无历史路径迁移负担（产品路径已按现行模型）。

---

## 6. 性能边界

- 热路径：索引 + 可视区虚拟窗口 + 缩略节流。
- 大库提示阈值约 500 / 5000；各层浅列表（含根 `/`）与全库搜索有上限（约 5000）。
- 不追求全库瞬时缩略或远端热路径零延迟。
- Backlog：单文件夹游标、持久缩略、远端真分页。

---

## 7. 图片处理

- 入口：资源库处理弹窗（非独立工具路由）。
- 实现：Canvas（`app/src/features/tools/imageProcessor`）；产物写回 Vault。
- 旧压缩/转换 Overlay 与设置总开关已移除。

---

## 8. 发版

| 规则   | 说明                                                               |
| ------ | ------------------------------------------------------------------ |
| SemVer | `app/package.json` 为产品版本 SSOT                                 |
| Tag    | 统一 `v{semver}`；分端亦可 `v{semver}-desktop` / `-android`        |
| CI     | `pnpm ci`（推 `main`）                                             |
| 发版   | `release.yml` 等 **workflow_dispatch**；Desktop / Android 手动触发 |

检查清单：三端冒烟、主路径（添加→同步→复制链接）无阻塞缺陷、CHANGELOG 单一版本节。不建议新用户安装 1.x 历史 tag。

---

## 9. 技术栈（摘要）

React + Vite · Electron · Capacitor · Zustand · TypeScript strict · pnpm
workspace。
