import { describe, it, expect } from 'vitest'
import {
  sortImages,
  getSortedImages,
  getSortDescription
} from '../sortUtils'
import { ImageItem } from '@/types/image'
import { SortField, SortOrder } from '@/components/image-browser/ImageSorter'

describe('sortUtils', () => {
  const mockImages: ImageItem[] = [
    {
      id: '1',
      name: 'apple.jpg',
      url: 'https://example.com/apple.jpg',
      githubUrl: 'https://github.com/apple.jpg',
      size: 1024,
      width: 800,
      height: 600,
      type: 'image/jpeg',
      tags: ['fruit'],
      description: 'Apple image',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'banana.png',
      url: 'https://example.com/banana.png',
      githubUrl: 'https://github.com/banana.png',
      size: 2048,
      width: 1200,
      height: 800,
      type: 'image/png',
      tags: ['fruit'],
      description: 'Banana image',
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    },
    {
      id: '3',
      name: 'cherry.gif',
      url: 'https://example.com/cherry.gif',
      githubUrl: 'https://github.com/cherry.gif',
      size: 512,
      width: 400,
      height: 300,
      type: 'image/gif',
      tags: ['fruit'],
      description: 'Cherry image',
      createdAt: '2023-01-03T00:00:00Z',
      updatedAt: '2023-01-03T00:00:00Z'
    }
  ]

  describe('sortImages', () => {
    it('应该按创建时间升序排序', () => {
      const result = sortImages(mockImages, 'createdAt', 'asc')
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('3')
    })

    it('应该按创建时间降序排序', () => {
      const result = sortImages(mockImages, 'createdAt', 'desc')
      expect(result[0].id).toBe('3')
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('1')
    })

    it('应该按名称升序排序', () => {
      const result = sortImages(mockImages, 'name', 'asc')
      expect(result[0].name).toBe('apple.jpg')
      expect(result[1].name).toBe('banana.png')
      expect(result[2].name).toBe('cherry.gif')
    })

    it('应该按名称降序排序', () => {
      const result = sortImages(mockImages, 'name', 'desc')
      expect(result[0].name).toBe('cherry.gif')
      expect(result[1].name).toBe('banana.png')
      expect(result[2].name).toBe('apple.jpg')
    })

    it('应该按文件大小升序排序', () => {
      const result = sortImages(mockImages, 'size', 'asc')
      expect(result[0].size).toBe(512)
      expect(result[1].size).toBe(1024)
      expect(result[2].size).toBe(2048)
    })

    it('应该按文件大小降序排序', () => {
      const result = sortImages(mockImages, 'size', 'desc')
      expect(result[0].size).toBe(2048)
      expect(result[1].size).toBe(1024)
      expect(result[2].size).toBe(512)
    })

    it('应该处理数字文件名排序', () => {
      const imagesWithNumbers: ImageItem[] = [
        { ...mockImages[0], name: 'image10.jpg' },
        { ...mockImages[1], name: 'image2.jpg' },
        { ...mockImages[2], name: 'image1.jpg' }
      ]
      
      const result = sortImages(imagesWithNumbers, 'name', 'asc')
      expect(result[0].name).toBe('image1.jpg')
      expect(result[1].name).toBe('image2.jpg')
      expect(result[2].name).toBe('image10.jpg')
    })

    it('应该不修改原始数组', () => {
      const originalImages = [...mockImages]
      sortImages(mockImages, 'name', 'asc')
      expect(mockImages).toEqual(originalImages)
    })
  })

  describe('getSortedImages', () => {
    it('应该使用默认排序参数', () => {
      const result = getSortedImages(mockImages)
      expect(result[0].id).toBe('3') // 最新的创建时间
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('1')
    })

    it('应该使用指定的排序参数', () => {
      const result = getSortedImages(mockImages, 'name', 'asc')
      expect(result[0].name).toBe('apple.jpg')
      expect(result[1].name).toBe('banana.png')
      expect(result[2].name).toBe('cherry.gif')
    })
  })

  describe('getSortDescription', () => {
    it('应该返回正确的排序描述', () => {
      expect(getSortDescription('createdAt', 'asc')).toBe('按上传时间升序排列')
      expect(getSortDescription('createdAt', 'desc')).toBe('按上传时间降序排列')
      expect(getSortDescription('name', 'asc')).toBe('按文件名称升序排列')
      expect(getSortDescription('name', 'desc')).toBe('按文件名称降序排列')
      expect(getSortDescription('size', 'asc')).toBe('按文件大小升序排列')
      expect(getSortDescription('size', 'desc')).toBe('按文件大小降序排列')
    })

    it('应该处理未知字段', () => {
      expect(getSortDescription('unknown' as SortField, 'asc')).toBe('按未知字段升序排列')
    })
  })
})
