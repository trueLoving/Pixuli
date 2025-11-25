import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInfiniteScroll } from '../useInfiniteScroll';
import type { ImageItem } from '../../types/image';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {}
}

describe('useInfiniteScroll', () => {
  let mockItems: ImageItem[];

  beforeEach(() => {
    vi.clearAllMocks();
    global.IntersectionObserver = MockIntersectionObserver as any;

    // 创建测试数据
    mockItems = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i}`,
      name: `Image ${i}`,
      url: `https://example.com/image${i}.jpg`,
      githubUrl: `https://github.com/image${i}.jpg`,
      size: 1000 + i,
      width: 100 + i,
      height: 100 + i,
      type: 'image/jpeg',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该初始化时返回正确的默认值', () => {
    const { result } = renderHook(() => useInfiniteScroll([]));

    expect(result.current.visibleItems).toEqual([]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.containerRef.current).toBeNull();
    expect(result.current.loadingRef.current).toBeNull();
  });

  it('应该初始加载指定数量的项目', async () => {
    const { result } = renderHook(() =>
      useInfiniteScroll(mockItems, { initialLoadCount: 10 })
    );

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(10);
    });

    expect(result.current.visibleItems[0].id).toBe('item-0');
    expect(result.current.visibleItems[9].id).toBe('item-9');
    expect(result.current.hasMore).toBe(true);
  });

  it('应该加载更多项目', async () => {
    const { result } = renderHook(() =>
      useInfiniteScroll(mockItems, { pageSize: 10, initialLoadCount: 10 })
    );

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(10);
    });

    await act(async () => {
      result.current.loadMore();
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(20);
    });

    expect(result.current.visibleItems[10].id).toBe('item-10');
    expect(result.current.visibleItems[19].id).toBe('item-19');
  });

  it('应该正确设置hasMore状态', async () => {
    const { result } = renderHook(() =>
      useInfiniteScroll(mockItems, { pageSize: 20, initialLoadCount: 20 })
    );

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(20);
    });

    expect(result.current.hasMore).toBe(true);

    // 加载所有项目
    await act(async () => {
      result.current.loadMore();
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(40);
    });

    await act(async () => {
      result.current.loadMore();
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(50);
      expect(result.current.hasMore).toBe(false);
    });
  });

  it('应该防止重复加载', async () => {
    const { result } = renderHook(() =>
      useInfiniteScroll(mockItems, { pageSize: 10, initialLoadCount: 10 })
    );

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(10);
    });

    const initialLength = result.current.visibleItems.length;

    // 调用loadMore
    act(() => {
      result.current.loadMore();
    });

    // 等待第一次加载完成
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 500 }
    );

    // 验证只加载了一次
    expect(result.current.visibleItems.length).toBe(initialLength + 10);

    // 再次调用loadMore
    act(() => {
      result.current.loadMore();
    });

    // 等待第二次加载完成
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 500 }
    );

    // 验证加载了两次
    expect(result.current.visibleItems.length).toBe(initialLength + 20);
  });

  it('应该重置状态', async () => {
    const { result } = renderHook(() =>
      useInfiniteScroll(mockItems, { initialLoadCount: 10 })
    );

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(10);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.visibleItems).toEqual([]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('应该当allItems为空时重置', async () => {
    const { result, rerender } = renderHook(
      ({ items }) => useInfiniteScroll(items, { initialLoadCount: 10 }),
      {
        initialProps: { items: mockItems },
      }
    );

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(10);
    });

    rerender({ items: [] });

    await waitFor(() => {
      expect(result.current.visibleItems).toEqual([]);
      expect(result.current.hasMore).toBe(true);
    });
  });

  it('应该使用自定义pageSize', async () => {
    const { result } = renderHook(() =>
      useInfiniteScroll(mockItems, { pageSize: 5, initialLoadCount: 5 })
    );

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(5);
    });

    await act(async () => {
      result.current.loadMore();
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(10);
    });
  });

  it('应该处理空数组', () => {
    const { result } = renderHook(() => useInfiniteScroll([]));

    expect(result.current.visibleItems).toEqual([]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('应该正确处理所有项目已加载的情况', async () => {
    const smallItems = mockItems.slice(0, 5);

    const { result } = renderHook(() =>
      useInfiniteScroll(smallItems, { initialLoadCount: 10 })
    );

    await waitFor(() => {
      expect(result.current.visibleItems.length).toBe(5);
      expect(result.current.hasMore).toBe(false);
    });
  });
});
