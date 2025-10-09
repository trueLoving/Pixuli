import React, { useState, useCallback, useMemo, useEffect } from 'react'
import type { ImageItem } from '@/types/image'
import ImageGrid from './ImageGrid'
import ImageList from './ImageList'
import ViewToggle, { type ViewMode } from './ViewToggle'
import ImageSorter, { type SortField, type SortOrder } from './ImageSorter'
import ImageFilter, { type FilterOptions } from './ImageFilter'
import { getSortedImages } from '@/utils/sortUtils'
import { filterImages, createDefaultFilters } from '@/utils/filterUtils'
import { keyboardManager, COMMON_SHORTCUTS, SHORTCUT_CATEGORIES } from '@/utils/keyboardShortcuts'
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1)


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

  // 预览选中的图片
  const handlePreviewSelectedImage = useCallback(() => {
    if (selectedImageIndex >= 0 && selectedImageIndex < filteredAndSortedImages.length) {
      const selectedImage = filteredAndSortedImages[selectedImageIndex]
      // 发送预览事件，包含当前视图模式
      const event = new CustomEvent('previewImage', { 
        detail: { 
          image: selectedImage, 
          viewMode: currentView 
        } 
      })
      window.dispatchEvent(event)
    }
  }, [selectedImageIndex, filteredAndSortedImages, currentView])

  // 获取网格视图的列数
  const getGridColumnsPerRow = useCallback(() => {
    // 根据屏幕宽度动态计算列数
    const screenWidth = window.innerWidth
    if (screenWidth >= 1536) return 6 // 2xl: 6列
    if (screenWidth >= 1280) return 5 // xl: 5列
    if (screenWidth >= 1024) return 4 // lg: 4列
    if (screenWidth >= 768) return 3  // md: 3列
    if (screenWidth >= 640) return 2  // sm: 2列
    return 1 // 默认1列
  }, [])

  // 滚动到选中项的函数
  const scrollToSelectedItem = useCallback((index: number) => {
    // 使用 setTimeout 确保 DOM 更新完成后再滚动
    setTimeout(() => {
      const selectedElement = document.querySelector(`[data-image-index="${index}"]`)
      if (selectedElement) {
        // 尝试找到滚动容器
        const scrollContainer = selectedElement.closest('.h-full.overflow-y-auto') || 
                               selectedElement.closest('.image-browser-content') ||
                               selectedElement.closest('.image-browser-view')
        
        if (scrollContainer) {
          // 如果找到了滚动容器，计算选中元素相对于容器的位置
          const containerRect = scrollContainer.getBoundingClientRect()
          const elementRect = selectedElement.getBoundingClientRect()
          const containerScrollTop = scrollContainer.scrollTop
          
          // 计算需要滚动的距离，让元素居中显示
          const elementCenterRelativeToContainer = elementRect.top - containerRect.top + elementRect.height / 2
          const containerCenter = containerRect.height / 2
          const scrollDistance = containerScrollTop + elementCenterRelativeToContainer - containerCenter
          
          scrollContainer.scrollTo({
            top: scrollDistance,
            behavior: 'smooth'
          })
        } else {
          // 如果没有找到滚动容器，使用默认的 scrollIntoView
          selectedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          })
        }
      }
    }, 100)
  }, [])

  // 键盘导航功能
  const navigateImages = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (filteredAndSortedImages.length === 0) return

    let newIndex = selectedImageIndex
    const totalImages = filteredAndSortedImages.length

    switch (direction) {
      case 'up':
        if (currentView === 'grid') {
          // 网格视图：向上移动一行
          const colsPerRow = getGridColumnsPerRow()
          newIndex = Math.max(0, selectedImageIndex - colsPerRow)
        } else {
          // 列表视图：上一个
          newIndex = Math.max(0, selectedImageIndex - 1)
        }
        break
      case 'down':
        if (currentView === 'grid') {
          // 网格视图：向下移动一行
          const colsPerRow = getGridColumnsPerRow()
          newIndex = Math.min(totalImages - 1, selectedImageIndex + colsPerRow)
        } else {
          // 列表视图：下一个
          newIndex = Math.min(totalImages - 1, selectedImageIndex + 1)
        }
        break
      case 'left':
        if (currentView === 'grid') {
          // 网格视图：向左移动
          newIndex = Math.max(0, selectedImageIndex - 1)
        }
        break
      case 'right':
        if (currentView === 'grid') {
          // 网格视图：向右移动
          newIndex = Math.min(totalImages - 1, selectedImageIndex + 1)
        }
        break
    }

    setSelectedImageIndex(newIndex)
    scrollToSelectedItem(newIndex)
  }, [selectedImageIndex, filteredAndSortedImages.length, currentView, getGridColumnsPerRow, scrollToSelectedItem])

  // 处理图片选择的通用函数
  const handleImageSelect = useCallback((index: number) => {
    setSelectedImageIndex(index)
    scrollToSelectedItem(index)
  }, [scrollToSelectedItem])

  // 键盘快捷键注册
  useEffect(() => {
    const shortcuts = [
      {
        key: COMMON_SHORTCUTS.ARROW_UP,
        description: '选择上一张图片',
        action: () => navigateImages('up'),
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER
      },
      {
        key: COMMON_SHORTCUTS.ARROW_DOWN,
        description: '选择下一张图片',
        action: () => navigateImages('down'),
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER
      },
      {
        key: COMMON_SHORTCUTS.ARROW_LEFT,
        description: '选择左侧图片',
        action: () => navigateImages('left'),
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER
      },
      {
        key: COMMON_SHORTCUTS.ARROW_RIGHT,
        description: '选择右侧图片',
        action: () => navigateImages('right'),
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER
      },
       {
         key: COMMON_SHORTCUTS.ENTER,
         description: '打开选中的图片',
         action: handlePreviewSelectedImage,
         category: SHORTCUT_CATEGORIES.IMAGE_BROWSER
       },
      {
        key: COMMON_SHORTCUTS.V,
        ctrlKey: true,
        description: '切换视图模式',
        action: () => {
          setCurrentView(prev => prev === 'grid' ? 'list' : 'grid')
        },
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER
      }
    ]

    keyboardManager.registerBatch(shortcuts)

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut))
    }
   }, [navigateImages, handlePreviewSelectedImage, selectedImageIndex, filteredAndSortedImages.length])

  // 当图片列表变化时，重置选中索引并滚动到选中项
  useEffect(() => {
    if (filteredAndSortedImages.length > 0) {
      // 如果当前选中索引超出范围，重置为0
      if (selectedImageIndex >= filteredAndSortedImages.length) {
        setSelectedImageIndex(0)
        scrollToSelectedItem(0)
      }
      // 如果当前没有选中任何图片（-1），选中第一张
      else if (selectedImageIndex < 0) {
        setSelectedImageIndex(0)
        scrollToSelectedItem(0)
      }
      // 如果当前有选中的图片，确保它在可视范围内
      else if (selectedImageIndex >= 0) {
        scrollToSelectedItem(selectedImageIndex)
      }
    } else {
      // 如果没有图片，重置为-1
      setSelectedImageIndex(-1)
    }
  }, [filteredAndSortedImages.length, selectedImageIndex, scrollToSelectedItem])

  // 监听来自主应用的视图切换事件
  useEffect(() => {
    const handleToggleViewMode = () => {
      setCurrentView(prev => prev === 'grid' ? 'list' : 'grid')
    }

    window.addEventListener('toggleViewMode', handleToggleViewMode)
    return () => {
      window.removeEventListener('toggleViewMode', handleToggleViewMode)
    }
  }, [])

  // 组件初始化时，如果有选中的图片，滚动到它
  useEffect(() => {
    if (selectedImageIndex >= 0 && filteredAndSortedImages.length > 0) {
      scrollToSelectedItem(selectedImageIndex)
    }
  }, []) // 空依赖数组，只在组件挂载时执行一次

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
            selectedImageIndex={selectedImageIndex}
            onImageSelect={handleImageSelect}
          />
        </div>
        <div className={`image-browser-view ${currentView === 'list' ? '' : 'hidden'}`}>
          <ImageList 
            images={filteredAndSortedImages}
            selectedImageIndex={selectedImageIndex}
            onImageSelect={handleImageSelect}
          />
         </div>
       </div>

     </div>
  )
}

export default ImageBrowser 