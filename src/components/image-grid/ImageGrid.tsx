import React, { useState, useCallback } from 'react'
import { ImageItem } from '@/type/image'
import { useImageStore } from '@/stores/imageStore'
import { Eye, Edit, Trash2, Tag, Calendar, X } from 'lucide-react'
import ImageEditModal from '../image-edit/ImageEditModal'
import { useLazyLoad } from '@/hooks'
import { showSuccess, showError, showInfo, showLoading, updateLoadingToSuccess, updateLoadingToError } from '@/utils/toast'
import './image-grid.css'

interface ImageGridProps {
  images: ImageItem[]
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const { deleteImage } = useImageStore()
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // 使用懒加载 Hook
  const { visibleItems: visibleImages, observeElement } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px'
  })

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

  const handleEditSuccess = useCallback((image: ImageItem) => {
    showSuccess(`图片 "${image.name}" 信息已成功更新`)
    setShowEditModal(false)
  }, [])

  const handleEditCancel = useCallback(() => {
    showInfo('已取消编辑')
    setShowEditModal(false)
  }, [])

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }, [])

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
      {/* 保持原有的网格布局 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            ref={(el) => el && observeElement(el, image.id)}
            className="image-grid-item bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-105 flex flex-col"
          >
            {/* 图片预览 - 懒加载 */}
            <div className="relative aspect-square bg-gray-100 flex-shrink-0">
              {visibleImages.has(image.id) ? (
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="image-loading-spinner w-8 h-8"></div>
                </div>
              )}
              
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
            <div className="image-info-section p-3">
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
              
              <div className="image-info-footer space-y-1">
                {/* 标签 */}
                {image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {image.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
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
                  <span>{image.width} × {image.height}</span>
                  {image.size > 0 && <span>{formatFileSize(image.size)}</span>}
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{formatDate(image.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
                <span>{selectedImage.width} × {selectedImage.height}</span>
                {selectedImage.size > 0 && <span>{formatFileSize(selectedImage.size)}</span>}
                <span>{formatDate(selectedImage.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ImageGrid 