import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubStorageService } from '../githubStorageService';
import { DefaultPlatformAdapter } from '../platformAdapter';
import type { GitHubConfig } from '../../types/github';
import type { ImageItem, ImageUploadData } from '../../types/image';

describe('GitHubStorageService', () => {
  let service: GitHubStorageService;
  let config: GitHubConfig;
  let mockPlatformAdapter: any;

  // 辅助函数：创建 mock response
  const createMockResponse = (
    ok: boolean,
    data: any = null,
    status: number = 200,
    statusText: string = 'OK',
  ) => ({
    ok,
    status,
    statusText,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  });

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

    service = new GitHubStorageService(config, {
      platform: 'web',
      platformAdapter: mockPlatformAdapter,
    });

    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用默认平台适配器', () => {
      const defaultService = new GitHubStorageService(config);
      expect(defaultService).toBeInstanceOf(GitHubStorageService);
    });

    it('应该使用自定义平台适配器', () => {
      const customAdapter = new DefaultPlatformAdapter();
      const customService = new GitHubStorageService(config, {
        platform: 'web',
        platformAdapter: customAdapter,
      });
      expect(customService).toBeInstanceOf(GitHubStorageService);
    });
  });

  describe('getImageDimensions', () => {
    it('应该获取图片尺寸', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await service.getImageDimensions(file);
      expect(result).toEqual({ width: 100, height: 200 });
      expect(mockPlatformAdapter.getImageDimensions).toHaveBeenCalledWith(file);
    });

    it('应该处理获取尺寸失败的情况', async () => {
      mockPlatformAdapter.getImageDimensions.mockRejectedValue(
        new Error('Failed'),
      );
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await service.getImageDimensions(file);
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

      // Mock uploadImageFile
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse(true, {
          content: {
            sha: 'test-sha',
            download_url:
              'https://raw.githubusercontent.com/test-owner/test-repo/main/images/test.jpg',
            html_url:
              'https://github.com/test-owner/test-repo/blob/main/images/test.jpg',
          },
        }),
      );

      const result = await service.uploadImage(uploadData);

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
      expect(result.url).toContain('raw.githubusercontent.com');
    });

    it('应该上传图片文件（使用 URI）', async () => {
      const uploadData = {
        uri: 'file:///path/to/image.jpg',
        name: 'image.jpg',
        description: 'Test image',
      };

      // Mock uploadImageFile
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: {
            sha: 'test-sha',
            download_url:
              'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image.jpg',
            html_url:
              'https://github.com/test-owner/test-repo/blob/main/images/image.jpg',
          },
        }),
      } as any);

      const result = await service.uploadImage(uploadData);

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
        .mockResolvedValueOnce(
          createMockResponse(false, { message: 'Bad Request' }, 400),
        );

      await expect(service.uploadImage(uploadData)).rejects.toThrow(
        '上传图片失败',
      );
    });

    it('应该处理元数据上传失败但不影响图片上传', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const uploadData: ImageUploadData = {
        file,
        name: 'test.jpg',
      };

      // Mock uploadImageFile - 成功
      // Mock getImageMetadata - 文件不存在
      // Mock getFileSha for metadata - 文件不存在
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          createMockResponse(true, {
            content: {
              sha: 'test-sha',
              download_url:
                'https://raw.githubusercontent.com/test-owner/test-repo/main/images/test.jpg',
              html_url:
                'https://github.com/test-owner/test-repo/blob/main/images/test.jpg',
            },
          }),
        )
        .mockResolvedValueOnce(createMockResponse(false, {}, 404))
        .mockResolvedValueOnce(
          createMockResponse(false, { message: 'Not Found' }, 404),
        );

      // 应该成功返回，即使元数据上传失败
      const result = await service.uploadImage(uploadData);
      expect(result).toBeDefined();
      expect(result.name).toBe('test.jpg');
    });
  });

  describe('deleteImage', () => {
    it('应该删除图片', async () => {
      // Mock get file info
      // Mock delete file
      // Mock get metadata file info - 文件存在
      // Mock delete metadata
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, { sha: 'file-sha' }))
        .mockResolvedValueOnce(createMockResponse(true, {}))
        .mockResolvedValueOnce(
          createMockResponse(true, { sha: 'metadata-sha' }),
        )
        .mockResolvedValueOnce(createMockResponse(true, {}));

      await expect(
        service.deleteImage('test-id', 'test.jpg'),
      ).resolves.toBeUndefined();
    });

    it('应该处理文件不存在的情况', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          createMockResponse(false, { message: 'Not Found' }, 404),
        );

      await expect(service.deleteImage('test-id', 'test.jpg')).rejects.toThrow(
        '删除图片失败',
      );
    });

    it('应该处理删除失败的情况', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, { sha: 'file-sha' }))
        .mockResolvedValueOnce(
          createMockResponse(false, { message: 'Server error' }, 500),
        );

      await expect(service.deleteImage('test-id', 'test.jpg')).rejects.toThrow(
        '删除图片失败',
      );
    });

    it('应该处理元数据文件不存在的情况', async () => {
      // Mock get file info
      // Mock delete file - 成功
      // Mock get metadata file info - 文件不存在
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, { sha: 'file-sha' }))
        .mockResolvedValueOnce(createMockResponse(true, {}))
        .mockResolvedValueOnce(
          createMockResponse(false, { message: 'Not Found' }, 404),
        );

      // 应该成功，即使元数据文件不存在
      await expect(
        service.deleteImage('test-id', 'test.jpg'),
      ).resolves.toBeUndefined();
    });
  });

  describe('getImageList', () => {
    it('应该获取图片列表', async () => {
      const mockImageFiles = [
        {
          name: 'image1.jpg',
          type: 'file',
          sha: 'sha1',
          size: 1024,
          download_url:
            'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image1.jpg',
          html_url:
            'https://github.com/test-owner/test-repo/blob/main/images/image1.jpg',
        },
        {
          name: 'image2.png',
          type: 'file',
          sha: 'sha2',
          size: 2048,
          download_url:
            'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image2.png',
          html_url:
            'https://github.com/test-owner/test-repo/blob/main/images/image2.png',
        },
      ];

      // Mock get contents
      // Mock get metadata - 不存在
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, mockImageFiles))
        .mockResolvedValueOnce(createMockResponse(false, {}, 404))
        .mockResolvedValueOnce(createMockResponse(false, {}, 404));

      const result = await service.getImageList();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: 'image1.jpg',
        id: 'sha1',
        size: 1024,
      });
      expect(result[0].url).toContain('raw.githubusercontent.com');
    });

    it('应该处理空列表', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, []));

      const result = await service.getImageList();
      expect(result).toEqual([]);
    });

    it('应该过滤非图片文件', async () => {
      const mockFiles = [
        {
          name: 'image1.jpg',
          type: 'file',
          sha: 'sha1',
          size: 1024,
          download_url:
            'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image1.jpg',
          html_url:
            'https://github.com/test-owner/test-repo/blob/main/images/image1.jpg',
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
        .mockResolvedValueOnce(createMockResponse(true, mockFiles));

      const result = await service.getImageList();
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
          download_url:
            'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image1.jpg',
          html_url:
            'https://github.com/test-owner/test-repo/blob/main/images/image1.jpg',
        },
        {
          name: 'image2.jpg',
          type: 'file',
          sha: 'same-sha',
          size: 2048,
          download_url:
            'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image2.jpg',
          html_url:
            'https://github.com/test-owner/test-repo/blob/main/images/image2.jpg',
        },
      ];

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, mockImageFiles))
        .mockResolvedValueOnce(createMockResponse(false, {}, 404))
        .mockResolvedValueOnce(createMockResponse(false, {}, 404));

      const result = await service.getImageList();
      expect(result).toHaveLength(2);
      // 重复的ID应该被处理
      expect(result[0].id).not.toBe(result[1].id);
    });

    it('应该从元数据文件获取详细信息', async () => {
      const mockImageFiles = [
        {
          name: 'image1.jpg',
          type: 'file',
          sha: 'sha1',
          size: 1024,
          download_url:
            'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image1.jpg',
          html_url:
            'https://github.com/test-owner/test-repo/blob/main/images/image1.jpg',
        },
      ];

      const mockMetadata = {
        id: 'metadata-id',
        name: 'image1.jpg',
        size: 2048,
        width: 200,
        height: 400,
        tags: ['tag1', 'tag2'],
        description: 'Test image',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      // Mock get contents
      // Mock get metadata
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, mockImageFiles))
        .mockResolvedValueOnce(createMockResponse(true, mockMetadata));

      const result = await service.getImageList();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'metadata-id',
        size: 2048,
        width: 200,
        height: 400,
        tags: ['tag1', 'tag2'],
        description: 'Test image',
      });
    });
  });

  describe('updateImageInfo', () => {
    it('应该更新图片信息（创建新元数据文件）', async () => {
      const metadata = {
        id: 'test-id',
        name: 'test.jpg',
        description: 'Updated description',
        tags: ['tag1', 'tag2'],
        size: 2048,
        width: 200,
        height: 400,
      };

      // Mock getFileSha - 文件不存在（创建新文件）
      // Mock create metadata
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          createMockResponse(false, { message: 'Not Found' }, 404),
        )
        .mockResolvedValueOnce(createMockResponse(true, {}));

      await expect(
        service.updateImageInfo('test-id', 'test.jpg', metadata),
      ).resolves.toBeUndefined();
    });

    it('应该更新图片信息（更新已存在的元数据文件）', async () => {
      const metadata = {
        description: 'Updated description',
      };

      // Mock getFileSha - 文件存在
      // Mock update metadata
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          createMockResponse(true, { sha: 'metadata-sha' }),
        )
        .mockResolvedValueOnce(createMockResponse(true, {}));

      await expect(
        service.updateImageInfo('test-id', 'test.jpg', metadata),
      ).resolves.toBeUndefined();
    });

    it('应该处理 SHA 不匹配的情况并重试', async () => {
      const metadata = {
        description: 'Updated description',
      };

      // Mock getFileSha - 文件存在
      // Mock update metadata - SHA 不匹配
      // Mock getFileSha - 重新获取最新 SHA
      // Mock retry update metadata
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(true, { sha: 'old-sha' }))
        .mockResolvedValueOnce(
          createMockResponse(false, { message: 'sha does not match' }, 409),
        )
        .mockResolvedValueOnce(createMockResponse(true, { sha: 'new-sha' }))
        .mockResolvedValueOnce(createMockResponse(true, {}));

      await expect(
        service.updateImageInfo('test-id', 'test.jpg', metadata),
      ).resolves.toBeUndefined();
    });

    it('应该处理更新失败的情况', async () => {
      const metadata = {
        description: 'Updated description',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
      } as any);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      } as any);

      await expect(
        service.updateImageInfo('test-id', 'test.jpg', metadata),
      ).rejects.toThrow('更新图片信息失败');
    });
  });

  describe('loadImageMetadata', () => {
    it('应该加载图片元数据', async () => {
      const images: ImageItem[] = [
        {
          id: 'id1',
          name: 'image1.jpg',
          url: 'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image1.jpg',
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

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMetadata,
      } as any);

      const result = await service.loadImageMetadata(images);

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
          url: 'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image1.jpg',
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

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any);

      const result = await service.loadImageMetadata(images);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(images[0]);
    });

    it('应该处理加载失败的情况', async () => {
      const images: ImageItem[] = [
        {
          id: 'id1',
          name: 'image1.jpg',
          url: 'https://raw.githubusercontent.com/test-owner/test-repo/main/images/image1.jpg',
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

      const result = await service.loadImageMetadata(images);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(images[0]);
    });
  });

  describe('API 请求测试', () => {
    it('应该使用正确的 Authorization header', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const uploadData: ImageUploadData = {
        file,
        name: 'test.jpg',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: {
            sha: 'test-sha',
            download_url:
              'https://raw.githubusercontent.com/test-owner/test-repo/main/images/test.jpg',
            html_url:
              'https://github.com/test-owner/test-repo/blob/main/images/test.jpg',
          },
        }),
      } as any);

      await service.uploadImage(uploadData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/repos/test-owner/test-repo/contents/images/test.jpg',
        ),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'token test-token',
            Accept: 'application/vnd.github.v3+json',
          }),
        }),
      );
    });

    it('应该正确处理 API 错误响应', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Bad credentials',
        }),
      } as any);

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const uploadData: ImageUploadData = {
        file,
        name: 'test.jpg',
      };

      await expect(service.uploadImage(uploadData)).rejects.toThrow();
    });
  });
});
