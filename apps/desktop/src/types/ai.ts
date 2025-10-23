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
  pythonPath?: string;
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

// AI API 类型定义
export interface AIAPI {
  // Qwen LLM分析
  analyzeImageWithQwen: (
    request: ImageAnalysisRequest
  ) => Promise<ImageAnalysisResponse>;
  // Qwen分析器检查
  checkQwenAnalyzer: () => Promise<{ success: boolean; error?: string }>;
  // 选择 Qwen 模型文件
  selectModelFile: () => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;
}

// 全局类型声明
declare global {
  interface Window {
    aiAPI: AIAPI;
  }
}
