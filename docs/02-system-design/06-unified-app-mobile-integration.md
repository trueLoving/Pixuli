# 移动端与 apps/pixuli 统一的技术可行性分析

- **文档版本**：1.0
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

## 五、结论与建议

- **“把移动端也融入 apps/pixuli”在“同一技术实现”上的两种含义**：
  - **同一套 Web 技术实现** → 用 **Capacitor** 把现有 `apps/pixuli`
    的 Web 构建包成移动端应用即可，无需 RN，和当前 Web/Desktop 共用一个工程的做法一致。
  - **同一套 UI 代码、且移动端仍要原生体验** → 需要走 **React Native for
    Web**，以 RN 为主代码库，Web/Desktop 用 RNW 跑同一套 RN；这相当于技术栈从“Web 为主”转为“RN 为主”，工作量大。

**建议**：

1. **若目标主要是“一个工程里出三端”、且能接受移动端是 WebView**：优先尝试
   **方案 A（Capacitor）**，在现有 `apps/pixuli`
   上增加 Capacitor 配置与移动端构建流水线，尽量复用现有 Web 能力（含 WASM），再按需加相机/文件等插件。
2. **若移动端必须保持原生体验且长期要三端一套 UI**：再评估
   **方案 B（RNW）**，并单独做迁移与排期（含 WASM 在 RN 中的方案）。
3. **若短期不打算动架构**：保持 **方案 C**，继续强化 `packages/common`，必要时把
   `apps/mobile` 在结构上归到 `apps/pixuli`
   下仅作组织与 CI 上的“统一”，而不强求同一套 UI 实现。

若你选定其中一种方向（例如先试 Capacitor），可以在本方案下再拆一版「实施步骤」（目录结构、构建脚本、CI、插件清单等）。
