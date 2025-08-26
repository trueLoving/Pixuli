export interface AIAnalysisResult {
  tags: string[]
  description: string
  confidence: number
  processingTime: number
}

export interface ImageAnalysisRequest {
  imageFile: File
  imageUrl?: string
  maxTags?: number
  language?: 'zh-CN' | 'en-US'
}

export interface AIModelConfig {
  modelPath: string
  labelsPath: string
  threshold: number
  maxResults: number
  language?: 'zh-CN' | 'en-US'
}

export interface AnalysisProgress {
  status: 'loading' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  result?: AIAnalysisResult
  error?: string
} 