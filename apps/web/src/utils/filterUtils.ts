/**
 * 图片过滤工具
 */

import type { ImageItem } from '@/types/image'

export interface FilterOptions {
  searchTerm?: string
  tags?: string[]
  sizeRange?: {
    min?: number
    max?: number
  }
  dateRange?: {
    start?: Date
    end?: Date
  }
  format?: string[]
}

export function filterImages(images: ImageItem[], options: FilterOptions): ImageItem[] {
  return images.filter(image => {
    // 搜索词过滤
    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase()
      const matchesSearch = 
        image.name.toLowerCase().includes(searchLower) ||
        image.description?.toLowerCase().includes(searchLower) ||
        image.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      
      if (!matchesSearch) return false
    }

    // 标签过滤
    if (options.tags && options.tags.length > 0) {
      const hasMatchingTag = options.tags.some(tag => 
        image.tags?.includes(tag)
      )
      if (!hasMatchingTag) return false
    }

    // 文件大小过滤
    if (options.sizeRange) {
      const { min, max } = options.sizeRange
      if (min !== undefined && image.size < min) return false
      if (max !== undefined && image.size > max) return false
    }

    // 日期过滤
    if (options.dateRange) {
      const { start, end } = options.dateRange
      const imageDate = new Date(image.createdAt)
      
      if (start && imageDate < start) return false
      if (end && imageDate > end) return false
    }

    // 格式过滤
    if (options.format && options.format.length > 0) {
      const imageFormat = image.type.split('/')[1]
      if (!options.format.includes(imageFormat)) return false
    }

    return true
  })
}

export function getAllTags(images: ImageItem[]): string[] {
  const tagSet = new Set<string>()
  images.forEach(image => {
    image.tags?.forEach(tag => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
}

export function getImageFormats(images: ImageItem[]): string[] {
  const formatSet = new Set<string>()
  images.forEach(image => {
    const format = image.type.split('/')[1]
    formatSet.add(format)
  })
  return Array.from(formatSet).sort()
}
