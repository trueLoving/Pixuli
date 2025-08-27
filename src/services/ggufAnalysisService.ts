import { AIAnalysisResult, ImageAnalysisRequest, AIModelConfig, AnalysisProgress } from '@/type/ai'

export interface GGUFModelConfig extends Omit<AIModelConfig, 'labelsPath'> {
  modelPath: string
  contextSize: number
  threads: number
  gpuLayers: number
  useMlock: boolean
  useMMap: boolean
}

export class GGUFAnalysisService {
  private model: any = null
  private isInitialized = false
  private config: GGUFModelConfig

  constructor(config: Partial<GGUFModelConfig> = {}) {
    this.config = {
      modelPath: '/models/gguf/Qwen3-4B-Q4_K_M.gguf', // 使用您本地的模型
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
      console.log('🔄 开始初始化 GGUF 模型...')
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

      // 动态导入 llama-node 库
      console.log('📦 正在加载 llama-node 库...')
      const llamaModule = await import('@llama-node/llama-cpp')
      console.log('✅ llama-node 库加载成功')
      
      // 初始化模型
      console.log('🔧 正在初始化模型实例...')
      this.model = new llamaModule.LLama()
      
      // 加载模型
      console.log('📥 正在加载模型文件...')
      await this.model.load({
        modelPath: this.config.modelPath,
        contextSize: this.config.contextSize,
        threads: this.config.threads,
        gpuLayers: this.config.gpuLayers,
        useMlock: this.config.useMlock,
        useMMap: this.config.useMMap,
      })
      
      this.isInitialized = true
      console.log('🎉 GGUF 模型加载成功:', this.config.modelPath)
      console.log('📊 模型信息:', this.getModelInfo())
    } catch (error) {
      console.error('❌ GGUF 模型加载失败:', error)
      
      // 提供更详细的错误信息
      let errorMessage = 'GGUF 模型初始化失败'
      if (error instanceof Error) {
        if (error.message.includes('模型文件不存在')) {
          errorMessage = 'GGUF 模型文件不存在，请检查文件路径'
        } else if (error.message.includes('llama-node')) {
          errorMessage = 'llama-node 库加载失败，请检查依赖安装'
        } else if (error.message.includes('内存')) {
          errorMessage = '内存不足，无法加载模型，请关闭其他应用'
        } else {
          errorMessage = `GGUF 模型初始化失败: ${error.message}`
        }
      }
      
      throw new Error(errorMessage)
    }
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<AIAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.model) {
      throw new Error('GGUF 模型未加载')
    }

    const startTime = Date.now()

    try {
      // 将图片转换为 base64 或二进制数据
      const imageData = await this.preprocessImage(request.imageFile)
      
      // 构建提示词
      const prompt = this.buildPrompt(request.language || 'zh-CN')
      
      // 使用 GGUF 模型进行推理
      const response = await this.model.complete({
        prompt: prompt + '\n' + imageData,
        maxTokens: 512,
        temperature: 0.7,
        topP: 0.9,
        stop: ['\n\n', '。', '.', '!', '?']
      })

      // 解析模型输出
      const result = this.parseResponse(response.text, request.language || 'zh-CN')
      
      return {
        ...result,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('GGUF 图片分析失败:', error)
      throw new Error('GGUF 图片分析失败')
    }
  }

  private async preprocessImage(imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          // 将图片转换为 base64
          const base64 = reader.result as string
          
          // 对于GGUF模型，我们可能需要调整图片格式
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

  private buildPrompt(language: string): string {
    if (language === 'zh-CN') {
      return `你是一个专业的图像分析AI助手。请仔细分析这张图片，识别其中的主要物体、场景、颜色、风格等特征。

请按照以下格式输出分析结果：

标签：[用逗号分隔的关键词，如：人物, 风景, 建筑, 自然, 现代]
描述：[用2-3句话详细描述图片内容，包括主要元素、场景、氛围等]

要求：
1. 标签要准确、具体、有意义
2. 描述要详细、生动、准确
3. 分析要全面，包括视觉元素和情感氛围
4. 使用中文输出

现在请分析这张图片：`
    } else {
      return `You are a professional image analysis AI assistant. Please carefully analyze this image, identifying the main objects, scenes, colors, styles, and other features.

Please output the analysis results in the following format:

Tags: [comma-separated keywords, e.g., person, landscape, building, nature, modern]
Description: [describe the image content in 2-3 sentences, including main elements, scene, atmosphere, etc.]

Requirements:
1. Tags should be accurate, specific, and meaningful
2. Description should be detailed, vivid, and accurate
3. Analysis should be comprehensive, including visual elements and emotional atmosphere
4. Use English output

Now please analyze this image:`
    }
  }

  private parseResponse(response: string, language: string): Omit<AIAnalysisResult, 'processingTime'> {
    try {
      // 解析模型输出
      const lines = response.split('\n')
      let tags: string[] = []
      let description = ''

      for (const line of lines) {
        if (line.includes('标签:') || line.includes('Tags:')) {
          const tagMatch = line.match(/[：:]\s*(.+)/)
          if (tagMatch) {
            tags = tagMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag)
          }
        } else if (line.includes('描述:') || line.includes('Description:')) {
          const descMatch = line.match(/[：:]\s*(.+)/)
          if (descMatch) {
            description = descMatch[1].trim()
          }
        }
      }

      // 如果没有解析到结果，使用默认处理
      if (tags.length === 0 || !description) {
        return this.fallbackResponse(response, language)
      }

      // 计算置信度（基于标签数量和描述长度）
      const confidence = Math.min(0.9, 0.5 + (tags.length * 0.1) + (description.length * 0.01))

      return {
        tags,
        description,
        confidence
      }
    } catch (error) {
      console.warn('解析 GGUF 响应失败，使用默认处理:', error)
      return this.fallbackResponse(response, language)
    }
  }

  private fallbackResponse(response: string, language: string): Omit<AIAnalysisResult, 'processingTime'> {
    // 提取关键词作为标签
    const words = response.split(/\s+/).filter(word => 
      word.length > 2 && /^[a-zA-Z\u4e00-\u9fa5]+$/.test(word)
    )
    
    const tags = words.slice(0, this.config.maxResults)
    const description = language === 'zh-CN' 
      ? 'AI 分析完成，已识别相关标签'
      : 'AI analysis completed, tags identified'

    return {
      tags,
      description,
      confidence: 0.6
    }
  }

  async analyzeImageWithProgress(
    request: ImageAnalysisRequest,
    onProgress: (progress: AnalysisProgress) => void
  ): Promise<AIAnalysisResult> {
    try {
      onProgress({
        status: 'loading',
        progress: 0,
        message: '正在加载 GGUF 模型...'
      })

      await this.initialize()

      onProgress({
        status: 'processing',
        progress: 50,
        message: '正在分析图片...'
      })

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

  // 获取模型信息
  getModelInfo(): any {
    if (!this.model) return null
    
    return {
      modelPath: this.config.modelPath,
      contextSize: this.config.contextSize,
      threads: this.config.threads,
      gpuLayers: this.config.gpuLayers,
      isLoaded: this.isInitialized
    }
  }

  // 清理资源
  dispose(): void {
    if (this.model) {
      try {
        this.model.dispose()
        this.model = null
      } catch (error) {
        console.warn('清理 GGUF 模型资源失败:', error)
      }
    }
    this.isInitialized = false
  }
} 