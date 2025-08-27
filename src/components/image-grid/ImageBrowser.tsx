import React, { useState, useCallback } from 'react'
import { ImageItem } from '@/type/image'
import ImageGrid from './ImageGrid'
import ImageList from './ImageList'
import ViewToggle, { ViewMode } from './ViewToggle'

interface ImageBrowserProps {
  images: ImageItem[]
  className?: string
}

const ImageBrowser: React.FC<ImageBrowserProps> = ({ images, className = '' }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('grid')

  const handleViewChange = useCallback((view: ViewMode) => {
    setCurrentView(view)
  }, [])

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
        
        {/* 视图切换 */}
        <ViewToggle
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1">
        {currentView === 'grid' ? (
          <ImageGrid images={images} />
        ) : (
          <ImageList images={images} />
        )}
      </div>
    </div>
  )
}

export default ImageBrowser 