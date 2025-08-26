import React, { useState } from 'react'
import { Settings, Brain, Zap, Target, Sliders } from 'lucide-react'
import { AIModelConfig } from '@/type/ai'
import './ai-analysis-settings.css'

interface AIAnalysisSettingsProps {
  config: Partial<AIModelConfig>
  onConfigChange: (config: Partial<AIModelConfig>) => void
  onClose: () => void
}

export const AIAnalysisSettings: React.FC<AIAnalysisSettingsProps> = ({
  config,
  onConfigChange,
  onClose
}) => {
  const [localConfig, setLocalConfig] = useState<Partial<AIModelConfig>>({
    threshold: 0.6,
    maxResults: 8,
    language: 'zh-CN',
    ...config
  })

  const handleInputChange = (field: keyof AIModelConfig, value: any) => {
    const newConfig = { ...localConfig, [field]: value }
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
  }

  const handleSave = () => {
    onConfigChange(localConfig)
    onClose()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Settings className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI 分析设置</h3>
          <p className="text-sm text-gray-500">配置图片分析的参数和选项</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 置信度阈值 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              置信度阈值
            </label>
            <span className="text-xs text-gray-500">
              ({(localConfig.threshold || 0.6) * 100}%)
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={localConfig.threshold || 0.6}
            onChange={(e) => handleInputChange('threshold', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>低 (10%)</span>
            <span>高 (90%)</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            设置标签识别的置信度阈值，值越高识别越准确但标签越少
          </p>
        </div>

        {/* 最大结果数量 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              最大标签数量
            </label>
          </div>
          <select
            value={localConfig.maxResults || 8}
            onChange={(e) => handleInputChange('maxResults', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value={5}>5 个标签</option>
            <option value={8}>8 个标签</option>
            <option value={10}>10 个标签</option>
            <option value={15}>15 个标签</option>
            <option value={20}>20 个标签</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            设置 AI 分析返回的最大标签数量
          </p>
        </div>

        {/* 语言选择 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              分析语言
            </label>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="language"
                value="zh-CN"
                checked={localConfig.language === 'zh-CN'}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">中文</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="language"
                value="en-US"
                checked={localConfig.language === 'en-US'}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">English</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            选择 AI 分析结果的语言，影响标签和描述的生成
          </p>
        </div>

        {/* 高级设置 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              高级设置
            </label>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">启用 GPU 加速</span>
              <span className="text-xs text-green-600 font-medium">已启用</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">模型缓存</span>
              <span className="text-xs text-blue-600 font-medium">已启用</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">内存管理</span>
              <span className="text-xs text-blue-600 font-medium">已启用</span>
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
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all duration-200"
        >
          保存设置
        </button>
      </div>


    </div>
  )
} 