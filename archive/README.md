# Archive — 历史代码归档

本目录存放已从**主构建路径**移出的历史代码。这些目录**不参与**根目录 `pnpm`
workspace，**不会**被 `pnpm install`、`pnpm ci` 或日常应用构建引用。

维护策略见本文；产品层面的「已移除 / 不做」说明见
[docs/backlog.md](../docs/backlog.md)；里程碑追踪见
[REFACTOR_PLAN.md](../REFACTOR_PLAN.md)（M1 REF-108、REF-110）。

---

## 归档原则

| 原则             | 说明                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **只读参考**     | 供查阅历史实现、社区 fork 或实验性恢复，非官方交付物                                      |
| **独立构建**     | 需在对应子目录内自行 `pnpm install` / `cargo build`，勿假设与主仓联动                     |
| **不回流主路径** | 主应用已改用 Canvas 图片处理、`StorageProvider` 插件；不计划将 wasm/server 恢复为必需构建 |
| **无安全承诺**   | 归档代码不随主仓 CI 更新，使用前请自行评估依赖与安全                                      |

---

## 目录说明

| 目录                       | 原路径          | 用途                                                   | 移出时机                                                   |
| -------------------------- | --------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| [`wasm/`](wasm/)           | `packages/wasm` | Rust / NAPI / wasm-pack 图片处理（压缩、转换、分析等） | M1 **REF-108** — 主仓移除 wasm 与 benchmark workspace 成员 |
| [`benchmark/`](benchmark/) | `benchmark/`    | WASM vs JavaScript 压缩性能对比                        | M1 **REF-108**（依赖 wasm）                                |
| [`server/`](server/)       | `server/`       | NestJS 可选后端（Prisma、MinIO、API Key 等）           | M1 **REF-110** — 移出 workspace；**非官方**图床服务端      |

### wasm/

- **包名**：`pixuli-wasm`（历史）
- **主应用现状**：Web/Desktop 渲染进程使用 **Canvas**（`@pixuli/ui`
  imageProcessor），Electron 已移除 WASM IPC（REF-109）
- **单独构建**（仅供参考）：
  ```bash
  cd archive/wasm
  pnpm install
  # 需 Rust 1.70+、wasm-pack（Web 目标）或 napi-rs（Node 原生模块，旧 Desktop 流程）
  pnpm run build:wasm
  ```
- 详见 [wasm/README.md](wasm/README.md)

### benchmark/

- **包名**：`pixuli-benchmark`
- **依赖**：历史上依赖 workspace 内 `pixuli-wasm`；归档后需在 `archive/wasm`
  先构建或调整依赖
- **单独运行**（仅供参考）：
  ```bash
  cd archive/benchmark
  pnpm install
  pnpm run benchmark:simple
  ```
- CI 基准 workflow 已移除（M4 **REF-405**）；不再在 GitHub Actions 中构建 wasm
- 详见 [benchmark/README.md](benchmark/README.md)

### server/

- **定位**：中心化图片仓库 API，与当前「Git 仓库图床客户端」产品定位不一致
- **官方态度**：不提供 NestJS Server 为一等公民；自建或社区对接见
  [backlog §三](../docs/backlog.md)
- **单独运行**（仅供参考）：
  ```bash
  cd archive/server
  pnpm install
  cp .env.example .env   # 配置数据库与存储
  pnpm run start:dev
  ```
- 详见 [server/README.md](server/README.md)

---

## 与主仓库的关系

```text
Pixuli/（主 workspace）
├── apps/pixuli, apps/mobile
├── packages/core, packages/ui, packages/plugin-provider-*
└── pnpm-workspace.yaml   ← 仅包含 apps/*、packages/*、docs

archive/                  ← 本目录，不在 workspace 内
├── wasm/
├── benchmark/
└── server/
```

主仓 **CI**（`.github/workflows/ci.yml`）：`pnpm ci` = Vitest +
Web/Desktop 构建 + Mobile `tsc`，**不含** Rust/WASM 步骤。

桌面 **发布**（`.github/workflows/release-desktop.yml`）：在 `apps/pixuli` 执行
`tsc` → `vite build --mode desktop` → `electron-builder`，**不含**
wasm 构建（REF-405）。

---

## 何时查阅本目录

| 场景                               | 建议                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| 开发 Web/Desktop/Mobile 主应用     | **忽略** archive，读 [docs/README.md](../docs/README.md)                       |
| 了解为何移除幻灯片 / WASM / Server | [docs/backlog.md](../docs/backlog.md)、[CHANGELOG Unreleased](../CHANGELOG.md) |
| 实验高性能原生图片处理             | 参考 `archive/wasm`，或未来 Processor **插件**（非恢复主路径）                 |
| 自建 HTTP 图床 API                 | 参考 `archive/server` 或实现自定义 `StorageProvider`                           |

---

## 修订历史

| 版本 | 日期       | 变更                                                |
| ---- | ---------- | --------------------------------------------------- |
| 1.0  | 2026-05-27 | REF-406：归档策略、三子目录说明、独立构建与 CI 关系 |
