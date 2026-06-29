# Pixuli App — Web · Desktop · Android

三端合一主应用（`pixuli-app`）：**Web（PWA）**、**Desktop（Electron）**、**Mobile（Capacitor
Android）** 共用 `src/` 与 `@pixuli/ui`。

工程约定与构建矩阵：[06-apps-pixuli-engineering.md](../../docs/02-system-design/06-apps-pixuli-engineering.md)（REF-514）

---

## 快速开始

在**仓库根目录**执行：

```bash
pnpm install

# 开发
pnpm dev:web          # Web → http://localhost:5500
pnpm dev:desktop      # Electron
pnpm dev:android      # Android 模拟器/真机 + Live Reload

# 构建
pnpm build:web
pnpm build:desktop
pnpm build:android    # 同步 Capacitor；release APK 见 build:android:release
```

也可在 `apps/pixuli` 下直接 `pnpm dev:web` 等（脚本定义在本包 `package.json`）。

### Android 安装包（用户）

- 从 [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) 下载
  **`v{版本}-android`** Release 中的 APK（维护者通过
  [release-android.yml](../../.github/workflows/release-android.yml)
  手动发版）。
- 详细安装与升级说明：[产品使用手册 §4.3](../../docs/01-product/02-product-user-manual.md#43-移动端mobile--capacitor-android)。
- 历史 RN 工程已归档至 `archive/apps/mobile/`，**非**当前 Mobile 交付路径。

---

## 目录摘要

| 路径             | 说明                                 |
| ---------------- | ------------------------------------ |
| `src/platforms/` | 平台检测、各端适配器、Web 浏览器壳层 |
| `src/layouts/`   | MainLayout、侧栏、主内容区           |
| `src/features/`  | 业务功能                             |
| `electron/`      | Desktop 主进程 / preload             |
| `android/`       | Capacitor Android 工程               |
| `scripts/`       | Android 联调、品牌资源同步           |
| `vite/`          | Vite mode 分轨辅助                   |

---

## 测试

```bash
pnpm test    # 在 apps/pixuli 或仓库根 vitest workspace
```

更多贡献说明见 [CONTRIBUTING.md](../../CONTRIBUTING.md)。
