import { describe, it, expect } from 'vitest';
import {
  filterImages,
  getFilterStats,
  getAvailableTypes,
  getAvailableTags,
  getTypeDisplayName,
  getTypeColor,
  imageMatchesFilters,
  createDefaultFilters,
  isEmptyFilters,
} from '../filterUtils';
import { ImageItem } from '@/types/image';
import { FilterOptions } from '@/components/image-browser/ImageFilter';

describe('filterUtils', () => {
  const mockImages: ImageItem[] = [
    {
      id: '1',
      name: 'test1.jpg',
      url: 'https://example.com/test1.jpg',
      githubUrl: 'https://github.com/test1.jpg',
      size: 1024,
      width: 800,
      height: 600,
      type: 'image/jpeg',
      tags: ['nature', 'landscape'],
      description: 'A beautiful landscape',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'test2.png',
      url: 'https://example.com/test2.png',
      githubUrl: 'https://github.com/test2.png',
      size: 2048,
      width: 1200,
      height: 800,
      type: 'image/png',
      tags: ['city', 'architecture'],
      description: 'City skyline',
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    },
    {
      id: '3',
      name: 'test3.gif',
      url: 'https://example.com/test3.gif',
      githubUrl: 'https://github.com/test3.gif',
      size: 512,
      width: 400,
      height: 300,
      type: 'image/gif',
      tags: ['animation'],
      description: 'Animated gif',
      createdAt: '2023-01-03T00:00:00Z',
      updatedAt: '2023-01-03T00:00:00Z',
    },
  ];

  describe('filterImages', () => {
    it('应该根据搜索词过滤图片', () => {
      const filters: FilterOptions = {
        searchTerm: 'landscape',
        selectedTypes: [],
        selectedTags: [],
        sizeRange: { min: 0, max: 0 },
      };

      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('应该根据类型过滤图片', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: ['image/jpeg'],
        selectedTags: [],
        sizeRange: { min: 0, max: 0 },
      };

      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('应该根据标签过滤图片', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: ['nature'],
        sizeRange: { min: 0, max: 0 },
      };

      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('应该组合多个过滤条件', () => {
      const filters: FilterOptions = {
        searchTerm: 'test',
        selectedTypes: ['image/jpeg', 'image/png'],
        selectedTags: ['nature'],
        sizeRange: { min: 0, max: 0 },
      };

      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('应该在没有过滤条件时返回所有图片', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: [],
        sizeRange: { min: 0, max: 0 },
      };

      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(3);
    });
  });

  describe('getFilterStats', () => {
    it('应该返回正确的过滤统计信息', () => {
      const filters: FilterOptions = {
        searchTerm: 'landscape',
        selectedTypes: [],
        selectedTags: [],
        sizeRange: { min: 0, max: 0 },
      };

      const stats = getFilterStats(mockImages, filters);
      expect(stats).toEqual({
        total: 3,
        filtered: 1,
        hasFilters: 'landscape',
        percentage: 33,
      });
    });

    it('应该在没有过滤条件时返回100%', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: [],
        sizeRange: { min: 0, max: 0 },
      };

      const stats = getFilterStats(mockImages, filters);
      expect(stats.percentage).toBe(100);
      expect(stats.hasFilters).toBe(false);
    });
  });

  describe('getAvailableTypes', () => {
    it('应该返回所有可用的图片类型', () => {
      const types = getAvailableTypes(mockImages);
      expect(types).toEqual(['image/gif', 'image/jpeg', 'image/png']);
    });

    it('应该处理没有类型的图片', () => {
      const imagesWithNoType = [
        { ...mockImages[0], type: undefined },
        { ...mockImages[1], type: 'image/png' },
      ];

      const types = getAvailableTypes(imagesWithNoType as ImageItem[]);
      expect(types).toEqual(['image/png']);
    });
  });

  describe('getAvailableTags', () => {
    it('应该返回所有可用的标签', () => {
      const tags = getAvailableTags(mockImages);
      expect(tags).toEqual([
        'animation',
        'architecture',
        'city',
        'landscape',
        'nature',
      ]);
    });

    it('应该处理没有标签的图片', () => {
      const imagesWithNoTags = [
        { ...mockImages[0], tags: undefined },
        { ...mockImages[1], tags: ['city'] },
      ];

      const tags = getAvailableTags(imagesWithNoTags as ImageItem[]);
      expect(tags).toEqual(['city']);
    });
  });

  describe('getTypeDisplayName', () => {
    it('应该返回正确的类型显示名称', () => {
      expect(getTypeDisplayName('image/jpeg')).toBe('JPEG');
      expect(getTypeDisplayName('image/png')).toBe('PNG');
      expect(getTypeDisplayName('image/gif')).toBe('GIF');
      expect(getTypeDisplayName('image/webp')).toBe('WebP');
    });

    it('应该处理未知类型', () => {
      expect(getTypeDisplayName('image/unknown')).toBe('UNKNOWN');
      expect(getTypeDisplayName('invalid')).toBe('invalid');
    });
  });

  describe('getTypeColor', () => {
    it('应该返回正确的类型颜色', () => {
      expect(getTypeColor('image/jpeg')).toBe('text-orange-600');
      expect(getTypeColor('image/png')).toBe('text-blue-600');
      expect(getTypeColor('image/gif')).toBe('text-purple-600');
    });

    it('应该为未知类型返回默认颜色', () => {
      expect(getTypeColor('image/unknown')).toBe('text-gray-600');
    });
  });

  describe('imageMatchesFilters', () => {
    it('应该检查图片是否匹配过滤条件', () => {
      const image = mockImages[0];
      const filters: FilterOptions = {
        searchTerm: 'landscape',
        selectedTypes: ['image/jpeg'],
        selectedTags: ['nature'],
        sizeRange: { min: 0, max: 2000 },
      };

      expect(imageMatchesFilters(image, filters)).toBe(true);
    });

    it('应该检查文件大小范围', () => {
      const image = mockImages[0];
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: [],
        sizeRange: { min: 500, max: 1500 },
      };

      expect(imageMatchesFilters(image, filters)).toBe(true);

      const filtersTooSmall: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: [],
        sizeRange: { min: 2000, max: 3000 },
      };

      expect(imageMatchesFilters(image, filtersTooSmall)).toBe(false);
    });
  });

  describe('createDefaultFilters', () => {
    it('应该创建默认过滤条件', () => {
      const filters = createDefaultFilters();
      expect(filters).toEqual({
        searchTerm: '',
        selectedTypes: [],
        selectedTags: [],
        sizeRange: { min: 0, max: 0 },
      });
    });
  });

  describe('isEmptyFilters', () => {
    it('应该正确识别空过滤条件', () => {
      const emptyFilters = createDefaultFilters();
      expect(isEmptyFilters(emptyFilters)).toBe(true);

      const nonEmptyFilters: FilterOptions = {
        searchTerm: 'test',
        selectedTypes: [],
        selectedTags: [],
        sizeRange: { min: 0, max: 0 },
      };
      expect(isEmptyFilters(nonEmptyFilters)).toBe(false);
    });
  });
});
