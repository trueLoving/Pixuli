import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getImageDimensions,
  getImageInfo,
  getImageDimensionsFromUrl,
  isImageFile,
  calculateDisplayDimensions,
  compressImage,
} from '../imageUtils';

describe('imageUtils', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL 和 URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isImageFile', () => {
    it('应该返回true对于图片文件', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(isImageFile(file)).toBe(true);
    });

    it('应该返回false对于非图片文件', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isImageFile(file)).toBe(false);
    });
  });

  describe('calculateDisplayDimensions', () => {
    it('应该保持宽高比当只限制宽度', () => {
      const result = calculateDisplayDimensions(200, 100, 100, undefined, true);
      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
    });

    it('应该保持宽高比当只限制高度', () => {
      const result = calculateDisplayDimensions(200, 100, undefined, 50, true);
      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
    });

    it('应该保持宽高比当限制宽度和高度', () => {
      const result = calculateDisplayDimensions(200, 100, 100, 50, true);
      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
    });

    it('应该选择较小的缩放比例', () => {
      const result = calculateDisplayDimensions(200, 100, 50, 50, true);
      expect(result.width).toBe(50);
      expect(result.height).toBe(25);
    });

    it('应该不保持宽高比当keepAspectRatio为false', () => {
      const result = calculateDisplayDimensions(200, 100, 100, 50, false);
      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
    });

    it('应该返回原始尺寸当没有限制', () => {
      const result = calculateDisplayDimensions(200, 100);
      expect(result.width).toBe(200);
      expect(result.height).toBe(100);
    });
  });

  describe('getImageDimensions', () => {
    it('应该获取图片尺寸', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      // Mock Image
      const mockImage = {
        width: 100,
        height: 200,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = getImageDimensions(file);

      // 模拟图片加载成功
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await promise;
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
    });

    it('应该处理图片加载失败', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const mockImage = {
        width: 0,
        height: 0,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = getImageDimensions(file);

      // 模拟图片加载失败
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      await expect(promise).rejects.toThrow('图片加载失败');
    });
  });

  describe('getImageInfo', () => {
    it('应该获取图片详细信息', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const mockImage = {
        width: 100,
        height: 200,
        naturalWidth: 100,
        naturalHeight: 200,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = getImageInfo(file);

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await promise;
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
      expect(result.aspectRatio).toBe(0.5);
      expect(result.orientation).toBe('portrait');
    });

    it('应该识别横向图片', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const mockImage = {
        width: 200,
        height: 100,
        naturalWidth: 200,
        naturalHeight: 100,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = getImageInfo(file);

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await promise;
      expect(result.orientation).toBe('landscape');
    });

    it('应该识别正方形图片', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const mockImage = {
        width: 100,
        height: 100,
        naturalWidth: 100,
        naturalHeight: 100,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = getImageInfo(file);

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await promise;
      expect(result.orientation).toBe('square');
    });
  });

  describe('getImageDimensionsFromUrl', () => {
    it('应该从URL获取图片尺寸', async () => {
      const url = 'https://example.com/image.jpg';

      const mockImage = {
        naturalWidth: 100,
        naturalHeight: 200,
        onload: null as any,
        onerror: null as any,
        src: '',
        crossOrigin: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = getImageDimensionsFromUrl(url);

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await promise;
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
      expect(mockImage.crossOrigin).toBe('anonymous');
      expect(mockImage.src).toBe(url);
    });

    it('应该处理URL加载失败', async () => {
      const url = 'https://example.com/invalid.jpg';

      const mockImage = {
        naturalWidth: 0,
        naturalHeight: 0,
        onload: null as any,
        onerror: null as any,
        src: '',
        crossOrigin: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = getImageDimensionsFromUrl(url);

      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      await expect(promise).rejects.toThrow('图片加载失败');
    });
  });

  describe('compressImage', () => {
    it('应该压缩图片', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const mockImage = {
        width: 200,
        height: 200,
        naturalWidth: 200,
        naturalHeight: 200,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      // Mock canvas
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
        toBlob: vi.fn((callback: any) => {
          const blob = new Blob(['compressed'], { type: 'image/jpeg' });
          callback(blob);
        }),
      };

      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return mockCanvas as any;
        }
        return document.createElement(tag);
      });

      const promise = compressImage(file, {
        quality: 0.8,
        maxWidth: 100,
        maxHeight: 100,
      });

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await promise;
      expect(result.compressedFile).toBeInstanceOf(File);
      expect(result.originalSize).toBe(file.size);
      expect(result.compressedDimensions.width).toBe(100);
      expect(result.compressedDimensions.height).toBe(100);
    });

    it('应该跳过压缩当文件小于最小压缩大小', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const mockImage = {
        width: 100,
        height: 100,
        naturalWidth: 100,
        naturalHeight: 100,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = compressImage(file, {
        minSizeToCompress: 10000,
      });

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await promise;
      expect(result.compressedFile).toBe(file);
      expect(result.compressionRatio).toBe(0);
    });
  });
});
