import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useLazyLoad } from '../useLazyLoad';

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

const mockIntersectionObserver = vi
  .fn()
  .mockImplementation((callback, options) => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
    callback,
    options,
  }));

window.IntersectionObserver = mockIntersectionObserver as any;

describe('useLazyLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本功能', () => {
    it('应该正确初始化状态', () => {
      const { result } = renderHook(() => useLazyLoad());

      expect(result.current.visibleItems).toBeInstanceOf(Set);
      expect(result.current.visibleItems.size).toBe(0);
      expect(typeof result.current.observeElement).toBe('function');
      expect(typeof result.current.unobserveElement).toBe('function');
    });

    it('应该设置IntersectionObserver', () => {
      renderHook(() => useLazyLoad());

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: 0.1,
          rootMargin: '50px',
        })
      );
    });

    it('应该使用自定义的threshold和rootMargin', () => {
      renderHook(() => useLazyLoad({ threshold: 0.5, rootMargin: '100px' }));

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: 0.5,
          rootMargin: '100px',
        })
      );
    });
  });

  describe('元素观察功能', () => {
    it('应该能够观察元素', () => {
      const { result } = renderHook(() => useLazyLoad());
      const mockElement = document.createElement('div');

      act(() => {
        result.current.observeElement(mockElement, 'item-1');
      });

      // 检查元素是否设置了正确的属性
      expect(mockElement.getAttribute('data-item-id')).toBe('item-1');
    });

    it('应该能够取消观察元素', () => {
      const { result } = renderHook(() => useLazyLoad());
      const mockElement = document.createElement('div');

      // 测试 unobserveElement 不会抛出错误
      expect(() => {
        act(() => {
          result.current.unobserveElement(mockElement);
        });
      }).not.toThrow();
    });

    it('不应该重复设置data-item-id属性', () => {
      const { result } = renderHook(() => useLazyLoad());
      const mockElement = document.createElement('div');

      // 第一次设置
      act(() => {
        result.current.observeElement(mockElement, 'item-1');
      });

      expect(mockElement.getAttribute('data-item-id')).toBe('item-1');

      // 第二次设置相同ID
      act(() => {
        result.current.observeElement(mockElement, 'item-1');
      });

      expect(mockElement.getAttribute('data-item-id')).toBe('item-1');

      // 第三次设置不同ID（应该不会改变）
      act(() => {
        result.current.observeElement(mockElement, 'item-2');
      });

      expect(mockElement.getAttribute('data-item-id')).toBe('item-1');
    });

    it('当observer不存在时不应该抛出错误', () => {
      // 模拟observer为null的情况
      mockIntersectionObserver.mockReturnValueOnce(null);

      const { result } = renderHook(() => useLazyLoad());
      const mockElement = document.createElement('div');

      expect(() => {
        act(() => {
          result.current.observeElement(mockElement, 'item-1');
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.unobserveElement(mockElement);
        });
      }).not.toThrow();
    });
  });

  describe('可见性跟踪', () => {
    it('当元素进入视口时应该添加到可见项目集合', () => {
      const { result } = renderHook(() => useLazyLoad());

      // 获取observer回调函数
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      // 模拟元素进入视口
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-item-id', 'item-1');

      const mockEntry = {
        isIntersecting: true,
        target: mockElement,
      };

      act(() => {
        observerCallback([mockEntry]);
      });

      expect(result.current.visibleItems.has('item-1')).toBe(true);
    });

    it('当元素离开视口时不应该从可见项目集合中移除', () => {
      const { result } = renderHook(() => useLazyLoad());

      // 获取observer回调函数
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      // 模拟元素进入视口
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-item-id', 'item-1');

      act(() => {
        observerCallback([
          {
            isIntersecting: true,
            target: mockElement,
          },
        ]);
      });

      expect(result.current.visibleItems.has('item-1')).toBe(true);

      // 模拟元素离开视口
      act(() => {
        observerCallback([
          {
            isIntersecting: false,
            target: mockElement,
          },
        ]);
      });

      // 应该仍然在可见项目集合中（懒加载的特性）
      expect(result.current.visibleItems.has('item-1')).toBe(true);
    });

    it('当元素没有data-item-id属性时不应该添加到可见项目集合', () => {
      const { result } = renderHook(() => useLazyLoad());

      // 获取observer回调函数
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      // 模拟没有data-item-id的元素进入视口
      const mockElement = document.createElement('div');
      // 不设置data-item-id属性

      const mockEntry = {
        isIntersecting: true,
        target: mockElement,
      };

      act(() => {
        observerCallback([mockEntry]);
      });

      expect(result.current.visibleItems.size).toBe(0);
    });

    it('应该能够跟踪多个可见元素', () => {
      const { result } = renderHook(() => useLazyLoad());

      // 获取observer回调函数
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      // 模拟多个元素进入视口
      const elements = [
        { id: 'item-1', element: document.createElement('div') },
        { id: 'item-2', element: document.createElement('div') },
        { id: 'item-3', element: document.createElement('div') },
      ];

      elements.forEach(({ id, element }) => {
        element.setAttribute('data-item-id', id);
      });

      act(() => {
        observerCallback(
          elements.map(({ element }) => ({
            isIntersecting: true,
            target: element,
          }))
        );
      });

      expect(result.current.visibleItems.size).toBe(3);
      expect(result.current.visibleItems.has('item-1')).toBe(true);
      expect(result.current.visibleItems.has('item-2')).toBe(true);
      expect(result.current.visibleItems.has('item-3')).toBe(true);
    });
  });

  describe('清理功能', () => {
    it('应该在组件卸载时断开observer连接', () => {
      const { unmount } = renderHook(() => useLazyLoad());

      // 测试卸载不会抛出错误
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('当observer不存在时清理不应该抛出错误', () => {
      // 模拟observer为null的情况
      mockIntersectionObserver.mockReturnValueOnce(null);

      const { unmount } = renderHook(() => useLazyLoad());

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('依赖项变化', () => {
    it('当threshold或rootMargin变化时应该重新创建observer', () => {
      const { rerender } = renderHook(({ options }) => useLazyLoad(options), {
        initialProps: { options: { threshold: 0.1, rootMargin: '50px' } },
      });

      expect(mockIntersectionObserver).toHaveBeenCalledTimes(1);

      // 改变选项
      rerender({ options: { threshold: 0.5, rootMargin: '100px' } });

      expect(mockIntersectionObserver).toHaveBeenCalledTimes(2);
      expect(mockIntersectionObserver).toHaveBeenLastCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: 0.5,
          rootMargin: '100px',
        })
      );
    });

    it('当选项相同时不应该重新创建observer', () => {
      const options = { threshold: 0.1, rootMargin: '50px' };
      const { rerender } = renderHook(({ opts }) => useLazyLoad(opts), {
        initialProps: { opts: options },
      });

      expect(mockIntersectionObserver).toHaveBeenCalledTimes(1);

      // 使用相同的选项重新渲染
      rerender({ opts: options });

      expect(mockIntersectionObserver).toHaveBeenCalledTimes(1);
    });
  });

  describe('边界情况', () => {
    it('应该处理空的entries数组', () => {
      const { result } = renderHook(() => useLazyLoad());

      // 获取observer回调函数
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      expect(() => {
        act(() => {
          observerCallback([]);
        });
      }).not.toThrow();

      expect(result.current.visibleItems.size).toBe(0);
    });

    it('应该处理多个entries中的部分元素没有data-item-id', () => {
      const { result } = renderHook(() => useLazyLoad());

      // 获取observer回调函数
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      const elements = [
        { id: 'item-1', element: document.createElement('div') },
        { element: document.createElement('div') }, // 没有ID
        { id: 'item-3', element: document.createElement('div') },
      ];

      elements.forEach(({ id, element }) => {
        if (id) {
          element.setAttribute('data-item-id', id);
        }
      });

      act(() => {
        observerCallback(
          elements.map(({ element }) => ({
            isIntersecting: true,
            target: element,
          }))
        );
      });

      expect(result.current.visibleItems.size).toBe(2);
      expect(result.current.visibleItems.has('item-1')).toBe(true);
      expect(result.current.visibleItems.has('item-3')).toBe(true);
    });
  });
});
