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
      modelPath: '/models/gguf/vision_model.gguf',
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
      // 动态导入 llama-node 库
      const llamaModule = await import('@llama-node/llama-cpp')
      
      // 初始化模型
      this.model = new llamaModule.LLama()
      
      // 加载模型
      await this.model.load({
        modelPath: this.config.modelPath,
        contextSize: this.config.contextSize,
        threads: this.config.threads,
        gpuLayers: this.config.gpuLayers,
        useMlock: this.config.useMlock,
        useMMap: this.config.useMMap,
      })
      
      this.isInitialized = true
      console.log('GGUF 模型加载成功:', this.config.modelPath)
    } catch (error) {
      console.error('GGUF 模型加载失败:', error)
      throw new Error('GGUF 模型初始化失败')
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
          resolve(base64)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('图片读取失败'))
      reader.readAsDataURL(imageFile)
    })
  }

  private buildPrompt(language: string): string {
    if (language === 'zh-CN') {
      return `请分析这张图片，识别其中的主要物体、场景和特征，并按照以下格式输出：

标签：[用逗号分隔的关键词，如：人物, 风景, 建筑]
描述：[用一句话描述图片内容，如：这是一张包含人物和风景的图片]

请确保标签准确且有意义，描述简洁明了。`
    } else {
      return `Please analyze this image, identify the main objects, scenes, and features, and output in the following format:

Tags: [comma-separated keywords, e.g., person, landscape, building]
Description: [describe the image content in one sentence, e.g., This is an image containing a person and landscape]

Please ensure the tags are accurate and meaningful, and the description is concise and clear.`
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