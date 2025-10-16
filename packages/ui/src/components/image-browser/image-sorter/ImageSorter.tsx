import React from 'react'
import { ArrowUpDown, Calendar, FileText, SortAsc, SortDesc, HardDrive } from 'lucide-react'
import { defaultTranslate } from '../../../locales/defaultTranslate'
import './ImageSorter.css'

export type SortField = 'createdAt' | 'name' | 'size'
export type SortOrder = 'asc' | 'desc'

interface ImageSorterProps {
  currentSort: SortField
  currentOrder: SortOrder
  onSortChange: (field: SortField, order: SortOrder) => void
  className?: string
  t?: (key: string) => string
}

const ImageSorter: React.FC<ImageSorterProps> = ({ 
  currentSort, 
  currentOrder, 
  onSortChange, 
  className = '',
  t
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate
  const handleSortChange = (field: SortField) => {
    let newOrder: SortOrder = 'asc'
    
    // 如果点击的是当前排序字段，则切换排序顺序
    if (field === currentSort) {
      newOrder = currentOrder === 'asc' ? 'desc' : 'asc'
    }
    
    onSortChange(field, newOrder)
  }

  const getSortIcon = (field: SortField) => {
    if (field !== currentSort) {
      return <ArrowUpDown className="image-sorter-icon" />
    }
    
    return currentOrder === 'asc' ? 
      <SortAsc className="image-sorter-icon" /> : 
      <SortDesc className="image-sorter-icon" />
  }

  const getSortLabel = (field: SortField) => {
    switch (field) {
      case 'createdAt':
        return translate('image.sorter.createdAt')
      case 'name':
        return translate('image.sorter.name')
      case 'size':
        return translate('image.sorter.size')
      default:
        return ''
    }
  }

  return (
    <div className={`image-sorter-container ${className}`}>
      <span className="image-sorter-label">{translate('image.sorter.label')}:</span>
      
      {/* 时间排序 */}
      <button
        onClick={() => handleSortChange('createdAt')}
        className={`sort-button ${currentSort === 'createdAt' ? 'active' : 'inactive'}`}
        title={translate('image.sorter.sortByCreatedAt')}
      >
        <Calendar className="sort-icon" />
        <span className="sort-label">{getSortLabel('createdAt')}</span>
        {getSortIcon('createdAt')}
      </button>
      
      {/* 名称排序 */}
      <button
        onClick={() => handleSortChange('name')}
        className={`sort-button ${currentSort === 'name' ? 'active' : 'inactive'}`}
        title={translate('image.sorter.sortByName')}
      >
        <FileText className="sort-icon" />
        <span className="sort-label">{getSortLabel('name')}</span>
        {getSortIcon('name')}
      </button>
      
      {/* 文件大小排序 */}
      <button
        onClick={() => handleSortChange('size')}
        className={`sort-button ${currentSort === 'size' ? 'active' : 'inactive'}`}
        title={translate('image.sorter.sortBySize')}
      >
        <HardDrive className="sort-icon" />
        <span className="sort-label">{getSortLabel('size')}</span>
        {getSortIcon('size')}
      </button>
    </div>
  )
}

export default ImageSorter 