import React, { useState } from 'react'
import { Settings, Cpu, HardDrive, Zap, Info } from 'lucide-react'
import { GGUFModelConfig } from '@/services/ggufAnalysisService'

interface GGUFModelSettingsProps {
  config: Partial<GGUFModelConfig>
  onConfigChange: (config: Partial<GGUFModelConfig>) => void
  onClose: () => void
}

export const GGUFModelSettings: React.FC<GGUFModelSettingsProps> = ({
  config,
  onConfigChange,
  onClose
}) => {
  const [localConfig, setLocalConfig] = useState<Partial<GGUFModelConfig>>({
    threshold: 0.6,
    maxResults: 8,
    language: 'zh-CN',
    modelPath: '/models/gguf/vision_model.gguf',
    contextSize: 2048,
    threads: 4,
    gpuLayers: 0,
    useMlock: false,
    useMMap: true,
    ...config
  })

  const handleInputChange = (field: keyof GGUFModelConfig, value: any) => {
    const newConfig = { ...localConfig, [field]: value }
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
  }

  const handleSave = () => {
    onConfigChange(localConfig)
    onClose()
  }

  const getRecommendedThreads = () => {
    const cores = navigator.hardwareConcurrency || 4
    return Math.min(cores, 16)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">GGUF 模型设置</h3>
          <p className="text-sm text-gray-500">配置 GGUF 格式的 AI 模型参数</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 模型路径 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模型文件路径
          </label>
          <input
            type="text"
            value={localConfig.modelPath || ''}
            onChange={(e) => handleInputChange('modelPath', e.target.value)}
            placeholder="/models/gguf/vision_model.gguf"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            指定 GGUF 模型文件的路径，支持相对路径和绝对路径
          </p>
        </div>

        {/* 上下文大小 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              上下文大小 (Context Size)
            </label>
          </div>
          <select
            value={localConfig.contextSize || 2048}
            onChange={(e) => handleInputChange('contextSize', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={512}>512 tokens</option>
            <option value={1024}>1024 tokens</option>
            <option value={2048}>2048 tokens</option>
            <option value={4096}>4096 tokens</option>
            <option value={8192}>8192 tokens</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            较大的上下文大小可以处理更复杂的任务，但会消耗更多内存
          </p>
        </div>

        {/* 线程数 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              CPU 线程数
            </label>
            <span className="text-xs text-gray-500">
              (推荐: {getRecommendedThreads()})
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="32"
            value={localConfig.threads || 4}
            onChange={(e) => handleInputChange('threads', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            设置 CPU 推理线程数，通常设置为 CPU 核心数
          </p>
        </div>

        {/* GPU 层数 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              GPU 层数
            </label>
          </div>
          <input
            type="number"
            min="0"
            max="100"
            value={localConfig.gpuLayers || 0}
            onChange={(e) => handleInputChange('gpuLayers', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            0 表示仅使用 CPU，设置更大的值可以加速推理（需要支持 CUDA）
          </p>
        </div>

        {/* 内存管理选项 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              内存管理选项
            </label>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.useMlock || false}
                onChange={(e) => handleInputChange('useMlock', e.target.checked)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">使用 mlock (锁定内存)</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.useMMap || true}
                onChange={(e) => handleInputChange('useMMap', e.target.checked)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">使用内存映射 (MMap)</span>
            </label>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            mlock 可以防止内存被交换到磁盘，MMap 可以提高大模型加载速度
          </p>
        </div>

        {/* 分析参数 */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">分析参数</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                置信度阈值
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={localConfig.threshold || 0.6}
                onChange={(e) => handleInputChange('threshold', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{(localConfig.threshold || 0.6) * 100}%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大标签数
              </label>
              <select
                value={localConfig.maxResults || 8}
                onChange={(e) => handleInputChange('maxResults', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={5}>5 个</option>
                <option value={8}>8 个</option>
                <option value={10}>10 个</option>
                <option value={15}>15 个</option>
              </select>
            </div>
          </div>
        </div>

        {/* 系统信息 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">系统信息</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span>CPU 核心数:</span>
              <span className="ml-2 font-medium text-blue-600">
                {navigator.hardwareConcurrency || '未知'}
              </span>
            </div>
            <div>
              <span>推荐线程数:</span>
              <span className="ml-2 font-medium text-green-600">
                {getRecommendedThreads()}
              </span>
            </div>
            <div>
              <span>WebGL 支持:</span>
              <span className="ml-2 font-medium text-purple-600">
                {navigator.userAgent.includes('WebGL') ? '是' : '否'}
              </span>
            </div>
            <div>
              <span>内存限制:</span>
              <span className="ml-2 font-medium text-orange-600">
                {(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : '未知'}
              </span>
            </div>
          </div>
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
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
        >
          保存设置
        </button>
      </div>
    </div>
  )
} 