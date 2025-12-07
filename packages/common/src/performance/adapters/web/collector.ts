/**
 * Web 端性能指标收集器
 */

import type {
  PerformanceMetrics,
  RenderMetrics,
  LoadMetrics,
  MemoryMetrics,
  NetworkMetrics,
  InteractionMetrics,
  PerformanceEventType,
} from '../../types';

/**
 * Web 性能指标收集器
 */
export class WebPerformanceCollector {
  private isInitialized = false;
  private longTaskObserver: PerformanceObserver | null = null;
  private paintObserver: PerformanceObserver | null = null;
  private resourceObserver: PerformanceObserver | null = null;
  private navigationObserver: PerformanceObserver | null = null;
  private longTasks: PerformanceEntry[] = [];
  private paintEntries: PerformanceEntry[] = [];
  private resourceEntries: PerformanceEntry[] = [];
  private navigationEntry: PerformanceNavigationTiming | null = null;
  private clickStartTime: number = 0;
  private scrollFrameCount: number = 0;
  private inputDelay: number = 0;
  private fpsLastTime: number = 0;
  private fpsFrameCount: number = 0;
  private currentFPS: number = 60;

  /**
   * 初始化收集器
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // 监听长任务
    if ('PerformanceObserver' in window) {
      try {
        this.longTaskObserver = new PerformanceObserver(list => {
          this.longTasks.push(...list.getEntries());
        });
        this.longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // 浏览器不支持长任务观察
      }

      // 监听绘制性能
      try {
        this.paintObserver = new PerformanceObserver(list => {
          this.paintEntries.push(...list.getEntries());
        });
        this.paintObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // 浏览器不支持绘制观察
      }

      // 监听资源加载
      try {
        this.resourceObserver = new PerformanceObserver(list => {
          this.resourceEntries.push(...list.getEntries());
        });
        this.resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        // 浏览器不支持资源观察
      }

      // 监听导航性能
      try {
        this.navigationObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            this.navigationEntry = entries[0] as PerformanceNavigationTiming;
          }
        });
        this.navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        // 浏览器不支持导航观察
      }
    }

    // 监听用户交互
    this.setupInteractionListeners();

    this.isInitialized = true;
  }

  /**
   * 收集性能指标
   */
  collect(_type: PerformanceEventType): PerformanceMetrics | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const render = this.collectRenderMetrics();
    const load = this.collectLoadMetrics();
    const memory = this.collectMemoryMetrics();
    const network = this.collectNetworkMetrics();
    const interaction = this.collectInteractionMetrics();

    return {
      render,
      load,
      memory,
      network,
      interaction,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  /**
   * 重置收集器
   */
  reset() {
    this.longTasks = [];
    this.paintEntries = [];
    this.resourceEntries = [];
    this.navigationEntry = null;
    this.scrollFrameCount = 0;
    this.inputDelay = 0;
  }

  /**
   * 销毁收集器
   */
  destroy() {
    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
      this.longTaskObserver = null;
    }

    if (this.paintObserver) {
      this.paintObserver.disconnect();
      this.paintObserver = null;
    }

    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
      this.resourceObserver = null;
    }

    if (this.navigationObserver) {
      this.navigationObserver.disconnect();
      this.navigationObserver = null;
    }

    this.isInitialized = false;
  }

  /**
   * 收集渲染性能指标
   */
  private collectRenderMetrics(): RenderMetrics {
    // 计算 FPS
    const fps = this.calculateFPS();

    // 计算帧时间
    const frameTime = fps > 0 ? 1000 / fps : 0;

    // 长任务统计
    const longTaskCount = this.longTasks.length;
    const longTaskDuration = this.longTasks.reduce(
      (sum, task) => sum + (task.duration || 0),
      0,
    );

    // 重绘和重排次数（简化实现，实际需要更复杂的检测）
    const repaintCount = this.paintEntries.filter(
      e => e.name === 'first-contentful-paint' || e.name === 'paint',
    ).length;
    const reflowCount = 0; // 重排检测需要 MutationObserver，这里简化

    return {
      fps,
      frameTime,
      repaintCount,
      reflowCount,
      longTaskCount,
      longTaskDuration,
    };
  }

  /**
   * 收集加载性能指标
   */
  private collectLoadMetrics(): LoadMetrics {
    if (!this.navigationEntry) {
      // 尝试从 performance.timing 获取（兼容旧浏览器）
      const timing = performance.timing;
      if (timing) {
        return {
          pageLoadTime: timing.loadEventEnd - timing.navigationStart,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          domReadyTime:
            timing.domContentLoadedEventEnd - timing.navigationStart,
          resourceLoadTime:
            timing.loadEventEnd - timing.domContentLoadedEventEnd,
          dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
          tcpTime: timing.connectEnd - timing.connectStart,
          sslTime: timing.secureConnectionStart
            ? timing.connectEnd - timing.secureConnectionStart
            : 0,
          ttfb: timing.responseStart - timing.navigationStart,
        };
      }

      return this.getDefaultLoadMetrics();
    }

    const nav = this.navigationEntry;

    // 获取 FCP
    const fcpEntry = this.paintEntries.find(
      e => e.name === 'first-contentful-paint',
    );
    const firstContentfulPaint = fcpEntry
      ? (fcpEntry as PerformancePaintTiming).startTime
      : 0;

    // 获取 LCP（需要从 PerformanceObserver 获取，这里简化）
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const largestContentfulPaint =
      lcpEntries.length > 0
        ? (lcpEntries[lcpEntries.length - 1] as PerformancePaintTiming)
            .startTime || 0
        : 0;

    return {
      pageLoadTime: nav.loadEventEnd - nav.fetchStart,
      firstContentfulPaint,
      largestContentfulPaint,
      domReadyTime: nav.domContentLoadedEventEnd - nav.fetchStart,
      resourceLoadTime: nav.loadEventEnd - nav.domContentLoadedEventEnd,
      dnsTime: nav.domainLookupEnd - nav.domainLookupStart,
      tcpTime: nav.connectEnd - nav.connectStart,
      sslTime: nav.secureConnectionStart
        ? nav.connectEnd - nav.secureConnectionStart
        : 0,
      ttfb: nav.responseStart - nav.fetchStart,
    };
  }

  /**
   * 收集内存使用指标
   */
  private collectMemoryMetrics(): MemoryMetrics {
    if (
      typeof performance !== 'undefined' &&
      'memory' in performance &&
      (performance as any).memory
    ) {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize / (1024 * 1024); // MB
      const totalJSHeapSize = memory.totalJSHeapSize / (1024 * 1024); // MB
      const jsHeapSizeLimit = memory.jsHeapSizeLimit / (1024 * 1024); // MB
      const memoryUsage = (usedJSHeapSize / jsHeapSizeLimit) * 100;

      return {
        usedJSHeapSize,
        totalJSHeapSize,
        jsHeapSizeLimit,
        memoryUsage,
      };
    }

    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      memoryUsage: 0,
    };
  }

  /**
   * 收集网络性能指标
   */
  private collectNetworkMetrics(): NetworkMetrics {
    const resources = this.resourceEntries.length
      ? this.resourceEntries
      : performance.getEntriesByType('resource');

    const requestCount = resources.length;
    let successCount = 0;
    let errorCount = 0;
    let totalRequestTime = 0;
    let totalTransferSize = 0;
    let cacheHitCount = 0;

    resources.forEach((resource: any) => {
      const duration = resource.duration || 0;
      const transferSize = resource.transferSize || 0;
      const decodedBodySize = resource.decodedBodySize || 0;

      if (duration > 0) {
        totalRequestTime += duration;
        successCount++;
      } else {
        errorCount++;
      }

      totalTransferSize += transferSize / 1024; // KB

      // 缓存命中判断（简化）
      if (transferSize === 0 && decodedBodySize > 0) {
        cacheHitCount++;
      }
    });

    const averageRequestTime =
      requestCount > 0 ? totalRequestTime / requestCount : 0;
    const cacheHitRate =
      requestCount > 0 ? (cacheHitCount / requestCount) * 100 : 0;

    return {
      requestCount,
      successCount,
      errorCount,
      averageRequestTime,
      totalTransferSize,
      cacheHitCount,
      cacheHitRate,
    };
  }

  /**
   * 收集用户交互指标
   */
  private collectInteractionMetrics(): InteractionMetrics {
    return {
      clickResponseTime: this.clickStartTime,
      scrollFps: this.calculateScrollFPS(),
      inputDelay: this.inputDelay,
    };
  }

  /**
   * 设置交互监听器
   */
  private setupInteractionListeners() {
    // 点击响应时间
    document.addEventListener('click', () => {
      const startTime = performance.now();
      requestAnimationFrame(() => {
        this.clickStartTime = performance.now() - startTime;
      });
    });

    // 滚动 FPS
    let scrollFrameCount = 0;
    let scrollLastTime = performance.now();

    const onScroll = () => {
      scrollFrameCount++;
      const now = performance.now();
      if (now - scrollLastTime >= 1000) {
        this.scrollFrameCount = scrollFrameCount;
        scrollFrameCount = 0;
        scrollLastTime = now;
      }
    };

    document.addEventListener('scroll', onScroll, { passive: true });

    // 输入延迟
    document.addEventListener('input', () => {
      const startTime = performance.now();
      requestAnimationFrame(() => {
        this.inputDelay = performance.now() - startTime;
      });
    });
  }

  /**
   * 计算 FPS
   */
  private calculateFPS(): number {
    if (typeof window === 'undefined') {
      return 60;
    }

    const now = performance.now();

    if (this.fpsLastTime === 0) {
      this.fpsLastTime = now;
      this.fpsFrameCount = 0;

      // 启动 FPS 计算循环
      const countFrame = () => {
        this.fpsFrameCount++;
        const currentTime = performance.now();

        if (currentTime >= this.fpsLastTime + 1000) {
          this.currentFPS = Math.round(
            (this.fpsFrameCount * 1000) / (currentTime - this.fpsLastTime),
          );
          this.fpsFrameCount = 0;
          this.fpsLastTime = currentTime;
        }

        requestAnimationFrame(countFrame);
      };

      requestAnimationFrame(countFrame);
    }

    return this.currentFPS;
  }

  /**
   * 计算滚动 FPS
   */
  private calculateScrollFPS(): number {
    return this.scrollFrameCount;
  }

  /**
   * 获取默认加载指标
   */
  private getDefaultLoadMetrics(): LoadMetrics {
    return {
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      domReadyTime: 0,
      resourceLoadTime: 0,
      dnsTime: 0,
      tcpTime: 0,
      sslTime: 0,
      ttfb: 0,
    };
  }
}
