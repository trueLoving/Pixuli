# 截图目录

本目录用于存放 Pixuli 应用的相关截图，用于文档站点展示。

## 目录结构

```
screenshots/
├── desktop-source-config.png      # 桌面端仓库源配置界面
├── web-source-config.png            # Web 端仓库源配置界面
├── mobile-source-config.png        # 移动端仓库源配置界面
├── desktop-github-config.png       # 桌面端 GitHub 配置对话框
├── desktop-gitee-config.png        # 桌面端 Gitee 配置对话框
├── web-github-config.png           # Web 端 GitHub 配置界面
├── web-gitee-config.png             # Web 端 Gitee 配置界面
└── ...                              # 其他功能截图
```

## 截图要求

- **格式**: PNG 或 JPG
- **尺寸**: 建议宽度 1200px 以上，保持清晰度
- **命名**: 使用小写字母和连字符，例如：`desktop-source-config.png`
- **内容**: 确保截图清晰展示配置界面和关键信息

## 使用方式

在文档中使用 Next.js Image 组件引用截图：

```tsx
import Image from 'next/image';

<Image
  src="/screenshots/desktop-source-config.png"
  alt="桌面端仓库源配置界面"
  width={800}
  height={600}
  className="rounded-lg border"
/>
```

## 建议的截图

### 配置相关
- `desktop-source-config.png` - 桌面端仓库源管理界面
- `desktop-github-config.png` - 桌面端 GitHub 配置对话框
- `desktop-gitee-config.png` - 桌面端 Gitee 配置对话框
- `web-source-config.png` - Web 端存储配置界面
- `mobile-source-config.png` - 移动端配置界面

### 功能相关
- `desktop-upload.png` - 桌面端上传界面
- `desktop-image-browser.png` - 桌面端图片浏览界面
- `web-image-browser.png` - Web 端图片浏览界面
- `mobile-image-browser.png` - 移动端图片浏览界面
