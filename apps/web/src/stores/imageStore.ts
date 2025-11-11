import type {
  BatchUploadProgress,
  GitHubConfig,
  ImageEditData,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
  UploadProgress,
} from '@packages/ui/src';
import { create } from 'zustand';
import {
  clearGitHubConfig,
  loadGitHubConfig,
  saveGitHubConfig,
} from '../config/github';
import { GitHubStorageService } from '../services/githubStorage';
import { backgroundSyncService } from '../services/backgroundSyncService';
import { pwaService } from '../services/pwaService';

interface ImageState {
  images: ImageItem[];
  loading: boolean;
  error: string | null;
  githubConfig: GitHubConfig | null;
  storageService: GitHubStorageService | null;
  batchUploadProgress: BatchUploadProgress | null;

  // Actions
  setGitHubConfig: (config: GitHubConfig) => void;
  clearGitHubConfig: () => void;
  initializeStorage: () => void;
  loadImages: () => Promise<void>;
  uploadImage: (uploadData: ImageUploadData) => Promise<void>;
  uploadMultipleImages: (uploadData: MultiImageUploadData) => Promise<void>;
  deleteImage: (imageId: string, fileName: string) => Promise<void>;
  updateImage: (editData: ImageEditData) => Promise<void>;
  addImage: (image: ImageItem) => void;
  removeImage: (imageId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setBatchUploadProgress: (progress: BatchUploadProgress | null) => void;
}

export const useImageStore = create<ImageState>((set, get) => {
  // 在store创建时加载配置并初始化存储服务
  const initialConfig = loadGitHubConfig();

  return {
    images: [],
    loading: false,
    error: null,
    githubConfig: initialConfig,
    storageService: initialConfig
      ? new GitHubStorageService(initialConfig)
      : null,
    batchUploadProgress: null,

    setGitHubConfig: (config: GitHubConfig) => {
      set({ githubConfig: config });
      saveGitHubConfig(config);
      get().initializeStorage();
    },

    initializeStorage: () => {
      const { githubConfig } = get();
      if (githubConfig) {
        try {
          const storageService = new GitHubStorageService(githubConfig);
          set({ storageService });
        } catch (error) {
          console.error('Failed to initialize storage service:', error);
          set({ error: '初始化存储服务失败' });
        }
      }
    },

    loadImages: async () => {
      const { storageService } = get();

      if (!storageService) {
        set({ error: 'GitHub 配置未初始化' });
        return;
      }

      set({ loading: true, error: null });
      try {
        const images = await storageService.getImageList();

        // 去重：确保每个图片ID只出现一次，如果有重复，保留最新的
        const uniqueImages = images.reduce((acc: ImageItem[], current) => {
          const existingIndex = acc.findIndex(img => img.id === current.id);
          if (existingIndex === -1) {
            // 新图片，直接添加
            acc.push(current);
          } else {
            // 已存在，比较更新时间，保留最新的
            const existing = acc[existingIndex];
            if (new Date(current.updatedAt) > new Date(existing.updatedAt)) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, []);

        set({ images: uniqueImages, loading: false });
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : '加载图片失败';
        set({
          error: errorMsg,
          loading: false,
        });
      }
    },

    uploadImage: async (uploadData: ImageUploadData) => {
      const { storageService } = get();
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化' });
        return;
      }

      set({ loading: true, error: null });
      try {
        // 检查是否在线
        if (!navigator.onLine) {
          // 离线模式：添加到后台同步队列
          await backgroundSyncService.init();
          await backgroundSyncService.addPendingOperation({
            type: 'upload',
            data: uploadData,
            timestamp: Date.now(),
          });
          await pwaService.registerBackgroundSync('sync-images');

          // 创建临时图片项（使用本地预览）
          const tempImage: ImageItem = {
            id: `temp-${Date.now()}`,
            name: uploadData.name || uploadData.file.name,
            url: URL.createObjectURL(uploadData.file),
            githubUrl: '',
            size: uploadData.file.size,
            width: 0,
            height: 0,
            type: uploadData.file.type,
            tags: uploadData.tags || [],
            description: uploadData.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set(state => ({
            images: [...state.images, tempImage],
            loading: false,
            error: '图片已添加到同步队列，将在网络恢复后自动上传',
          }));
          return;
        }

        // 在线模式：直接上传
        const newImage = await storageService.uploadImage(uploadData);
        set(state => ({
          // 去重：确保不会添加重复ID的图片
          images: state.images.some(img => img.id === newImage.id)
            ? state.images.map(img => (img.id === newImage.id ? newImage : img))
            : [...state.images, newImage],
          loading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '上传图片失败',
          loading: false,
        });
      }
    },

    uploadMultipleImages: async (uploadData: MultiImageUploadData) => {
      const { storageService } = get();
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化' });
        return;
      }

      const { files, name, description, tags } = uploadData;
      const total = files.length;
      let completed = 0;
      let failed = 0;
      const items: UploadProgress[] = files.map((_, index) => ({
        id: `${Date.now()}-${index}`,
        progress: 0,
        status: 'uploading' as const,
        message: '等待上传...',
      }));

      // 初始化批量上传进度
      set({
        loading: true,
        error: null,
        batchUploadProgress: {
          total,
          completed: 0,
          failed: 0,
          current: files[0]?.name,
          items,
        },
      });

      const uploadedImages: ImageItem[] = [];

      // 逐个上传图片
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const itemId = items[i].id;

        try {
          // 更新当前上传状态
          set(state => ({
            batchUploadProgress: state.batchUploadProgress
              ? {
                  ...state.batchUploadProgress,
                  current: file.name,
                  items: state.batchUploadProgress.items.map(item =>
                    item.id === itemId
                      ? { ...item, status: 'uploading', message: '正在上传...' }
                      : item
                  ),
                }
              : null,
          }));

          // 上传单个图片
          const fileName = name ? `${name}-${i + 1}-${file.name}` : file.name;

          const singleUploadData: ImageUploadData = {
            file,
            name: fileName,
            description,
            tags,
          };

          const newImage = await storageService.uploadImage(singleUploadData);
          uploadedImages.push(newImage);
          completed++;

          // 构建成功消息，包含尺寸信息
          const dimensionsText =
            newImage.width > 0 && newImage.height > 0
              ? `上传成功 (${newImage.width} × ${newImage.height})`
              : '上传成功';

          // 更新成功状态
          set(state => ({
            batchUploadProgress: state.batchUploadProgress
              ? {
                  ...state.batchUploadProgress,
                  completed,
                  items: state.batchUploadProgress.items.map(item =>
                    item.id === itemId
                      ? {
                          ...item,
                          status: 'success',
                          progress: 100,
                          message: dimensionsText,
                          width: newImage.width,
                          height: newImage.height,
                        }
                      : item
                  ),
                }
              : null,
          }));
        } catch (error) {
          failed++;
          const errorMessage =
            error instanceof Error ? error.message : '上传失败';

          // 更新失败状态
          set(state => ({
            batchUploadProgress: state.batchUploadProgress
              ? {
                  ...state.batchUploadProgress,
                  failed,
                  items: state.batchUploadProgress.items.map(item =>
                    item.id === itemId
                      ? { ...item, status: 'error', message: errorMessage }
                      : item
                  ),
                }
              : null,
          }));
        }
      }

      // 批量上传完成
      set(state => ({
        images: [...state.images, ...uploadedImages],
        loading: false,
        batchUploadProgress: null,
      }));
    },

    deleteImage: async (imageId: string, fileName: string) => {
      const { storageService } = get();
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化' });
        return;
      }

      set({ loading: true, error: null });
      try {
        // 检查是否在线
        if (!navigator.onLine) {
          // 离线模式：添加到后台同步队列
          await backgroundSyncService.init();
          await backgroundSyncService.addPendingOperation({
            type: 'delete',
            data: { imageId, fileName },
            timestamp: Date.now(),
          });
          await pwaService.registerBackgroundSync('sync-images');

          // 立即从本地状态中移除（乐观更新）
          set(state => ({
            images: state.images.filter(img => img.id !== imageId),
            loading: false,
            error: '删除操作已添加到同步队列，将在网络恢复后执行',
          }));
          return;
        }

        // 在线模式：直接删除
        await storageService.deleteImage(imageId, fileName);
        set(state => ({
          images: state.images.filter(img => img.id !== imageId),
          loading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '删除图片失败',
          loading: false,
        });
      }
    },

    updateImage: async (editData: ImageEditData) => {
      const { storageService, images } = get();
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化' });
        return;
      }

      const image = images.find(img => img.id === editData.id);
      if (!image) {
        set({ error: '图片不存在' });
        return;
      }

      set({ loading: true, error: null });
      try {
        // 如果 editData 包含 width 和 height，则使用它们；否则使用图片现有的尺寸
        const width = (editData as any).width ?? image.width;
        const height = (editData as any).height ?? image.height;

        const metadata = {
          id: image.id,
          name: editData.name || image.name,
          description: editData.description || image.description,
          tags: editData.tags || image.tags,
          width: width,
          height: height,
          updatedAt: new Date().toISOString(),
          createdAt: image.createdAt,
        };

        // 检查是否在线
        if (!navigator.onLine) {
          // 离线模式：添加到后台同步队列
          await backgroundSyncService.init();
          await backgroundSyncService.addPendingOperation({
            type: 'update',
            data: {
              id: editData.id,
              oldName: image.name,
              metadata,
            },
            timestamp: Date.now(),
          });
          await pwaService.registerBackgroundSync('sync-images');

          // 立即更新本地状态（乐观更新）
          set(state => ({
            images: state.images.map(img =>
              img.id === editData.id ? { ...img, ...metadata } : img
            ),
            loading: false,
            error: '更新操作已添加到同步队列，将在网络恢复后执行',
          }));
          return;
        }

        // 在线模式：直接更新
        // 传递旧文件名用于重命名检测
        await storageService.updateImageInfo(editData.id, image.name, metadata);

        set(state => ({
          images: state.images.map(img =>
            img.id === editData.id ? { ...img, ...metadata } : img
          ),
          loading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '更新图片失败',
          loading: false,
        });
      }
    },

    addImage: (image: ImageItem) => {
      set(state => ({
        // 去重：确保不会添加重复ID的图片
        images: state.images.some(img => img.id === image.id)
          ? state.images.map(img => (img.id === image.id ? image : img))
          : [...state.images, image],
      }));
    },

    removeImage: (imageId: string) => {
      set(state => ({
        images: state.images.filter(img => img.id !== imageId),
      }));
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },

    setBatchUploadProgress: (progress: BatchUploadProgress | null) => {
      set({ batchUploadProgress: progress });
    },

    clearGitHubConfig: () => {
      clearGitHubConfig();
      set({
        githubConfig: null,
        storageService: null,
        images: [],
        error: null,
      });
    },
  };
});
