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
  createConfiguredStorageProvider,
  storagePluginLabel,
  type StoragePluginId,
} from '@/storage/createProvider';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { LogActionType, LogStatus } from '@/types/log';
import { useLogStore } from '@/stores/logStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type {
  BatchUploadProgress,
  GiteeConfig,
  GitHubConfig,
  ImageEditData,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
  UploadProgress,
} from '@pixuli/core/types';
import { getUploadFileName } from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';
import { create } from 'zustand';

interface ImageState {
  images: ImageItem[];
  loading: boolean;
  error: string | null;
  githubConfig: GitHubConfig | null;
  giteeConfig: GiteeConfig | null;
  /** 当前激活的存储插件（与 storageType 同值，对应 Registry pluginId） */
  storageProvider: StorageProvider | null;
  storageType: StoragePluginId | null;
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
    fileNames: string[],
  ) => Promise<void>;
  updateImage: (editData: ImageEditData) => Promise<void>;
  addImage: (image: ImageItem) => void;
  removeImage: (imageId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setBatchUploadProgress: (progress: BatchUploadProgress | null) => void;
}

function isLocalListMode(): boolean {
  return useWorkspaceStore.getState().isLocalActive();
}

async function refreshLocalIntoImageStore(
  set: (partial: Partial<ImageState>) => void,
): Promise<void> {
  const workspace = useWorkspaceStore.getState();
  set({ loading: true, error: null });
  try {
    await workspace.refreshLocalImages();
    set({
      images: useWorkspaceStore.getState().localImages,
      loading: false,
    });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '加载本地图片失败',
    });
  }
}

export const useImageStore = create<ImageState>((set, get) => {
  const initialGitHubConfig = loadGitHubConfig();
  const initialGiteeConfig = loadGiteeConfig();

  const storageType: StoragePluginId | null = initialGiteeConfig
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
    storageProvider:
      initialConfig && storageType
        ? createConfiguredStorageProvider(storageType, initialConfig)
        : null,
    storageType,
    batchUploadProgress: null,

    setGitHubConfig: (config: GitHubConfig) => {
      set({ githubConfig: config });
      saveGitHubConfig(config);
      set({ storageType: 'github' });
      get().initializeStorage();
      useLogStore
        .getState()
        .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
          details: { type: 'github', action: 'set' },
        });
    },

    clearGitHubConfig: () => {
      set({ githubConfig: null });
      clearGitHubConfig();
      const { storageType } = get();
      if (storageType === 'github') {
        set({ storageProvider: null, storageType: null });
      }
      useLogStore
        .getState()
        .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
          details: { type: 'github', action: 'clear' },
        });
    },

    setGiteeConfig: (config: GiteeConfig) => {
      set({ giteeConfig: config });
      saveGiteeConfig(config);
      set({ storageType: 'gitee' });
      get().initializeStorage();
      useLogStore
        .getState()
        .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
          details: { type: 'gitee', action: 'set' },
        });
    },

    clearGiteeConfig: () => {
      set({ giteeConfig: null });
      clearGiteeConfig();
      const { storageType } = get();
      if (storageType === 'gitee') {
        set({ storageProvider: null, storageType: null });
      }
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
          const storageProvider = createConfiguredStorageProvider(
            'gitee',
            giteeConfig,
          );
          set({ storageProvider });
        } catch (error) {
          console.error('Failed to initialize gitee storage provider:', error);
          set({ error: '初始化Gitee存储服务失败' });
        }
      } else if (storageType === 'github' && githubConfig) {
        try {
          const storageProvider = createConfiguredStorageProvider(
            'github',
            githubConfig,
          );
          set({ storageProvider });
        } catch (error) {
          console.error('Failed to initialize github storage provider:', error);
          set({ error: '初始化GitHub存储服务失败' });
        }
      }
    },

    loadImages: async () => {
      if (isWorkspaceAvailable() && !isLocalListMode()) {
        return;
      }

      if (isLocalListMode()) {
        await refreshLocalIntoImageStore(set);
        return;
      }

      const { storageProvider, storageType } = get();

      if (!storageProvider) {
        set({
          error: `${storagePluginLabel(storageType)} 配置未初始化`,
        });
        return;
      }

      set({ loading: true, error: null });
      try {
        const images = await storageProvider.listImages();

        const uniqueImages = images.reduce((acc: ImageItem[], current) => {
          const existingIndex = acc.findIndex(img => img.id === current.id);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
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
      if (isLocalListMode()) {
        await useWorkspaceStore.getState().importLocalImage(uploadData);
        await refreshLocalIntoImageStore(set);
        return;
      }

      const { storageProvider, storageType } = get();
      if (!storageProvider) {
        set({
          error: `${storagePluginLabel(storageType)} 配置未初始化`,
          loading: false,
        });
        return;
      }

      set({ loading: true, error: null });
      const startTime = Date.now();
      try {
        const newImage = await storageProvider.uploadImage(uploadData);
        const duration = Date.now() - startTime;
        set(state => ({
          images: state.images.some(img => img.id === newImage.id)
            ? state.images.map(img => (img.id === newImage.id ? newImage : img))
            : [...state.images, newImage],
          loading: false,
        }));
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
        useLogStore.getState().addLog(LogActionType.UPLOAD, LogStatus.FAILED, {
          imageName: getUploadFileName(uploadData.file, uploadData.name),
          error: errorMsg,
          duration,
        });
      } finally {
        set({ loading: false });
      }
    },

    uploadMultipleImages: async (uploadData: MultiImageUploadData) => {
      const { files, name, description, tags } = uploadData;

      if (isLocalListMode()) {
        const total = files.length;
        if (total === 0) {
          return;
        }

        let completed = 0;
        let failed = 0;
        const startTime = Date.now();
        const items: UploadProgress[] = files.map((_file, index) => ({
          id: `${Date.now()}-${index}`,
          progress: 0,
          status: 'uploading' as const,
          message: '等待导入...',
        }));

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

        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const itemId = items[i].id;
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
                            message: '正在导入...',
                          }
                        : item,
                    ),
                  }
                : null,
            }));

            try {
              await useWorkspaceStore.getState().importLocalImage({
                file,
                name,
                description,
                tags,
              });
              completed++;
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
                              message: '导入成功',
                            }
                          : item,
                      ),
                    }
                  : null,
              }));
            } catch (error) {
              failed++;
              const errorMessage =
                error instanceof Error ? error.message : '导入失败';
              set(state => ({
                batchUploadProgress: state.batchUploadProgress
                  ? {
                      ...state.batchUploadProgress,
                      failed,
                      items: state.batchUploadProgress.items.map(item =>
                        item.id === itemId
                          ? {
                              ...item,
                              status: 'error',
                              message: errorMessage,
                            }
                          : item,
                      ),
                    }
                  : null,
              }));
            }
          }

          await refreshLocalIntoImageStore(set);
          set({ batchUploadProgress: null });
          useLogStore
            .getState()
            .addLog(LogActionType.BATCH_UPLOAD, LogStatus.SUCCESS, {
              details: { total, completed, failed },
              duration: Date.now() - startTime,
            });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : '批量导入失败';
          set({
            error: errorMsg,
            loading: false,
            batchUploadProgress: null,
          });
          useLogStore
            .getState()
            .addLog(LogActionType.BATCH_UPLOAD, LogStatus.FAILED, {
              error: errorMsg,
              details: { total, completed, failed },
            });
        }
        return;
      }

      const { storageProvider, storageType } = get();
      if (!storageProvider) {
        set({
          error: `${storagePluginLabel(storageType)} 配置未初始化`,
          loading: false,
        });
        return;
      }

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

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const itemId = items[i].id;

          try {
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
                        : item,
                    ),
                  }
                : null,
            }));

            const fileName = name ? `${name}-${i + 1}-${file.name}` : file.name;

            const singleUploadData: ImageUploadData = {
              file,
              name: fileName,
              description,
              tags,
            };

            const newImage =
              await storageProvider.uploadImage(singleUploadData);
            uploadedImages.push(newImage);
            completed++;

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
                        : item,
                    ),
                  }
                : null,
            }));
          } catch (error) {
            failed++;
            const errorMessage =
              error instanceof Error ? error.message : '上传失败';

            set(state => ({
              batchUploadProgress: state.batchUploadProgress
                ? {
                    ...state.batchUploadProgress,
                    failed,
                    items: state.batchUploadProgress.items.map(item =>
                      item.id === itemId
                        ? { ...item, status: 'error', message: errorMessage }
                        : item,
                    ),
                  }
                : null,
            }));
          }
        }

        const batchStartTime = Date.now();
        set(state => ({
          images: [...state.images, ...uploadedImages],
          loading: false,
          batchUploadProgress: null,
        }));
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
        useLogStore
          .getState()
          .addLog(LogActionType.BATCH_UPLOAD, LogStatus.FAILED, {
            error: errorMsg,
            details: { total, completed, failed },
          });
      } finally {
        set({ loading: false });
      }
    },

    deleteImage: async (imageId: string, fileName: string) => {
      if (isLocalListMode()) {
        const image = get().images.find(img => img.id === imageId);
        const relativePath = image?.localPath ?? fileName;
        set({ loading: true, error: null });
        try {
          await useWorkspaceStore.getState().softDeleteLocal(relativePath);
          await refreshLocalIntoImageStore(set);
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '删除图片失败',
          });
        }
        return;
      }

      const { storageProvider, storageType } = get();
      if (!storageProvider) {
        set({
          error: `${storagePluginLabel(storageType)} 配置未初始化`,
          loading: false,
        });
        return;
      }

      set({ loading: true, error: null });
      const startTime = Date.now();
      try {
        await storageProvider.deleteImage(fileName);
        const duration = Date.now() - startTime;
        set(state => ({
          images: state.images.filter(img => img.id !== imageId),
          loading: false,
        }));
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
        useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.FAILED, {
          imageId,
          imageName: fileName,
          error: errorMsg,
          duration,
        });
      } finally {
        set({ loading: false });
      }
    },

    deleteMultipleImages: async (imageIds: string[], fileNames: string[]) => {
      if (imageIds.length === 0) {
        return;
      }

      const batchLogDetails = {
        imageIds,
        imageNames: fileNames,
        count: imageIds.length,
      };

      if (isLocalListMode()) {
        const startTime = Date.now();
        set({ loading: true, error: null });
        try {
          const { images } = get();
          for (const imageId of imageIds) {
            const image = images.find(img => img.id === imageId);
            if (image?.localPath) {
              await useWorkspaceStore
                .getState()
                .softDeleteLocal(image.localPath);
            }
          }
          await refreshLocalIntoImageStore(set);
          useLogStore
            .getState()
            .addLog(LogActionType.BATCH_DELETE, LogStatus.SUCCESS, {
              details: batchLogDetails,
              duration: Date.now() - startTime,
            });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : '批量删除图片失败';
          set({
            loading: false,
            error: errorMsg,
          });
          useLogStore
            .getState()
            .addLog(LogActionType.BATCH_DELETE, LogStatus.FAILED, {
              details: batchLogDetails,
              error: errorMsg,
            });
        }
        return;
      }

      const { storageProvider, storageType } = get();
      if (!storageProvider) {
        set({
          error: `${storagePluginLabel(storageType)} 配置未初始化`,
          loading: false,
        });
        return;
      }

      set({ loading: true, error: null });
      const startTime = Date.now();
      try {
        const deletePromises = fileNames.map(fileName =>
          storageProvider.deleteImage(fileName),
        );
        await Promise.all(deletePromises);

        const duration = Date.now() - startTime;
        set(state => ({
          images: state.images.filter(img => !imageIds.includes(img.id)),
          loading: false,
        }));

        useLogStore
          .getState()
          .addLog(LogActionType.BATCH_DELETE, LogStatus.SUCCESS, {
            details: batchLogDetails,
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

        useLogStore
          .getState()
          .addLog(LogActionType.BATCH_DELETE, LogStatus.FAILED, {
            details: batchLogDetails,
            error: errorMsg,
            duration,
          });
      } finally {
        set({ loading: false });
      }
    },

    updateImage: async (editData: ImageEditData) => {
      const { storageProvider, storageType, images } = get();
      const image = images.find(img => img.id === editData.id);
      if (!image) {
        set({ error: '图片不存在', loading: false });
        return;
      }

      if (isLocalListMode()) {
        if (!image.localPath) {
          set({ error: '本地路径缺失', loading: false });
          return;
        }
        set({ loading: true, error: null });
        const startTime = Date.now();
        try {
          await useWorkspaceStore
            .getState()
            .updateLocalMetadata(image.localPath, {
              name: editData.name || image.name,
              description: editData.description ?? image.description,
              tags: editData.tags ?? image.tags,
            });
          await refreshLocalIntoImageStore(set);
          useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
            imageId: editData.id,
            imageName: editData.name || image.name,
            duration: Date.now() - startTime,
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : '更新图片失败';
          set({ error: errorMsg, loading: false });
          useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.FAILED, {
            imageId: editData.id,
            imageName: image.name,
            error: errorMsg,
            duration: Date.now() - startTime,
          });
        }
        return;
      }

      if (!storageProvider) {
        set({
          error: `${storagePluginLabel(storageType)} 配置未初始化`,
          loading: false,
        });
        return;
      }

      if (!storageProvider.updateImageMetadata) {
        set({ error: '当前存储插件不支持更新元数据', loading: false });
        return;
      }

      set({ loading: true, error: null });
      const startTime = Date.now();
      try {
        const metadata: ImageItem = {
          ...image,
          name: editData.name || image.name,
          description: editData.description ?? image.description,
          tags: editData.tags ?? image.tags,
          updatedAt: new Date().toISOString(),
        };

        await storageProvider.updateImageMetadata(metadata.name, metadata);

        const duration = Date.now() - startTime;
        set(state => ({
          images: state.images.map(img =>
            img.id === editData.id ? { ...img, ...metadata } : img,
          ),
          loading: false,
        }));
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
        useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.FAILED, {
          imageId: editData.id,
          imageName: image.name,
          error: errorMsg,
          duration,
        });
      } finally {
        set({ loading: false });
      }
    },

    addImage: (image: ImageItem) => {
      set(state => ({
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
