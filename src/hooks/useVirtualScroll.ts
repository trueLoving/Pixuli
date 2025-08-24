import { useState, useRef, useCallback, useEffect, useMemo } from 'react'

interface UseVirtualScrollOptions {
  itemHeight: number
  bufferSize?: number
  containerHeight?: number
}

interface UseVirtualScrollReturn {
  startIndex: number
  endIndex: number
  totalHeight: number
  visibleItems: number[]
  scrollTop: number
  containerRef: React.RefObject<HTMLDivElement>
  scrollContainerRef: React.RefObject<HTMLDivElement>
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
}

export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
): UseVirtualScrollReturn {
  const { itemHeight, bufferSize = 5, containerHeight: initialHeight = 0 } = options
  
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(initialHeight)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 计算虚拟滚动的可见范围
  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, totalHeight: 0 }
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + bufferSize
    )
    const totalHeight = items.length * itemHeight

    return { startIndex, endIndex, totalHeight }
  }, [items.length, scrollTop, containerHeight, itemHeight, bufferSize])

  // 获取可见的项目索引
  const visibleItems = useMemo(() => {
    const indices: number[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      indices.push(i)
    }
    return indices
  }, [startIndex, endIndex])

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // 设置容器高度
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height)
        }
      })
      
      resizeObserver.observe(containerRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [])

  return {
    startIndex,
    endIndex,
    totalHeight,
    visibleItems,
    scrollTop,
    containerRef,
    scrollContainerRef,
    handleScroll
  }
} 