# Pixuli 品牌资源（三端 SSOT）

**来源**：`brand/source/` 为三端 SSOT；首次自
`archive/apps/mobile/assets/images/` 同步（REF-516）。重新拉取源图可运行
`pnpm sync:brand`。

**同步命令**（在 `apps/pixuli` 下）：

```bash
pnpm sync:brand
```

## 源文件（`source/`）

| 文件                          | 用途                                         |
| ----------------------------- | -------------------------------------------- |
| `icon.png`                    | 主图标 1024×1024；Web PWA、Desktop 托盘/窗口 |
| `favicon.png`                 | 32×32 站点图标                               |
| `splash-icon.png`             | 启动图中心标识（对齐 Expo splash）           |
| `android-icon-foreground.png` | Android 自适应图标前景                       |
| `android-icon-background.png` | Android 自适应图标背景                       |
| `android-icon-monochrome.png` | Android 13+ 单色图标（可选）                 |

## 生成产物

- `public/icon.png`、`public/favicon.png`、`public/favicon.ico`、`public/icon.ico`
- `public/pwa/icon-192x192.png`、`public/pwa/icon-512x512.png`
- `android/app/src/main/res/mipmap-*/` 启动器图标
- `android/app/src/main/res/drawable*/splash.png` 启动屏
