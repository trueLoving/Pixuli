import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Tag, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { ImageUploadData, MultiImageUploadData, BatchUploadProgress } from '@/types/image'
import { useImageStore } from '@/stores/imageStore'
import { showSuccess, showError, showInfo, showLoading, updateLoadingToSuccess, updateLoadingToError } from '@/utils/toast'


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
      showInfo(`已选择图片: ${file.name}`)
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
        showInfo(`已选择 ${acceptedFiles.length} 张图片`)
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

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (multiUploadData) {
      const loadingToast = showLoading(`正在批量上传 ${multiUploadData.files.length} 张图片...`)
      try {
        await uploadMultipleImages(multiUploadData)
        updateLoadingToSuccess(loadingToast, `成功上传 ${multiUploadData.files.length} 张图片！`)
        setMultiUploadData(null)
        setShowForm(false)
        setIsMultiple(false)
      } catch (error) {
        updateLoadingToError(loadingToast, `批量上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const handleMultiInputChange = (field: keyof MultiImageUploadData, value: string | string[]) => {
    if (multiUploadData) {
      setMultiUploadData({ ...multiUploadData, [field]: value })
    }
  }

  const handleCancel = () => {
    showInfo('已取消上传')
    setUploadData(null)
    setMultiUploadData(null)
    setShowForm(false)
    setIsMultiple(false)
  }



  // 批量上传进度显示
  if (batchUploadProgress) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">批量上传进度</h2>
            <div className="text-sm text-gray-500">
              {batchUploadProgress.completed + batchUploadProgress.failed} / {batchUploadProgress.total}
            </div>
          </div>

          {/* 总体进度 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>总体进度</span>
              <span>{Math.round(((batchUploadProgress.completed + batchUploadProgress.failed) / batchUploadProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((batchUploadProgress.completed + batchUploadProgress.failed) / batchUploadProgress.total) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>成功: {batchUploadProgress.completed}</span>
              <span>失败: {batchUploadProgress.failed}</span>
            </div>
          </div>

          {/* 当前上传文件 */}
          {batchUploadProgress.current && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-800">正在上传: {batchUploadProgress.current}</span>
              </div>
            </div>
          )}

          {/* 文件列表 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {batchUploadProgress.items.map((item, index) => (
              <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                <div className="flex-shrink-0">
                  {item.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {item.status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {multiUploadData?.files[index]?.name || `文件 ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-500">{item.message}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {item.progress}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 统一上传表单
  if (showForm && (uploadData || multiUploadData)) {
    const isMultipleUpload = isMultiple && multiUploadData
    const files = isMultipleUpload ? multiUploadData.files : [uploadData!.file]
    const currentData = isMultipleUpload ? multiUploadData : uploadData

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`bg-white rounded-lg p-6 w-full mx-4 max-h-[90vh] overflow-y-auto ${
          isMultipleUpload ? 'max-w-2xl' : 'max-w-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {isMultipleUpload ? `批量上传图片 (${files.length} 张)` : '添加新图片'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={isMultipleUpload ? handleMultiSubmit : handleSubmit} className="space-y-4">
            {/* 文件列表 */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isMultipleUpload ? '图片名称前缀' : '图片名称'} <span className="text-gray-400 text-xs">(可选)</span>
              </label>
              <input
                type="text"
                value={currentData?.name || ''}
                onChange={(e) => isMultipleUpload 
                  ? handleMultiInputChange('name', e.target.value)
                  : handleInputChange('name', e.target.value)
                }
                placeholder={isMultipleUpload 
                  ? "为所有图片添加统一的前缀名称" 
                  : "为图片起个好名字，便于搜索和管理"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图片描述 <span className="text-gray-400 text-xs">(可选)</span>
              </label>
              <textarea
                value={currentData?.description || ''}
                onChange={(e) => isMultipleUpload 
                  ? handleMultiInputChange('description', e.target.value)
                  : handleInputChange('description', e.target.value)
                }
                placeholder={isMultipleUpload 
                  ? "为所有图片添加统一的描述信息" 
                  : "描述图片内容、用途或相关信息"
                }
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
                value={Array.isArray(currentData?.tags) ? currentData.tags.join(', ') : ''}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  isMultipleUpload 
                    ? handleMultiInputChange('tags', tags)
                    : handleInputChange('tags', tags)
                }}
                placeholder={isMultipleUpload 
                  ? "为所有图片添加统一的标签，用逗号分隔" 
                  : "添加标签，用逗号分隔，便于分类和搜索"
                }
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
                    <span>
                      {isMultipleUpload ? `批量上传 (${files.length} 张)` : '上传'}
                    </span>
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
      <input {...getInputProps({})} />
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
            支持 JPG, PNG, GIF, BMP, WebP, SVG 等主流图片格式 • 可同时选择多张图片
          </p>
        </div>
      </div>
    </div>
  )
}

export default ImageUpload 