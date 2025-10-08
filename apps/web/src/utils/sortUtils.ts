/**
 * 图片排序工具
 */

import type { ImageItem } from '@/types/image'

export type SortField = 'name' | 'size' | 'createdAt' | 'updatedAt' | 'width' | 'height'
export type SortOrder = 'asc' | 'desc'

export interface SortOptions {
  field: SortField
  order: SortOrder
}

export function sortImages(images: ImageItem[], options: SortOptions): ImageItem[] {
  return [...images].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (options.field) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'size':
        aValue = a.size
        bValue = b.size
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime()
        bValue = new Date(b.updatedAt).getTime()
        break
      case 'width':
        aValue = a.width
        bValue = b.width
        break
      case 'height':
        aValue = a.height
        bValue = b.height
        break
      default:
        return 0
    }

    if (aValue < bValue) {
      return options.order === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return options.order === 'asc' ? 1 : -1
    }
    return 0
  })
}

export const DEFAULT_SORT_OPTIONS: SortOptions = {
  field: 'createdAt',
  order: 'desc'
}

export const SORT_FIELD_OPTIONS = [
  { value: 'name', label: '名称' },
  { value: 'size', label: '文件大小' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'updatedAt', label: '更新时间' },
  { value: 'width', label: '宽度' },
  { value: 'height', label: '高度' },
] as const
