# Pixuli Usage Tutorial

this guide will help you quickly get started with Pixuli image management
application, including GitHub and Gitee repository source configuration, and how
to configure repository sources in the interface.

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub Repository Source Configuration](#github-repository-source-configuration)
- [Gitee Repository Source Configuration](#gitee-repository-source-configuration)
- [Configuring Repository Sources in the Interface](#configuring-repository-sources-in-the-interface)
- [Using Features](#using-features)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Pixuli application installed (Desktop, Web, or Mobile)
- GitHub or Gitee account
- Repository created for storing images

## GitHub Repository Source Configuration

### Step 1: Create GitHub Repository

1. Log in to your GitHub account
2. Click the **"+"** button in the top right corner, select **"New repository"**
3. Fill in repository information:
   - **Repository name**: Enter repository name (e.g., `my-images`)
   - **Visibility**: Select **Public** (must be set to public)
   - **Initialize**: Optionally add README.md
4. Click **"Create repository"** to complete

> ⚠️ **Important**: The repository must be set to **Public**, otherwise Pixuli
> cannot access your images.

### Step 2: Get GitHub Personal Access Token

1. Go to GitHub Settings: Click avatar → **Settings**
2. Find **"Developer settings"** in the left menu
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token"** → **"Generate new token (classic)"**
5. Fill in token information:
   - **Note**: Enter description (e.g., Pixuli Access)
   - **Expiration**: Recommend longer duration (e.g., 90 days or No expiration)
6. Set permission scope:
   - ✅ **repo** - Full repository access
   - ✅ **public_repo** - Public repository access
7. Click **"Generate token"**
8. **Copy the generated token** and save it securely (only shown once)

### Configuration Items

| Configuration Item      | Description                          | Example              |
| ----------------------- | ------------------------------------ | -------------------- |
| **Username (Owner)**    | Your GitHub username                 | `yourgithubname`     |
| **Repository Name**     | The repository name you just created | `my-images`          |
| **Branch Name**         | Main branch name                     | `main` or `master`   |
| **Storage Path (Path)** | Directory for storing images         | `images` or `photos` |
| **GitHub Token**        | Generated access token               | `ghp_xxxxxxxxxxxx`   |

## Gitee Repository Source Configuration

### Step 1: Create Gitee Repository

1. Log in to your Gitee account
2. Click the **"+"** button in the top right corner, select **"新建仓库"** (New
   Repository)
3. Fill in repository information:
   - **仓库名称** (Repository Name): Enter repository name (e.g., `my-images`)
   - **是否开源** (Open Source): Select **公开** (Public) (must be set to
     public)
   - **初始化仓库** (Initialize Repository): Optionally add README.md
4. Click **"创建"** (Create) to complete

> ⚠️ **Important**: The repository must be set to **公开** (Public), otherwise
> Pixuli cannot access your images.

### Step 2: Get Gitee Personal Access Token

1. Go to Gitee Settings: Click avatar → **设置** (Settings)
2. Find **"安全设置"** (Security Settings) → **"私人令牌"** (Personal Access
   Tokens) in the left menu
3. Click **"生成新令牌"** (Generate New Token)
4. Fill in token information:
   - **令牌描述** (Token Description): Enter description (e.g., Pixuli Access)
   - **过期时间** (Expiration): Recommend longer duration (e.g., 90 days or
     permanent)
5. Set permission scope:
   - ✅ **projects** - Repository access
   - ✅ **user_info** - User information access
6. Click **"提交"** (Submit)
7. **Copy the generated token** and save it securely (only shown once)

### Configuration Items

| Configuration Item      | Description                          | Example              |
| ----------------------- | ------------------------------------ | -------------------- |
| **Username (Owner)**    | Your Gitee username                  | `yourgiteename`      |
| **Repository Name**     | The repository name you just created | `my-images`          |
| **Branch Name**         | Main branch name                     | `master` or `main`   |
| **Storage Path (Path)** | Directory for storing images         | `images` or `photos` |
| **Gitee Token**         | Generated access token               | `xxxxxxxxxxxxxxxx`   |

## Configuring Repository Sources in the Interface

After configuring GitHub or Gitee repository and Token, you need to configure
the repository source in the Pixuli application. Configuration methods vary
slightly across platforms:

### Desktop Configuration

1. Open Pixuli desktop application
2. Find **"仓库源管理"** (Source Manager) or **"Source Manager"** option in the
   left sidebar
3. Click **"+"** or **"添加仓库源"** (Add Repository Source) button
4. Select the repository source type to add:
   - **GitHub** - Select this option to configure GitHub repository source
   - **Gitee** - Select this option to configure Gitee repository source
5. Fill in the following information in the configuration dialog:
   - **Username (Owner)**: Enter your GitHub/Gitee username
   - **Repository Name**: Enter repository name
   - **Branch Name**: Enter branch name (usually `main` or `master`)
   - **Storage Path (Path)**: Enter image storage path (e.g., `images`)
   - **Token**: Paste the Personal Access Token you generated earlier
6. Click **"保存"** (Save) or **"确认"** (Confirm) to complete configuration
7. After successful configuration, the repository source will appear in the
   repository source list, and you can click to switch between different
   repository sources

### Web Configuration

1. Open Pixuli Web application (visit
   [https://pixuli-web.vercel.app/](https://pixuli-web.vercel.app/))
2. Click the **Settings** icon in the top right corner or go to settings page
3. Find **"存储配置"** (Storage Config) or **"Storage Config"** option
4. Select the storage type to configure:
   - **GitHub** - Configure GitHub repository source
   - **Gitee** - Configure Gitee repository source
5. Fill in configuration information (same as desktop)
6. Click **"保存"** (Save) to complete configuration

### Mobile Configuration

1. Open Pixuli mobile application
2. Go to **Settings** page (usually in bottom navigation bar)
3. Find **"GitHub 配置"** (GitHub Config) or **"Gitee 配置"** (Gitee Config)
   option
4. Click to enter configuration page and fill in corresponding configuration
   information
5. Click **"保存"** (Save) to complete configuration

### Configuring Multiple Repository Sources

Pixuli supports configuring multiple repository sources, and you can switch
between different repository sources:

- **Desktop**: In the repository source management list, click different
  repository sources to switch
- **Web**: Switch storage type in settings page
- **Mobile**: Switch storage source at the top of home page

## Using Features

### Uploading Images

After configuration is complete, you can start uploading and managing images:

1. **Drag and Drop Upload**:
   - Directly drag images to upload into Pixuli window
   - Support batch drag and drop of multiple images
2. **Click Upload**:
   - Click the **"上传"** (Upload) or **"+"** button in the application
   - Select image files to upload
3. **Image Storage**:
   - Images will automatically upload to your configured repository source
   - Support multiple image formats (JPG, PNG, WebP, etc.)
   - Can be viewed and managed in the repository

### Viewing and Managing

- **Preview Images**: Directly preview all uploaded images in the application
- **File Management**: Manage by upload time, filename, tags, etc.
- **Online Access**: View all images online through repository URL
- **Batch Operations**: Support batch delete, batch edit tags, etc.

## Troubleshooting

### Common Issues

1. **Cannot Upload Images**
   - Check if Token is valid and not expired
   - Confirm repository is set to Public/公开
   - Verify network connection is normal
   - Check if configuration information is correct (username, repository name,
     branch name, etc.)

2. **Token Expired**
   - Regenerate GitHub/Gitee Token
   - Update new Token in Pixuli

3. **Images Cannot Be Viewed**
   - Check repository visibility settings (must be public)
   - Confirm storage path configuration is correct
   - Verify images have been successfully uploaded to repository

4. **Cannot Switch Repository Sources**
   - Confirm multiple repository sources are correctly configured
   - Check if current repository source is available
   - Try reloading the application

### Getting Help

If you encounter other issues, please refer to:

- [GitHub Issues](https://github.com/trueLoving/Pixuli/issues)
- [Web Version Online Experience](https://pixuli-web.vercel.app/)
- [Keyboard Shortcuts Guide](/keyboard)

## Summary

Through the above steps, you can:

1. ✅ Create GitHub or Gitee repository
2. ✅ Get access permission Token
3. ✅ Complete repository source configuration in Pixuli interface
4. ✅ Start uploading and managing images

Now you can enjoy the image management experience that Pixuli brings!
