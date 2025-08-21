import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Tag, FileText } from 'lucide-react'
import { ImageUploadData } from '@/type/image'
import { useImageStore } from '@/stores/imageStore'

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
      await uploadImage(uploadData)
      setUploadData(null)
      setShowForm(false)
    }
  }

  const handleInputChange = (field: keyof ImageUploadData, value: string | string[]) => {
    if (uploadData) {
      setUploadData({ ...uploadData, [field]: value })
    }
  }

  const handleCancel = () => {
    setUploadData(null)
    setShowForm(false)
  }

  if (showForm && uploadData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">上传图片</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                图片名称
              </label>
              <input
                type="text"
                value={uploadData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="输入图片名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                value={uploadData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="输入图片描述"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <input
                type="text"
                value={uploadData.tags?.join(', ') || ''}
                onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                placeholder="标签用逗号分隔"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                <Upload className="w-4 h-4" />
                <span>{loading ? '上传中...' : '上传图片'}</span>
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
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-gray-400" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? '释放文件以上传' : '拖拽图片到此处或点击选择'}
          </h3>
          <p className="text-sm text-gray-500">
            支持 JPG、PNG、GIF、BMP、WebP、SVG 格式
          </p>
        </div>
      </div>
    </div>
  )
}

export default ImageUpload 