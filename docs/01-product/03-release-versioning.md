# Pixuli 版本发布与历史 Releases 说明

- **文档版本**：1.2
- **计划编号**：REF-409（M4 工程基线）
- **关联 Issue**：[#113](https://github.com/trueLoving/Pixuli/issues/113)
- **最后核对**：2026-05-27 · 适用分支 `main`
- **分工**：本轮 Breaking 变更条目见
  [#83](https://github.com/trueLoving/Pixuli/issues/83)（REF-404）；本文负责**历史盘点**与**长期发布制度**。

---

## 一、文档目的

1. **Part A**：盘点 GitHub Releases / git
   tags，给出「版本—能力—是否仍建议安装」对照表。
2. **Part B**：定义后续 Desktop / Mobile /
   Web 的版本号、标签、CHANGELOG、CI 与用户沟通流程。

维护者发版时按 **§五、发版检查清单** 执行即可。

---

## 二、Part A — 历史发布版本梳理

### 2.1 三端版本现状

| 阶段                               | Desktop                                     | Mobile                                | Web / PWA                                 |
| ---------------------------------- | ------------------------------------------- | ------------------------------------- | ----------------------------------------- |
| **重构前（已发 tag）**             | `apps/pixuli` 最高 **1.3.0** · `v*-desktop` | `apps/mobile` **1.0.0** · `v*-mobile` | 无 `v*-web` tag；版本语义随 `apps/pixuli` |
| **重构后基线（已确定，未发 tag）** | **`2.0.0`**                                 | **`2.0.0`**                           | **`2.0.0`**                               |

### 2.1.1 三端交付物与 git tag（2.0.0 起）

**产品 semver 三端一致**；**每端各打一条 git tag**（`{semver}`
相同，后缀区分渠道）：

| 端            | Git tag                           | 当前交付物                                                                                                                | 平台 / 渠道说明                                                                      |
| ------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Desktop**   | `v{semver}-desktop`               | Windows `.exe`；macOS Intel `.dmg`（x64）；macOS Apple Silicon `.dmg`（arm64）                                            | 经 GitHub Releases 附件分发；`apps/pixuli` **2.0.0**                                 |
| **Mobile**    | `v{semver}-android`（目标，#153） | Android `.apk`（Capacitor）                                                                                               | `apps/pixuli` + `android/` **2.0.0**；历史 RN 见 `v*-mobile` / `archive/apps/mobile` |
| **Web / PWA** | `v{semver}-web`                   | ① **网站部署实例**（如 [pixuli-web.vercel.app](https://pixuli-web.vercel.app/)）；② **Docker 镜像** `pixuli-web:{semver}` | 构建元数据来自 `apps/pixuli`；应用内 `__VERSION_INFO__` 与 Desktop 同源              |

> **1.x 与 2.x 差异**：1.x 仅 Desktop / Mobile 有 tag，Web 无
> `v*-web`。**2.0.0 起 Web 与 Desktop、Mobile 一样打
> `v{semver}-web`**，并在 GitHub Release 中记录部署说明与 Docker 拉取方式。

### 2.2 Git tags 与 GitHub Releases 对照（截至 2026-05-27）

| Git tag          | GitHub Release 日期          | 端                | 安装包 / 附件                            | 仍建议新用户？                                  |
| ---------------- | ---------------------------- | ----------------- | ---------------------------------------- | ----------------------------------------------- |
| `v1.3.0-desktop` | 2025-11-21                   | Desktop           | `.exe`（Win）、`.dmg`（mac x64 / arm64） | **否** — 含已下线能力，见 §2.3                  |
| `v1.2.0-desktop` | 2025-10-26                   | Desktop           | 同上                                     | **否**                                          |
| `v1.1.0-desktop` | 2025-09-15                   | Desktop           | 同上                                     | **否**                                          |
| `v1.0.0-desktop` | 2025-11-12（Release 无附件） | Desktop           | 无构建产物                               | **否** — 标记性 Release，与 `v1.1.0` 同提交祖先 |
| `v1.0.0-mobile`  | 2025-11-21                   | Mobile（Android） | `Pixuli_1.0.0.apk`                       | **否** — 含幻灯片等已裁剪功能                   |

**标签命名约定**：

```text
# 1.x（历史）
v{MAJOR}.{MINOR}.{PATCH}-desktop
v{MAJOR}.{MINOR}.{PATCH}-mobile

# 2.0.0 起（三端统一 semver，各一条 tag）
v{MAJOR}.{MINOR}.{PATCH}-desktop
v{MAJOR}.{MINOR}.{PATCH}-mobile
v{MAJOR}.{MINOR}.{PATCH}-web
```

附件 / 产物命名示例：

| 端      | 命名                                                                          |
| ------- | ----------------------------------------------------------------------------- |
| Desktop | `Pixuli_{semver}.exe`、`Pixuli_{semver}_x64.dmg`、`Pixuli_{semver}_arm64.dmg` |
| Mobile  | `Pixuli_{semver}.apk`（iOS 待定后增加 `Pixuli_{semver}.ipa` 等）              |
| Web     | Release Notes 注明演示站 URL + `docker pull …/pixuli-web:{semver}`            |

### 2.3 版本—能力矩阵（相对当前 `main` 基线）

「当前基线」指 M1～M3 重构后产品：图床网格/列表、压缩/转换工具、GitHub/Gitee 插件化存储；**无**幻灯片、时间线、照片墙、Upyun、官方 NestJS 主路径、Desktop
WASM 依赖。

| 版本                            | Desktop 主要增量                                    | Mobile 主要增量                          | 相对基线已移除 / 过时能力                                                                        | 升级建议                                                                 |
| ------------------------------- | --------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **1.3.0**                       | 元数据多标签、Gitee 优化、发版流水线增强            | —                                        | Upyun（本版 CHANGELOG 已记 Removed）；**幻灯片**（本版 Technical 仍写「实现幻灯片」，M1 后已删） | 等待重构后首个 tag；读 CHANGELOG `[Unreleased]`                          |
| **1.2.0**                       | 操作日志、批量删除、Gitee 双源、系统托盘、WASM AI   | —                                        | WASM 主路径、幻灯片相关依赖                                                                      | 同上                                                                     |
| **1.1.0**                       | 独立压缩/转换窗、Upyun、菜单栏                      | —                                        | Upyun、WASM                                                                                      | 同上                                                                     |
| **1.0.0**                       | 初版桌面：GitHub 图床、多窗口、WASM                 | —                                        | 整包为重构前架构                                                                                 | 同上                                                                     |
| **Mobile 1.0.0**                | —                                                   | 图床、GitHub/Gitee、**幻灯片播放**、相机 | 幻灯片、浏览模式 Tab（M1 与 Web/Desktop 对齐裁剪）                                               | 同上                                                                     |
| **`2.0.0`（`main`，未发 tag）** | M1 减负、M3 存储插件、`@pixuli/core` / `@pixuli/ui` | M1 裁剪对齐                              | 见 [CHANGELOG Unreleased](../../CHANGELOG.md#unreleased)                                         | **开发 / 内测推荐基线**；首发将打 `v2.0.0-{desktop,mobile,web}` 三条 tag |

### 2.4 CHANGELOG 与 Releases 对齐说明

| 项                              | 处理                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 过时能力描述（Upyun、幻灯片等） | 历史版本条目**保留**作考古；顶部 `[Unreleased]` 与 [04-backlog.md](../04-backlog.md) 标明「非当前产品」             |
| Desktop 1.0.0 日期              | CHANGELOG 写 2025-09-13（tag 指向提交日）；GitHub Release 页面为 2025-11-12，**无安装包** — 以 tag + Release 表为准 |
| Web 独立章节                    | CHANGELOG 仅有 `[Unreleased]`；1.x 无 `v*-web` tag                                                                  |
| 下一步                          | 首发 **2.0.0** 时打齐三端 tag，并将 `[Unreleased]` 下沉为 `## [2.0.0]`                                              |

---

## 三、Part B — 后续版本发布策略

### 3.1 SemVer 2.0 与何时升版

遵循 [Semantic Versioning 2.0](https://semver.org/lang/zh-CN/) 与
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

| 变更类型                              | 版本位    | 示例                                   |
| ------------------------------------- | --------- | -------------------------------------- |
| Breaking（API、配置格式、已移除功能） | **MAJOR** | **2.0.0**（相对 1.x 重构基线，已确定） |
| 新功能、向后兼容                      | MINOR     | **2.1.0**（三端同步）                  |
| 修复、文档、无行为变化                | PATCH     | **2.0.1**（三端同步）                  |

**Monorepo 原则（2.0.0 起执行，已确定）**：

1. **统一产品版本号**：`apps/pixuli`（含 Capacitor `android/`
   与 Web 构建元数据）**共用同一 semver**（当前
   **2.0.0**）。三端融合后仍保持**一个对用户可见的版本号**。
2. **分端体现在 git tag 与交付物**：同一 `{semver}` 对应 tag —
   `v{semver}-desktop`、`v{semver}-android`（目标）、`v{semver}-web`
   — 分别标记 Desktop 安装包、Mobile APK、Web 部署（站点 +
   Docker）的**发布锚点**。历史 RN 使用 `v*-mobile`。
3. **升版须三端对齐**：发 MINOR/PATCH 时，同一发布周期内同步更新 `apps/pixuli`
   版本字段，并打齐各端 tag；CHANGELOG 使用**单一版本节**
   `## [2.x.y]`，下分 Desktop / Web / Mobile 子项（若该端有差异）。
4. 根目录 `package.json` **无** `version` 字段；版本以
   `apps/pixuli/package.json` 为 SSOT。

**与 1.x 的差异**：1.x 时代 Desktop（1.3.0）与 Mobile（1.0.0）版本号独立；**2.0.0 起废弃该做法**。

### 3.2 Git 标签与 GitHub Release

| 端          | Tag 格式            | Release 标题模板           | 交付物                                                                                                                |
| ----------- | ------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Desktop** | `v{semver}-desktop` | `Pixuli Desktop v{semver}` | Windows `Pixuli_{semver}.exe`；macOS Intel `Pixuli_{semver}_x64.dmg`；macOS Apple Silicon `Pixuli_{semver}_arm64.dmg` |
| **Mobile**  | `v{semver}-mobile`  | `Pixuli Mobile v{semver}`  | Android `Pixuli_{semver}.apk`；**iOS 后续待定**（首发不含 ipa）                                                       |
| **Web**     | `v{semver}-web`     | `Pixuli Web v{semver}`     | 演示站部署说明 + Docker `pixuli-web:{semver}`（见 §3.3）                                                              |

同一 semver 发版时，三条 tag 指向**同一产品版本**；允许分 workflow 先后打 tag，但
`{semver}` 必须一致。

**Release Notes 模板 — Desktop**：

```markdown
## Pixuli Desktop v{semver}

Built from `{branch}` @ `{short_sha}`.

### Downloads

- Windows (x64): Pixuli\_{semver}.exe
- macOS (Intel): Pixuli\_{semver}\_x64.dmg
- macOS (Apple Silicon): Pixuli\_{semver}\_arm64.dmg

Full changelog: https://github.com/trueLoving/Pixuli/blob/main/CHANGELOG.md
```

**Release Notes 模板 — Mobile**：

```markdown
## Pixuli Mobile v{semver}

### Downloads

- Android: Pixuli\_{semver}.apk

Full changelog: https://github.com/trueLoving/Pixuli/blob/main/CHANGELOG.md
```

**Release Notes 模板 — Web**：

```markdown
## Pixuli Web v{semver}

### Access

- Live demo: https://pixuli-web.vercel.app/ （部署于 tag `{short_sha}`）
- Docker: docker run -d -p 8080:80 trueloving/pixuli-web:{semver}

Full changelog: https://github.com/trueLoving/Pixuli/blob/main/CHANGELOG.md
```

### 3.3 Web / PWA 发布

| 渠道              | 版本标识                                                         | 发版动作                                                             |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| **网站部署实例**  | 产品 semver **{semver}**（与三端一致）                           | 将 `main`（或 release 分支）部署到 Vercel 等；打 tag `v{semver}-web` |
| **Docker 自托管** | 镜像 tag **`{semver}`**（与产品版本一致；`latest` 仅作滚动指针） | `release-web.yml` 构建并 push；写入 `v{semver}-web` Release Notes    |
| **应用内**        | `__VERSION_INFO__.version` = `{semver}`                          | PWA 更新提示依赖 service worker；关于页展示构建版本                  |

Web 无独立 `package.json` 版本字段，以 `apps/pixuli` 为准；**必须**与 Desktop /
Mobile 同步 bump。

### 3.4 CHANGELOG 维护流程

| 角色          | 职责                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------- |
| PR 作者       | 用户可见变更写入 `CHANGELOG.md` `[Unreleased]` 对应分类（Added / Changed / Removed / **Breaking**） |
| REF-404 (#83) | 本轮重构 Breaking 条目完整性                                                                        |
| 发版维护者    | 发版时将 `[Unreleased]` 下沉为 `## [x.y.z]` 并更新 compare 链接                                     |

**分类约定**：与 Keep a Changelog 一致；Breaking 必须同时在 `[Unreleased]` 顶部
**⚠️ Breaking Changes** 汇总（当前已采用）。

### 3.5 CI/CD 衔接

| Workflow                                                           | 触发                | 产出                                                                 | 与版本关系                                                                                    |
| ------------------------------------------------------------------ | ------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [ci.yml](../../.github/workflows/ci.yml)                           | PR / push / manual  | **`build:packages`**、lint、test、Web/Desktop；**Android debug APK** | 不发版                                                                                        |
| [release-desktop.yml](../../.github/workflows/release-desktop.yml) | `workflow_dispatch` | Win/mac 安装包；`v{input}-desktop` tag + Release                     | 输入 version，写回 `apps/pixuli/package.json`                                                 |
| [release-android.yml](../../.github/workflows/release-android.yml) | `workflow_dispatch` | `build:android` → APK；`v{semver}-android` tag + Release             | 可选 secrets 正式签名；无 secrets 时用 debug 证书                                             |
| [release-web.yml](../../.github/workflows/release-web.yml)         | `workflow_dispatch` | Docker 镜像 push                                                     | 镜像 tag = `{semver}`；配合打 `v{semver}-web` 与 GitHub Release（CI 衔接待 REF-411/#84 强化） |

**Desktop 发版步骤（摘要）**：

1. 确认 `main` 上 CI 绿；`CHANGELOG` 已更新。
2. Actions →「发布 Pixuli Desktop」→ 填写
   `version`、平台、`is-publish=true`、选择分支。
3. 核对 Release 附件与 tag `v{version}-desktop`。
4. 更新 README / Wiki「当前稳定版」表述（若对外宣布）。

**Mobile（Capacitor Android）发版步骤（摘要，#153 落地 workflow 后）**：

1. 确认 `apps/pixuli` 版本与 CHANGELOG；`pnpm build:android:release`
   本地或 CI 通过。
2. Actions →「发布 Pixuli Android」→ 填写 `version`、`is-publish=true`。
3. 确认 `v{version}-android` Release 含 `app-release.apk`。

**历史**：Expo RN 曾用 `release-mobile.yml` + `v*-mobile`；RN 已归档至
`archive/apps/mobile`。

**Web 发版步骤（摘要）**：

1. 确认 `apps/pixuli` 版本已与 Mobile 对齐；`pnpm build:web` 通过。
2. 部署演示站（或自托管实例）至目标 commit。
3. Actions →「发布 Pixuli Web Docker 镜像」→ 镜像 tag `{version}`。
4. 创建 tag `v{version}-web` 与 GitHub Release（部署 URL + `docker pull`
   说明）。

### 3.6 基线版本 2.0.0（已确定）

| 决策项               | 结论                                                    |
| -------------------- | ------------------------------------------------------- |
| 相对 1.x 的 MAJOR    | **2.0.0** — M1 产品裁剪 + M3 存储插件等 Breaking        |
| 三端产品版本号       | **统一 2.0.0**（源码已写入各 app）                      |
| Desktop tag + 交付物 | `v2.0.0-desktop` — Win `.exe`、macOS x64 / arm64 `.dmg` |
| Mobile tag + 交付物  | `v2.0.0-android` — Android `.apk`（**iOS 后续待定**）   |
| Web tag + 交付物     | `v2.0.0-web` — 演示站部署 + Docker `pixuli-web:2.0.0`   |
| 从 1.x 升级          | 1.x 用户须读 CHANGELOG Breaking；**无** 1.4.x 连续版本  |

**后续版本示例**：发 **2.1.0** 时产品版本三端均为 2.1.0，并打齐
`v2.1.0-desktop`、`v2.1.0-android`、`v2.1.0-web`。

### 3.7 用户可见入口

| 入口                                                     | 内容                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| [README.md](../../README.md)                             | 下载链到 Releases；Upgrade note 指向 CHANGELOG                    |
| [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) | REF-408 手册附录可增「版本与升级」链到本文                        |
| 应用内                                                   | Desktop：版本信息窗（`apps/pixuli`）；Mobile：`app.json` / 关于页 |
| [CHANGELOG.md](../../CHANGELOG.md)                       | 唯一详细变更日志                                                  |

---

## 四、与 REF-404 (#83) 的分工

| Issue                    | 职责                                                 |
| ------------------------ | ---------------------------------------------------- |
| **#83 REF-404**          | 记录**本轮**重构产生的 Breaking Changes 到 CHANGELOG |
| **#113 REF-409（本文）** | 历史 Releases 盘点 + **长期**版本制度与发版流程      |

---

## 五、发版检查清单（维护者）

### 发版前

- [ ] `pnpm ci`（或等价 lint + test + build:web + desktop tsc）通过
- [ ] `CHANGELOG.md` `[Unreleased]` 已分类、Breaking 已汇总
- [ ] `apps/pixuli` `version` 与 CHANGELOG 一致 **相同**，且与待发 tag 中
      `{semver}` 一致
- [ ] 升级说明（配置迁移、已移除功能）已写入 CHANGELOG 或 Wiki

### Desktop

- [ ] `release-desktop.yml`：`version`、`platform`、`is-publish=true`
- [ ] Tag `v{semver}-desktop` 与附件命名正确
- [ ] Release Notes 含 Breaking 与下载说明

### Mobile（Capacitor Android）

- [ ] `release-android.yml`：`version`、`is-publish=true`；正式发版配置
      `ANDROID_KEYSTORE_*` secrets（见 workflow 注释）
- [ ] Tag `v{semver}-android` 与 APK 已上传

### Web

- [ ] 演示站 / 自托管实例已部署到待发 commit
- [ ] Docker 镜像 tag `{semver}` 已 push（`release-web.yml`）
- [ ] Tag `v{semver}-web` 与 Release Notes（URL + docker 命令）已创建

### 发版后

- [ ] 三端 tag `v{semver}-{desktop,mobile,web}` 的 `{semver}` 一致

- [ ] CHANGELOG：`[Unreleased]` → `## [x.y.z]`，更新 footer compare 链接
- [ ] README / Wiki 稳定版表述（若对外发布）
- [ ] REFACTOR_PLAN / Issue 关闭项核对

---

## 相关文档

- [CHANGELOG.md](../../CHANGELOG.md)
- [REFACTOR_PLAN.md § REF-409](../../REFACTOR_PLAN.md)
- [02-product-user-manual.md](./02-product-user-manual.md)（Wiki 源稿）
- [04-backlog.md](../04-backlog.md)（已移除能力）
