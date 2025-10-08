/**
 * 文件大小格式化工具
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatFileSizeCompact(bytes: number): string {
  if (bytes === 0) return '0B'
  
  const k = 1024
  const sizes = ['B', 'K', 'M', 'G', 'T']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
}

export function parseFileSize(sizeString: string): number {
  const units: { [key: string]: number } = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  }
  
  const match = sizeString.match(/^([\d.]+)\s*([A-Z]+)$/i)
  if (!match) return 0
  
  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  
  return value * (units[unit] || 1)
}

export function getFileSizePercentage(originalSize: number, newSize: number): number {
  if (originalSize === 0) return 0
  return ((originalSize - newSize) / originalSize) * 100
}
