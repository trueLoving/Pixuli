import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDateTime,
  formatDate,
  formatDateTimeFull,
  formatDateTimeShort,
  formatRelativeTime,
} from '../dateUtils';

describe('dateUtils', () => {
  beforeEach(() => {
    // 使用固定的当前时间进行测试
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDateTime', () => {
    it('应该格式化包含时间的日期时间字符串', () => {
      const dateString = '2025-01-10T08:30:00.000Z';
      const result = formatDateTime(dateString);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('应该格式化包含秒的日期时间字符串', () => {
      const dateString = '2025-01-10T08:30:45.000Z';
      const result = formatDateTime(dateString, { includeSeconds: true });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result).toContain(':45');
    });

    it('应该格式化只包含日期的字符串', () => {
      const dateString = '2025-01-10T08:30:00.000Z';
      const result = formatDateTime(dateString, { includeTime: false });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('应该处理无效的日期字符串', () => {
      const invalidDate = 'invalid-date';
      const result = formatDateTime(invalidDate);
      expect(result).toBe(invalidDate);
    });

    it('应该使用指定的语言环境', () => {
      const dateString = '2025-01-10T08:30:00.000Z';
      const result = formatDateTime(dateString, {
        includeTime: false,
        locale: 'en-US',
      });
      expect(result).toBeTruthy();
    });
  });

  describe('formatDate', () => {
    it('应该格式化日期为简短格式', () => {
      const dateString = '2025-01-10T08:30:00.000Z';
      const result = formatDate(dateString);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('应该使用指定的语言环境', () => {
      const dateString = '2025-01-10T08:30:00.000Z';
      const result = formatDate(dateString, 'en-US');
      expect(result).toBeTruthy();
    });
  });

  describe('formatDateTimeFull', () => {
    it('应该格式化日期时间为完整格式（包含秒）', () => {
      const dateString = '2025-01-10T08:30:45.000Z';
      const result = formatDateTimeFull(dateString);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('formatDateTimeShort', () => {
    it('应该格式化日期时间为简短格式（不包含秒）', () => {
      const dateString = '2025-01-10T08:30:45.000Z';
      const result = formatDateTimeShort(dateString);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      expect(result).not.toContain(':45');
    });
  });

  describe('formatRelativeTime', () => {
    it('应该返回"刚刚"对于几秒前的时间', () => {
      const dateString = new Date(Date.now() - 30 * 1000).toISOString();
      const result = formatRelativeTime(dateString, 'zh-CN');
      expect(result).toBe('刚刚');
    });

    it('应该返回分钟前的时间', () => {
      const dateString = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = formatRelativeTime(dateString, 'zh-CN');
      expect(result).toBe('5分钟前');
    });

    it('应该返回小时前的时间', () => {
      const dateString = new Date(
        Date.now() - 3 * 60 * 60 * 1000
      ).toISOString();
      const result = formatRelativeTime(dateString, 'zh-CN');
      expect(result).toBe('3小时前');
    });

    it('应该返回天前的时间', () => {
      const dateString = new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ).toISOString();
      const result = formatRelativeTime(dateString, 'zh-CN');
      expect(result).toBe('2天前');
    });

    it('应该返回日期对于超过7天的时间', () => {
      const dateString = new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000
      ).toISOString();
      const result = formatRelativeTime(dateString, 'zh-CN');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('应该支持英文格式', () => {
      const dateString = new Date(Date.now() - 30 * 1000).toISOString();
      const result = formatRelativeTime(dateString, 'en-US');
      expect(result).toBe('just now');
    });

    it('应该处理英文的分钟前', () => {
      const dateString = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = formatRelativeTime(dateString, 'en-US');
      expect(result).toBe('5 minutes ago');
    });

    it('应该处理英文的单数形式', () => {
      const dateString = new Date(Date.now() - 1 * 60 * 1000).toISOString();
      const result = formatRelativeTime(dateString, 'en-US');
      expect(result).toBe('1 minute ago');
    });

    it('应该处理无效的日期字符串', () => {
      const invalidDate = 'invalid-date';
      const result = formatRelativeTime(invalidDate, 'zh-CN');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
