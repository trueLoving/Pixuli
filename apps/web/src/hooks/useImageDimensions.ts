import { useState, useEffect, useCallback } from 'react'
import { getImageDimensions, getImageInfo, getImageDimensionsFromUrl, type ImageDimensions, type ImageInfo } from '@/utils/imageUtils'

interface UseImageDimensionsOptions {
  autoLoad?: boolean
  onSuccess?: (dimensions: ImageDimensions) => void
  onError?: (error: Error) => void
}

interface UseImageDimensionsReturn {
  dimensions: ImageDimensions | null
  loading: boolean
  error: Error | null
  loadDimensions: (file: File) => Promise<void>
  loadImageInfo: (file: File) => Promise<void>
  reset: () => void
}

/**
 * 获取图片尺寸的React Hook
 * @param file 图片文件
 * @param options 配置选项
 * @returns UseImageDimensionsReturn
 */
export function useImageDimensions(
  file: File | null,
  options: UseImageDimensionsOptions = {}
): UseImageDimensionsReturn {
  const { autoLoad = true, onSuccess, onError } = options
  
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadDimensions = useCallback(async (targetFile: File) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getImageDimensions(targetFile)
      setDimensions(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取图片尺寸失败')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError])

  const loadImageInfo = useCallback(async (targetFile: File) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getImageInfo(targetFile)
      setDimensions({
        width: result.width,
        height: result.height
      })
      onSuccess?.({
        width: result.width,
        height: result.height
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取图片信息失败')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError])

  const reset = useCallback(() => {
    setDimensions(null)
    setLoading(false)
    setError(null)
  }, [])

  // 当文件变化时自动加载
  useEffect(() => {
    if (autoLoad && file) {
      loadDimensions(file)
    }
  }, [file, autoLoad, loadDimensions])

  return {
    dimensions,
    loading,
    error,
    loadDimensions,
    loadImageInfo,
    reset
  }
}

/**
 * 获取图片详细信息的React Hook
 * @param file 图片文件
 * @param options 配置选项
 * @returns UseImageInfoReturn
 */
interface UseImageInfoReturn {
  imageInfo: ImageInfo | null
  loading: boolean
  error: Error | null
  loadImageInfo: (file: File) => Promise<void>
  reset: () => void
}

export function useImageInfo(
  file: File | null,
  options: UseImageDimensionsOptions = {}
): UseImageInfoReturn {
  const { autoLoad = true, onSuccess, onError } = options
  
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadImageInfo = useCallback(async (targetFile: File) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getImageInfo(targetFile)
      setImageInfo(result)
      onSuccess?.({
        width: result.width,
        height: result.height
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取图片信息失败')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError])

  const reset = useCallback(() => {
    setImageInfo(null)
    setLoading(false)
    setError(null)
  }, [])

  // 当文件变化时自动加载
  useEffect(() => {
    if (autoLoad && file) {
      loadImageInfo(file)
    }
  }, [file, autoLoad, loadImageInfo])

  return {
    imageInfo,
    loading,
    error,
    loadImageInfo,
    reset
  }
}

/**
 * 从URL获取图片尺寸的React Hook
 * @param url 图片URL
 * @param options 配置选项
 * @returns UseImageDimensionsFromUrlReturn
 */
interface UseImageDimensionsFromUrlReturn {
  dimensions: ImageDimensions | null
  loading: boolean
  error: Error | null
  loadDimensions: (url: string) => Promise<void>
  reset: () => void
}

export function useImageDimensionsFromUrl(
  url: string | null,
  options: UseImageDimensionsOptions = {}
): UseImageDimensionsFromUrlReturn {
  const { autoLoad = true, onSuccess, onError } = options
  
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadDimensions = useCallback(async (targetUrl: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getImageDimensionsFromUrl(targetUrl)
      setDimensions(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取图片尺寸失败')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError])

  const reset = useCallback(() => {
    setDimensions(null)
    setLoading(false)
    setError(null)
  }, [])

  // 当URL变化时自动加载
  useEffect(() => {
    if (autoLoad && url) {
      loadDimensions(url)
    }
  }, [url, autoLoad, loadDimensions])

  return {
    dimensions,
    loading,
    error,
    loadDimensions,
    reset
  }
} 