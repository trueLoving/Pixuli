import { AIAnalysisResult, ImageAnalysisRequest, AIModelConfig, AnalysisProgress } from '@/type/ai'

export interface GGUFWebConfig extends Omit<AIModelConfig, 'labelsPath'> {
  modelPath: string
  contextSize: number
  threads: number
  gpuLayers: number
  useMlock: boolean
  useMMap: boolean
}

export class GGUFWebService {
  private worker: Worker | null = null
  private isInitialized = false
  private config: GGUFWebConfig

  constructor(config: Partial<GGUFWebConfig> = {}) {
    this.config = {
      modelPath: '/models/gguf/Qwen3-4B-Q4_K_M.gguf',
      threshold: 0.6,
      maxResults: 8,
      language: 'zh-CN',
      contextSize: 2048,
      threads: 4,
      gpuLayers: 0,
      useMlock: false,
      useMMap: true,
      ...config
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('🔄 开始初始化 GGUF Web 服务...')
      console.log('📁 模型路径:', this.config.modelPath)
      console.log('⚙️ 配置参数:', this.config)

      // 检查模型文件是否存在
      try {
        const response = await fetch(this.config.modelPath, { method: 'HEAD' })
        if (!response.ok) {
          throw new Error(`模型文件不存在或无法访问: ${response.status}`)
        }
        console.log('✅ 模型文件检查通过')
      } catch (fetchError) {
        console.warn('⚠️ 模型文件检查失败，继续尝试加载:', fetchError)
      }

      // 创建 Web Worker
      console.log('🔧 正在创建 Web Worker...')
      this.worker = new Worker('/workers/gguf-worker.js', { type: 'module' })
      
      // 设置消息处理器
      this.worker.onmessage = this.handleWorkerMessage.bind(this)
      this.worker.onerror = this.handleWorkerError.bind(this)
      
      // 发送初始化消息
      this.worker.postMessage({
        type: 'init',
        config: this.config
      })
      
      // 等待初始化完成
      await this.waitForInitialization()
      
      this.isInitialized = true
      console.log('🎉 GGUF Web 服务初始化成功')
      
    } catch (error) {
      console.error('❌ GGUF Web 服务初始化失败:', error)
      
      // 提供更详细的错误信息
      let errorMessage = 'GGUF Web 服务初始化失败'
      if (error instanceof Error) {
        if (error.message.includes('模型文件不存在')) {
          errorMessage = 'GGUF 模型文件不存在，请检查文件路径'
        } else if (error.message.includes('Worker')) {
          errorMessage = 'Web Worker 创建失败，请检查浏览器支持'
        } else if (error.message.includes('内存')) {
          errorMessage = '内存不足，无法加载模型，请关闭其他应用'
        } else {
          errorMessage = `GGUF Web 服务初始化失败: ${error.message}`
        }
      }
      
      throw new Error(errorMessage)
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { type, data, error } = event.data
    
    if (error) {
      console.error('❌ Worker 错误:', error)
      return
    }
    
    switch (type) {
      case 'init_complete':
        console.log('✅ Worker 初始化完成')
        break
      case 'analysis_complete':
        console.log('✅ 分析完成:', data)
        break
      case 'progress':
        console.log('📊 分析进度:', data)
        break
      default:
        console.log('📨 Worker 消息:', type, data)
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('❌ Worker 错误:', error)
  }

  private waitForInitialization(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker 未创建'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('初始化超时'))
      }, 30000) // 30秒超时

      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'init_complete') {
          clearTimeout(timeout)
          this.worker?.removeEventListener('message', messageHandler)
          resolve()
        } else if (event.data.type === 'init_error') {
          clearTimeout(timeout)
          this.worker?.removeEventListener('message', messageHandler)
          reject(new Error(event.data.error || '初始化失败'))
        }
      }

      this.worker.addEventListener('message', messageHandler)
    })
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<AIAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.worker) {
      throw new Error('GGUF Web 服务未初始化')
    }

    const startTime = Date.now()

    try {
      // 将图片转换为 base64
      const imageData = await this.preprocessImage(request.imageFile)
      
      // 发送分析请求
      return new Promise((resolve, reject) => {
        if (!this.worker) {
          reject(new Error('Worker 未初始化'))
          return
        }

        const timeout = setTimeout(() => {
          reject(new Error('分析超时'))
        }, 60000) // 60秒超时

        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'analysis_complete') {
            clearTimeout(timeout)
            this.worker?.removeEventListener('message', messageHandler)
            
            const result = {
              ...event.data.result,
              processingTime: Date.now() - startTime
            }
            resolve(result)
          } else if (event.data.type === 'analysis_error') {
            clearTimeout(timeout)
            this.worker?.removeEventListener('message', messageHandler)
            reject(new Error(event.data.error || '分析失败'))
          }
        }

        this.worker.addEventListener('message', messageHandler)
        
        // 发送分析请求
        this.worker.postMessage({
          type: 'analyze',
          request: {
            ...request,
            imageData
          }
        })
      })
      
    } catch (error) {
      console.error('GGUF Web 图片分析失败:', error)
      throw new Error('GGUF Web 图片分析失败')
    }
  }

  private async preprocessImage(imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          // 将图片转换为 base64
          const base64 = reader.result as string
          
          // 移除 data:image/...;base64, 前缀，只保留base64数据
          const base64Data = base64.split(',')[1]
          
          console.log('🖼️ 图片预处理完成，大小:', base64Data.length, '字符')
          resolve(base64Data)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误'
          reject(new Error('图片预处理失败: ' + errorMessage))
        }
      }
      reader.onerror = () => reject(new Error('图片读取失败'))
      reader.readAsDataURL(imageFile)
    })
  }

  async analyzeImageWithProgress(
    request: ImageAnalysisRequest,
    onProgress: (progress: AnalysisProgress) => void
  ): Promise<AIAnalysisResult> {
    try {
      onProgress({
        status: 'loading',
        progress: 0,
        message: '正在加载 GGUF Web 服务...'
      })

      await this.initialize()

      onProgress({
        status: 'processing',
        progress: 50,
        message: '正在分析图片...'
      })

      // 设置进度监听
      if (this.worker) {
        const progressHandler = (event: MessageEvent) => {
          if (event.data.type === 'progress') {
            onProgress(event.data.progress)
          }
        }
        this.worker.addEventListener('message', progressHandler)
      }

      const result = await this.analyzeImage(request)

      onProgress({
        status: 'completed',
        progress: 100,
        message: '分析完成',
        result
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '分析失败'
      
      onProgress({
        status: 'error',
        progress: 0,
        message: '分析失败',
        error: errorMessage
      })

      throw error
    }
  }

  // 获取服务信息
  getServiceInfo(): any {
    return {
      type: 'GGUF Web Service',
      modelPath: this.config.modelPath,
      contextSize: this.config.contextSize,
      threads: this.config.threads,
      gpuLayers: this.config.gpuLayers,
      isLoaded: this.isInitialized
    }
  }

  // 清理资源
  dispose(): void {
    if (this.worker) {
      try {
        this.worker.terminate()
        this.worker = null
      } catch (error) {
        console.warn('清理 GGUF Web 服务资源失败:', error)
      }
    }
    this.isInitialized = false
  }
} 