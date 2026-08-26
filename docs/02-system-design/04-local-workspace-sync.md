# 本地工作区与远端同步

- **文档版本**：2.0
- **计划**：REF-607 · [#144](https://github.com/trueLoving/Pixuli/issues/144)
- **最后核对**：2026-08-25
- **相关**：[03-plugin-system](./03-plugin-system.md) ·
  [04-asset-library-ui](../01-product/04-asset-library-ui.md) ·
  [03-three-platform-interaction](../01-product/03-three-platform-interaction-spec.md)

> **本地为 SSOT**；远端经 Provider
> **可选同步**。库内增删改不自动 push（产品口径见 04）。

---

## 一、架构

```text
LocalVault（本地文件 + .pixuli 索引/配置）
        │
   SyncEngine（队列 · pull · 冲突 LWW）
        │
StorageProvider（github / gitee …）
   sync.push / sync.pull / buildPublicUrl
```

| 组件               | 位置                  | 职责                                               |
| ------------------ | --------------------- | -------------------------------------------------- |
| `WorkspaceAdapter` | `app/src/platforms/*` | 按端读写目录（Electron FS / OPFS·FSA / Capacitor） |
| `LocalVault`       | `@pixuli/core`        | 本地资源与索引                                     |
| `SyncEngine`       | `@pixuli/core`        | 待推送队列、pull、冲突记录                         |
| `workspaceStore`   | app                   | 当前工作区路径与状态                               |
| Provider sync      | `@pixuli/provider-*`  | 真正 push/pull 与公网 URL                          |

---

## 二、原则

| 原则                  | 说明                                                 |
| --------------------- | ---------------------------------------------------- |
| 本地 SSOT             | 列表/搜索/批处理默认读本地                           |
| Core / Provider 无 UI | 平台 IO 经 Adapter 注入                              |
| 同步显式              | 用户点同步；与「发布」分离                           |
| 冲突                  | P0：LWW + 冲突列表 + 手动重试                        |
| Gitee 图床            | 无 Host 图片代理；分享走 `buildPublicUrl` 直链（P7） |

---

## 三、目录约定（概念）

工作区根下典型布局（实现细节以代码为准）：

```text
{vault}/
  …用户文件/文件夹…
  .pixuli/
    config.json    # 工作区与连接引用
    index…         # 资源索引
    folders.json   # 显式空文件夹（树 CRUD；仅本地）
```

空文件夹靠 `.pixuli/folders.json` 登记；有文件的目录仍由 index 内 `relativePath`
派生。文件夹新建 / 重命名 / 删除**只改本机**，不自动同步远端。

---

## 四、同步行为（摘要）

- **Push**：本地变更入队 → Provider 上传 / commit（策略因云而异）。
- **Pull**：拉取远端变更合并进本地；冲突进列表。
- **URL**：`getRawUrl` / `buildPublicUrl`
  / 链接种类解析；复制链接区分本地预览 vs 远端公网。
- **断点续传**：属 Provider 能力，非库内删改路径（见产品 04）。

---

## 五、三端适配

| 端      | Adapter 要点                                  |
| ------- | --------------------------------------------- |
| Desktop | Electron 选目录 + 真实 FS（主路径）           |
| Web     | File System Access / OPFS；能力不足则降级说明 |
| Mobile  | Capacitor 工作区适配；与 Web 共用 UI          |

---

## 六、验收对照（已交付口径）

- 可打开/创建本地工作区并浏览。
- 连接 GitHub/Gitee 后可手动 sync。
- 公网链接不依赖已退役的 Gitee 图片 Host 代理。
- core/provider 无 UI 依赖。

分阶段历史以 GitHub REF-607（#144）及 closed 子 Issue 为准。

---

## 七、修订

| 版本 | 日期       | 说明               |
| ---- | ---------- | ------------------ |
| 2.0  | 2026-08-25 | 瘦身为现行架构摘要 |
| 1.0  | 2026-06-11 | REF-607 设计稿     |
