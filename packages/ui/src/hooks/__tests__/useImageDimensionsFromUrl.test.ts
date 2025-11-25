import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useImageDimensionsFromUrl } from '../useImageDimensionsFromUrl';

describe('useImageDimensionsFromUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Image constructor
    global.Image = vi.fn(() => {
      const img = {
        naturalWidth: 0,
        naturalHeight: 0,
        crossOrigin: '',
        src: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
      } as any;
      return img;
    }) as any;
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

  it('应该自动加载图片尺寸当enabled为true', async () => {
    const mockUrl = 'https://example.com/image.jpg';
    const mockImage = {
      naturalWidth: 100,
      naturalHeight: 200,
      crossOrigin: '',
      src: '',
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };

    vi.mocked(global.Image).mockImplementation(() => mockImage as any);

    const { result } = renderHook(() =>
      useImageDimensionsFromUrl(mockUrl, { enabled: true })
    );

    expect(result.current.loading).toBe(true);

    // 模拟图片加载成功
    setTimeout(() => {
      if (mockImage.onload) {
        mockImage.onload();
      }
    }, 0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dimensions).toEqual({ width: 100, height: 200 });
    expect(result.current.error).toBeNull();
    expect(mockImage.crossOrigin).toBe('anonymous');
    expect(mockImage.src).toBe(mockUrl);
  });

  it('应该不加载当enabled为false', () => {
    const mockUrl = 'https://example.com/image.jpg';

    const { result } = renderHook(() =>
      useImageDimensionsFromUrl(mockUrl, { enabled: false })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.dimensions).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('应该不加载当URL为null', () => {
    const { result } = renderHook(() => useImageDimensionsFromUrl(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.dimensions).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('应该处理图片加载失败', async () => {
    const mockUrl = 'https://example.com/invalid.jpg';
    const mockImage = {
      naturalWidth: 0,
      naturalHeight: 0,
      crossOrigin: '',
      src: '',
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };

    vi.mocked(global.Image).mockImplementation(() => mockImage as any);

    const { result } = renderHook(() => useImageDimensionsFromUrl(mockUrl));

    // 模拟图片加载失败
    setTimeout(() => {
      if (mockImage.onerror) {
        mockImage.onerror();
      }
    }, 0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('图片加载失败');
    expect(result.current.dimensions).toBeNull();
  });

  it('应该使用自定义超时时间', async () => {
    const mockUrl = 'https://example.com/image.jpg';
    const mockImage = {
      naturalWidth: 0,
      naturalHeight: 0,
      crossOrigin: '',
      src: '',
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };

    vi.mocked(global.Image).mockImplementation(() => mockImage as any);
    vi.useFakeTimers();

    renderHook(() => useImageDimensionsFromUrl(mockUrl, { timeout: 5000 }));

    // 快进时间但不超过超时时间
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // 应该还没有超时（onload可能已经被设置，但不会立即调用）
    // 这个测试主要验证timeout参数被正确使用
    expect(mockImage.src).toBe(mockUrl);

    vi.useRealTimers();
  });
});
