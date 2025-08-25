import React from 'react'
import { Image, Info, AlertCircle, Loader2 } from 'lucide-react'
import { useImageDimensions, useImageInfo } from '@/hooks'
import { formatFileSize } from '@/utils/imageUtils'

interface ImageInfoDisplayProps {
  file: File
}

const ImageInfoDisplay: React.FC<ImageInfoDisplayProps> = ({ file }) => {
  // 使用Hook获取图片尺寸
  const { dimensions, loading: dimensionsLoading, error: dimensionsError } = useImageDimensions(file)
  
  // 使用Hook获取图片详细信息
  const { imageInfo, loading: infoLoading, error: infoError } = useImageInfo(file)

  const isLoading = dimensionsLoading || infoLoading
  const hasError = dimensionsError || infoError

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>正在获取图片信息...</span>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span>获取图片信息失败</span>
      </div>
    )
  }

  if (!dimensions || !imageInfo) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Info className="w-4 h-4" />
        <span>暂无图片信息</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 基本信息 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <Image className="w-4 h-4" />
          <span className="font-medium">图片信息</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">文件名:</span>
            <div className="font-medium truncate">{file.name}</div>
          </div>
          <div>
            <span className="text-gray-500">文件大小:</span>
            <div className="font-medium">{formatFileSize(file.size)}</div>
          </div>
          <div>
            <span className="text-gray-500">文件类型:</span>
            <div className="font-medium">{file.type || '未知'}</div>
          </div>
          <div>
            <span className="text-gray-500">修改时间:</span>
            <div className="font-medium">
              {new Date(file.lastModified).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      {/* 尺寸信息 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-sm text-blue-800 mb-2">
          <Image className="w-4 h-4" />
          <span className="font-medium">尺寸信息</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-blue-600">显示尺寸:</span>
            <div className="font-medium">{dimensions.width} × {dimensions.height}</div>
          </div>
          <div>
            <span className="text-blue-600">原始尺寸:</span>
            <div className="font-medium">{imageInfo.naturalWidth} × {imageInfo.naturalHeight}</div>
          </div>
          <div>
            <span className="text-blue-600">宽高比:</span>
            <div className="font-medium">{imageInfo.aspectRatio.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-blue-600">方向:</span>
            <div className="font-medium">
              {imageInfo.orientation === 'landscape' && '横向'}
              {imageInfo.orientation === 'portrait' && '纵向'}
              {imageInfo.orientation === 'square' && '正方形'}
            </div>
          </div>
        </div>
      </div>

      {/* 预览 */}
      <div className="bg-gray-100 rounded-lg p-3">
        <div className="text-center">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="max-w-full max-h-32 object-contain rounded"
            style={{
              maxWidth: '100%',
              maxHeight: '128px'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ImageInfoDisplay 