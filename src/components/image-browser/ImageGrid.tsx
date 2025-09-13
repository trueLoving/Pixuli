import React, { useState, useCallback, useEffect, useRef } from 'react'
import { ImageItem } from '@/type/image'
import { useImageStore } from '@/stores/imageStore'
import { Eye, Edit, Trash2, Tag, Calendar, X, Link, ExternalLink, HardDrive, Loader2 } from 'lucide-react'
import ImageEditModal from '../image-edit/ImageEditModal'
import { useInfiniteScroll, useLazyLoad } from '@/hooks'
import { showSuccess, showError, showInfo, showLoading, updateLoadingToSuccess, updateLoadingToError } from '@/utils/toast'
import { getImageDimensionsFromUrl } from '@/utils/imageUtils'
import { formatFileSize } from '@/utils/fileSizeUtils'
import './ImageGrid.css'

interface ImageGridProps {
  images: ImageItem[]
  className?: string
}

const ImageGrid: React.FC<ImageGridProps> = ({ 
  images, 
  className = ''
}) => {
  // 滚动加载配置
  const pageSize = 20
  const initialLoadCount = 12
  const { deleteImage } = useImageStore()
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const fetchingDimensions = useRef<Set<string>>(new Set())
  
  // 使用无限滚动Hook
  const {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
    containerRef,
    loadingRef
  } = useInfiniteScroll(images, {
    pageSize,
    initialLoadCount,
    threshold: 0.1,
    rootMargin: '200px'
  })

  // 使用懒加载 Hook
  const { visibleItems: visibleImages, observeElement } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px'
  })

  // 当图片列表变化时重置滚动状态（但只在真正需要时）
  useEffect(() => {
    // 只有在图片列表从空变为有内容，或者完全清空时才重置
    if (images.length === 0) {
      reset()
    }
    // 注意：不在这里重置，让 useInfiniteScroll 自己处理初始加载
  }, [images.length, reset])

  // 获取图片真实尺寸
  const fetchImageDimensions = useCallback(async (image: ImageItem) => {
    // 检查是否已经在获取中
    if (fetchingDimensions.current.has(image.id)) {
      return
    }
    
    // 标记为正在获取
    fetchingDimensions.current.add(image.id)
    
    try {
      const dimensions = await getImageDimensionsFromUrl(image.url)
      
      // 更新状态
      setImageDimensions(prev => ({
        ...prev,
        [image.id]: dimensions
      }))
    } catch (error) {
      console.warn(`Failed to get dimensions for ${image.name}:`, error)
    } finally {
      // 移除获取标记
      fetchingDimensions.current.delete(image.id)
    }
  }, [])

  // 当图片变为可见时获取尺寸
  useEffect(() => {
    visibleImages.forEach(imageId => {
      const image = images.find(img => img.id === imageId)
      if (image) {
        // 如果图片尺寸数据不存在或者为0，或者还没有获取过真实尺寸，则获取尺寸
        const hasValidDimensions = image.width > 0 && image.height > 0
        const hasCachedDimensions = imageDimensions[image.id]
        const isCurrentlyFetching = fetchingDimensions.current.has(image.id)
        
        if (!hasCachedDimensions && !isCurrentlyFetching) {
          fetchImageDimensions(image)
        }
      }
    })
  }, [visibleImages, images, imageDimensions, fetchImageDimensions])

  const handleDelete = useCallback(async (image: ImageItem) => {
    if (confirm(`确定要删除图片 "${image.name}" 吗？`)) {
      const loadingToast = showLoading(`正在删除图片 "${image.name}"...`)
      try {
        await deleteImage(image.id, image.name)
        updateLoadingToSuccess(loadingToast, `图片 "${image.name}" 已成功删除`)
      } catch (error) {
        updateLoadingToError(loadingToast, `删除图片 "${image.name}" 失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }, [deleteImage])

  const handleEdit = useCallback((image: ImageItem) => {
    setSelectedImage(image)
    setShowEditModal(true)
    showInfo(`正在编辑图片 "${image.name}"`)
  }, [])

  const handlePreview = useCallback((image: ImageItem) => {
    setSelectedImage(image)
    setShowPreview(true)
    showInfo(`正在预览图片 "${image.name}"`)
  }, [])

  const handleEditSuccess = useCallback((updatedImage: ImageItem) => {
    showSuccess(`图片 "${updatedImage.name}" 信息已成功更新`)
    // 更新选中的图片数据
    setSelectedImage(updatedImage)
    setShowEditModal(false)
    
    // 添加小延迟后刷新显示（确保异步更新完成）
    setTimeout(() => {
      // 强制重新渲染，这会触发组件重新从 images prop 中获取最新数据
      setSelectedImage(prev => {
        if (prev && prev.id === updatedImage.id) {
          return updatedImage
        }
        return prev
      })
    }, 100)
  }, [])

  const handleEditCancel = useCallback(() => {
    showInfo('已取消编辑')
    setShowEditModal(false)
  }, [])

  const handleViewUrl = useCallback((image: ImageItem) => {
    setSelectedImage(image)
    setShowUrlModal(true)
    showInfo(`查看图片 "${image.name}" 的在线地址`)
  }, [])

  const handleCopyUrl = useCallback(async (url: string, type: 'url' | 'githubUrl') => {
    try {
      await navigator.clipboard.writeText(url)
      showSuccess(`${type === 'url' ? '图片地址' : 'GitHub地址'}已复制到剪贴板`)
    } catch (error) {
      showError('复制失败，请手动复制')
    }
  }, [])

  const handleOpenUrl = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])


  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }, [])


  
  // 渲染单个图片项
  const renderImageItem = useCallback((image: ImageItem) => {
    return (
      <div
        key={image.id}
        ref={(el) => el && observeElement(el, image.id)}
        className="image-browser-item bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-105 flex flex-col"
      >
        {/* 图片预览 - 懒加载 */}
        <div className="relative aspect-square bg-gray-100 flex-shrink-0">
          <img
            src={image.url}
            alt={image.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* 操作按钮 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={() => handlePreview(image)}
                className="image-action-button"
                title="预览"
              >
                <Eye className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => handleViewUrl(image)}
                className="image-action-button"
                title="查看地址"
              >
                <Link className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => handleEdit(image)}
                className="image-action-button"
                title="编辑"
              >
                <Edit className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => handleDelete(image)}
                className="image-action-button"
                title="删除"
              >
                <Trash2 className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
        
        {/* 图片信息 */}
        <div className="image-info-section p-3 flex-1">
          <div className="image-info-content">
            <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
              {image.name}
            </h3>
            
            {image.description && (
              <p className="text-gray-500 text-xs mb-2 line-clamp-2">
                {image.description}
              </p>
            )}
          </div>
          
          <div className="image-info-footer space-y-1 mt-auto">
            {/* 标签 */}
            {image.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {image.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={`${image.id}-tag-${index}`}
                    className="image-tag bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
                {image.tags.length > 3 && (
                  <span className="image-tag bg-gray-100 text-gray-600">
                    +{image.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            
            {/* 图片详情 */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {(() => {
                  const dimensions = imageDimensions[image.id]
                  const isCurrentlyFetching = fetchingDimensions.current.has(image.id)
                  
                  if (dimensions) {
                    // 优先显示获取到的真实尺寸
                    return `${dimensions.width} × ${dimensions.height}`
                  } else if (image.width > 0 && image.height > 0) {
                    // 如果有存储的尺寸且不在获取中，显示存储的尺寸
                    return `${image.width} × ${image.height}`
                  } else if (isCurrentlyFetching) {
                    // 正在获取中
                    return '获取中...'
                  } else {
                    // 没有尺寸数据
                    return '尺寸未知'
                  }
                })()}
              </span>
              {image.size > 0 && (
                <span className="flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span>{formatFileSize(image.size)}</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{formatDate(image.createdAt)}</span>
            </div>

          </div>
        </div>
      </div>
    )
  }, [
    imageDimensions,
    handlePreview,
    handleViewUrl,
    handleEdit,
    handleDelete,
    formatDate,
    observeElement
  ])

  return (
    <>
      {/* 滚动容器 */}
      <div 
        ref={containerRef}
        className={`h-full overflow-y-auto ${className}`}
      >
        {/* 图片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4">
          {visibleItems.map(renderImageItem)}
        </div>

        {/* 加载更多指示器 */}
        {hasMore && (
          <div 
            ref={loadingRef}
            className="flex items-center justify-center py-8"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>正在加载更多图片...</span>
              </div>
            ) : (
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                加载更多
              </button>
            )}
          </div>
        )}

        {/* 已加载全部提示 */}
        {!hasMore && visibleItems.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>已加载全部 {visibleItems.length} 张图片</p>
          </div>
        )}

        {/* 空状态 */}
        {visibleItems.length === 0 && !isLoading && (
          <div className="text-center py-16 text-gray-500">
            <p>暂无图片</p>
          </div>
        )}
      </div>

      {/* 编辑模态框 */}
      {showEditModal && selectedImage && (
        <ImageEditModal
          image={selectedImage}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
        />
      )}

      {/* 预览模态框 */}
      {showPreview && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-full p-4">
            <div className="relative">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            <div className="mt-4 text-center text-white">
              <h3 className="text-lg font-medium mb-2">{selectedImage.name}</h3>
              {selectedImage.description && (
                <p className="text-gray-300 mb-2">{selectedImage.description}</p>
              )}
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-300 mb-3">
                <span>
                  {(() => {
                    const dimensions = imageDimensions[selectedImage.id]
                    const isCurrentlyFetching = fetchingDimensions.current.has(selectedImage.id)
                    
                    if (dimensions) {
                      // 优先显示获取到的真实尺寸
                      return `${dimensions.width} × ${dimensions.height}`
                    } else if (selectedImage.width > 0 && selectedImage.height > 0) {
                      // 显示存储的尺寸
                      return `${selectedImage.width} × ${selectedImage.height}`
                    } else if (isCurrentlyFetching) {
                      // 正在获取中
                      return '获取中...'
                    } else {
                      // 没有尺寸数据
                      return '尺寸未知'
                    }
                  })()}
                </span>
                {selectedImage.size > 0 && <span>{formatFileSize(selectedImage.size)}</span>}
                <span>{formatDate(selectedImage.createdAt)}</span>
              </div>
              
              {/* 在线地址信息 */}
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => handleCopyUrl(selectedImage.url, 'url')}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Link className="w-3 h-3" />
                  <span>复制地址</span>
                </button>
                <button
                  onClick={() => handleOpenUrl(selectedImage.url)}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>打开地址</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 在线地址模态框 */}
      {showUrlModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                图片在线地址
              </h3>
              <button
                onClick={() => setShowUrlModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图片地址
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={selectedImage.url}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => handleCopyUrl(selectedImage.url, 'url')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    复制
                  </button>
                  <button
                    onClick={() => handleOpenUrl(selectedImage.url)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    打开
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub地址
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={selectedImage.githubUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => handleCopyUrl(selectedImage.githubUrl, 'githubUrl')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    复制
                  </button>
                  <button
                    onClick={() => handleOpenUrl(selectedImage.githubUrl)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    打开
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default ImageGrid