import { describe, it, expect } from 'vitest'
import {
  formatFileSize,
  formatFileSizeChinese,
  getShortFileSize,
  compareFileSize,
  isFileSizeInRange,
  getFileSizeRangeDescription,
  convertFileSize,
  getFileSizeProgress,
  formatFileSizeSmart
} from '../fileSizeUtils'

describe('fileSizeUtils', () => {
  describe('formatFileSize', () => {
    it('应该正确格式化字节数', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('应该支持自定义小数位数', () => {
      expect(formatFileSize(1536, 1)).toBe('1.5 KB')
      expect(formatFileSize(1536, 3)).toBe('1.5 KB')
    })

    it('应该处理负数小数位数', () => {
      expect(formatFileSize(1536, -1)).toBe('2 KB')
    })
  })

  describe('formatFileSizeChinese', () => {
    it('应该正确格式化字节数为中文单位', () => {
      expect(formatFileSizeChinese(0)).toBe('0 字节')
      expect(formatFileSizeChinese(1024)).toBe('1 千字节')
      expect(formatFileSizeChinese(1024 * 1024)).toBe('1 兆字节')
      expect(formatFileSizeChinese(1024 * 1024 * 1024)).toBe('1 吉字节')
    })
  })

  describe('getShortFileSize', () => {
    it('应该返回简短的文件大小表示', () => {
      expect(getShortFileSize(0)).toBe('0B')
      expect(getShortFileSize(1024)).toBe('1K')
      expect(getShortFileSize(1024 * 1024)).toBe('1M')
      expect(getShortFileSize(1024 * 1024 * 1024)).toBe('1G')
    })
  })

  describe('compareFileSize', () => {
    it('应该正确比较文件大小', () => {
      expect(compareFileSize(100, 200)).toBe(-1)
      expect(compareFileSize(200, 100)).toBe(1)
      expect(compareFileSize(100, 100)).toBe(0)
    })
  })

  describe('isFileSizeInRange', () => {
    it('应该检查文件大小是否在范围内', () => {
      expect(isFileSizeInRange(150, 100, 200)).toBe(true)
      expect(isFileSizeInRange(50, 100, 200)).toBe(false)
      expect(isFileSizeInRange(250, 100, 200)).toBe(false)
      expect(isFileSizeInRange(150, undefined, 200)).toBe(true)
      expect(isFileSizeInRange(150, 100, undefined)).toBe(true)
    })
  })

  describe('getFileSizeRangeDescription', () => {
    it('应该返回文件大小范围描述', () => {
      expect(getFileSizeRangeDescription(1024, 2048)).toBe('1 KB - 2 KB')
    })
  })

  describe('convertFileSize', () => {
    it('应该正确转换文件大小到指定单位', () => {
      expect(convertFileSize(1024, 'KB')).toBe(1)
      expect(convertFileSize(1024 * 1024, 'MB')).toBe(1)
      expect(convertFileSize(1024 * 1024 * 1024, 'GB')).toBe(1)
    })

    it('应该支持自定义小数位数', () => {
      expect(convertFileSize(1536, 'KB', 1)).toBe(1.5)
    })

    it('应该对不支持的单位抛出错误', () => {
      expect(() => convertFileSize(1024, 'INVALID')).toThrow('不支持的单位: INVALID')
    })
  })

  describe('getFileSizeProgress', () => {
    it('应该计算文件大小进度百分比', () => {
      expect(getFileSizeProgress(0, 100)).toBe(0)
      expect(getFileSizeProgress(50, 100)).toBe(50)
      expect(getFileSizeProgress(100, 100)).toBe(100)
      expect(getFileSizeProgress(150, 100)).toBe(100) // 不超过100%
    })

    it('应该处理最大大小为0的情况', () => {
      expect(getFileSizeProgress(50, 0)).toBe(0)
    })
  })

  describe('formatFileSizeSmart', () => {
    it('应该智能选择文件大小单位', () => {
      expect(formatFileSizeSmart(500)).toBe('500 B')
      expect(formatFileSizeSmart(1024)).toBe('1.0 KB')
      expect(formatFileSizeSmart(1024 * 1024)).toBe('1.0 MB')
      expect(formatFileSizeSmart(1024 * 1024 * 1024)).toBe('1.0 GB')
      expect(formatFileSizeSmart(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB')
    })
  })
})