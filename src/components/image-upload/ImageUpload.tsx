import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Tag, FileText } from 'lucide-react'
import { ImageUploadData } from '@/type/image'
import { useImageStore } from '@/stores/imageStore'
import { showSuccess, showError, showInfo, showLoading, updateLoadingToSuccess, updateLoadingToError } from '@/utils/toast'

const ImageUpload: React.FC = () => {
  const { uploadImage, loading } = useImageStore()
  const [uploadData, setUploadData] = useState<ImageUploadData | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadData({
        file,
        name: file.name,
        description: '',
        tags: []
      })
      setShowForm(true)
      showInfo(`已选择图片: ${file.name}`)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.svg']
    },
    multiple: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadData) {
      const loadingToast = showLoading(`正在上传图片 "${uploadData.name || uploadData.file.name}"...`)
      try {
        await uploadImage(uploadData)
        updateLoadingToSuccess(loadingToast, `图片 "${uploadData.name || uploadData.file.name}" 上传成功！`)
        setUploadData(null)
        setShowForm(false)
      } catch (error) {
        updateLoadingToError(loadingToast, `上传图片失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const handleInputChange = (field: keyof ImageUploadData, value: string | string[]) => {
    if (uploadData) {
      setUploadData({ ...uploadData, [field]: value })
    }
  }

  const handleCancel = () => {
    showInfo('已取消上传')
    setUploadData(null)
    setShowForm(false)
  }

  if (showForm && uploadData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">添加新图片</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadData.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图片名称 <span className="text-gray-400 text-xs">(可选)</span>
              </label>
              <input
                type="text"
                value={uploadData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="为图片起个好名字，便于搜索和管理"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图片描述 <span className="text-gray-400 text-xs">(可选)</span>
              </label>
              <textarea
                value={uploadData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="描述图片内容、用途或相关信息"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签 <span className="text-gray-400 text-xs">(可选)</span>
              </label>
              <input
                type="text"
                value={Array.isArray(uploadData.tags) ? uploadData.tags.join(', ') : ''}
                onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                placeholder="添加标签，用逗号分隔，便于分类和搜索"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>上传中...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>上传</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-3">
        <div className={`p-3 rounded-full ${
          isDragActive ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <Upload className={`w-6 h-6 ${
            isDragActive ? 'text-blue-600' : 'text-gray-400'
          }`} />
        </div>
        <div>
          <p className={`text-lg font-medium ${
            isDragActive ? 'text-blue-700' : 'text-gray-700'
          }`}>
            {isDragActive ? '释放文件以上传' : '拖拽图片到此处或点击选择'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            支持 JPG, PNG, GIF, BMP, WebP, SVG 等主流图片格式
          </p>
        </div>
      </div>
    </div>
  )
}

export default ImageUpload 