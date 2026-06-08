# GitHub Wiki 产品手册 — 规划与同步指南

- **文档版本**：1.0
- **创建日期**：2026-06-06
- **维护**：REF-408
- **Wiki 地址**：[github.com/trueLoving/Pixuli/wiki](https://github.com/trueLoving/Pixuli/wiki)

---

## 一、定位与分工

| 载体                                              | 读者           | 角色                                            |
| ------------------------------------------------- | -------------- | ----------------------------------------------- |
| **GitHub Wiki**                                   | 终端用户、新人 | **发布面**：安装、配置、日常操作、FAQ           |
| **`docs/01-product/02-Pixuli-Usage-Tutorial.md`** | 同上           | **源稿（SSOT）**：在仓库内 PR 评审后同步至 Wiki |
| **`docs/` 技术/业务设计**                         | 开发、产品     | **不整篇迁入 Wiki**                             |
| **根 `README.md`**                                | 协作者、访客   | 英文概览 + 链到 Wiki 与 `docs/`                 |

**禁止**：在 Wiki 单独维护与源稿长期分叉的第三份正文。Wiki 更新应来自
`02-Pixuli-Usage-Tutorial.md` 或本指南拆页后的对应章节。

---

## 二、建议 Wiki 目录结构

```text
Home（首页）
├── Quick-Start（快速开始）
├── Repository-Sources（仓库源配置）
│   ├── GitHub
│   └── Gitee
├── Photo-Host（图片管理）
├── Tools（实用工具）
├── Platforms（三端说明）
│   ├── Web
│   ├── Desktop
│   └── Mobile
├── FAQ（常见问题）
└── Changelog（链到仓库 CHANGELOG / Releases）
```

### 各页内容映射（源稿章节）

| Wiki 页面                   | 源稿章节                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| Home                        | 教程文首 + 三端入口 + 安全说明摘要                                                                 |
| Quick-Start                 | 前置条件 + 最小路径（建仓库 → Token → 应用内保存 → 上传一张图）                                    |
| Repository-Sources / GitHub | [GitHub 仓库源配置](02-Pixuli-Usage-Tutorial.md#github-仓库源配置)                                 |
| Repository-Sources / Gitee  | [Gitee 仓库源配置](02-Pixuli-Usage-Tutorial.md#gitee-仓库源配置)                                   |
| Photo-Host                  | [图片管理](02-Pixuli-Usage-Tutorial.md#图片管理)                                                   |
| Tools                       | [实用工具](02-Pixuli-Usage-Tutorial.md#实用工具)                                                   |
| Platforms/\*                | [三端使用说明](02-Pixuli-Usage-Tutorial.md#三端使用说明)                                           |
| FAQ                         | [常见问题](02-Pixuli-Usage-Tutorial.md#常见问题)                                                   |
| Changelog                   | 链接 [CHANGELOG.md](../../CHANGELOG.md)、[Releases](https://github.com/trueLoving/Pixuli/releases) |

---

## 三、首页（Home）建议文案要点

1. **产品一句话**：Pixuli — 基于 Git 仓库的图床客户端，支持 Web / Desktop /
   Mobile。
2. **三端入口**：
   - Web：[pixuli-web.vercel.app](https://pixuli-web.vercel.app/)
   - Desktop /
     Mobile：[GitHub Releases](https://github.com/trueLoving/Pixuli/releases)
3. **安全**：Token 仅保存在本地设备，不上传 Pixuli 官方服务器。
4. **链回仓库**：[README](https://github.com/trueLoving/Pixuli)、[问题反馈](https://github.com/trueLoving/Pixuli/issues)

**不写**：幻灯片、时间线、照片墙、官方 NestJS Server（已移除或不在官方范围，见
[backlog](../backlog.md)）。

---

## 四、同步流程

1. 在 `main` 上修改 **`02-Pixuli-Usage-Tutorial.md`**（PR 评审）。
2. 合并后，维护者将变更同步到 Wiki 对应页面（可复制 Markdown 或 `gh`
   编辑 Wiki）。
3. 大改版时：先完成 **REF-407**
   纠错后的源稿，再同步 Wiki，避免把过时能力写入 Wiki。
4. 英文 Wiki（REF-415）：未来从 `docs/en/01-product/`
   同步，与中文 Wiki 并列首页。

### 可选：克隆 Wiki 本地编辑

```bash
git clone https://github.com/trueLoving/Pixuli.wiki.git
# 编辑后 push 到 wiki 仓库
```

---

## 五、验收清单（REF-408）

- [ ] Wiki 首页含三端入口与仓库链接
- [ ] 非技术用户可按 Wiki 完成：添加仓库源 + 上传至少一张图
- [ ] 无幻灯片/时间线等已移除能力描述
- [ ] 与 PRD、`docs/` 纠错后表述一致
- [ ] 根 README 已链到 Wiki（已有）

---

## 六、相关文档

- [02-Pixuli-Usage-Tutorial.md](02-Pixuli-Usage-Tutorial.md) — Wiki 源稿
- [01-Product-Requirements-Document.md](01-Product-Requirements-Document.md)
  — 功能范围
- [03-Product-Scope-And-Cut-List.md](03-Product-Scope-And-Cut-List.md)
  — 裁剪清单
- [docs/README.md](../README.md) — 文档索引
