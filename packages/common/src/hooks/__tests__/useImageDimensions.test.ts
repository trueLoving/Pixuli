import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useImageDimensions,
  useImageInfo,
  useImageDimensionsFromUrl,
} from '../useImageDimensions';
import * as imageUtils from '../../utils/imageUtils';

// Mock imageUtils
vi.mock('../../utils/imageUtils', () => ({
  getImageDimensions: vi.fn(),
  getImageInfo: vi.fn(),
  getImageDimensionsFromUrl: vi.fn(),
}));

describe('useImageDimensions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该初始化时返回正确的默认值', () => {
    const { result } = renderHook(() => useImageDimensions(null));

    expect(result.current.dimensions).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应该自动加载图片尺寸当autoLoad为true', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockDimensions = { width: 100, height: 200 };

    vi.mocked(imageUtils.getImageDimensions).mockResolvedValue(mockDimensions);

    const { result } = renderHook(() =>
      useImageDimensions(mockFile, { autoLoad: true })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dimensions).toEqual(mockDimensions);
    expect(result.current.error).toBeNull();
    expect(imageUtils.getImageDimensions).toHaveBeenCalledWith(mockFile);
  });

  it('应该不自动加载当autoLoad为false', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const { result } = renderHook(() =>
      useImageDimensions(mockFile, { autoLoad: false })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.dimensions).toBeNull();
    expect(imageUtils.getImageDimensions).not.toHaveBeenCalled();
  });

  it('应该调用onSuccess回调当加载成功', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockDimensions = { width: 100, height: 200 };
    const onSuccess = vi.fn();

    vi.mocked(imageUtils.getImageDimensions).mockResolvedValue(mockDimensions);

    renderHook(() => useImageDimensions(mockFile, { onSuccess }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockDimensions);
    });
  });

  it('应该处理加载错误', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockError = new Error('加载失败');
    const onError = vi.fn();

    vi.mocked(imageUtils.getImageDimensions).mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useImageDimensions(mockFile, { onError })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.dimensions).toBeNull();
    expect(onError).toHaveBeenCalled();
  });

  it('应该手动加载图片尺寸', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockDimensions = { width: 100, height: 200 };

    vi.mocked(imageUtils.getImageDimensions).mockResolvedValue(mockDimensions);

    const { result } = renderHook(() =>
      useImageDimensions(null, { autoLoad: false })
    );

    await act(async () => {
      await result.current.loadDimensions(mockFile);
    });

    expect(result.current.dimensions).toEqual(mockDimensions);
    expect(imageUtils.getImageDimensions).toHaveBeenCalledWith(mockFile);
  });

  it('应该手动加载图片信息', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockImageInfo = {
      width: 100,
      height: 200,
      naturalWidth: 100,
      naturalHeight: 200,
      aspectRatio: 0.5,
      orientation: 'portrait' as const,
    };

    vi.mocked(imageUtils.getImageInfo).mockResolvedValue(mockImageInfo);

    const { result } = renderHook(() =>
      useImageDimensions(null, { autoLoad: false })
    );

    await act(async () => {
      await result.current.loadImageInfo(mockFile);
    });

    expect(result.current.dimensions).toEqual({
      width: 100,
      height: 200,
    });
    expect(imageUtils.getImageInfo).toHaveBeenCalledWith(mockFile);
  });

  it('应该重置状态', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockDimensions = { width: 100, height: 200 };

    vi.mocked(imageUtils.getImageDimensions).mockResolvedValue(mockDimensions);

    const { result } = renderHook(() => useImageDimensions(mockFile));

    await waitFor(() => {
      expect(result.current.dimensions).not.toBeNull();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.dimensions).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应该当文件变化时重新加载', async () => {
    const mockFile1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
    const mockFile2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
    const mockDimensions1 = { width: 100, height: 200 };
    const mockDimensions2 = { width: 200, height: 300 };

    vi.mocked(imageUtils.getImageDimensions)
      .mockResolvedValueOnce(mockDimensions1)
      .mockResolvedValueOnce(mockDimensions2);

    const { result, rerender } = renderHook(
      ({ file }) => useImageDimensions(file),
      {
        initialProps: { file: mockFile1 },
      }
    );

    await waitFor(() => {
      expect(result.current.dimensions).toEqual(mockDimensions1);
    });

    rerender({ file: mockFile2 });

    await waitFor(() => {
      expect(result.current.dimensions).toEqual(mockDimensions2);
    });
  });
});

describe('useImageInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该初始化时返回正确的默认值', () => {
    const { result } = renderHook(() => useImageInfo(null));

    expect(result.current.imageInfo).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应该自动加载图片信息', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockImageInfo = {
      width: 100,
      height: 200,
      naturalWidth: 100,
      naturalHeight: 200,
      aspectRatio: 0.5,
      orientation: 'portrait' as const,
    };

    vi.mocked(imageUtils.getImageInfo).mockResolvedValue(mockImageInfo);

    const { result } = renderHook(() => useImageInfo(mockFile));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.imageInfo).toEqual(mockImageInfo);
    expect(result.current.error).toBeNull();
  });

  it('应该处理加载错误', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockError = new Error('加载失败');

    vi.mocked(imageUtils.getImageInfo).mockRejectedValue(mockError);

    const { result } = renderHook(() => useImageInfo(mockFile));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.imageInfo).toBeNull();
  });

  it('应该重置状态', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockImageInfo = {
      width: 100,
      height: 200,
      naturalWidth: 100,
      naturalHeight: 200,
      aspectRatio: 0.5,
      orientation: 'portrait' as const,
    };

    vi.mocked(imageUtils.getImageInfo).mockResolvedValue(mockImageInfo);

    const { result } = renderHook(() => useImageInfo(mockFile));

    await waitFor(() => {
      expect(result.current.imageInfo).not.toBeNull();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.imageInfo).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useImageDimensionsFromUrl (from useImageDimensions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该初始化时返回正确的默认值', () => {
    const { result } = renderHook(() => useImageDimensionsFromUrl(null));

    expect(result.current.dimensions).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应该自动加载图片尺寸从URL', async () => {
    const mockUrl = 'https://example.com/image.jpg';
    const mockDimensions = { width: 100, height: 200 };

    vi.mocked(imageUtils.getImageDimensionsFromUrl).mockResolvedValue(
      mockDimensions
    );

    const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dimensions).toEqual(mockDimensions);
    expect(result.current.error).toBeNull();
    expect(imageUtils.getImageDimensionsFromUrl).toHaveBeenCalledWith(mockUrl);
  });

  it('应该处理加载错误', async () => {
    const mockUrl = 'https://example.com/invalid.jpg';
    const mockError = new Error('加载失败');

    vi.mocked(imageUtils.getImageDimensionsFromUrl).mockRejectedValue(
      mockError
    );

    const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.dimensions).toBeNull();
  });

  it('应该手动加载图片尺寸从URL', async () => {
    const mockUrl = 'https://example.com/image.jpg';
    const mockDimensions = { width: 100, height: 200 };

    vi.mocked(imageUtils.getImageDimensionsFromUrl).mockResolvedValue(
      mockDimensions
    );

    const { result } = renderHook(() =>
      useImageDimensionsFromUrl(null, { autoLoad: false })
    );

    await act(async () => {
      await result.current.loadDimensions(mockUrl);
    });

    expect(result.current.dimensions).toEqual(mockDimensions);
    expect(imageUtils.getImageDimensionsFromUrl).toHaveBeenCalledWith(mockUrl);
  });

  it('应该当URL变化时重新加载', async () => {
    const mockUrl1 = 'https://example.com/image1.jpg';
    const mockUrl2 = 'https://example.com/image2.jpg';
    const mockDimensions1 = { width: 100, height: 200 };
    const mockDimensions2 = { width: 200, height: 300 };

    vi.mocked(imageUtils.getImageDimensionsFromUrl)
      .mockResolvedValueOnce(mockDimensions1)
      .mockResolvedValueOnce(mockDimensions2);

    const { result, rerender } = renderHook(
      ({ url }) => useImageDimensionsFromUrl(url),
      {
        initialProps: { url: mockUrl1 },
      }
    );

    await waitFor(() => {
      expect(result.current.dimensions).toEqual(mockDimensions1);
    });

    rerender({ url: mockUrl2 });

    await waitFor(() => {
      expect(result.current.dimensions).toEqual(mockDimensions2);
    });
  });
});
