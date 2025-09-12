import React, { useState, useCallback, useMemo } from 'react'
import { ImageItem } from '@/type/image'
import ImageGrid from './ImageGrid'
import ImageList from './ImageList'
import ViewToggle, { ViewMode } from './ViewToggle'
import ImageSorter, { SortField, SortOrder } from './ImageSorter'
import ImageFilter, { FilterOptions } from './ImageFilter'
import { getSortedImages } from '@/utils/sortUtils'
import { filterImages, createDefaultFilters } from '@/utils/filterUtils'
import './ImageBrowser.css'

interface ImageBrowserProps {
  images: ImageItem[]
  className?: string
}

const ImageBrowser: React.FC<ImageBrowserProps> = ({ images, className = '' }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('grid')
  const [currentSort, setCurrentSort] = useState<SortField>('createdAt')
  const [currentOrder, setCurrentOrder] = useState<SortOrder>('desc')
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>(createDefaultFilters())


  const handleViewChange = useCallback((view: ViewMode) => {
    setCurrentView(view)
  }, [])

  const handleSortChange = useCallback((field: SortField, order: SortOrder) => {
    setCurrentSort(field)
    setCurrentOrder(order)
  }, [])

  const handleFiltersChange = useCallback((filters: FilterOptions) => {
    setCurrentFilters(filters)
  }, [])

  // 先筛选，再排序，并确保没有重复ID
  const filteredAndSortedImages = useMemo(() => {
    // 去重：确保没有重复的图片ID
    const uniqueImages = images.reduce((acc: ImageItem[], current) => {
      const existingIndex = acc.findIndex(img => img.id === current.id)
      if (existingIndex === -1) {
        acc.push(current)
      } else {
        // 如果存在重复ID，保留最新的（基于updatedAt）
        const existing = acc[existingIndex]
        if (new Date(current.updatedAt) > new Date(existing.updatedAt)) {
          acc[existingIndex] = current
        }
      }
      return acc
    }, [])
    
    const filteredImages = filterImages(uniqueImages, currentFilters)
    return getSortedImages(filteredImages, currentSort, currentOrder)
  }, [images, currentFilters, currentSort, currentOrder])

  return (
    <div className={`image-browser ${className}`}>
      {/* 工具栏 */}
      <div className="image-browser-toolbar">
        <div className="image-browser-header">
          <h2 className="image-browser-title">图片库</h2>
          <span className="image-browser-count">
            共 {images.length} 张图片
            {currentFilters.searchTerm || currentFilters.selectedTypes.length > 0 || currentFilters.selectedTags.length > 0 && (
              <span className="image-browser-filter-count">
                (筛选后: {filteredAndSortedImages.length} 张)
              </span>
            )}
          </span>
        </div>
        
        <div className="image-browser-controls">
          {/* 排序功能 */}
          <ImageSorter
            currentSort={currentSort}
            currentOrder={currentOrder}
            onSortChange={handleSortChange}
          />
          
          {/* 视图切换 */}
          <ViewToggle
            currentView={currentView}
            onViewChange={handleViewChange}
          />
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="image-browser-filter-section">
        <ImageFilter
          images={images}
          currentFilters={currentFilters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* 内容区域 */}
      <div className="image-browser-content">
        <div className={`image-browser-view ${currentView === 'grid' ? '' : 'hidden'}`}>
          <ImageGrid 
            images={filteredAndSortedImages}
          />
        </div>
        <div className={`image-browser-view ${currentView === 'list' ? '' : 'hidden'}`}>
          <ImageList images={filteredAndSortedImages} />
        </div>
      </div>
    </div>
  )
}

export default ImageBrowser 