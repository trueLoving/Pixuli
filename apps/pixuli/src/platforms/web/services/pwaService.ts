/**
 * PWA 相关能力：缓存大小等。
 * 与 vite-plugin-pwa 生成的 Service Worker 配合；更新提示由 useRegisterSW 处理。
 */

export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) return 0;
  let total = 0;
  try {
    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      for (const request of keys) {
        const response = await cache.match(request);
        if (response?.body) {
          const blob = await response.blob();
          total += blob.size;
        }
      }
    }
  } catch {
    return 0;
  }
  return total;
}
