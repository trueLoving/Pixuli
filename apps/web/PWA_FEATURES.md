# PWA 功能实现总结

本文档总结了 Pixuli Web 端 PWA 功能的完整实现。

## ✅ 已实现功能

### 1. Service Worker 离线缓存 ✅

**文件：**

- `public/sw.js` - 自定义 Service Worker
- `src/services/pwaService.ts` - PWA 服务封装

**功能：**

- 自定义 Service Worker 实现离线缓存
- 支持多种缓存策略：
  - **NetworkFirst**: GitHub API 请求（优先网络，失败时使用缓存）
  - **CacheFirst**: 图片资源（优先缓存，失败时使用网络）
- 自动清理旧版本缓存
- 支持缓存大小查询和清除

**缓存策略：**

- GitHub API: 24小时缓存，最多50条
- GitHub 图片: 7天缓存，最多100条
- 本地图片: 30天缓存，最多200条
- 静态资源: 1年缓存，最多100条

### 2. Web App Manifest 配置 ✅

**文件：**

- `vite.config.ts` - VitePWA 插件配置
- `public/manifest.json` - Manifest 文件

**配置项：**

- 应用名称、图标、主题色
- 独立显示模式（standalone）
- 快捷方式（上传图片）
- 分类标签
- 启动 URL 和作用域

### 3. 离线图片浏览功能 ✅

**实现方式：**

- Service Worker 自动缓存所有图片资源
- 使用 CacheFirst 策略，优先从缓存加载
- 离线时自动显示已缓存的图片
- 支持图片预览和浏览

**集成位置：**

- `src/stores/imageStore.ts` - 图片存储状态管理
- Service Worker 自动处理图片缓存

### 4. PWA 安装提示组件 ✅

**文件：**

- `src/components/pwa/PWAInstallPrompt.tsx`

**功能：**

- 检测 `beforeinstallprompt` 事件
- 自定义安装提示 UI
- 支持安装和稍后操作
- 24小时内不再重复提示
- 检测已安装状态（standalone 模式）
- **新增：** 应用更新提示

### 5. 离线状态指示器 ✅

**文件：**

- `src/components/pwa/OfflineIndicator.tsx`

**功能：**

- 实时显示在线/离线状态
- 显示缓存大小信息
- 显示待同步操作数量
- 自动隐藏/显示横幅
- 定期检查同步状态（每30秒）

### 6. 缓存策略配置 ✅

**文件：**

- `vite.config.ts` - Workbox 配置

**优化：**

- GitHub API: NetworkFirst + 10秒超时
- GitHub 图片: CacheFirst + 7天过期
- 本地图片: CacheFirst + 30天过期
- 静态资源: CacheFirst + 1年过期
- 自动清理过期缓存

### 7. 后台同步功能 ✅

**文件：**

- `src/services/backgroundSyncService.ts` - 后台同步服务
- `src/stores/imageStore.ts` - 集成到图片存储

**功能：**

- 使用 IndexedDB 存储待同步操作
- 支持离线上传、删除、更新操作
- 网络恢复后自动同步
- 操作队列管理
- 重试机制

**支持的操作：**

- 图片上传（离线时创建临时预览）
- 图片删除（乐观更新）
- 图片更新（乐观更新）

### 8. 推送通知功能 ✅

**文件：**

- `src/services/pushNotificationService.ts` - 推送通知服务
- `src/services/pwaService.ts` - PWA 服务（包含推送订阅）

**功能：**

- 请求通知权限
- 订阅/取消订阅推送通知
- 显示本地通知
- 处理通知点击事件
- 支持 VAPID 密钥配置

**Service Worker 支持：**

- `push` 事件处理
- `notificationclick` 事件处理
- 自动聚焦或打开窗口

## 📁 文件结构

```
apps/web/
├── public/
│   └── sw.js                    # 自定义 Service Worker
├── src/
│   ├── services/
│   │   ├── pwaService.ts        # PWA 核心服务
│   │   ├── backgroundSyncService.ts  # 后台同步服务
│   │   └── pushNotificationService.ts # 推送通知服务
│   ├── components/
│   │   └── pwa/
│   │       ├── PWAInstallPrompt.tsx  # 安装提示组件
│   │       ├── OfflineIndicator.tsx   # 离线指示器组件
│   │       └── locales/
│   │           └── index.ts           # 国际化翻译
│   ├── stores/
│   │   └── imageStore.ts        # 图片存储（集成后台同步）
│   ├── main.tsx                 # 入口文件（注册 Service Worker）
│   └── vite.config.ts           # Vite 配置（PWA 插件配置）
```

## 🚀 使用方法

### 初始化

Service Worker 会在应用启动时自动注册（`main.tsx`）：

```typescript
if ('serviceWorker' in navigator) {
  pwaService.registerServiceWorker().catch(error => {
    console.error('[PWA] Failed to register Service Worker:', error);
  });
}
```

### 后台同步

离线操作会自动添加到同步队列：

```typescript
// 上传图片（离线时）
await uploadImage(uploadData);
// 自动添加到后台同步队列

// 删除图片（离线时）
await deleteImage(imageId, fileName);
// 自动添加到后台同步队列
```

### 推送通知

```typescript
import { pushNotificationService } from './services/pushNotificationService';

// 初始化推送通知
await pushNotificationService.initialize();

// 显示通知
await pushNotificationService.showNotification('标题', {
  body: '内容',
  icon: '/icon-192x192.png',
});
```

## 🌐 国际化

所有 PWA 相关文本都支持中英文：

- `pwa.install.*` - 安装提示
- `pwa.offline.*` - 离线状态
- `pwa.sync.*` - 后台同步
- `pwa.notification.*` - 推送通知
- `pwa.update.*` - 应用更新
- `pwa.cache.*` - 缓存管理

## 🔧 配置选项

### VAPID 公钥（推送通知）

如果需要推送通知功能，需要配置 VAPID 公钥：

```typescript
pushNotificationService.setVapidPublicKey('your-vapid-public-key');
```

### Service Worker 更新

应用会自动检测 Service Worker 更新，并提示用户更新。

## 📝 注意事项

1. **Service Worker 作用域**: 当前配置为 `/`，覆盖整个应用
2. **缓存策略**: 根据资源类型选择不同的缓存策略
3. **后台同步**: 需要浏览器支持 Background Sync API
4. **推送通知**: 需要 HTTPS 环境（localhost 除外）
5. **离线操作**: 离线时的操作会在网络恢复后自动同步

## 🐛 调试

### 查看 Service Worker 状态

打开浏览器开发者工具：

- Application → Service Workers
- Application → Cache Storage
- Application → IndexedDB

### 查看后台同步队列

```typescript
import { backgroundSyncService } from './services/backgroundSyncService';

const operations = await backgroundSyncService.getPendingOperations();
console.log('待同步操作:', operations);
```

### 清除缓存

```typescript
import { pwaService } from './services/pwaService';

await pwaService.clearCache();
```

## 📚 参考资源

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Workbox](https://developers.google.com/web/tools/workbox)
