import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useImageDimensionsFromUrl } from '../useImageDimensionsFromUrl'

// Mock Image constructor
const mockImage = {
  naturalWidth: 800,
  naturalHeight: 600,
  crossOrigin: '',
  src: '',
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
}

// Mock global Image constructor to return our mock
global.Image = vi.fn(() => mockImage) as any

describe('useImageDimensionsFromUrl', () => {
  const mockUrl = 'https://example.com/image.jpg'
  const mockDimensions = { width: 800, height: 600 }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock image
    mockImage.naturalWidth = 800
    mockImage.naturalHeight = 600
    mockImage.crossOrigin = ''
    mockImage.src = ''
    mockImage.onload = null
    mockImage.onerror = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基本功能', () => {
    it('应该正确初始化状态', () => {
      const { result } = renderHook(() => useImageDimensionsFromUrl(null))
      
      expect(result.current.dimensions).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.refetch).toBe('function')
    })

    it('应该能够手动重新获取图片尺寸', async () => {
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl))
      
      // 等待初始加载完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      await waitFor(() => {
        expect(result.current.dimensions).toEqual(mockDimensions)
      })
      
      // 重置状态
      act(() => {
        result.current.refetch()
      })
      
      // 再次触发加载
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      expect(result.current.dimensions).toEqual(mockDimensions)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('应该设置正确的图片属性', async () => {
      renderHook(() => useImageDimensionsFromUrl(mockUrl))
      
      expect(mockImage.crossOrigin).toBe('anonymous')
      expect(mockImage.src).toBe(mockUrl)
    })
  })

  describe('自动加载功能', () => {
    it('应该在URL变化时自动加载', async () => {
      const { result, rerender } = renderHook(
        ({ url }) => useImageDimensionsFromUrl(url),
        { initialProps: { url: null } }
      )
      
      // 设置URL
      rerender({ url: mockUrl })
      
      // 等待 hook 开始加载
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      // 模拟图片加载成功
      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      await waitFor(() => {
        expect(result.current.dimensions).toEqual(mockDimensions)
      })
    })

    it('当 enabled 为 false 时不应该自动加载', async () => {
      const { result, rerender } = renderHook(
        ({ url }) => useImageDimensionsFromUrl(url, { enabled: false }),
        { initialProps: { url: null } }
      )
      
      // 设置URL
      rerender({ url: mockUrl })
      
      // 等待一段时间确保没有自动加载
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(result.current.dimensions).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('当URL为null时应该清空状态', async () => {
      const { result, rerender } = renderHook(
        ({ url }) => useImageDimensionsFromUrl(url),
        { initialProps: { url: mockUrl } }
      )
      
      // 先设置URL并加载
      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      })
      
      await waitFor(() => {
        expect(result.current.dimensions).toEqual(mockDimensions)
      })
      
      // 然后设置为null
      rerender({ url: null })
      
      expect(result.current.dimensions).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('错误处理', () => {
    it('应该正确处理图片加载失败', async () => {
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl))
      
      await act(async () => {
        if (mockImage.onerror) {
          mockImage.onerror()
        }
      })

      await waitFor(() => {
        expect(result.current.dimensions).toBeNull()
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('图片加载失败')
      })
    })

    it('应该正确处理超时错误', async () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl, { timeout: 1000 }))
      
      // 快进时间到超时
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.dimensions).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('获取图片尺寸超时')
      
      vi.useRealTimers()
    }, 10000)

    it('应该将非Error对象转换为错误消息', async () => {
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl))
      
      await act(async () => {
        if (mockImage.onerror) {
          // 模拟非Error对象
          mockImage.onerror()
        }
      })

      await waitFor(() => {
        expect(result.current.error).toBe('图片加载失败')
      })
    })
  })

  describe('超时功能', () => {
    it('应该使用自定义超时时间', async () => {
      vi.useFakeTimers()
      
      const customTimeout = 5000
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl, { timeout: customTimeout }))
      
      // 快进时间到自定义超时时间
      await act(async () => {
        vi.advanceTimersByTime(customTimeout)
      })

      expect(result.current.error).toBe('获取图片尺寸超时')
      
      vi.useRealTimers()
    }, 10000)

    it('应该在图片加载成功时清除超时', async () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl, { timeout: 1000 }))
      
      // 在超时前触发加载成功
      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      expect(result.current.dimensions).toEqual(mockDimensions)
      expect(result.current.error).toBeNull()
      
      // 快进到超时时间，应该不会触发超时错误
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      
      expect(result.current.error).toBeNull()
      
      vi.useRealTimers()
    }, 10000)
  })

  describe('加载状态', () => {
    it('应该在加载过程中设置 loading 状态', async () => {
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl))
      
      // 等待 hook 开始加载
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      // 初始状态应该是loading
      expect(result.current.loading).toBe(true)
      
      // 模拟加载完成
      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      expect(result.current.loading).toBe(false)
    })

    it('应该在加载失败时设置 loading 为 false', async () => {
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl))
      
      // 等待 hook 开始加载
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      // 初始状态应该是loading
      expect(result.current.loading).toBe(true)
      
      // 模拟加载失败
      await act(async () => {
        if (mockImage.onerror) {
          mockImage.onerror()
        }
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('refetch 功能', () => {
    it('应该能够重新获取图片尺寸', async () => {
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl))
      
      // 等待初始加载完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      await waitFor(() => {
        expect(result.current.dimensions).toEqual(mockDimensions)
      })
      
      // 手动触发refetch
      act(() => {
        result.current.refetch()
      })
      
      // 再次触发加载
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      expect(result.current.dimensions).toEqual(mockDimensions)
    })

    it('refetch 应该重置错误状态', async () => {
      const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl))
      
      // 等待 hook 开始加载
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      // 先触发错误
      await act(async () => {
        if (mockImage.onerror) {
          mockImage.onerror()
        }
      })

      expect(result.current.error).toBe('图片加载失败')
      
      // 然后refetch
      await act(async () => {
        result.current.refetch()
        await new Promise(resolve => setTimeout(resolve, 0))
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      expect(result.current.error).toBeNull()
      expect(result.current.dimensions).toEqual(mockDimensions)
    })
  })

  describe('依赖项变化', () => {
    it('当URL变化时应该重新加载', async () => {
      const { result, rerender } = renderHook(
        ({ url }) => useImageDimensionsFromUrl(url),
        { initialProps: { url: null } }
      )
      
      // 设置第一个URL
      rerender({ url: 'https://example.com/image1.jpg' })
      
      // 等待 hook 开始加载
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      expect(result.current.dimensions).toEqual(mockDimensions)
      
      // 设置第二个URL
      rerender({ url: 'https://example.com/image2.jpg' })
      
      // 应该重新开始加载
      expect(result.current.loading).toBe(true)
      expect(mockImage.src).toBe('https://example.com/image2.jpg')
    })

    it('当enabled选项变化时应该重新评估', async () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useImageDimensionsFromUrl(mockUrl, { enabled }),
        { initialProps: { enabled: true } }
      )
      
      // 禁用
      rerender({ enabled: false })
      
      expect(result.current.dimensions).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      
      // 重新启用
      rerender({ enabled: true })
      
      expect(result.current.loading).toBe(true)
    })
  })
})
