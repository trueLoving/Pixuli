import React, { useState, useCallback } from 'react'
import { Zap, Upload, Download, Settings, X } from 'lucide-react'
import { 
  CompressionOptions, 
  DEFAULT_COMPRESSION_OPTIONS, 
  compressImage, 
  getAutoCompressionOptions,
  isImageFile 
} from '@/utils/imageCompression'
import ImageCompressionSettings from './ImageCompressionSettings'
import ImageCompressionPreview from './ImageCompressionPreview'
import { showSuccess, showError, showInfo } from '@/utils/toast'
import './ImageCompression.css'

interface ImageCompressionProps {
  onClose: () => void
}

const ImageCompression: React.FC<ImageCompressionProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>(DEFAULT_COMPRESSION_OPTIONS)
  const [compressionResult, setCompressionResult] = useState<any>(null)
  const [isCompressing, setIsCompressing] = useState(false)

  // 处理文件选择
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!isImageFile(file)) {
        showError('请选择有效的图片文件')
        return
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB限制
        showError('文件大小不能超过50MB')
        return
      }
      
      setSelectedFile(file)
      setCompressionResult(null)
      
      // 自动优化设置
      const autoOptions = getAutoCompressionOptions(file.size)
      setCompressionOptions(autoOptions)
      
      showInfo(`已选择图片: ${file.name}`)
    }
  }, [])

  // 处理拖拽
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    
    if (files.length > 1) {
      showError('一次只能处理一张图片')
      return
    }
    
    const file = files[0]
    if (file && isImageFile(file)) {
      if (file.size > 50 * 1024 * 1024) {
        showError('文件大小不能超过50MB')
        return
      }
      
      setSelectedFile(file)
      setCompressionResult(null)
      
      // 自动优化设置
      const autoOptions = getAutoCompressionOptions(file.size)
      setCompressionOptions(autoOptions)
      
      showInfo(`已选择图片: ${file.name}`)
    } else {
      showError('请选择有效的图片文件')
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  // 执行压缩
  const handleCompress = useCallback(async () => {
    if (!selectedFile) return
    
    setIsCompressing(true)
    try {
      const result = await compressImage(selectedFile, compressionOptions)
      setCompressionResult(result)
      
      if (result.compressionRatio > 0) {
        showSuccess(`压缩成功！节省了 ${result.compressionRatio.toFixed(1)}% 的空间`)
      } else {
        showInfo('图片已经是最优大小，无需进一步压缩')
      }
    } catch (error) {
      showError(`压缩失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsCompressing(false)
    }
  }, [selectedFile, compressionOptions])

  // 下载压缩后的图片
  const handleDownload = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed_${file.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showSuccess('压缩后的图片已开始下载')
  }, [])

  // 重新压缩
  const handleRetry = useCallback(() => {
    setCompressionResult(null)
  }, [])

  // 自动优化
  const handleAutoOptimize = useCallback(() => {
    if (selectedFile) {
      const autoOptions = getAutoCompressionOptions(selectedFile.size)
      setCompressionOptions(autoOptions)
      showInfo('已应用自动优化设置')
    }
  }, [selectedFile])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">图片压缩工具</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 左侧：文件选择和设置 */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto flex flex-col">
            {/* 文件选择区域 */}
            {!selectedFile ? (
              <div className="flex-1 flex items-center justify-center">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 cursor-pointer group max-w-md w-full"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                      <Upload className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        选择图片文件
                      </h3>
                      <p className="text-gray-600 text-base">
                        拖拽图片到此处或点击选择文件
                      </p>
                      <p className="text-sm text-gray-500">
                        支持 JPG, PNG, GIF, BMP, WebP 等格式，最大 50MB
                      </p>
                    </div>
                    <button className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      选择文件
                    </button>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 压缩设置 */}
                <ImageCompressionSettings
                  file={selectedFile}
                  options={compressionOptions}
                  onOptionsChange={setCompressionOptions}
                  onAutoOptimize={handleAutoOptimize}
                />
                
                {/* 压缩按钮 */}
                <div className="pt-4">
                  <button
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Zap className="w-5 h-5" />
                    <span>{isCompressing ? '压缩中...' : '开始压缩'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：预览和结果 */}
          <div className="w-1/2 p-6 overflow-y-auto flex flex-col">
            {selectedFile ? (
              <ImageCompressionPreview
                originalFile={selectedFile}
                compressionResult={compressionResult}
                isCompressing={isCompressing}
                onDownload={handleDownload}
                onRetry={handleRetry}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                    <Zap className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    图片预览区域
                  </h3>
                  <p className="text-gray-500">
                    选择图片后，这里将显示预览和压缩结果
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageCompression 