import { ipcMain, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { promisify } from 'util'
import * as https from 'https'
import * as http from 'http'
import { createWriteStream } from 'fs'
import { AvailableModel } from '../../src/types/electron'

const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

// 预定义的模型下载配置
const MODEL_DOWNLOADS = {
  // 只保留实际可用的模型，移除无法正常工作的模型
  
  // TensorFlow Lite 模型（推荐）
  'mobilenet-v2-lite': {
    name: 'MobileNet V2 Lite',
    type: 'tensorflow-lite',
    url: 'https://storage.googleapis.com/download.tensorflow.org/models/tflite/mobilenet_v2_1.0_224.tflite',
    files: [
      {
        url: 'https://storage.googleapis.com/download.tensorflow.org/models/tflite/mobilenet_v2_1.0_224.tflite',
        filename: 'mobilenet_v2_1.0_224.tflite'
      }
    ],
    description: '轻量级 TensorFlow Lite 图像分类模型',
    version: '1.0.0',
    size: 4 * 1024 * 1024 // 4MB
  },

  // ONNX 模型（轻量级）- 使用备用URL
  'yolov8n': {
    name: 'YOLOv8n',
    type: 'onnx',
    url: 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx',
    files: [
      {
        url: 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx',
        filename: 'yolov8n.onnx'
      }
    ],
    description: 'YOLOv8 纳米模型，目标检测',
    version: '8.0',
    size: 6 * 1024 * 1024 // 6MB
  },

  // 备用模型（更小的文件用于测试）
  'test-model': {
    name: '测试模型',
    type: 'tensorflow-lite',
    url: 'https://storage.googleapis.com/download.tensorflow.org/models/tflite/mobilenet_v1_1.0_224.tflite',
    files: [
      {
        url: 'https://storage.googleapis.com/download.tensorflow.org/models/tflite/mobilenet_v1_1.0_224.tflite',
        filename: 'mobilenet_v1_1.0_224.tflite'
      }
    ],
    description: '测试用的小型模型',
    version: '1.0.0',
    size: 1 * 1024 * 1024 // 1MB
  },

  // 远程 API 模型（免费，但需要 API 密钥）
  'huggingface-clip': {
    name: 'Hugging Face CLIP',
    type: 'remote-api',
    url: 'https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32',
    files: [],
    description: '免费的 CLIP 图像理解 API（需要 API 密钥）',
    version: '1.0.0',
    size: 0, // API 调用，无本地文件
    apiEndpoint: 'https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32',
    requiresKey: true
  }
}

class ModelDownloadService {
  private modelsDir: string
  private downloadProgress: Map<string, number> = new Map()

  constructor() {
    this.modelsDir = path.join(app.getPath('userData'), 'models')
    this.initializeService()
  }

  private async initializeService() {
    // 确保模型目录存在
    try {
      await mkdir(this.modelsDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create models directory:', error)
    }

    // 注册 IPC 处理器
    this.registerIpcHandlers()
  }

  private registerIpcHandlers() {
    // 下载模型
    ipcMain.handle('model:download', async (event, modelId: string) => {
      try {
        return await this.downloadModel(modelId)
      } catch (error) {
        console.error('Model download failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // 获取下载进度
    ipcMain.handle('model:download-progress', async (event, modelId: string) => {
      return {
        progress: this.downloadProgress.get(modelId) || 0
      }
    })

    // 获取可下载的模型列表
    ipcMain.handle('model:available-models', async () => {
      return Object.keys(MODEL_DOWNLOADS).map(id => ({
        id,
        ...MODEL_DOWNLOADS[id as keyof typeof MODEL_DOWNLOADS]
      }))
    })

    // 检查模型是否已下载
    ipcMain.handle('model:check-downloaded', async (event, modelId: string) => {
      try {
        const modelConfig = MODEL_DOWNLOADS[modelId as keyof typeof MODEL_DOWNLOADS]
        if (!modelConfig) {
          return { downloaded: false, error: 'Model not found' }
        }

        const modelDir = path.join(this.modelsDir, modelId)
        if (!fs.existsSync(modelDir)) {
          return { downloaded: false }
        }

        // 检查所有必需的文件是否存在
        const allFilesExist = modelConfig.files.every(file => {
          const filePath = path.join(modelDir, file.filename)
          return fs.existsSync(filePath)
        })

        return { downloaded: allFilesExist }
      } catch (error) {
        return { downloaded: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })
  }

  public async downloadModel(modelId: string) {
    const modelConfig = MODEL_DOWNLOADS[modelId as keyof typeof MODEL_DOWNLOADS]
    if (!modelConfig) {
      throw new Error('Model not found')
    }

    const modelDir = path.join(this.modelsDir, modelId)
    await mkdir(modelDir, { recursive: true })

    this.downloadProgress.set(modelId, 0)

    try {
      // 下载所有文件
      for (let i = 0; i < modelConfig.files.length; i++) {
        const file = modelConfig.files[i]
        const filePath = path.join(modelDir, file.filename)
        
        // 添加重试机制
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries) {
          try {
            await this.downloadFileWithRetry(file.url, filePath, (progress) => {
              const totalProgress = ((i + progress) / modelConfig.files.length) * 100
              this.downloadProgress.set(modelId, totalProgress)
            })
            break // 下载成功，跳出重试循环
          } catch (error) {
            retryCount++
            console.log(`Download attempt ${retryCount} failed for ${file.filename}:`, error)
            
            if (retryCount >= maxRetries) {
              throw new Error(`下载失败，已重试 ${maxRetries} 次: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
            
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount))
          }
        }
      }

      this.downloadProgress.delete(modelId)

      return {
        success: true,
        message: `模型 ${modelConfig.name} 下载完成`,
        path: modelDir
      }
    } catch (error) {
      this.downloadProgress.delete(modelId)
      throw error
    }
  }

  private async downloadFileWithRetry(url: string, filePath: string, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http
      
      const options = {
        timeout: 60000, // 60秒超时
        headers: {
          'User-Agent': 'Pixuli/1.0.0',
          'Accept': '*/*',
          'Connection': 'keep-alive'
        }
      }
      
      const request = client.get(url, options, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
          return
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10)
        let downloadedSize = 0

        const writeStream = createWriteStream(filePath)
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length
          if (onProgress && totalSize > 0) {
            onProgress(downloadedSize / totalSize)
          }
        })

        response.on('end', () => {
          writeStream.close()
          resolve()
        })

        response.on('error', (error) => {
          writeStream.close()
          fs.unlink(filePath, () => {}) // 删除部分下载的文件
          reject(error)
        })

        writeStream.on('error', (error) => {
          reject(error)
        })
      })

      request.on('error', (error) => {
        reject(error)
      })

      request.on('timeout', () => {
        request.destroy()
        reject(new Error('Download timeout'))
      })
    })
  }

  private downloadFile(url: string, filePath: string, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http
      
      const options = {
        timeout: 30000, // 30秒超时
        headers: {
          'User-Agent': 'Pixuli/1.0.0',
          'Accept': '*/*',
          'Connection': 'keep-alive'
        }
      }
      
      const request = client.get(url, options, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
          return
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10)
        let downloadedSize = 0

        const writeStream = createWriteStream(filePath)
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length
          if (onProgress && totalSize > 0) {
            onProgress(downloadedSize / totalSize)
          }
        })

        response.on('end', () => {
          writeStream.close()
          resolve()
        })

        response.on('error', (error) => {
          writeStream.close()
          fs.unlink(filePath, () => {}) // 删除部分下载的文件
          reject(error)
        })

        writeStream.on('error', (error) => {
          reject(error)
        })
      })

      request.on('error', (error) => {
        reject(error)
      })

      request.on('timeout', () => {
        request.destroy()
        reject(new Error('Download timeout'))
      })
    })
  }

  // 获取模型目录路径
  public getModelsDir(): string {
    return this.modelsDir
  }

  // 获取模型文件路径
  public getModelPath(modelId: string, filename: string): string {
    return path.join(this.modelsDir, modelId, filename)
  }

  // 获取下载进度
  public getDownloadProgress(modelId: string): { progress: number } {
    return { progress: this.downloadProgress.get(modelId) || 0 }
  }

  // 获取可用模型列表
  public getAvailableModels(): AvailableModel[] {
    return Object.entries(MODEL_DOWNLOADS).map(([id, config]) => ({
      id,
      name: config.name,
      type: config.type as 'tensorflow' | 'tensorflow-lite' | 'onnx' | 'local-llm' | 'remote-api',
      url: config.url,
      description: config.description,
      version: config.version,
      size: config.size
    }))
  }

  // 检查模型是否已下载
  public async checkDownloaded(modelId: string): Promise<{ downloaded: boolean; error?: string }> {
    try {
      const modelConfig = MODEL_DOWNLOADS[modelId as keyof typeof MODEL_DOWNLOADS]
      if (!modelConfig) {
        return { downloaded: false, error: 'Model not found' }
      }

      const modelPath = this.getModelPath(modelId, modelConfig.files[0].filename)
      const exists = fs.existsSync(modelPath)
      return { downloaded: exists }
    } catch (error) {
      return { downloaded: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const modelDownloadService = new ModelDownloadService()
