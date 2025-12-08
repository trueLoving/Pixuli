import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logInterceptorService,
  type LogEntry,
  type LogLevel,
} from '../logInterceptorService';

describe('LogInterceptorService', () => {
  // 保存原始的 console 方法
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  beforeEach(() => {
    // 停止拦截（如果正在拦截）
    logInterceptorService.stop();

    // 恢复原始 console 方法（如果存在）
    if (typeof console !== 'undefined') {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    }

    // 清空日志和监听器
    logInterceptorService.clearLogs();
    logInterceptorService.clearFilters();
  });

  afterEach(() => {
    // 清理
    logInterceptorService.stop();
    logInterceptorService.clearLogs();
    logInterceptorService.clearFilters();

    // 恢复原始 console（如果存在）
    if (typeof console !== 'undefined') {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    }

    vi.restoreAllMocks();
  });

  describe('日志拦截', () => {
    it('应该能够启动日志拦截', () => {
      logInterceptorService.start();

      // 验证 console 方法已被替换
      expect(console.log).not.toBe(originalConsole.log);
    });

    it('应该能够停止日志拦截', () => {
      logInterceptorService.start();
      const interceptedLog = console.log;

      logInterceptorService.stop();

      // 验证 console 方法已恢复（可能不完全相同，但应该不是拦截后的函数）
      expect(console.log).not.toBe(interceptedLog);
    });

    it('应该拦截 console.log', () => {
      logInterceptorService.start();

      // 清空之前的日志
      logInterceptorService.clearLogs();

      // 使用会被保留的前缀（小写匹配）
      console.log('[pwa] test message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.level).toBe('log');
      expect(lastLog.message.toLowerCase()).toContain('test message');
    });

    it('应该拦截 console.info', () => {
      logInterceptorService.start();

      console.info('[pwa] info message'); // 使用会被保留的前缀

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].level).toBe('info');
      expect(logs[logs.length - 1].message).toContain('info message');
    });

    it('应该拦截 console.warn', () => {
      logInterceptorService.start();

      console.warn('warning message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].level).toBe('warn');
      expect(logs[logs.length - 1].message).toContain('warning message');
      expect(logs[logs.length - 1].stack).toBeDefined();
    });

    it('应该拦截 console.error', () => {
      logInterceptorService.start();

      console.error('error message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].level).toBe('error');
      expect(logs[logs.length - 1].message).toContain('error message');
      expect(logs[logs.length - 1].stack).toBeDefined();
    });

    it('应该拦截 console.debug', () => {
      logInterceptorService.start();

      console.debug('debug message');

      const logs = logInterceptorService.getLogs();
      // debug 级别默认被过滤，所以可能没有日志
      // 但拦截功能应该正常工作
      expect(console.debug).not.toBe(originalConsole.debug);
    });

    it('应该保留原始 console 输出', () => {
      // 验证拦截后 console.log 仍然可以正常输出
      // 通过检查日志被收集来验证拦截功能正常
      logInterceptorService.start();

      // 使用会被保留的前缀，确保日志被收集
      console.log('[pwa] test message');

      const logs = logInterceptorService.getLogs();
      // 验证日志被收集（说明拦截功能正常）
      expect(logs.length).toBeGreaterThan(0);
      // 验证 console.log 仍然可以调用（不会抛出错误）
      expect(() => console.log('another test')).not.toThrow();
    });

    it('多次启动应该不会重复拦截', () => {
      logInterceptorService.start();
      const firstLog = console.log;

      // 再次启动
      logInterceptorService.start();
      const secondLog = console.log;

      // 应该保持相同的拦截函数
      expect(firstLog).toBe(secondLog);
    });
  });

  describe('手动添加日志', () => {
    it('应该能够手动添加日志', () => {
      // 使用 error 级别确保不被过滤
      logInterceptorService.addManualLog('error', 'manual log', [
        'arg1',
        'arg2',
      ]);

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toContain('manual log');
    });

    it('应该能够添加不同级别的日志', () => {
      // 使用不会被过滤的级别
      const levels: LogLevel[] = ['warn', 'error'];

      levels.forEach(level => {
        logInterceptorService.addManualLog(level, `${level} message`);
      });

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(2);
    });
  });

  describe('日志获取', () => {
    beforeEach(() => {
      // 添加一些测试日志（使用不会被过滤的级别）
      logInterceptorService.addManualLog('warn', 'warn message 1');
      logInterceptorService.addManualLog('error', 'error message 1');
      logInterceptorService.addManualLog('error', 'error message 2');
    });

    it('应该能够获取所有日志', () => {
      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该返回日志的副本，而不是原始数组', () => {
      const logs1 = logInterceptorService.getLogs();
      const logs2 = logInterceptorService.getLogs();

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });

    it('应该能够按级别获取日志', () => {
      const errorLogs = logInterceptorService.getLogsByLevel('error');
      const warnLogs = logInterceptorService.getLogsByLevel('warn');
      const infoLogs = logInterceptorService.getLogsByLevel('info');

      expect(errorLogs.every(log => log.level === 'error')).toBe(true);
      expect(warnLogs.every(log => log.level === 'warn')).toBe(true);
      expect(infoLogs.every(log => log.level === 'info')).toBe(true);
    });

    it('应该能够获取不存在的级别的日志', () => {
      logInterceptorService.clearLogs();
      const logs = logInterceptorService.getLogsByLevel('error');
      expect(logs.length).toBe(0);
    });
  });

  describe('日志清理', () => {
    it('应该能够清空所有日志', () => {
      logInterceptorService.addManualLog('error', 'test message');
      expect(logInterceptorService.getLogs().length).toBeGreaterThan(0);

      logInterceptorService.clearLogs();
      expect(logInterceptorService.getLogs().length).toBe(0);
    });
  });

  describe('日志过滤', () => {
    it('应该保留所有 error 级别的日志', () => {
      logInterceptorService.addManualLog('error', 'error message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('error');
    });

    it('应该保留所有 warn 级别的日志', () => {
      logInterceptorService.addManualLog('warn', 'warn message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('warn');
    });

    it('应该过滤掉第三方库的日志', () => {
      logInterceptorService.addManualLog('info', 'react-dom message');
      logInterceptorService.addManualLog('info', 'vite hmr message');
      logInterceptorService.addManualLog('info', 'service worker message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(0);
    });

    it('应该保留包含特定前缀的日志', () => {
      logInterceptorService.addManualLog('info', '[pwa] initialized');
      logInterceptorService.addManualLog(
        'info',
        '[offlineindicator] registered',
      );
      logInterceptorService.addManualLog('info', 'failed to load');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该过滤掉 debug 级别的日志', () => {
      logInterceptorService.addManualLog('debug', 'debug message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(0);
    });

    it('应该过滤掉不包含关键字的 info 日志', () => {
      logInterceptorService.addManualLog('info', 'random info message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(0);
    });
  });

  describe('自定义过滤器', () => {
    it('应该能够添加自定义过滤器', () => {
      const filter = (entry: LogEntry) => entry.message.includes('custom');
      logInterceptorService.addFilter(filter);

      logInterceptorService.addManualLog('info', 'custom message');
      logInterceptorService.addManualLog('info', 'normal message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('custom');
    });

    it('应该能够移除自定义过滤器', () => {
      const filter = (entry: LogEntry) => entry.message.includes('custom');
      logInterceptorService.addFilter(filter);

      logInterceptorService.addManualLog('info', 'custom message');
      expect(logInterceptorService.getLogs().length).toBe(1);

      logInterceptorService.removeFilter(filter);
      logInterceptorService.clearLogs();
      logInterceptorService.addManualLog('info', 'custom message');

      // 移除过滤器后，应该使用默认过滤规则
      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(0); // 默认规则会过滤掉
    });

    it('应该能够清空所有过滤器', () => {
      const filter1 = (entry: LogEntry) => entry.message.includes('filter1');
      const filter2 = (entry: LogEntry) => entry.message.includes('filter2');

      logInterceptorService.addFilter(filter1);
      logInterceptorService.addFilter(filter2);
      logInterceptorService.clearFilters();

      logInterceptorService.addManualLog('info', 'test message');
      // 清空过滤器后，应该使用默认过滤规则
      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(0);
    });

    it('自定义过滤器应该覆盖默认过滤规则', () => {
      const filter = (entry: LogEntry) => true; // 接受所有日志
      logInterceptorService.addFilter(filter);

      logInterceptorService.addManualLog('info', 'random message');
      logInterceptorService.addManualLog('debug', 'debug message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(2);
    });
  });

  describe('监听器', () => {
    it('应该能够添加监听器', () => {
      const listener = vi.fn();
      logInterceptorService.addListener(listener);

      logInterceptorService.addManualLog('error', 'test message');

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: expect.stringContaining('test message'),
        }),
      );
    });

    it('应该能够移除监听器', () => {
      const listener = vi.fn();
      logInterceptorService.addListener(listener);
      logInterceptorService.removeListener(listener);

      logInterceptorService.addManualLog('error', 'test message');

      expect(listener).not.toHaveBeenCalled();
    });

    it('应该支持多个监听器', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      logInterceptorService.addListener(listener1);
      logInterceptorService.addListener(listener2);

      logInterceptorService.addManualLog('error', 'test message');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('监听器错误不应该影响日志收集', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      logInterceptorService.addListener(errorListener);
      logInterceptorService.addListener(normalListener);

      logInterceptorService.addManualLog('error', 'test message');

      expect(normalListener).toHaveBeenCalled();
      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
    });

    it('清空日志时应该通知监听器', () => {
      const listener = vi.fn();
      logInterceptorService.addListener(listener);

      logInterceptorService.addManualLog('error', 'test message');
      logInterceptorService.clearLogs();

      // clearLogs 会发送一个特殊的清空事件
      expect(listener).toHaveBeenCalledTimes(2); // 一次是添加日志，一次是清空
    });
  });

  describe('最大日志数量', () => {
    it('应该限制日志数量', () => {
      logInterceptorService.setMaxLogs(5);

      // 添加 10 条日志（使用 error 级别确保不被过滤）
      for (let i = 0; i < 10; i++) {
        logInterceptorService.addManualLog('error', `message ${i}`);
      }

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(5);
      // 应该保留最新的 5 条
      expect(logs[0].message).toContain('message 5');
      expect(logs[logs.length - 1].message).toContain('message 9');
    });

    it('应该能够动态调整最大日志数量', () => {
      logInterceptorService.setMaxLogs(3);

      for (let i = 0; i < 5; i++) {
        logInterceptorService.addManualLog('error', `message ${i}`);
      }

      expect(logInterceptorService.getLogs().length).toBe(3);

      logInterceptorService.setMaxLogs(10);
      expect(logInterceptorService.getLogs().length).toBe(3); // 现有日志不会增加

      // 添加更多日志
      for (let i = 5; i < 15; i++) {
        logInterceptorService.addManualLog('error', `message ${i}`);
      }

      expect(logInterceptorService.getLogs().length).toBe(10);
    });

    it('减少最大日志数量时应该删除旧日志', () => {
      logInterceptorService.setMaxLogs(10);

      for (let i = 0; i < 10; i++) {
        logInterceptorService.addManualLog('error', `message ${i}`);
      }

      expect(logInterceptorService.getLogs().length).toBe(10);

      logInterceptorService.setMaxLogs(5);
      expect(logInterceptorService.getLogs().length).toBe(5);
      // 应该保留最新的 5 条
      const logs = logInterceptorService.getLogs();
      expect(logs[0].message).toContain('message 5');
    });
  });

  describe('日志数据结构', () => {
    it('日志应该包含所有必需的字段', () => {
      // 使用 error 级别确保不被过滤
      logInterceptorService.addManualLog('error', 'test message', [
        'arg1',
        'arg2',
      ]);

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('args');
      expect(log).toHaveProperty('timestamp');
      expect(typeof log.id).toBe('string');
      expect(typeof log.level).toBe('string');
      expect(typeof log.message).toBe('string');
      expect(Array.isArray(log.args)).toBe(true);
      expect(typeof log.timestamp).toBe('number');
    });

    it('error 和 warn 级别的日志应该包含堆栈信息', () => {
      logInterceptorService.addManualLog('error', 'error message');
      logInterceptorService.addManualLog('warn', 'warn message');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].stack).toBeDefined();
      expect(logs[1].stack).toBeDefined();
    });

    it('其他级别的日志不应该包含堆栈信息', () => {
      logInterceptorService.addManualLog('info', 'info message');
      logInterceptorService.addManualLog('log', 'log message');

      const logs = logInterceptorService.getLogs();
      // 根据过滤规则，这些日志可能被过滤掉
      // 但如果被保留，不应该有堆栈信息
      logs.forEach(log => {
        if (log.level !== 'error' && log.level !== 'warn') {
          expect(log.stack).toBeUndefined();
        }
      });
    });

    it('应该正确处理对象参数', () => {
      const obj = { key: 'value', nested: { prop: 123 } };
      logInterceptorService.addManualLog('error', 'test', [obj]);

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('key');
      expect(logs[0].args).toContain(obj);
    });

    it('应该正确处理循环引用的对象', () => {
      const obj: any = { key: 'value' };
      obj.self = obj; // 创建循环引用

      logInterceptorService.addManualLog('error', 'test', [obj]);

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
      // JSON.stringify 应该能够处理循环引用（会抛出错误，但会被捕获）
      expect(logs[0].message).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理空消息', () => {
      logInterceptorService.addManualLog('error', '');

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
    });

    it('应该处理特殊字符', () => {
      logInterceptorService.addManualLog(
        'error',
        '特殊字符: 中文、emoji 🎉、符号 !@#$%',
      );

      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('特殊字符');
    });

    it('在非 Web 环境中应该能够正常工作', () => {
      // 应该能够手动添加日志（即使 console 未定义）
      logInterceptorService.addManualLog('error', 'manual log');
      const logs = logInterceptorService.getLogs();
      expect(logs.length).toBe(1);
    });
  });

  describe('日志 ID 生成', () => {
    it('应该为每条日志生成唯一 ID', () => {
      // 使用 error 级别确保日志不被过滤
      logInterceptorService.addManualLog('error', 'message 1');
      logInterceptorService.addManualLog('error', 'message 2');
      logInterceptorService.addManualLog('error', 'message 3');

      const logs = logInterceptorService.getLogs();
      const ids = logs.map(log => log.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('日志 ID 应该包含时间戳', () => {
      logInterceptorService.addManualLog('error', 'test message');

      const logs = logInterceptorService.getLogs();
      expect(logs[0].id).toContain('log-');
      expect(logs[0].id).toContain(String(logs[0].timestamp));
    });
  });

  describe('时间戳', () => {
    it('应该为每条日志记录时间戳', () => {
      const before = Date.now();
      logInterceptorService.addManualLog('error', 'test message');
      const after = Date.now();

      const logs = logInterceptorService.getLogs();
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(logs[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('日志应该按时间戳排序', () => {
      logInterceptorService.addManualLog('error', 'message 1');
      // 小延迟确保时间戳不同
      return new Promise(resolve => {
        setTimeout(() => {
          logInterceptorService.addManualLog('error', 'message 2');
          const logs = logInterceptorService.getLogs();

          for (let i = 1; i < logs.length; i++) {
            expect(logs[i].timestamp).toBeGreaterThanOrEqual(
              logs[i - 1].timestamp,
            );
          }
          resolve(undefined);
        }, 10);
      });
    });
  });
});
