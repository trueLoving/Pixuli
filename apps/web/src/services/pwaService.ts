/**
 * PWA 服务
 * 提供 Service Worker 注册、后台同步、推送通知等功能
 */

// Service Worker 注册状态
export interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  installing: boolean;
  waiting: boolean;
  active: boolean;
}

// 推送通知订阅
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * 注册 Service Worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker is not supported');
      return null;
    }

    try {
      // 等待页面加载完成
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          window.addEventListener('load', resolve, { once: true });
        });
      }

      // 注册 Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', this.registration.scope);

      // 监听更新
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // 新版本已安装，等待激活
              this.updateAvailable = true;
              this.emit('updateAvailable', true);
            }
          });
        }
      });

      // 监听控制器变化
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service Worker controller changed');
        this.emit('controllerChange', null);

        // 防止重复重新加载
        if (reloading) {
          return;
        }

        // 在开发环境中，不自动重新加载，避免死循环
        if (import.meta.env.DEV) {
          console.log('[PWA] Development mode: skipping auto-reload');
          return;
        }

        // 生产环境中，延迟重新加载，避免频繁刷新
        reloading = true;
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            window.location.reload();
          }
        }, 1000);
      });

      return this.registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * 获取 Service Worker 状态
   */
  getServiceWorkerState(): ServiceWorkerState {
    return {
      registration: this.registration,
      updateAvailable: this.updateAvailable,
      installing: this.registration?.installing !== null,
      waiting: this.registration?.waiting !== null,
      active: this.registration?.active !== null,
    };
  }

  /**
   * 更新 Service Worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker is not registered');
    }

    try {
      await this.registration.update();
      console.log('[PWA] Service Worker update check completed');
    } catch (error) {
      console.error('[PWA] Service Worker update failed:', error);
      throw error;
    }
  }

  /**
   * 跳过等待并激活新的 Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker is not registered');
    }

    // 如果有等待中的 Service Worker，发送消息让它跳过等待
    if (this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }

    // 如果没有等待中的 Service Worker，检查是否有安装中的
    if (this.registration.installing) {
      // 等待安装完成
      const installingWorker = this.registration.installing;
      await new Promise<void>((resolve, reject) => {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 有控制器，说明需要更新
              installingWorker.postMessage({ type: 'SKIP_WAITING' });
              resolve();
            } else {
              // 没有控制器，说明是首次安装
              resolve();
            }
          } else if (installingWorker.state === 'redundant') {
            reject(new Error('Service Worker installation failed'));
          }
        });
      });
      return;
    }

    // 如果 Service Worker 已经激活，直接刷新页面
    if (this.registration.active) {
      console.log('[PWA] Service Worker is already active, reloading page');
      window.location.reload();
      return;
    }

    // 没有等待或安装中的 Service Worker
    throw new Error('No waiting or installing Service Worker');
  }

  /**
   * 注册后台同步
   */
  async registerBackgroundSync(tag: string): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker is not supported');
      return false;
    }

    try {
      const registration =
        this.registration || (await navigator.serviceWorker.ready);
      const syncManager = (registration as any).sync;
      if (!syncManager) {
        console.warn('[PWA] Background Sync is not supported');
        return false;
      }
      await syncManager.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
      return false;
    }
  }

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
    applicationServerKey?: string
  ): Promise<PushSubscription | null> {
    if (!('PushManager' in window)) {
      console.warn('[PWA] Push notifications are not supported');
      return null;
    }

    const registration =
      this.registration || (await navigator.serviceWorker.ready);

    try {
      // 检查是否已有订阅
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // 创建新订阅
        const options: PushSubscriptionOptionsInit = {
          userVisibleOnly: true,
        };

        if (applicationServerKey) {
          // 将 VAPID 公钥转换为 Uint8Array
          const keyArray = this.urlBase64ToUint8Array(applicationServerKey);
          options.applicationServerKey = keyArray.buffer as ArrayBuffer;
        }

        subscription = await registration.pushManager.subscribe(options);
      }

      // 转换为可序列化的格式
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      const subscriptionData: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dhKey ? this.arrayBufferToBase64(p256dhKey) : '',
          auth: authKey ? this.arrayBufferToBase64(authKey) : '',
        },
      };

      console.log(
        '[PWA] Push subscription created:',
        subscriptionData.endpoint
      );
      return subscriptionData;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }

  /**
   * 取消推送通知订阅
   */
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!('PushManager' in window)) {
      return false;
    }

    const registration =
      this.registration || (await navigator.serviceWorker.ready);

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('[PWA] Push subscription cancelled');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA] Push unsubscription failed:', error);
      return false;
    }
  }

  /**
   * 显示通知
   */
  async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications are not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('[PWA] Notification permission not granted');
      return;
    }

    const registration =
      this.registration || (await navigator.serviceWorker.ready);

    await registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options,
    });
  }

  /**
   * 获取缓存大小
   */
  async getCacheSize(): Promise<number> {
    if (!this.registration) {
      return 0;
    }

    return new Promise(resolve => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = event => {
        resolve(event.data.size || 0);
      };

      if (this.registration?.active) {
        this.registration.active.postMessage({ type: 'GET_CACHE_SIZE' }, [
          messageChannel.port2,
        ]);
      } else {
        resolve(0);
      }
    });
  }

  /**
   * 清除所有缓存
   */
  async clearCache(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    return new Promise(resolve => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = event => {
        resolve(event.data.success || false);
      };

      if (this.registration?.active) {
        this.registration.active.postMessage({ type: 'CLEAR_CACHE' }, [
          messageChannel.port2,
        ]);
      } else {
        resolve(false);
      }
    });
  }

  /**
   * 缓存指定 URL
   */
  async cacheUrls(urls: string[]): Promise<void> {
    if (!this.registration?.active) {
      return;
    }

    this.registration.active.postMessage({
      type: 'CACHE_URLS',
      urls,
    });
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
