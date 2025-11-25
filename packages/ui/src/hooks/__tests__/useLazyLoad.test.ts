import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLazyLoad } from '../useLazyLoad';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  private callback: IntersectionObserverCallback;

  constructor(
    callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {
    this.callback = callback;
  }

  // 用于测试：手动触发intersection change
  triggerIntersection(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this);
  }
}

describe('useLazyLoad', () => {
  let mockObserver: MockIntersectionObserver;

  beforeEach(() => {
    vi.clearAllMocks();
    mockObserver = new MockIntersectionObserver(() => {});
    global.IntersectionObserver = vi.fn(
      (
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ) => {
        mockObserver = new MockIntersectionObserver(callback, options);
        return mockObserver as any;
      }
    ) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该初始化时返回正确的默认值', () => {
    const { result } = renderHook(() => useLazyLoad());

    expect(result.current.visibleItems).toBeInstanceOf(Set);
    expect(result.current.visibleItems.size).toBe(0);
  });

  it('应该创建IntersectionObserver', () => {
    renderHook(() => useLazyLoad());

    expect(global.IntersectionObserver).toHaveBeenCalled();
  });

  it('应该使用默认的threshold和rootMargin', () => {
    renderHook(() => useLazyLoad());

    const callArgs = vi.mocked(global.IntersectionObserver).mock.calls[0];
    expect(callArgs[1]?.threshold).toBe(0.1);
    expect(callArgs[1]?.rootMargin).toBe('50px');
  });

  it('应该使用自定义的threshold和rootMargin', () => {
    renderHook(() => useLazyLoad({ threshold: 0.5, rootMargin: '100px' }));

    const callArgs = vi.mocked(global.IntersectionObserver).mock.calls[0];
    expect(callArgs[1]?.threshold).toBe(0.5);
    expect(callArgs[1]?.rootMargin).toBe('100px');
  });

  it('应该观察元素', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element = document.createElement('div');

    act(() => {
      result.current.observeElement(element, 'item-1');
    });

    expect(mockObserver.observe).toHaveBeenCalledWith(element);
    expect(element.getAttribute('data-item-id')).toBe('item-1');
  });

  it('应该设置data-item-id属性', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element = document.createElement('div');

    act(() => {
      result.current.observeElement(element, 'item-1');
    });

    expect(element.getAttribute('data-item-id')).toBe('item-1');
  });

  it('应该不重复设置data-item-id', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element = document.createElement('div');
    element.setAttribute('data-item-id', 'existing-id');

    act(() => {
      result.current.observeElement(element, 'new-id');
    });

    expect(element.getAttribute('data-item-id')).toBe('existing-id');
  });

  it('应该将可见元素添加到visibleItems', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element = document.createElement('div');

    act(() => {
      result.current.observeElement(element, 'item-1');
    });

    // 模拟intersection observer触发
    act(() => {
      const mockEntry = {
        target: element,
        isIntersecting: true,
      } as IntersectionObserverEntry;

      mockObserver.triggerIntersection([mockEntry]);
    });

    expect(result.current.visibleItems.has('item-1')).toBe(true);
  });

  it('应该取消观察元素', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element = document.createElement('div');

    act(() => {
      result.current.observeElement(element, 'item-1');
      result.current.unobserveElement(element);
    });

    expect(mockObserver.unobserve).toHaveBeenCalledWith(element);
  });

  it('应该处理多个元素的观察', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    const element3 = document.createElement('div');

    act(() => {
      result.current.observeElement(element1, 'item-1');
      result.current.observeElement(element2, 'item-2');
      result.current.observeElement(element3, 'item-3');
    });

    expect(mockObserver.observe).toHaveBeenCalledTimes(3);

    // 模拟所有元素都可见
    act(() => {
      const mockEntry1 = {
        target: element1,
        isIntersecting: true,
      } as IntersectionObserverEntry;
      const mockEntry2 = {
        target: element2,
        isIntersecting: true,
      } as IntersectionObserverEntry;
      const mockEntry3 = {
        target: element3,
        isIntersecting: true,
      } as IntersectionObserverEntry;

      mockObserver.triggerIntersection([mockEntry1, mockEntry2, mockEntry3]);
    });

    expect(result.current.visibleItems.size).toBe(3);
    expect(result.current.visibleItems.has('item-1')).toBe(true);
    expect(result.current.visibleItems.has('item-2')).toBe(true);
    expect(result.current.visibleItems.has('item-3')).toBe(true);
  });

  it('应该只添加有data-item-id的元素', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element = document.createElement('div');
    // 不设置data-item-id

    act(() => {
      const mockEntry = {
        target: element,
        isIntersecting: true,
      } as IntersectionObserverEntry;

      mockObserver.triggerIntersection([mockEntry]);
    });

    expect(result.current.visibleItems.size).toBe(0);
  });

  it('应该清理IntersectionObserver', () => {
    const { unmount } = renderHook(() => useLazyLoad());

    unmount();

    expect(mockObserver.disconnect).toHaveBeenCalled();
  });

  it('应该处理observer为null的情况', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element = document.createElement('div');

    // 模拟observer为null
    vi.mocked(global.IntersectionObserver).mockImplementationOnce(
      () => null as any
    );

    const { result: result2 } = renderHook(() => useLazyLoad());

    act(() => {
      result2.current.observeElement(element, 'item-1');
    });

    // 应该不会抛出错误
    expect(element.getAttribute('data-item-id')).toBe('item-1');
  });

  it('应该处理observe方法不存在的情况', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element = document.createElement('div');

    // 创建一个没有observe方法的observer
    const brokenObserver = {
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    };

    vi.mocked(global.IntersectionObserver).mockImplementationOnce(
      () => brokenObserver as any
    );

    const { result: result2 } = renderHook(() => useLazyLoad());

    act(() => {
      result2.current.observeElement(element, 'item-1');
    });

    // 应该不会抛出错误
    expect(element.getAttribute('data-item-id')).toBe('item-1');
  });

  it('应该处理unobserve方法不存在的情况', () => {
    const { result } = renderHook(() => useLazyLoad());
    const element = document.createElement('div');

    // 创建一个没有unobserve方法的observer
    const brokenObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };

    vi.mocked(global.IntersectionObserver).mockImplementationOnce(
      () => brokenObserver as any
    );

    const { result: result2 } = renderHook(() => useLazyLoad());

    act(() => {
      result2.current.observeElement(element, 'item-1');
      result2.current.unobserveElement(element);
    });

    // 应该不会抛出错误
    expect(brokenObserver.observe).toHaveBeenCalled();
  });
});
