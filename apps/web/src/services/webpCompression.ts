import type { WebPCompressOptions, WebPCompressResult } from '@/types/webp'

export class WebPCompressionService {
  /**
   * 压缩单张图片为WebP格式
   */
  static async compressImage(
    imageFile: File,
    options?: WebPCompressOptions
  ): Promise<WebPCompressResult> {
    const startTime = performance.now()
    
    try {
      // 检查浏览器是否支持WebP
      if (!this.isWebPSupported()) {
        throw new Error('浏览器不支持WebP格式')
      }

      // 使用Canvas API进行WebP压缩
      const result = await this.compressImageWithCanvas(imageFile, options)
      
      const endTime = performance.now()
      const compressionRatio = result.compressedSize / imageFile.size
      console.log(`WebP 压缩完成: ${(endTime - startTime).toFixed(2)}ms, 压缩率: ${(compressionRatio * 100).toFixed(2)}%`)
      
      return {
        ...result,
        compressionRatio,
        originalSize: imageFile.size
      }
    } catch (error) {
      const endTime = performance.now()
      console.error(`WebP compression failed after ${(endTime - startTime).toFixed(2)}ms:`, error)
      throw new Error(`WebP压缩失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 使用Canvas API压缩图片
   */
  private static async compressImageWithCanvas(
    imageFile: File,
    options?: WebPCompressOptions
  ): Promise<{ data: number[]; compressedSize: number; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('无法获取Canvas上下文'))
            return
          }

          // 设置画布尺寸
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          
          // 绘制图片
          ctx.drawImage(img, 0, 0)
          
          // 压缩为WebP格式
          const quality = options?.quality || 0.8
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('压缩失败'))
                return
              }
              
              // 将Blob转换为ArrayBuffer，然后转换为number[]
              const reader = new FileReader()
              reader.onload = () => {
                const arrayBuffer = reader.result as ArrayBuffer
                const uint8Array = new Uint8Array(arrayBuffer)
                resolve({
                  data: Array.from(uint8Array),
                  compressedSize: blob.size,
                  width: img.naturalWidth,
                  height: img.naturalHeight
                })
              }
              reader.onerror = () => reject(new Error('读取压缩数据失败'))
              reader.readAsArrayBuffer(blob)
            },
            'image/webp',
            quality
          )
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(imageFile)
    })
  }

  /**
   * 批量压缩图片为WebP格式
   */
  static async batchCompressImages(
    imageFiles: File[],
    options?: WebPCompressOptions
  ): Promise<WebPCompressResult[]> {
    const startTime = performance.now()
    
    try {
      // 检查浏览器是否支持WebP
      if (!this.isWebPSupported()) {
        throw new Error('浏览器不支持WebP格式')
      }

      // 并行处理所有图片
      const results = await Promise.all(
        imageFiles.map(file => this.compressImage(file, options))
      )
      
      const endTime = performance.now()
      const avgCompressionRatio = results.reduce((sum, result) => sum + result.compressionRatio, 0) / results.length
      console.log(`批量WebP压缩完成: ${(endTime - startTime).toFixed(2)}ms, 平均压缩率: ${(avgCompressionRatio * 100).toFixed(2)}%`)
      
      return results
    } catch (error) {
      const endTime = performance.now()
      console.error(`Batch WebP compression failed after ${(endTime - startTime).toFixed(2)}ms:`, error)
      throw new Error(`批量WebP压缩失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取图片信息
   */
  static async getImageInfo(imageFile: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: imageFile.type,
          size: imageFile.size,
          name: imageFile.name
        })
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(imageFile)
    })
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
