/**
 * 性能分析器
 */

import type { PerformanceMetrics, PerformanceAnalysis } from '../types';

interface PerformanceThresholds {
  fps: number;
  memoryUsage: number;
  longTask: number;
  pageLoadTime: number;
}

/**
 * 性能分析器
 */
export class PerformanceAnalyzer {
  private thresholds: PerformanceThresholds;

  constructor(thresholds: PerformanceThresholds) {
    this.thresholds = thresholds;
  }

  /**
   * 分析性能指标
   */
  analyze(metrics: PerformanceMetrics): PerformanceAnalysis {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 分析渲染性能
    if (metrics.render.fps < this.thresholds.fps) {
      score -= 20;
      issues.push(
        `FPS 过低: ${metrics.render.fps.toFixed(1)} (目标: ${this.thresholds.fps})`,
      );
      suggestions.push('优化渲染性能，减少不必要的重绘和重排');
    }

    if (metrics.render.longTaskCount > 0) {
      const avgLongTaskDuration =
        metrics.render.longTaskDuration / metrics.render.longTaskCount;
      if (avgLongTaskDuration > this.thresholds.longTask) {
        score -= 15;
        issues.push(
          `检测到长任务: ${avgLongTaskDuration.toFixed(2)}ms (阈值: ${this.thresholds.longTask}ms)`,
        );
        suggestions.push('拆分长任务，使用 Web Workers 处理耗时操作');
      }
    }

    // 分析加载性能
    if (metrics.load.pageLoadTime > this.thresholds.pageLoadTime) {
      score -= 20;
      issues.push(
        `页面加载时间过长: ${metrics.load.pageLoadTime.toFixed(2)}ms (目标: ${this.thresholds.pageLoadTime}ms)`,
      );
      suggestions.push('优化资源加载，使用代码分割和懒加载');
    }

    if (metrics.load.firstContentfulPaint > 1000) {
      score -= 10;
      issues.push(
        `首屏渲染时间过长: ${metrics.load.firstContentfulPaint.toFixed(2)}ms`,
      );
      suggestions.push('优化首屏渲染，减少关键资源大小');
    }

    // 分析内存使用
    if (metrics.memory.memoryUsage > this.thresholds.memoryUsage) {
      score -= 15;
      issues.push(
        `内存使用率过高: ${metrics.memory.memoryUsage.toFixed(2)}% (阈值: ${this.thresholds.memoryUsage}%)`,
      );
      suggestions.push('检查内存泄漏，及时释放不需要的对象');
    }

    // 分析网络性能
    if (metrics.network.errorCount > 0) {
      const errorRate =
        (metrics.network.errorCount / metrics.network.requestCount) * 100;
      if (errorRate > 5) {
        score -= 10;
        issues.push(`网络错误率过高: ${errorRate.toFixed(2)}%`);
        suggestions.push('检查网络请求，处理错误情况');
      }
    }

    if (metrics.network.cacheHitRate < 50) {
      score -= 5;
      issues.push(
        `缓存命中率较低: ${metrics.network.cacheHitRate.toFixed(2)}%`,
      );
      suggestions.push('优化缓存策略，提高缓存命中率');
    }

    // 分析用户交互
    if (metrics.interaction.clickResponseTime > 100) {
      score -= 5;
      issues.push(
        `点击响应时间过长: ${metrics.interaction.clickResponseTime.toFixed(2)}ms`,
      );
      suggestions.push('优化事件处理，减少主线程阻塞');
    }

    if (metrics.interaction.inputDelay > 50) {
      score -= 5;
      issues.push(
        `输入延迟过高: ${metrics.interaction.inputDelay.toFixed(2)}ms`,
      );
      suggestions.push('优化输入处理，使用防抖和节流');
    }

    // 确保分数在 0-100 范围内
    score = Math.max(0, Math.min(100, score));

    // 确定性能等级
    let level: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) {
      level = 'excellent';
    } else if (score >= 70) {
      level = 'good';
    } else if (score >= 50) {
      level = 'fair';
    } else {
      level = 'poor';
    }

    return {
      score,
      level,
      issues,
      suggestions,
      metrics,
    };
  }

  /**
   * 更新阈值
   */
  updateThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}
