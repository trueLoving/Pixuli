# 移动端与 apps/pixuli 统一：技术分析与方案 A 落地

- **文档版本**：1.1
- **所属目录**：`docs/02-system-design`
- **关联**：[00-System-Design](00-System-Design.md) 应用层与多端

---

## 一、现状：为什么 Web 和 Desktop 能共用一个工程

| 维度       | Web                          | Desktop                              | 结论                       |
| ---------- | ---------------------------- | ------------------------------------ | -------------------------- |
| **运行时** | 浏览器（DOM）                | Electron 渲染进程（DOM）             | 同一套运行环境             |
| **UI 层**  | React + DOM（div、img、CSS） | 同上                                 | 同一套组件与样式           |
| **构建**   | Vite `build:web`             | Vite `build:desktop` + Electron 打包 | 同一套源码，不同 mode/产物 |
| **差异**   | 无桌面能力                   | 主进程：WASM、AI、文件、系统托盘等   | 仅「壳」与能力扩展不同     |

因此 **Web 与 Desktop 可以共用 `apps/pixuli`**：同一套 Vite +
React 代码，通过 mode 与 Electron 主进程区分行为与产物。

---

## 二、为什么 Mobile 目前是独立工程（apps/mobile）

| 维度         | Web / Desktop（apps/pixuli） | Mobile（apps/mobile）                   |
| ------------ | ---------------------------- | --------------------------------------- |
| **运行时**   | DOM                          | React Native（原生 View/Text/Image）    |
| **UI 层**    | React + DOM + Tailwind       | React + RN 组件 + StyleSheet            |
| **构建**     | Vite                         | Metro + Expo（生成 Android/iOS 二进制） |
| **导航**     | react-router-dom             | expo-router / React Navigation          |
| **存储**     | localStorage                 | AsyncStorage                            |
| **图片处理** | packages/wasm（WASM）        | expo-image-manipulator（原生）          |

**本质差异**：Web/Desktop 是「React 渲染到 DOM」；Mobile 是「React 渲染到原生控件」。**同一份 JSX 不能既跑在 DOM 上又跑在 RN 上**（除非用跨平台抽象层或同一套 RN 用 RNW 跑 Web）。因此目前是**两个 UI 代码库**，通过
`packages/common` 共享逻辑、类型、服务、状态与部分适配。

---

## 三、能否把 Mobile 也“融入”apps/pixuli（同一工程、类似技术实现）

目标是：**像 Web/Desktop 那样，在一个工程里用“类似的技术实现”覆盖移动端**。有两种主流思路，以及一种折中。

### 方案 A：Capacitor（或 Cordova）—— 用现有 Web 包一层“壳”

**做法**：不写 React Native，用现有
**apps/pixuli 的 Web 构建产物**（Vite 打出来的 dist）作为移动端内容，用
**Capacitor** 包成 Android/iOS 应用（内嵌 WebView）。

- **同一工程**：仍是 `apps/pixuli` 一套 Vite + React 代码。
- **三端产物**：Web（静态站）、Desktop（Electron）、Mobile（Capacitor =
  WebView + 原生壳）。
- **技术实现**：和 Web/Desktop 一样，都是“同一套 Web 技术栈”，只是 Mobile 多一步：用 Capacitor 把 dist 装进原生壳，并通过 Capacitor 插件调用相机、文件、推送等。

**优点**

- 真正「一个代码库、三端输出」，无需重写 UI。
- 迭代快：改一次 Web，三端都能更新（需重新打移动端包）。
- 与当前“Web + Desktop 共用一个工程”的思路一致，只是再增加一个“移动端壳”。

**缺点**

- 移动端是
  **WebView 应用**，不是原生 UI：手势、列表滚动、大图浏览等体验可能不如纯 RN。
- 相机、相册、文件等需通过 Capacitor 插件对接，能力和复杂度取决于插件生态。
- 包体积通常比纯 RN 大（整站资源 + WebView 运行时）。
- 若将来要做离线/大图/复杂手势，可能需要较多 Web 侧优化或原生插件。

**适用**：优先要「一套代码、三端一致」且能接受移动端偏 Web 体验时，可考虑本方案。

---

### 方案 B：React Native for Web（RNW）—— 以 RN 为主，Web/Desktop 用同一套 RN 代码

**做法**：以 **React Native** 为唯一 UI 层，用 **react-native-web**
把 RN 组件渲染到 DOM，这样：

- **同一工程**：一个 RN 项目（可放在 `apps/pixuli` 或新
  `apps/pixuli-unified`）。
- **Web**：用 RNW 打包成 Web 应用（或 Vite/Webpack 配 RNW）。
- **Desktop**：Electron 加载上述 Web 包（与当前 Electron 加载 Web 类似，只是内容来自 RN）。
- **Mobile**：Expo/React Native 正常打 Android/iOS。

**优点**

- 真正「一套 UI 代码、三端运行」；新功能只写一次 RN 界面。
- 移动端保持**原生体验**；Web/Desktop 由 RNW 提供一致组件。

**缺点**

- **迁移成本高**：需把现有 `apps/pixuli`
  的 DOM 界面全部重写为 RN 组件（View、Text、Image、FlatList 等）。
- **技术栈切换**：从 Vite + Tailwind + react-router 转为 Metro + StyleSheet +
  RN 导航；WASM 在 RN 中的集成方式也需要重新设计（如 JSI、或跑在 WebView/Worker）。
- **RNW 限制**：部分 RN API 在 Web 上行为不同或不可用；包体积与首屏需单独优化。
- **Desktop**：从“Electron + 现有 Web”变成“Electron +
  RNW”，主进程与渲染进程的交互方式可能需调整。

**适用**：长期希望「以移动端为第一公民、三端一套 UI」，且愿意做一次大规模重构时考虑。

---

### 方案 C：保持双应用结构，仅在目录或构建上“归属”到 pixuli

**做法**：不改变技术栈，只调整仓库结构，例如：

- 把 `apps/mobile` 挪到 `apps/pixuli/mobile`（或
  `apps/pixuli-native`），在文档和 CI 里把“移动端”视为 `apps/pixuli` 的一部分；
- 或保持 `apps/pixuli`（Web+Desktop）与 `apps/mobile` 并列，通过
  **packages/common** 继续提高共享（业务逻辑、类型、服务、状态、i18n）。

**优点**

- 无技术风险；移动端继续用 RN 保证体验。
- 可逐步增强 common 的抽象（例如统一“图片列表数据流”“上传流程”），两边 UI 不同但行为一致。

**缺点**

- 仍是**两套 UI 代码**，无法做到“改一处三端生效”。

**适用**：短期不打算大改、且重视移动端原生体验时，维持现状或仅做目录归属。

---

## 四、对比小结

| 维度                        | 方案 A：Capacitor           | 方案 B：RNW                        | 方案 C：保持双应用                   |
| --------------------------- | --------------------------- | ---------------------------------- | ------------------------------------ |
| 是否“同一工程”              | ✅ 是（同一 Web 工程）      | ✅ 是（同一 RN 工程）              | ⚠️ 可归属同一 app 目录，仍是两套代码 |
| 与现有 Web/Desktop 的相似度 | ✅ 最高（直接复用现有实现） | ❌ 需重写为 RN                     | ✅ 保持现有实现                      |
| 移动端体验                  | WebView，中等               | 原生，最好                         | 原生，最好                           |
| 改造成本                    | 低（加 Capacitor + 插件）   | 高（全量 RN 重写 + RNW + WASM 等） | 无或仅目录/CI                        |
| 后续维护                    | 一套 Web 栈                 | 一套 RN 栈                         | 两套 UI，common 共享逻辑             |

---

## 五、结论与决策

- **“把移动端也融入 apps/pixuli”在“同一技术实现”上的两种含义**：
  - **同一套 Web 技术实现** → 用 **Capacitor** 把现有 `apps/pixuli`
    的 Web 构建包成移动端应用即可，无需 RN，和当前 Web/Desktop 共用一个工程的做法一致。
  - **同一套 UI 代码、且移动端仍要原生体验** → 需要走 **React Native for
    Web**，以 RN 为主代码库，Web/Desktop 用 RNW 跑同一套 RN；这相当于技术栈从“Web 为主”转为“RN 为主”，工作量大。

**当前决策**：采用 **方案 A（Capacitor 套壳）**。

**理由**：1）精力有限，尽量减少开发成本；2）尽量代码复用；3）目标三端交互统一、保持一致；4）目前手机硬件足够强大，性能要求现阶段不高；若后续对性能要求提高，可再采用 React
Native 或原生技术栈开发。

**其他方案**：若未来移动端必须保持原生体验且长期要三端一套 UI，可再评估方案 B（RNW）；若短期不打算动架构，可保持方案 C，继续强化
`packages/common`。

---

## 六、方案 A 落地：目标与原则

| 目标                           | 说明                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **一套 Web 工程出三端**        | 继续以 `apps/pixuli` 的 Vite + React 为唯一 UI 代码库，Web / Desktop / Mobile 共用同一套构建与界面。 |
| **移动端 = Web 构建 + 原生壳** | 使用现有 `build:web` 产出的 `dist` 作为 WebView 内容，用 Capacitor 打成 iOS/Android 应用。           |
| **三端交互一致**               | 不单独维护移动端 UI，保证 Web / Desktop / Mobile 交互与流程一致。                                    |
| **按需接入原生能力**           | 相机、相册、文件等通过 Capacitor 插件在「同一套 Web 代码」内做运行时分支，而非重写 UI。              |
| **可演进**                     | 若后续对性能/体验要求提高，再考虑 React Native 或原生重写，当前不引入 RN 工程。                      |

---

## 七、方案 A：技术选型

- **壳方案**：**Capacitor**（推荐）
  - 与现有 Vite 构建兼容好，直接指定 `webDir` 为 Web 构建目录即可。
  - 官方维护、插件生态成熟（相机、文件、状态栏、安全区等）。
  - 若团队更熟 **Cordova**，也可选 Cordova，思路一致：Web 构建 → 复制到 `www`
    → 打原生包。
- **构建**：沿用现有 `vite build --mode web`，**不新增 build
  mode**；Capacitor 只消费已有 `dist`。
- **运行时识别**：在 Web 代码中通过 `@capacitor/core` 的
  `Capacitor.isNativePlatform()`
  判断是否在原生壳内，再决定是否调用 Capacitor 插件（相机、文件等）。

---

## 八、方案 A：工程与目录结构

### 8.1 保持不变的部分

- `apps/pixuli` 仍为唯一前端工程：Vite + React + 现有
  `platforms/web`、`platforms/desktop`。
- `build:web`、`build:desktop` 脚本与产物目录不变。
- 现有 `__IS_WEB__` / `__IS_DESKTOP__` 与 `getPlatform()`
  逻辑不变；移动端在「壳内」仍视为
  **Web 运行时**，仅通过 Capacitor 判断是否启用原生能力。

### 8.2 新增/修改的部分

```
apps/pixuli/
├── dist/                    # 现有 Web 构建输出，Capacitor 的 webDir 指向此处
├── capacitor.config.ts      # 新增：Capacitor 配置
├── ios/                     # 新增：cap add ios 生成
├── android/                 # 新增：cap add android 生成
├── src/
│   ├── platforms/
│   │   ├── web/             # 现有
│   │   ├── desktop/         # 现有
│   │   └── mobile/          # 新增（可选）：Capacitor 插件封装、移动端专属适配
│   └── utils/
│       └── platform.ts      # 扩展：增加 isNativeMobile() / getPlatform() 支持 'mobile'
├── package.json             # 新增脚本与依赖
└── index.html               # 可选：为移动端增加 viewport/safe-area 等 meta
```

- **根目录**：仅增加
  `capacitor.config.ts`、`ios/`、`android/`（由 CLI 生成），不改变现有 Vite/Electron 布局。
- **`platforms/mobile`**：可选；若相机/文件等调用较多，建议集中封装为
  `platforms/mobile/camera.ts`、`filesystem.ts` 等，内部根据
  `Capacitor.isNativePlatform()` 决定用插件还是 Web API。

---

## 九、方案 A：分阶段落地步骤

### 阶段 1：接入 Capacitor 并打出双端包（最小闭环）

1. **安装依赖**（在 `apps/pixuli` 下）
   - `@capacitor/core`、`@capacitor/cli`
   - 平台：`@capacitor/ios`、`@capacitor/android`

2. **新增 `capacitor.config.ts`**
   - `appId`：与最终上架一致（如 `com.xxx.pixuli`）
   - `appName`：Pixuli
   - `webDir`：指向现有 Web 构建目录，例如 `dist`（与 `vite build --mode web`
     输出一致）
   - `server`（可选）：开发时可用 `server.url` 指向本机 Vite dev
     server，便于真机调试

3. **脚本**
   - `build:web`：保持现有 `vite build --mode web`
   - 新增 `build:mobile`：先 `pnpm run build:web`，再 `npx cap sync`
   - 新增 `cap:ios` / `cap:android`：`npx cap open ios` 或
     `open android`，用于在 Xcode/Android Studio 中打真机包或模拟器

4. **添加原生项目**
   - 在 `apps/pixuli` 下执行：`npx cap add ios`、`npx cap add android`
   - 将 `ios/`、`android/`
     加入版本控制（或按团队约定加入 .gitignore 并在 CI 中生成）

5. **验证**
   - 本地执行 `build:mobile`，用 Xcode 打开
     `ios/App/App.xcworkspace`，用 Android Studio 打开
     `android`，分别运行到模拟器/真机，确认现有 Web 界面在 WebView 中正常展示、路由与基础交互正常。

**阶段 1 产出**：同一套 Web 代码，可稳定打出 iOS/Android 安装包，且与 Web/Desktop 共用同一构建产物。

---

### 阶段 2：移动端体验与配置优化

1. **视图与安全区**
   - 在 `index.html`
     或根布局中增加 viewport、theme-color、apple-mobile-web-app-capable 等 meta（可与 PWA 共用）。
   - 使用 CSS `env(safe-area-inset-*)`
     或 Capacitor 的 StatusBar/SafeArea 插件，避免刘海/底部横条遮挡。

2. **启动页与图标**
   - 在 `ios/App/App/Resources` 与 `android/app/src/main/res`
     中配置启动图与各尺寸图标（可复用 PWA 的 icon 资源）。

3. **路由与深链**
   - 若使用 `react-router`
     的 HashRouter，Capacitor 默认即可；若使用 BrowserRouter，需在
     `capacitor.config.ts` 中配置 `server.allowNavigation` 或 Android 的
     `allowMixedContent` 等（按需）。

4. **构建与 CI**
   - 在 monorepo 根目录增加 `build:mobile`（或 `build:cap`）：先 build web，再在
     `apps/pixuli` 下 `cap sync`。
   - CI 中增加流水线：Web 构建 → `cap sync`
     → 按需打包 iOS/Android 产物（如用 Fastlane 或 Android 的 gradle 打包）。

**阶段 2 产出**：移动端包具备正确图标、启动图、安全区与基础体验，且可通过 CI 自动构建。

---

### 阶段 3：原生能力接入（相机、相册、文件）

1. **安装插件**
   - 例如：`@capacitor/camera`、`@capacitor/filesystem`、`@capacitor/preferences`（若需本地键值存储）。

2. **平台抽象**
   - 在 `src/platforms/mobile/` 下封装：
     - `camera.ts`：在壳内用 Camera 插件选图/拍照，在纯 Web 用
       `<input type="file" accept="image/*">` 或现有逻辑。
     - `filesystem.ts`：在壳内用 Filesystem 读写本地路径，在 Web/Desktop 保持现有逻辑（或仅 Web 端用 Blob/下载）。
   - 业务侧通过「能力层」调用，不直接依赖 Capacitor，便于后续替换为 RN/原生实现。

3. **运行时判断**
   - 工具函数：`isNativeMobile(): boolean`，实现为
     `Capacitor.isNativePlatform()`（或再结合
     `Capacitor.getPlatform() === 'ios' | 'android'`）。
   - 在 `getPlatform()` 中可选扩展为 `'web' | 'desktop' | 'mobile'`：当
     `isNativeMobile()` 为 true 时返回
     `'mobile'`，便于统计与差异化逻辑（如上报、部分 UI 微调）。

4. **权限与配置**
   - iOS：在 `Info.plist` 中声明相机、相册、本地网络等使用说明。
   - Android：在 `AndroidManifest.xml` 中声明相应权限；Android
     13+ 注意图片选择与媒体权限的细分。

**阶段 3 产出**：移动端在「选图/拍照/本地文件」等场景可优先走原生能力，其余逻辑仍与 Web/Desktop 共用，三端交互保持一致。

---

### 阶段 4：与现有 apps/mobile 的关系与收尾

- **短期**：可与现有 `apps/mobile`（React
  Native）并存；文档与 README 中明确「新移动端」来自 `apps/pixuli` +
  Capacitor，「旧移动端」为 RN 版本，按需下线或仅做维护。
- **若决定全面采用方案 A**：
  - 将 RN 相关脚本从根 `package.json` 中改为指向 `apps/pixuli` 的 `build:mobile`
    与 `cap:ios`/`cap:android`。
  - 可保留 `apps/mobile` 目录一段时间作为参考，或迁移为「Pixuli
    Native」（方案 C）的占位，待后续若性能不足再启用 RN/原生重写。

---

## 十、方案 A：关键配置示例

### 10.1 `capacitor.config.ts`（apps/pixuli 根目录）

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.pixuli',
  appName: 'Pixuli',
  webDir: 'dist',
  server: {
    // 开发时可用：真机访问电脑上的 Vite 服务
    // url: 'http://192.168.x.x:5500',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true, // 若 Web 需加载混合内容可按需开启
  },
};

export default config;
```

### 10.2 `package.json` 脚本（apps/pixuli）

```json
{
  "scripts": {
    "dev:web": "vite --mode web",
    "dev:desktop": "vite --mode desktop",
    "build:web": "vite build --mode web",
    "build:desktop": "tsc && vite build --mode desktop && electron-builder",
    "build:mobile": "pnpm run build:web && npx cap sync",
    "cap:ios": "npx cap open ios",
    "cap:android": "npx cap open android",
    "cap:sync": "npx cap sync"
  },
  "dependencies": {
    "@capacitor/core": "^6.x",
    "@capacitor/ios": "^6.x",
    "@capacitor/android": "^6.x"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.x"
  }
}
```

### 10.3 平台工具扩展（src/utils/platform.ts）

```ts
import { Capacitor } from '@capacitor/core';

export const isNativeMobile = (): boolean =>
  typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

export const getPlatform = (): 'web' | 'desktop' | 'mobile' => {
  if (typeof __IS_WEB__ !== 'undefined' && __IS_WEB__) {
    return isNativeMobile() ? 'mobile' : 'web';
  }
  return 'desktop';
};
```

（注意：在纯 Web 构建中 `Capacitor`
可能未安装或为可选依赖，需通过动态 import 或条件引用避免在纯 Web 打包时报错，或使用
`try/catch` / 构建时替换为 stub。）

---

## 十一、方案 A：风险与应对

| 风险                          | 应对                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| WebView 与桌面/浏览器行为差异 | 在关键路径（上传、选图、路由）做真机与多机型测试；必要时在 `platforms/mobile` 做小范围适配。         |
| 包体积偏大                    | 沿用现有 Vite 的 code split、按需加载；后续可考虑资源 CDN、子资源压缩。                              |
| 相机/相册权限与体验           | 严格按阶段 3 做封装与权限声明；若某端体验仍不足，再考虑该端单独用 RN 或原生模块。                    |
| 后续要切 RN/原生              | 业务逻辑已集中在 `packages/common` 与能力层，UI 仍可替换为 RN 或原生视图，仅替换「壳」与平台层实现。 |

---

## 十二、小结

- **方案 A 落地** = 在现有 `apps/pixuli` 上增加 Capacitor 配置与
  `build:mobile`，用同一份 Web 构建产物打出 iOS/Android 应用，不新增 UI 代码库。
- **阶段 1** 即可实现「三端同一套代码、移动端可安装可运行」；**阶段 2**
  完善体验与 CI；**阶段 3** 按需接入相机/相册/文件等原生能力；**阶段 4**
  与现有 RN 应用收尾或并存。
- 满足「尽量代码复用、三端交互一致、当前性能要求不高」的目标，并为后续若需 RN/原生留出清晰边界（平台抽象与 common 逻辑复用）。
