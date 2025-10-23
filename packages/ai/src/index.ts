// AI 模型配置接口 - 只支持 Qwen LLM
export interface AIModelConfig {
  id: string;
  name: string;
  type: 'qwen-llm';
  enabled: boolean;
  description?: string;
  version?: string;
  size?: number;
  // Qwen LLM 特定配置
  modelPath?: string;
  device?: 'cpu' | 'cuda' | 'auto';
  maxTokens?: number;
  temperature?: number;
}

// 图片分析请求接口
export interface ImageAnalysisRequest {
  imageData: Buffer;
  modelId?: string;
  config?: {
    useGpu?: boolean;
    confidenceThreshold?: number;
  };
}

// 图片分析结果接口
export interface ImageAnalysisResponse {
  success: boolean;
  result?: {
    imageType: string;
    tags: string[];
    description: string;
    confidence: number;
    objects: Array<{
      name: string;
      confidence: number;
      bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      category: string;
    }>;
    colors: Array<{
      name: string;
      rgb: [number, number, number];
      percentage: number;
      hex: string;
    }>;
    sceneType: string;
    analysisTime: number;
    modelUsed: string;
  };
  error?: string;
}

// 模型检查结果接口
export interface ModelCheckResult {
  available: boolean;
  error?: string;
}

// 文件选择结果接口
export interface FileSelectionResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

// Qwen分析器检查结果接口
export interface QwenAnalyzerCheckResult {
  success: boolean;
  error?: string;
  analyzerPath?: string;
}

// AI API 接口声明
export interface AIAPI {
  // Qwen LLM分析
  analyzeImageWithQwen: (
    request: ImageAnalysisRequest
  ) => Promise<ImageAnalysisResponse>;

  // 模型管理
  getModels: () => Promise<AIModelConfig[]>;
  addModel: (
    config: AIModelConfig
  ) => Promise<{ success: boolean; error?: string }>;
  removeModel: (
    modelId: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateModel: (
    modelId: string,
    updates: Partial<AIModelConfig>
  ) => Promise<{ success: boolean; error?: string }>;
  checkModel: (modelId: string) => Promise<ModelCheckResult>;

  // 文件选择
  selectModelFile: () => Promise<FileSelectionResult>;

  // Qwen分析器检查
  checkQwenAnalyzer: () => Promise<QwenAnalyzerCheckResult>;
}

// 全局Window接口扩展
declare global {
  interface Window {
    aiAPI: AIAPI;
  }
}
