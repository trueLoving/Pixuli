# Pixuli 整体系统设计

> **最后核对**：2026-08-25 · 适用分支 `main`  
> **定位**：技术架构总览；细节见同目录专项文档。

## 一、定位与原则

| 项           | 约定                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| **三端**     | Web（PWA）+ Desktop（Electron）+ Mobile（Capacitor Android）共用 `app`                          |
| **存储**     | GitHub / Gitee 等经 `StorageProvider`；**无官方 NestJS Server**                                 |
| **本地优先** | 本地工作区为 SSOT；远端可选同步与发布                                                           |
| **包边界**   | `@pixuli/core` + `@pixuli/provider-*` 独立包；UI 在 `app/src/ui`；**core/provider 禁止依赖 UI** |
| **处理**     | 图片压缩/转换以 Canvas（`app/src/ui`）为主；WASM / 历史 RN 已移除                               |

产品需求见 [PRS](../01-product/01-product-requirements-specification.md)；UI 见
[04-asset-library-ui](../01-product/04-asset-library-ui.md)。

---

## 二、架构

```text
用户：Web / Desktop / Capacitor
        │
        ▼
┌──────────────── app ────────────────┐
│  layouts · features · stores · ui   │
│  platforms/*（WorkspaceAdapter 等） │
│  storage/registry（注册 provider）  │
└──────────┬─────────────┬────────────┘
           │             │
           ▼             ▼
   @pixuli/core    @pixuli/provider-*
   types · Vault   github / gitee
   Sync · plugins  （仅依赖 core）
```

| 层              | 职责                                                            |
| --------------- | --------------------------------------------------------------- |
| **app**         | 路由、状态、壳层、工作区选择、连接注册、UI                      |
| **core**        | 类型、`StoragePluginRegistry`、LocalVault / Sync 契约、平台抽象 |
| **provider-\*** | 某云的 API + sync + `buildPublicUrl`；无 React                  |

---

## 三、数据流（简）

1. **浏览**：默认读本地 Vault 索引 → 网格/列表。
2. **库内增删改**：只写本地（见产品
   [04](../01-product/04-asset-library-ui.md)）。
3. **同步**：用户触发 SyncEngine → Provider `push` / `pull`。
4. **发布 / 外链**：按连接能力生成 URL；与同步分离。

配置与 Token 仅存客户端（localStorage / 安全存储），不上官方中心。

---

## 四、技术栈（摘要）

| 域       | 选型                                                         |
| -------- | ------------------------------------------------------------ |
| UI       | React + Vite；Desktop 同构 + Electron；Mobile Capacitor      |
| 状态     | Zustand（imageStore / workspaceStore / sourceStore 等）      |
| 语言     | TypeScript strict（见 [DECISIONS](../../DECISIONS.md) D2.6） |
| 存储插件 | `@pixuli/core/plugins` + `@pixuli/provider-*`                |
| 图片工具 | Canvas（Web/Desktop）；Mobile 可用原生能力                   |

工程脚本与目录：见 [app/README.md](../../app/README.md) 与根目录
`package.json`。

---

## 五、制品与 CI

| 端      | 产物                   | Tag（2.x）          |
| ------- | ---------------------- | ------------------- |
| Web     | `dist/` / PWA / Docker | `v{semver}-web`     |
| Desktop | exe / dmg              | `v{semver}-desktop` |
| Android | APK                    | `v{semver}-android` |

门禁：`pnpm ci`。发版制度：[05-release-versioning](./05-release-versioning.md)。

---

## 六、文档地图

| 文档                                                    | 内容                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| [02-performance](./02-performance.md)                   | 列表/缩略性能边界                                               |
| [03-plugin-system](./03-plugin-system.md)               | Provider 契约与开发                                             |
| [04-local-workspace-sync](./04-local-workspace-sync.md) | Vault + SyncEngine                                              |
| [05 发版](./05-release-versioning.md)                   | SemVer / tag / 检查清单                                         |
| 三端工程入口                                            | [app/README.md](../../app/README.md)                            |
| 决策 / 进度                                             | [DECISIONS.md](../../DECISIONS.md) · [PLANS.md](../../PLANS.md) |

---

## 七、修订

| 日期       | 说明                            |
| ---------- | ------------------------------- |
| 2026-08-25 | 瘦身：只保留现行架构总览        |
| 2026-08-13 | 对齐 M3 / Capacitor / 无 Server |
