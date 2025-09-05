import { WebPCompressionService } from '@/services/webpCompression'
import { compressImageToWebP } from '@/utils/imageCompression'

/**
 * 测试WebP压缩功能
 */
export async function testWebPCompression() {
  console.log('🧪 开始测试WebP压缩功能...')
  
  try {
    // 检查WebP支持
    const isSupported = WebPCompressionService.isWebPSupported()
    console.log('✅ WebP支持状态:', isSupported)
    
    if (!isSupported) {
      console.warn('⚠️ 当前环境不支持WebP，将使用标准压缩')
      return
    }

    // 创建一个测试图片（1x1像素的PNG）
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')!
    
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 100, 100)
    gradient.addColorStop(0, '#ff0000')
    gradient.addColorStop(0.5, '#00ff00')
    gradient.addColorStop(1, '#0000ff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 100, 100)
    
    // 添加文字
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.fillText('WebP Test', 10, 50)
    
    // 转换为Blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/png')
    })
    
    const testFile = new File([blob], 'test.png', { type: 'image/png' })
    console.log('📁 测试文件大小:', formatFileSize(testFile.size))
    
    // 测试WebP压缩
    const startTime = performance.now()
    const result = await compressImageToWebP(testFile, { quality: 80 })
    const endTime = performance.now()
    
    console.log('⏱️ 压缩耗时:', `${(endTime - startTime).toFixed(2)}ms`)
    console.log('📊 压缩结果:')
    console.log('  - 原始大小:', formatFileSize(result.originalSize))
    console.log('  - 压缩后大小:', formatFileSize(result.compressedSize))
    console.log('  - 压缩率:', `${result.compressionRatio.toFixed(2)}%`)
    console.log('  - 原始尺寸:', `${result.originalDimensions.width}x${result.originalDimensions.height}`)
    console.log('  - 压缩后尺寸:', `${result.compressedDimensions.width}x${result.compressedDimensions.height}`)
    
    // 验证压缩后的文件
    if (result.compressedFile.type === 'image/webp') {
      console.log('✅ 成功生成WebP文件')
    } else {
      console.warn('⚠️ 生成的文件不是WebP格式:', result.compressedFile.type)
    }
    
    console.log('🎉 WebP压缩测试完成!')
    
  } catch (error) {
    console.error('❌ WebP压缩测试失败:', error)
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 在开发环境中自动运行测试
 */
if (import.meta.env.DEV) {
  // 延迟执行，确保应用完全加载
  setTimeout(() => {
    testWebPCompression()
  }, 2000)
}
