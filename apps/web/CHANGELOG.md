# 更新日志

本文档记录了 Pixuli Web 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循
[语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### ✨ 新增功能

#### 核心功能

- **幻灯片播放功能**：支持幻灯片模式浏览图片，多种过渡效果
- **Gitee 存储支持**：添加 Gitee 作为仓库源，支持 GitHub 和 Gitee 双存储
  - Gitee 配置页面
  - 配置导入/导出功能
  - 配置清除功能
  - GitHub 和 Gitee 配置可共存
  - Vercel 代理支持 Gitee 图片资源访问

#### 图片处理

- **图片上传组件增强**：添加图片压缩和裁剪功能

#### PWA 功能

- **完整的 PWA 功能**：实现完整的渐进式 Web 应用功能
  - 安装到主屏幕
  - 离线支持
  - 后台同步
  - 推送通知

### 🔧 改进

- 优化图片尺寸和文件大小获取逻辑
- 优化图片搜索性能
- 优化 web 端版本信息，添加 Git 分支和 commit 信息
- web 端打包优化，配置代码分包策略
- 添加页面加载动画，与桌面端保持一致
- 语言包重构，Toast 国际化修复
- 优化 App.tsx 数据管理，将组件内部状态移到对应组件
- 简化图片裁剪功能，移除多形状裁剪，只保留矩形裁剪
- 重构 UI 组件和类型定义
- 整合 web 端和桌面端公共组件到 packages/ui

### 🐛 修复

- 修复 web 端演示模式下国际化语言显示异常的问题
- 修复 web 端 metadata URL 格式并使用 warning 替代 error
- 修复 vercel 平台部署报错
- 暂时禁用 PWA 缓存功能和更新提示

### 🎯 技术特性

- 升级所有端到 React 19.1.0
- 重构主题系统，为 web 应用创建独立的主题管理
- 移除 Tailwind CSS 依赖，改用自定义 CSS 样式
- 完善国际化功能和组件重构
- 添加 Prettier 代码格式化工具
- 添加演示环境支持和环境变量配置

---

**注意**：Web 端目前处于持续开发中，尚未发布正式版本。所有功能变更将在此记录。

---

[未发布]: https://github.com/trueLoving/pixuli/tree/main/apps/web
