/**
 * DevTools 调试工具组件
 * 包括日志查看和性能监控
 * 支持 Web 平台
 */

import { Bug, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  logInterceptorService,
  type LogEntry,
  type LogLevel,
} from '../../../../services/logInterceptorService';
import type {
  PerformanceMonitor,
  PerformanceAnalysis,
} from '../../../../performance';
import { defaultTranslate } from '../../../../locales';
import './DevTools.css';

export interface DevToolsProps {
  /** 性能监控实例 */
  performanceMonitor?: PerformanceMonitor | null;
  /** 是否默认打开 */
  defaultOpen?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 翻译函数 */
  t?: (key: string) => string;
}

interface PerformanceMetricsDisplay {
  fps?: number;
  memoryUsage?: number;
  pageLoadTime?: number;
  renderTime?: number;
  longTasks?: number;
}

export function DevTools({
  performanceMonitor,
  defaultOpen = false,
  className,
  t,
}: DevToolsProps) {
  const translate = t || defaultTranslate;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<'logs' | 'performance'>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetricsDisplay>({});
  const [performanceAnalysis, setPerformanceAnalysis] =
    useState<PerformanceAnalysis | null>(null);
  const [logFilter, setLogFilter] = useState<LogLevel | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const metricsIntervalRef = useRef<number | null>(null);

  // 拖动相关状态
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // 初始化日志拦截
  useEffect(() => {
    // 配置日志过滤：只保留必要的日志
    logInterceptorService.clearFilters();
    logInterceptorService.start();
    setLogs(logInterceptorService.getLogs());

    // 监听新日志
    const handleNewLog = (entry: LogEntry) => {
      if (entry.id === 'clear') {
        setLogs([]);
      } else {
        setLogs(logInterceptorService.getLogs());
      }
    };

    logInterceptorService.addListener(handleNewLog);

    return () => {
      logInterceptorService.removeListener(handleNewLog);
      logInterceptorService.clearFilters();
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && isOpen && activeTab === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isOpen, activeTab]);

  // 更新性能指标
  useEffect(() => {
    if (isOpen && activeTab === 'performance' && performanceMonitor) {
      const updateMetrics = () => {
        const metrics = performanceMonitor.getMetrics();
        if (metrics) {
          setPerformanceMetrics({
            fps: metrics.render?.fps,
            memoryUsage: metrics.memory?.usedJSHeapSize,
            pageLoadTime: metrics.load?.pageLoadTime,
            renderTime: metrics.render?.frameTime,
            longTasks: metrics.render?.longTaskCount,
          });
        }
      };

      // 立即更新一次
      updateMetrics();

      // 每 1 秒更新一次
      metricsIntervalRef.current = window.setInterval(updateMetrics, 1000);

      return () => {
        if (metricsIntervalRef.current) {
          clearInterval(metricsIntervalRef.current);
        }
      };
    } else {
      // 当切换到其他标签页时，清除定时器
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
    }
  }, [isOpen, activeTab, performanceMonitor]);

  // 拖动处理 - 只允许沿着右侧边拖动（垂直方向）
  useEffect(() => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      // 只在点击按钮本身时开始拖动
      if (
        e.target === button ||
        (e.target as HTMLElement).closest('.devtools-float-button')
      ) {
        setIsDragging(true);
        hasMoved.current = false;
        dragStartPos.current = {
          x: e.clientX - buttonPosition.x,
          y: e.clientY - buttonPosition.y,
        };
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // 只允许垂直方向拖动，X 坐标固定为初始值（右侧边）
      const initialX = buttonPosition.x; // 保持 X 坐标不变
      const newY = e.clientY - dragStartPos.current.y;

      // 检查是否移动了足够距离（避免轻微移动触发拖动）
      const deltaY = Math.abs(newY - buttonPosition.y);
      if (deltaY > 5) {
        hasMoved.current = true;
      }

      // 限制 Y 坐标在视口内，X 坐标保持固定
      const maxY = window.innerHeight - button.offsetHeight;

      setButtonPosition({
        x: initialX, // X 坐标固定
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    button.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      button.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, buttonPosition]);

  // 过滤日志
  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') {
      return logs;
    }
    return logs.filter(log => log.level === logFilter);
  }, [logs, logFilter]);

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  // 获取日志级别样式
  const getLogLevelClass = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'devtools-log-error';
      case 'warn':
        return 'devtools-log-warn';
      case 'info':
        return 'devtools-log-info';
      case 'debug':
        return 'devtools-log-debug';
      default:
        return 'devtools-log-default';
    }
  };

  // 获取日志级别颜色
  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return '#ef4444';
      case 'warn':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      case 'debug':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  // 清空日志
  const handleClearLogs = () => {
    logInterceptorService.clearLogs();
  };

  // 导出日志
  const handleExportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devtools-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 格式化内存大小
  const formatMemory = (bytes?: number) => {
    if (bytes === undefined) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 格式化时间
  const formatTime = (ms?: number) => {
    if (ms === undefined) return 'N/A';
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  return (
    <>
      {/* 浮球按钮 */}
      <button
        ref={buttonRef}
        className={`devtools-float-button ${className || ''} ${isDragging ? 'dragging' : ''}`}
        onClick={() => {
          // 如果移动了，不触发点击（拖动完成）
          if (!hasMoved.current) {
            setIsOpen(!isOpen);
          }
          hasMoved.current = false;
        }}
        style={{
          right: `${buttonPosition.x}px`,
          bottom: `${buttonPosition.y}px`,
        }}
        aria-label={translate('devtools.open')}
        title={translate('devtools.title')}
      >
        <Bug size={20} />
      </button>

      {/* 面板 */}
      {isOpen && (
        <div ref={panelRef} className="devtools-panel">
          {/* 头部 */}
          <div className="devtools-header">
            <div className="devtools-title">{translate('devtools.title')}</div>
            <div className="devtools-header-actions">
              <button
                className="devtools-icon-button devtools-close-button"
                onClick={() => setIsOpen(false)}
                aria-label={translate('devtools.close')}
                title={translate('devtools.close')}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 标签页 */}
          <div className="devtools-tabs">
            <button
              className={`devtools-tab ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              {translate('devtools.tabs.logs')}
              {logs.length > 0 && (
                <span className="devtools-tab-badge">{logs.length}</span>
              )}
            </button>
            <button
              className={`devtools-tab ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
              disabled={!performanceMonitor}
            >
              {translate('devtools.tabs.performance')}
            </button>
          </div>

          {/* 内容区域 */}
          <div className="devtools-content">
            {activeTab === 'logs' && (
              <div className="devtools-logs-container">
                {/* 日志工具栏 */}
                <div className="devtools-logs-toolbar">
                  <div className="devtools-filter-group">
                    <label>{translate('devtools.logs.filter')}:</label>
                    <select
                      value={logFilter}
                      onChange={e =>
                        setLogFilter(e.target.value as LogLevel | 'all')
                      }
                      className="devtools-select"
                    >
                      <option value="all">
                        {translate('devtools.logs.filterAll')}
                      </option>
                      <option value="log">
                        {translate('devtools.logs.filterLog')}
                      </option>
                      <option value="info">
                        {translate('devtools.logs.filterInfo')}
                      </option>
                      <option value="warn">
                        {translate('devtools.logs.filterWarn')}
                      </option>
                      <option value="error">
                        {translate('devtools.logs.filterError')}
                      </option>
                      <option value="debug">
                        {translate('devtools.logs.filterDebug')}
                      </option>
                    </select>
                  </div>
                  <div className="devtools-filter-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={e => setAutoScroll(e.target.checked)}
                      />
                      {translate('devtools.logs.autoScroll')}
                    </label>
                  </div>
                  <div className="devtools-toolbar-actions">
                    <button
                      className="devtools-button"
                      onClick={handleClearLogs}
                    >
                      {translate('devtools.logs.clear')}
                    </button>
                    <button
                      className="devtools-button"
                      onClick={handleExportLogs}
                    >
                      {translate('devtools.logs.export')}
                    </button>
                  </div>
                </div>

                {/* 日志列表 */}
                <div className="devtools-logs-list">
                  {filteredLogs.length === 0 ? (
                    <div className="devtools-empty">
                      {translate('devtools.logs.empty')}
                    </div>
                  ) : (
                    filteredLogs.map(log => (
                      <div
                        key={log.id}
                        className={`devtools-log-item ${getLogLevelClass(log.level)}`}
                      >
                        <div className="devtools-log-header">
                          <span
                            className="devtools-log-level"
                            style={{ color: getLogLevelColor(log.level) }}
                          >
                            {log.level.toUpperCase()}
                          </span>
                          <span className="devtools-log-time">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <div className="devtools-log-message">
                          {log.message}
                        </div>
                        {log.stack && (
                          <details className="devtools-log-stack">
                            <summary>
                              {translate('devtools.logs.stackInfo')}
                            </summary>
                            <pre>{log.stack}</pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}

            {activeTab === 'performance' && performanceMonitor && (
              <div className="devtools-performance-container">
                <div className="devtools-metrics-grid">
                  <div className="devtools-metric-card">
                    <div className="devtools-metric-label">
                      {translate('devtools.performance.fps')}
                    </div>
                    <div className="devtools-metric-value">
                      {performanceMetrics.fps?.toFixed(1) ?? 'N/A'}
                    </div>
                  </div>
                  <div className="devtools-metric-card">
                    <div className="devtools-metric-label">
                      {translate('devtools.performance.memoryUsage')}
                    </div>
                    <div className="devtools-metric-value">
                      {formatMemory(performanceMetrics.memoryUsage)}
                    </div>
                  </div>
                  <div className="devtools-metric-card">
                    <div className="devtools-metric-label">
                      {translate('devtools.performance.pageLoadTime')}
                    </div>
                    <div className="devtools-metric-value">
                      {formatTime(performanceMetrics.pageLoadTime)}
                    </div>
                  </div>
                  <div className="devtools-metric-card">
                    <div className="devtools-metric-label">
                      {translate('devtools.performance.renderTime')}
                    </div>
                    <div className="devtools-metric-value">
                      {formatTime(performanceMetrics.renderTime)}
                    </div>
                  </div>
                  <div className="devtools-metric-card">
                    <div className="devtools-metric-label">
                      {translate('devtools.performance.longTasks')}
                    </div>
                    <div className="devtools-metric-value">
                      {performanceMetrics.longTasks ?? 'N/A'}
                    </div>
                  </div>
                </div>

                {/* 性能分析 */}
                <div className="devtools-performance-actions">
                  <button
                    className="devtools-button"
                    onClick={() => {
                      const analysis = performanceMonitor.analyze();
                      if (analysis) {
                        setPerformanceAnalysis(analysis);
                      }
                    }}
                  >
                    {translate('devtools.performance.runAnalysis')}
                  </button>
                  <button
                    className="devtools-button"
                    onClick={() => {
                      performanceMonitor.collectAndReport();
                    }}
                  >
                    {translate('devtools.performance.collectMetrics')}
                  </button>
                </div>

                {/* 性能分析结果 */}
                {performanceAnalysis && (
                  <div className="devtools-analysis-container">
                    <div className="devtools-analysis-header">
                      <h3 className="devtools-analysis-title">
                        {translate('devtools.performance.analysis.title')}
                      </h3>
                      <button
                        className="devtools-icon-button"
                        onClick={() => setPerformanceAnalysis(null)}
                        aria-label={translate('devtools.close')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="devtools-analysis-content">
                      <div className="devtools-analysis-score">
                        <div className="devtools-analysis-score-label">
                          {translate('devtools.performance.analysis.score')}
                        </div>
                        <div className="devtools-analysis-score-value">
                          {performanceAnalysis.score}
                          <span className="devtools-analysis-score-unit">
                            /100
                          </span>
                        </div>
                        <div
                          className={`devtools-analysis-level devtools-analysis-level-${performanceAnalysis.level}`}
                        >
                          {translate(
                            `devtools.performance.analysis.${performanceAnalysis.level}`,
                          )}
                        </div>
                      </div>

                      {performanceAnalysis.issues.length > 0 && (
                        <div className="devtools-analysis-section">
                          <div className="devtools-analysis-section-title">
                            {translate('devtools.performance.analysis.issues')}
                          </div>
                          <ul className="devtools-analysis-list">
                            {performanceAnalysis.issues.map((issue, index) => (
                              <li
                                key={index}
                                className="devtools-analysis-item devtools-analysis-issue"
                              >
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {performanceAnalysis.suggestions.length > 0 && (
                        <div className="devtools-analysis-section">
                          <div className="devtools-analysis-section-title">
                            {translate(
                              'devtools.performance.analysis.suggestions',
                            )}
                          </div>
                          <ul className="devtools-analysis-list">
                            {performanceAnalysis.suggestions.map(
                              (suggestion, index) => (
                                <li
                                  key={index}
                                  className="devtools-analysis-item devtools-analysis-suggestion"
                                >
                                  {suggestion}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                      {performanceAnalysis.issues.length === 0 &&
                        performanceAnalysis.suggestions.length === 0 && (
                          <div className="devtools-analysis-empty">
                            <div>
                              {translate(
                                'devtools.performance.analysis.noIssues',
                              )}
                            </div>
                            <div>
                              {translate(
                                'devtools.performance.analysis.noSuggestions',
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'performance' && !performanceMonitor && (
              <div className="devtools-empty">
                {translate('devtools.performance.notInitialized')}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
