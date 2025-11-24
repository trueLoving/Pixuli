import { describe, it, expect } from 'vitest';
import { sortImages, getSortedImages, getSortDescription } from '../sortUtils';
import type { ImageItem } from '../../types/image';
import type {
  SortField,
  SortOrder,
} from '../../components/image-browser/image-sorter/ImageSorter';

describe('sortUtils', () => {
  const mockImages: ImageItem[] = [
    {
      id: '1',
      name: 'c-image.jpg',
      url: 'https://example.com/image1.jpg',
      githubUrl: 'https://github.com/image1.jpg',
      size: 3000,
      width: 100,
      height: 100,
      type: 'image/jpeg',
      tags: [],
      createdAt: '2025-01-10T00:00:00.000Z',
      updatedAt: '2025-01-10T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'a-image.jpg',
      url: 'https://example.com/image2.jpg',
      githubUrl: 'https://github.com/image2.jpg',
      size: 1000,
      width: 200,
      height: 200,
      type: 'image/jpeg',
      tags: [],
      createdAt: '2025-01-12T00:00:00.000Z',
      updatedAt: '2025-01-12T00:00:00.000Z',
    },
    {
      id: '3',
      name: 'b-image.jpg',
      url: 'https://example.com/image3.jpg',
      githubUrl: 'https://github.com/image3.jpg',
      size: 2000,
      width: 150,
      height: 150,
      type: 'image/jpeg',
      tags: [],
      createdAt: '2025-01-11T00:00:00.000Z',
      updatedAt: '2025-01-11T00:00:00.000Z',
    },
  ];

  describe('sortImages', () => {
    it('应该按创建时间升序排序', () => {
      const result = sortImages(mockImages, 'createdAt', 'asc');
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('2');
    });

    it('应该按创建时间降序排序', () => {
      const result = sortImages(mockImages, 'createdAt', 'desc');
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1');
    });

    it('应该按名称升序排序', () => {
      const result = sortImages(mockImages, 'name', 'asc');
      expect(result[0].name).toBe('a-image.jpg');
      expect(result[1].name).toBe('b-image.jpg');
      expect(result[2].name).toBe('c-image.jpg');
    });

    it('应该按名称降序排序', () => {
      const result = sortImages(mockImages, 'name', 'desc');
      expect(result[0].name).toBe('c-image.jpg');
      expect(result[1].name).toBe('b-image.jpg');
      expect(result[2].name).toBe('a-image.jpg');
    });

    it('应该按文件大小升序排序', () => {
      const result = sortImages(mockImages, 'size', 'asc');
      expect(result[0].size).toBe(1000);
      expect(result[1].size).toBe(2000);
      expect(result[2].size).toBe(3000);
    });

    it('应该按文件大小降序排序', () => {
      const result = sortImages(mockImages, 'size', 'desc');
      expect(result[0].size).toBe(3000);
      expect(result[1].size).toBe(2000);
      expect(result[2].size).toBe(1000);
    });

    it('应该不修改原始数组', () => {
      const original = [...mockImages];
      sortImages(mockImages, 'name', 'asc');
      expect(mockImages).toEqual(original);
    });
  });

  describe('getSortedImages', () => {
    it('应该使用默认排序（按创建时间降序）', () => {
      const result = getSortedImages(mockImages);
      expect(result[0].id).toBe('2'); // 最新的
    });

    it('应该使用指定的排序字段和顺序', () => {
      const result = getSortedImages(mockImages, 'name', 'asc');
      expect(result[0].name).toBe('a-image.jpg');
    });
  });

  describe('getSortDescription', () => {
    it('应该返回创建时间的排序描述', () => {
      expect(getSortDescription('createdAt', 'asc')).toBe('按上传时间升序排列');
      expect(getSortDescription('createdAt', 'desc')).toBe(
        '按上传时间降序排列'
      );
    });

    it('应该返回文件名称的排序描述', () => {
      expect(getSortDescription('name', 'asc')).toBe('按文件名称升序排列');
      expect(getSortDescription('name', 'desc')).toBe('按文件名称降序排列');
    });

    it('应该返回文件大小的排序描述', () => {
      expect(getSortDescription('size', 'asc')).toBe('按文件大小升序排列');
      expect(getSortDescription('size', 'desc')).toBe('按文件大小降序排列');
    });
  });
});
