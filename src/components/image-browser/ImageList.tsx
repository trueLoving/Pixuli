import React, { useState, useCallback, useEffect } from 'react'
import { ImageItem } from '@/types/image'
import { useImageStore } from '@/stores/imageStore'
import { Eye, Edit, Trash2, Tag, Calendar, X, Link, ExternalLink, MoreHorizontal, HardDrive, Loader2 } from 'lucide-react'
import ImageEditModal from '../image-edit/ImageEditModal'
import { useLazyLoad, useInfiniteScroll, useEscapeKey } from '@/hooks'
import { showSuccess, showError, showInfo, showLoading, updateLoadingToSuccess, updateLoadingToError } from '@/utils/toast'
import { getImageDimensionsFromUrl } from '@/utils/imageUtils'
import { formatFileSize } from '@/utils/fileSizeUtils'
import './ImageList.css'

interface ImageListProps {
  images: ImageItem[]
  selectedImageIndex?: number
  onImageSelect?: (index: number) => void
}

const ImageList: React.FC<ImageListProps> = ({ 
  images, 
  selectedImageIndex = -1,
  onImageSelect
}) => {
  const { deleteImage } = useImageStore()
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // 滚动加载配置
  const pageSize = 20
  const initialLoadCount = 15
  
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

  // 当图片列表变化时重置滚动状态
  useEffect(() => {
    // 确保搜索和过滤变化时重置滚动状态
    reset()
  }, [images, reset])

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

  // 监听预览事件（仅列表视图）
  useEffect(() => {
    const handlePreviewEvent = (event: CustomEvent) => {
      const { image, viewMode } = event.detail
      // 只在列表视图模式下响应
      if (viewMode === 'list' && image && images.find(img => img.id === image.id)) {
        handlePreview(image)
      }
    }

    window.addEventListener('previewImage', handlePreviewEvent as EventListener)
    return () => {
      window.removeEventListener('previewImage', handlePreviewEvent as EventListener)
    }
  }, [handlePreview, images])

  const handleEditSuccess = useCallback((image: ImageItem) => {
    showSuccess(`图片 "${image.name}" 信息已成功更新`)
    setShowEditModal(false)
  }, [])

  const handleEditCancel = useCallback(() => {
    showInfo('已取消编辑')
    setShowEditModal(false)
  }, [])

  // ESC 键关闭预览和URL模态框
  useEscapeKey(() => {
    if (showPreview) {
      setShowPreview(false)
    } else if (showUrlModal) {
      setShowUrlModal(false)
    }
  }, showPreview || showUrlModal)

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

  const toggleRowExpansion = useCallback((imageId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }, [])

  // 获取图片真实尺寸
  const fetchImageDimensions = useCallback(async (image: ImageItem) => {
    if (imageDimensions[image.id]) return // 已经获取过了
    
    try {
      const dimensions = await getImageDimensionsFromUrl(image.url)
      setImageDimensions(prev => ({
        ...prev,
        [image.id]: dimensions
      }))
    } catch (error) {
      console.warn(`Failed to get dimensions for ${image.name}:`, error)
    }
  }, [imageDimensions])

  // 当图片变为可见时获取尺寸
  useEffect(() => {
    visibleImages.forEach(imageId => {
      const image = images.find(img => img.id === imageId)
      if (image && (image.width === 0 || image.height === 0)) {
        fetchImageDimensions(image)
      }
    })
  }, [visibleImages, images, fetchImageDimensions])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }, [])

  // 渲染单个图片项的函数
  const renderImageItem = useCallback((image: ImageItem, index: number) => {
    const isSelected = selectedImageIndex === index
    
    return (
      <div
        key={image.id}
        ref={(el) => el && observeElement(el, image.id)}
        data-image-index={index}
        onClick={() => onImageSelect?.(index)}
        className={`image-list-item transition-all duration-200 cursor-pointer ${
          isSelected 
            ? 'bg-blue-100 border-l-4 border-l-blue-600 border-b border-b-blue-300 shadow-md transform scale-[1.02] ring-2 ring-blue-400' 
            : 'bg-white border-b border-gray-100 hover:bg-gray-50'
        }`}
      >
        {/* 主要行 */}
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            {/* 缩略图 */}
            <div className="flex-shrink-0 relative">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                {visibleImages.has(image.id) ? (
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="image-loading-spinner w-6 h-6"></div>
                  </div>
                )}
              </div>
              {/* 选中指示器 */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                  ✓
                </div>
              )}
            </div>

            {/* 基本信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className={`text-sm font-medium truncate ${
                  isSelected ? 'text-blue-900 font-semibold' : 'text-gray-900'
                }`}>
                  {image.name}
                  {isSelected && <span className="ml-2 text-blue-600 text-xs">已选中</span>}
                </h3>
                {image.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {image.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={`${image.id}-tag-${index}`}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {image.tags.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{image.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {image.description && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                  {image.description}
                </p>
              )}

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(image.createdAt)}
                </span>
                <span>
                  {(() => {
                    const dimensions = imageDimensions[image.id]
                    if (dimensions) {
                      return `${dimensions.width} × ${dimensions.height}`
                    } else if (image.width > 0 && image.height > 0) {
                      return `${image.width} × ${image.height}`
                    } else {
                      return '获取中...'
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
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePreview(image)}
                className="image-list-action-button"
                title="预览"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEdit(image)}
                className="image-list-action-button"
                title="编辑"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleRowExpansion(image.id)}
                className="image-list-action-button"
                title="更多操作"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 展开行 - 更多操作和压缩结果 */}
        {expandedRows.has(image.id) && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleViewUrl(image)}
                  className="image-list-secondary-button"
                >
                  <Link className="w-4 h-4 mr-1" />
                  查看地址
                </button>
                <button
                  onClick={() => handleDelete(image)}
                  className="image-list-secondary-button text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }, [
    selectedImageIndex,
    onImageSelect,
    observeElement,
    visibleImages,
    formatDate,
    imageDimensions,
    handlePreview,
    handleEdit,
    toggleRowExpansion,
    expandedRows,
    handleViewUrl,
    handleDelete
  ])


  if (images.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">图片库为空</h3>
          <p className="text-gray-500">开始上传图片，构建您的专属图片库</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 列表头部 */}
      <div className="image-list-header bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">图片列表</h2>
          <div className="text-sm text-gray-500">
            共 {images.length} 张图片
          </div>
        </div>
      </div>

            {/* 列表内容 */}
      <div className="image-list-content">
        <div ref={containerRef} className="h-full overflow-y-auto">
          {visibleItems.map((image, index) => renderImageItem(image, index))}

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
                    if (dimensions) {
                      return `${dimensions.width} × ${dimensions.height}`
                    } else if (selectedImage.width > 0 && selectedImage.height > 0) {
                      return `${selectedImage.width} × ${selectedImage.height}`
                    } else {
                      return '获取中...'
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
          <div className="max-w-2xl w-full mx-4 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">图片在线地址</h3>
              <button
                onClick={() => setShowUrlModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{selectedImage.name}</h4>
                  <p className="text-sm text-gray-500">
                    {(() => {
                      const dimensions = imageDimensions[selectedImage.id]
                      if (dimensions) {
                        return `${dimensions.width} × ${dimensions.height}`
                      } else if (selectedImage.width > 0 && selectedImage.height > 0) {
                        return `${selectedImage.width} × ${selectedImage.height}`
                      } else {
                        return '获取中...'
                      }
                    })()}
                  </p>
                </div>
              </div>

              {/* 图片访问地址 */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">图片访问地址</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={selectedImage.url}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => handleCopyUrl(selectedImage.url, 'url')}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      复制
                    </button>
                    <button
                      onClick={() => handleOpenUrl(selectedImage.url)}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>打开</span>
                    </button>
                  </div>
                </div>

                {/* GitHub 地址 */}
                {selectedImage.githubUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GitHub 地址</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={selectedImage.githubUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => handleCopyUrl(selectedImage.githubUrl, 'githubUrl')}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        复制
                      </button>
                      <button
                        onClick={() => handleOpenUrl(selectedImage.githubUrl)}
                        className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>打开</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ImageList 