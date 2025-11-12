import { useState, useRef, useCallback, useEffect } from 'react';
import type { ImageItem } from '../types/image';

interface UseInfiniteScrollOptions {
  pageSize?: number;
  threshold?: number;
  rootMargin?: string;
  initialLoadCount?: number;
}

interface UseInfiniteScrollReturn {
  visibleItems: ImageItem[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
  reset: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  loadingRef: React.RefObject<HTMLDivElement | null>;
}

export function useInfiniteScroll(
  allItems: ImageItem[],
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const {
    pageSize = 20,
    threshold = 0.1,
    rootMargin = '100px',
    initialLoadCount = 10,
  } = options;

  const [visibleItems, setVisibleItems] = useState<ImageItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 计算当前应该显示的图片数量
  // const currentItemCount = Math.min(currentPage * pageSize, allItems.length)

  // 加载更多图片
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // 模拟异步加载
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const nextItemCount = Math.min(nextPage * pageSize, allItems.length);
      const newItems = allItems.slice(visibleItems.length, nextItemCount);

      setVisibleItems(prev => [...prev, ...newItems]);
      setCurrentPage(nextPage);
      setHasMore(nextItemCount < allItems.length);
      setIsLoading(false);
    }, 100); // 添加小延迟模拟网络请求
  }, [
    isLoading,
    hasMore,
    currentPage,
    pageSize,
    allItems,
    visibleItems.length,
  ]);

  // 重置状态
  const reset = useCallback(() => {
    setVisibleItems([]);
    setCurrentPage(1);
    setHasMore(true);
    setIsLoading(false);
  }, []);

  // 设置无限滚动观察器
  useEffect(() => {
    if (!loadingRef.current) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            loadMore();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(loadingRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore, threshold, rootMargin]);

  // 使用 useRef 跟踪上一次的 allItems，只在真正变化时处理
  const prevAllItemsIdsRef = useRef<string>('');

  // 当allItems变化时处理初始加载
  useEffect(() => {
    // 生成当前图片列表的ID字符串
    const currentItemsIds = allItems.map(item => item.id).join(',');

    // 只在图片列表真正变化时处理（通过ID比较，避免引用变化导致的重复处理）
    if (prevAllItemsIdsRef.current === currentItemsIds) {
      return; // 图片列表没有变化，不处理
    }

    prevAllItemsIdsRef.current = currentItemsIds;

    if (allItems.length === 0) {
      // 清空时重置
      reset();
    } else if (visibleItems.length === 0) {
      // 首次加载
      const initialItems = allItems.slice(0, initialLoadCount);
      setVisibleItems(initialItems);
      setCurrentPage(Math.ceil(initialLoadCount / pageSize));
      setHasMore(allItems.length > initialLoadCount);
    }
  }, [allItems, initialLoadCount, pageSize, visibleItems.length, reset]);

  return {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
    containerRef,
    loadingRef,
  };
}
