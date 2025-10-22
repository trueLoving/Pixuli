import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useImageDimensions, useImageInfo } from '../useImageDimensions';
import { getImageDimensions, getImageInfo } from '@/utils/imageUtils';

// Mock the imageUtils functions
vi.mock('@/utils/imageUtils', () => ({
  getImageDimensions: vi.fn(),
  getImageInfo: vi.fn(),
}));

describe('useImageDimensions', () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const mockDimensions = { width: 800, height: 600 };
  const mockImageInfo = {
    width: 800,
    height: 600,
    naturalWidth: 800,
    naturalHeight: 600,
    aspectRatio: 1.33,
    orientation: 'landscape' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本功能', () => {
    it('应该正确初始化状态', () => {
      const { result } = renderHook(() => useImageDimensions(null));

      expect(result.current.dimensions).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.loadDimensions).toBe('function');
      expect(typeof result.current.loadImageInfo).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('应该能够手动加载图片尺寸', async () => {
      vi.mocked(getImageDimensions).mockResolvedValue(mockDimensions);

      const { result } = renderHook(() =>
        useImageDimensions(null, { autoLoad: false })
      );

      await act(async () => {
        await result.current.loadDimensions(mockFile);
      });

      expect(result.current.dimensions).toEqual(mockDimensions);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(getImageDimensions).toHaveBeenCalledWith(mockFile);
    });

    it('应该能够手动加载图片信息', async () => {
      vi.mocked(getImageInfo).mockResolvedValue(mockImageInfo);

      const { result } = renderHook(() =>
        useImageDimensions(null, { autoLoad: false })
      );

      await act(async () => {
        await result.current.loadImageInfo(mockFile);
      });

      expect(result.current.dimensions).toEqual({
        width: mockImageInfo.width,
        height: mockImageInfo.height,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(getImageInfo).toHaveBeenCalledWith(mockFile);
    });

    it('应该能够重置状态', async () => {
      vi.mocked(getImageDimensions).mockResolvedValue(mockDimensions);

      const { result } = renderHook(() =>
        useImageDimensions(null, { autoLoad: false })
      );

      // 先加载数据
      await act(async () => {
        await result.current.loadDimensions(mockFile);
      });

      expect(result.current.dimensions).toEqual(mockDimensions);

      // 然后重置
      act(() => {
        result.current.reset();
      });

      expect(result.current.dimensions).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('自动加载功能', () => {
    it('应该在文件变化时自动加载尺寸', async () => {
      vi.mocked(getImageDimensions).mockResolvedValue(mockDimensions);

      const { result, rerender } = renderHook(
        ({ file }) => useImageDimensions(file, { autoLoad: true }),
        { initialProps: { file: null } }
      );

      // 设置文件
      rerender({ file: mockFile });

      await waitFor(() => {
        expect(result.current.dimensions).toEqual(mockDimensions);
      });

      expect(getImageDimensions).toHaveBeenCalledWith(mockFile);
    });

    it('当 autoLoad 为 false 时不应该自动加载', async () => {
      vi.mocked(getImageDimensions).mockResolvedValue(mockDimensions);

      const { result, rerender } = renderHook(
        ({ file }) => useImageDimensions(file, { autoLoad: false }),
        { initialProps: { file: null } }
      );

      // 设置文件
      rerender({ file: mockFile });

      // 等待一段时间确保没有自动加载
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.dimensions).toBeNull();
      expect(getImageDimensions).not.toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该正确处理加载尺寸时的错误', async () => {
      const error = new Error('图片加载失败');
      vi.mocked(getImageDimensions).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useImageDimensions(null, { autoLoad: false })
      );

      await act(async () => {
        await result.current.loadDimensions(mockFile);
      });

      expect(result.current.dimensions).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
    });

    it('应该正确处理加载图片信息时的错误', async () => {
      const error = new Error('图片信息加载失败');
      vi.mocked(getImageInfo).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useImageDimensions(null, { autoLoad: false })
      );

      await act(async () => {
        await result.current.loadImageInfo(mockFile);
      });

      expect(result.current.dimensions).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
    });

    it('应该将非Error对象转换为Error', async () => {
      vi.mocked(getImageDimensions).mockRejectedValue('字符串错误');

      const { result } = renderHook(() =>
        useImageDimensions(null, { autoLoad: false })
      );

      await act(async () => {
        await result.current.loadDimensions(mockFile);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('获取图片尺寸失败');
    });
  });

  describe('回调函数', () => {
    it('应该在成功加载时调用 onSuccess 回调', async () => {
      vi.mocked(getImageDimensions).mockResolvedValue(mockDimensions);
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useImageDimensions(null, { autoLoad: false, onSuccess })
      );

      await act(async () => {
        await result.current.loadDimensions(mockFile);
      });

      expect(onSuccess).toHaveBeenCalledWith(mockDimensions);
    });

    it('应该在加载失败时调用 onError 回调', async () => {
      const error = new Error('加载失败');
      vi.mocked(getImageDimensions).mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useImageDimensions(null, { autoLoad: false, onError })
      );

      await act(async () => {
        await result.current.loadDimensions(mockFile);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('加载状态', () => {
    it('应该在加载过程中设置 loading 状态', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      vi.mocked(getImageDimensions).mockReturnValue(promise as any);

      const { result } = renderHook(() =>
        useImageDimensions(null, { autoLoad: false })
      );

      // 开始加载
      act(() => {
        result.current.loadDimensions(mockFile);
      });

      expect(result.current.loading).toBe(true);

      // 完成加载
      await act(async () => {
        resolvePromise!(mockDimensions);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useImageInfo', () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const mockImageInfo = {
    width: 800,
    height: 600,
    naturalWidth: 800,
    naturalHeight: 600,
    aspectRatio: 1.33,
    orientation: 'landscape' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本功能', () => {
    it('应该正确初始化状态', () => {
      const { result } = renderHook(() => useImageInfo(null));

      expect(result.current.imageInfo).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.loadImageInfo).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('应该能够手动加载图片信息', async () => {
      vi.mocked(getImageInfo).mockResolvedValue(mockImageInfo);

      const { result } = renderHook(() =>
        useImageInfo(null, { autoLoad: false })
      );

      await act(async () => {
        await result.current.loadImageInfo(mockFile);
      });

      expect(result.current.imageInfo).toEqual(mockImageInfo);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(getImageInfo).toHaveBeenCalledWith(mockFile);
    });

    it('应该能够重置状态', async () => {
      vi.mocked(getImageInfo).mockResolvedValue(mockImageInfo);

      const { result } = renderHook(() =>
        useImageInfo(null, { autoLoad: false })
      );

      // 先加载数据
      await act(async () => {
        await result.current.loadImageInfo(mockFile);
      });

      expect(result.current.imageInfo).toEqual(mockImageInfo);

      // 然后重置
      act(() => {
        result.current.reset();
      });

      expect(result.current.imageInfo).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('自动加载功能', () => {
    it('应该在文件变化时自动加载图片信息', async () => {
      vi.mocked(getImageInfo).mockResolvedValue(mockImageInfo);

      const { result, rerender } = renderHook(
        ({ file }) => useImageInfo(file, { autoLoad: true }),
        { initialProps: { file: null } }
      );

      // 设置文件
      rerender({ file: mockFile });

      await waitFor(() => {
        expect(result.current.imageInfo).toEqual(mockImageInfo);
      });

      expect(getImageInfo).toHaveBeenCalledWith(mockFile);
    });

    it('当 autoLoad 为 false 时不应该自动加载', async () => {
      vi.mocked(getImageInfo).mockResolvedValue(mockImageInfo);

      const { result, rerender } = renderHook(
        ({ file }) => useImageInfo(file, { autoLoad: false }),
        { initialProps: { file: null } }
      );

      // 设置文件
      rerender({ file: mockFile });

      // 等待一段时间确保没有自动加载
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.imageInfo).toBeNull();
      expect(getImageInfo).not.toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该正确处理加载图片信息时的错误', async () => {
      const error = new Error('图片信息加载失败');
      vi.mocked(getImageInfo).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useImageInfo(null, { autoLoad: false })
      );

      await act(async () => {
        await result.current.loadImageInfo(mockFile);
      });

      expect(result.current.imageInfo).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
    });

    it('应该将非Error对象转换为Error', async () => {
      vi.mocked(getImageInfo).mockRejectedValue('字符串错误');

      const { result } = renderHook(() =>
        useImageInfo(null, { autoLoad: false })
      );

      await act(async () => {
        await result.current.loadImageInfo(mockFile);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('获取图片信息失败');
    });
  });

  describe('回调函数', () => {
    it('应该在成功加载时调用 onSuccess 回调', async () => {
      vi.mocked(getImageInfo).mockResolvedValue(mockImageInfo);
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useImageInfo(null, { autoLoad: false, onSuccess })
      );

      await act(async () => {
        await result.current.loadImageInfo(mockFile);
      });

      expect(onSuccess).toHaveBeenCalledWith({
        width: mockImageInfo.width,
        height: mockImageInfo.height,
      });
    });

    it('应该在加载失败时调用 onError 回调', async () => {
      const error = new Error('加载失败');
      vi.mocked(getImageInfo).mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useImageInfo(null, { autoLoad: false, onError })
      );

      await act(async () => {
        await result.current.loadImageInfo(mockFile);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
