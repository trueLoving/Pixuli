// AI 模型配置接口 - 支持 Qwen LLM, Ollama, Shimmy
export interface AIModelConfig {
  id: string;
  name: string;
  type: 'qwen-llm' | 'ollama' | 'shimmy';
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
  // Ollama 特定配置
  ollamaBaseUrl?: string; // Ollama API 基础 URL，默认 http://localhost:11434
  ollamaModel?: string; // Ollama 模型名称，如 qwen-vl, llava-1.5 等
  // Shimmy 特定配置
  shimmyPath?: string; // Shimmy 工具路径
  shimmyModel?: string; // Shimmy 模型名称
}

// 图片分析请求接口
export interface ImageAnalysisRequest {
  imageData: Buffer | Uint8Array | number[];
  modelId?: string;
  modelConfig?: AIModelConfig; // 直接传递模型配置
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
    request: ImageAnalysisRequest,
  ) => Promise<ImageAnalysisResponse>;
  // Ollama 图片分析
  analyzeImageWithOllama: (
    request: ImageAnalysisRequest,
  ) => Promise<ImageAnalysisResponse>;
  // Shimmy 图片分析
  analyzeImageWithShimmy: (
    request: ImageAnalysisRequest,
  ) => Promise<ImageAnalysisResponse>;
  // Qwen分析器检查
  checkQwenAnalyzer: () => Promise<{ success: boolean; error?: string }>;
  // Ollama 连接检查
  checkOllamaConnection: (baseUrl?: string) => Promise<{
    success: boolean;
    error?: string;
    models?: string[];
  }>;
  // Shimmy 检查
  checkShimmy: (shimmyPath?: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  // 获取 Ollama 可用模型列表
  getOllamaModels: (baseUrl?: string) => Promise<{
    success: boolean;
    models?: Array<{ name: string; size: number; modified_at: string }>;
    error?: string;
  }>;
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
