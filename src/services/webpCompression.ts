import { WebPCompressOptions, WebPCompressResult } from '@/types/webp'

declare global {
  interface Window {
    wasmAPI: {
      compressToWebp: (imageData: number[], options?: WebPCompressOptions) => Promise<WebPCompressResult>
      batchCompressToWebp: (imagesData: number[][], options?: WebPCompressOptions) => Promise<WebPCompressResult[]>
      getImageInfo: (imageData: number[]) => Promise<string>
    }
  }
}

export class WebPCompressionService {
  /**
   * 压缩单张图片为WebP格式
   */
  static async compressImage(
    imageFile: File,
    options?: WebPCompressOptions
  ): Promise<WebPCompressResult> {
    try {
      // 将File转换为Uint8Array
      const arrayBuffer = await imageFile.arrayBuffer()
      const imageData = new Uint8Array(arrayBuffer)
      
      // 调用WASM压缩函数
      const result = await window.wasmAPI.compressToWebp(Array.from(imageData), options)
      
      return result
    } catch (error) {
      console.error('WebP compression failed:', error)
      throw new Error(`WebP压缩失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量压缩图片为WebP格式
   */
  static async batchCompressImages(
    imageFiles: File[],
    options?: WebPCompressOptions
  ): Promise<WebPCompressResult[]> {
    try {
      // 将所有File转换为Array<number>
      const imagesData = await Promise.all(
        imageFiles.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer()
          return Array.from(new Uint8Array(arrayBuffer))
        })
      )
      
      // 调用WASM批量压缩函数
      const results = await window.wasmAPI.batchCompressToWebp(imagesData, options)
      
      return results
    } catch (error) {
      console.error('Batch WebP compression failed:', error)
      throw new Error(`批量WebP压缩失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取图片信息
   */
  static async getImageInfo(imageFile: File): Promise<any> {
    try {
      const arrayBuffer = await imageFile.arrayBuffer()
      const imageData = new Uint8Array(arrayBuffer)
      
      const infoString = await window.wasmAPI.getImageInfo(Array.from(imageData))
      return JSON.parse(infoString)
    } catch (error) {
      console.error('Get image info failed:', error)
      throw new Error(`获取图片信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 创建压缩后的File对象
   */
  static createCompressedFile(
    result: WebPCompressResult,
    originalFileName: string
  ): File {
    const webpFileName = originalFileName.replace(/\.[^/.]+$/, '.webp')
    // 将Array<number>转换为Uint8Array，然后转换为ArrayBuffer
    const uint8Array = new Uint8Array(result.data)
    return new File([uint8Array], webpFileName, { type: 'image/webp' })
  }

  /**
   * 获取自动压缩选项
   */
  static getAutoCompressionOptions(fileSize: number): WebPCompressOptions {
    // 根据文件大小自动选择压缩质量
    if (fileSize > 5 * 1024 * 1024) { // > 5MB
      return { quality: 60 }
    } else if (fileSize > 2 * 1024 * 1024) { // > 2MB
      return { quality: 70 }
    } else if (fileSize > 1 * 1024 * 1024) { // > 1MB
      return { quality: 80 }
    } else {
      return { quality: 85 }
    }
  }

  /**
   * 检查是否支持WebP
   */
  static isWebPSupported(): boolean {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    } catch (error) {
      return false
    }
  }
}
