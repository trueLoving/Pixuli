import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
  useWebWorker: boolean
  fileType?: string
  initialQuality?: number
  alwaysKeepResolution?: boolean
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
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.8
}

/**
 * 压缩图片文件
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
  
  // 执行压缩
  const compressedFile = await imageCompression(file, finalOptions)
  
  // 获取压缩后图片尺寸
  const compressedDimensions = await getImageDimensions(compressedFile)
  
  // 计算压缩比例
  const originalSize = file.size
  const compressedSize = compressedFile.size
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100
  
  return {
    compressedFile,
    originalSize,
    compressedSize,
    compressionRatio,
    originalDimensions,
    compressedDimensions
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
 * 批量压缩图片
 * @param files 图片文件数组
 * @param options 压缩选项
 * @returns Promise<CompressionResult[]> 压缩结果数组
 */
export async function compressImages(
  files: File[],
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []
  
  for (const file of files) {
    try {
      const result = await compressImage(file, options)
      results.push(result)
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error)
      // 如果压缩失败，返回原始文件信息
      const dimensions = await getImageDimensions(file)
      results.push({
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        originalDimensions: dimensions,
        compressedDimensions: dimensions
      })
    }
  }
  
  return results
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
      maxSizeMB: 2,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.6
    }
  } else if (sizeMB > 5) {
    // 大文件：中等压缩
    return {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.7
    }
  } else if (sizeMB > 2) {
    // 中等文件：轻微压缩
    return {
      maxSizeMB: 1,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      initialQuality: 0.8
    }
  } else {
    // 小文件：保持原样或轻微压缩
    return {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 2560,
      useWebWorker: true,
      initialQuality: 0.9
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