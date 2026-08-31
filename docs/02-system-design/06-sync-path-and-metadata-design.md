# 同步路径与元数据设计（讨论纪要）

- **文档版本**：1.0
- **最后更新**：2026-08-31
- **状态**：设计共识（部分已落地，见下文「实现状态」）
- **相关**：[04-local-workspace-sync](./04-local-workspace-sync.md) ·
  [03-plugin-system](./03-plugin-system.md) ·
  [04-asset-library-ui](../01-product/04-asset-library-ui.md)

> 本文档汇总 2026-08-31 关于「本地工作区 ↔
> Git 远端」路径映射、目录结构与元数据存储的设计讨论。
> **尚未正式对外发布，不考虑旧数据兼容。**

---

## 一、背景与问题

### 1.1 已暴露的 Bug（文件夹级同步）

**现象**：在本地新建子文件夹并添加文件 → 同步到远端 → 文件全部落在 `images/`
根目录；再 pull 回本地 → 文件被挪到 `images/` 下，原文件夹结构破坏。

**根因（修复前）**：同步链路按「文件级 / 扁平」处理，而非保留目录结构：

| 环节          | 问题                                                          |
| ------------- | ------------------------------------------------------------- |
| Push          | `resolveRemotePathForPush` 丢弃子目录，只用展示名或 basename  |
| Provider 上传 | 远端路径为 `{config.path}/{fileName}`，无子路径               |
| Pull          | `listImages` 只列根目录；落盘路径写死为 `images/{remotePath}` |
| 对账          | 按 basename / 展示名匹配，易错配                              |

**已落地修复（ interim ）**：在现有 `localPathPrefix` / `remotePathPrefix`
模型下，push/pull 保留 `images/`
**内部**子目录结构；Provider 支持递归 list 与带子路径的上传/删除。见
`packages/core/src/vault/syncApply.ts` 与各 `provider-*`。

该修复仍是「prefix + 映射层」思路，下文 **configRoot** 为更简洁的目标架构。

### 1.2 设计动机

- 避免维护「本地路径 ↔ 远端路径 ↔ 展示名」多套映射。
- 支持工作区多顶层目录（如 `images/`、`video/`），而非把所有资源都塞进
  `images/`。
- 减少 Git API 请求（元数据从「一文件一侧car」改为「一目录一 manifest」）。

---

## 二、configRoot：路径 1:1 镜像

### 2.1 定义

**configRoot** 在 GitHub /
Gitee 数据源配置时指定，表示远端仓库内的**挂载点子目录**。

本地工作区相对路径与远端路径关系：

```text
远端完整路径 = configRoot + '/' + 本地工作区相对路径
```

（`configRoot` 为空时，表示直接挂在仓库根下；实现时需 normalize 首尾 `/`。）

### 2.2 示例

configRoot = `root` 时：

```text
本地工作区                         远端仓库
├── .pixuli/          ✗ 不同步
├── .metadata/        ✓ 同步    →  root/.metadata/…
├── images/1.png      ✓ 同步    →  root/images/1.png
├── images/trip/a.jpg ✓ 同步    →  root/images/trip/a.jpg
└── video/1.mp4       ✓ 同步    →  root/video/1.mp4
```

要点：

- **`images` 只是工作区里的普通文件夹**，不再是「同步边界」或「远端根」。
- **不需要** `localPathPrefix` 与 `remotePathPrefix` 双字段；可合并为单一
  `configRoot`（Provider 侧拼接完整路径）。
- 条目上的 `remotePath`
  可退化为可推导字段：**恒等于工作区相对路径**（或与之间 1:1）。

### 2.3 Provider 边界

Provider 内部统一：

```text
fullRemotePath = join(configRoot, relativePath)
```

`syncPush` / `syncPull` 传递的 `remotePath` 即工作区相对路径（如
`images/trip/a.jpg`），不在 core 层做 strip/join 特例。

### 2.4 与旧 `config.path` 的区别

|                      | 旧模型（`config.path` = `images`）   | 新模型（`configRoot`）                          |
| -------------------- | ------------------------------------ | ----------------------------------------------- |
| 语义                 | 资源必须落在 `images/` 树下          | 整个工作区用户目录树镜像到 configRoot 下        |
| 本地                 | 同步范围主要是 `images/**`           | 工作区根下各目录（`images/`、`video/`…）        |
| 映射                 | prefix strip/join + 根目录展示名特例 | 本地相对路径 = 远端相对路径（相对 configRoot）  |
| 与 `images` 同级目录 | 易被 flatten 到远端 `images/` 根     | 原样同步，如 `video/1.mp4` → `root/video/1.mp4` |

---

## 三、同步边界

| 路径                                        | 是否同步 | 说明                                                     |
| ------------------------------------------- | -------- | -------------------------------------------------------- |
| **`.pixuli/`**                              | ✗        | 工作区本地配置与索引（`config.json`、index、folders 等） |
| **`.metadata/`**（及各目录下 `.metadata/`） | ✓        | 资源 sidecar 元数据，需上云以便多端 pull 还原            |
| **用户文件与文件夹**                        | ✓        | 相对工作区根的路径 1:1 映射到 `configRoot/` 下           |

**兼容策略**：产品尚未正式使用，**不做历史数据迁移**；可按新模型直接重构。

---

## 四、元数据（metadata）设计

### 4.1 现状问题

- **扁平 sidecar**：`.metadata/{name}.metadata.{ext}.json`，key 多为
  **basename**。
- 嵌套路径下不同目录的同名文件可能 **sidecar 冲突**（如 `images/a/1.png` 与
  `video/a/1.png`）。
- **API 次数**：list 后 per-file 拉 metadata，规模为 O(文件数)。

### 4.2 目标：按目录一份 manifest（shallow）

与 UI「按层浏览」对齐：**每个目录只描述本层直接文件**，不含子目录内文件。

```text
images/
├── .metadata/manifest.json    ← 仅 images/ 本层
├── 1.png
└── trip/
    ├── .metadata/manifest.json ← 仅 trip/ 本层
    ├── a.jpg
    └── 2024/
        └── .metadata/manifest.json
```

**manifest.json 结构（草案）**：

```json
{
  "version": 1,
  "files": {
    "1.png": {
      "name": "1.png",
      "tags": ["demo"],
      "description": "",
      "width": 800,
      "height": 600,
      "size": 12345,
      "type": "image/png",
      "createdAt": "2026-08-31T00:00:00.000Z",
      "updatedAt": "2026-08-31T00:00:00.000Z"
    }
  }
}
```

| 规则   | 说明                                                                  |
| ------ | --------------------------------------------------------------------- |
| 作用域 | 当前目录**直接文件**；子目录各自有 manifest                           |
| key    | 本层**文件名**（basename），层内唯一                                  |
| 读写   | 浏览某目录：1× list + 1× 读 manifest；改标签：读-改-写该目录 manifest |
| 同步   | 随 configRoot 1:1 同步；UI 文件夹树中隐藏 `.metadata`                 |

**不建议**：

- 全库单一超大 JSON（并发编辑 SHA 冲突、整文件重写成本高）。
- 继续全局扁平 per-file sidecar（嵌套 + API 次数问题）。

**待决**：删除文件的 tombstone、manifest 内是否保留 `captureMetadata`
等字段，implement 前定 schema 即可。

---

## 五、文件夹嵌套与 UI 语义

### 5.1 原则：Explorer 模型（按层 shallow）

与 manifest 边界一致：

```text
选中 a/ 时
├── 左侧树：展示 a → b → …（嵌套结构）
└── 右侧网格：仅 a/ 下直接文件（不含 a/b/ 内文件）
```

实现上
`filterImagesByFolder(..., { shallow: true })`（默认）即此语义；**不应**在父目录 flatten 展示所有子孙文件。

### 5.2 可选增强：网格中的子文件夹入口

若用户进 `a/` 时不易发现
`b/`，可在网格增加**当前层子目录卡片**（点击等价于在树中选中 `a/b`）：

```text
[📁 b]  [📁 2024]  [🖼 x.png]  [🖼 y.png]
```

- 树：全局结构导航。
- 网格文件夹卡片：本层子目录入口。
- 文件列表：仍 shallow，不递归 flatten。

### 5.3 与 metadata 的对应关系

| UI                   | Metadata                         |
| -------------------- | -------------------------------- |
| 选中目录 `D`         | 读 `D/.metadata/manifest.json`   |
| 只显示 `D/` 本层文件 | manifest 只含 `D/` 本层条目      |
| 进入 `D/b/`          | 读 `D/b/.metadata/manifest.json` |

---

## 六、实现状态与建议顺序

### 6.1 已落地（2026-08-31）

- [x] **D3 configRoot**：工作区相对路径 ↔ 远端 1:1；`.pixuli/` 排除同步。
- [x] **metadata manifest**：各目录 `{dir}/.metadata/manifest.json`（GitHub /
      Gitee Provider）。
- [x] Provider：`joinConfigRoot(config.path, relativePath)`；递归 list；跳过
      `.pixuli`。

### 6.2 待实现 / 可选

1. **App UI**：网格子文件夹卡片；文件夹树隐藏 `.metadata`。
2. **产品文案**：配置项 `path` 标签改为「远端挂载目录 (configRoot)」。

### 6.3 建议不改动的底线

- `.pixuli/` 永不上云（AGENTS / 产品底线）。
- Core 与 Provider 不依赖 UI。
- 同步仍为用户显式触发（见
  [04-local-workspace-sync](./04-local-workspace-sync.md)）。

---

## 七、修订记录

| 版本 | 日期       | 说明                                                           |
| ---- | ---------- | -------------------------------------------------------------- |
| 1.0  | 2026-08-31 | 初始：configRoot、同步边界、manifest metadata、UI shallow 共识 |
