import { useState, useRef, useCallback, useEffect } from 'react'

interface UseLazyLoadOptions {
  threshold?: number
  rootMargin?: string
}

interface UseLazyLoadReturn {
  visibleItems: Set<string>
  observeElement: (element: HTMLElement, id: string) => void
  unobserveElement: (element: HTMLElement) => void
}

export function useLazyLoad(options: UseLazyLoadOptions = {}): UseLazyLoadReturn {
  const { threshold = 0.1, rootMargin = '50px' } = options
  
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 设置懒加载观察器
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const itemId = entry.target.getAttribute('data-item-id')
          if (entry.isIntersecting && itemId) {
            setVisibleItems(prev => new Set([...prev, itemId]))
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold, rootMargin])

  // 观察元素
  const observeElement = useCallback((element: HTMLElement, id: string) => {
    if (observerRef.current) {
      // 只有在没有设置过ID时才设置
      if (!element.getAttribute('data-item-id')) {
        element.setAttribute('data-item-id', id)
      }
      observerRef.current.observe(element)
    }
  }, [])

  // 取消观察元素
  const unobserveElement = useCallback((element: HTMLElement) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element)
    }
  }, [])

  return {
    visibleItems,
    observeElement,
    unobserveElement
  }
} 