import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GiteeStorageProvider } from '../giteeStorageProvider';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import type {
  GiteeConfig,
  ImageItem,
  ImageUploadData,
} from '@pixuli/core/types';
import { createMockResponse } from './helpers';

describe('GiteeStorageProvider', () => {
  let provider: GiteeStorageProvider;
  let config: GiteeConfig;
  let mockPlatformAdapter: {
    getImageDimensions: ReturnType<typeof vi.fn>;
    fileToBase64: ReturnType<typeof vi.fn>;
    getFileSize: ReturnType<typeof vi.fn>;
    getMimeType: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    config = {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'main',
      token: 'test-token',
      path: 'images',
    };

    mockPlatformAdapter = {
      getImageDimensions: vi
        .fn()
        .mockResolvedValue({ width: 100, height: 200 }),
      fileToBase64: vi.fn().mockResolvedValue('base64content'),
      getFileSize: vi.fn().mockResolvedValue(1024),
      getMimeType: vi.fn().mockResolvedValue('image/jpeg'),
    };

    provider = new GiteeStorageProvider({
      platform: 'web',
      platformAdapter: mockPlatformAdapter as never,
    });
    provider.configure(config);

    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configure', () => {
    it('未 configure 时调用 listImages 应抛错', async () => {
      const unconfigured = new GiteeStorageProvider({
        platform: 'web',
        platformAdapter: mockPlatformAdapter as never,
      });
      await expect(unconfigured.listImages()).rejects.toThrow(
        /not configured/i,
      );
    });

    it('应接受 ProviderContext 中的自定义 platformAdapter', () => {
      const customAdapter = new DefaultPlatformAdapter();
      const customProvider = new GiteeStorageProvider({
        platform: 'web',
        platformAdapter: customAdapter,
      });
      customProvider.configure(config);
      expect(customProvider).toBeInstanceOf(GiteeStorageProvider);
      expect(customProvider.manifest.id).toBe('gitee');
    });
  });

  describe('getImageDimensions', () => {
    it('应该获取图片尺寸', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await provider.getImageDimensions(file);
      expect(result).toEqual({ width: 100, height: 200 });
      expect(mockPlatformAdapter.getImageDimensions).toHaveBeenCalledWith(file);
    });

    it('应该处理获取尺寸失败的情况', async () => {
      mockPlatformAdapter.getImageDimensions.mockRejectedValue(
        new Error('Failed'),
      );
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await provider.getImageDimensions(file);
      expect(result).toEqual({ width: 0, height: 0 });
    });
  });

  describe('uploadImage', () => {
    it('应该上传图片文件（使用 File）', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const uploadData: ImageUploadData = {
        file,
        name: 'test.jpg',
        description: 'Test image',
        tags: ['test'],
      };

      // Mock getFileSha - 文件不存在
      // Mock uploadImageFile
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, null))
        .mockResolvedValueOnce(
          createMockResponse(true, {
            content: {
              sha: 'test-sha',
              html_url:
                'https://gitee.com/test-owner/test-repo/blob/main/images/test.jpg',
            },
          }),
        );

      const result = await provider.uploadImage(uploadData);

      expect(result).toMatchObject({
        name: 'test.jpg',
        size: 1024,
        width: 100,
        height: 200,
        type: 'image/jpeg',
        tags: ['test'],
        description: 'Test image',
      });
      expect(result.id).toBeDefined();
      expect(result.url).toContain('gitee.com');
    });

    it('应该上传图片文件（使用 URI）', async () => {
      const uploadData = {
        file: 'file:///path/to/image.jpg',
        name: 'image.jpg',
        description: 'Test image',
      };

      // Mock getFileSha - 文件不存在
      // Mock uploadImageFile
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, null))
        .mockResolvedValueOnce(
          createMockResponse(true, {
            content: {
              sha: 'test-sha',
              html_url:
                'https://gitee.com/test-owner/test-repo/blob/main/images/image.jpg',
            },
          }),
        );

      const result = await provider.uploadImage(uploadData);

      expect(result).toMatchObject({
        name: 'image.jpg',
        description: 'Test image',
      });
    });

    it('应该处理上传失败的情况', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const uploadData: ImageUploadData = {
        file,
        name: 'test.jpg',
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, null))
        .mockResolvedValueOnce(
          createMockResponse(false, {}, 400, 'Bad Request'),
        );

      await expect(provider.uploadImage(uploadData)).rejects.toThrow(
        '上传图片失败',
      );
    });

    it('应该处理元数据上传失败但不影响图片上传', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const uploadData: ImageUploadData = {
        file,
        name: 'test.jpg',
      };

      // Mock getFileSha - 文件不存在
      // Mock uploadImageFile - 成功
      // Mock getFileSha for metadata - 文件不存在
      // Mock uploadImageMetadata - 失败
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, null))
        .mockResolvedValueOnce(
          createMockResponse(true, {
            content: {
              sha: 'test-sha',
              html_url:
                'https://gitee.com/test-owner/test-repo/blob/main/images/test.jpg',
            },
          }),
        )
        .mockResolvedValueOnce(createMockResponse(true, null))
        .mockResolvedValueOnce(
          createMockResponse(false, {}, 500, 'Server error'),
        );

      // 应该成功返回，即使元数据上传失败
      const result = await provider.uploadImage(uploadData);
      expect(result).toBeDefined();
      expect(result.name).toBe('test.jpg');
    });
  });

  describe('deleteImage', () => {
    it('应该删除图片', async () => {
      // Mock getFileSha - 文件存在
      // Mock delete file
      // Mock getFileSha for metadata - 文件存在
      // Mock delete metadata
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, { sha: 'file-sha' }))
        .mockResolvedValueOnce(createMockResponse(true, {}))
        .mockResolvedValueOnce(
          createMockResponse(true, { sha: 'metadata-sha' }),
        )
        .mockResolvedValueOnce(createMockResponse(true, {}));

      await expect(provider.deleteImage('test.jpg')).resolves.toBeUndefined();
    });

    it('应该处理文件不存在的情况', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, null));

      await expect(provider.deleteImage('test.jpg')).rejects.toThrow(
        '删除图片失败',
      );
    });

    it('应该处理删除失败的情况', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, { sha: 'file-sha' }))
        .mockResolvedValueOnce(
          createMockResponse(false, {}, 500, 'Server error'),
        );

      await expect(provider.deleteImage('test.jpg')).rejects.toThrow(
        '删除图片失败',
      );
    });

    it('应该处理元数据删除失败但不影响图片删除', async () => {
      // Mock getFileSha - 文件存在
      // Mock delete file - 成功
      // Mock getFileSha for metadata - 文件不存在
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, { sha: 'file-sha' }))
        .mockResolvedValueOnce(createMockResponse(true, {}))
        .mockResolvedValueOnce(createMockResponse(true, null));

      // 应该成功，即使元数据文件不存在
      await expect(provider.deleteImage('test.jpg')).resolves.toBeUndefined();
    });
  });

  describe('listImages', () => {
    it('应该获取图片列表', async () => {
      const mockImageFiles = [
        {
          name: 'image1.jpg',
          type: 'file',
          sha: 'sha1',
          size: 1024,
          html_url:
            'https://gitee.com/test-owner/test-repo/blob/main/images/image1.jpg',
        },
        {
          name: 'image2.png',
          type: 'file',
          sha: 'sha2',
          size: 2048,
          html_url:
            'https://gitee.com/test-owner/test-repo/blob/main/images/image2.png',
        },
      ];

      // Mock get contents
      // Mock get metadata directory - 不存在
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, mockImageFiles))
        .mockResolvedValueOnce(createMockResponse(false, {}, 404, 'Not Found'));

      const result = await provider.listImages();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: 'image1.jpg',
        id: 'sha1',
        size: 1024,
      });
      expect(result[0].url).toContain('gitee.com');
    });

    it('应该处理空列表', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, []));

      const result = await provider.listImages();
      expect(result).toEqual([]);
    });

    it('应该处理非数组响应', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, {}));

      const result = await provider.listImages();
      expect(result).toEqual([]);
    });

    it('应该过滤非图片文件', async () => {
      const mockFiles = [
        {
          name: 'image1.jpg',
          type: 'file',
          sha: 'sha1',
          size: 1024,
          html_url:
            'https://gitee.com/test-owner/test-repo/blob/main/images/image1.jpg',
        },
        {
          name: 'readme.txt',
          type: 'file',
          sha: 'sha2',
          size: 100,
        },
      ];

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, mockFiles))
        .mockResolvedValueOnce(createMockResponse(false, {}, 404, 'Not Found'));

      const result = await provider.listImages();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('image1.jpg');
    });

    it('应该处理重复ID的情况', async () => {
      const mockImageFiles = [
        {
          name: 'image1.jpg',
          type: 'file',
          sha: 'same-sha',
          size: 1024,
          html_url:
            'https://gitee.com/test-owner/test-repo/blob/main/images/image1.jpg',
        },
        {
          name: 'image2.jpg',
          type: 'file',
          sha: 'same-sha',
          size: 2048,
          html_url:
            'https://gitee.com/test-owner/test-repo/blob/main/images/image2.jpg',
        },
      ];

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, mockImageFiles))
        .mockResolvedValueOnce(createMockResponse(false, {}, 404, 'Not Found'));

      const result = await provider.listImages();
      expect(result).toHaveLength(2);
      // 重复的ID应该被处理
      expect(result[0].id).not.toBe(result[1].id);
    });
  });

  describe('updateImageMetadata', () => {
    it('应该更新图片信息', async () => {
      const metadata = {
        name: 'test.jpg',
        description: 'Updated description',
        tags: ['tag1', 'tag2'],
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, null))
        .mockResolvedValueOnce(createMockResponse(true, {}));

      await expect(
        provider.updateImageMetadata('test.jpg', metadata),
      ).resolves.toMatchObject({ name: 'test.jpg' });
    });

    it('应该处理更新失败的情况', async () => {
      const metadata = {
        description: 'Updated description',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => null,
        text: async () => '',
      } as Response);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      } as Response);

      await expect(
        provider.updateImageMetadata('test.jpg', metadata),
      ).rejects.toThrow('更新图片信息失败');
    });
  });

  describe('loadImageMetadata', () => {
    it('应该加载图片元数据', async () => {
      const images: ImageItem[] = [
        {
          id: 'id1',
          name: 'image1.jpg',
          url: 'https://gitee.com/test-owner/test-repo/raw/main/images/image1.jpg',
          githubUrl: '',
          size: 0,
          width: 0,
          height: 0,
          type: 'image/jpeg',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockMetadata = {
        size: 1024,
        width: 100,
        height: 200,
        tags: ['tag1'],
        description: 'Test image',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, mockMetadata));

      const result = await provider.loadImageMetadata(images);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        size: 1024,
        width: 100,
        height: 200,
        tags: ['tag1'],
        description: 'Test image',
      });
    });

    it('应该处理元数据不存在的情况', async () => {
      const images: ImageItem[] = [
        {
          id: 'id1',
          name: 'image1.jpg',
          url: 'https://gitee.com/test-owner/test-repo/raw/main/images/image1.jpg',
          githubUrl: '',
          size: 0,
          width: 0,
          height: 0,
          type: 'image/jpeg',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(false, {}, 404, 'Not Found'));

      const result = await provider.loadImageMetadata(images);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(images[0]);
    });

    it('应该处理加载失败的情况', async () => {
      const images: ImageItem[] = [
        {
          id: 'id1',
          name: 'image1.jpg',
          url: 'https://gitee.com/test-owner/test-repo/raw/main/images/image1.jpg',
          githubUrl: '',
          size: 0,
          width: 0,
          height: 0,
          type: 'image/jpeg',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.loadImageMetadata(images);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(images[0]);
    });
  });

  describe('私有方法测试（通过公共方法间接测试）', () => {
    it('应该正确构建 raw URL', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const uploadData: ImageUploadData = {
        file,
        name: 'test.jpg',
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, null))
        .mockResolvedValueOnce(
          createMockResponse(true, {
            content: {
              sha: 'test-sha',
              html_url:
                'https://gitee.com/test-owner/test-repo/blob/main/images/test.jpg',
            },
          }),
        );

      const result = await provider.uploadImage(uploadData);
      expect(result.url).toBe(
        'https://gitee.com/test-owner/test-repo/raw/main/images/test.jpg',
      );
    });
  });
});
