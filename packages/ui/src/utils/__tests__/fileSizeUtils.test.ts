import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  formatFileSizeChinese,
  getShortFileSize,
  compareFileSize,
  isFileSizeInRange,
  getFileSizeRangeDescription,
  convertFileSize,
  getFileSizeProgress,
  formatFileSizeSmart,
} from '../fileSizeUtils';

describe('fileSizeUtils', () => {
  describe('formatFileSize', () => {
    it('应该格式化0字节', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('应该格式化字节', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('应该格式化KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('应该格式化MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('应该格式化GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('应该支持自定义小数位数', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB');
      expect(formatFileSize(1536, 1)).toBe('1.5 KB');
    });
  });

  describe('formatFileSizeChinese', () => {
    it('应该格式化0字节', () => {
      expect(formatFileSizeChinese(0)).toBe('0 字节');
    });

    it('应该格式化千字节', () => {
      expect(formatFileSizeChinese(1024)).toBe('1 千字节');
    });

    it('应该格式化兆字节', () => {
      expect(formatFileSizeChinese(1024 * 1024)).toBe('1 兆字节');
    });
  });

  describe('getShortFileSize', () => {
    it('应该返回简短格式', () => {
      expect(getShortFileSize(0)).toBe('0B');
      expect(getShortFileSize(1024)).toBe('1K');
      expect(getShortFileSize(1024 * 1024)).toBe('1M');
    });
  });

  describe('compareFileSize', () => {
    it('应该返回-1当A小于B', () => {
      expect(compareFileSize(100, 200)).toBe(-1);
    });

    it('应该返回1当A大于B', () => {
      expect(compareFileSize(200, 100)).toBe(1);
    });

    it('应该返回0当A等于B', () => {
      expect(compareFileSize(100, 100)).toBe(0);
    });
  });

  describe('isFileSizeInRange', () => {
    it('应该返回true当文件大小在范围内', () => {
      expect(isFileSizeInRange(150, 100, 200)).toBe(true);
    });

    it('应该返回false当文件大小小于最小值', () => {
      expect(isFileSizeInRange(50, 100, 200)).toBe(false);
    });

    it('应该返回false当文件大小大于最大值', () => {
      expect(isFileSizeInRange(250, 100, 200)).toBe(false);
    });

    it('应该只检查最小值', () => {
      expect(isFileSizeInRange(150, 100)).toBe(true);
      expect(isFileSizeInRange(50, 100)).toBe(false);
    });

    it('应该只检查最大值', () => {
      expect(isFileSizeInRange(150, undefined, 200)).toBe(true);
      expect(isFileSizeInRange(250, undefined, 200)).toBe(false);
    });

    it('应该返回true当没有限制', () => {
      expect(isFileSizeInRange(150)).toBe(true);
    });
  });

  describe('getFileSizeRangeDescription', () => {
    it('应该返回范围描述', () => {
      const result = getFileSizeRangeDescription(100, 200);
      expect(result).toContain('100');
      expect(result).toContain('200');
    });
  });

  describe('convertFileSize', () => {
    it('应该转换为B', () => {
      expect(convertFileSize(1024, 'B')).toBe(1024);
    });

    it('应该转换为KB', () => {
      expect(convertFileSize(1024, 'KB')).toBe(1);
    });

    it('应该转换为MB', () => {
      expect(convertFileSize(1024 * 1024, 'MB')).toBe(1);
    });

    it('应该转换为GB', () => {
      expect(convertFileSize(1024 * 1024 * 1024, 'GB')).toBe(1);
    });

    it('应该支持自定义小数位数', () => {
      expect(convertFileSize(1536, 'KB', 1)).toBe(1.5);
    });

    it('应该抛出错误对于不支持的单位', () => {
      expect(() => convertFileSize(100, 'INVALID')).toThrow();
    });
  });

  describe('getFileSizeProgress', () => {
    it('应该返回0当maxSize为0', () => {
      expect(getFileSizeProgress(100, 0)).toBe(0);
    });

    it('应该计算正确的百分比', () => {
      expect(getFileSizeProgress(50, 100)).toBe(50);
      expect(getFileSizeProgress(25, 100)).toBe(25);
    });

    it('应该限制最大值为100', () => {
      expect(getFileSizeProgress(200, 100)).toBe(100);
    });

    it('应该四舍五入百分比', () => {
      expect(getFileSizeProgress(33, 100)).toBe(33);
    });
  });

  describe('formatFileSizeSmart', () => {
    it('应该格式化小于1KB的文件', () => {
      expect(formatFileSizeSmart(500)).toBe('500 B');
    });

    it('应该格式化KB范围的文件', () => {
      expect(formatFileSizeSmart(1024)).toBe('1.0 KB');
      expect(formatFileSizeSmart(2048)).toBe('2.0 KB');
    });

    it('应该格式化MB范围的文件', () => {
      expect(formatFileSizeSmart(1024 * 1024)).toBe('1.0 MB');
    });

    it('应该格式化GB范围的文件', () => {
      expect(formatFileSizeSmart(1024 * 1024 * 1024)).toBe('1.0 GB');
    });

    it('应该格式化TB范围的文件', () => {
      expect(formatFileSizeSmart(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
    });
  });
});
