import { ImageItem } from '@/type/image'
import { SortField, SortOrder } from '@/components/image-grid/ImageSorter'

/**
 * 对图片数组进行排序
 * @param images 图片数组
 * @param sortField 排序字段
 * @param sortOrder 排序顺序
 * @returns 排序后的图片数组
 */
export function sortImages(
  images: ImageItem[], 
  sortField: SortField, 
  sortOrder: SortOrder
): ImageItem[] {
  const sortedImages = [...images]
  
  sortedImages.sort((a, b) => {
    let comparison = 0
    
    switch (sortField) {
      case 'createdAt':
        // 按创建时间排序
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        comparison = dateA - dateB
        break
        
      case 'name':
        // 按名称排序（忽略大小写）
        comparison = a.name.localeCompare(b.name, 'zh-CN', { 
          sensitivity: 'base',
          numeric: true 
        })
        break
        
      default:
        comparison = 0
    }
    
    // 根据排序顺序返回结果
    return sortOrder === 'asc' ? comparison : -comparison
  })
  
  return sortedImages
}

/**
 * 获取排序后的图片数组（包含默认排序）
 * @param images 原始图片数组
 * @param sortField 排序字段
 * @param sortOrder 排序顺序
 * @returns 排序后的图片数组
 */
export function getSortedImages(
  images: ImageItem[], 
  sortField: SortField = 'createdAt', 
  sortOrder: SortOrder = 'desc'
): ImageItem[] {
  return sortImages(images, sortField, sortOrder)
}

/**
 * 获取排序描述文本
 * @param sortField 排序字段
 * @param sortOrder 排序顺序
 * @returns 排序描述文本
 */
export function getSortDescription(sortField: SortField, sortOrder: SortOrder): string {
  const fieldText = sortField === 'createdAt' ? '上传时间' : '文件名称'
  const orderText = sortOrder === 'asc' ? '升序' : '降序'
  return `按${fieldText}${orderText}排列`
} 