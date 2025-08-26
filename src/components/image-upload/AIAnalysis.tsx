import React, { useState, useCallback } from 'react'
import { AIAnalysisService } from '@/services/aiAnalysisService'
import { AIAnalysisResult, ImageAnalysisRequest, AnalysisProgress, AIModelConfig } from '@/type/ai'
import { Brain, Sparkles, CheckCircle, AlertCircle, Loader2, Settings } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AIAnalysisSettings } from './AIAnalysisSettings'

interface AIAnalysisProps {
  imageFile: File
  onAnalysisComplete: (result: AIAnalysisResult) => void
  onCancel: () => void
  language?: 'zh-CN' | 'en-US'
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({
  imageFile,
  onAnalysisComplete,
  onCancel,
  language = 'zh-CN'
}) => {
  const [progress, setProgress] = useState<AnalysisProgress>({
    status: 'loading',
    progress: 0,
    message: '正在初始化...'
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [aiConfig, setAIConfig] = useState<Partial<AIModelConfig>>({
    threshold: 0.6,
    maxResults: 8,
    language
  })

  const handleAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    
    try {
      const aiService = new AIAnalysisService(aiConfig)

      const request: ImageAnalysisRequest = {
        imageFile,
        language: aiConfig.language || language
      }

      const result = await aiService.analyzeImageWithProgress(request, (progressUpdate) => {
        setProgress(progressUpdate)
      })

      onAnalysisComplete(result)
      toast.success(language === 'zh-CN' ? 'AI 分析完成！' : 'AI analysis completed!')
      
      // 清理资源
      aiService.dispose()
    } catch (error) {
      console.error('AI 分析失败:', error)
      const errorMessage = error instanceof Error ? error.message : '分析失败'
      toast.error(language === 'zh-CN' ? `分析失败: ${errorMessage}` : `Analysis failed: ${errorMessage}`)
    } finally {
      setIsAnalyzing(false)
    }
  }, [imageFile, onAnalysisComplete, language])

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Brain className="w-5 h-5 text-purple-500" />
    }
  }

  const getStatusColor = () => {
    switch (progress.status) {
      case 'loading':
      case 'processing':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'zh-CN' ? 'AI 智能分析' : 'AI Smart Analysis'}
              </h3>
              <p className="text-sm text-gray-500">
                {language === 'zh-CN' ? '使用人工智能分析图片内容，自动生成标签和描述' : 'Use AI to analyze image content and generate tags and descriptions automatically'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title={language === 'zh-CN' ? '分析设置' : 'Analysis Settings'}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

      <div className="space-y-4">
        {/* 进度显示 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {progress.message}
            </span>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-500">
                {progress.progress}%
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {!isAnalyzing && progress.status === 'loading' && (
            <button
              onClick={handleAnalysis}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4" />
              {language === 'zh-CN' ? '开始分析' : 'Start Analysis'}
            </button>
          )}
          
          {progress.status === 'completed' && (
            <button
              onClick={() => onAnalysisComplete(progress.result!)}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {language === 'zh-CN' ? '应用结果' : 'Apply Results'}
            </button>
          )}
          
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
          >
            {language === 'zh-CN' ? '取消' : 'Cancel'}
          </button>
        </div>

        {/* 分析结果预览 */}
        {progress.status === 'completed' && progress.result && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">
              {language === 'zh-CN' ? '分析结果预览' : 'Analysis Result Preview'}
            </h4>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  {language === 'zh-CN' ? '标签：' : 'Tags: '}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {progress.result.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">
                  {language === 'zh-CN' ? '描述：' : 'Description: '}
                </span>
                <p className="text-sm text-gray-800 mt-1">
                  {progress.result.description}
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  {language === 'zh-CN' ? '置信度：' : 'Confidence: '}
                  <span className="font-medium text-green-600">
                    {(progress.result.confidence * 100).toFixed(1)}%
                  </span>
                </span>
                <span>
                  {language === 'zh-CN' ? '处理时间：' : 'Processing Time: '}
                  <span className="font-medium text-blue-600">
                    {progress.result.processingTime}ms
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {progress.status === 'error' && progress.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">
                {language === 'zh-CN' ? '分析失败' : 'Analysis Failed'}
              </span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              {progress.error}
            </p>
          </div>
        )}
      </div>

      {/* AI 分析设置模态框 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <AIAnalysisSettings
              config={aiConfig}
              onConfigChange={setAIConfig}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
} 