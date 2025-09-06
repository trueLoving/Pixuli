import React, { useState, useEffect, useRef } from 'react'
import { ImageAnalysisResponse, AIModelConfig, AvailableModel } from '../../types/electron'
import { Upload, X, Brain, Download, Settings, Play, Loader2, Cog } from 'lucide-react'
import './AIAnalysisModal.css'


interface AIAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  onAnalysisComplete?: (result: ImageAnalysisResponse) => void
  onOpenModelManager?: () => void
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
  onOpenModelManager
}) => {
  const [models, setModels] = useState<AIModelConfig[]>([])
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [uploadedImage, setUploadedImage] = useState<{
    file: File
    preview: string
    name: string
    size: number
    dimensions?: { width: number; height: number }
  } | null>(null)
  const [config, setConfig] = useState({
    useGpu: false,
    confidenceThreshold: 0.5
  })
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadModels()
      loadAvailableModels()
    }
  }, [isOpen])

  const loadModels = async () => {
    try {
      const modelList = await window.aiAPI.getModels()
      setModels(modelList)
      
      // 选择第一个启用的模型
      const enabledModel = modelList.find(m => m.enabled)
      if (enabledModel) {
        setSelectedModel(enabledModel.id)
      }
    } catch (error) {
      console.error('Failed to load models:', error)
      setError('加载模型列表失败')
    }
  }

  const loadAvailableModels = async () => {
    try {
      const available = await window.modelAPI.getAvailableModels()
      setAvailableModels(available)
    } catch (error) {
      console.error('Failed to load available models:', error)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setUploadedImage({
          file,
          preview: e.target?.result as string,
          name: file.name,
          size: file.size,
          dimensions: { width: img.width, height: img.height }
        })
        setError('')
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDownloadModel = async (modelId: string) => {
    setIsDownloading(true)
    setDownloadProgress(prev => ({ ...prev, [modelId]: 0 }))

    try {
      const model = availableModels.find(m => m.id === modelId)
      if (!model) {
        setError('模型信息不存在')
        return
      }

      let result
      if (model.type === 'tensorflow') {
        // 使用 TensorFlow 模型下载
        result = await window.aiAPI.downloadTensorFlowModel(modelId, model.url)
      } else {
        // 使用通用模型下载
        result = await window.modelAPI.downloadModel(modelId)
      }

      if (result.success) {
        // 下载成功后添加到本地模型
        await window.aiAPI.addModel({
          id: modelId,
          name: model.name,
          type: model.type,
          path: result.path,
          enabled: true
        })
        await loadModels() // 重新加载模型列表
      } else {
        setError(result.error || '下载失败')
      }
    } catch (error) {
      setError('下载模型失败')
    } finally {
      setIsDownloading(false)
      setDownloadProgress(prev => ({ ...prev, [modelId]: 0 }))
    }
  }

  const handleAnalyze = async () => {
    if (!uploadedImage || !selectedModel) return

    setIsAnalyzing(true)
    setError('')
    setAnalysisResult(null)

    try {
      // 将上传的图片文件转换为 Buffer
      const arrayBuffer = await uploadedImage.file.arrayBuffer()
      const buffer = window.Buffer.from(arrayBuffer)

      // 获取选中的模型配置
      const modelConfig = models.find(m => m.id === selectedModel)
      
      let result
      if (modelConfig?.type === 'tensorflow') {
        // 使用 TensorFlow 模型分析
        result = await window.aiAPI.analyzeImageWithTensorFlow({
          imageData: buffer,
          modelId: selectedModel,
          config
        })
      } else {
        // 使用通用 AI 分析
        result = await window.aiAPI.analyzeImage({
          imageData: buffer,
          modelId: selectedModel,
          config
        })
      }

      setAnalysisResult(result)
      
      if (result.success && onAnalysisComplete) {
        onAnalysisComplete(result)
      } else {
        setError(result.error || '分析失败')
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      setError('分析过程中发生错误')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="ai-analysis-modal-overlay">
      <div className="ai-analysis-modal">
        <div className="ai-analysis-modal-header">
          <h2>AI 图片分析</h2>
          <div className="header-actions">
            {onOpenModelManager && (
              <button 
                className="model-manager-button"
                onClick={onOpenModelManager}
                title="模型管理"
              >
                <Cog className="w-5 h-5" />
              </button>
            )}
            <button className="close-button" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="ai-analysis-modal-content">
          {/* 图片上传区域 */}
          <div className="image-upload-section">
            <h3>上传图片</h3>
            {!uploadedImage ? (
              <div 
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <p>点击上传图片或拖拽图片到此处</p>
                <p className="text-sm text-gray-500">支持 JPG、PNG、WebP 格式</p>
              </div>
            ) : (
              <div className="uploaded-image-preview">
                <img src={uploadedImage.preview} alt={uploadedImage.name} />
                <div className="image-info">
                  <h4>{uploadedImage.name}</h4>
                  <p>尺寸: {uploadedImage.dimensions?.width} × {uploadedImage.dimensions?.height}</p>
                  <p>大小: {formatFileSize(uploadedImage.size)}</p>
                  <button 
                    className="change-image-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    更换图片
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* 模型配置区域 */}
          <div className="model-config-section">
            <h3>模型配置</h3>
            
            {/* 本地模型选择 */}
            <div className="config-section">
              <label>选择本地模型:</label>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isAnalyzing}
              >
                <option value="">请选择模型</option>
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.enabled ? '(已启用)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 可下载模型列表 */}
            <div className="config-section">
              <label>下载新模型:</label>
              <div className="available-models">
                {availableModels.map(model => (
                  <div key={model.id} className="model-item">
                    <div className="model-info">
                      <h4>{model.name}</h4>
                      <p className="model-description">{model.description}</p>
                      <div className="model-meta">
                        <span className="model-type">{model.type}</span>
                        <span className="model-size">{formatFileSize(model.size)}</span>
                      </div>
                    </div>
                    <button
                      className="download-btn"
                      onClick={() => handleDownloadModel(model.id)}
                      disabled={isDownloading || models.some(m => m.id === model.id)}
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {models.some(m => m.id === model.id) ? '已安装' : '下载'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="config-section">
              <label>
                <input
                  type="checkbox"
                  checked={config.useGpu}
                  onChange={(e) => setConfig({...config, useGpu: e.target.checked})}
                  disabled={isAnalyzing}
                />
                使用 GPU 加速
              </label>
            </div>

            <div className="config-section">
              <label>
                置信度阈值: {config.confidenceThreshold}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.confidenceThreshold}
                  onChange={(e) => setConfig({...config, confidenceThreshold: parseFloat(e.target.value)})}
                  disabled={isAnalyzing}
                />
              </label>
            </div>

            <button 
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={!uploadedImage || !selectedModel || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  开始分析
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {analysisResult && analysisResult.success && analysisResult.result && (
            <div className="analysis-result">
              <h3>分析结果</h3>
              
              <div className="result-section">
                <h4>基本信息</h4>
                <p><strong>图片类型:</strong> {analysisResult.result.imageType}</p>
                <p><strong>场景类型:</strong> {analysisResult.result.sceneType}</p>
                <p><strong>置信度:</strong> {(analysisResult.result.confidence * 100).toFixed(1)}%</p>
                <p><strong>分析时间:</strong> {analysisResult.result.analysisTime.toFixed(0)}ms</p>
                <p><strong>使用模型:</strong> {analysisResult.result.modelUsed}</p>
              </div>

              <div className="result-section">
                <h4>描述</h4>
                <p>{analysisResult.result.description}</p>
              </div>

              <div className="result-section">
                <h4>标签</h4>
                <div className="tags">
                  {analysisResult.result.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>

              {analysisResult.result.objects.length > 0 && (
                <div className="result-section">
                  <h4>检测到的物体</h4>
                  <div className="objects">
                    {analysisResult.result.objects.map((obj, index) => (
                      <div key={index} className="object-item">
                        <span className="object-name">{obj.name}</span>
                        <span className="object-confidence">
                          {(obj.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="object-category">{obj.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.result.colors.length > 0 && (
                <div className="result-section">
                  <h4>主要颜色</h4>
                  <div className="colors">
                    {analysisResult.result.colors.map((color, index) => (
                      <div key={index} className="color-item">
                        <div 
                          className="color-swatch"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="color-name">{color.name}</span>
                        <span className="color-percentage">
                          {(color.percentage * 100).toFixed(1)}%
                        </span>
                        <span className="color-hex">{color.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIAnalysisModal
