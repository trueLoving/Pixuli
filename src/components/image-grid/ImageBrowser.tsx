import React, { useState, useCallback, useMemo } from 'react'
import { ImageItem } from '@/type/image'
import ImageGrid from './ImageGrid'
import ImageList from './ImageList'
import ViewToggle, { ViewMode } from './ViewToggle'
import ImageSorter, { SortField, SortOrder } from './ImageSorter'
import { getSortedImages } from '@/utils/sortUtils'

interface ImageBrowserProps {
  images: ImageItem[]
  className?: string
}

const ImageBrowser: React.FC<ImageBrowserProps> = ({ images, className = '' }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('grid')
  const [currentSort, setCurrentSort] = useState<SortField>('createdAt')
  const [currentOrder, setCurrentOrder] = useState<SortOrder>('desc')

  const handleViewChange = useCallback((view: ViewMode) => {
    setCurrentView(view)
  }, [])

  const handleSortChange = useCallback((field: SortField, order: SortOrder) => {
    setCurrentSort(field)
    setCurrentOrder(order)
  }, [])

  // 根据当前排序设置对图片进行排序
  const sortedImages = useMemo(() => {
    return getSortedImages(images, currentSort, currentOrder)
  }, [images, currentSort, currentOrder])

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">图片库</h2>
          <span className="text-sm text-gray-500">
            共 {images.length} 张图片
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

      {/* 内容区域 */}
      <div className="flex-1">
        {currentView === 'grid' ? (
          <ImageGrid images={sortedImages} />
        ) : (
          <ImageList images={sortedImages} />
        )}
      </div>
    </div>
  )
}

export default ImageBrowser 