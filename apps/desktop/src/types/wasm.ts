// WASM API 类型定义
export interface WasmAPI {
  plus100: (input: number) => Promise<number>;
  compressToWebp: (imageData: number[], options?: any) => Promise<any>;
  batchCompressToWebp: (
    imagesData: number[][],
    options?: any
  ) => Promise<any[]>;
  getImageInfo: (imageData: number[]) => Promise<string>;
  convertImageFormat: (imageData: number[], options: any) => Promise<any>;
  batchConvertImageFormat: (
    imagesData: number[][],
    options: any
  ) => Promise<any[]>;
}

// 全局类型声明
declare global {
  interface Window {
    wasmAPI: WasmAPI;
  }
}
