import { Capacitor } from '@capacitor/core';

/**
 * Capacitor 真机/模拟器启动清理：卸载历史 SW，避免 WebView 白屏。
 * 离线 APK 构建已禁用 PWA（CAPACITOR_NATIVE），此处兜底 Live Reload 包残留。
 */
export async function bootstrapCapacitorNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => registration.unregister()),
    );
  } catch {
    // 忽略清理失败，不阻塞应用启动
  }
}
