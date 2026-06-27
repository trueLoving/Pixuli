# Pixuli 产品使用手册

- **文档版本**：1.0
- **最后更新**：2026-06-06
- **适用产品**：图床网格/列表 + 压缩/转换工具（不含已移除的幻灯片/时间线等）
- **Wiki 发布**：[GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)（本文件为**源稿 SSOT**，合并原使用教程与 Wiki 同步指南）

本手册帮助终端用户从零开始：了解 Pixuli → 选择端（Web / Desktop /
Mobile）→ 配置 GitHub 或 Gitee 仓库源 → 上传与管理图片。

---

## 目录

**使用指南**

- [一、前置条件与快速开始](#一前置条件与快速开始)
- [二、GitHub 仓库源配置](#二github-仓库源配置)
- [三、Gitee 仓库源配置](#三gitee-仓库源配置)
- [四、在应用中添加仓库源](#四在应用中添加仓库源)
- [五、图片管理](#五图片管理)
- [六、实用工具](#六实用工具)
- [七、三端使用说明](#七三端使用说明)
- [八、安全与隐私](#八安全与隐私)
- [九、常见问题](#九常见问题)
- [十、获取帮助](#十获取帮助)

**附录**

- [附录 A：GitHub Wiki 发布与同步](#附录-agithub-wiki-发布与同步)

---

## 一、前置条件与快速开始

### 1.1 前置条件

- 已安装或能访问 Pixuli（见 [七、三端使用说明](#七三端使用说明)）
- 拥有 **GitHub** 或 **Gitee** 账号
- 已创建用于存放图片的**公开**仓库（或了解如何创建）

### 1.2 快速开始（5 步）

1. **选端**：Web 在线体验、Desktop 安装包或 Mobile APK。
2. **建仓库**：在 GitHub 或 Gitee 创建**公开**图片仓库。
3. **拿 Token**：在平台生成个人访问令牌（仅需 `repo` / 仓库相关权限）。
4. **在 Pixuli 添加源**：填写 owner、仓库名、分支、路径、Token 并保存。
5. **上传一张图**：在图床页（`/photos`）拖拽或点击上传，确认仓库中出现文件。

---

## 二、GitHub 仓库源配置

### 2.1 创建 GitHub 仓库

1. 登录 GitHub → 右上角 **「+」** → **New repository**
2. 填写仓库名（如 `my-images`）
3. **Visibility** 选择 **Public**（公开）
4. 点击 **Create repository**

> ⚠️ 仓库须为 **Public**，否则 Pixuli 无法通过 API 访问图片。

### 2.2 获取 GitHub Personal Access Token

1. 头像 → **Settings** → **Developer settings** → **Personal access tokens** →
   **Tokens (classic)**
2. **Generate new token (classic)**
3. 勾选 **repo**（或 **public_repo**）
4. 生成后**立即复制** Token（只显示一次）

### 2.3 配置项说明

| 配置项              | 说明          | 示例             |
| ------------------- | ------------- | ---------------- |
| **用户名 (Owner)**  | GitHub 用户名 | `yourgithubname` |
| **仓库名称**        | 仓库名        | `my-images`      |
| **分支名称**        | 主分支        | `main`           |
| **存储路径 (Path)** | 图片目录      | `images`         |
| **Token**           | 个人访问令牌  | `ghp_xxxx`       |

---

## 三、Gitee 仓库源配置

### 3.1 创建 Gitee 仓库

1. 登录 Gitee → **「+」** → **新建仓库**
2. 仓库名如 `my-images`，**开源**选择 **公开**
3. 点击 **创建**

### 3.2 获取 Gitee 私人令牌

1. 头像 → **设置** → **安全设置** → **私人令牌** → **生成新令牌**
2. 勾选 **projects**、**user_info** 等仓库访问所需权限
3. 复制令牌并妥善保存

### 3.3 配置项说明

| 配置项              | 说明         | 示例               |
| ------------------- | ------------ | ------------------ |
| **用户名 (Owner)**  | Gitee 用户名 | `yourgiteename`    |
| **仓库名称**        | 仓库名       | `my-images`        |
| **分支名称**        | 主分支       | `master` 或 `main` |
| **存储路径 (Path)** | 图片目录     | `images`           |
| **Token**           | 私人令牌     | （平台生成）       |

---

## 四、在应用中添加仓库源

配置项在各端含义相同：**Owner、仓库名、分支、Path、Token**。

### 4.1 桌面端（Desktop）

1. 打开 Pixuli 桌面应用
2. 侧栏进入 **设置** 或 **仓库源管理**
3. 点击 **添加** → 选择 **GitHub** 或 **Gitee**
4. 填写配置项 → **保存**
5. 在源列表中**切换当前源**

### 4.2 Web 端

1. 打开 [在线演示](https://pixuli-web.vercel.app/) 或自托管实例
2. 进入 **设置** → **存储配置**
3. 选择 GitHub / Gitee，填写配置 → **保存**

主导航：**图床**（`/photos`）· **压缩** · **转换** · **设置**。

### 4.3 移动端（Mobile）

1. 从 [Releases](https://github.com/trueLoving/Pixuli/releases) 安装 Android APK
2. 底部 **设置** → **GitHub 配置** / **Gitee 配置**
3. 填写并保存；在首页或顶部**切换当前源**

### 4.4 多仓库源

可添加多个源并在列表中切换；配置支持**导入/导出**（见各端设置页）。

---

## 五、图片管理

在 **图床** 页（网格或列表视图）：

| 操作           | 说明                                 |
| -------------- | ------------------------------------ |
| **上传**       | 拖拽到窗口，或点击上传按钮；支持多选 |
| **预览**       | 点击缩略图全屏预览，可左右切换       |
| **编辑元数据** | 名称、描述、标签等（视版本而定）     |
| **删除**       | 单张或批量删除（需确认）             |
| **搜索/筛选**  | 按名称、标签等筛选（视端能力而定）   |
| **刷新**       | 从当前仓库源重新拉取列表             |

图片文件与元数据保存在**你配置的 Git 仓库**中，而非 Pixuli 官方服务器。

---

## 六、实用工具

| 工具     | 路径/入口   | 说明                        |
| -------- | ----------- | --------------------------- |
| **压缩** | `/compress` | 调整质量、格式（如 WebP）等 |
| **转换** | `/convert`  | 图片格式转换                |

> 幻灯片播放、时间线浏览等**已不在**当前产品中；见
> [04-backlog.md](../04-backlog.md)。

---

## 七、三端使用说明

| 端          | 如何开始                                                                       | 说明                                         |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| **Web**     | [pixuli-web.vercel.app](https://pixuli-web.vercel.app/)                        | 支持 PWA 安装；无需安装包                    |
| **Desktop** | [Releases](https://github.com/trueLoving/Pixuli/releases) 下载 `.exe` / `.dmg` | Windows 10/11、macOS 10.15+；与 Web 共用界面 |
| **Mobile**  | Releases 下载 Android `.apk`                                                   | iOS 尚未发布                                 |

**界面差异**：Web/Desktop 侧栏导航一致；Mobile 为底部 Tab + 设置页。

---

## 八、安全与隐私

- **Token 仅存本地**（localStorage / Desktop 本地存储 /
  AsyncStorage），**不会**上传到 Pixuli 官方服务器。
- 请使用**最小权限** Token，并定期轮换。
- 公开仓库中的图片 URL 可被他人访问；敏感内容请自行评估仓库可见性策略。

---

## 九、常见问题

### 无法上传

- Token 是否过期、权限是否包含仓库读写
- 仓库是否为**公开**
- Owner、仓库名、分支、Path 是否与 Git 仓库一致

### 无法显示图片（尤其 Gitee）

- 确认图片已提交到仓库
- 检查 Path 层级是否正确
- 生产环境依赖仓库原始 URL 或 CDN

### Token 过期

在 GitHub/Gitee 重新生成 Token，于 Pixuli **设置**中更新。

### 无法切换仓库源

确认多个源均已保存；尝试刷新列表或重启应用。

---

## 十、获取帮助

- [GitHub Issues](https://github.com/trueLoving/Pixuli/issues)
- [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)（本手册发布副本）
- [更新日志 / Releases](https://github.com/trueLoving/Pixuli/releases)
- 产品规格：[01-product-requirements-specification.md](01-product-requirements-specification.md)
- 协作者文档：[docs/README.md](../README.md)

---

## 附录 A：GitHub Wiki 发布与同步

### A.1 定位与分工

| 载体                                      | 读者     | 角色                                   |
| ----------------------------------------- | -------- | -------------------------------------- |
| **GitHub Wiki**                           | 终端用户 | **发布面**                             |
| **本文件**（`02-product-user-manual.md`） | 同上     | **源稿（SSOT）**：PR 评审后同步至 Wiki |
| **`docs/` 技术/业务设计**                 | 开发     | 不整篇迁入 Wiki                        |

**禁止**在 Wiki 单独维护与源稿长期分叉的第三份正文。

### A.2 建议 Wiki 目录结构

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
└── Changelog（链到 CHANGELOG / Releases）
```

### A.3 各页与源稿章节映射

| Wiki 页面                   | 源稿章节                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Home                        | 文首 + 三端入口 + §八 安全摘要                                                                |
| Quick-Start                 | §一 前置条件与快速开始                                                                        |
| Repository-Sources / GitHub | §二 GitHub 仓库源配置                                                                         |
| Repository-Sources / Gitee  | §三 Gitee 仓库源配置                                                                          |
| Photo-Host                  | §五 图片管理                                                                                  |
| Tools                       | §六 实用工具                                                                                  |
| Platforms/\*                | §七 三端使用说明                                                                              |
| FAQ                         | §九 常见问题                                                                                  |
| Changelog                   | [CHANGELOG.md](../../CHANGELOG.md)、[Releases](https://github.com/trueLoving/Pixuli/releases) |

### A.4 首页（Home）文案要点

1. Pixuli — 基于 Git 仓库的图床客户端（Web / Desktop / Mobile）
2. 三端入口：Web 演示、Releases 下载
3. Token 仅存本地，不上传官方服务器
4. 链回
   [仓库 README](https://github.com/trueLoving/Pixuli)、[Issues](https://github.com/trueLoving/Pixuli/issues)

**不写**：幻灯片、时间线、照片墙、官方 NestJS Server（见
[04-backlog.md](../04-backlog.md)）。

### A.5 同步流程

1. 在 `main` 上修改 **本文件**（PR 评审）。
2. 合并后，维护者将变更同步到 Wiki 对应页面。
3. 英文 Wiki（REF-415）：未来从 `docs/en/01-product/` 同步。

```bash
git clone https://github.com/trueLoving/Pixuli.wiki.git
# 编辑后 push 到 wiki 仓库
```

### A.6 Wiki 验收清单

- [ ] Wiki 首页含三端入口与仓库链接
- [ ] 非技术用户可按 Wiki 完成：添加源 + 上传至少一张图
- [ ] 无已移除能力描述
- [ ] 与 [产品需求规格说明书](01-product-requirements-specification.md) 一致

---

_修订：2026-06-06 合并原 `02-Pixuli-Usage-Tutorial.md` 与
`04-Wiki-Sync-Guide.md`。_
