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
import type { ImageItem } from '../../types/image';
import type { FilterOptions } from '../../components/image-browser/image-filter/ImageFilter';

describe('filterUtils', () => {
  const mockImages: ImageItem[] = [
    {
      id: '1',
      name: 'test-image.jpg',
      url: 'https://example.com/image1.jpg',
      githubUrl: 'https://github.com/image1.jpg',
      size: 1024,
      width: 100,
      height: 100,
      type: 'image/jpeg',
      tags: ['nature', 'landscape'],
      description: 'A beautiful landscape',
      createdAt: '2025-01-10T00:00:00.000Z',
      updatedAt: '2025-01-10T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'photo.png',
      url: 'https://example.com/image2.png',
      githubUrl: 'https://github.com/image2.png',
      size: 2048,
      width: 200,
      height: 200,
      type: 'image/png',
      tags: ['portrait', 'people'],
      description: 'A portrait photo',
      createdAt: '2025-01-11T00:00:00.000Z',
      updatedAt: '2025-01-11T00:00:00.000Z',
    },
    {
      id: '3',
      name: 'web-image.webp',
      url: 'https://example.com/image3.webp',
      githubUrl: 'https://github.com/image3.webp',
      size: 512,
      width: 150,
      height: 150,
      type: 'image/webp',
      tags: ['abstract'],
      createdAt: '2025-01-12T00:00:00.000Z',
      updatedAt: '2025-01-12T00:00:00.000Z',
    },
  ];

  describe('filterImages', () => {
    it('应该返回所有图片当没有筛选条件', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: [],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(3);
    });

    it('应该根据搜索词筛选图片', () => {
      const filters: FilterOptions = {
        searchTerm: 'test',
        selectedTypes: [],
        selectedTags: [],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-image.jpg');
    });

    it('应该根据描述筛选图片', () => {
      const filters: FilterOptions = {
        searchTerm: 'landscape',
        selectedTypes: [],
        selectedTags: [],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].description).toContain('landscape');
    });

    it('应该根据标签筛选图片', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: ['nature'],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('nature');
    });

    it('应该根据类型筛选图片', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: ['image/png'],
        selectedTags: [],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('image/png');
    });

    it('应该支持多个类型筛选', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: ['image/jpeg', 'image/png'],
        selectedTags: [],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(2);
    });

    it('应该支持多个标签筛选', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: ['nature', 'portrait'],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(2);
    });

    it('应该支持组合筛选条件', () => {
      const filters: FilterOptions = {
        searchTerm: 'photo',
        selectedTypes: ['image/png'],
        selectedTags: [],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('photo.png');
    });

    it('应该忽略大小写进行搜索', () => {
      const filters: FilterOptions = {
        searchTerm: 'TEST',
        selectedTypes: [],
        selectedTags: [],
      };
      const result = filterImages(mockImages, filters);
      expect(result).toHaveLength(1);
    });
  });

  describe('getFilterStats', () => {
    it('应该返回正确的统计信息', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: [],
      };
      const stats = getFilterStats(mockImages, filters);
      expect(stats.total).toBe(3);
      expect(stats.filtered).toBe(3);
      expect(stats.hasFilters).toBe(false);
      expect(stats.percentage).toBe(100);
    });

    it('应该计算筛选后的统计信息', () => {
      const filters: FilterOptions = {
        searchTerm: 'test',
        selectedTypes: [],
        selectedTags: [],
      };
      const stats = getFilterStats(mockImages, filters);
      expect(stats.total).toBe(3);
      expect(stats.filtered).toBe(1);
      expect(stats.hasFilters).toBe(true);
      expect(stats.percentage).toBe(33);
    });
  });

  describe('getAvailableTypes', () => {
    it('应该返回所有可用的类型', () => {
      const types = getAvailableTypes(mockImages);
      expect(types).toContain('image/jpeg');
      expect(types).toContain('image/png');
      expect(types).toContain('image/webp');
      expect(types).toHaveLength(3);
    });

    it('应该返回排序后的类型', () => {
      const types = getAvailableTypes(mockImages);
      expect(types[0]).toBe('image/jpeg');
    });

    it('应该去重类型', () => {
      const imagesWithDuplicates: ImageItem[] = [
        ...mockImages,
        {
          ...mockImages[0],
          id: '4',
        },
      ];
      const types = getAvailableTypes(imagesWithDuplicates);
      expect(types).toHaveLength(3);
    });
  });

  describe('getAvailableTags', () => {
    it('应该返回所有可用的标签', () => {
      const tags = getAvailableTags(mockImages);
      expect(tags).toContain('nature');
      expect(tags).toContain('landscape');
      expect(tags).toContain('portrait');
      expect(tags).toContain('people');
      expect(tags).toContain('abstract');
    });

    it('应该返回排序后的标签', () => {
      const tags = getAvailableTags(mockImages);
      expect(tags[0]).toBe('abstract');
    });

    it('应该去重标签', () => {
      const imagesWithDuplicates: ImageItem[] = [
        ...mockImages,
        {
          ...mockImages[0],
          id: '4',
        },
      ];
      const tags = getAvailableTags(imagesWithDuplicates);
      expect(tags).toHaveLength(5);
    });
  });

  describe('getTypeDisplayName', () => {
    it('应该返回友好的类型名称', () => {
      expect(getTypeDisplayName('image/jpeg')).toBe('JPEG');
      expect(getTypeDisplayName('image/png')).toBe('PNG');
      expect(getTypeDisplayName('image/webp')).toBe('WebP');
      expect(getTypeDisplayName('image/gif')).toBe('GIF');
    });

    it('应该处理未知类型', () => {
      expect(getTypeDisplayName('image/unknown')).toBe('UNKNOWN');
    });
  });

  describe('getTypeColor', () => {
    it('应该返回正确的颜色类名', () => {
      expect(getTypeColor('image/jpeg')).toBe('text-orange-600');
      expect(getTypeColor('image/png')).toBe('text-blue-600');
      expect(getTypeColor('image/webp')).toBe('text-green-600');
    });

    it('应该返回默认颜色对于未知类型', () => {
      expect(getTypeColor('image/unknown')).toBe('text-gray-600');
    });
  });

  describe('imageMatchesFilters', () => {
    it('应该返回true当图片匹配所有筛选条件', () => {
      const filters: FilterOptions = {
        searchTerm: 'test',
        selectedTypes: ['image/jpeg'],
        selectedTags: ['nature'],
      };
      const result = imageMatchesFilters(mockImages[0], filters);
      expect(result).toBe(true);
    });

    it('应该返回false当图片不匹配搜索词', () => {
      const filters: FilterOptions = {
        searchTerm: 'nonexistent',
        selectedTypes: [],
        selectedTags: [],
      };
      const result = imageMatchesFilters(mockImages[0], filters);
      expect(result).toBe(false);
    });

    it('应该返回false当图片不匹配类型', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: ['image/png'],
        selectedTags: [],
      };
      const result = imageMatchesFilters(mockImages[0], filters);
      expect(result).toBe(false);
    });

    it('应该返回false当图片不匹配标签', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: ['nonexistent'],
      };
      const result = imageMatchesFilters(mockImages[0], filters);
      expect(result).toBe(false);
    });
  });

  describe('createDefaultFilters', () => {
    it('应该创建默认的筛选条件', () => {
      const filters = createDefaultFilters();
      expect(filters.searchTerm).toBe('');
      expect(filters.selectedTypes).toEqual([]);
      expect(filters.selectedTags).toEqual([]);
    });
  });

  describe('isEmptyFilters', () => {
    it('应该返回true当筛选条件为空', () => {
      const filters = createDefaultFilters();
      expect(isEmptyFilters(filters)).toBe(true);
    });

    it('应该返回false当有搜索词', () => {
      const filters: FilterOptions = {
        searchTerm: 'test',
        selectedTypes: [],
        selectedTags: [],
      };
      expect(isEmptyFilters(filters)).toBe(false);
    });

    it('应该返回false当有选中的类型', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: ['image/jpeg'],
        selectedTags: [],
      };
      expect(isEmptyFilters(filters)).toBe(false);
    });

    it('应该返回false当有选中的标签', () => {
      const filters: FilterOptions = {
        searchTerm: '',
        selectedTypes: [],
        selectedTags: ['nature'],
      };
      expect(isEmptyFilters(filters)).toBe(false);
    });
  });
});
