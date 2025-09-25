import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getImageDimensions,
  getImageInfo,
  getImageDimensionsFromUrl,
  isImageFile,
  getImageType,
  formatFileSize,
  calculateDisplayDimensions,
  createImagePreviewUrl,
  revokeImagePreviewUrl
} from '../imageUtils'

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => 'mock-object-url')
const mockRevokeObjectURL = vi.fn()

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: mockCreateObjectURL,
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: mockRevokeObjectURL,
})

// Mock File constructor
global.File = class File {
  name: string
  type: string
  size: number

  constructor(chunks: any[], filename: string, options: any = {}) {
    this.name = filename
    this.type = options.type || 'image/jpeg'
    this.size = options.size || 1024
  }
} as any

describe('imageUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getImageDimensions', () => {
    it('应该获取图片尺寸', async () => {
      // Mock successful image loading
      global.Image = class {
        width = 800
        height = 600
        naturalWidth = 800
        naturalHeight = 600
        crossOrigin = ''
        src = ''
        onload = null as (() => void) | null
        onerror = null as (() => void) | null

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload()
            }
          }, 0)
        }
      } as any

      const file = new File([], 'test.jpg', { type: 'image/jpeg' })
      const dimensions = await getImageDimensions(file)
      
      expect(dimensions).toEqual({
        width: 800,
        height: 600
      })
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file)
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-object-url')
    })

    it('应该在图片加载失败时抛出错误', async () => {
      // Mock image error
      global.Image = class {
        width = 0
        height = 0
        onload = null
        onerror = null

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror()
            }
          }, 0)
        }
      } as any

      const file = new File([], 'test.jpg', { type: 'image/jpeg' })
      await expect(getImageDimensions(file)).rejects.toThrow('图片加载失败')
    })
  })

  describe('getImageInfo', () => {
    it('应该获取图片详细信息', async () => {
      // Mock successful image loading
      global.Image = class {
        width = 800
        height = 600
        naturalWidth = 800
        naturalHeight = 600
        crossOrigin = ''
        src = ''
        onload = null as (() => void) | null
        onerror = null as (() => void) | null

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload()
            }
          }, 0)
        }
      } as any

      const file = new File([], 'test.jpg', { type: 'image/jpeg' })
      const info = await getImageInfo(file)
      
      expect(info).toEqual({
        width: 800,
        height: 600,
        naturalWidth: 800,
        naturalHeight: 600,
        aspectRatio: 800 / 600,
        orientation: 'landscape'
      })
    })

    it('应该正确识别图片方向', async () => {
      // Mock portrait image
      global.Image = class {
        width = 600
        height = 800
        naturalWidth = 600
        naturalHeight = 800
        crossOrigin = ''
        src = ''
        onload = null as (() => void) | null
        onerror = null as (() => void) | null

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload()
            }
          }, 0)
        }
      } as any

      const file = new File([], 'test.jpg', { type: 'image/jpeg' })
      const info = await getImageInfo(file)
      expect(info.orientation).toBe('portrait')
    })
  })

  describe('getImageDimensionsFromUrl', () => {
    it('应该从URL获取图片尺寸', async () => {
      // Mock successful image loading
      global.Image = class {
        width = 800
        height = 600
        naturalWidth = 800
        naturalHeight = 600
        crossOrigin = ''
        src = ''
        onload = null as (() => void) | null
        onerror = null as (() => void) | null

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload()
            }
          }, 0)
        }
      } as any

      const url = 'https://example.com/image.jpg'
      const dimensions = await getImageDimensionsFromUrl(url)
      
      expect(dimensions).toEqual({
        width: 800,
        height: 600
      })
    })
  })

  describe('isImageFile', () => {
    it('应该正确识别图片文件', () => {
      const imageFile = new File([], 'test.jpg', { type: 'image/jpeg' })
      const textFile = new File([], 'test.txt', { type: 'text/plain' })
      
      expect(isImageFile(imageFile)).toBe(true)
      expect(isImageFile(textFile)).toBe(false)
    })
  })

  describe('getImageType', () => {
    it('应该获取图片类型', () => {
      const file = new File([], 'test.jpg', { type: 'image/jpeg' })
      expect(getImageType(file)).toBe('image/jpeg')
    })

    it('应该处理未知类型', () => {
      const file = new File([], 'test.jpg', { type: '' })
      expect(getImageType(file)).toBe('image/jpeg')
    })
  })

  describe('formatFileSize', () => {
    it('应该格式化文件大小', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    })
  })

  describe('calculateDisplayDimensions', () => {
    it('应该计算显示尺寸（保持宽高比）', () => {
      const result = calculateDisplayDimensions(800, 600, 400, 300, true)
      expect(result).toEqual({
        width: 400,
        height: 300
      })
    })

    it('应该计算显示尺寸（不保持宽高比）', () => {
      const result = calculateDisplayDimensions(800, 600, 400, 300, false)
      expect(result).toEqual({
        width: 400,
        height: 300
      })
    })

    it('应该只限制宽度', () => {
      const result = calculateDisplayDimensions(800, 600, 400, undefined, true)
      expect(result).toEqual({
        width: 400,
        height: 300
      })
    })

    it('应该只限制高度', () => {
      const result = calculateDisplayDimensions(800, 600, undefined, 300, true)
      expect(result).toEqual({
        width: 400,
        height: 300
      })
    })

    it('应该处理无限制的情况', () => {
      const result = calculateDisplayDimensions(800, 600, undefined, undefined, true)
      expect(result).toEqual({
        width: 800,
        height: 600
      })
    })
  })

  describe('createImagePreviewUrl', () => {
    it('应该创建图片预览URL', () => {
      const file = new File([], 'test.jpg', { type: 'image/jpeg' })
      const url = createImagePreviewUrl(file)
      
      expect(url).toBe('mock-object-url')
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file)
    })
  })

  describe('revokeImagePreviewUrl', () => {
    it('应该清理图片预览URL', () => {
      const url = 'mock-object-url'
      revokeImagePreviewUrl(url)
      
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(url)
    })
  })
})