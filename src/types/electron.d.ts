import { GitHubUploadParams, GitHubUploadResponse, GitHubDeleteParams, GitHubGetListParams, GitHubUpdateMetadataParams } from './image'

// Electron API 类型定义
export interface ElectronAPI {
  githubUpload: (params: GitHubUploadParams) => Promise<GitHubUploadResponse>
  githubDelete: (params: GitHubDeleteParams) => Promise<void>
  githubGetList: (params: GitHubGetListParams) => Promise<any[]>
  githubUpdateMetadata: (params: GitHubUpdateMetadataParams) => Promise<void>
  githubSetAuth: (token: string) => Promise<{ success: boolean; error?: string }>
}

// Buffer API 类型定义
export interface BufferAPI {
  from: (data: ArrayBuffer) => Buffer
}

// WASM API 类型定义
export interface WasmAPI {
  plus100: (input: number) => Promise<number>
  compressToWebp: (imageData: number[], options?: any) => Promise<any>
  batchCompressToWebp: (imagesData: number[][], options?: any) => Promise<any[]>
  getImageInfo: (imageData: number[]) => Promise<string>
  convertImageFormat: (imageData: number[], options: any) => Promise<any>
  batchConvertImageFormat: (imagesData: number[][], options: any) => Promise<any[]>
}

// AI API 类型定义
export interface AIAPI {
  analyzeImage: (request: ImageAnalysisRequest) => Promise<ImageAnalysisResponse>
  analyzeImageWithTensorFlow: (request: ImageAnalysisRequest) => Promise<ImageAnalysisResponse>
  analyzeImageWithTensorFlowLite: (request: ImageAnalysisRequest) => Promise<ImageAnalysisResponse>
  getModels: () => Promise<AIModelConfig[]>
  addModel: (config: AIModelConfig) => Promise<{ success: boolean; error?: string }>
  removeModel: (modelId: string) => Promise<{ success: boolean; error?: string }>
  updateModel: (modelId: string, updates: Partial<AIModelConfig>) => Promise<{ success: boolean; error?: string }>
  checkModel: (modelId: string) => Promise<{ available: boolean; error?: string }>
  downloadTensorFlowModel: (modelId: string, modelUrl: string) => Promise<{ success: boolean; path?: string; error?: string }>
  selectModelFile: () => Promise<{ success: boolean; filePath?: string; error?: string }>
}

// 模型下载 API 类型定义
export interface ModelAPI {
  downloadModel: (modelId: string) => Promise<{ success: boolean; error?: string; message?: string; path?: string }>
  getDownloadProgress: (modelId: string) => Promise<{ progress: number }>
  getAvailableModels: () => Promise<AvailableModel[]>
  checkDownloaded: (modelId: string) => Promise<{ downloaded: boolean; error?: string }>
}

// 可下载模型接口
export interface AvailableModel {
  id: string
  name: string
  type: 'tensorflow' | 'tensorflow-lite' | 'onnx' | 'local-llm' | 'remote-api'
  url: string
  description: string
  version: string
  size: number
}

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

// 全局类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI
    wasmAPI: WasmAPI
    aiAPI: AIAPI
    modelAPI: ModelAPI
    Buffer: typeof Buffer
    ipcRenderer: {
      on: (...args: any[]) => void
      off: (...args: any[]) => void
      send: (...args: any[]) => void
      invoke: (...args: any[]) => Promise<any>
    }
  }
}

export {}