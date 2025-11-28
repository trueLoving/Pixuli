import { describe, it, expect } from 'vitest';
import { filterImages, createDefaultFilters } from '../filterUtils';
import type { ImageItem } from '../../types/image';
import type { FilterOptions } from '../../components/image-browser/image-filter/ImageFilter';

const mockImages: ImageItem[] = [
  {
    id: '1',
    name: 'test1.jpg',
    url: 'https://example.com/test1.jpg',
    createdAt: '2025-01-01T00:00:00Z',
    size: 1024,
    type: 'image/jpeg',
    tags: ['nature', 'landscape'],
  },
  {
    id: '2',
    name: 'test2.png',
    url: 'https://example.com/test2.png',
    createdAt: '2025-01-02T00:00:00Z',
    size: 2048,
    type: 'image/png',
    tags: ['portrait'],
  },
];

describe('filterUtils', () => {
  describe('filterImages', () => {
    it('应该返回所有图片当没有筛选条件时', () => {
      const filters: FilterOptions = createDefaultFilters();
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(2);
    });

    it('应该根据搜索词筛选', () => {
      const filters: FilterOptions = {
        searchTerm: 'test1',
        selectedTypes: [],
        selectedTags: [],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test1.jpg');
    });

    it('应该根据类型筛选', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: ['image/png'],
        selectedTags: [],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('image/png');
    });

    it('应该根据标签筛选', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: ['nature'],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('nature');
    });
  });

  describe('createDefaultFilters', () => {
    it('应该创建空的筛选条件', () => {
      const filters = createDefaultFilters();
      expect(filters.searchTerm).toBe('');
      expect(filters.selectedTypes).toEqual([]);
      expect(filters.selectedTags).toEqual([]);
    });
  });
});
