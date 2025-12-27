/**
 * 推送通知服务
 * 处理推送通知的订阅和管理
 */

import { pwaService, PushSubscription } from './pwaService';

class PushNotificationService {
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string | null = null;

  /**
   * 设置 VAPID 公钥
   */
  setVapidPublicKey(key: string): void {
    this.vapidPublicKey = key;
  }

  /**
   * 初始化推送通知
   */
  async initialize(): Promise<boolean> {
    if (!('PushManager' in window)) {
      console.warn('[PushNotification] Push notifications are not supported');
      return false;
    }

    // 请求通知权限
    const permission = await pwaService.requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[PushNotification] Notification permission denied');
      return false;
    }

    // 订阅推送通知
    this.subscription = await pwaService.subscribeToPushNotifications(
      this.vapidPublicKey || undefined,
    );

    return this.subscription !== null;
  }

  /**
   * 获取当前订阅
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.subscription) {
      this.subscription = await pwaService.subscribeToPushNotifications(
        this.vapidPublicKey || undefined,
      );
    }
    return this.subscription;
  }

  /**
   * 取消订阅
   */
  async unsubscribe(): Promise<boolean> {
    const result = await pwaService.unsubscribeFromPushNotifications();
    if (result) {
      this.subscription = null;
    }
    return result;
  }

  /**
   * 显示通知
   */
  async showNotification(
    title: string,
    options?: NotificationOptions,
  ): Promise<void> {
    await pwaService.showNotification(title, options);
  }

  /**
   * 检查是否已订阅
   */
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  /**
   * 检查通知权限
   */
  getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

// 导出单例
export const pushNotificationService = new PushNotificationService();
