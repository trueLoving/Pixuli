import React, { useState, useCallback, useMemo } from 'react'
import { ImageItem } from '@/type/image'
import ImageGrid from './ImageGrid'
import ImageList from './ImageList'
import ViewToggle, { ViewMode } from './ViewToggle'
import ImageSorter, { SortField, SortOrder } from './ImageSorter'
import ImageFilter, { FilterOptions } from './ImageFilter'
import { getSortedImages } from '@/utils/sortUtils'
import { filterImages, createDefaultFilters } from '@/utils/filterUtils'

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

  // 先筛选，再排序
  const filteredAndSortedImages = useMemo(() => {
    const filteredImages = filterImages(images, currentFilters)
    return getSortedImages(filteredImages, currentSort, currentOrder)
  }, [images, currentFilters, currentSort, currentOrder])

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">图片库</h2>
          <span className="text-sm text-gray-500">
            共 {images.length} 张图片
            {currentFilters.searchTerm || currentFilters.selectedTypes.length > 0 || currentFilters.selectedTags.length > 0 && (
              <span className="ml-2 text-blue-600">
                (筛选后: {filteredAndSortedImages.length} 张)
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
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
      <div className="mb-6">
        <ImageFilter
          images={images}
          currentFilters={currentFilters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1">
        {currentView === 'grid' ? (
          <ImageGrid images={filteredAndSortedImages} />
        ) : (
          <ImageList images={filteredAndSortedImages} />
        )}
      </div>
    </div>
  )
}

export default ImageBrowser 