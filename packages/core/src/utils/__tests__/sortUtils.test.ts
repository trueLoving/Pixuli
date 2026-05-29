import { describe, it, expect } from 'vitest';
import { getSortedImages } from '../sortUtils';
import type { ImageItem } from '../../types/image';

const mockImages: ImageItem[] = [
  {
    id: '1',
    name: 'b.jpg',
    url: 'https://example.com/b.jpg',
    createdAt: '2025-01-02T00:00:00Z',
    size: 2048,
  },
  {
    id: '2',
    name: 'a.jpg',
    url: 'https://example.com/a.jpg',
    createdAt: '2025-01-01T00:00:00Z',
    size: 1024,
  },
  {
    id: '3',
    name: 'c.jpg',
    url: 'https://example.com/c.jpg',
    createdAt: '2025-01-03T00:00:00Z',
    size: 3072,
  },
];

describe('sortUtils', () => {
  describe('getSortedImages', () => {
    it('应该按创建时间降序排序（默认）', () => {
      const result = getSortedImages(mockImages);
      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('1');
      expect(result[2].id).toBe('2');
    });

    it('应该按创建时间升序排序', () => {
      const result = getSortedImages(mockImages, 'createdAt', 'asc');
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
      expect(result[2].id).toBe('3');
    });

    it('应该按名称升序排序', () => {
      const result = getSortedImages(mockImages, 'name', 'asc');
      expect(result[0].name).toBe('a.jpg');
      expect(result[1].name).toBe('b.jpg');
      expect(result[2].name).toBe('c.jpg');
    });

    it('应该按名称降序排序', () => {
      const result = getSortedImages(mockImages, 'name', 'desc');
      expect(result[0].name).toBe('c.jpg');
      expect(result[1].name).toBe('b.jpg');
      expect(result[2].name).toBe('a.jpg');
    });

    it('应该按文件大小升序排序', () => {
      const result = getSortedImages(mockImages, 'size', 'asc');
      expect(result[0].size).toBe(1024);
      expect(result[1].size).toBe(2048);
      expect(result[2].size).toBe(3072);
    });

    it('应该按文件大小降序排序', () => {
      const result = getSortedImages(mockImages, 'size', 'desc');
      expect(result[0].size).toBe(3072);
      expect(result[1].size).toBe(2048);
      expect(result[2].size).toBe(1024);
    });
  });
});
