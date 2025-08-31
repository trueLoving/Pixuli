import React, { useState, useCallback, useEffect } from 'react'
import { ImageItem } from '@/type/image'
import { useImageStore } from '@/stores/imageStore'
import { Eye, Edit, Trash2, Tag, Calendar, X, Link, ExternalLink, Zap, Download, RotateCcw, HardDrive } from 'lucide-react'
import ImageEditModal from '../image-edit/ImageEditModal'
import { useLazyLoad } from '@/hooks'
import { showSuccess, showError, showInfo, showLoading, updateLoadingToSuccess, updateLoadingToError } from '@/utils/toast'
import { getImageDimensionsFromUrl } from '@/utils/imageUtils'
import { formatFileSize } from '@/utils/fileSizeUtils'
import { compressImage, getAutoCompressionOptions } from '@/utils/imageCompression'
import './image-grid.css'

interface ImageGridProps {
  images: ImageItem[]
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const { deleteImage } = useImageStore()
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const [compressingImages, setCompressingImages] = useState<Set<string>>(new Set())
  const [compressionResults, setCompressionResults] = useState<Record<string, any>>({})
  const [replacingImages, setReplacingImages] = useState<Set<string>>(new Set())
  
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

  // 压缩单张图片
  const handleCompressImage = useCallback(async (image: ImageItem) => {
    if (compressingImages.has(image.id)) return
    
    setCompressingImages(prev => new Set(prev).add(image.id))
    
    try {
      // 从URL获取图片文件
      const response = await fetch(image.url)
      const blob = await response.blob()
      const file = new File([blob], image.name, { type: blob.type })
      
      // 获取自动压缩选项
      const options = getAutoCompressionOptions(file.size)
      
      // 执行压缩
      const result = await compressImage(file, options)
      
      // 保存压缩结果
      setCompressionResults(prev => ({
        ...prev,
        [image.id]: result
      }))
      
      if (result.compressionRatio > 0) {
        showSuccess(`图片 "${image.name}" 压缩成功！节省了 ${result.compressionRatio.toFixed(1)}% 的空间`)
      } else {
        showInfo(`图片 "${image.name}" 已经是最优大小`)
      }
    } catch (error) {
      showError(`压缩图片 "${image.name}" 失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setCompressingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(image.id)
        return newSet
      })
    }
  }, [compressingImages])

  // 重新上传压缩后的图片（覆盖原图）
  const handleReplaceWithCompressed = useCallback(async (image: ImageItem) => {
    const result = compressionResults[image.id]
    if (!result) {
      showError('没有找到压缩后的图片')
      return
    }

    if (confirm(`确定要用压缩后的图片替换原图 "${image.name}" 吗？\n\n原图大小: ${formatFileSize(result.originalSize)}\n压缩后大小: ${formatFileSize(result.compressedSize)}\n节省空间: ${result.compressionRatio.toFixed(1)}%`)) {
      setReplacingImages(prev => new Set(prev).add(image.id))
      
      try {
        // 创建新的上传数据
        const uploadData = {
          file: result.compressedFile,
          name: image.name,
          description: image.description || '',
          tags: image.tags || []
        }
        
        // 先上传压缩版本，确保成功后再删除原图
        const { uploadImage } = useImageStore.getState()
        const loadingToast = showLoading(`正在上传压缩版本 "${image.name}"...`)
        
        try {
          await uploadImage(uploadData)
          updateLoadingToSuccess(loadingToast, `压缩版本上传成功！`)
          
          // 上传成功后，删除原图
          const deleteToast = showLoading(`正在删除原图 "${image.name}"...`)
          try {
            await deleteImage(image.id, image.name)
            updateLoadingToSuccess(deleteToast, `原图删除成功！`)
            
            // 清理压缩结果
            setCompressionResults(prev => {
              const newResults = { ...prev }
              delete newResults[image.id]
              return newResults
            })
            
            showSuccess(`图片 "${image.name}" 已成功替换为压缩版本！`)
          } catch (deleteError) {
            updateLoadingToError(deleteToast, `删除原图失败: ${deleteError instanceof Error ? deleteError.message : '未知错误'}`)
            showError('压缩版本已上传，但删除原图失败。请手动删除原图。')
          }
        } catch (uploadError) {
          updateLoadingToError(loadingToast, `上传压缩版本失败: ${uploadError instanceof Error ? uploadError.message : '未知错误'}`)
          throw uploadError // 重新抛出错误，让外层catch处理
        }
      } catch (error) {
        showError(`替换图片失败: ${error instanceof Error ? error.message : '未知错误'}`)
      } finally {
        setReplacingImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(image.id)
          return newSet
        })
      }
    }
  }, [compressionResults, deleteImage])

  // 下载压缩后的图片
  const handleDownloadCompressed = useCallback((image: ImageItem) => {
    const result = compressionResults[image.id]
    if (!result) return
    
    const url = URL.createObjectURL(result.compressedFile)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed_${image.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showSuccess('压缩后的图片已开始下载')
  }, [compressionResults])

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
                    onClick={() => handleViewUrl(image)}
                    className="image-action-button"
                    title="查看地址"
                  >
                    <Link className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleCompressImage(image)}
                    disabled={compressingImages.has(image.id)}
                    className="image-action-button"
                    title="压缩图片"
                  >
                    {compressingImages.has(image.id) ? (
                      <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Zap className="w-4 h-4 text-gray-700" />
                    )}
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
                
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{formatDate(image.createdAt)}</span>
                </div>

                {/* 压缩结果显示 */}
                {compressionResults[image.id] && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-green-700">
                        <Zap className="w-3 h-3" />
                        <span>压缩完成</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleDownloadCompressed(image)}
                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          title="下载压缩后图片"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleReplaceWithCompressed(image)}
                          disabled={replacingImages.has(image.id)}
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          title="用压缩版本替换原图"
                        >
                          {replacingImages.has(image.id) ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      节省 {compressionResults[image.id].compressionRatio.toFixed(1)}% 空间
                      ({formatFileSize(compressionResults[image.id].originalSize)} → {formatFileSize(compressionResults[image.id].compressedSize)})
                    </div>
                  </div>
                )}
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

export default ImageGrid 