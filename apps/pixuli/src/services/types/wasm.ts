// WASM API 类型定义
// 注意：压缩、转换功能已暂时移除，保留类型定义供后续使用
export interface WasmAPI {
  plus100: (input: number) => Promise<number>;
  getImageInfo: (imageData: number[]) => Promise<string>;
  // AI 分析功能（仍在使用）
  analyzeImage: (imageData: number[], options?: any) => Promise<any>;
  batchAnalyzeImages: (imagesData: number[][], options?: any) => Promise<any[]>;
  checkModelAvailability: (modelPath: string) => Promise<boolean>;
  // 以下功能已暂时移除，保留类型定义供后续使用
  // compressToWebp: (imageData: number[], options?: any) => Promise<any>;
  // batchCompressToWebp: (imagesData: number[][], options?: any) => Promise<any[]>;
  // convertImageFormat: (imageData: number[], options: any) => Promise<any>;
  // batchConvertImageFormat: (imagesData: number[][], options: any) => Promise<any[]>;
}

// 全局类型声明
declare global {
  interface Window {
    wasmAPI: WasmAPI;
  }
}
