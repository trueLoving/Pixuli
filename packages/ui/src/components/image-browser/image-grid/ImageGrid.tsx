import React, { useState, useCallback, useEffect, useRef } from 'react'
import { ImageItem } from '../../../types/image'
import { Eye, Edit, Trash2, Calendar, Link, HardDrive, Loader2 } from 'lucide-react'
import ImageEditModal from '../components/image-edit/ImageEditModal'
import ImagePreviewModal from '../components/image-preview/ImagePreviewModal'
import ImageUrlModal from '../components/image-url/ImageUrlModal'
import { useInfiniteScroll, useLazyLoad, useEscapeKey } from '../../../hooks'
import { showSuccess, showError, showInfo, showLoading, updateLoadingToSuccess, updateLoadingToError } from '../../../utils/toast'
import { defaultTranslate } from '../../../locales/defaultTranslate'
import './ImageGrid.css'

interface ImageGridProps {
  images: ImageItem[]
  className?: string
  selectedImageIndex?: number
  onImageSelect?: (index: number) => void
  onDeleteImage?: (id: string, name: string) => Promise<void>
  onUpdateImage?: (data: any) => Promise<void>
  getImageDimensionsFromUrl?: (url: string) => Promise<{ width: number; height: number }>
  formatFileSize?: (size: number) => string
  t?: (key: string) => string
}

const ImageGrid: React.FC<ImageGridProps> = ({ 
  images, 
  className = '',
  selectedImageIndex = -1,
  onImageSelect,
  onDeleteImage,
  onUpdateImage,
  getImageDimensionsFromUrl,
  formatFileSize = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`,
  t
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate
  // 滚动加载配置
  const pageSize = 20
  const initialLoadCount = 12
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

  // 当图片列表变化时重置滚动状态
  useEffect(() => {
    // 当图片列表发生变化时，重置滚动状态确保正确同步
    reset()
  }, [images, reset])

  // 获取图片真实尺寸
  const fetchImageDimensions = useCallback(async (image: ImageItem) => {
    if (!getImageDimensionsFromUrl) return
    
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
  }, [getImageDimensionsFromUrl])

  // 当图片变为可见时获取尺寸
  useEffect(() => {
    visibleImages.forEach(imageId => {
      const image = images.find(img => img.id === imageId)
      if (image) {
        // 如果图片尺寸数据不存在或者为0，或者还没有获取过真实尺寸，则获取尺寸
        const hasCachedDimensions = imageDimensions[image.id]
        const isCurrentlyFetching = fetchingDimensions.current.has(image.id)
        
        if (!hasCachedDimensions && !isCurrentlyFetching) {
          fetchImageDimensions(image)
        }
      }
    })
  }, [visibleImages, images, imageDimensions, fetchImageDimensions])

  const handleDelete = useCallback(async (image: ImageItem) => {
    if (confirm(`${translate('image.grid.confirmDelete')} "${image.name}" ${translate('common.confirm')}？`)) {
      if (onDeleteImage) {
        const loadingToast = showLoading(`${translate('image.grid.deleting')} "${image.name}"...`)
        try {
          await onDeleteImage(image.id, image.name)
          updateLoadingToSuccess(loadingToast, `${translate('image.grid.deleteSuccess')} "${image.name}" ${translate('image.grid.deleted')}`)
        } catch (error) {
          updateLoadingToError(loadingToast, `${translate('image.grid.deleteFailed')} "${image.name}" ${translate('image.grid.failed')}: ${error instanceof Error ? error.message : translate('common.unknownError')}`)
        }
      }
    }
  }, [onDeleteImage, translate])

  const handleEdit = useCallback((image: ImageItem) => {
    setSelectedImage(image)
    setShowEditModal(true)
    showInfo(`${translate('image.grid.editing')} "${image.name}"`)
  }, [])

  const handlePreview = useCallback((image: ImageItem) => {
    setSelectedImage(image)
    setShowPreview(true)
    showInfo(`${translate('image.grid.previewing')} "${image.name}"`)
  }, [])

  // 监听预览事件（仅网格视图）
  useEffect(() => {
    const handlePreviewEvent = (event: CustomEvent) => {
      const { image, viewMode } = event.detail
      // 只在网格视图模式下响应
      if (viewMode === 'grid' && image && images.find(img => img.id === image.id)) {
        handlePreview(image)
      }
    }

    window.addEventListener('previewImage', handlePreviewEvent as EventListener)
    return () => {
      window.removeEventListener('previewImage', handlePreviewEvent as EventListener)
    }
  }, [handlePreview, images])

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
    showInfo(translate('image.grid.editCancelled'))
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
      showSuccess(`${type === 'url' ? translate('image.grid.imageUrlCopied') : translate('image.grid.githubUrlCopied')}${translate('image.grid.copiedToClipboard')}`)
    } catch (error) {
      showError(translate('image.grid.copyFailed'))
    }
  }, [])

  const handleOpenUrl = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])


  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }, [])


  
  // 渲染单个图片项
  const renderImageItem = useCallback((image: ImageItem, index: number) => {
    const isSelected = selectedImageIndex === index
    
    return (
      <div
        key={image.id}
        ref={(el) => el && observeElement(el, image.id)}
        data-image-index={index}
        onClick={() => onImageSelect?.(index)}
        className={`image-browser-item ${isSelected ? 'selected' : 'unselected'}`}
      >
        {/* 图片预览 - 懒加载 */}
        <div className="image-grid-preview">
          {/* 选中指示器 */}
          {isSelected && (
            <div className="image-grid-selected-indicator">
              ✓
            </div>
          )}
          <img
            src={image.url}
            alt={image.name}
            className="image-grid-image"
            loading="lazy"
            onClick={(e) => {
              e.stopPropagation()
              onImageSelect?.(index)
            }}
          />
          
          {/* 操作按钮 */}
          <div 
            className="image-grid-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="image-grid-actions">
              <button
                onClick={() => handlePreview(image)}
                className="image-action-button"
                title={translate('image.grid.preview')}
              >
                <Eye className="image-action-icon" />
              </button>
              <button
                onClick={() => handleViewUrl(image)}
                className="image-action-button"
                title="查看地址"
              >
                <Link className="image-action-icon" />
              </button>
              <button
                onClick={() => handleEdit(image)}
                className="image-action-button"
                title={translate('image.grid.edit')}
              >
                <Edit className="image-action-icon" />
              </button>
              <button
                onClick={() => handleDelete(image)}
                className="image-action-button"
                title={translate('image.grid.delete')}
              >
                <Trash2 className="image-action-icon" />
              </button>
            </div>
          </div>
        </div>
        
        {/* 图片信息 */}
        <div 
          className="image-info-section"
          onClick={(e) => {
            e.stopPropagation()
            onImageSelect?.(index)
          }}
        >
          <div className="image-info-content">
            <h3 className="image-grid-title">
              {image.name}
            </h3>
            
            {image.description && (
              <p className="image-grid-description">
                {image.description}
              </p>
            )}
          </div>
          
          <div className="image-info-footer">
            {/* 标签 */}
            {image.tags.length > 0 && (
              <div className="image-grid-tags">
                {image.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={`${image.id}-tag-${index}`}
                    className="image-tag image-tag-primary"
                  >
                    {tag}
                  </span>
                ))}
                {image.tags.length > 3 && (
                  <span className="image-tag image-tag-secondary">
                    +{image.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            
            {/* 图片详情 */}
            <div className="image-grid-meta">
              <span className="image-grid-dimensions">
                {(() => {
                  const dimensions = imageDimensions[image.id]
                  const isCurrentlyFetching = fetchingDimensions.current.has(image.id)
                  
                  if (dimensions) {
                    return `${dimensions.width} × ${dimensions.height}`
                  } else if (image.width > 0 && image.height > 0) {
                    return `${image.width} × ${image.height}`
                  } else if (isCurrentlyFetching) {
                    return translate('image.grid.gettingDimensions')
                  } else {
                    return translate('image.grid.dimensionsUnknown')
                  }
                })()}
              </span>
              {image.size > 0 && (
                <span className="image-grid-size">
                  <HardDrive className="image-grid-meta-icon" />
                  <span>{formatFileSize(image.size)}</span>
                </span>
              )}
            </div>
            
            <div className="image-grid-date">
              <Calendar className="image-grid-meta-icon" />
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
    observeElement,
    selectedImageIndex,
    onImageSelect
  ])

  return (
    <>
      {/* 滚动容器 */}
      <div 
        ref={containerRef}
        className={`image-grid-container ${className}`}
      >
        {/* 图片网格 */}
        <div className="image-grid">
          {visibleItems.map((image, index) => renderImageItem(image, index))}
        </div>

        {/* 加载更多指示器 */}
        {hasMore && (
          <div 
            ref={loadingRef}
            className="image-grid-loading"
          >
            {isLoading ? (
              <div className="image-grid-loading-content">
                <Loader2 className="image-grid-loading-spinner" />
                <span>{translate('image.grid.loadingMore')}</span>
              </div>
            ) : (
              <button
                onClick={loadMore}
                className="image-grid-load-more-button"
              >
                {translate('image.grid.loadMore')}
              </button>
            )}
          </div>
        )}

        {/* 已加载全部提示 */}
        {!hasMore && visibleItems.length > 0 && (
          <div className="image-grid-all-loaded">
            <p>{translate('image.grid.allLoaded')} {visibleItems.length} {translate('image.grid.images')}</p>
          </div>
        )}

        {/* 空状态 */}
        {visibleItems.length === 0 && !isLoading && (
          <div className="image-grid-empty">
            <p>{translate('image.grid.noImages')}</p>
          </div>
        )}
      </div>

      {/* 编辑模态框 */}
      {showEditModal && selectedImage && onUpdateImage && (
        <ImageEditModal
          t={translate}
          image={selectedImage}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdateImage={onUpdateImage}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
          getImageDimensionsFromUrl={getImageDimensionsFromUrl}
        />
      )}

      {/* 预览模态框 */}
      <ImagePreviewModal
        image={selectedImage}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        imageDimensions={imageDimensions}
        formatFileSize={formatFileSize}
        onCopyUrl={handleCopyUrl}
        onOpenUrl={handleOpenUrl}
        t={translate}
      />

      {/* 在线地址模态框 */}
      <ImageUrlModal
        image={selectedImage}
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        imageDimensions={imageDimensions}
        onCopyUrl={handleCopyUrl}
        onOpenUrl={handleOpenUrl}
        t={translate}
      />

    </>
  )
}

export default ImageGrid