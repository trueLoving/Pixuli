import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Tag, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { ImageUploadData, MultiImageUploadData } from '@/types/image'
import { useImageStore } from '@/stores/imageStore'
import { showToast } from '@/utils/toast'

const ImageUpload: React.FC = () => {
  const { uploadImage, uploadMultipleImages, loading, batchUploadProgress } = useImageStore()
  const [uploadData, setUploadData] = useState<ImageUploadData | null>(null)
  const [multiUploadData, setMultiUploadData] = useState<MultiImageUploadData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isMultiple, setIsMultiple] = useState(false)
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (acceptedFiles.length === 1) {
        // 单张图片上传
        const file = acceptedFiles[0]
        setUploadData({
          file,
          name: file.name,
          description: '',
          tags: []
        })
        setIsMultiple(false)
        setShowForm(true)
        showToast.info(`已选择图片: ${file.name}`)
      } else {
        // 多张图片上传
        setMultiUploadData({
          files: acceptedFiles,
          name: '',
          description: '',
          tags: []
        })
        setIsMultiple(true)
        setShowForm(true)
        showToast.info(`已选择 ${acceptedFiles.length} 张图片`)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.svg']
    },
    multiple: true, // 始终允许多选，根据文件数量决定处理方式
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {}
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadData) {
      showToast.loading(`正在上传图片 "${uploadData.name || uploadData.file.name}"...`)
      try {
        await uploadImage(uploadData)
        showToast.success(`图片 "${uploadData.name || uploadData.file.name}" 上传成功！`)
        setUploadData(null)
        setShowForm(false)
      } catch (error) {
        showToast.error(`上传图片失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const handleInputChange = (field: keyof ImageUploadData, value: string | string[]) => {
    if (uploadData) {
      setUploadData({ ...uploadData, [field]: value })
    }
  }

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (multiUploadData) {
      showToast.loading(`正在批量上传 ${multiUploadData.files.length} 张图片...`)
      try {
        await uploadMultipleImages(multiUploadData)
        showToast.success(`成功上传 ${multiUploadData.files.length} 张图片！`)
        setMultiUploadData(null)
        setShowForm(false)
        setIsMultiple(false)
      } catch (error) {
        showToast.error(`批量上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const handleMultiInputChange = (field: keyof MultiImageUploadData, value: string | string[]) => {
    if (multiUploadData) {
      setMultiUploadData({ ...multiUploadData, [field]: value })
    }
  }

  const handleCancel = () => {
    showToast.info('已取消上传')
    setUploadData(null)
    setMultiUploadData(null)
    setShowForm(false)
    setIsMultiple(false)
  }

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    if (uploadData) {
      handleInputChange('tags', tags)
    } else if (multiUploadData) {
      handleMultiInputChange('tags', tags)
    }
  }

  const getTagValue = () => {
    if (uploadData) {
      return uploadData.tags?.join(', ') || ''
    } else if (multiUploadData) {
      return multiUploadData.tags?.join(', ') || ''
    }
    return ''
  }

  return (
    <div className="space-y-4">
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${loading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors
            ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? '释放文件以上传' : '拖拽图片到此处或点击选择'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              支持 JPG、PNG、GIF、BMP、WebP、SVG 格式
            </p>
          </div>
        </div>
      </div>

      {/* 批量上传进度 */}
      {batchUploadProgress && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">批量上传进度</h3>
            <span className="text-sm text-gray-500">
              {batchUploadProgress.completed + batchUploadProgress.failed} / {batchUploadProgress.total}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((batchUploadProgress.completed + batchUploadProgress.failed) / batchUploadProgress.total) * 100}%` 
              }}
            />
          </div>
          
          {batchUploadProgress.current && (
            <p className="text-xs text-gray-600">
              正在上传: {batchUploadProgress.current}
            </p>
          )}
          
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {batchUploadProgress.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-2 text-xs">
                {item.status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                {item.status === 'success' && <CheckCircle className="w-3 h-3 text-green-600" />}
                {item.status === 'error' && <AlertCircle className="w-3 h-3 text-red-600" />}
                <span className={`flex-1 truncate ${
                  item.status === 'error' ? 'text-red-600' : 
                  item.status === 'success' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {item.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上传表单 */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">
              {isMultiple ? '批量上传设置' : '图片上传设置'}
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isMultiple ? (
            <form onSubmit={handleMultiSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  批量名称前缀
                </label>
                <input
                  type="text"
                  value={multiUploadData?.name || ''}
                  onChange={(e) => handleMultiInputChange('name', e.target.value)}
                  placeholder="可选，用于批量命名图片"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  描述
                </label>
                <textarea
                  value={multiUploadData?.description || ''}
                  onChange={(e) => handleMultiInputChange('description', e.target.value)}
                  placeholder="为这批图片添加描述"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="w-4 h-4 inline mr-1" />
                  标签
                </label>
                <input
                  type="text"
                  value={getTagValue()}
                  onChange={(e) => handleTagInput(e.target.value)}
                  placeholder="用逗号分隔多个标签"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3">
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
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>开始批量上传</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  图片名称
                </label>
                <input
                  type="text"
                  value={uploadData?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="可选，留空使用原文件名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  描述
                </label>
                <textarea
                  value={uploadData?.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="为图片添加描述"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="w-4 h-4 inline mr-1" />
                  标签
                </label>
                <input
                  type="text"
                  value={getTagValue()}
                  onChange={(e) => handleTagInput(e.target.value)}
                  placeholder="用逗号分隔多个标签"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3">
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
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>上传图片</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageUpload
