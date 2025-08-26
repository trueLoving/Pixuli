import React, { useState } from 'react'
import { AIAnalysis } from '@/components/image-upload/AIAnalysis'
import { AIAnalysisResult } from '@/type/ai'

export const AIDemo: React.FC = () => {
  const [demoImage, setDemoImage] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setDemoImage(file)
      setAnalysisResult(null)
    }
  }

  const handleAnalysisComplete = (result: AIAnalysisResult) => {
    setAnalysisResult(result)
    console.log('AI 分析完成:', result)
  }

  const handleAnalysisCancel = () => {
    setDemoImage(null)
    setAnalysisResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI 图片分析功能演示
          </h1>
          <p className="text-lg text-gray-600">
            体验基于 TensorFlow.js 的智能图片分析功能
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：图片选择和预览 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                选择图片
              </h2>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                
                {demoImage && (
                  <div className="space-y-3">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(demoImage)}
                        alt="预览"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>文件名: {demoImage.name}</p>
                      <p>大小: {(demoImage.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p>类型: {demoImage.type}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI 分析结果展示 */}
            {analysisResult && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  分析结果
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">识别标签</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">智能描述</h3>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                      {analysisResult.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">置信度:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {(analysisResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">处理时间:</span>
                      <span className="ml-2 font-medium text-blue-600">
                        {analysisResult.processingTime}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：AI 分析界面 */}
          <div className="space-y-6">
            {demoImage ? (
              <AIAnalysis
                imageFile={demoImage}
                onAnalysisComplete={handleAnalysisComplete}
                onCancel={handleAnalysisCancel}
                language="zh-CN"
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  请选择一张图片
                </h3>
                <p className="text-gray-500">
                  选择图片后即可开始 AI 智能分析
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            功能特性
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">智能识别</h3>
              <p className="text-sm text-gray-600">
                基于深度学习模型，准确识别图片中的物体和场景
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">高性能</h3>
              <p className="text-sm text-gray-600">
                WebGL 加速，毫秒级响应，支持实时分析
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">可配置</h3>
              <p className="text-sm text-gray-600">
                支持自定义阈值、标签数量和输出语言
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 