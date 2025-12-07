/**
 * 性能数据上报器
 */

import type { PerformanceEvent } from '../types';

/**
 * 基础上报器
 */
export abstract class BaseReporter {
  /**
   * 上报性能数据
   */
  abstract report(event: PerformanceEvent): void;
}

/**
 * 控制台上报器
 */
export class ConsoleReporter extends BaseReporter {
  report(event: PerformanceEvent) {
    console.group(`[Performance] ${event.type}`);
    console.log('Timestamp:', new Date(event.timestamp).toISOString());
    console.log('URL:', event.url);
    console.log('Data:', event.data);
    console.groupEnd();
  }
}

/**
 * HTTP 上报器
 */
export class HttpReporter extends BaseReporter {
  private reportUrl: string;

  constructor(reportUrl: string) {
    super();
    this.reportUrl = reportUrl;
  }

  report(event: PerformanceEvent) {
    if (typeof fetch === 'undefined') {
      return;
    }

    // 使用 sendBeacon 或 fetch 上报
    const data = JSON.stringify(event);

    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(this.reportUrl, blob);
    } else {
      fetch(this.reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
        keepalive: true, // 确保在页面卸载时也能发送
      }).catch(error => {
        console.error('Performance report failed:', error);
      });
    }
  }
}
