import * as tf from '@tensorflow/tfjs'
import { AIAnalysisResult, ImageAnalysisRequest, AIModelConfig, AnalysisProgress } from '@/type/ai'
import { tensorFlowManager } from '@/config/tensorflow'

export class AIAnalysisService {
  private model: tf.GraphModel | null = null
  private labels: string[] = []
  private isInitialized = false
  private config: AIModelConfig

  constructor(config: Partial<AIModelConfig> = {}) {
    this.config = {
      modelPath: '/models/mobilenet_v2_100_224/model.json',
      labelsPath: '/models/mobilenet_v2_100_224/labels.txt',
      threshold: 0.5,
      maxResults: 10,
      ...config
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 初始化 TensorFlow.js
      await tensorFlowManager.initialize()
      console.log('TensorFlow.js 后端已设置为:', tf.getBackend())

      // 加载预训练模型
      await this.loadModel()
      
      // 加载标签文件
      await this.loadLabels()
      
      this.isInitialized = true
      console.log('AI 分析服务初始化完成')
    } catch (error) {
      console.error('AI 分析服务初始化失败:', error)
      throw new Error('AI 分析服务初始化失败')
    }
  }

  private async loadModel(): Promise<void> {
    try {
      // 尝试加载本地模型，如果失败则使用在线模型
      try {
        this.model = await tf.loadGraphModel(this.config.modelPath)
        console.log('本地模型加载成功')
      } catch {
        // 使用在线预训练模型
        this.model = await tf.loadGraphModel(
          'https://storage.googleapis.com/tfjs-models/tfhub/mobilenet_v2_100_224/model.json'
        )
        console.log('在线模型加载成功')
      }
    } catch (error) {
      console.error('模型加载失败:', error)
      throw new Error('无法加载 AI 模型')
    }
  }

  private async loadLabels(): Promise<void> {
    try {
      // 尝试加载本地标签文件
      try {
        const response = await fetch(this.config.labelsPath)
        const text = await response.text()
        this.labels = text.split('\n').filter(label => label.trim())
      } catch {
        // 使用默认的 ImageNet 标签
        this.labels = await this.getDefaultLabels()
      }
      console.log(`标签加载完成，共 ${this.labels.length} 个标签`)
    } catch (error) {
      console.error('标签加载失败:', error)
      // 使用基本的标签作为后备
      this.labels = ['图片', '照片', '图像', '视觉', '内容']
    }
  }

  private async getDefaultLabels(): Promise<string[]> {
    // 返回一些基本的图片标签
    return [
      '人物', '动物', '风景', '建筑', '车辆', '食物', '植物', '天空', '海洋', '山脉',
      '城市', '乡村', '室内', '室外', '白天', '夜晚', '晴天', '雨天', '雪天', '雾天',
      '花朵', '树木', '草地', '沙漠', '森林', '河流', '湖泊', '海洋', '岛屿', '海滩',
      '山丘', '峡谷', '瀑布', '洞穴', '桥梁', '道路', '铁路', '机场', '港口', '车站',
      '商店', '餐厅', '学校', '医院', '教堂', '寺庙', '博物馆', '图书馆', '公园', '广场'
    ]
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<AIAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.model) {
      throw new Error('AI 模型未加载')
    }

    const startTime = Date.now()

    try {
      // 预处理图片
      const tensor = await this.preprocessImage(request.imageFile)
      
      // 进行预测
      const predictions = await this.model.predict(tensor) as tf.Tensor
      
      // 处理预测结果
      const result = await this.processPredictions(predictions, request.language || 'zh-CN')
      
      // 清理内存
      tensor.dispose()
      predictions.dispose()

      return {
        ...result,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('图片分析失败:', error)
      throw new Error('图片分析失败')
    }
  }

  private async preprocessImage(imageFile: File): Promise<tf.Tensor3D> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          // 创建 canvas 来调整图片尺寸
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // MobileNet 需要 224x224 的输入
          canvas.width = 224
          canvas.height = 224
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, 224, 224)
            
            // 转换为 tensor
            const tensor = tf.browser.fromPixels(canvas, 3)
            
            // 归一化到 [0, 1]
            const normalized = tf.div(tensor, 255.0)
            
            // 添加 batch 维度
            const batched = tf.expandDims(normalized, 0)
            
            // 清理中间 tensor
            tensor.dispose()
            normalized.dispose()
            
            resolve(batched as tf.Tensor3D)
          } else {
            reject(new Error('无法创建 canvas 上下文'))
          }
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(imageFile)
    })
  }

  private async processPredictions(predictions: tf.Tensor, language: string): Promise<Omit<AIAnalysisResult, 'processingTime'>> {
    // 获取预测结果
    const data = await predictions.data()
    const indices = Array.from(data)
      .map((value, index) => ({ value, index }))
      .sort((a, b) => b.value - a.value)
      .slice(0, this.config.maxResults)

    // 过滤低置信度的预测
    const validPredictions = indices.filter(item => item.value > this.config.threshold)

    // 生成标签
    const tags = validPredictions.map(item => {
      const label = this.labels[item.index] || `标签${item.index}`
      return this.translateLabel(label, language)
    })

    // 生成描述
    const description = this.generateDescription(tags, language)

    // 计算平均置信度
    const confidence = validPredictions.length > 0 
      ? validPredictions.reduce((sum, item) => sum + item.value, 0) / validPredictions.length
      : 0

    return {
      tags,
      description,
      confidence
    }
  }

  private translateLabel(label: string, language: string): string {
    if (language === 'zh-CN') {
      // 简单的英文到中文翻译映射
      const translations: Record<string, string> = {
        'person': '人物',
        'animal': '动物',
        'landscape': '风景',
        'building': '建筑',
        'vehicle': '车辆',
        'food': '食物',
        'plant': '植物',
        'sky': '天空',
        'ocean': '海洋',
        'mountain': '山脉',
        'city': '城市',
        'countryside': '乡村',
        'indoor': '室内',
        'outdoor': '室外',
        'day': '白天',
        'night': '夜晚',
        'sunny': '晴天',
        'rainy': '雨天',
        'snowy': '雪天',
        'foggy': '雾天'
      }
      
      return translations[label.toLowerCase()] || label
    }
    
    return label
  }

  private generateDescription(tags: string[], language: string): string {
    if (tags.length === 0) {
      return language === 'zh-CN' ? '无法识别图片内容' : 'Unable to identify image content'
    }

    if (language === 'zh-CN') {
      if (tags.length === 1) {
        return `这是一张包含${tags[0]}的图片`
      } else if (tags.length <= 3) {
        return `这是一张包含${tags.join('、')}的图片`
      } else {
        return `这是一张包含${tags.slice(0, 3).join('、')}等元素的图片`
      }
    } else {
      if (tags.length === 1) {
        return `This is an image containing ${tags[0]}`
      } else if (tags.length <= 3) {
        return `This is an image containing ${tags.join(', ')}`
      } else {
        return `This is an image containing ${tags.slice(0, 3).join(', ')} and other elements`
      }
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
        message: '正在初始化 AI 模型...'
      })

      await this.initialize()

      onProgress({
        status: 'processing',
        progress: 30,
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

  // 清理资源
  dispose(): void {
    if (this.model) {
      this.model.dispose()
      this.model = null
    }
    this.isInitialized = false
  }
} 