# M3 存储插件回归清单（REF-310）

- **文档版本**：1.0
- **所属目录**：`docs/02-system-design`
- **计划编号**：REF-310
- **关联 Issue**：[#79](https://github.com/trueLoving/Pixuli/issues/79)
- **前置**：REF-301～309 已合并；本清单用于手工冒烟与发布前核对

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
| `pixuli-common`                     | re-export 冒烟（REF-311 前）                                                                                                                    |

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

- [ ] 准备 **GitHub** 测试仓库（私有/公有均可）与 **Personal Access
      Token**（`repo` 权限）
- [ ] 准备 **Gitee** 测试仓库与 Token
- [ ] Web：`pnpm --filter pixuli dev`（或项目既定 web 脚本）
- [ ] Desktop：`pnpm --filter pixuli dev:desktop`（或 Electron 开发命令）
- [ ] Mobile：`pnpm --filter pixuli-mobile dev`（Expo）
- [ ] 可选：清空本地存储后测「首次添加源」（Web：`localStorage` 键
      `pixuli.sources.v3`）

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

| 现象                              | Issue                                                             | 状态                               |
| --------------------------------- | ----------------------------------------------------------------- | ---------------------------------- |
| 编辑源时表单未回显（Web/Desktop） | [#109](https://github.com/trueLoving/Pixuli/issues/109) / REF-312 | 已修并签收：REF-312 PR；回归 W5 ☑ |
| （测试中发现新问题）              | 新建 Issue，label `m3` + `bug`                                    |                                    |

---

## 七、签收

| 角色      | 姓名 | 日期       | 结论                                                                   |
| --------- | ---- | ---------- | ---------------------------------------------------------------------- |
| 开发      |      | 2026-05-27 | 自动化 ☑（540 tests）/ 手工 Web 部分 ☑（W5）/ Desktop ☐ / Mobile ☐   |
| 产品/测试 |      |            | REF-310 可关闭 ☑（自动化 + 关键路径手工；上传/删除待有 Token 时补测） |

全部必选用例通过后，在 [#79](https://github.com/trueLoving/Pixuli/issues/79)
勾选任务并关闭 Issue；再启动 REF-311（删除 `packages/common`）。

---

## 相关文档

- [07-storage-plugin-system.md](./07-storage-plugin-system.md) §10.3
- [08-storage-plugin-authoring.md](./08-storage-plugin-authoring.md) §9.3
- [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) REF-310
