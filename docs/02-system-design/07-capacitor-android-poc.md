# Capacitor Android PoC（REF-509）

> **Issue**：[#118](https://github.com/trueLoving/Pixuli/issues/118) ·
> **范围**：仅 **Android**（不含 iOS）  
> **路线**：方案 A — `apps/pixuli` 的 `build:web` 产物 + Capacitor WebView 壳  
> **关联**：[02-Three-Platform-Design.md](./02-Three-Platform-Design.md) §九、[09-cross-platform-sharing-matrix.md](./09-cross-platform-sharing-matrix.md)
> §五 P2

---

## 一、结论（PoC 范围）

| 项              | 决议                                                           |
| --------------- | -------------------------------------------------------------- |
| **平台**        | 仅 Android；iOS 不在 Pixuli 当前范围                           |
| **工程位置**    | `apps/pixuli`（与 Web/Desktop 同源）                           |
| **webDir**      | `dist`（`vite build --mode web`）                              |
| **appId**       | `com.pixuli.app`（与 RN `com.pixuli.mobile` 区分，可并存安装） |
| **是否进入 P3** | 工程已交付（REF-509 ✅）；待 §六真机冒烟勾选后确认             |

---

## 二、前置环境

| 工具                       | 用途                                  |
| -------------------------- | ------------------------------------- |
| **Node.js ≥ 20**           | Capacitor CLI 7.x                     |
| **JDK 17+**                | Gradle 构建                           |
| **Android SDK**            | API 按 `android/variables.gradle`     |
| **Android Studio**（推荐） | 模拟器 / 真机调试、`cap open android` |

安装 [Android Studio](https://developer.android.com/studio) 后，确保
`ANDROID_HOME` 已配置，`adb devices` 能列出设备。

---

## 三、Development（联调）

开发态让 WebView 加载本机 Vite dev
server（含 Gitee 代理中间件、HMR），而非打包进 `dist` 的静态资源。

### 3.1 一键联调（推荐）

先启动 Android 模拟器（Android Studio → Device Manager），确认 `adb devices`
能看到 `emulator-*`：

```bash
# 仓库根目录：自动检测模拟器/真机 → sync → 启动 Vite → Live Reload 安装并运行
pnpm dev:android
```

脚本 [`scripts/dev-android.mjs`](../../apps/pixuli/scripts/dev-android.mjs) 会：

1. `build:packages`
2. 启动 Vite（`0.0.0.0:5500`，含 Gitee 代理中间件 + HMR）
3. **Capacitor 7** `cap run android -l`（内置 sync + 安装 + Live Reload）：
   - **模拟器**：`--forwardPorts 5500:5500`（`adb reverse`，WebView 走
     `localhost:5500`）
   - **真机**：`--host <LAN_IP> --port 5500`

> **与 Expo 的差异**：Capacitor **没有** Expo 式一体化 dev server；Web 仍由
> **Vite** 提供，`cap run -l` 只负责把 Live Reload
> URL 写入壳并部署 APK。Capacitor 7 **已移除**旧文档中的 `--external`，改用
> `-l` + `--host` / `--forwardPorts`（见 `cap run android --help`）。

修改 `src/` 后 WebView 自动热更新；改原生配置需重新 `pnpm dev:android`。

指定模拟器（可选）：

```bash
pnpm dev:android -- --target Pixel_6_API_34
```

### 3.2 双终端（手动）

**终端 A** — 仅 Vite：

```bash
pnpm --filter pixuli-app dev:android:server
```

**终端 B** — 在 server 已运行时重新挂载设备：

```bash
pnpm run:android
```

也可手动覆盖：`CAPACITOR_SERVER_URL=http://192.168.1.10:5500 pnpm run:android`

底层等价命令（模拟器示例）：

```bash
pnpm exec cap run android -l --port 5500 --forwardPorts 5500:5500
```

### 3.3 Android Studio

```bash
pnpm --filter pixuli-app cap:android
```

在 IDE 中选择 Run（Debug）。若已设置 `CAPACITOR_SERVER_URL` 并
`cap sync`，Debug 包同样指向 dev server。

### 3.4 开发构建特性

- **debug** 构建允许 HTTP（`android/app/src/debug/AndroidManifest.xml` →
  `usesCleartextTraffic`）
- Capacitor 壳内 **不展示** PWA 安装条 / 离线 SW 提示（`isNativeMobile()` 分支）
- **Gitee**：dev server 自带 Vite Gitee 代理，与桌面 dev 行为一致
- **GitHub**：直连 API，无额外配置

---

## 四、Production（发布包）

生产态将 Web 静态资源打入 APK，不依赖 dev server。

### 4.1 同步 Web 产物

```bash
# 仓库根目录
pnpm build:android:sync
# 或完整 release APK：
pnpm build:android
```

| 脚本                                  | 作用                             |
| ------------------------------------- | -------------------------------- |
| `build:android:sync`                  | `build:web` + `cap sync android` |
| `build:android`（根）                 | 上一步 + `assembleRelease`       |
| `apps/pixuli` `build:android:debug`   | sync + `assembleDebug` APK       |
| `apps/pixuli` `build:android:release` | sync + `assembleRelease` APK     |

### 4.2 产物路径

| 类型        | 路径                                                                |
| ----------- | ------------------------------------------------------------------- |
| Debug APK   | `apps/pixuli/android/app/build/outputs/apk/debug/app-debug.apk`     |
| Release APK | `apps/pixuli/android/app/build/outputs/apk/release/app-release.apk` |

**签名**：`assembleRelease` 会自动签名。未配置 `android/keystore.properties`
时回退到本机
`~/.android/debug.keystore`（可真机安装，**不可上架**）。正式发版复制
`keystore.properties.example` 并填写 release 证书（REF-515 CI 注入）。

**真机安装推荐**：

- 冒烟 / 离线验证：`pnpm build:android:debug` → `app-debug.apk`
- 接近生产包：`pnpm build:android` → 已签名的 `app-release.apk`

> **勿安装**
> `app-release-unsigned.apk`（若 Gradle 未跑签名步骤的残留物）。Android
> 11+（`targetSdk ≥ 30`）对未签名包会报
> **`packageInfo is null`**（小米等机型常见）。

### 4.3 Gitee 生产包

壳内无同源 `/api/gitee-proxy`。构建 **release APK**
前设置已部署 Web 站点根 URL（须已启用 `api/gitee-proxy`）：

```bash
# 仓库根目录或 apps/pixuli
VITE_GITEE_PROXY_ORIGIN=https://your-pixuli-web.example.com \
  pnpm --filter pixuli-app build:android:release
```

等价于先 `build:web`（注入 `import.meta.env.VITE_GITEE_PROXY_ORIGIN`）再
`cap sync` + Gradle `assembleRelease`。应用内
`resolveGiteeProviderContextFields()` 会将 Gitee 图片代理指向该站点的
`/api/gitee-proxy`。

**验证步骤**（#150）：

1. 使用含 Gitee 源的测试仓库配置 APK
2. 打开图床列表，确认缩略图可加载（非裂图）
3. 打开预览并复制 Gitee 链接，确认可访问

**GitHub 源**无需此变量，可直接冒烟。

### 4.4 环境变量一览

| 变量                      | 阶段     | 说明                                                       |
| ------------------------- | -------- | ---------------------------------------------------------- |
| `CAPACITOR_SERVER_URL`    | 开发     | `cap sync` 前设置，写入 `capacitor.config` 的 `server.url` |
| `VITE_GITEE_PROXY_ORIGIN` | 生产构建 | 已部署 Web 根 URL，供 Gitee 代理                           |

---

## 五、WebView 体验与风险（待真机填写）

| 场景               | 预期                             | 风险 / 备注                                                           |
| ------------------ | -------------------------------- | --------------------------------------------------------------------- |
| 启动与路由         | `BrowserRouter` + `homepage: ./` | Capacitor `https` scheme 下一般正常；深链待 REF-510                   |
| 侧栏 / 窄屏        | 与 Web 同构（REF-601）           | `<768px` 汉堡抽屉 + 全屏弹层（#150 ✅）                               |
| 列表滚动           | 虚拟列表 + 懒加载                | 大图多时 WebView 内存与滚动帧率待测                                   |
| 上传选图           | `<input type="file">`            | 系统文件选择器；相机/相册原生能力属 REF-510 #120                      |
| PWA Service Worker | 构建仍生成 `sw.js`               | 壳内已隐藏 PWA UI；若 SW 干扰加载，后续可按 `isNativeMobile` 禁用注册 |
| Gitee 图床         | 生产需 `VITE_GITEE_PROXY_ORIGIN` | 无代理时列表缩略图可能失败                                            |
| 包体积             | 整包 Web dist ~1.4MB+ 预缓存     | 可接受；后续可做按需加载优化                                          |

---

## 六、冒烟验收清单（#118）

在 **Android 真机或模拟器** 上勾选：

- [ ] **Development**：`dev:android` + `run:android` 启动，界面与 Web 一致
- [ ] **Production**：`build:android:debug` 安装后 **离线** 可打开（不依赖 dev
      server）
- [ ] 配置仓库源（GitHub 或 Gitee+代理）
- [ ] 图片列表加载
- [ ] 上传一张图片
- [ ] 记录 §五 中滚动/大图/手势结论

**PoC 通过标准**（Issue #118）：上述核心图床流程可在真机完成 → 建议进入
**P3 三端单工程发布**（CI 产出 Web/Desktop/Android）；否则继续 **#117/#119**
RN 过渡方案。

### 6.1 Mobile 本地工作区（#161 / REF-607 P6）

Capacitor 沙箱工作区（`Directory.Data` + `mobile://`
虚拟根）。**功能已交付**；Android 真机 parity 冒烟归入
[#166](https://github.com/trueLoving/Pixuli/issues/166)，若发现问题另开 Issue 跟进。

```bash
# 首次或新增原生依赖后
pnpm --filter pixuli-app exec cap sync android
pnpm dev:android   # 或 build:android:debug 离线包
```

参考流程：创建应用工作区 → 上传 → 配源 → push/pull → 复制远端链接。

> **SAF 用户目录**（可选外部存储）规划于
> [#120](https://github.com/trueLoving/Pixuli/issues/120)，不阻塞 P6。

---

## 七、仓库结构（Android）

```text
apps/pixuli/
├── capacitor.config.ts      # Android 专用；CAPACITOR_SERVER_URL 控制 dev/prod
├── android/                 # Capacitor 原生工程（入版本库）
├── dist/                    # build:web 输出（gitignore，sync 时复制进 APK）
└── src/utils/platform.ts    # isNativeMobile() / getPlatform() → 'mobile'
```

---

## 八、与 RN 应用关系

| 应用                       | 包名                | 状态                                                  |
| -------------------------- | ------------------- | ----------------------------------------------------- |
| `apps/mobile`（Expo RN）   | `com.pixuli.mobile` | 过渡维护；`pnpm dev:mobile` / `build:mobile:rn`       |
| `apps/pixuli`（Capacitor） | `com.pixuli.app`    | **本 PoC 目标**；`pnpm dev:android` / `build:android` |

PoC 通过后，产品文档与 CI 逐步以 Capacitor
Android 为 Mobile 主路径；RN 按 REF-508 评估退场。

---

## 九、故障排查

### 打开应用白屏

| 现象                                                          | 原因                                              | 处理                                                                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `dev:android` / `run:android` 装的 debug 包，关掉 Vite 后打开 | APK 内 `server.url` 仍指向 dev server             | 先起 `pnpm dev:android:server`，或改打 **离线包**：`pnpm build:android:debug`                                           |
| `build:android:debug` 仍白屏                                  | 资源绝对路径或 PWA Service Worker 在 WebView 失效 | 拉最新代码（`CAPACITOR_NATIVE=1` 构建：`base: './'`、不生成 `sw.js`），重新 `pnpm build:android:debug` 并**先卸载旧包** |
| 仅白屏、无报错                                                | 曾注册过 SW                                       | 卸载应用重装；或 `chrome://inspect` 看 WebView 控制台                                                                   |

离线验收请用：

```bash
pnpm build:android:debug
# 安装 apps/pixuli/android/app/build/outputs/apk/debug/app-debug.apk
```

### `packageInfo is null`（真机无法安装 APK）

| 现象                                 | 原因                                                  | 处理                                                                                           |
| ------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 安装 `app-release-unsigned.apk` 失败 | **未签名**；Android 11+ 要求 APK Signature Scheme v2+ | 改用 `app-release.apk`（`pnpm build:android`）或 `app-debug.apk`（`pnpm build:android:debug`） |
| `assembleRelease` 后只有 unsigned    | 旧版 `build.gradle` 未配置 `signingConfig`            | 拉取最新代码后重新 `pnpm build:android`                                                        |
| debug 可装、release 仍失败           | 曾装过同包名但签名不同的包                            | 先卸载 `com.pixuli.app`，再安装                                                                |

验证签名（可选）：

```bash
apksigner verify --verbose apps/pixuli/android/app/build/outputs/apk/release/app-release.apk
```
