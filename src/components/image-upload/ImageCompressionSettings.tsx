import React, { useState } from 'react'
import { Settings, Info, Zap, FileImage, HardDrive } from 'lucide-react'
import { CompressionOptions, getAutoCompressionOptions, formatFileSize } from '@/utils/imageCompression'

interface ImageCompressionSettingsProps {
  file: File
  options: CompressionOptions
  onOptionsChange: (options: CompressionOptions) => void
  onAutoOptimize: () => void
}

const ImageCompressionSettings: React.FC<ImageCompressionSettingsProps> = ({
  file,
  options,
  onOptionsChange,
  onAutoOptimize
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleOptionChange = (key: keyof CompressionOptions, value: any) => {
    onOptionsChange({
      ...options,
      [key]: value
    })
  }

  const handleAutoOptimize = () => {
    const autoOptions = getAutoCompressionOptions(file.size)
    onOptionsChange(autoOptions)
    onAutoOptimize()
  }

  const fileSizeMB = file.size / (1024 * 1024)
  const isLargeFile = fileSizeMB > 5

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">WebP 压缩设置</h3>
        </div>
        <button
          onClick={handleAutoOptimize}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>自动优化</span>
        </button>
      </div>

      {/* 文件信息 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <FileImage className="w-4 h-4" />
          <span className="font-medium">文件信息</span>
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
            <span className="text-gray-500">状态:</span>
            <div className={`font-medium ${isLargeFile ? 'text-orange-600' : 'text-green-600'}`}>
              {isLargeFile ? '建议压缩' : '大小适中'}
            </div>
          </div>
        </div>
      </div>

      {/* WebP 压缩设置 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WebP 压缩质量
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={options.quality || 80}
            onChange={(e) => handleOptionChange('quality', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>低质量 (10)</span>
            <span className="font-medium">{options.quality || 80}%</span>
            <span>高质量 (100)</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="lossless"
            checked={options.lossless || false}
            onChange={(e) => handleOptionChange('lossless', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="lossless" className="text-sm text-gray-700">
            无损压缩（忽略质量设置）
          </label>
        </div>

        {/* 高级选项 */}
        <div className="pt-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>{showAdvanced ? '隐藏' : '显示'} 高级选项</span>
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">WebP 压缩说明：</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 质量越高，文件越大，但图片质量越好</li>
                    <li>• 无损压缩保持原始质量，但文件可能较大</li>
                    <li>• 建议质量范围：60-90</li>
                    <li>• 大文件建议使用较低质量以获得更好的压缩效果</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <HardDrive className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">压缩提示：</p>
            <p className="text-xs">
              使用 WASM WebP 压缩可以获得更好的压缩效果和更快的处理速度。
              压缩后的文件将保存为 .webp 格式。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageCompressionSettings