# Pixuli 使用说明教程

本文档将引导您快速上手 Pixuli 图片管理应用，主要包括 GitHub 存储配置和图片上传功能。

## 前提条件

- 已安装 Pixuli 应用
- 拥有 GitHub 账号

---

## 配置步骤

### 步骤 1: 创建开源仓库

1. 登录您的 GitHub 账号
2. 点击右上角的 **"+"** 按钮，选择 **"New repository"**
3. 填写仓库信息：
   - **Repository name**: 输入仓库名称（例如：`my-images`）
   - **Visibility**: 选择 **Public**（必须设置为公开）
   - **Initialize**: 可选择添加 README.md
4. 点击 **"Create repository"** 完成创建

> ⚠️ **重要提示**: 仓库必须设置为 **Public**，否则 Pixuli 无法访问您的图片。

### 步骤 2: 获取 GitHub Token

1. 进入 GitHub 设置页面：点击头像 → **Settings**
2. 在左侧菜单中找到 **"Developer settings"**
3. 点击 **"Personal access tokens"** → **"Tokens (classic)"**
4. 点击 **"Generate new token"** → **"Generate new token (classic)"**
5. 填写 token 信息：
   - **Note**: 输入描述（例如：Pixuli Access）
   - **Expiration**: 建议选择较长时间（如 90 days 或 No expiration）
6. 设置权限范围：
   - ✅ **repo** - 完整仓库访问权限
   - ✅ **public_repo** - 公开仓库访问权限
7. 点击 **"Generate token"**
8. **复制生成的 token** 并妥善保存（只显示一次）

### 步骤 3: 在 Pixuli 中配置存储

1. 打开 Pixuli 应用
2. 进入 **设置** 或 **配置** 页面
3. 找到 **GitHub 存储配置** 选项
4. 填写以下配置信息：

   | 配置项 | 说明 | 示例 |
   |--------|------|------|
   | **用户名** | 您的 GitHub 用户名 | `yourgithubname` |
   | **仓库名** | 刚创建的仓库名称 | `my-images` |
   | **分支名** | 主分支名称 | `main` 或 `master` |
   | **存储路径** | 图片存放的目录 | `images` 或 `photos` |
   | **GitHub Token** | 生成的访问令牌 | `ghp_xxxxxxxxxxxx` |

5. 点击 **保存** 或 **确认** 完成配置
6. 应用会测试连接，成功后可开始使用

---

## 使用功能

### 上传图片

配置完成后，您可以开始上传和管理图片：

1. **拖拽上传**：
   - 直接将要上传的图片拖拽到 Pixuli 窗口
   - 支持批量拖拽多张图片

2. **点击上传**：
   - 点击应用中的 **"上传"** 或 **"+"** 按钮
   - 选择要上传的图片文件

3. **图片存储**：
   - 图片会自动上传到您的 GitHub 仓库
   - 支持多种图片格式
   - 可在 GitHub 仓库中查看和管理

### 查看和管理

- **预览图片**：在应用中直接预览所有已上传的图片
- **文件管理**：按上传时间和文件名进行管理
- **在线访问**：通过 GitHub 仓库 URL 在线查看所有图片

---

## 常用功能

### GitHub 仓库访问

所有上传的图片都保存在您的 GitHub 仓库中，可以通过以下方式访问：

```
https://github.com/您的用户名/仓库名/存储路径/
```

例如：
```
https://github.com/johndoe/my-images/images/
```


---

## 故障排除

### 常见问题

1. **无法上传图片**
   - 检查 GitHub Token 是否有效
   - 确认仓库设置为 Public
   - 验证网络连接是否正常

2. **Token 过期**
   - 重新生成 GitHub Token
   - 在 Pixuli 中更新新的 Token

3. **图片无法查看**
   - 检查仓库的可见性设置
   - 确认存储路径配置正确

### 获取帮助

如遇到其他问题，请参考：
- [GitHub Issues](https://github.com/trueLoving/Pixuli/issues)
- [功能特色说明](./KEYBOARD_FEATURES.md)

---

## 总结

通过以上 3 个简单步骤，您就可以：
1. ✅ 创建 GitHub 开源仓库
2. ✅ 获取访问权限 Token
3. ✅ 在 Pixuli 中完成配置
4. ✅ 开始上传和管理图片

现在您可以享受 Pixuli 带来的图片管理体验了！
