# apps/pixuli 三端工程约定（REF-514）

> **SSOT**：Web + Desktop + Capacitor Android 共用 `apps/pixuli`
> 一份源码与 UI。  
> 计划追踪：[REFACTOR_PLAN.md §1.9.3](../../REFACTOR_PLAN.md) · Issue
> [#152](https://github.com/trueLoving/Pixuli/issues/152)

---

## 1. 目录结构

```text
apps/pixuli/
├── android/                 # Capacitor Android 原生工程
├── capacitor.config.ts
├── electron/                # Desktop L3 主进程 / preload（见 electron/README.md）
├── plugins/                 # Vite 插件（存储 Host 集成等）
├── scripts/                 # dev-android、run-android、sync-brand-assets 等
├── vite/                    # Vite 分轨辅助（modes、versionInfo）
├── vite.config.ts           # 按 mode 组装插件与 define
├── brand/                   # 三端品牌资源 SSOT
└── src/
    ├── platforms/           # 平台检测 + 各端薄适配 + Web 浏览器壳层
    │   ├── platform.ts      # isWeb / isDesktop / isNativeMobile / getPlatform
    │   ├── WebBrowserChrome.tsx
    │   ├── web/             # OPFS/FSA 工作区、PWA 服务
    │   ├── desktop/         # Electron 工作区适配
    │   └── mobile/          # Capacitor 工作区适配
    ├── layouts/             # MainLayout、Sidebar、AppMain
    ├── features/            # 业务功能模块
    └── ...
```

`src/utils/platform.ts` 仅为兼容 re-export，新代码请
`import from '@/platforms/platform'`。

---

## 2. 脚本分组（`package.json`）

在**仓库根目录**执行（`pnpm --filter pixuli-app` 等效）：

| 分组      | 脚本                               | 说明                                           |
| --------- | ---------------------------------- | ---------------------------------------------- |
| **dev**   | `dev:web`                          | Web/PWA，`http://localhost:5500`               |
|           | `dev:desktop`                      | Electron 联调                                  |
|           | `dev:android`                      | Capacitor：起 Vite + 模拟器/真机 Live Reload   |
|           | `run:android`                      | 已有 dev server 时重连 Android                 |
| **build** | `build:web`                        | Web 静态资源（`dist/`）                        |
|           | `build:desktop`                    | `tsc` + Vite desktop + electron-builder        |
|           | `build:android`                    | `CAPACITOR_NATIVE=1` 的 web build + `cap sync` |
|           | `build:android:debug` / `:release` | Gradle 组装 APK                                |
| **cap**   | `cap:sync` / `cap:android`         | Capacitor 维护                                 |
| **其他**  | `sync:brand`                       | 品牌图从 archive 同步到 `brand/` 与各端资源    |

根目录快捷方式：`pnpm dev:web`、`pnpm dev:desktop`、`pnpm dev:android`、`pnpm build:web`
、`pnpm build:android` / `pnpm build:android:debug` 等（见根 `package.json`）。

**CI 构建顺序**（与本地 release 一致）：

```text
build:packages  →  build:web  →  build:desktop / build:android(:debug|:release)
```

- PR / push：[ci.yml](../../.github/workflows/ci.yml) — `pnpm ci` +
  `assembleDebug`
- Android 发版：[release-android.yml](../../.github/workflows/release-android.yml)
  — `v{semver}-android`

**Workspace 包**：各 `dev:*` / `build:web` 前会执行
`build:packages`（`@pixuli/core`、`@pixuli/provider-gitee`）。根目录 `pnpm ci` =
**`build:packages`** + lint + test + web/desktop 构建门禁。

---

## 3. 构建目标矩阵

| 目标        | Vite `--mode` | 关键环境变量                     | 额外步骤                    | 产物                |
| ----------- | ------------- | -------------------------------- | --------------------------- | ------------------- |
| **Web**     | `web`         | —                                | —                           | `dist/`             |
| **Desktop** | `desktop`     | —                                | `tsc` + `electron-builder`  | `dist/` + 安装包    |
| **Android** | `web`         | `CAPACITOR_NATIVE=1`（离线 APK） | `cap sync android` + Gradle | `android/.../*.apk` |

- **Android 联调**：`dev:android` 设置 `CAPACITOR_ANDROID_DEV`，Vite 监听
  `0.0.0.0:5500`（见 `vite/modes.ts`）。
- **离线 APK**：禁用 PWA/SW、`base: './'`（`CAPACITOR_NATIVE=1` 构建时）。

---

## 4. 平台检测与壳层

| API                | 用途                                        |
| ------------------ | ------------------------------------------- |
| `isWeb()`          | Vite `mode === 'web'`                       |
| `isDesktop()`      | Vite `mode === 'desktop'`                   |
| `isNativeMobile()` | Capacitor 原生壳                            |
| `isWebBrowser()`   | Web 且非 Capacitor（PWA 提示等）            |
| `getPlatform()`    | `'web' \| 'desktop' \| 'mobile'` 供 UI 文案 |

平台专属 UI 壳（如 PWA 安装条）放在 `src/platforms/`，业务 `layouts/`
保持三端共用。

---

## 5. Desktop 与 REF-502

- **`electron/`**：主进程、preload、托盘（L3）
- **`src/platforms/desktop/`**：Renderer 侧 `WorkspaceAdapter`

详见 [electron/README.md](../../apps/pixuli/electron/README.md)。

---

## 7. Follow-up（不阻塞 REF-514）

| 项                  | 说明                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| **layouts 壳层**    | 侧栏/Header 平台变体若继续膨胀，可拆 `PlatformShell` 子模块                        |
| **vite 插件模块化** | PWA / electron 配置块可迁入 `vite/plugins/`（当前 `modes` + `versionInfo` 已分轨） |

---

## 8. 修订记录

| 版本 | 日期       | 说明                                                                  |
| ---- | ---------- | --------------------------------------------------------------------- |
| 1.3  | 2026-06-18 | REF-515 #153：CI PR/push、Android debug job、release-android workflow |
| 1.2  | 2026-06-17 | #152 验收关闭；§7 follow-up                                           |
| 1.1  | 2026-06-17 | CI `build:packages` 门禁；文档清扫 RN 双工程表述                      |
| 1.0  | 2026-06-17 | REF-514 初稿：目录、脚本矩阵、平台检测收敛                            |
