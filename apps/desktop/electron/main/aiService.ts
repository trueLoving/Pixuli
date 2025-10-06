import { ipcMain, dialog, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { promisify } from 'util'
import { analyzeImageWithAi, analyzeImageWithTensorflow, analyzeImageWithTensorflowLite, downloadTensorflowModel } from 'pixuli-wasm'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

// AI 模型配置接口
export interface AIModelConfig {
  id: string
  name: string
  type: 'tensorflow' | 'tensorflow-lite' | 'onnx' | 'local-llm' | 'remote-api'
  path?: string
  apiEndpoint?: string
  apiKey?: string
  enabled: boolean
  description?: string
  version?: string
  size?: number
}

// 图片分析请求接口
export interface ImageAnalysisRequest {
  imageData: Buffer
  modelId?: string
  config?: {
    useGpu?: boolean
    confidenceThreshold?: number
  }
}

// 图片分析结果接口
export interface ImageAnalysisResponse {
  success: boolean
  result?: {
    imageType: string
    tags: string[]
    description: string
    confidence: number
    objects: Array<{
      name: string
      confidence: number
      bbox: {
        x: number
        y: number
        width: number
        height: number
      }
      category: string
    }>
    colors: Array<{
      name: string
      rgb: [number, number, number]
      percentage: number
      hex: string
    }>
    sceneType: string
    analysisTime: number
    modelUsed: string
  }
  error?: string
}

class AIService {
  private models: Map<string, AIModelConfig> = new Map()
  private modelsDir: string
  private configFile: string

  constructor() {
    this.modelsDir = path.join(app.getPath('userData'), 'models')
    this.configFile = path.join(app.getPath('userData'), 'ai-models.json')
    this.initializeService()
    this.registerIpcHandlers()
  }

  private async initializeService() {
    // 确保模型目录存在
    try {
      await mkdir(this.modelsDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create models directory:', error)
    }

    // 加载模型配置
    await this.loadModelConfigs()
    
    // 添加默认内置模型
    await this.addDefaultModels()
  }

  private async loadModelConfigs() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = await readFile(this.configFile, 'utf-8')
        const configs: AIModelConfig[] = JSON.parse(data)
        configs.forEach(config => {
          this.models.set(config.id, config)
        })
      }
    } catch (error) {
      console.error('Failed to load model configs:', error)
    }
  }

  private async saveModelConfigs() {
    try {
      const configs = Array.from(this.models.values())
      await writeFile(this.configFile, JSON.stringify(configs, null, 2))
    } catch (error) {
      console.error('Failed to save model configs:', error)
    }
  }

  private registerIpcHandlers() {
    // 分析图片
    ipcMain.handle('ai:analyze-image', async (event, request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> => {
      try {
        return await this.analyzeImage(request)
      } catch (error) {
        console.error('Image analysis failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // TensorFlow 图片分析
    ipcMain.handle('ai:analyze-image-tensorflow', async (event, request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> => {
      try {
        return await this.analyzeImageWithTensorFlow(request)
      } catch (error) {
        console.error('TensorFlow analysis failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // TensorFlow Lite 图片分析
    ipcMain.handle('ai:analyze-image-tensorflow-lite', async (event, request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> => {
      try {
        return await this.analyzeImageWithTensorFlowLite(request)
      } catch (error) {
        console.error('TensorFlow Lite analysis failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // 获取模型列表
    ipcMain.handle('ai:get-models', async () => {
      return Array.from(this.models.values())
    })

    // 添加模型
    ipcMain.handle('ai:add-model', async (event, config: AIModelConfig) => {
      try {
        this.models.set(config.id, config)
        await this.saveModelConfigs()
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 删除模型
    ipcMain.handle('ai:remove-model', async (event, modelId: string) => {
      try {
        this.models.delete(modelId)
        await this.saveModelConfigs()
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 更新模型配置
    ipcMain.handle('ai:update-model', async (event, modelId: string, updates: Partial<AIModelConfig>) => {
      try {
        const model = this.models.get(modelId)
        if (!model) {
          return { success: false, error: 'Model not found' }
        }
        
        const updatedModel = { ...model, ...updates }
        this.models.set(modelId, updatedModel)
        await this.saveModelConfigs()
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 检查模型可用性
    ipcMain.handle('ai:check-model', async (event, modelId: string) => {
      try {
        const model = this.models.get(modelId)
        if (!model) {
          return { available: false, error: 'Model not found' }
        }

        if (model.type === 'local-llm' || model.type === 'tensorflow' || model.type === 'onnx') {
          if (!model.path) {
            return { available: false, error: 'Model path not specified' }
          }
          
          const exists = fs.existsSync(model.path)
          return { available: exists, error: exists ? undefined : 'Model file not found' }
        }

        return { available: true }
      } catch (error) {
        return { available: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 下载模型
    ipcMain.handle('ai:download-model', async (event, modelId: string, url: string) => {
      try {
        // 这里应该实现模型下载逻辑
        // 暂时返回成功
        return { success: true, message: 'Model download started' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 选择模型文件
    ipcMain.handle('ai:select-model-file', async () => {
      try {
        console.log('Opening file selection dialog for AI models')
        const result = await dialog.showOpenDialog({
          title: '选择 AI 模型文件',
          filters: [
            { name: 'TensorFlow Lite 模型', extensions: ['tflite'] },
            { name: 'TensorFlow 模型', extensions: ['pb', 'json', 'bin'] },
            { name: 'ONNX 模型', extensions: ['onnx'] },
            { name: '所有文件', extensions: ['*'] }
          ],
          properties: ['openFile'],
          defaultPath: process.env.HOME || process.env.USERPROFILE || '/'
        })

        console.log('File selection result:', result)
        if (!result.canceled && result.filePaths.length > 0) {
          const selectedFile = result.filePaths[0]
          console.log('Selected file:', selectedFile)
          return { success: true, filePath: selectedFile }
        }
        
        console.log('No file selected or dialog canceled')
        return { success: false, error: 'No file selected' }
      } catch (error) {
        console.error('File selection error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })
  }

  public async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    try {
      // 获取模型配置
      let modelConfig: AIModelConfig | undefined
      
      if (request.modelId) {
        modelConfig = this.models.get(request.modelId)
      } else {
        // 使用默认启用的模型
        modelConfig = Array.from(this.models.values()).find(m => m.enabled)
      }

      if (!modelConfig) {
        return {
          success: false,
          error: 'No AI model available'
        }
      }

      // 调用 WASM 分析函数
      const wasmConfig = {
        modelType: this.mapModelType(modelConfig.type),
        modelPath: modelConfig.path,
        apiEndpoint: modelConfig.apiEndpoint,
        apiKey: modelConfig.apiKey,
        useGpu: request.config?.useGpu ?? false,
        confidenceThreshold: request.config?.confidenceThreshold ?? 0.5
      }

      const result = analyzeImageWithAi(
        Array.from(request.imageData),
        wasmConfig
      )

      return {
        success: true,
        result: {
          imageType: result.imageType,
          tags: result.tags,
          description: result.description,
          confidence: result.confidence,
          objects: result.objects.map((obj: any) => ({
            name: obj.name,
            confidence: obj.confidence,
            bbox: {
              x: obj.bbox.x,
              y: obj.bbox.y,
              width: obj.bbox.width,
              height: obj.bbox.height
            },
            category: obj.category
          })),
          colors: result.colors.map((color: any) => ({
            name: color.name,
            rgb: color.rgb,
            percentage: color.percentage,
            hex: color.hex
          })),
          sceneType: result.sceneType,
          analysisTime: result.analysisTime,
          modelUsed: result.modelUsed
        }
      }
    } catch (error) {
      console.error('Image analysis error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }

  private mapModelType(type: string): any {
    switch (type) {
      case 'tensorflow':
        return 0 // AIModelType.TensorFlow
      case 'tensorflow-lite':
        return 1 // AIModelType.TensorFlowLite
      case 'onnx':
        return 2 // AIModelType.ONNX
      case 'local-llm':
        return 3 // AIModelType.LocalLLM
      case 'remote-api':
        return 4 // AIModelType.RemoteAPI
      default:
        return 0
    }
  }

  // 获取模型目录路径
  public getModelsDir(): string {
    return this.modelsDir
  }

  // 添加默认模型配置
  public async addDefaultModels() {
    // 只添加通用AI分析模型（内置，无需文件）
    const defaultModels: AIModelConfig[] = [
      {
        id: 'builtin-general',
        name: '通用图片分析',
        type: 'tensorflow',
        enabled: true,
        description: '内置通用图片分析模型，基于图像特征分析',
        version: '1.0.0',
        size: 0 // 内置模型，无文件大小
      }
    ]

    for (const model of defaultModels) {
      if (!this.models.has(model.id)) {
        this.models.set(model.id, model)
      }
    }

    await this.saveModelConfigs()
  }

  // 下载 TensorFlow 模型
  async downloadTensorFlowModel(modelId: string, modelUrl: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const modelPath = await downloadTensorflowModel(modelId, modelUrl)
      
      // 添加到模型配置
      const modelConfig: AIModelConfig = {
        id: modelId,
        name: modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'tensorflow',
        path: modelPath,
        enabled: true,
        description: `TensorFlow model: ${modelId}`,
        version: '1.0',
        size: 0 // 实际大小需要从文件系统获取
      }

      this.models.set(modelId, modelConfig)
      await this.saveModelConfigs()

      return { success: true, path: modelPath }
    } catch (error) {
      console.error('Failed to download TensorFlow model:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // 使用 TensorFlow Lite 模型分析图片
  async analyzeImageWithTensorFlowLite(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    try {
      const modelConfig = this.models.get(request.modelId || '')
      if (!modelConfig) {
        return {
          success: false,
          error: 'Model not found'
        }
      }

      // 如果没有模型路径，使用通用AI分析
      if (!modelConfig.path) {
        return await this.analyzeImage(request)
      }

      // 检查模型文件是否存在
      if (!fs.existsSync(modelConfig.path)) {
        console.warn(`Model file not found: ${modelConfig.path}, falling back to general analysis`)
        return await this.analyzeImage(request)
      }

      const result = analyzeImageWithTensorflowLite(
        Array.from(request.imageData),
        modelConfig.path
      )

      return {
        success: true,
        result: {
          imageType: result.imageType,
          tags: result.tags,
          description: result.description,
          confidence: result.confidence,
          objects: result.objects.map((obj: any) => ({
            name: obj.name,
            confidence: obj.confidence,
            bbox: {
              x: obj.bbox.x,
              y: obj.bbox.y,
              width: obj.bbox.width,
              height: obj.bbox.height
            },
            category: obj.category
          })),
          colors: result.colors.map((color: any) => ({
            name: color.name,
            rgb: color.rgb,
            percentage: color.percentage,
            hex: color.hex
          })),
          sceneType: result.sceneType,
          analysisTime: result.analysisTime,
          modelUsed: result.modelUsed
        }
      }
    } catch (error) {
      console.error('TensorFlow Lite analysis failed:', error)
      // 如果TensorFlow Lite分析失败，回退到通用分析
      try {
        return await this.analyzeImage(request)
      } catch (fallbackError) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Analysis failed'
        }
      }
    }
  }

  // 使用 TensorFlow 模型分析图片
  async analyzeImageWithTensorFlow(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    try {
      const modelConfig = this.models.get(request.modelId || '')
      if (!modelConfig) {
        return {
          success: false,
          error: 'Model not found'
        }
      }

      // 如果没有模型路径，使用通用AI分析
      if (!modelConfig.path) {
        return await this.analyzeImage(request)
      }

      // 检查模型文件是否存在
      if (!fs.existsSync(modelConfig.path)) {
        console.warn(`Model file not found: ${modelConfig.path}, falling back to general analysis`)
        return await this.analyzeImage(request)
      }

      const result = analyzeImageWithTensorflow(
        Array.from(request.imageData),
        modelConfig.path
      )

      return {
        success: true,
        result: {
          imageType: result.imageType,
          tags: result.tags,
          description: result.description,
          confidence: result.confidence,
          objects: result.objects.map((obj: any) => ({
            name: obj.name,
            confidence: obj.confidence,
            bbox: {
              x: obj.bbox.x,
              y: obj.bbox.y,
              width: obj.bbox.width,
              height: obj.bbox.height
            },
            category: obj.category
          })),
          colors: result.colors.map((color: any) => ({
            name: color.name,
            rgb: color.rgb,
            percentage: color.percentage,
            hex: color.hex
          })),
          sceneType: result.sceneType,
          analysisTime: result.analysisTime,
          modelUsed: result.modelUsed
        }
      }
    } catch (error) {
      console.error('TensorFlow analysis failed:', error)
      // 如果TensorFlow分析失败，回退到通用分析
      try {
        return await this.analyzeImage(request)
      } catch (fallbackError) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Analysis failed'
        }
      }
    }
  }

  // 获取所有模型
  public getModels(): AIModelConfig[] {
    return Array.from(this.models.values())
  }

  // 添加模型
  public async addModel(config: AIModelConfig): Promise<{ success: boolean; error?: string }> {
    try {
      this.models.set(config.id, config)
      await this.saveModelConfigs()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 删除模型
  public async removeModel(modelId: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.models.delete(modelId)
      await this.saveModelConfigs()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 更新模型
  public async updateModel(modelId: string, updates: Partial<AIModelConfig>): Promise<{ success: boolean; error?: string }> {
    try {
      const existingModel = this.models.get(modelId)
      if (!existingModel) {
        return { success: false, error: 'Model not found' }
      }
      
      const updatedModel = { ...existingModel, ...updates }
      this.models.set(modelId, updatedModel)
      await this.saveModelConfigs()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 检查模型
  public async checkModel(modelId: string): Promise<{ available: boolean; error?: string }> {
    try {
      const model = this.models.get(modelId)
      if (!model) {
        return { available: false, error: 'Model not found' }
      }
      
      if (model.path) {
        const fs = await import('fs')
        const path = await import('path')
        const exists = fs.existsSync(path.resolve(model.path))
        return { available: exists }
      }
      
      return { available: true }
    } catch (error) {
      return { available: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 选择模型文件
  public async selectModelFile(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const { dialog } = await import('electron')
      const result = await dialog.showOpenDialog({
        title: '选择 AI 模型文件',
        filters: [
          { name: 'TensorFlow Lite 模型', extensions: ['tflite'] },
          { name: 'TensorFlow 模型', extensions: ['pb', 'json', 'bin'] },
          { name: 'ONNX 模型', extensions: ['onnx'] },
          { name: '所有文件', extensions: ['*'] }
        ],
        properties: ['openFile'],
        defaultPath: process.env.HOME || process.env.USERPROFILE || '/'
      })

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'No file selected' }
      }

      return { success: true, filePath: result.filePaths[0] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const aiService = new AIService()
