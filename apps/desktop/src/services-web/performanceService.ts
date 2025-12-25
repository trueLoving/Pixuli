/**
 * Web端性能监控服务
 */

import {
  PerformanceMonitor,
  type PerformanceMonitorConfig,
} from '@packages/common/src';

/**
 * 性能监控服务单例
 */
class PerformanceService {
  private monitor: PerformanceMonitor | null = null;
  private isInitialized: boolean = false;

  /**
   * 初始化性能监控
   */
  init(config?: Partial<PerformanceMonitorConfig>) {
    if (this.isInitialized) {
      return;
    }

    // 从环境变量或配置中获取上报URL
    const reportUrl =
      (typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_PERFORMANCE_REPORT_URL) ||
      config?.reportUrl;

    // 从环境变量获取是否启用控制台输出
    const consoleOutput =
      typeof import.meta === 'undefined' ||
      import.meta.env?.VITE_PERFORMANCE_CONSOLE_OUTPUT !== 'false';

    const monitorConfig: Partial<PerformanceMonitorConfig> = {
      enabled: true,
      sampleRate: 1.0,
      reportInterval: 5000,
      realtimeReport: false,
      thresholds: {
        fps: 55,
        memoryUsage: 80,
        longTask: 50,
        pageLoadTime: 3000,
      },
      consoleOutput,
      reportUrl,
      ...config,
    };

    this.monitor = new PerformanceMonitor(monitorConfig);
    this.monitor.init();
    this.isInitialized = true;

    // 在开发环境下，将监控实例挂载到window对象，方便调试
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      (window as any).__performanceMonitor = this.monitor;
    }
  }

  /**
   * 获取性能监控实例
   */
  getMonitor(): PerformanceMonitor | null {
    return this.monitor;
  }

  /**
   * 收集并上报性能指标
   */
  collectAndReport(
    type?: 'render' | 'load' | 'memory' | 'network' | 'interaction',
  ) {
    if (this.monitor) {
      this.monitor.collectAndReport(type);
    }
  }

  /**
   * 获取当前性能指标
   */
  getMetrics() {
    if (this.monitor) {
      return this.monitor.getMetrics();
    }
    return null;
  }

  /**
   * 分析性能
   */
  analyze() {
    if (this.monitor) {
      return this.monitor.analyze();
    }
    return null;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceMonitorConfig>) {
    if (this.monitor) {
      this.monitor.updateConfig(config);
    }
  }

  /**
   * 销毁性能监控
   */
  destroy() {
    if (this.monitor) {
      this.monitor.destroy();
      this.monitor = null;
      this.isInitialized = false;
    }
  }
}

export const performanceService = new PerformanceService();
