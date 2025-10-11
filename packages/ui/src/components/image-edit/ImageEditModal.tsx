import React, { useState, useEffect } from 'react'
import type { ImageItem, ImageEditData } from '../../types/image'
import { X, Save } from 'lucide-react'
import { showLoading, updateLoadingToSuccess, updateLoadingToError } from '../../utils/toast'

interface ImageEditModalProps {
  image: ImageItem
  isOpen: boolean
  onClose: () => void
  onUpdateImage: (data: ImageEditData) => Promise<void>
  onSuccess?: (image: ImageItem) => void
  onCancel?: () => void
  loading?: boolean
  getImageDimensionsFromUrl?: (url: string) => Promise<{ width: number; height: number }>
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ 
  image, 
  isOpen, 
  onClose, 
  onUpdateImage,
  onSuccess, 
  onCancel,
  loading = false,
  getImageDimensionsFromUrl
}) => {
  const [formData, setFormData] = useState<ImageEditData>({
    id: image.id,
    name: image.name,
    description: image.description || '',
    tags: image.tags || []
  })
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  // ESC 键关闭编辑模态框
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const loadingToast = showLoading(`正在更新图片 "${image.name}" 信息...`)
    try {
      await onUpdateImage(formData)
      updateLoadingToSuccess(loadingToast, `图片 "${image.name}" 信息已成功更新`)
      if (onSuccess) {
        // 构建更新后的图片数据
        const updatedImage = {
          ...image,
          id: formData.name || image.id,
          name: formData.name || image.name,
          description: formData.description || image.description,
          tags: formData.tags || image.tags,
          updatedAt: new Date().toISOString()
        }
        onSuccess(updatedImage)
      } else {
        onClose()
      }
    } catch (error) {
      updateLoadingToError(loadingToast, `更新图片信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
      onClose()
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  const handleInputChange = (field: keyof ImageEditData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 获取图片真实尺寸
  useEffect(() => {
    if (isOpen && image && getImageDimensionsFromUrl && (image.width === 0 || image.height === 0)) {
      getImageDimensionsFromUrl(image.url)
        .then(dimensions => {
          setImageDimensions(dimensions)
        })
        .catch(error => {
          console.warn(`Failed to get dimensions for ${image.name}:`, error)
        })
    }
  }, [isOpen, image, getImageDimensionsFromUrl])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">编辑图片信息</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 图片预览 */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <img
              src={image.url}
              alt={image.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {image.name}
              </p>
              <p className="text-xs text-gray-500">
                尺寸: {(() => {
                  if (imageDimensions) {
                    return `${imageDimensions.width} × ${imageDimensions.height}`
                  } else if (image.width > 0 && image.height > 0) {
                    return `${image.width} × ${image.height}`
                  } else {
                    return '获取中...'
                  }
                })()}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图片名称 <span className="text-gray-400 text-xs">(可选)</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="为图片起个好名字，便于搜索和管理"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图片描述 <span className="text-gray-400 text-xs">(可选)</span>
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="描述图片内容、用途或相关信息"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签 <span className="text-gray-400 text-xs">(可选)</span>
            </label>
            <input
              type="text"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              placeholder="添加标签，用逗号分隔，便于分类和搜索"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              例如：风景, 自然, 山水, 摄影
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? '保存中...' : '保存更改'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ImageEditModal
