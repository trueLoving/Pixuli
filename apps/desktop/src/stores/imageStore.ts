import {
  clearGiteeConfig,
  loadGiteeConfig,
  saveGiteeConfig,
} from '@/config/gitee';
import {
  clearGitHubConfig,
  loadGitHubConfig,
  saveGitHubConfig,
} from '@/config/github';
import {
  GiteeStorageService,
  GitHubStorageService,
} from '@packages/common/src';
import { LogActionType, LogStatus } from '@/services/types';
import { useLogStore } from '@/stores/logStore';
import {
  BatchUploadProgress,
  GiteeConfig,
  GitHubConfig,
  ImageEditData,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
  UploadProgress,
} from '@packages/common/src';
import { create } from 'zustand';

interface ImageState {
  images: ImageItem[];
  loading: boolean;
  error: string | null;
  githubConfig: GitHubConfig | null;
  giteeConfig: GiteeConfig | null;
  storageService: GitHubStorageService | GiteeStorageService | null;
  storageType: 'github' | 'gitee' | null;
  batchUploadProgress: BatchUploadProgress | null;

  // Actions
  setGitHubConfig: (config: GitHubConfig) => void;
  clearGitHubConfig: () => void;
  setGiteeConfig: (config: GiteeConfig) => void;
  clearGiteeConfig: () => void;
  initializeStorage: () => void;
  loadImages: () => Promise<void>;
  uploadImage: (uploadData: ImageUploadData) => Promise<void>;
  uploadMultipleImages: (uploadData: MultiImageUploadData) => Promise<void>;
  deleteImage: (imageId: string, fileName: string) => Promise<void>;
  deleteMultipleImages: (
    imageIds: string[],
    fileNames: string[]
  ) => Promise<void>;
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
  const initialGitHubConfig = loadGitHubConfig();
  const initialGiteeConfig = loadGiteeConfig();

  // 确定当前使用的存储类型
  const storageType = initialGiteeConfig
    ? 'gitee'
    : initialGitHubConfig
      ? 'github'
      : null;
  const initialConfig = initialGiteeConfig || initialGitHubConfig;

  return {
    images: [],
    loading: false,
    error: null,
    githubConfig: initialGitHubConfig,
    giteeConfig: initialGiteeConfig,
    storageService: initialConfig
      ? storageType === 'gitee'
        ? new GiteeStorageService(initialGiteeConfig!)
        : new GitHubStorageService(initialGitHubConfig!)
      : null,
    storageType,
    batchUploadProgress: null,

    setGitHubConfig: (config: GitHubConfig) => {
      set({ githubConfig: config });
      saveGitHubConfig(config);
      // 切换到 GitHub 存储
      set({ storageType: 'github' });
      get().initializeStorage();
      // 记录配置变更日志
      useLogStore
        .getState()
        .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
          details: { type: 'github', action: 'set' },
        });
    },

    clearGitHubConfig: () => {
      set({ githubConfig: null });
      clearGitHubConfig();
      // 如果当前使用的是 GitHub，清除存储服务
      const { storageType } = get();
      if (storageType === 'github') {
        set({ storageService: null, storageType: null });
      }
      // 记录配置变更日志
      useLogStore
        .getState()
        .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
          details: { type: 'github', action: 'clear' },
        });
    },

    setGiteeConfig: (config: GiteeConfig) => {
      set({ giteeConfig: config });
      saveGiteeConfig(config);
      // 切换到 Gitee 存储
      set({ storageType: 'gitee' });
      get().initializeStorage();
      // 记录配置变更日志
      useLogStore
        .getState()
        .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
          details: { type: 'gitee', action: 'set' },
        });
    },

    clearGiteeConfig: () => {
      set({ giteeConfig: null });
      clearGiteeConfig();
      // 如果当前使用的是 Gitee，清除存储服务
      const { storageType } = get();
      if (storageType === 'gitee') {
        set({ storageService: null, storageType: null });
      }
      // 记录配置变更日志
      useLogStore
        .getState()
        .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
          details: { type: 'gitee', action: 'clear' },
        });
    },

    initializeStorage: () => {
      const { githubConfig, giteeConfig, storageType } = get();

      if (storageType === 'gitee' && giteeConfig) {
        try {
          const storageService = new GiteeStorageService(giteeConfig);
          set({ storageService });
        } catch (error) {
          console.error('Failed to initialize gitee storage service:', error);
          set({ error: '初始化Gitee存储服务失败' });
        }
      } else if (storageType === 'github' && githubConfig) {
        try {
          const storageService = new GitHubStorageService(githubConfig);
          set({ storageService });
        } catch (error) {
          console.error('Failed to initialize github storage service:', error);
          set({ error: '初始化GitHub存储服务失败' });
        }
      }
    },

    loadImages: async () => {
      const { storageService, storageType } = get();

      if (!storageService) {
        const errorMsg = storageType === 'gitee' ? 'Gitee' : 'GitHub';
        set({
          error: `${errorMsg} 配置未初始化`,
        });
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
        set({ error: 'GitHub 配置未初始化', loading: false });
        return;
      }

      set({ loading: true, error: null });
      const startTime = Date.now();
      try {
        const newImage = await storageService.uploadImage(uploadData);
        const duration = Date.now() - startTime;
        set(state => ({
          // 去重：确保不会添加重复ID的图片
          images: state.images.some(img => img.id === newImage.id)
            ? state.images.map(img => (img.id === newImage.id ? newImage : img))
            : [...state.images, newImage],
          loading: false,
        }));
        // 记录上传成功日志
        useLogStore.getState().addLog(LogActionType.UPLOAD, LogStatus.SUCCESS, {
          imageId: newImage.id,
          imageName: newImage.name,
          duration,
          details: { size: newImage.size, type: newImage.type },
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg =
          error instanceof Error ? error.message : '上传图片失败';
        set({
          error: errorMsg,
          loading: false,
        });
        // 记录上传失败日志
        useLogStore.getState().addLog(LogActionType.UPLOAD, LogStatus.FAILED, {
          imageName: uploadData.name || uploadData.file.name,
          error: errorMsg,
          duration,
        });
      } finally {
        // 确保 loading 状态总是被清除（双重保险）
        set({ loading: false });
      }
    },

    uploadMultipleImages: async (uploadData: MultiImageUploadData) => {
      const { storageService } = get();
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化', loading: false });
        return;
      }

      const { files, name, description, tags } = uploadData;
      const total = files.length;
      let completed = 0;
      let failed = 0;

      try {
        const items: UploadProgress[] = files.map((_file, index) => ({
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
                        ? {
                            ...item,
                            status: 'uploading',
                            message: '正在上传...',
                          }
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
                            message: '上传成功',
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
        const batchStartTime = Date.now();
        set(state => ({
          images: [...state.images, ...uploadedImages],
          loading: false,
          batchUploadProgress: null,
        }));
        // 记录批量上传日志
        useLogStore
          .getState()
          .addLog(LogActionType.BATCH_UPLOAD, LogStatus.SUCCESS, {
            details: {
              total,
              completed,
              failed,
              images: uploadedImages.map(img => ({
                id: img.id,
                name: img.name,
              })),
            },
            duration: Date.now() - batchStartTime,
          });
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : '批量上传失败';
        set({
          error: errorMsg,
          loading: false,
          batchUploadProgress: null,
        });
        // 记录批量上传失败日志
        useLogStore
          .getState()
          .addLog(LogActionType.BATCH_UPLOAD, LogStatus.FAILED, {
            error: errorMsg,
            details: { total, completed, failed },
          });
      } finally {
        // 确保 loading 状态总是被清除（双重保险）
        set({ loading: false });
      }
    },

    deleteImage: async (imageId: string, fileName: string) => {
      const { storageService } = get();
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化', loading: false });
        return;
      }

      set({ loading: true, error: null });
      const startTime = Date.now();
      try {
        await storageService.deleteImage(imageId, fileName);
        const duration = Date.now() - startTime;
        set(state => ({
          images: state.images.filter(img => img.id !== imageId),
          loading: false,
        }));
        // 记录删除成功日志
        useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.SUCCESS, {
          imageId,
          imageName: fileName,
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg =
          error instanceof Error ? error.message : '删除图片失败';
        set({
          error: errorMsg,
          loading: false,
        });
        // 记录删除失败日志
        useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.FAILED, {
          imageId,
          imageName: fileName,
          error: errorMsg,
          duration,
        });
      } finally {
        // 确保 loading 状态总是被清除（双重保险）
        set({ loading: false });
      }
    },

    deleteMultipleImages: async (imageIds: string[], fileNames: string[]) => {
      const { storageService } = get();
      if (!storageService) {
        set({ error: '存储配置未初始化', loading: false });
        return;
      }

      if (imageIds.length === 0) {
        return;
      }

      set({ loading: true, error: null });
      const startTime = Date.now();
      try {
        // 批量删除
        const deletePromises = imageIds.map((id, index) =>
          storageService.deleteImage(id, fileNames[index])
        );
        await Promise.all(deletePromises);

        const duration = Date.now() - startTime;
        set(state => ({
          images: state.images.filter(img => !imageIds.includes(img.id)),
          loading: false,
        }));

        // 记录批量删除成功日志
        useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.SUCCESS, {
          details: {
            imageIds,
            imageNames: fileNames,
            count: imageIds.length,
          },
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg =
          error instanceof Error ? error.message : '批量删除图片失败';
        set({
          error: errorMsg,
          loading: false,
        });

        // 记录批量删除失败日志
        useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.FAILED, {
          details: {
            imageIds,
            imageNames: fileNames,
            count: imageIds.length,
          },
          error: errorMsg,
          duration,
        });
      } finally {
        // 确保 loading 状态总是被清除（双重保险）
        set({ loading: false });
      }
    },

    updateImage: async (editData: ImageEditData) => {
      const { storageService, images } = get();
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化', loading: false });
        return;
      }

      const image = images.find(img => img.id === editData.id);
      if (!image) {
        set({ error: '图片不存在', loading: false });
        return;
      }

      set({ loading: true, error: null });
      const startTime = Date.now();
      try {
        // 构建完整的元数据对象（包含所有 ImageItem 属性）
        const metadata: ImageItem = {
          ...image,
          name: editData.name || image.name,
          description: editData.description ?? image.description,
          tags: editData.tags ?? image.tags,
          updatedAt: new Date().toISOString(),
        };

        // 传递旧文件名用于重命名检测
        await storageService.updateImageInfo(
          editData.id,
          metadata.name,
          metadata
        );

        const duration = Date.now() - startTime;
        set(state => ({
          images: state.images.map(img =>
            img.id === editData.id ? { ...img, ...metadata } : img
          ),
          loading: false,
        }));
        // 记录编辑成功日志
        useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
          imageId: editData.id,
          imageName: metadata.name,
          duration,
          details: {
            changes: {
              name:
                editData.name !== image.name
                  ? { old: image.name, new: editData.name }
                  : undefined,
              description:
                editData.description !== image.description
                  ? { old: image.description, new: editData.description }
                  : undefined,
              tags:
                editData.tags !== image.tags
                  ? { old: image.tags, new: editData.tags }
                  : undefined,
            },
          },
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg =
          error instanceof Error ? error.message : '更新图片失败';
        set({
          error: errorMsg,
          loading: false,
        });
        // 记录编辑失败日志
        useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.FAILED, {
          imageId: editData.id,
          imageName: image.name,
          error: errorMsg,
          duration,
        });
      } finally {
        // 确保 loading 状态总是被清除（双重保险）
        set({ loading: false });
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
  };
});
