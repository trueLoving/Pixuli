# 版本发布制度

- **文档版本**：2.0
- **计划**：REF-409 · [#113](https://github.com/trueLoving/Pixuli/issues/113)
- **最后核对**：2026-08-25

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
- **分端 tag**（同一 `{semver}`）：

| 端      | Tag                 | 产物                                |
| ------- | ------------------- | ----------------------------------- |
| Desktop | `v{semver}-desktop` | exe / dmg                           |
| Android | `v{semver}-android` | APK                                 |
| Web     | `v{semver}-web`     | 站点 + Docker `pixuli-web:{semver}` |

- CHANGELOG：Keep a Changelog；单一版本节 `## [x.y.z]`，下分端差异。
- 1.x 历史 tag（`v*-desktop` /
  `v*-mobile`）**不建议新用户安装**；对照见 CHANGELOG 与 GitHub Releases。

---

## 二、Release Notes 要点

每端 Release 写清：构建分支/sha、下载或访问方式、链到 CHANGELOG。  
Web：演示站 URL + `docker pull …/pixuli-web:{semver}`。

---

## 三、CI / Workflow

| 用途         | Workflow                                          |
| ------------ | ------------------------------------------------- |
| PR 门禁      | `ci.yml` → `pnpm ci`                              |
| Desktop 发版 | 对应 release-desktop（若有）                      |
| Android 发版 | `release-android.yml`（多为 `workflow_dispatch`） |
| Web          | 部署 + `v{semver}-web` 说明                       |

构建顺序概念：`pnpm ci` → 再打各端 release 产物。

---

## 四、发版检查清单

- [ ] `app/package.json` 版本已 bump；三端将共用该 semver
- [ ] CHANGELOG：`[Unreleased]` 整理为 `## [x.y.z]`
- [ ] `pnpm ci` 绿
- [ ] 打齐需要的 tag：`v{x.y.z}-desktop` / `-android` / `-web`
- [ ] GitHub Release 附安装包或部署说明
- [ ] 应用内版本信息与 tag 一致

Breaking 另见 REF-404 / Issue #83。

---

## 五、修订

| 版本 | 日期       | 说明               |
| ---- | ---------- | ------------------ |
| 2.0  | 2026-08-25 | 瘦身：制度 + 清单  |
| 1.3  | 2026-08-25 | 自 01-product 迁入 |
