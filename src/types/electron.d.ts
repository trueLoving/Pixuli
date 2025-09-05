// Electron API 类型定义
export interface ElectronAPI {
  githubUpload: (params: any) => Promise<any>
  githubDelete: (params: any) => Promise<any>
  githubGetList: (params: any) => Promise<any>
  githubUpdateMetadata: (params: any) => Promise<any>
  githubSetAuth: (token: string) => Promise<any>
}

// WASM API 类型定义
export interface WasmAPI {
  plus100: (input: number) => Promise<number>
  compressToWebp: (imageData: number[], options?: any) => Promise<any>
  batchCompressToWebp: (imagesData: number[][], options?: any) => Promise<any[]>
  getImageInfo: (imageData: number[]) => Promise<string>
}

// 全局类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI
    wasmAPI: WasmAPI
    ipcRenderer: {
      on: (...args: any[]) => void
      off: (...args: any[]) => void
      send: (...args: any[]) => void
      invoke: (...args: any[]) => Promise<any>
    }
  }
}

export {}
