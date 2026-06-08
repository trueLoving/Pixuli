# Pixuli 使用教程

> **Wiki 源稿（REF-408）**：面向终端用户的产品手册源文件。发布副本见
> **[GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)**；同步策略见
> [04-Wiki-Sync-Guide.md](04-Wiki-Sync-Guide.md)。  
> **最后核对**：2026-06-06 · 适用产品：图床网格/列表 + 压缩/转换工具（不含已移除的幻灯片/时间线等）。

本指南帮助你从零开始：了解 Pixuli → 选择端（Web / Desktop /
Mobile）→ 配置 GitHub 或 Gitee 仓库源 → 上传与管理图片。

## 目录

- [前置条件](#前置条件)
- [快速开始（5 步）](#快速开始5-步)
- [GitHub 仓库源配置](#github-仓库源配置)
- [Gitee 仓库源配置](#gitee-仓库源配置)
- [在应用中添加仓库源](#在应用中添加仓库源)
- [图片管理](#图片管理)
- [实用工具](#实用工具)
- [三端使用说明](#三端使用说明)
- [安全与隐私](#安全与隐私)
- [常见问题](#常见问题)
- [获取帮助](#获取帮助)

---

## 前置条件

- 已安装或能访问 Pixuli（见 [三端使用说明](#三端使用说明)）
- 拥有 **GitHub** 或 **Gitee** 账号
- 已创建用于存放图片的**公开**仓库（或了解如何创建）

---

## 快速开始（5 步）

1. **选端**：Web 在线体验、Desktop 安装包或 Mobile APK（见下方三端说明）。
2. **建仓库**：在 GitHub 或 Gitee 创建**公开**图片仓库。
3. **拿 Token**：在平台生成个人访问令牌（仅需 `repo` / 仓库相关权限）。
4. **在 Pixuli 添加源**：填写 owner、仓库名、分支、路径、Token 并保存。
5. **上传一张图**：在图床页（`/photos`）拖拽或点击上传，确认仓库中出现文件。

---

## GitHub 仓库源配置

### 第一步：创建 GitHub 仓库

1. 登录 GitHub → 右上角 **「+」** → **New repository**
2. 填写仓库名（如 `my-images`）
3. **Visibility** 选择 **Public**（公开）
4. 点击 **Create repository**

> ⚠️ 仓库须为 **Public**，否则 Pixuli 无法通过 API 访问图片。

### 第二步：获取 GitHub Personal Access Token

1. 头像 → **Settings** → **Developer settings** → **Personal access tokens** →
   **Tokens (classic)**
2. **Generate new token (classic)**
3. 勾选 **repo**（或 **public_repo**）
4. 生成后**立即复制** Token（只显示一次）

### 配置项说明

| 配置项              | 说明          | 示例             |
| ------------------- | ------------- | ---------------- |
| **用户名 (Owner)**  | GitHub 用户名 | `yourgithubname` |
| **仓库名称**        | 仓库名        | `my-images`      |
| **分支名称**        | 主分支        | `main`           |
| **存储路径 (Path)** | 图片目录      | `images`         |
| **Token**           | 个人访问令牌  | `ghp_xxxx`       |

---

## Gitee 仓库源配置

### 第一步：创建 Gitee 仓库

1. 登录 Gitee → **「+」** → **新建仓库**
2. 仓库名如 `my-images`，**开源**选择 **公开**
3. 点击 **创建**

### 第二步：获取 Gitee 私人令牌

1. 头像 → **设置** → **安全设置** → **私人令牌** → **生成新令牌**
2. 勾选 **projects**、**user_info** 等仓库访问所需权限
3. 复制令牌并妥善保存

### 配置项说明

| 配置项              | 说明         | 示例               |
| ------------------- | ------------ | ------------------ |
| **用户名 (Owner)**  | Gitee 用户名 | `yourgiteename`    |
| **仓库名称**        | 仓库名       | `my-images`        |
| **分支名称**        | 主分支       | `master` 或 `main` |
| **存储路径 (Path)** | 图片目录     | `images`           |
| **Token**           | 私人令牌     | （平台生成）       |

---

## 在应用中添加仓库源

配置项在各端含义相同：**Owner、仓库名、分支、Path、Token**。

### 桌面端（Desktop）

1. 打开 Pixuli 桌面应用
2. 侧栏进入 **设置** 或 **仓库源管理**
3. 点击 **添加** → 选择 **GitHub** 或 **Gitee**
4. 填写上表配置项 → **保存**
5. 在源列表中**切换当前源**

### Web 端

1. 打开 [在线演示](https://pixuli-web.vercel.app/) 或自托管实例
2. 进入 **设置** → **存储配置**
3. 选择 GitHub / Gitee，填写配置 → **保存**

主导航：**图床**（`/photos`）· **压缩** · **转换** · **设置**。

### 移动端（Mobile）

1. 打开 Pixuli Android 应用（从
   [Releases](https://github.com/trueLoving/Pixuli/releases) 获取 APK）
2. 底部 **设置** → **GitHub 配置** / **Gitee 配置**
3. 填写并保存；在首页或顶部**切换当前源**

### 多仓库源

可添加多个源并在列表中切换；配置支持**导入/导出**（具体入口见各端设置页）。

---

## 图片管理

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

## 实用工具

当前主线工具（侧栏或路由）：

| 工具     | 路径/入口   | 说明                        |
| -------- | ----------- | --------------------------- |
| **压缩** | `/compress` | 调整质量、格式（如 WebP）等 |
| **转换** | `/convert`  | 图片格式转换                |

> 幻灯片播放、时间线浏览等**已不在**当前产品中；见 [backlog](../backlog.md)。

---

## 三端使用说明

| 端          | 如何开始                                                                       | 说明                                                  |
| ----------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **Web**     | 浏览器访问 [pixuli-web.vercel.app](https://pixuli-web.vercel.app/)             | 支持 PWA 安装到桌面；无需安装包                       |
| **Desktop** | [Releases](https://github.com/trueLoving/Pixuli/releases) 下载 `.exe` / `.dmg` | Windows 10/11、macOS 10.15+；与 Web 共用界面          |
| **Mobile**  | Releases 下载 Android `.apk`                                                   | iOS 尚未发布；界面为 RN 实现，功能与 Web 对齐图床主线 |

**界面差异**：Web/Desktop 侧栏导航一致；Mobile 为底部 Tab + 设置页，仓库源在设置中配置。

---

## 安全与隐私

- **Token 仅存本地**（浏览器 localStorage、Desktop 本地存储、Mobile
  AsyncStorage），**不会**上传到 Pixuli 官方服务器。
- 请使用**最小权限** Token，并定期轮换。
- 公开仓库中的图片 URL 可被他人访问；敏感图片请使用私有仓库策略或自建方案（非官方 P0）。

---

## 常见问题

### 无法上传

- Token 是否过期、权限是否包含仓库读写
- 仓库是否为**公开**
- Owner、仓库名、分支、Path 是否与 Git 仓库一致
- 网络是否正常

### 无法显示图片（尤其 Gitee）

- 确认图片已成功提交到仓库
- Web/Desktop 开发环境对 Gitee 图床有代理逻辑；生产环境依赖仓库 CDN/原始 URL
- 检查 Path 是否多写或少写层级

### Token 过期

重新在 GitHub/Gitee 生成 Token，在 Pixuli **设置**中更新对应源。

### 无法切换仓库源

确认多个源均已保存成功；尝试刷新列表或重启应用。

---

## 获取帮助

- [GitHub Issues](https://github.com/trueLoving/Pixuli/issues)
- [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki)（本教程发布副本）
- [更新日志 / Releases](https://github.com/trueLoving/Pixuli/releases)
- 协作者文档：[docs/README.md](../README.md)

---

## 小结

完成本教程后，你应能：

1. 选择 Web / Desktop / Mobile 任一入口
2. 配置 GitHub 或 Gitee 仓库源
3. 在图床页上传并管理图片
4. 了解 Token 本地存储与安全边界
