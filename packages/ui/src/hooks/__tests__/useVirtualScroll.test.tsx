import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useVirtualScroll } from '../useVirtualScroll';

// Mock ResizeObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

const mockResizeObserver = vi.fn().mockImplementation(callback => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
  unobserve: mockUnobserve,
  callback,
}));

window.ResizeObserver = mockResizeObserver as any;

describe('useVirtualScroll', () => {
  const createMockItems = (count: number) => {
    return Array.from({ length: count }, (_, i) => `item-${i}`);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本功能', () => {
    it('应该正确初始化状态', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 50, containerHeight: 500 })
      );

      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBeGreaterThanOrEqual(0);
      expect(result.current.totalHeight).toBe(5000); // 100 * 50
      expect(result.current.visibleItems).toBeInstanceOf(Array);
      expect(result.current.scrollTop).toBe(0);
      expect(result.current.containerRef.current).toBeNull();
      expect(result.current.scrollContainerRef.current).toBeNull();
      expect(typeof result.current.handleScroll).toBe('function');
    });

    it('应该返回正确的ref对象', () => {
      const items = createMockItems(10);
      const { result } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 50 })
      );

      expect(result.current.containerRef).toHaveProperty('current');
      expect(result.current.scrollContainerRef).toHaveProperty('current');
    });

    it('应该计算正确的总高度', () => {
      const items = createMockItems(200);
      const { result } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 80 })
      );

      expect(result.current.totalHeight).toBe(16000); // 200 * 80
    });
  });

  describe('虚拟滚动计算', () => {
    it('应该计算正确的可见范围', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
          bufferSize: 2,
        })
      );

      // 初始状态下应该显示前面的项目
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBeGreaterThan(0);
      expect(result.current.visibleItems.length).toBeGreaterThan(0);
    });

    it('应该根据滚动位置更新可见范围', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
          bufferSize: 2,
        })
      );

      // 模拟滚动事件
      const mockEvent = {
        currentTarget: { scrollTop: 1000 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.handleScroll(mockEvent);
      });

      // 滚动位置应该更新
      expect(result.current.scrollTop).toBe(1000);

      // 可见范围应该根据滚动位置调整
      const expectedStartIndex = Math.max(0, Math.floor(1000 / 50) - 2); // bufferSize = 2
      expect(result.current.startIndex).toBe(expectedStartIndex);
    });

    it('应该处理空项目列表', () => {
      const { result } = renderHook(() =>
        useVirtualScroll([], { itemHeight: 50 })
      );

      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(0);
      expect(result.current.totalHeight).toBe(0);
      expect(result.current.visibleItems).toEqual([0]);
    });

    it('应该正确处理缓冲区大小', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
          bufferSize: 5,
        })
      );

      // 模拟滚动到中间位置
      const mockEvent = {
        currentTarget: { scrollTop: 2500 }, // 第50项的位置
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.handleScroll(mockEvent);
      });

      // 应该包含缓冲区内的项目
      const centerIndex = Math.floor(2500 / 50); // 50
      const expectedStartIndex = Math.max(0, centerIndex - 5);
      expect(result.current.startIndex).toBe(expectedStartIndex);
    });
  });

  describe('可见项目生成', () => {
    it('应该生成正确的可见项目索引', () => {
      const items = createMockItems(20);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 300,
          bufferSize: 1,
        })
      );

      // 检查可见项目是连续的索引
      const visibleItems = result.current.visibleItems;
      expect(visibleItems.length).toBeGreaterThan(0);

      for (let i = 1; i < visibleItems.length; i++) {
        expect(visibleItems[i]).toBe(visibleItems[i - 1] + 1);
      }
    });

    it('应该限制可见项目在有效范围内', () => {
      const items = createMockItems(10);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 1000, // 大于所有项目的高度
          bufferSize: 10,
        })
      );

      const visibleItems = result.current.visibleItems;

      // 所有可见项目索引应该在0到9之间
      visibleItems.forEach(index => {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(10);
      });
    });

    it('应该在滚动时更新可见项目', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 300,
          bufferSize: 2,
        })
      );

      const initialVisibleItems = [...result.current.visibleItems];

      // 滚动到底部
      const mockEvent = {
        currentTarget: { scrollTop: 4000 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.handleScroll(mockEvent);
      });

      const newVisibleItems = [...result.current.visibleItems];

      // 可见项目应该有变化
      expect(newVisibleItems).not.toEqual(initialVisibleItems);

      // 新的可见项目应该包含更大的索引
      expect(Math.min(...newVisibleItems)).toBeGreaterThan(
        Math.min(...initialVisibleItems)
      );
    });
  });

  describe('ResizeObserver 集成', () => {
    it('应该提供containerRef用于观察大小变化', () => {
      const items = createMockItems(10);
      const { result } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 50 })
      );

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });

    it('应该在组件卸载时正确清理', () => {
      const items = createMockItems(10);
      const { unmount } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 50 })
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('滚动事件处理', () => {
    it('应该正确处理滚动事件', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 50 })
      );

      const scrollTop = 1500;
      const mockEvent = {
        currentTarget: { scrollTop },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.handleScroll(mockEvent);
      });

      expect(result.current.scrollTop).toBe(scrollTop);
    });

    it('应该在滚动时重新计算可见范围', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
          bufferSize: 1,
        })
      );

      const scrollPositions = [0, 500, 1000, 1500, 2000];

      scrollPositions.forEach(scrollTop => {
        const mockEvent = {
          currentTarget: { scrollTop },
        } as React.UIEvent<HTMLDivElement>;

        act(() => {
          result.current.handleScroll(mockEvent);
        });

        expect(result.current.scrollTop).toBe(scrollTop);

        // 验证可见范围计算是否正确
        const expectedStartIndex = Math.max(0, Math.floor(scrollTop / 50) - 1);
        expect(result.current.startIndex).toBe(expectedStartIndex);
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理非常大的滚动位置', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
          bufferSize: 2,
        })
      );

      // 滚动到超出范围的位置
      const mockEvent = {
        currentTarget: { scrollTop: 10000 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.handleScroll(mockEvent);
      });

      // endIndex不应该超过items的长度
      expect(result.current.endIndex).toBeLessThan(items.length);
      expect(result.current.startIndex).toBeGreaterThanOrEqual(0);
    });

    it('应该处理负的滚动位置', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 50 })
      );

      // 尝试设置负的滚动位置
      const mockEvent = {
        currentTarget: { scrollTop: -100 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.handleScroll(mockEvent);
      });

      // startIndex不应该为负数
      expect(result.current.startIndex).toBeGreaterThanOrEqual(0);
    });

    it('应该处理零高度的项目', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 0 })
      );

      expect(result.current.totalHeight).toBe(0);
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBeGreaterThanOrEqual(0);
      expect(result.current.visibleItems).toBeDefined();
    });

    it('应该处理单个项目', () => {
      const items = createMockItems(1);
      const { result } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 50, containerHeight: 500 })
      );

      expect(result.current.totalHeight).toBe(50);
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(0);
      expect(result.current.visibleItems).toEqual([0]);
    });
  });

  describe('性能优化', () => {
    it('相同的props不应该重新计算可见范围', () => {
      const items = createMockItems(100);
      const { result, rerender } = renderHook(
        ({ items, options }) => useVirtualScroll(items, options),
        {
          initialProps: {
            items,
            options: { itemHeight: 50, containerHeight: 500 },
          },
        }
      );

      const initialVisibleItems = result.current.visibleItems;
      const initialStartIndex = result.current.startIndex;
      const initialEndIndex = result.current.endIndex;

      // 使用相同的props重新渲染
      rerender({
        items,
        options: { itemHeight: 50, containerHeight: 500 },
      });

      // 结果应该保持一致
      expect(result.current.visibleItems).toEqual(initialVisibleItems);
      expect(result.current.startIndex).toBe(initialStartIndex);
      expect(result.current.endIndex).toBe(initialEndIndex);
    });

    it('当items变化时应该重新计算', () => {
      const initialItems = createMockItems(50);
      const { result, rerender } = renderHook(
        ({ items }) =>
          useVirtualScroll(items, { itemHeight: 50, containerHeight: 500 }),
        { initialProps: { items: initialItems } }
      );

      const initialTotalHeight = result.current.totalHeight;

      // 更改items
      const newItems = createMockItems(100);
      rerender({ items: newItems });

      // 总高度应该更新
      expect(result.current.totalHeight).not.toBe(initialTotalHeight);
      expect(result.current.totalHeight).toBe(5000); // 100 * 50
    });
  });

  describe('容器高度处理', () => {
    it('应该使用提供的初始容器高度', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400,
          bufferSize: 0,
        })
      );

      // 根据容器高度400和项目高度50，应该能显示8个项目
      const visibleCount = Math.ceil(400 / 50);
      expect(
        result.current.endIndex - result.current.startIndex + 1
      ).toBeLessThanOrEqual(visibleCount + 1);
    });

    it('应该处理未提供容器高度的情况', () => {
      const items = createMockItems(100);
      const { result } = renderHook(() =>
        useVirtualScroll(items, { itemHeight: 50 })
      );

      // 应该有默认行为
      expect(result.current.startIndex).toBeGreaterThanOrEqual(0);
      expect(result.current.endIndex).toBeGreaterThanOrEqual(
        result.current.startIndex
      );
    });
  });
});
