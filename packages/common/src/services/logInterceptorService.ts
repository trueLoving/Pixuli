/**
 * 日志拦截服务 - 收集所有 console 输出
 * 支持 Web 和 Native 平台
 */

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  args: any[];
  timestamp: number;
  stack?: string;
}

type LogListener = (entry: LogEntry) => void;

class LogInterceptorService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private originalConsole: {
    log?: typeof console.log;
    info?: typeof console.info;
    warn?: typeof console.warn;
    error?: typeof console.error;
    debug?: typeof console.debug;
  } = {};
  private maxLogs = 1000; // 最多保存 1000 条日志
  private isIntercepting = false;
  private logIdCounter = 0;
  private filters: Array<(entry: LogEntry) => boolean> = [];

  constructor() {
    // 保存原始的 console 方法（仅在 Web 环境）
    if (typeof console !== 'undefined') {
      this.originalConsole = {
        log: console.log?.bind(console),
        info: console.info?.bind(console),
        warn: console.warn?.bind(console),
        error: console.error?.bind(console),
        debug: console.debug?.bind(console),
      };
    }
  }

  /**
   * 开始拦截日志
   */
  start() {
    if (this.isIntercepting || typeof console === 'undefined') {
      return;
    }

    // 拦截 console.log
    if (this.originalConsole.log) {
      console.log = (...args: any[]) => {
        this.originalConsole.log!(...args);
        this.addLog('log', args);
      };
    }

    // 拦截 console.info
    if (this.originalConsole.info) {
      console.info = (...args: any[]) => {
        this.originalConsole.info!(...args);
        this.addLog('info', args);
      };
    }

    // 拦截 console.warn
    if (this.originalConsole.warn) {
      console.warn = (...args: any[]) => {
        this.originalConsole.warn!(...args);
        this.addLog('warn', args);
      };
    }

    // 拦截 console.error
    if (this.originalConsole.error) {
      console.error = (...args: any[]) => {
        this.originalConsole.error!(...args);
        this.addLog('error', args);
      };
    }

    // 拦截 console.debug
    if (this.originalConsole.debug) {
      console.debug = (...args: any[]) => {
        this.originalConsole.debug!(...args);
        this.addLog('debug', args);
      };
    }

    this.isIntercepting = true;
  }

  /**
   * 停止拦截日志
   */
  stop() {
    if (!this.isIntercepting || typeof console === 'undefined') {
      return;
    }

    // 恢复原始的 console 方法
    if (this.originalConsole.log) {
      console.log = this.originalConsole.log;
    }
    if (this.originalConsole.info) {
      console.info = this.originalConsole.info;
    }
    if (this.originalConsole.warn) {
      console.warn = this.originalConsole.warn;
    }
    if (this.originalConsole.error) {
      console.error = this.originalConsole.error;
    }
    if (this.originalConsole.debug) {
      console.debug = this.originalConsole.debug;
    }

    this.isIntercepting = false;
  }

  /**
   * 手动添加日志（用于 Native 平台）
   */
  addManualLog(level: LogLevel, message: string, args: any[] = []) {
    this.addLog(level, [message, ...args]);
  }

  /**
   * 添加日志
   */
  private addLog(level: LogLevel, args: any[]) {
    const id = `log-${++this.logIdCounter}-${Date.now()}`;
    const timestamp = Date.now();

    // 将参数转换为字符串
    const message = args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    // 获取堆栈信息（仅对 error 和 warn）
    let stack: string | undefined;
    if (level === 'error' || level === 'warn') {
      try {
        const error = new Error();
        stack = error.stack;
      } catch {
        // 忽略错误
      }
    }

    const entry: LogEntry = {
      id,
      level,
      message,
      args,
      timestamp,
      stack,
    };

    // 应用过滤规则
    if (!this.shouldLog(entry)) {
      return;
    }

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 通知监听器
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        if (this.originalConsole.error) {
          this.originalConsole.error('Log listener error:', error);
        }
      }
    });
  }

  /**
   * 判断是否应该记录该日志
   */
  private shouldLog(entry: LogEntry): boolean {
    // 所有 error 和 warn 都保留
    if (entry.level === 'error' || entry.level === 'warn') {
      return true;
    }

    // 应用自定义过滤器
    if (this.filters.length > 0) {
      return this.filters.some(filter => filter(entry));
    }

    // 默认过滤规则：只保留应用相关的日志
    const message = entry.message.toLowerCase();

    // 过滤掉第三方库和浏览器内部日志
    const excludePatterns = [
      'react-dom',
      'react devtools',
      'vite',
      'hmr',
      'hot module',
      'service worker',
      'workbox',
      'chrome-extension',
      'moz-extension',
      'safari-extension',
      'extension',
      'devtools',
      'performance monitor',
      'performance analysis',
    ];

    // 如果包含排除模式，则不记录
    if (excludePatterns.some(pattern => message.includes(pattern))) {
      return false;
    }

    // 保留应用相关的关键日志（带特定前缀或关键词）
    const includePatterns = [
      '[pwa]',
      '[offlineindicator]',
      '[backgroundsync]',
      '[pushnotification]',
      'failed to',
      'error',
      'warning',
      'initialized',
      'registered',
      'unregistered',
    ];

    // 如果是 info 或 log 级别，只保留包含特定前缀或关键词的
    if (entry.level === 'info' || entry.level === 'log') {
      return includePatterns.some(pattern => message.includes(pattern));
    }

    // debug 级别默认不记录
    if (entry.level === 'debug') {
      return false;
    }

    // 其他情况默认不记录
    return false;
  }

  /**
   * 添加日志过滤器
   */
  addFilter(filter: (entry: LogEntry) => boolean) {
    this.filters.push(filter);
  }

  /**
   * 移除日志过滤器
   */
  removeFilter(filter: (entry: LogEntry) => boolean) {
    const index = this.filters.indexOf(filter);
    if (index > -1) {
      this.filters.splice(index, 1);
    }
  }

  /**
   * 清空所有过滤器
   */
  clearFilters() {
    this.filters = [];
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取指定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  /**
   * 添加日志监听器
   */
  addListener(listener: LogListener) {
    this.listeners.add(listener);
  }

  /**
   * 移除日志监听器
   */
  removeListener(listener: LogListener) {
    this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器（用于清空等操作）
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        // 发送一个特殊事件表示清空
        listener({
          id: 'clear',
          level: 'log',
          message: '',
          args: [],
          timestamp: Date.now(),
        });
      } catch (error) {
        if (this.originalConsole.error) {
          this.originalConsole.error('Log listener error:', error);
        }
      }
    });
  }

  /**
   * 设置最大日志数量
   */
  setMaxLogs(max: number) {
    this.maxLogs = max;
    // 如果当前日志数量超过新的最大值，删除旧的日志
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
    }
  }
}

export const logInterceptorService = new LogInterceptorService();
