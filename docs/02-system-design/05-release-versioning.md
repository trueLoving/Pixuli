# 版本发布制度

- **文档版本**：2.2
- **计划**：REF-409 · [#113](https://github.com/trueLoving/Pixuli/issues/113)
- **最后核对**：2026-10-16

发版时按 **§四 检查清单** 执行。

---

## 一、SemVer 与三端对齐

| 变更        | 版本位 |
| ----------- | ------ |
| Breaking    | MAJOR  |
| 兼容新功能  | MINOR  |
| 修复 / 文档 | PATCH  |

- **统一产品 semver**：以 `app/package.json` 为 SSOT；根 `package.json`
  无 version。
- **统一 Release**（`release.yml`）：一份 tag
  `v{semver}`，附件同时包含 Web 静态站点 zip、Desktop 安装包、Android APK。
- 单独触发 Desktop / Android workflow 时仍使用分端 tag：

| 端      | Tag                 | 产物                                       |
| ------- | ------------------- | ------------------------------------------ |
| Web     | `v{semver}`         | 静态站点 zip（html / css / js 等构建产物） |
| Desktop | `v{semver}-desktop` | exe / dmg                                  |
| Android | `v{semver}-android` | APK                                        |

- CHANGELOG：Keep a Changelog；单一版本节 `## [x.y.z]`，下分端差异。
- 1.x 历史 tag（`v*-desktop` /
  `v*-mobile`）**不建议新用户安装**；对照见 CHANGELOG 与 GitHub Releases。

---

## 二、Release Notes 要点

每端 Release 写清：构建分支/sha、下载或访问方式、链到 CHANGELOG。

---

## 三、CI / Workflow

| 用途          | Workflow                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| main 推送门禁 | `.github/workflows/ci.yml` → `pnpm ci`（仅 `push` 到 `main`）                                     |
| 三端发版      | `.github/workflows/release.yml`（**仅** `workflow_dispatch`；可选 web / desktop / android / all） |
| Desktop 发版  | `.github/workflows/release-desktop.yml`（可单独触发，也可由 `release.yml` 调用）                  |
| Android 发版  | `.github/workflows/release-android.yml`（可单独触发，也可由 `release.yml` 调用）                  |

构建顺序概念：`pnpm ci` 绿 → 再通过 `release.yml`
选择端、版本号，以及是否创建 GitHub Release。

**Secrets（按需）**

| Secret                       | 用途                 |
| ---------------------------- | -------------------- |
| `ANDROID_KEYSTORE_BASE64` 等 | Android release 签名 |

---

## 四、发版检查清单

- [ ] `app/package.json` 版本已 bump；三端将共用该 semver
- [ ] CHANGELOG：`[Unreleased]` 整理为 `## [x.y.z]`
- [ ] `pnpm ci` 绿
- [ ] `release.yml` 打一份 tag：`v{x.y.z}`，附件含三端产物
- [ ] GitHub Release 附安装包或部署说明
- [ ] 应用内版本信息与 tag 一致

Breaking 另见 REF-404 / Issue #83。

---

## 五、修订

| 版本 | 日期       | 说明                                                                                      |
| ---- | ---------- | ----------------------------------------------------------------------------------------- |
| 2.2  | 2026-10-16 | 增加 `release.yml`：一份 `v{semver}` Release，附件含 Web、Desktop、Android                |
| 2.1  | 2026-09-12 | 对齐 workflows：`ci`（仅 main push）/ Desktop·Android release（仅手动）；去掉 Web release |
| 2.0  | 2026-08-25 | 瘦身：制度 + 清单                                                                         |
| 1.3  | 2026-08-25 | 自 01-product 迁入                                                                        |
