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
      // 使用 Canvas API 进行 WebP 压缩
      const compressedFile = await this.compressWithCanvas(imageFile, options)
      
      const endTime = performance.now()
      const compressionRatio = (compressedFile.size / imageFile.size)
      
      console.log(`WebP 压缩完成: ${(endTime - startTime).toFixed(2)}ms, 压缩率: ${(compressionRatio * 100).toFixed(2)}%`)
      
      return {
        data: await this.fileToArray(compressedFile),
        originalSize: imageFile.size,
        compressedSize: compressedFile.size,
        compressionRatio,
        fileName: compressedFile.name
      }
    } catch (error) {
      const endTime = performance.now()
      console.error(`WebP compression failed after ${(endTime - startTime).toFixed(2)}ms:`, error)
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
    const startTime = performance.now()
    
    try {
      const results = await Promise.all(
        imageFiles.map(file => this.compressImage(file, options))
      )
      
      const endTime = performance.now()
      const avgCompressionRatio = results.reduce((sum, result) => sum + result.compressionRatio, 0) / results.length
      console.log(`批量压缩完成: ${(endTime - startTime).toFixed(2)}ms, 平均压缩率: ${(avgCompressionRatio * 100).toFixed(2)}%`)
      
      return results
    } catch (error) {
      const endTime = performance.now()
      console.error(`Batch WebP compression failed after ${(endTime - startTime).toFixed(2)}ms:`, error)
      throw new Error(`批量WebP压缩失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 使用 Canvas API 进行 WebP 压缩
   */
  private static async compressWithCanvas(
    imageFile: File,
    options?: WebPCompressOptions
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('无法创建 Canvas 上下文'))
            return
          }

          canvas.width = img.width
          canvas.height = img.height

          // 绘制图片
          ctx.drawImage(img, 0, 0)

          // 设置压缩质量
          const quality = options?.quality ? Math.max(0.1, Math.min(1, options.quality / 100)) : 0.8

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const fileName = this.generateWebPFileName(imageFile.name)
                const file = new File([blob], fileName, { type: 'image/webp' })
                resolve(file)
              } else {
                reject(new Error('Canvas 转换失败'))
              }
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
   * 将 File 转换为 number[]
   */
  private static async fileToArray(file: File): Promise<number[]> {
    const arrayBuffer = await file.arrayBuffer()
    return Array.from(new Uint8Array(arrayBuffer))
  }

  /**
   * 生成 WebP 文件名
   */
  private static generateWebPFileName(originalFileName: string): string {
    const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '')
    return `${nameWithoutExt}.webp`
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
