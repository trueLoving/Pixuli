# Capacitor 原生能力插件（REF-510 / #120）

> **文档状态**：📦 **已归档（只读快照）** · 2026-06-17  
> **归档原因**：REF-510 #120 ✅；L3 插件选型已落地于 `apps/pixuli`。  
> **当前请读**：[06-apps-pixuli-engineering.md](../../docs/02-system-design/06-apps-pixuli-engineering.md) · 索引
> [README.md](./README.md)

> 三端融合 P4 L3：在 `apps/pixuli`
> 内用 Capacitor 插件补齐 PoC 未覆盖的原生能力；**不在** `apps/mobile`
> 重复实现。

## 1. 选型结论

| 能力                  | 插件                     | 理由                                                                                           | 状态                  |
| --------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- | --------------------- |
| 相机拍照              | `@capacitor/camera`      | 官方维护；`Camera.getPhoto` + `CameraSource.Camera`                                            | ✅ #120               |
| 相册多选              | `@capacitor/camera`      | 同包 `Camera.pickImages`；避免再引 file-picker 插件                                            | ✅ #120               |
| 临时文件 / 分享缓存   | `@capacitor/filesystem`  | P6 已用于工作区；分享前写 `Directory.Cache`                                                    | ✅ 已有               |
| 分享图片文件          | `@capacitor/share`       | 系统分享面板；对齐 RN `expo-sharing` 核心路径                                                  | ✅ #120               |
| 剪贴板                | `@capacitor/clipboard`   | P6 / #161 已接入                                                                               | ✅ 已有               |
| 应用生命周期 / 返回键 | `@capacitor/app`         | PoC 已接入 `useCapacitorBackButton`                                                            | ✅ 已有               |
| 状态栏 / 安全区       | —                        | Web CSS `env(safe-area-inset-*)` 已覆盖主流场景；**暂不**引 StatusBar 插件                     | 书面降级              |
| 保存到系统相册        | —                        | 需 `@capacitor-community/media` 或原生 MediaStore；**#120 最小集不含**；用户可通过分享面板保存 | 书面降级 → 后续 Issue |
| SAF 用户目录          | —                        | 工作区 P6 用 `Directory.Data` 沙箱；SAF 选目录单独规划                                         | ⏳ 不阻塞 #120        |
| `localStorage` 替代   | `@capacitor/preferences` | 当前无 WebView 存储边缘问题                                                                    | 不引入                |

## 2. 运行时分支

- 检测：`apps/pixuli/src/platforms/platform.ts` →
  `isNativeMobile()`（`Capacitor.isNativePlatform()`）
- 实现：`apps/pixuli/src/utils/nativeMedia.ts`（**不**放入 `@pixuli/ui`，与
  `clipboard.ts` 同层）
- 注入 UI：可选 props `nativePickers` / `onShareImage`，由 `ImageContent`
  经 hook 传入

```text
Capacitor WebView
  └─ ImageContent
       ├─ useNativeImagePickers() → ImageBrowser → UploadButton → ImageUpload
       └─ useNativeShareImage()   → ImagePreviewModal「分享图片」
```

## 3. 用户路径

| 旅程       | 行为                                                          |
| ---------- | ------------------------------------------------------------- |
| J4-03 相册 | 上传弹窗「从相册选择」→ `Camera.pickImages` → 现有上传表单    |
| J4-04 相机 | 上传弹窗「拍照」→ `Camera.getPhoto`                           |
| J5-05 分享 | 预览模态框「分享图片」→ 下载到缓存 → `Share.share({ files })` |

Web / Desktop 仍用 `<input type="file">` / 拖拽；`navigator.share`
在支持的浏览器上作为分享降级。

## 4. Android 集成

- 依赖：`apps/pixuli/package.json` 登记 `@capacitor/camera`、`@capacitor/share`
- 同步：`pnpm --filter pixuli-app cap:sync`
- 权限：`AndroidManifest.xml` 声明 `CAMERA`、`READ_MEDIA_IMAGES`（及 API≤32 的
  `READ_EXTERNAL_STORAGE`）

## 5. 与 #119 / #141 边界

- **#119** ✅：RN 组件不迁入；L3 仅在 pixuli 补齐
- **#141** ✅：拍照 EXIF/GPS/`localPath` 元数据 →
  `ImageUploadData.captureMetadata` → sidecar `capture`
- **#166**：真机冒烟验收（选图上传、分享、元数据）

## 6. 拍照元数据（REF-511 / #141）

| 字段       | 来源                                            | 说明                                               |
| ---------- | ----------------------------------------------- | -------------------------------------------------- |
| `takenAt`  | EXIF `DateTimeOriginal` → 文件 mtime → 采集时刻 | 可写入 `ImageItem.createdAt`                       |
| 文件信息   | `File` + Capacitor `Photo.path`                 | `fileName` / `mimeType` / `fileSize` / `localPath` |
| EXIF 子集  | `exifr` + Capacitor `Photo.exif`                | `make` / `model` / `orientation` 等                |
| `location` | EXIF GPS only                                   | 不调用持续定位；无 GPS 则为空                      |

链路：`imageCaptureMetadata.ts` → `nativeMedia.ts` → `ImageUpload` → Provider
sidecar `capture`。

## 7. 修订记录

| 版本 | 日期       | 说明                                        |
| ---- | ---------- | ------------------------------------------- |
| 1.0  | 2026-06-16 | REF-510 #120 初稿：插件选型、分支、降级说明 |
| 1.1  | 2026-06-17 | REF-511 #141：拍照元数据采集与 sidecar 字段 |
