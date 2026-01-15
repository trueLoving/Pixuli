/**
 * PWA 服务
 * 提供推送通知等功能
 */

// 推送通知订阅
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PWAService {
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * 请求推送通知权限
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications are not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * 订阅推送通知
   */
  async subscribeToPushNotifications(
    _applicationServerKey?: string,
  ): Promise<PushSubscription | null> {
    console.warn('[PWA] Push notifications require Service Worker');
    return null;
  }

  /**
   * 取消推送通知订阅
   */
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    console.warn('[PWA] Push notifications require Service Worker');
    return false;
  }

  /**
   * 显示通知
   */
  async showNotification(
    title: string,
    options?: NotificationOptions,
  ): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications are not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('[PWA] Notification permission not granted');
      return;
    }

    // 使用浏览器原生通知 API（不依赖 Service Worker）
    new Notification(title, {
      icon: '/pwa/icon-192x192.png',
      badge: '/pwa/icon-192x192.png',
      ...options,
    });
  }

  /**
   * 获取缓存大小
   */
  async getCacheSize(): Promise<number> {
    return 0;
  }

  /**
   * 清除所有缓存
   */
  async clearCache(): Promise<boolean> {
    return false;
  }

  /**
   * 缓存指定 URL
   */
  async cacheUrls(_urls: string[]): Promise<void> {
    return;
  }

  /**
   * 监听事件
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[PWA] Event callback error:', error);
        }
      });
    }
  }

  /**
   * 将 Base64 URL 安全字符串转换为 Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * 将 ArrayBuffer 转换为 Base64 字符串
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// 导出单例
export const pwaService = new PWAService();
