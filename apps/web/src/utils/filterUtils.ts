import type { ImageItem } from '@/types/image'
import type { FilterOptions } from '@/components/image-browser/ImageFilter'

/**
 * 根据筛选条件过滤图片数组
 * @param images 原始图片数组
 * @param filters 筛选条件
 * @returns 筛选后的图片数组
 */
export function filterImages(images: ImageItem[], filters: FilterOptions): ImageItem[] {
  const { searchTerm, selectedTypes, selectedTags, sizeRange } = filters
  
  return images.filter(image => {
    // 搜索词筛选
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        image.name.toLowerCase().includes(searchLower) ||
        image.description?.toLowerCase().includes(searchLower) ||
        image.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      
      if (!matchesSearch) return false
    }
    
    // 类型筛选
    if (selectedTypes.length > 0) {
      if (!image.type || !selectedTypes.includes(image.type)) {
        return false
      }
    }
    
    // 标签筛选
    if (selectedTags.length > 0) {
      if (!image.tags || !image.tags.some(tag => selectedTags.includes(tag))) {
        return false
      }
    }
    
    return true
  })
}

/**
 * 获取筛选统计信息
 * @param images 原始图片数组
 * @param filters 筛选条件
 * @returns 筛选统计信息
 */
export function getFilterStats(images: ImageItem[], filters: FilterOptions) {
  const filteredImages = filterImages(images, filters)
  const hasFilters = filters.searchTerm || filters.selectedTypes.length > 0 || filters.selectedTags.length > 0
  
  return {
    total: images.length,
    filtered: filteredImages.length,
    hasFilters,
    percentage: hasFilters ? Math.round((filteredImages.length / images.length) * 100) : 100
  }
}

/**
 * 获取所有可用的图片类型
 * @param images 图片数组
 * @returns 去重后的图片类型数组
 */
export function getAvailableTypes(images: ImageItem[]): string[] {
  const types = new Set<string>()
  images.forEach(image => {
    if (image.type) {
      types.add(image.type)
    }
  })
  return Array.from(types).sort()
}

/**
 * 获取所有可用的标签
 * @param images 图片数组
 * @returns 去重后的标签数组
 */
export function getAvailableTags(images: ImageItem[]): string[] {
  const tags = new Set<string>()
  images.forEach(image => {
    if (image.tags && image.tags.length > 0) {
      image.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
}

/**
 * 获取文件类型的友好显示名称
 * @param type MIME类型字符串
 * @returns 友好的显示名称
 */
export function getTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/bmp': 'BMP',
    'image/webp': 'WebP',
    'image/svg+xml': 'SVG',
    'image/tiff': 'TIFF',
    'image/avif': 'AVIF',
    'image/heic': 'HEIC',
    'image/heif': 'HEIF'
  }
  
  return typeMap[type] || type.split('/')[1]?.toUpperCase() || type
}

/**
 * 获取文件类型的图标颜色
 * @param type MIME类型字符串
 * @returns CSS颜色类名
 */
export function getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    'image/jpeg': 'text-orange-600',
    'image/jpg': 'text-orange-600',
    'image/png': 'text-blue-600',
    'image/gif': 'text-purple-600',
    'image/bmp': 'text-gray-600',
    'image/webp': 'text-green-600',
    'image/svg+xml': 'text-yellow-600',
    'image/tiff': 'text-red-600',
    'image/avif': 'text-indigo-600',
    'image/heic': 'text-pink-600',
    'image/heif': 'text-pink-600'
  }
  
  return colorMap[type] || 'text-gray-600'
}

/**
 * 检查图片是否匹配所有筛选条件
 * @param image 图片对象
 * @param filters 筛选条件
 * @returns 是否匹配
 */
export function imageMatchesFilters(image: ImageItem, filters: FilterOptions): boolean {
  const { searchTerm, selectedTypes, selectedTags, sizeRange } = filters
  
  // 搜索词筛选
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      image.name.toLowerCase().includes(searchLower) ||
      image.description?.toLowerCase().includes(searchLower) ||
      image.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    
    if (!matchesSearch) return false
  }
  
  // 类型筛选
  if (selectedTypes.length > 0) {
    if (!image.type || !selectedTypes.includes(image.type)) {
      return false
    }
  }
  
  // 标签筛选
  if (selectedTags.length > 0) {
    if (!image.tags || !image.tags.some(tag => selectedTags.includes(tag))) {
      return false
    }
  }
  
  // 文件大小筛选
  if (sizeRange.min > 0 && image.size < sizeRange.min) {
    return false
  }
  if (sizeRange.max > 0 && image.size > sizeRange.max) {
    return false
  }
  
  return true
}

/**
 * 创建默认筛选条件
 * @returns 默认筛选条件
 */
export function createDefaultFilters(): FilterOptions {
  return {
    searchTerm: '',
    selectedTypes: [],
    selectedTags: [],
    sizeRange: { min: 0, max: 0 }
  }
}

/**
 * 检查筛选条件是否为空
 * @param filters 筛选条件
 * @returns 是否为空
 */
export function isEmptyFilters(filters: FilterOptions): boolean {
  return !filters.searchTerm && 
         filters.selectedTypes.length === 0 && 
         filters.selectedTags.length === 0 &&
         filters.sizeRange.min === 0 && 
         filters.sizeRange.max === 0
} 