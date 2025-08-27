import React, { useState, useCallback } from 'react'
import { Brain, Upload, X, FileText, Tag, Download, RotateCcw, Settings } from 'lucide-react'
import { AIAnalysis } from './AIAnalysis'
import { AIAnalysisResult } from '@/type/ai'
import { GGUFWebService } from '@/services/ggufWebService'
import { showSuccess, showError, showInfo } from '@/utils/toast'

interface AIAnalysisModalProps {
  onClose: () => void
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showModelSettings, setShowModelSettings] = useState(false)
  const [modelConfig, setModelConfig] = useState({
    modelPath: '/models/gguf/Qwen3-4B-Q4_K_M.gguf',
    threshold: 0.6,
    maxResults: 8,
    language: 'zh-CN' as const,
    contextSize: 2048,
    threads: 4,
    gpuLayers: 0
  })

  // 处理文件选择
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('请选择有效的图片文件')
        return
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB限制
        showError('文件大小不能超过50MB')
        return
      }
      
      setSelectedFile(file)
      setAnalysisResult(null)
      
      showInfo(`已选择图片: ${file.name}`)
    }
  }, [])

  // 处理拖拽
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    
    if (files.length > 1) {
      showError('一次只能分析一张图片')
      return
    }
    
    const file = files[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 50 * 1024 * 1024) {
        showError('文件大小不能超过50MB')
        return
      }
      
      setSelectedFile(file)
      setAnalysisResult(null)
      
      showInfo(`已选择图片: ${file.name}`)
    } else {
      showError('请选择有效的图片文件')
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  // 处理AI分析完成
  const handleAnalysisComplete = useCallback((result: AIAnalysisResult) => {
    setAnalysisResult(result)
    setIsAnalyzing(false)
    showSuccess('AI 分析完成！')
  }, [])

  // 处理AI分析取消
  const handleAnalysisCancel = useCallback(() => {
    setIsAnalyzing(false)
  }, [])

  // 开始AI分析
  const handleStartAnalysis = useCallback(async () => {
    if (!selectedFile) return
    
    setIsAnalyzing(true)
    
    try {
      console.log('🚀 开始使用 GGUF 模型进行AI分析...')
      
      // 使用GGUF Web服务进行分析
      const ggufService = new GGUFWebService(modelConfig)
      
      // 执行分析
      const result = await ggufService.analyzeImageWithProgress(
        {
          imageFile: selectedFile,
          language: 'zh-CN'
        },
        (progress: any) => {
          console.log('📊 分析进度:', progress)
          // 这里可以更新UI进度显示
        }
      )
      
      // 设置分析结果
      setAnalysisResult(result)
      setIsAnalyzing(false)
      showSuccess('🎉 GGUF AI 分析完成！')
      
      // 清理资源
      ggufService.dispose()
      
    } catch (error) {
      console.error('❌ GGUF AI 分析失败:', error)
      setIsAnalyzing(false)
      
      let errorMessage = 'GGUF AI 分析失败'
      if (error instanceof Error) {
        if (error.message.includes('模型文件不存在')) {
          errorMessage = 'GGUF 模型文件不存在，请检查 /models/gguf/ 目录'
        } else if (error.message.includes('llama-node')) {
          errorMessage = 'llama-node 库加载失败，请检查依赖安装'
        } else if (error.message.includes('内存')) {
          errorMessage = '内存不足，请关闭其他应用后重试'
        } else {
          errorMessage = error.message
        }
      }
      
      showError(errorMessage)
    }
  }, [selectedFile])

  // 重新分析
  const handleRetry = useCallback(() => {
    setAnalysisResult(null)
    setIsAnalyzing(false)
  }, [])

  // 导出分析结果
  const handleExportResult = useCallback(() => {
    if (!analysisResult) return
    
    const resultText = `AI 图片分析结果

图片名称: ${selectedFile?.name || '未知'}
分析时间: ${new Date().toLocaleString('zh-CN')}

描述:
${analysisResult.description || '无描述'}

标签:
${analysisResult.tags?.join(', ') || '无标签'}

置信度: ${analysisResult.confidence ? `${(analysisResult.confidence * 100).toFixed(1)}%` : '未知'}
    `.trim()
    
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai_analysis_${selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'result'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showSuccess('分析结果已导出')
  }, [analysisResult, selectedFile])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI 图片分析工具</h2>
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
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            {/* 文件选择区域 */}
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('ai-file-input')?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  选择图片文件
                </h3>
                <p className="text-gray-500 mb-4">
                  拖拽图片到此处或点击选择文件
                </p>
                <p className="text-sm text-gray-400">
                  支持 JPG, PNG, GIF, BMP, WebP 等格式，最大 50MB
                </p>
                <input
                  id="ai-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* 文件信息 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 模型设置和分析按钮 */}
                <div className="pt-4 space-y-3">
                  {/* 模型设置按钮 */}
                  <button
                    onClick={() => setShowModelSettings(!showModelSettings)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>模型设置</span>
                  </button>
                  
                  {/* 模型设置面板 */}
                  {showModelSettings && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            线程数
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="16"
                            value={modelConfig.threads}
                            onChange={(e) => setModelConfig(prev => ({
                              ...prev,
                              threads: parseInt(e.target.value) || 4
                            }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            上下文大小
                          </label>
                          <input
                            type="number"
                            min="512"
                            max="8192"
                            step="512"
                            value={modelConfig.contextSize}
                            onChange={(e) => setModelConfig(prev => ({
                              ...prev,
                              contextSize: parseInt(e.target.value) || 2048
                            }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        当前模型: {modelConfig.modelPath.split('/').pop()}
                      </div>
                    </div>
                  )}
                  
                  {/* 分析按钮 */}
                  <button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Brain className="w-5 h-5" />
                    <span>{isAnalyzing ? '分析中...' : '开始 GGUF AI 分析'}</span>
                  </button>
                </div>

                {/* 分析结果 */}
                {analysisResult && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">分析结果</h3>
                    
                    {/* 描述 */}
                    {analysisResult.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          图片描述
                        </label>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">{analysisResult.description}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* 标签 */}
                    {analysisResult.tags && analysisResult.tags.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          识别标签
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 置信度 */}
                    {analysisResult.confidence && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          分析置信度
                        </label>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${analysisResult.confidence * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {(analysisResult.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右侧：AI分析界面和结果 */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selectedFile && (
              <div className="h-full">
                {isAnalyzing ? (
                  <div className="h-full flex items-center justify-center">
                    <AIAnalysis
                      imageFile={selectedFile}
                      onAnalysisComplete={handleAnalysisComplete}
                      onCancel={handleAnalysisCancel}
                      language="zh-CN"
                    />
                  </div>
                ) : analysisResult ? (
                  <div className="h-full flex flex-col">
                    {/* 结果预览 */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Brain className="w-16 h-16 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          分析完成
                        </h3>
                        <p className="text-gray-600">
                          AI 已成功分析您的图片
                        </p>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleRetry}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>重新分析</span>
                      </button>
                      <button
                        onClick={handleExportResult}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>导出结果</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>选择图片并开始分析</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAnalysisModal 