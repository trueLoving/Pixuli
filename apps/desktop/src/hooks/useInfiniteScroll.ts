import { useState, useRef, useCallback, useEffect } from 'react'
import { ImageItem } from '@/types/image'

interface UseInfiniteScrollOptions {
  pageSize?: number
  threshold?: number
  rootMargin?: string
  initialLoadCount?: number
}

interface UseInfiniteScrollReturn {
  visibleItems: ImageItem[]
  hasMore: boolean
  isLoading: boolean
  loadMore: () => void
  reset: () => void
  containerRef: React.RefObject<HTMLDivElement>
  loadingRef: React.RefObject<HTMLDivElement>
}

export function useInfiniteScroll(
  allItems: ImageItem[],
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const {
    pageSize = 20,
    threshold = 0.1,
    rootMargin = '100px',
    initialLoadCount = 10
  } = options

  const [visibleItems, setVisibleItems] = useState<ImageItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 计算当前应该显示的图片数量
  const currentItemCount = Math.min(currentPage * pageSize, allItems.length)

  // 加载更多图片
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    
    // 模拟异步加载
    setTimeout(() => {
      const nextPage = currentPage + 1
      const nextItemCount = Math.min(nextPage * pageSize, allItems.length)
      const newItems = allItems.slice(visibleItems.length, nextItemCount)
      
      setVisibleItems(prev => [...prev, ...newItems])
      setCurrentPage(nextPage)
      setHasMore(nextItemCount < allItems.length)
      setIsLoading(false)
    }, 100) // 添加小延迟模拟网络请求
  }, [isLoading, hasMore, currentPage, pageSize, allItems, visibleItems.length])

  // 重置状态
  const reset = useCallback(() => {
    setVisibleItems([])
    setCurrentPage(1)
    setHasMore(true)
    setIsLoading(false)
  }, [])

  // 设置无限滚动观察器
  useEffect(() => {
    if (!loadingRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            loadMore()
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    observerRef.current.observe(loadingRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, loadMore, threshold, rootMargin])

  // 当allItems变化时处理初始加载
  useEffect(() => {
    if (allItems.length === 0) {
      // 清空时重置
      reset()
    } else if (visibleItems.length === 0) {
      // 首次加载
      const initialItems = allItems.slice(0, initialLoadCount)
      setVisibleItems(initialItems)
      setCurrentPage(Math.ceil(initialLoadCount / pageSize))
      setHasMore(allItems.length > initialLoadCount)
    }
  }, [allItems, initialLoadCount, pageSize, visibleItems.length, reset])

  return {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
    containerRef,
    loadingRef
  }
} 