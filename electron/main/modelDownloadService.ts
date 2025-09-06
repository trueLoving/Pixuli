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
  // TensorFlow 模型
  'mobilenet-v2': {
    name: 'MobileNet V2',
    type: 'tensorflow',
    url: 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json',
    files: [
      {
        url: 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json',
        filename: 'model.json'
      },
      {
        url: 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/group1-shard1of1.bin',
        filename: 'group1-shard1of1.bin'
      }
    ],
    description: '轻量级图像分类模型',
    version: '1.0.0',
    size: 14 * 1024 * 1024 // 14MB
  },
  'resnet50': {
    name: 'ResNet50',
    type: 'tensorflow',
    url: 'https://storage.googleapis.com/tfjs-models/tfjs/resnet50_v1_50/model.json',
    files: [
      {
        url: 'https://storage.googleapis.com/tfjs-models/tfjs/resnet50_v1_50/model.json',
        filename: 'model.json'
      },
      {
        url: 'https://storage.googleapis.com/tfjs-models/tfjs/resnet50_v1_50/group1-shard1of1.bin',
        filename: 'group1-shard1of1.bin'
      }
    ],
    description: '深度残差网络图像分类',
    version: '1.0.0',
    size: 25 * 1024 * 1024 // 25MB
  },
  'coco-ssd': {
    name: 'COCO-SSD',
    type: 'tensorflow',
    url: 'https://storage.googleapis.com/tfjs-models/tfjs/coco-ssd-mobilenet_v1/model.json',
    files: [
      {
        url: 'https://storage.googleapis.com/tfjs-models/tfjs/coco-ssd-mobilenet_v1/model.json',
        filename: 'model.json'
      },
      {
        url: 'https://storage.googleapis.com/tfjs-models/tfjs/coco-ssd-mobilenet_v1/group1-shard1of1.bin',
        filename: 'group1-shard1of1.bin'
      }
    ],
    description: 'COCO 数据集目标检测模型',
    version: '1.0.0',
    size: 18 * 1024 * 1024 // 18MB
  },

  // ONNX 模型
  'yolov5s': {
    name: 'YOLOv5s',
    type: 'onnx',
    url: 'https://github.com/ultralytics/yolov5/releases/download/v6.0/yolov5s.onnx',
    files: [
      {
        url: 'https://github.com/ultralytics/yolov5/releases/download/v6.0/yolov5s.onnx',
        filename: 'yolov5s.onnx'
      }
    ],
    description: 'YOLOv5 小模型，目标检测',
    version: '6.0',
    size: 28 * 1024 * 1024 // 28MB
  },
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

  // 远程 API 模型（免费）
  'huggingface-clip': {
    name: 'Hugging Face CLIP',
    type: 'remote-api',
    url: 'https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32',
    files: [],
    description: '免费的 CLIP 图像理解 API',
    version: '1.0.0',
    size: 0, // API 调用，无本地文件
    apiEndpoint: 'https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32',
    requiresKey: true
  },
  'huggingface-blip': {
    name: 'Hugging Face BLIP',
    type: 'remote-api',
    url: 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
    files: [],
    description: '免费的图像描述生成 API',
    version: '1.0.0',
    size: 0, // API 调用，无本地文件
    apiEndpoint: 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
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
        
        await this.downloadFile(file.url, filePath, (progress) => {
          const totalProgress = ((i + progress) / modelConfig.files.length) * 100
          this.downloadProgress.set(modelId, totalProgress)
        })
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

  private downloadFile(url: string, filePath: string, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http
      
      client.get(url, (response) => {
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
      }).on('error', (error) => {
        reject(error)
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
      type: config.type as 'tensorflow' | 'onnx' | 'local-llm' | 'remote-api',
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
