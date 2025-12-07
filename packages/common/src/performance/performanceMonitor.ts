/**
 * 性能监控主类
 */

import type {
  PerformanceMetrics,
  PerformanceMonitorConfig,
  PerformanceEvent,
  PerformanceEventType,
  ReportOptions,
} from './types';
import { WebPerformanceCollector } from './adapters/web/collector';
import { PerformanceAnalyzer } from './analyzers/performanceAnalyzer';
import { BaseReporter, ConsoleReporter, HttpReporter } from './reporters';

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private collector: WebPerformanceCollector | null = null;
  private analyzer: PerformanceAnalyzer;
  private reporters: BaseReporter[] = [];
  private reportTimer: number | null = null;
  private isInitialized = false;
  private metrics: PerformanceMetrics | null = null;

  constructor(config?: Partial<PerformanceMonitorConfig>) {
    this.config = {
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
      consoleOutput: true,
      ...config,
    };

    this.analyzer = new PerformanceAnalyzer(this.config.thresholds);

    // 初始化上报器
    if (this.config.consoleOutput) {
      this.reporters.push(new ConsoleReporter());
    }

    if (this.config.reportUrl) {
      this.reporters.push(new HttpReporter(this.config.reportUrl));
    }
  }

  /**
   * 初始化性能监控
   */
  init() {
    if (this.isInitialized || !this.config.enabled) {
      return;
    }

    // 初始化收集器
    if (typeof window !== 'undefined') {
      this.collector = new WebPerformanceCollector();
      this.collector.init();
    }

    // 启动定时上报
    if (!this.config.realtimeReport && this.config.reportInterval > 0) {
      this.startPeriodicReport();
    }

    this.isInitialized = true;
  }

  /**
   * 收集并上报性能指标
   */
  collectAndReport(type?: PerformanceEventType, options?: ReportOptions) {
    if (!this.isInitialized || !this.config.enabled) {
      return;
    }

    // 采样率检查
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // 收集指标
    if (!this.collector) {
      return;
    }

    const metrics = this.collector.collect(type || 'render');
    if (!metrics) {
      return;
    }

    this.metrics = metrics;

    // 创建事件
    const event: PerformanceEvent = {
      type: type || 'render',
      data: metrics,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    // 上报
    if (options?.immediate || this.config.realtimeReport) {
      this.report(event, options);
    } else {
      // 批量上报会在定时器中处理
    }
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): PerformanceMetrics | null {
    if (!this.collector) {
      return null;
    }

    return this.collector.collect('render') || this.metrics;
  }

  /**
   * 分析性能
   */
  analyze() {
    const metrics = this.getMetrics();
    if (!metrics) {
      return null;
    }

    return this.analyzer.analyze(metrics);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceMonitorConfig>) {
    this.config = { ...this.config, ...config };

    // 更新分析器阈值
    if (config.thresholds) {
      this.analyzer.updateThresholds(config.thresholds);
    }

    // 更新上报器
    if (config.reportUrl !== undefined) {
      // 移除旧的 HTTP 上报器
      this.reporters = this.reporters.filter(r => !(r instanceof HttpReporter));

      // 添加新的 HTTP 上报器
      if (config.reportUrl) {
        this.reporters.push(new HttpReporter(config.reportUrl));
      }
    }

    // 更新控制台输出
    if (config.consoleOutput !== undefined) {
      if (config.consoleOutput) {
        // 添加控制台上报器（如果不存在）
        if (!this.reporters.some(r => r instanceof ConsoleReporter)) {
          this.reporters.push(new ConsoleReporter());
        }
      } else {
        // 移除控制台上报器
        this.reporters = this.reporters.filter(
          r => !(r instanceof ConsoleReporter),
        );
      }
    }

    // 重新启动定时上报
    if (this.reportTimer) {
      this.stopPeriodicReport();
    }

    if (!this.config.realtimeReport && this.config.reportInterval > 0) {
      this.startPeriodicReport();
    }
  }

  /**
   * 重置收集器
   */
  reset() {
    if (this.collector) {
      this.collector.reset();
    }
    this.metrics = null;
  }

  /**
   * 销毁监控服务
   */
  destroy() {
    this.stopPeriodicReport();

    if (this.collector) {
      this.collector.destroy();
      this.collector = null;
    }

    this.reporters = [];
    this.metrics = null;
    this.isInitialized = false;
  }

  /**
   * 启动定时上报
   */
  private startPeriodicReport() {
    if (this.reportTimer) {
      return;
    }

    this.reportTimer = window.setInterval(() => {
      this.collectAndReport();
    }, this.config.reportInterval);
  }

  /**
   * 停止定时上报
   */
  private stopPeriodicReport() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
  }

  /**
   * 上报性能数据
   */
  private report(event: PerformanceEvent, options?: ReportOptions) {
    const reportData = {
      ...event,
      ...(options?.customData || {}),
    };

    this.reporters.forEach(reporter => {
      try {
        reporter.report(reportData);
      } catch (error) {
        console.error('Performance reporter error:', error);
      }
    });
  }
}
