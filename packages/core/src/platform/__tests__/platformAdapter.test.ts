import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DefaultPlatformAdapter,
  type PlatformAdapter,
} from '../platformAdapter';

describe('DefaultPlatformAdapter', () => {
  let adapter: PlatformAdapter;

  beforeEach(() => {
    adapter = new DefaultPlatformAdapter();
    // Mock URL.createObjectURL 和 URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getImageDimensions', () => {
    it('应该从 File 对象获取图片尺寸', async () => {
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

      const promise = adapter.getImageDimensions(file);

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await promise;
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('应该从 URI 字符串获取图片尺寸', async () => {
      const uri = 'https://example.com/image.jpg';

      const mockImage = {
        width: 150,
        height: 250,
        naturalWidth: 150,
        naturalHeight: 250,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = adapter.getImageDimensions(uri);

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await promise;
      expect(result.width).toBe(150);
      expect(result.height).toBe(250);
      expect(mockImage.src).toBe(uri);
    });

    it('应该处理图片加载失败的情况（File）', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const mockImage = {
        width: 0,
        height: 0,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = adapter.getImageDimensions(file);

      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      const result = await promise;
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });

    it('应该处理图片加载失败的情况（URI）', async () => {
      const uri = 'https://example.com/invalid.jpg';

      const mockImage = {
        width: 0,
        height: 0,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = adapter.getImageDimensions(uri);

      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      const result = await promise;
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });

    it('应该处理超时情况', async () => {
      vi.useFakeTimers();
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const mockImage = {
        width: 0,
        height: 0,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const promise = adapter.getImageDimensions(file);

      // 模拟超时
      vi.advanceTimersByTime(10001);

      const result = await promise;
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('fileToBase64', () => {
    it('应该将 File 对象转换为 base64', async () => {
      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const mockFileReader = {
        result: 'data:image/jpeg;base64,dGVzdCBjb250ZW50',
        onload: null as any,
        onerror: null as any,
        readAsDataURL: vi.fn(function (this: any) {
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }),
      };

      vi.spyOn(window, 'FileReader').mockImplementation(
        () => mockFileReader as any,
      );

      const result = await adapter.fileToBase64(file);
      expect(result).toBe('dGVzdCBjb250ZW50');
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('应该将 URI 字符串转换为 base64', async () => {
      const uri = 'https://example.com/image.jpg';
      const mockBlob = new Blob(['test content'], { type: 'image/jpeg' });

      global.fetch = vi.fn().mockResolvedValue({
        blob: vi.fn().mockResolvedValue(mockBlob),
      } as any);

      const mockFileReader = {
        result: 'data:image/jpeg;base64,dGVzdCBjb250ZW50',
        onloadend: null as any,
        onerror: null as any,
        readAsDataURL: vi.fn(function (this: any) {
          setTimeout(() => {
            if (this.onloadend) {
              this.onloadend();
            }
          }, 0);
        }),
      };

      vi.spyOn(window, 'FileReader').mockImplementation(
        () => mockFileReader as any,
      );

      const result = await adapter.fileToBase64(uri);
      expect(result).toBe('dGVzdCBjb250ZW50');
      expect(global.fetch).toHaveBeenCalledWith(uri);
    });

    it('应该处理 File 读取失败的情况', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const mockFileReader = {
        result: null,
        onload: null as any,
        onerror: null as any,
        readAsDataURL: vi.fn(function (this: any) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read error'));
            }
          }, 0);
        }),
      };

      vi.spyOn(window, 'FileReader').mockImplementation(
        () => mockFileReader as any,
      );

      await expect(adapter.fileToBase64(file)).rejects.toThrow();
    });

    it('应该处理 URI 获取失败的情况', async () => {
      const uri = 'https://example.com/invalid.jpg';

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(adapter.fileToBase64(uri)).rejects.toThrow('文件读取失败');
    });
  });

  describe('getFileSize', () => {
    it('应该从 File 对象获取文件大小', async () => {
      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = await adapter.getFileSize(file);
      expect(result).toBe(1024);
    });

    it('应该从 URI 获取文件大小', async () => {
      const uri = 'https://example.com/image.jpg';

      global.fetch = vi.fn().mockResolvedValue({
        headers: {
          get: vi.fn().mockReturnValue('2048'),
        },
      } as any);

      const result = await adapter.getFileSize(uri);
      expect(result).toBe(2048);
      expect(global.fetch).toHaveBeenCalledWith(uri, { method: 'HEAD' });
    });

    it('应该处理 URI 没有 content-length 的情况', async () => {
      const uri = 'https://example.com/image.jpg';

      global.fetch = vi.fn().mockResolvedValue({
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as any);

      const result = await adapter.getFileSize(uri);
      expect(result).toBe(0);
    });

    it('应该处理 URI 获取失败的情况', async () => {
      const uri = 'https://example.com/invalid.jpg';

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await adapter.getFileSize(uri);
      expect(result).toBe(0);
    });
  });

  describe('getMimeType', () => {
    it('应该从 File 对象获取 MIME 类型', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const result = await adapter.getMimeType(file, 'test.jpg');
      expect(result).toBe('image/jpeg');
    });

    it('应该从文件名推断 MIME 类型（当 File.type 为空）', async () => {
      const file = new File([''], 'test.png', { type: '' });

      const result = await adapter.getMimeType(file, 'test.png');
      expect(result).toBe('image/png');
    });

    it('应该从 URI 的文件名推断 MIME 类型', async () => {
      const uri = 'https://example.com/image.gif';

      const result = await adapter.getMimeType(uri, 'image.gif');
      expect(result).toBe('image/gif');
    });

    it('应该支持多种图片格式', async () => {
      const formats = [
        { name: 'test.jpg', expected: 'image/jpeg' },
        { name: 'test.jpeg', expected: 'image/jpeg' },
        { name: 'test.png', expected: 'image/png' },
        { name: 'test.gif', expected: 'image/gif' },
        { name: 'test.bmp', expected: 'image/bmp' },
        { name: 'test.webp', expected: 'image/webp' },
        { name: 'test.svg', expected: 'image/svg+xml' },
      ];

      for (const format of formats) {
        const file = new File([''], format.name, { type: '' });
        const result = await adapter.getMimeType(file, format.name);
        expect(result).toBe(format.expected);
      }
    });

    it('应该返回默认 MIME 类型（image/jpeg）对于未知格式', async () => {
      const file = new File([''], 'test.unknown', { type: '' });

      const result = await adapter.getMimeType(file, 'test.unknown');
      expect(result).toBe('image/jpeg');
    });
  });
});
