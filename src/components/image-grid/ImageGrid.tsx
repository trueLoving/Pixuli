import React, { useState } from 'react'
import { ImageItem } from '@/type/image'
import { useImageStore } from '@/stores/imageStore'
import { Eye, Edit, Trash2, Tag, Calendar, ExternalLink, X } from 'lucide-react'
import ImageEditModal from '../image-edit/ImageEditModal'

interface ImageGridProps {
  images: ImageItem[]
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const { deleteImage } = useImageStore()
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleDelete = async (image: ImageItem) => {
    if (confirm(`确定要删除图片 "${image.name}" 吗？`)) {
      await deleteImage(image.id, image.name)
    }
  }

  const handleEdit = (image: ImageItem) => {
    setSelectedImage(image)
    setShowEditModal(true)
  }

  const handlePreview = (image: ImageItem) => {
    setSelectedImage(image)
    setShowPreview(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-105 flex flex-col"
          >
            {/* 图片预览 */}
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
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    title="查看大图"
                  >
                    <Eye className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleEdit(image)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    title="编辑信息"
                  >
                    <Edit className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(image)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    title="删除图片"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* 图片信息 */}
            <div className="p-3">
              <h3 className="font-medium text-gray-900 text-sm mb-1 truncate" title={image.name}>
                {image.name}
              </h3>
              
              {image.description && (
                <p className="text-gray-600 text-xs mb-2 line-clamp-2" title={image.description}>
                  {image.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{image.width} × {image.height}</span>
                {image.size > 0 && <span>{formatFileSize(image.size)}</span>}
              </div>

              {image.tags && image.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {image.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {image.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{image.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(image.createdAt)}
                </span>
                <a
                  href={image.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                  title="在 GitHub 仓库中查看"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
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
          onClose={() => {
            setShowEditModal(false)
            setSelectedImage(null)
          }}
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