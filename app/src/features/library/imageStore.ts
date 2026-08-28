import {
  clearGiteeConfig,
  saveGiteeConfig,
} from '@/features/settings/config/gitee';
import {
  clearGitHubConfig,
  saveGitHubConfig,
} from '@/features/settings/config/github';
import type { StoragePluginId } from '@/storage/createProvider';
import {
  LogActionType,
  LogStatus,
  useLogStore,
} from '@/features/operation-log';
import {
  deleteAssetImage,
  deleteMultipleAssetImages,
  updateAssetImage,
} from '@/features/library/assetMutationService';
import {
  uploadAssetImage,
  uploadMultipleAssetImages,
} from '@/features/library/assetUploadService';
import {
  createStorageProvider,
  resolveInitialProviderSession,
  resolveActiveRepoConfig,
} from '@/features/library/assetProviderSession';
import {
  isLocalListMode,
  loadRemoteImageList,
  refreshLocalImageList,
  shouldSkipRemoteListLoad,
  unconfiguredStorageError,
} from '@/features/library/assetListService';
import { registerLibraryImageReset } from '@/features/library/workspaceImageBridge';
import type {
  BatchUploadProgress,
  GiteeConfig,
  GitHubConfig,
  ImageEditData,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
} from '@pixuli/core/types';
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
  uploadImage: (uploadData: ImageUploadData) => Promise<ImageItem | null>;
  uploadMultipleImages: (
    uploadData: MultiImageUploadData,
  ) => Promise<ImageItem[]>;
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

export const useImageStore = create<ImageState>((set, get) => {
  const initialSession = resolveInitialProviderSession();

  return {
    images: [],
    loading: false,
    error: null,
    githubConfig: initialSession.githubConfig,
    giteeConfig: initialSession.giteeConfig,
    storageProvider: initialSession.storageProvider,
    storageType: initialSession.storageType,
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
      const config = resolveActiveRepoConfig(
        storageType,
        githubConfig,
        giteeConfig,
      );
      if (!storageType || !config) {
        return;
      }
      try {
        set({ storageProvider: createStorageProvider(storageType, config) });
      } catch (error) {
        console.error('Failed to initialize storage provider:', error);
        set({
          error:
            storageType === 'gitee'
              ? '初始化Gitee存储服务失败'
              : '初始化GitHub存储服务失败',
        });
      }
    },

    loadImages: async () => {
      if (shouldSkipRemoteListLoad()) {
        return;
      }

      if (isLocalListMode()) {
        await refreshLocalImageList(set);
        return;
      }

      const { storageProvider, storageType } = get();

      if (!storageProvider) {
        set({
          error: unconfiguredStorageError(storageType),
        });
        return;
      }

      set({ loading: true, error: null });
      try {
        const uniqueImages = await loadRemoteImageList(storageProvider);
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

    uploadImage: async (uploadData: ImageUploadData) =>
      uploadAssetImage(
        uploadData,
        () => ({
          images: get().images,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    uploadMultipleImages: async (uploadData: MultiImageUploadData) =>
      uploadMultipleAssetImages(
        uploadData,
        () => ({
          images: get().images,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    deleteImage: async (imageId: string, fileName: string) =>
      deleteAssetImage(
        imageId,
        fileName,
        () => ({
          images: get().images,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    deleteMultipleImages: async (imageIds: string[], fileNames: string[]) =>
      deleteMultipleAssetImages(
        imageIds,
        fileNames,
        () => ({
          images: get().images,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    updateImage: async (editData: ImageEditData) =>
      updateAssetImage(
        editData,
        () => ({
          images: get().images,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

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

registerLibraryImageReset(() => {
  useImageStore.setState({ images: [], loading: false, error: null });
});
