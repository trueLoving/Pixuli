// 自定义 Service Worker
// 这个文件会被 vite-plugin-pwa 自动处理，但我们可以在这里添加自定义逻辑

const CACHE_VERSION = 'pixuli-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 立即激活新的 Service Worker
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // 删除所有旧版本的缓存
            return name.startsWith('pixuli-') && !name.includes(CACHE_VERSION);
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // 立即控制所有客户端
  return self.clients.claim();
});

// 获取事件 - 实现缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过 Chrome 扩展和浏览器内部请求
  if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:') {
    return;
  }

  // GitHub API 请求 - NetworkFirst 策略
  if (url.hostname === 'api.github.com') {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // GitHub 图片资源 - CacheFirst 策略
  if (
    url.hostname === 'raw.githubusercontent.com' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i)
  ) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // 静态资源 - CacheFirst 策略
  if (
    url.origin === self.location.origin &&
    (url.pathname.match(/\.(js|css|html|ico|png|svg|woff2)$/i) ||
      url.pathname === '/')
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // 其他请求 - NetworkFirst 策略
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// NetworkFirst 策略：先尝试网络，失败后使用缓存
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    // 如果响应成功，更新缓存
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // 如果缓存也没有，返回离线页面或错误
    throw error;
  }
}

// CacheFirst 策略：先尝试缓存，失败后使用网络
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    // 如果响应成功，更新缓存
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Cache and network failed:', request.url);
    // 对于图片，可以返回一个占位图
    if (request.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif" font-size="14">图片加载失败</text></svg>',
        {
          headers: { 'Content-Type': 'image/svg+xml' },
        }
      );
    }
    throw error;
  }
}

// 后台同步事件
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-images') {
    event.waitUntil(syncImages());
  } else if (event.tag === 'sync-api') {
    event.waitUntil(syncAPI());
  }
});

// 同步图片数据
async function syncImages() {
  try {
    // 从 IndexedDB 获取待同步的图片操作
    const pendingOperations = await getPendingOperations();

    for (const operation of pendingOperations) {
      try {
        if (operation.type === 'upload') {
          // 执行上传操作
          await performUpload(operation.data);
        } else if (operation.type === 'delete') {
          // 执行删除操作
          await performDelete(operation.data);
        } else if (operation.type === 'update') {
          // 执行更新操作
          await performUpdate(operation.data);
        }

        // 操作成功后，从待同步列表中移除
        await removePendingOperation(operation.id);
      } catch (error) {
        console.error('[Service Worker] Sync operation failed:', error);
        // 操作失败，保留在待同步列表中，下次重试
      }
    }
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
    throw error; // 重新抛出错误，让浏览器知道同步失败，稍后重试
  }
}

// 同步 API 数据
async function syncAPI() {
  try {
    // 刷新 API 缓存
    const cache = await caches.open(API_CACHE);
    // 这里可以添加需要刷新的 API 端点
    console.log('[Service Worker] API sync completed');
  } catch (error) {
    console.error('[Service Worker] API sync failed:', error);
    throw error;
  }
}

// 推送通知事件
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  let notificationData = {
    title: 'Pixuli',
    body: '您有新的通知',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'pixuli-notification',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction || false,
      actions: notificationData.actions || [],
    })
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 如果已经有打开的窗口，聚焦它
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // 否则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// 消息事件 - 用于与主线程通信
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  } else if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ size });
    });
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// 辅助函数：从 IndexedDB 获取待同步操作
async function getPendingOperations() {
  // 这里需要实现 IndexedDB 的读取逻辑
  // 为了简化，这里返回空数组
  return [];
}

// 辅助函数：移除待同步操作
async function removePendingOperation(id) {
  // 这里需要实现 IndexedDB 的删除逻辑
}

// 辅助函数：执行上传操作
async function performUpload(data) {
  // 这里需要实现实际上传逻辑
  console.log('[Service Worker] Performing upload:', data);
}

// 辅助函数：执行删除操作
async function performDelete(data) {
  // 这里需要实现实际删除逻辑
  console.log('[Service Worker] Performing delete:', data);
}

// 辅助函数：执行更新操作
async function performUpdate(data) {
  // 这里需要实现实际更新逻辑
  console.log('[Service Worker] Performing update:', data);
}

// 获取缓存大小
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

// 清除所有缓存
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map((name) => caches.delete(name)));
}
