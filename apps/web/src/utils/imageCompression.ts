import { WebPCompressionService } from '@/services/webpCompression'
import type { WebPCompressOptions } from '@/types/webp'

export interface CompressionOptions {
  quality?: number
  lossless?: boolean
}

export interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  originalDimensions: { width: number; height: number }
  compressedDimensions: { width: number; height: number }
}

export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  quality: 80,
  lossless: false
}

/**
 * 压缩图片文件（使用Canvas WebP压缩）
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns Promise<CompressionResult> 压缩结果
 */
export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  const finalOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options }
  
  // 获取原始图片尺寸
  const originalDimensions = await getImageDimensions(file)
  
  try {
    // 使用Canvas WebP压缩
    const webpOptions: WebPCompressOptions = {
      quality: finalOptions.quality,
      lossless: finalOptions.lossless
    }
    
    const webpResult = await WebPCompressionService.compressImage(file, webpOptions)
    const compressedFile = WebPCompressionService.createCompressedFile(webpResult, file.name)
    
    return {
      compressedFile,
      originalSize: file.size,
      compressedSize: webpResult.compressedSize,
      compressionRatio: webpResult.compressionRatio * 100,
      originalDimensions,
      compressedDimensions: { width: webpResult.width, height: webpResult.height }
    }
  } catch (error) {
    console.error('Canvas WebP compression failed:', error)
    throw new Error(`图片压缩失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 获取图片尺寸
 * @param file 图片文件
 * @returns Promise<{width: number, height: number}>
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
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
 * 批量压缩图片（使用Canvas WebP压缩）
 * @param files 图片文件数组
 * @param options 压缩选项
 * @returns Promise<CompressionResult[]> 压缩结果数组
 */
export async function compressImages(
  files: File[],
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult[]> {
  try {
    const finalOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options }
    const webpOptions: WebPCompressOptions = {
      quality: finalOptions.quality,
      lossless: finalOptions.lossless
    }
    
    // 使用Canvas批量压缩
    const webpResults = await WebPCompressionService.batchCompressImages(files, webpOptions)
    
    return webpResults.map((webpResult, index) => {
      const file = files[index]
      return {
        compressedFile: WebPCompressionService.createCompressedFile(webpResult, file.name),
        originalSize: webpResult.originalSize,
        compressedSize: webpResult.compressedSize,
        compressionRatio: webpResult.compressionRatio * 100,
        originalDimensions: { width: webpResult.width, height: webpResult.height },
        compressedDimensions: { width: webpResult.width, height: webpResult.height }
      }
    })
  } catch (error) {
    console.error('Batch Canvas WebP compression failed:', error)
    throw new Error(`批量图片压缩失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 根据文件大小自动选择压缩选项
 * @param fileSize 文件大小（字节）
 * @returns CompressionOptions 推荐的压缩选项
 */
export function getAutoCompressionOptions(fileSize: number): CompressionOptions {
  const sizeMB = fileSize / (1024 * 1024)
  
  if (sizeMB > 10) {
    // 超大文件：高压缩
    return {
      quality: 60,
      lossless: false
    }
  } else if (sizeMB > 5) {
    // 大文件：中等压缩
    return {
      quality: 70,
      lossless: false
    }
  } else if (sizeMB > 2) {
    // 中等文件：轻微压缩
    return {
      quality: 80,
      lossless: false
    }
  } else {
    // 小文件：保持原样或轻微压缩
    return {
      quality: 85,
      lossless: false
    }
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 检查文件是否为图片
 * @param file 文件对象
 * @returns 是否为图片文件
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * 获取支持的图片格式
 * @returns 支持的图片格式数组
 */
export function getSupportedImageFormats(): string[] {
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp'
  ]
}
