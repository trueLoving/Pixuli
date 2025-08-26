import React, { useState, useEffect } from 'react'
import { FileText, Download, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { GGUFModelConfig } from '@/services/ggufAnalysisService'

interface GGUFModel {
  id: string
  name: string
  description: string
  size: string
  url: string
  tags: string[]
  recommended: boolean
}

interface GGUFModelSelectorProps {
  onModelSelect: (model: GGUFModel) => void
  onClose: () => void
}

const AVAILABLE_MODELS: GGUFModel[] = [
  {
    id: 'llava-v1.5-7b',
    name: 'LLaVA v1.5 7B',
    description: '多模态视觉语言模型，支持图像理解和描述生成',
    size: '4.2GB',
    url: 'https://huggingface.co/llava-hf/llava-1.5-7b-hf/resolve/main/model.gguf',
    tags: ['多模态', '图像理解', '中文支持'],
    recommended: true
  },
  {
    id: 'llava-v1.5-13b',
    name: 'LLaVA v1.5 13B',
    description: '更大规模的视觉语言模型，提供更准确的图像分析',
    size: '7.8GB',
    url: 'https://huggingface.co/llava-hf/llava-1.5-13b-hf/resolve/main/model.gguf',
    tags: ['高精度', '多模态', '图像理解'],
    recommended: false
  },
  {
    id: 'bakllava-1',
    name: 'BakLLaVA 1',
    description: '开源的视觉语言模型，支持多种语言',
    size: '3.9GB',
    url: 'https://huggingface.co/SkunkworksAI/BakLLaVA-1/resolve/main/model.gguf',
    tags: ['开源', '多语言', '轻量级'],
    recommended: false
  },
  {
    id: 'llava-v1.6-34b',
    name: 'LLaVA v1.6 34B',
    description: '最新版本的视觉语言模型，性能最佳',
    size: '19.5GB',
    url: 'https://huggingface.co/llava-hf/llava-1.6-34b-hf/resolve/main/model.gguf',
    tags: ['最新版本', '最高精度', '企业级'],
    recommended: false
  }
]

export const GGUFModelSelector: React.FC<GGUFModelSelectorProps> = ({
  onModelSelect,
  onClose
}) => {
  const [selectedModel, setSelectedModel] = useState<GGUFModel | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleModelSelect = (model: GGUFModel) => {
    setSelectedModel(model)
  }

  const handleDownload = async (model: GGUFModel) => {
    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      // 模拟下载进度
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + Math.random() * 10
        })
      }, 200)

      // 这里应该实现实际的下载逻辑
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      clearInterval(interval)
      setDownloadProgress(100)
      
      // 下载完成后选择模型
      onModelSelect(model)
    } catch (error) {
      console.error('模型下载失败:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const getModelIcon = (model: GGUFModel) => {
    if (model.recommended) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    return <FileText className="w-5 h-5 text-blue-500" />
  }

  const getSizeColor = (size: string) => {
    const sizeNum = parseFloat(size.replace('GB', ''))
    if (sizeNum <= 5) return 'text-green-600'
    if (sizeNum <= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">选择 GGUF 模型</h3>
          <p className="text-sm text-gray-500">
            选择适合您需求的视觉语言模型，支持图像理解和分析
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {AVAILABLE_MODELS.map((model) => (
          <div
            key={model.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedModel?.id === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleModelSelect(model)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getModelIcon(model)}
                <h4 className="font-medium text-gray-900">{model.name}</h4>
                {model.recommended && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    推荐
                  </span>
                )}
              </div>
              <span className={`text-sm font-medium ${getSizeColor(model.size)}`}>
                {model.size}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {model.description}
            </p>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {model.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(model)
                }}
                disabled={isDownloading}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDownloading && selectedModel?.id === model.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {downloadProgress.toFixed(0)}%
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    下载模型
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 下载进度 */}
      {isDownloading && selectedModel && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              正在下载 {selectedModel.name}
            </span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-blue-700">
            <span>下载进度: {downloadProgress.toFixed(1)}%</span>
            <span>模型大小: {selectedModel.size}</span>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">使用说明</span>
        </div>
        
        <div className="text-sm text-gray-600 space-y-2">
          <p>• 首次使用需要下载模型文件，请确保网络连接稳定</p>
          <p>• 模型文件较大，下载时间取决于网络速度</p>
          <p>• 下载完成后，模型将自动保存到本地</p>
          <p>• 建议选择推荐模型以获得最佳性能</p>
          <p>• 大模型需要更多内存和计算资源</p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
        >
          取消
        </button>
        <button
          onClick={() => selectedModel && onModelSelect(selectedModel)}
          disabled={!selectedModel}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          使用选中模型
        </button>
      </div>
    </div>
  )
} 