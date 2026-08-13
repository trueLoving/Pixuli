# 包布局决策：是否把 core / ui / provider 并入 `apps/pixuli`

- **文档版本**：1.4
- **日期**：2026-08-14
- **状态**：步骤 1～3 已落地；日常只从仓库根打 `dev:*` / `build:*` / `test` /
  `ci`
- **读者**：维护者、协作者
- **相关**：
  - [01-system-design.md](./01-system-design.md)
  - [03-plugin-system.md](./03-plugin-system.md)
  - [06-apps-pixuli-engineering.md](./06-apps-pixuli-engineering.md)
  - PRS v2.3 §2.1a（多云连接器）·
    [06-asset-library-ui.md](../01-product/06-asset-library-ui.md)
  - [AGENTS.md](../../AGENTS.md)（**core/provider 禁止依赖 ui**）

> **问题**：workspace 现有四个包——`@pixuli/core`、`@pixuli/ui`、`@pixuli/provider-github`、`@pixuli/provider-gitee`。是否全部挪进
> `apps/pixuli`，不再单独维护，以降低成本？
>
> **结论（短）**：**不要四个一起并进去。**
>
> - **保留** `core` + `provider-*` 为独立包（阶段二还要加 OneDrive / Google
>   Cloud）。
> - **可以考虑** 把 `@pixuli/ui` **物理迁入**
>   `apps/pixuli`（唯一消费者），用目录边界代替 npm 包。
> - 真正该砍的维护税是 **`build:packages` / 双轨 exports**，不是插件边界本身。

---

## 一、现状与真实成本

| 包                        | 谁依赖                                    | 构建                              | 职责                                                |
| ------------------------- | ----------------------------------------- | --------------------------------- | --------------------------------------------------- |
| `@pixuli/core`            | app、ui、两个 provider                    | **exports 直指 `src`**（无 tsup） | 类型、Vault、Sync、`StorageProvider` 契约、Registry |
| `@pixuli/provider-github` | **仅 app** 注册                           | **无 tsup**，exports 直指 `src`   | GitHub API + sync + `buildPublicUrl`                |
| `@pixuli/provider-gitee`  | **仅 app** 注册                           | **无 tsup**，与 github 一致       | Gitee API + sync + 直链                             |
| 原 `@pixuli/ui`           | **已内联** `apps/pixuli/src/ui`（`@/ui`） | 无独立包                          | 网格/列表/上传/设置壳等 L1/L2                       |

日常摩擦主要来自（步骤 1–3 已落地后剩余）：

1. `pnpm lint` 目前几乎只扫 `packages/core`，边界靠约定而非完整 ESLint。

RN 已归档后，**再为「多应用共享 UI 包」付 npm 包税，收益接近零**。

---

## 二、为什么当初要拆（仍然成立的部分）

| 目标                    | 靠什么保证                   | 并进 app 之后                                                |
| ----------------------- | ---------------------------- | ------------------------------------------------------------ |
| Git 细节不进业务 store  | `StorageProvider` + Registry | **目录也能做**，但极易被 `import` 穿透                       |
| core/provider **零 UI** | 独立 package + 依赖图        | 同一 Vite 工程里很难靠自觉；一两个 PR 就会 `core` 引用 React |
| 新云 = 新包，不改 core  | `provider-onedrive` 等       | 阶段二（OneDrive / GCS）会变成 `platforms/gitee.ts` 式膨胀   |
| 单测按包跑、依赖面小    | vitest per package           | 仍可测，但 mock 边界变糊                                     |
| 社区/自建 provider      | 实现契约即可注册             | 内联后「官方插件」和 app 长在一起，对外扩展故事变弱          |

产品已升级为 **多连接器**（PRS §2.1a）。插件包的价值在
**变多**，不是变少。把 Gitee/GitHub 并进 app，下一步 OneDrive 就没有干净挂载点。

---

## 三、建议方案（推荐）

```text
apps/pixuli/                 唯一应用（Web + Desktop + Capacitor）
  src/                       路由、store、platforms、连接注册
  src/ui/                    ← 可选：今日 @pixuli/ui 迁入（见 3.2）

packages/core/               保留：契约 + Vault + Sync + 纯逻辑
packages/provider-github/    保留：只依赖 core
packages/provider-gitee/     保留：只依赖 core
packages/provider-onedrive/  将来：同结构
packages/provider-gcs/       将来：同结构
```

### 3.1 必留：`core` + `provider-*`

- **core**：无 React、无 DOM、无 Capacitor。Electron 主进程 / 将来 Node 脚本也能用同一套 Vault/Sync 类型。
- **每个云一个包**：依赖只有 `core`；app 只
  `registerXxxProvider()`。这是阶段二连接页「能力位来自 manifest」的物理基础。
- 禁止 provider 依赖 ui / app。

### 3.2 可收：`@pixuli/ui` → `apps/pixuli/src/ui`（或 `src/components`）

**赞成内联 UI 包的理由：**

- 唯一消费者已是 `pixuli-app`；没有第二套 Web UI 要共享。
- ui 本身不 tsup，本来就是给 Vite 吃源码；独立 package.json、peerDeps（还留着 RN/Expo）是历史税。
- 改按钮不用跨包 bump；类型与 CSS 和 app 同一次编译。

**若内联，必须同时做：**

| 项       | 做法                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| 目录边界 | `src/ui/` 只放展示；store / platforms / storage 注册仍在 app 其它目录                                       |
| 依赖方向 | `ui` → 只依赖 `@pixuli/core`（类型）；**禁止** ui 依赖任何 `provider-*`（先删掉 package.json 里那条 gitee） |
| 测试     | vitest 根配置把 `src/ui` 收进去，不要丢覆盖                                                                 |
| 导入     | 可用 `#ui/*` 或 `@/ui/*` alias，不必保留 `@pixuli/ui` 名                                                    |

**不赞成**把 ui 和 core、gitee、github 四合一：那是把「少一个 package.json」换成「边界永久失守」。

### 3.3 真正该减的维护成本（即使不搬 ui）

优先做这些，比搬家收益更大、风险更小：

1. **统一 provider 构建**：✅ GitHub / Gitee / core 均为源码 exports，无 tsup。
2. **去掉 `build:packages`**：✅ 渲染进程 dev/build 直接吃 `src`（REF-416）。
3. **ESLint 边界**：`core`/`provider-*` 禁止 UI；`src/ui` 禁止
   `@pixuli/provider-*`。`pnpm lint` 目前仍主要扫 `packages/core`。
4. **删幽灵依赖**：✅ 已去掉 ui 对 `provider-gitee` 的 dependency。
5. **清 ui 的 RN peerDeps**：✅ 随步骤 2 内联删除。

---

## 四、若坚持「全部并进 app」会怎样

可以做，但要接受：

| 后果          | 说明                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| 短期爽        | 一个 `package.json`、一次 `tsc`、没有 `build:packages`                                  |
| 边界靠自觉    | 三个月后 store 里出现 Octokit 调用、按钮组件里出现 Gitee token 逻辑，阶段二连接器会极痛 |
| 主进程重复    | Electron `workspaceService` 若再要类型，只能从渲染目录深 import 或再拆一次              |
| 新云 PR 巨大  | OneDrive 会改 app 中心文件，而不是加一个小包 + 一行 register                            |
| 测试变慢/变杂 | provider 单测与 React 组件测试搅在同一 vitest 项目                                      |

若人力极紧、且明确 **两年内不会有第三个连接器、也不会发 npm 插件**：允许
**临时** 把 github/gitee 源码放到 `apps/pixuli/src/storage/providers/`，但仍建议
**留下
`packages/core`**。这是最低限度的「可测试纯逻辑 + 无 React」。等第三个云出现，再把 providers 拆回包（成本高于一开始就留着）。

---

## 五、决策表

| 方案                                                    | 适用                   | 建议                      |
| ------------------------------------------------------- | ---------------------- | ------------------------- |
| A. 四包原样，只修税（统一 exports、ESLint、删幽灵依赖） | 默认                   | **先做**                  |
| B. A + 仅内联 `@pixuli/ui`                              | 认定不会再有第二应用   | **可做**，一次搬家 PR     |
| C. core 保留，provider 内联进 app                       | 明确不做第三云         | 不推荐；与 PRS 阶段二冲突 |
| D. 全部并入 app                                         | 只要交付速度、不管插件 | **不推荐**                |

**当前推荐：A，随后可选 B。不做 C/D。**

结合「四包 + 三端、不发布 npm、启动还要先编 packages、命令过多」的现状，落地顺序见
**§八**（先消灭 `build:packages`，再内联 ui，最后收命令）。

---

## 八、改造路径（针对维护成本，先分析不改代码）

痛点拆开看，会发现 **三端不是主因，包构建策略才是**：

| 你感觉贵的地方 | 实际来源                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| 四个包         | ui 几乎是空包税；core/provider 的税来自 **两套构建策略**                                               |
| 三个端         | 已是 **一份 `apps/pixuli` + Vite mode**，没有三份业务代码；贵的是脚本别名重复                          |
| 启动先编包     | `dev:web` / `dev:desktop` / `dev:android:server` **硬编码** `pnpm build:packages`（只编 core + gitee） |
| 命令乱         | 根 `package.json` 与 `apps/pixuli/package.json` **两套同名脚本**；android 还有 debug/release/sync/run  |

核对过实现：

- Vite 已设
  `resolve.conditions: ['development', …]`，**渲染进程本来就能直接吃 core/gitee 的
  `src`**（和 github provider、ui 一样）。
- Electron **主进程未 import `@pixuli/*`**，桌面 dev 并不需要为 main 先 tsup。
- 仍强制 `build:packages` 多半是 REF-416 未收完 + SSR `conditions` 不含
  `development` 的历史保险，不是物理必需。

因此：**不把四包并进 app，也能先让 `pnpm dev:web` 不再编包。**

### 8.1 目标形态（改造完成后）

```text
apps/pixuli/                 唯一应用（Web / Desktop / Android）
  src/ui/                    今日 @pixuli/ui（迁入后）
  src/storage/               register(github|gitee|…)
packages/core/               仅契约 + Vault/Sync；exports 直指 src
packages/provider-github/
packages/provider-gitee/     与 github 一样，无 tsup
```

开发者心智：**改 `packages/*` 或 `src/` → 存盘 → Vite
HMR**，没有「先 build 再 dev」。

### 8.2 分三步（建议严格按序，每步可单独 PR）

#### 步骤 1 — 启动不再编包（收益最大、搬家最小）

目标：`dev:web` / `dev:desktop` / `dev:android` **去掉** `build:packages`。

| 动作                 | 说明                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Gitee 与 GitHub 对齐 | `provider-gitee` 的 `exports` 全部改成直指 `src/*.ts`，**删 tsup**（或仅 CI 可选编 dist，dev 不用）                                            |
| core 同样            | 渲染进程 + vitest 走源码；若确有 Node/SSR 入口再单独 `noExternal` 或一条 `build:core`                                                          |
| Vite SSR conditions  | 若仍走 SSR 打包，给 ssr.resolve 加上 `development`，或 `ssr.noExternal: ['@pixuli/core','@pixuli/provider-gitee']` 让 Vite 编译 workspace 源码 |
| 脚本                 | app 与根的 `dev:*`、`build:web` 不再调用 `build:packages`；`build:packages` 可删或改成 no-op / 仅 CI 文档遗留                                  |
| vitest               | 根 `pnpm test` 已能解析 workspace 源码则保持；若有 Node 测依赖 dist，改为 Vite/vitest alias 到 `packages/*/src`                                |

验收：冷启动 `pnpm dev:web` **零 tsup**；改 `packages/core/src`
一行能 HMR；`pnpm test` 仍绿。

风险：Electron 主进程若将来 import
core，要用 vite-plugin-electron 编 main，或给 main 单独 tsconfig
paths，**不要**为了 main 再恢复「全员 tsup」。

#### 步骤 2 — 内联 `@pixuli/ui`（减一个包 + RN 遗产）

前提：不发布 npm、不会再有第二应用。与 §3.2 一致。

| 动作     | 说明                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------ |
| 物理搬家 | `packages/ui/src` → `apps/pixuli/src/ui`（或 `src/components`）                                  |
| 导入     | `@pixuli/ui` → `@/ui`（codemod）；删 workspace 依赖                                              |
| 依赖     | lucide / dropzone / crop / toast 收到 **pixuli-app**；**删除** ui 对 `provider-gitee` 的幽灵依赖 |
| peerDeps | 丢掉 RN/Expo/AsyncStorage（已归档）                                                              |
| 测试     | `packages/ui` 的 vitest 并入 app 或根配置 include                                                |
| ESLint   | `src/ui/**` 禁止 import `src/storage/providers/**` 与 `@pixuli/provider-*`                       |

验收：✅ 包数量 4→3；workspace 无 `packages/ui`；导入为 `@/ui`。

不做：把 github/gitee/core 一并搬进 app（阶段二还要新连接器）。

#### 步骤 3 — 命令面收敛（三端只留「人话」入口）

现状是 **根 +
app 双份**，android 一条链拆成 5+ 个名字。目标：**只从仓库根打**，app 的
`package.json`
只留被根调用的实现细节（或反过来只留 app、根做薄转发——选一种，不要两套都给人手打）。

**给人用的（根目录，建议最终只保留这些）：**

| 命令                 | 做什么                                                    |
| -------------------- | --------------------------------------------------------- |
| `pnpm dev:web`       | Web/PWA 开发                                              |
| `pnpm dev:desktop`   | Electron 开发                                             |
| `pnpm dev:android`   | 起 Vite + 装/连 Android（Live Reload）                    |
| `pnpm run:android`   | Vite 已在跑时只重连真机/模拟器                            |
| `pnpm build:web`     | 静态站点                                                  |
| `pnpm build:desktop` | 桌面安装包                                                |
| `pnpm build:android` | **默认 = 已签名 release APK**（文档写清；debug 用显式名） |
| `pnpm test`          | 全仓库单测                                                |
| `pnpm ci`            | PR 门禁（test + lint 边界 + 三端里 CI 真正要的构建）      |

**降为内部/文档小字，不再当「日常命令」：**

| 现名                                         | 处理                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `build:packages`                             | 步骤 1 后删除或改 `true`                                               |
| `build:android:debug` / `:release` / `:sync` | 收成 `build:android` + `--debug` 或只留 `build:android:debug` 一个例外 |
| `cap:sync` / `cap:android`                   | 写进 `dev:android` / Android README，不进根「常用」                    |
| `check:types` / `check:desktop` / `smoke:*`  | 并进 `pnpm ci` / `pnpm test`；或 `pnpm check` 一条                     |
| `sync:brand`                                 | 改品牌图时才用，留在 `apps/pixuli` 即可                                |
| app 内再导出一遍 `dev:web` 等                | 根转发即可，避免两套文档                                               |

三端
**不**再拆成三个 app 工程；mode 已经分轨。维护成本下降靠「一份 UI + 三个入口命令」，不是靠再拆包。

✅ **已落地**：根 `package.json` 仅保留上表 + `build:android:debug` 例外 +
`e2e`；`cap:*` / `sync:brand` 只在 `apps/pixuli`。

### 8.3 和「四包 + 三端」的对应关系

```text
         现在                              目标
  packages/core      tsup          →   packages/core      源码（仍独立）
  packages/gitee     tsup          →   packages/gitee     源码（仍独立）
  packages/github    源码          →   不变
  packages/ui        空包税        →   apps/pixuli/src/ui
  apps/pixuli ×3 端  一份代码      →   不变，只收脚本名
  每次 dev 先 tsup                 →   直接 vite
```

数字上：workspace **4 包 → 3 包**；日常命令 **约 15+ → 约 8**；启动步骤
**2（编包+vite）→ 1**。

### 8.4 明确不要做的

- 不要为了少命令把 Web/Desktop/Android 拆回三个 repo/app。
- 不要把 provider 塞进 `apps/pixuli/src`
  来「再少两个包」（OneDrive/GCS 会把 app 撑爆）。
- 不要保留「dev 走源码、CI 仍强制 tsup 全员」两套真相，除非 CI 有 **非 Vite**
  的 Node 入口；有的话只编那一个入口。

### 8.5 建议排期

| PR  | 范围                                                          | 你立刻能感到的           |
| --- | ------------------------------------------------------------- | ------------------------ |
| 1   | 步骤 1：exports 源码化 + 去掉 dev/build 前的 `build:packages` | 启动变快、心智变简单     |
| 2   | 步骤 3 的前半：根脚本表收口、文档只宣传上表                   | 不用记两套 package.json  |
| 3   | 步骤 2：内联 ui                                               | 少一个包、少 RN peerDeps |
| 4   | ESLint 边界 + 删幽灵依赖（可并进 PR1/3）                      | 防止内联后边界回潮       |

**先做 PR1，即使 ui 暂时不搬**，维护成本也会掉一大截。

---

## 六、与文档 / Agent 约定

- [AGENTS.md](../../AGENTS.md)、`.cursor/rules/pixuli-monorepo.mdc`：在执行 B 前仍写
  `@pixuli/ui`；B 合并后改为 `apps/pixuli/src/ui`，并强调
  **core/provider 仍独立、禁止依赖 ui**。
- REF-209 边界规则：内联 ui 后改为路径级 ESLint（`src/ui/**` ↛
  `src/storage/providers/**`）。
- 插件开发指南仍以 [03-plugin-system.md](./03-plugin-system.md)
  为准；新连接器继续 `packages/provider-*`。

---

## 七、修订记录

| 版本 | 日期       | 说明                                                                   |
| ---- | ---------- | ---------------------------------------------------------------------- |
| 1.0  | 2026-08-13 | 初稿：不整包内联；可收 ui；必留 core + provider；先减 build/exports 税 |
| 1.1  | 2026-08-13 | §八：启动去 tsup、内联 ui、命令收敛的分步改造（不改代码的分析）        |
| 1.2  | 2026-08-14 | 步骤 1 落地：core/gitee 源码 exports；去掉 `build:packages`            |
| 1.3  | 2026-08-14 | 步骤 2 落地：`@pixuli/ui` → `apps/pixuli/src/ui`                       |
| 1.4  | 2026-08-14 | 步骤 3 落地：根日常命令收口；`smoke:*`/`check:*` 并入 `ci`             |
