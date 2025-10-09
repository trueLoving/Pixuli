import type {
  FormatConversionOptions,
  FormatConversionResult,
  ImageFormat
} from '@/types/formatConversion'

import {
  getFormatInfo,
  supportsTransparency,
  supportsLossless
} from '@/types/formatConversion'

export class FormatConversionService {
  /**
   * 转换图片格式
   */
  static async convertImage(
    imageFile: File,
    options: FormatConversionOptions
  ): Promise<FormatConversionResult> {
    const startTime = performance.now()

    try {
      // 获取原始图片信息
      const originalFormat = this.getImageFormat(imageFile)
      const originalDimensions = await this.getImageDimensions(imageFile)

      // 验证转换选项
      this.validateConversionOptions(originalFormat, options)

      // 使用Canvas API进行格式转换
      const result = await this.convertImageWithCanvas(imageFile, options)

      const endTime = performance.now()
      const conversionTime = endTime - startTime

      // 创建转换后的File对象
      const convertedFile = this.createConvertedFile(result.data, imageFile.name, options.targetFormat)

      const sizeChange = convertedFile.size - imageFile.size
      const sizeChangeRatio = (sizeChange / imageFile.size) * 100

      console.log(`图片格式转换完成: ${conversionTime.toFixed(2)}ms, 格式: ${originalFormat} -> ${options.targetFormat}`)

      return {
        convertedFile,
        originalSize: imageFile.size,
        convertedSize: convertedFile.size,
        sizeChange,
        sizeChangeRatio,
        originalFormat,
        targetFormat: options.targetFormat,
        originalDimensions,
        convertedDimensions: { width: result.width, height: result.height },
        conversionTime
      }
    } catch (error) {
      const endTime = performance.now()
      console.error(`图片格式转换失败 after ${(endTime - startTime).toFixed(2)}ms:`, error)
      throw new Error(`图片格式转换失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 使用Canvas API转换图片格式
   */
  private static async convertImageWithCanvas(
    imageFile: File,
    options: FormatConversionOptions
  ): Promise<{ data: number[]; width: number; height: number }> {
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
          
          // 转换为目标格式
          const formatInfo = getFormatInfo(options.targetFormat)
          if (!formatInfo) {
            reject(new Error(`不支持的格式: ${options.targetFormat}`))
            return
          }

          const mimeType = formatInfo.mimeType
          const quality = options.quality ? options.quality / 100 : 0.8
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('格式转换失败'))
                return
              }
              
              // 将Blob转换为ArrayBuffer，然后转换为number[]
              const reader = new FileReader()
              reader.onload = () => {
                const arrayBuffer = reader.result as ArrayBuffer
                const uint8Array = new Uint8Array(arrayBuffer)
                resolve({
                  data: Array.from(uint8Array),
                  width: img.naturalWidth,
                  height: img.naturalHeight
                })
              }
              reader.onerror = () => reject(new Error('读取转换数据失败'))
              reader.readAsArrayBuffer(blob)
            },
            mimeType,
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
   * 批量转换图片格式
   */
  static async batchConvertImages(
    imageFiles: File[],
    options: FormatConversionOptions
  ): Promise<FormatConversionResult[]> {
    const startTime = performance.now()

    try {
      // 并行处理所有图片
      const results = await Promise.all(
        imageFiles.map(file => this.convertImage(file, options))
      )

      const endTime = performance.now()
      console.log(`批量图片格式转换完成: ${(endTime - startTime).toFixed(2)}ms`)

      return results
    } catch (error) {
      const endTime = performance.now()
      console.error(`批量图片格式转换失败 after ${(endTime - startTime).toFixed(2)}ms:`, error)
      throw new Error(`批量图片格式转换失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取图片格式
   */
  private static getImageFormat(file: File): string {
    const mimeType = file.type.toLowerCase()
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpeg'
    if (mimeType.includes('png')) return 'png'
    if (mimeType.includes('webp')) return 'webp'
    if (mimeType.includes('gif')) return 'gif'
    if (mimeType.includes('bmp')) return 'bmp'
    if (mimeType.includes('tiff')) return 'tiff'
    return 'unknown'
  }

  /**
   * 获取图片尺寸
   */
  private static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        })
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 验证转换选项
   */
  private static validateConversionOptions(_originalFormat: string, options: FormatConversionOptions): void {
    const targetFormat = options.targetFormat

    // 检查是否支持透明度
    if (options.preserveTransparency && !supportsTransparency(targetFormat)) {
      throw new Error(`${targetFormat.toUpperCase()} 格式不支持透明度`)
    }

    // 检查是否支持无损压缩
    if (options.lossless && !supportsLossless(targetFormat)) {
      throw new Error(`${targetFormat.toUpperCase()} 格式不支持无损压缩`)
    }

    // 检查质量设置
    if (options.quality !== undefined && (options.quality < 1 || options.quality > 100)) {
      throw new Error('质量设置必须在 1-100 之间')
    }
  }

  /**
   * 创建转换后的File对象
   */
  private static createConvertedFile(
    data: number[],
    originalFileName: string,
    targetFormat: ImageFormat
  ): File {
    const formatInfo = getFormatInfo(targetFormat)
    if (!formatInfo) {
      throw new Error(`不支持的格式: ${targetFormat}`)
    }

    // 生成新文件名
    const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '')
    const newFileName = `${nameWithoutExt}.${formatInfo.extensions[0].slice(1)}`

    // 将Array<number>转换为Uint8Array，然后转换为ArrayBuffer
    const uint8Array = new Uint8Array(data)
    return new File([uint8Array], newFileName, { type: formatInfo.mimeType })
  }

  /**
   * 获取自动转换选项
   */
  static getAutoConversionOptions(
    file: File,
    targetFormat: ImageFormat
  ): Partial<FormatConversionOptions> {
    const fileSizeMB = file.size / (1024 * 1024)
    const originalFormat = this.getImageFormat(file)

    // 基础选项
    const options: Partial<FormatConversionOptions> = {
      targetFormat,
      preserveTransparency: supportsTransparency(targetFormat),
      lossless: false
    }

    // 根据文件大小和质量要求调整设置
    if (fileSizeMB > 10) {
      // 大文件：优先压缩
      options.quality = 60
    } else if (fileSizeMB > 5) {
      // 中等文件：平衡质量和大小
      options.quality = 70
    } else if (fileSizeMB > 2) {
      // 小文件：保持质量
      options.quality = 80
    } else {
      // 很小文件：高质量
      options.quality = 85
    }

    // 如果原格式和目标格式相同，使用无损转换
    if (originalFormat === targetFormat && supportsLossless(targetFormat)) {
      options.lossless = true
      delete options.quality
    }

    return options
  }

  /**
   * 检查是否支持格式转换
   */
  static isFormatConversionSupported(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      return !!(ctx && canvas.toBlob)
    } catch (error) {
      return false
    }
  }

  /**
   * 获取支持的转换格式
   */
  static getSupportedFormats(): ImageFormat[] {
    return ['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff']
  }
}
