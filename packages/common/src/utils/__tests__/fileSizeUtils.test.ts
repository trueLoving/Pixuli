import { describe, it, expect } from 'vitest';
import { formatFileSize } from '../fileSizeUtils';

describe('fileSizeUtils', () => {
  describe('formatFileSize', () => {
    it('应该正确格式化 0 字节', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('应该正确格式化小于 1KB 的字节', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('应该正确格式化 KB 单位', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('应该正确格式化 MB 单位', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('应该正确格式化 GB 单位', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('应该支持自定义小数位数', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB');
      expect(formatFileSize(1536, 1)).toBe('1.5 KB');
    });
  });
});
