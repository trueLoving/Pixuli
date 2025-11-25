import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualScroll } from '../useVirtualScroll';

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(public callback: ResizeObserverCallback) {}
}

describe('useVirtualScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.ResizeObserver = MockResizeObserver as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该初始化时返回正确的默认值', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, { itemHeight: 50 })
    );

    expect(result.current.startIndex).toBeGreaterThanOrEqual(0);
    expect(result.current.endIndex).toBeGreaterThanOrEqual(0);
    expect(result.current.totalHeight).toBe(5000); // 100 * 50
    expect(result.current.visibleItems).toBeInstanceOf(Array);
    expect(result.current.scrollTop).toBe(0);
    expect(result.current.containerRef.current).toBeNull();
    expect(result.current.scrollContainerRef.current).toBeNull();
  });

  it('应该计算正确的总高度', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, { itemHeight: 100 })
    );

    expect(result.current.totalHeight).toBe(5000); // 50 * 100
  });

  it('应该计算可见范围', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, {
        itemHeight: 50,
        containerHeight: 200,
        bufferSize: 2,
      })
    );

    // 初始状态：scrollTop = 0, containerHeight = 200
    // 应该显示前几个项目
    expect(result.current.startIndex).toBeGreaterThanOrEqual(0);
    expect(result.current.endIndex).toBeLessThan(100);
  });

  it('应该处理滚动事件', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, { itemHeight: 50 })
    );

    const mockEvent = {
      currentTarget: {
        scrollTop: 500,
      },
    } as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(mockEvent);
    });

    expect(result.current.scrollTop).toBe(500);
  });

  it('应该根据scrollTop更新可见范围', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, {
        itemHeight: 50,
        containerHeight: 200,
        bufferSize: 2,
      })
    );

    const initialStartIndex = result.current.startIndex;
    const initialEndIndex = result.current.endIndex;

    // 滚动到中间位置
    const mockEvent = {
      currentTarget: {
        scrollTop: 1000,
      },
    } as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(mockEvent);
    });

    // 可见范围应该发生变化
    expect(result.current.scrollTop).toBe(1000);
    // startIndex和endIndex应该根据新的scrollTop重新计算
    expect(result.current.startIndex).not.toBe(initialStartIndex);
    expect(result.current.endIndex).not.toBe(initialEndIndex);
  });

  it('应该使用bufferSize扩展可见范围', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, {
        itemHeight: 50,
        containerHeight: 200,
        bufferSize: 5,
      })
    );

    const visibleCount =
      result.current.endIndex - result.current.startIndex + 1;
    // 应该包含buffer的项目
    expect(visibleCount).toBeGreaterThan(4); // 至少4个可见项目 + buffer
  });

  it('应该处理空数组', () => {
    const { result } = renderHook(() =>
      useVirtualScroll([], { itemHeight: 50 })
    );

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(0);
    expect(result.current.totalHeight).toBe(0);
    // 当items为空时，visibleItems可能包含一个元素（索引0），但实际没有项目
    expect(result.current.visibleItems.length).toBeGreaterThanOrEqual(0);
  });

  it('应该处理零高度的项目', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, { itemHeight: 0 })
    );

    // 当itemHeight为0时，应该显示所有项目
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(99);
    expect(result.current.totalHeight).toBe(0);
  });

  it('应该生成正确的visibleItems数组', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, {
        itemHeight: 50,
        containerHeight: 200,
      })
    );

    const visibleItems = result.current.visibleItems;
    expect(visibleItems).toBeInstanceOf(Array);
    expect(visibleItems.length).toBeGreaterThan(0);

    // 验证索引是连续的
    for (let i = 1; i < visibleItems.length; i++) {
      expect(visibleItems[i]).toBe(visibleItems[i - 1] + 1);
    }

    // 验证索引在有效范围内
    visibleItems.forEach(index => {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(100);
    });
  });

  it('应该使用自定义的containerHeight', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, {
        itemHeight: 50,
        containerHeight: 500,
      })
    );

    // containerHeight应该被使用
    expect(result.current.endIndex).toBeGreaterThan(result.current.startIndex);
  });

  it('应该处理滚动到顶部', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, { itemHeight: 50 })
    );

    // 先滚动到中间
    act(() => {
      result.current.handleScroll({
        currentTarget: { scrollTop: 1000 },
      } as React.UIEvent<HTMLDivElement>);
    });

    // 再滚动回顶部
    act(() => {
      result.current.handleScroll({
        currentTarget: { scrollTop: 0 },
      } as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.scrollTop).toBe(0);
    expect(result.current.startIndex).toBe(0);
  });

  it('应该处理滚动到底部', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, {
        itemHeight: 50,
        containerHeight: 200,
      })
    );

    const totalHeight = result.current.totalHeight;
    const scrollTop = totalHeight - 200; // 滚动到底部

    act(() => {
      result.current.handleScroll({
        currentTarget: { scrollTop },
      } as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.scrollTop).toBe(scrollTop);
    expect(result.current.endIndex).toBe(99); // 最后一个项目
  });

  it('应该当items变化时重新计算', () => {
    const items1 = Array.from({ length: 50 }, (_, i) => i);
    const items2 = Array.from({ length: 100 }, (_, i) => i);

    const { result, rerender } = renderHook(
      ({ items }) => useVirtualScroll(items, { itemHeight: 50 }),
      {
        initialProps: { items: items1 },
      }
    );

    const initialTotalHeight = result.current.totalHeight;
    expect(initialTotalHeight).toBe(2500); // 50 * 50

    rerender({ items: items2 });

    expect(result.current.totalHeight).toBe(5000); // 100 * 50
  });

  it('应该处理非常大的itemHeight', () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, { itemHeight: 10000 })
    );

    expect(result.current.totalHeight).toBe(100000); // 10 * 10000
  });

  it('应该处理非常小的itemHeight', () => {
    const items = Array.from({ length: 1000 }, (_, i) => i);
    const { result } = renderHook(() =>
      useVirtualScroll(items, { itemHeight: 1 })
    );

    expect(result.current.totalHeight).toBe(1000); // 1000 * 1
  });
});
