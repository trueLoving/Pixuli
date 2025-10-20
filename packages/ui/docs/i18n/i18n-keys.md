# Pixuli UI 国际化 Key 值参考

本文档列出了 Pixuli UI 组件库中所有可用的国际化 key 值，方便开发者进行自定义翻译和本地化。

## 📋 Key 值分类

### 🏠 应用基础 (app)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `app.title` | Pixuli | Pixuli | 应用标题 |
| `app.subtitle` | 专业的图片管理与存储解决方案 | Professional Image Management & Storage Solution | 应用副标题 |
| `app.welcome` | 欢迎使用 Pixuli | Welcome to Pixuli | 欢迎信息 |
| `app.description` | 请先配置 GitHub 仓库信息以开始使用 | Please configure GitHub repository information to get started | 配置提示 |
| `app.configureGitHub` | 配置 GitHub | Configure GitHub | GitHub 配置按钮 |
| `app.repository` | 仓库 | Repository | 仓库标签 |
| `app.imageLibrary` | 图片库 | Image Library | 图片库标题 |
| `app.images` | 张图片 | images | 图片数量单位 |
| `app.loadingImages` | 正在加载图片... | Loading images... | 加载状态 |
| `app.configureUpyun` | 配置又拍云 | Configure Upyun | 又拍云配置按钮 |

#### 演示模式 (app.demoMode)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `app.demoMode.title` | 演示模式 | Demo Mode | 演示模式标题 |
| `app.demoMode.description` | 您正在使用演示环境，可以下载预配置的演示配置文件快速体验 Pixuli 的各项功能。 | You are using the demo environment. You can download a pre-configured demo configuration file to quickly experience Pixuli's features. | 演示模式描述 |
| `app.demoMode.downloadDemo` | 下载演示配置 | Download Demo Config | 下载演示配置按钮 |
| `app.demoMode.exitDemo` | 退出演示模式 | Exit Demo Mode | 退出演示模式按钮 |

### 🧭 导航 (navigation)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `navigation.settings` | 设置 | Settings | 设置按钮 |
| `navigation.upyunSettings` | 又拍云设置 | Upyun Settings | 又拍云设置按钮 |
| `navigation.refresh` | 刷新 | Refresh | 刷新按钮 |
| `navigation.search` | 搜索 | Search | 搜索按钮 |
| `navigation.filter` | 筛选 | Filter | 筛选按钮 |
| `navigation.help` | 帮助 | Help | 帮助按钮 |
| `navigation.play` | 播放 | Play | 播放按钮 |

### 🌍 语言 (language)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `language.switch` | 切换语言 | Switch Language | 语言切换按钮 |
| `language.chinese` | 简体中文 | Simplified Chinese | 中文选项 |
| `language.english` | English | English | 英文选项 |
| `language.current` | 当前语言 | Current Language | 当前语言标签 |

### 🔧 通用操作 (common)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `common.save` | 保存 | Save | 保存按钮 |
| `common.update` | 更新 | Update | 更新按钮 |
| `common.cancel` | 取消 | Cancel | 取消按钮 |
| `common.delete` | 删除 | Delete | 删除按钮 |
| `common.edit` | 编辑 | Edit | 编辑按钮 |
| `common.close` | 关闭 | Close | 关闭按钮 |
| `common.confirm` | 确认 | Confirm | 确认按钮 |
| `common.loading` | 加载中... | Loading... | 加载状态 |
| `common.error` | 错误 | Error | 错误状态 |
| `common.success` | 成功 | Success | 成功状态 |
| `common.warning` | 警告 | Warning | 警告状态 |
| `common.info` | 信息 | Info | 信息状态 |
| `common.yes` | 是 | Yes | 是选项 |
| `common.no` | 否 | No | 否选项 |
| `common.unknownError` | 未知错误 | Unknown Error | 未知错误 |

### 🐙 GitHub 配置 (github)

#### 基础配置 (github.config)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `github.config.title` | GitHub 仓库配置 | GitHub Repository Configuration | 配置标题 |
| `github.config.username` | GitHub 用户名 | GitHub Username | 用户名标签 |
| `github.config.usernamePlaceholder` | 您的 GitHub 用户名或组织名 | Your GitHub username or organization name | 用户名占位符 |
| `github.config.repository` | 仓库名称 | Repository Name | 仓库名称标签 |
| `github.config.repositoryPlaceholder` | 用于存储图片的仓库名称 | Repository name for storing images | 仓库名称占位符 |
| `github.config.branch` | 分支名称 | Branch Name | 分支名称标签 |
| `github.config.branchPlaceholder` | 通常为 main 或 master | Usually main or master | 分支名称占位符 |
| `github.config.path` | 图片存储路径 | Image Storage Path | 存储路径标签 |
| `github.config.pathPlaceholder` | 仓库中存储图片的文件夹路径 | Folder path for storing images in repository | 存储路径占位符 |
| `github.config.token` | GitHub Token | GitHub Token | Token 标签 |
| `github.config.tokenPlaceholder` | ghp_xxxxxxxxxxxxxxxxxxxx | ghp_xxxxxxxxxxxxxxxxxxxx | Token 占位符 |
| `github.config.tokenDescription` | 需要 repo 权限的 Personal Access Token，用于访问您的仓库 | Personal Access Token with repo permissions to access your repository | Token 描述 |
| `github.config.import` | ↑ 导入 | ↑ Import | 导入按钮 |
| `github.config.export` | 导出 | Export | 导出按钮 |
| `github.config.clearConfig` | 清除配置 | Clear Configuration | 清除配置按钮 |
| `github.config.saveConfig` | 保存配置 | Save Configuration | 保存配置按钮 |
| `github.config.required` | * | * | 必填标记 |

#### 配置帮助 (github.help)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `github.help.title` | 配置帮助 | Configuration Help | 帮助标题 |
| `github.help.tokenGuide.title` | 如何获取 GitHub Token？ | How to get GitHub Token? | Token 获取指南标题 |
| `github.help.tokenGuide.step1` | 1. 访问 GitHub Settings → Developer settings | 1. Go to GitHub Settings → Developer settings | 步骤1 |
| `github.help.tokenGuide.step2` | 2. 选择 Personal access tokens → Tokens (classic) | 2. Select Personal access tokens → Tokens (classic) | 步骤2 |
| `github.help.tokenGuide.step3` | 3. 生成新 token，勾选 repo 权限 | 3. Generate new token, check repo permissions | 步骤3 |
| `github.help.tokenGuide.step4` | 4. 复制生成的 token 并粘贴到上方输入框 | 4. Copy the generated token and paste it in the input field above | 步骤4 |
| `github.help.importExport.title` | 配置导入导出 | Configuration Import/Export | 导入导出标题 |
| `github.help.importExport.export` | 导出：将当前配置保存为 JSON 文件 | Export: Save current configuration as JSON file | 导出说明 |
| `github.help.importExport.import` | 导入：从 JSON 文件加载配置 | Import: Load configuration from JSON file | 导入说明 |
| `github.help.importExport.crossPlatform` | 跨平台：支持桌面端和 Web 端配置互导 | Cross-platform: Support configuration exchange between desktop and web | 跨平台说明 |
| `github.help.importExport.backup` | 备份：建议定期导出配置作为备份 | Backup: Recommend regular export of configuration as backup | 备份说明 |

### ☁️ 又拍云配置 (upyun)

#### 基础配置 (upyun.config)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `upyun.config.title` | 又拍云存储配置 | Upyun Storage Configuration | 配置标题 |
| `upyun.config.import` | 导入 | Import | 导入按钮 |
| `upyun.config.export` | 导出 | Export | 导出按钮 |
| `upyun.config.clearConfig` | 清除配置 | Clear Configuration | 清除配置按钮 |
| `upyun.config.saveConfig` | 保存配置 | Save Configuration | 保存配置按钮 |
| `upyun.config.required` | * | * | 必填标记 |

#### 配置帮助 (upyun.help)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `upyun.help.title` | 配置帮助 | Configuration Help | 帮助标题 |
| `upyun.help.credentials.title` | 如何获取又拍云凭证？ | How to get Upyun credentials? | 凭证获取指南标题 |
| `upyun.help.credentials.step1` | 1. 登录又拍云控制台 | 1. Login to Upyun console | 步骤1 |
| `upyun.help.credentials.step2` | 2. 进入服务管理 → 云存储 | 2. Go to Service Management → Cloud Storage | 步骤2 |
| `upyun.help.credentials.step3` | 3. 创建或选择存储空间 | 3. Create or select storage space | 步骤3 |
| `upyun.help.credentials.step4` | 4. 在操作员管理中创建操作员 | 4. Create operator in Operator Management | 步骤4 |
| `upyun.help.credentials.step5` | 5. 获取操作员名称和密码 | 5. Get operator name and password | 步骤5 |
| `upyun.help.importExport.title` | 配置导入/导出 | Configuration Import/Export | 导入导出标题 |
| `upyun.help.importExport.export` | 导出：将当前配置保存为 JSON 文件 | Export: Save current configuration as JSON file | 导出说明 |
| `upyun.help.importExport.import` | 导入：从 JSON 文件加载配置 | Import: Load configuration from JSON file | 导入说明 |
| `upyun.help.importExport.crossPlatform` | 跨平台：支持桌面端和 Web 端配置互导 | Cross-platform: Support configuration exchange between desktop and web | 跨平台说明 |
| `upyun.help.importExport.backup` | 备份：建议定期导出配置作为备份 | Backup: Recommend regular export of configuration as backup | 备份说明 |

### 💾 存储管理 (storage)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `storage.title` | 存储配置管理 | Storage Configuration Management | 存储管理标题 |
| `storage.configurations` | 存储配置 | Storage Configurations | 存储配置标签 |
| `storage.addConfig` | 添加配置 | Add Configuration | 添加配置按钮 |
| `storage.editConfig` | 编辑配置 | Edit Configuration | 编辑配置按钮 |
| `storage.configureStorage` | 配置存储 | Configure Storage | 配置存储按钮 |
| `storage.selectSource` | 选择存储源 | Select Storage Source | 选择存储源按钮 |
| `storage.setActive` | 设为活跃 | Set Active | 设为活跃按钮 |
| `storage.noConfigs` | 暂无配置 | No Configurations | 无配置提示 |
| `storage.confirmDelete` | 确定要删除此配置吗？ | Are you sure you want to delete this configuration? | 删除确认 |
| `storage.saveFailed` | 保存配置失败 | Failed to save configuration | 保存失败提示 |
| `storage.basicInfo` | 基本信息 | Basic Information | 基本信息标签 |
| `storage.configName` | 配置名称 | Configuration Name | 配置名称标签 |
| `storage.configNamePlaceholder` | 请输入配置名称 | Please enter configuration name | 配置名称占位符 |
| `storage.provider` | 存储提供商 | Storage Provider | 存储提供商标签 |
| `storage.configuration` | 配置 | Configuration | 配置标签 |

### ⌨️ 键盘快捷键 (keyboard)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `keyboard.title` | 键盘快捷键 | Keyboard Shortcuts | 快捷键标题 |
| `keyboard.subtitle` | 使用键盘快速操作 Pixuli | Use keyboard to quickly operate Pixuli | 快捷键副标题 |

#### 使用提示 (keyboard.usageTips)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `keyboard.usageTips.title` | 使用提示 | Usage Tips | 使用提示标题 |
| `keyboard.usageTips.tip1` | 快捷键在输入框、文本区域等可编辑元素中不会生效 | Shortcuts won't work in input fields, text areas and other editable elements | 提示1 |
| `keyboard.usageTips.tip2` | 按 F1 键可以随时打开此帮助界面 | Press F1 to open this help interface anytime | 提示2 |
| `keyboard.usageTips.tip3` | 按 Esc 键可以关闭当前打开的模态框 | Press Esc to close the currently open modal | 提示3 |
| `keyboard.usageTips.tip4` | 按 / 键可以快速聚焦到搜索框 | Press / to quickly focus on the search box | 提示4 |

#### 快捷键分类 (keyboard.categories)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `keyboard.categories.general` | 通用操作 | General Operations | 通用操作分类 |
| `keyboard.categories.features` | 功能操作 | Feature Operations | 功能操作分类 |
| `keyboard.categories.browsing` | 图片浏览 | Image Browsing | 图片浏览分类 |

#### 快捷键说明 (keyboard.shortcuts)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `keyboard.shortcuts.closeModal` | 关闭当前模态框 | Close current modal | 关闭模态框 |
| `keyboard.shortcuts.showHelp` | 显示键盘快捷键帮助 | Show keyboard shortcuts help | 显示帮助 |
| `keyboard.shortcuts.refresh` | 刷新图片列表 | Refresh image list | 刷新列表 |
| `keyboard.shortcuts.openConfig` | 打开GitHub配置 | Open GitHub configuration | 打开配置 |
| `keyboard.shortcuts.focusSearch` | 聚焦搜索框 | Focus search box | 聚焦搜索 |
| `keyboard.shortcuts.toggleView` | 切换视图模式 | Toggle view mode | 切换视图 |
| `keyboard.shortcuts.openCompression` | 打开图片压缩工具 | Open image compression tool | 打开压缩工具 |
| `keyboard.shortcuts.openFormatConversion` | 打开图片格式转换 | Open image format conversion | 打开格式转换 |
| `keyboard.shortcuts.openAIAnalysis` | 打开AI图片分析 | Open AI image analysis | 打开AI分析 |
| `keyboard.shortcuts.selectUp` | 选择上一张图片 | Select previous image | 选择上一张 |
| `keyboard.shortcuts.selectDown` | 选择下一张图片 | Select next image | 选择下一张 |
| `keyboard.shortcuts.selectLeft` | 选择左侧图片 | Select left image | 选择左侧 |
| `keyboard.shortcuts.selectRight` | 选择右侧图片 | Select right image | 选择右侧 |
| `keyboard.shortcuts.openSelected` | 打开选中的图片 | Open selected image | 打开选中图片 |

### 🖼️ 图片相关 (image)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `image.browse` | 浏览图片 | Browse Images | 浏览图片 |
| `image.compression` | 图片压缩 | Image Compression | 图片压缩 |
| `image.formatConversion` | 格式转换 | Format Conversion | 格式转换 |
| `image.aiAnalysis` | AI分析 | AI Analysis | AI分析 |

#### 图片筛选 (image.filter)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `image.filter.title` | 图片筛选 | Image Filter | 筛选标题 |
| `image.filter.collapse` | 收起筛选 | Collapse Filter | 收起筛选 |
| `image.filter.expand` | 展开筛选 | Expand Filter | 展开筛选 |
| `image.filter.searchPlaceholder` | 搜索图片名称、描述或标签... | Search image name, description or tags... | 搜索占位符 |
| `image.filter.searchImages` | 搜索图片 | Search Images | 搜索图片按钮 |
| `image.filter.imageType` | 图片类型 | Image Type | 图片类型标签 |
| `image.filter.tags` | 标签筛选 | Tag Filter | 标签筛选 |
| `image.filter.fileSizeRange` | 文件大小范围 | File Size Range | 文件大小范围 |
| `image.filter.minSize` | 最小 | Minimum | 最小大小 |
| `image.filter.maxSize` | 最大 | Maximum | 最大大小 |
| `image.filter.minSizePlaceholder` | 最小大小 (字节) | Minimum size (bytes) | 最小大小占位符 |
| `image.filter.maxSizePlaceholder` | 最大大小 (字节) | Maximum size (bytes) | 最大大小占位符 |
| `image.filter.currentRange` | 当前范围 | Current Range | 当前范围 |
| `image.filter.showingImages` | 显示 | Showing | 显示标签 |
| `image.filter.totalImages` | 张图片 | images | 图片数量单位 |
| `image.filter.showingImagesCount` | 显示 {count} 张图片 | Showing {count} images | 显示图片数量 |
| `image.filter.totalImagesCount` | (共 {count} 张) | (Total {count}) | 总图片数量 |
| `image.filter.resetFilter` | 重置筛选 | Reset Filter | 重置筛选按钮 |
| `image.filter.clearFilter` | 清除筛选 | Clear Filter | 清除筛选按钮 |

#### 图片排序 (image.sorter)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `image.sorter.label` | 排序 | Sort | 排序标签 |
| `image.sorter.createdAt` | 上传时间 | Upload Time | 上传时间 |
| `image.sorter.name` | 文件名称 | File Name | 文件名称 |
| `image.sorter.size` | 文件大小 | File Size | 文件大小 |
| `image.sorter.sortByCreatedAt` | 按上传时间排序 | Sort by upload time | 按上传时间排序 |
| `image.sorter.sortByName` | 按文件名称排序 | Sort by file name | 按文件名称排序 |
| `image.sorter.sortBySize` | 按文件大小排序 | Sort by file size | 按文件大小排序 |

#### 图片列表 (image.list)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `image.list.confirmDelete` | 确定要删除图片 | Are you sure you want to delete image | 删除确认 |
| `image.list.deleting` | 正在删除图片 | Deleting image | 删除中状态 |
| `image.list.deleteSuccess` | 图片 | Image | 删除成功前缀 |
| `image.list.deleted` | 已成功删除 | deleted successfully | 删除成功后缀 |
| `image.list.deleteFailed` | 删除图片 | Delete image | 删除失败前缀 |
| `image.list.failed` | 失败 | failed | 失败后缀 |
| `image.list.editing` | 正在编辑图片 | Editing image | 编辑中状态 |
| `image.list.previewing` | 正在预览图片 | Previewing image | 预览中状态 |
| `image.list.editCancelled` | 已取消编辑 | Edit cancelled | 编辑已取消 |
| `image.list.gettingDimensions` | 获取中... | Getting... | 获取尺寸中 |
| `image.list.selected` | 已选中 | Selected | 已选中状态 |
| `image.list.preview` | 预览 | Preview | 预览按钮 |
| `image.list.edit` | 编辑 | Edit | 编辑按钮 |
| `image.list.moreActions` | 更多操作 | More Actions | 更多操作按钮 |
| `image.list.viewUrl` | 查看地址 | View URL | 查看地址按钮 |
| `image.list.delete` | 删除 | Delete | 删除按钮 |
| `image.list.emptyTitle` | 图片库为空 | Image library is empty | 空状态标题 |
| `image.list.emptyDescription` | 开始上传图片，构建您的专属图片库 | Start uploading images to build your exclusive image library | 空状态描述 |
| `image.list.loadingMore` | 正在加载更多图片... | Loading more images... | 加载更多中 |
| `image.list.loadMore` | 加载更多 | Load More | 加载更多按钮 |
| `image.list.copyUrl` | 复制地址 | Copy URL | 复制地址按钮 |
| `image.list.openUrl` | 打开地址 | Open URL | 打开地址按钮 |
| `image.list.imageUrlTitle` | 图片在线地址 | Image Online URL | 图片地址标题 |
| `image.list.imageAccessUrl` | 图片访问地址 | Image Access URL | 图片访问地址 |
| `image.list.copy` | 复制 | Copy | 复制按钮 |
| `image.list.open` | 打开 | Open | 打开按钮 |
| `image.list.githubUrl` | GitHub 地址 | GitHub URL | GitHub地址 |

#### 图片网格 (image.grid)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `image.grid.confirmDelete` | 确定要删除图片 | Are you sure you want to delete image | 删除确认 |
| `image.grid.deleting` | 正在删除图片 | Deleting image | 删除中状态 |
| `image.grid.deleteSuccess` | 图片 | Image | 删除成功前缀 |
| `image.grid.deleted` | 已成功删除 | deleted successfully | 删除成功后缀 |
| `image.grid.deleteFailed` | 删除图片 | Delete image | 删除失败前缀 |
| `image.grid.failed` | 失败 | failed | 失败后缀 |
| `image.grid.editing` | 正在编辑图片 | Editing image | 编辑中状态 |
| `image.grid.previewing` | 正在预览图片 | Previewing image | 预览中状态 |
| `image.grid.editCancelled` | 已取消编辑 | Edit cancelled | 编辑已取消 |
| `image.grid.preview` | 预览 | Preview | 预览按钮 |
| `image.grid.edit` | 编辑 | Edit | 编辑按钮 |
| `image.grid.delete` | 删除 | Delete | 删除按钮 |
| `image.grid.gettingDimensions` | 获取中... | Getting... | 获取尺寸中 |
| `image.grid.dimensionsUnknown` | 尺寸未知 | Dimensions unknown | 尺寸未知 |
| `image.grid.loadingMore` | 正在加载更多图片... | Loading more images... | 加载更多中 |
| `image.grid.loadMore` | 加载更多 | Load More | 加载更多按钮 |
| `image.grid.allLoaded` | 已加载全部 | All loaded | 全部已加载 |
| `image.grid.images` | 张图片 | images | 图片数量单位 |
| `image.grid.noImages` | 暂无图片 | No images | 无图片 |
| `image.grid.copyUrl` | 复制地址 | Copy URL | 复制地址按钮 |
| `image.grid.openUrl` | 打开地址 | Open URL | 打开地址按钮 |
| `image.grid.imageUrlTitle` | 图片在线地址 | Image Online URL | 图片地址标题 |
| `image.grid.copy` | 复制 | Copy | 复制按钮 |
| `image.grid.open` | 打开 | Open | 打开按钮 |
| `image.grid.imageUrlCopied` | 图片地址 | Image URL | 图片地址已复制前缀 |
| `image.grid.githubUrlCopied` | GitHub地址 | GitHub URL | GitHub地址已复制前缀 |
| `image.grid.copiedToClipboard` | 已复制到剪贴板 | copied to clipboard | 已复制到剪贴板 |
| `image.grid.copyFailed` | 复制失败，请手动复制 | Copy failed, please copy manually | 复制失败 |

#### 视图模式 (image.viewMode)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `image.viewMode.grid` | 网格 | Grid | 网格视图 |
| `image.viewMode.list` | 列表 | List | 列表视图 |

#### 图片搜索 (image.search)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `image.search.placeholder` | 搜索图片名称、描述或标签... | Search image name, description or tags... | 搜索占位符 |
| `image.search.filterByTags` | 按标签筛选 | Filter by tags | 按标签筛选 |
| `image.search.clearFilters` | 清除筛选 | Clear filters | 清除筛选 |

#### 图片上传 (image.upload)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `image.upload.selectedSingle` | 已选择图片 | Image selected | 已选择单张图片 |
| `image.upload.selectedMultiple` | 已选择 | Selected | 已选择多张图片 |
| `image.upload.uploadingSingle` | 正在上传图片 | Uploading image | 上传单张图片中 |
| `image.upload.uploadingMultiple` | 正在批量上传 | Batch uploading | 批量上传中 |
| `image.upload.uploadSuccessSingle` | 图片 | Image | 上传成功前缀 |
| `image.upload.uploadSuccessMultiple` | 成功上传 | uploaded successfully | 批量上传成功 |
| `image.upload.uploadFailed` | 上传图片失败 | Failed to upload image | 上传失败 |
| `image.upload.uploadFailedMultiple` | 批量上传失败 | Batch upload failed | 批量上传失败 |
| `image.upload.cancelled` | 已取消上传 | Upload cancelled | 上传已取消 |
| `image.upload.batchProgress` | 批量上传进度 | Batch Upload Progress | 批量上传进度 |
| `image.upload.uploadingCurrent` | 正在上传 | Uploading | 正在上传当前文件 |
| `image.upload.overallProgress` | 总体进度 | Overall Progress | 总体进度 |
| `image.upload.success` | 成功 | Success | 成功状态 |
| `image.upload.failed` | 失败 | Failed | 失败状态 |
| `image.upload.fileList` | 文件列表 | File List | 文件列表 |
| `image.upload.file` | 文件 | File | 文件 |
| `image.upload.batchUploadTitle` | 批量上传图片 | Batch Upload Images | 批量上传标题 |
| `image.upload.addNewImage` | 添加新图片 | Add New Image | 添加新图片 |
| `image.upload.namePrefix` | 图片名称前缀 | Image Name Prefix | 名称前缀标签 |
| `image.upload.imageName` | 图片名称 | Image Name | 图片名称标签 |
| `image.upload.namePrefixPlaceholder` | 为所有图片添加统一的前缀名称 | Add a unified prefix name for all images | 名称前缀占位符 |
| `image.upload.imageNamePlaceholder` | 为图片起个好名字，便于搜索和管理 | Give your image a good name for easy search and management | 图片名称占位符 |
| `image.upload.description` | 图片描述 | Image Description | 图片描述标签 |
| `image.upload.descriptionPlaceholder` | 描述图片内容、用途或相关信息 | Describe image content, purpose or related information | 描述占位符 |
| `image.upload.descriptionPlaceholderMultiple` | 为所有图片添加统一的描述信息 | Add unified description for all images | 批量描述占位符 |
| `image.upload.tags` | 标签 | Tags | 标签标签 |
| `image.upload.tagsPlaceholder` | 添加标签，用逗号分隔，便于分类和搜索 | Add tags separated by commas for easy categorization and search | 标签占位符 |
| `image.upload.tagsPlaceholderMultiple` | 为所有图片添加统一的标签，用逗号分隔 | Add unified tags for all images, separated by commas | 批量标签占位符 |
| `image.upload.uploading` | 上传中... | Uploading... | 上传中状态 |
| `image.upload.uploadButton` | 上传 | Upload | 上传按钮 |
| `image.upload.batchUploadButton` | 批量上传 | Batch Upload | 批量上传按钮 |
| `image.upload.dragActive` | 释放文件以上传 | Release files to upload | 拖拽激活状态 |
| `image.upload.dragInactive` | 拖拽图片到此处或点击选择 | Drag images here or click to select | 拖拽非激活状态 |
| `image.upload.supportedFormats` | 支持 JPG, PNG, GIF, BMP, WebP, SVG 等主流图片格式 • 可同时选择多张图片 | Supports JPG, PNG, GIF, BMP, WebP, SVG and other mainstream image formats • Multiple images can be selected at once | 支持格式说明 |
| `image.upload.optional` | (可选) | (Optional) | 可选标记 |

#### 图片编辑 (image.edit)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `image.edit.title` | 编辑图片信息 | Edit Image Information | 编辑标题 |
| `image.edit.updating` | 正在更新图片 | Updating image | 更新中状态 |
| `image.edit.updateSuccess` | 图片 | Image | 更新成功前缀 |
| `image.edit.updateFailed` | 更新图片信息失败 | Failed to update image information | 更新失败 |
| `image.edit.saving` | 保存中... | Saving... | 保存中状态 |
| `image.edit.saveChanges` | 保存更改 | Save Changes | 保存更改按钮 |
| `image.edit.namePlaceholder` | 为图片起个好名字，便于搜索和管理 | Give your image a good name for easy search and management | 名称占位符 |
| `image.edit.descriptionPlaceholder` | 描述图片内容、用途或相关信息 | Describe image content, purpose or related information | 描述占位符 |
| `image.edit.tagsPlaceholder` | 添加标签，用逗号分隔，便于分类和搜索 | Add tags separated by commas for easy categorization and search | 标签占位符 |
| `image.edit.imageName` | 图片名称 | Image Name | 图片名称标签 |
| `image.edit.imageDescription` | 图片描述 | Image Description | 图片描述标签 |
| `image.edit.tags` | 标签 | Tags | 标签标签 |
| `image.edit.optional` | (可选) | (Optional) | 可选标记 |
| `image.edit.dimensions` | 尺寸 | Dimensions | 尺寸标签 |
| `image.edit.gettingDimensions` | 获取中... | Getting... | 获取尺寸中 |
| `image.edit.tagsExample` | 例如：风景, 自然, 山水, 摄影 | Example: landscape, nature, mountains, photography | 标签示例 |

### 💬 消息提示 (messages)

| Key | 中文 | English | 说明 |
|-----|------|---------|------|
| `messages.configSaved` | GitHub 配置已成功保存！ | GitHub configuration saved successfully! | 配置保存成功 |
| `messages.configCleared` | GitHub 配置已成功清除！ | GitHub configuration cleared successfully! | 配置清除成功 |
| `messages.configExported` | GitHub 配置已成功导出！ | GitHub configuration exported successfully! | 配置导出成功 |
| `messages.configImported` | GitHub 配置已成功导入！ | GitHub configuration imported successfully! | 配置导入成功 |
| `messages.saveFailed` | 保存配置失败 | Failed to save configuration | 保存失败 |
| `messages.clearFailed` | 清除配置失败 | Failed to clear configuration | 清除失败 |
| `messages.exportFailed` | 导出配置失败 | Failed to export configuration | 导出失败 |
| `messages.importFailed` | 导入配置失败 | Failed to import configuration | 导入失败 |
| `messages.invalidFormat` | 配置文件格式不正确 | Invalid configuration file format | 格式不正确 |
| `messages.noConfigToExport` | 没有可导出的配置 | No configuration to export | 无配置可导出 |

## 🔧 使用方法

### 1. 导入翻译函数

```tsx
import { defaultTranslate } from '@packages/ui/src'

// 使用内置中文翻译
const t = defaultTranslate(zhCN)

// 使用内置英文翻译
const t = defaultTranslate(enUS)

// 使用自定义翻译
const customTranslations = {
  'app.title': 'My Custom App',
  'common.save': 'Save Changes',
  // ... 更多自定义翻译
}
const t = defaultTranslate(customTranslations)
```

### 2. 在组件中使用

```tsx
import { ImageBrowser, ImageUpload } from '@packages/ui/src'

function MyComponent() {
  const t = defaultTranslate(zhCN)
  
  return (
    <div>
      <ImageUpload
        onUploadImage={handleUpload}
        onUploadMultipleImages={handleBatchUpload}
        loading={uploading}
        t={t}
      />
      
      <ImageBrowser
        images={images}
        onDeleteImage={handleDelete}
        onUpdateImage={handleUpdate}
        t={t}
      />
    </div>
  )
}
```

### 3. 自定义翻译

```tsx
// 创建自定义翻译对象
const myTranslations = {
  // 覆盖现有翻译
  'app.title': '我的图片管理器',
  'common.save': '保存设置',
  
  // 添加新的翻译
  'custom.newFeature': '新功能',
  'custom.description': '这是一个新功能的描述',
}

// 合并翻译
const mergedTranslations = {
  ...zhCN,
  ...myTranslations
}

const t = defaultTranslate(mergedTranslations)
```

## 📝 注意事项

1. **Key 值格式**: 使用点号分隔的层级结构，如 `app.title`
2. **参数化翻译**: 支持 `{count}` 等参数，如 `image.filter.showingImagesCount`
3. **嵌套对象**: 翻译对象支持多层嵌套结构
4. **类型安全**: 建议使用 TypeScript 确保翻译 key 的类型安全
5. **默认值**: 如果翻译 key 不存在，会返回 key 本身作为默认值

## 🔄 更新说明

- 当组件库更新时，可能会添加新的翻译 key
- 建议定期检查此文档以获取最新的 key 值
- 自定义翻译时，建议保留原有的 key 结构以便后续更新
