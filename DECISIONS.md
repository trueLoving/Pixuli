# DECISIONS

> 产品与架构「为什么这样定」。进度见 [PLANS.md](./PLANS.md) 与 GitHub Issues。

---

## D1 · 为什么从 1.x 走向 2.0

1.x 本质是**远端图床客户端**：列表与上传贴着 Git
API，断网难用，删改与远端纠缠，工程面偏碎（独立 RN、曾探索 Server/WASM）。

需求扩大为：用开源云（GitHub /
Gitee 等）管自己的图、文档、视频——**云是同步与外链通道，本机工作区才是真相**。

| 决策        | 选择                                               |
| ----------- | -------------------------------------------------- |
| 产品主轴    | **本地工作区**；远端 = 可选同步 + 复制链接         |
| 官方 Server | **不做**                                           |
| 库内增删改  | **仅本地**；与同步分离                             |
| 工程        | 单仓 `app` + `@pixuli/core` + `@pixuli/provider-*` |

### 相对 1.x

| 维度     | 1.x                | 2.0                    |
| -------- | ------------------ | ---------------------- |
| 数据主轴 | 配源 → 读写远端    | 先开本地目录；同步显式 |
| 对象     | 以图为主           | 图 / PDF / 视频等同库  |
| Mobile   | 独立 Expo RN       | Capacitor，同 UI       |
| 存储     | 应用内硬编码       | provider 插件          |
| 展示     | 幻灯片 / 时间线等  | 已裁剪；资源库为主     |
| 后端     | 曾探索 Nest / WASM | 无官方 Server          |
| 删改     | 易与远端缠在一起   | 仅本地；同步单独入口   |

不建议新用户安装 1.x tag。

---

## D2 · 相关决策（摘要）

| ID   | 决策                        | 要点                       |
| ---- | --------------------------- | -------------------------- |
| D2.1 | 无官方 NestJS Server        | 存储走 Provider            |
| D2.2 | core / provider 禁止依赖 UI | 契约可独立演进             |
| D2.3 | UI 内联 `app/src/ui`        | 少一层包税                 |
| D2.4 | 展示裁剪                    | 聚焦资源管理               |
| D2.5 | Mobile = Capacitor          | 与 Web/Desktop 同 UI       |
| D2.6 | 默认 TypeScript             | 业务 `.ts`/`.tsx`          |
| D2.7 | 外链 = 复制链接             | 无用户向「发布」           |
| D2.8 | 处理在库内弹窗              | 按类型扩展；结果仅本机写回 |

---

## D3 · 同步路径（configRoot）与 manifest

| 项                        | 选择                                          |
| ------------------------- | --------------------------------------------- |
| 远端 `path`               | **configRoot**（可为空 = 仓根镜像）           |
| 路径映射                  | 工作区相对路径 ↔ 远端相对 configRoot **1:1** |
| `.pixuli/`                | **永不同步**                                  |
| `.metadata/manifest.json` | **同步**；描述本层直接文件                    |
| UI                        | 本层浅列表；进夹可懒拉                        |
| 兼容                      | 不做 1.x 路径迁移                             |

详见 [docs/architecture.md](docs/architecture.md)。

---

## D4 · 库内条目类型用 Asset\*

产品对象已是图 / PDF / 视频 / Markdown /
txt 等同库，契约层条目类型与相关源文件用 `Asset*`（如
`types/asset.ts`、`assetStore`、`asset-upload/`）；`Image*`
仅保留位图处理（Compression / Crop / Process / Conversion / Capture，含
`imageProcess.ts` / `imageUtils` /
`ImageCropModal`）。`StorageProvider.listImages` 等方法名可后续再迁。

---

## D5 · 同步忽略规则（本机）

| 项             | 选择                                                          |
| -------------- | ------------------------------------------------------------- |
| 规则文件       | `.pixuli/sync-ignore.json`（落在永不同步目录）                |
| 范围           | 工作区级；push / pull 双向跳过匹配路径                        |
| 库内           | 匹配文件仍可见、可编辑；过滤只作用于同步                      |
| 已同步后加忽略 | **不自动删远端**；仅停止后续同步                              |
| 匹配语义       | gitignore 子集（`*` / `**` / 精确路径）；v1 无 `!` 取反       |
| 与系统排除     | 分开：`.pixuli/` 硬排除 + 用户 ignore + 扩展名/白名单拉取策略 |

详见 [docs/architecture.md](docs/architecture.md)。

新增重大取舍时追加 `D6…`，并在 PR / Issue 引用编号。
