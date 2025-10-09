import React from 'react'
import { ArrowUpDown, Calendar, FileText, SortAsc, SortDesc, HardDrive } from 'lucide-react'
import './ImageSorter.css'

export type SortField = 'createdAt' | 'name' | 'size'
export type SortOrder = 'asc' | 'desc'

interface ImageSorterProps {
  currentSort: SortField
  currentOrder: SortOrder
  onSortChange: (field: SortField, order: SortOrder) => void
  className?: string
}

const ImageSorter: React.FC<ImageSorterProps> = ({ 
  currentSort, 
  currentOrder, 
  onSortChange, 
  className = '' 
}) => {
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
      return <ArrowUpDown className="w-4 h-4" />
    }
    
    return currentOrder === 'asc' ? 
      <SortAsc className="w-4 h-4" /> : 
      <SortDesc className="w-4 h-4" />
  }

  const getSortLabel = (field: SortField) => {
    switch (field) {
      case 'createdAt':
        return '上传时间'
      case 'name':
        return '文件名称'
      case 'size':
        return '文件大小'
      default:
        return ''
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600 mr-2">排序:</span>
      
      {/* 时间排序 */}
      <button
        onClick={() => handleSortChange('createdAt')}
        className={`sort-button ${currentSort === 'createdAt' ? 'active' : 'inactive'}`}
        title="按上传时间排序"
      >
        <Calendar className="sort-icon" />
        <span className="sort-label">{getSortLabel('createdAt')}</span>
        {getSortIcon('createdAt')}
      </button>
      
      {/* 名称排序 */}
      <button
        onClick={() => handleSortChange('name')}
        className={`sort-button ${currentSort === 'name' ? 'active' : 'inactive'}`}
        title="按文件名称排序"
      >
        <FileText className="sort-icon" />
        <span className="sort-label">{getSortLabel('name')}</span>
        {getSortIcon('name')}
      </button>
      
      {/* 文件大小排序 */}
      <button
        onClick={() => handleSortChange('size')}
        className={`sort-button ${currentSort === 'size' ? 'active' : 'inactive'}`}
        title="按文件大小排序"
      >
        <HardDrive className="sort-icon" />
        <span className="sort-label">{getSortLabel('size')}</span>
        {getSortIcon('size')}
      </button>
    </div>
  )
}

export default ImageSorter 