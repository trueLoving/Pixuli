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
  batchUpdateAssetMetadata,
  deleteAsset,
  deleteMultipleAssets,
  updateAsset,
} from '@/features/library/assetMutationService';
import {
  uploadAsset,
  uploadMultipleAssets,
} from '@/features/library/assetUploadService';
import {
  createStorageProvider,
  resolveInitialProviderSession,
  resolveActiveRepoConfig,
} from '@/features/library/assetProviderSession';
import {
  isLocalListMode,
  loadRemoteAssetList,
  refreshLocalAssetList,
  shouldSkipRemoteListLoad,
  unconfiguredStorageError,
} from '@/features/library/assetListService';
import type { LibraryListScope } from '@/features/library/libraryListScope';
import { registerLibraryAssetReset } from '@/features/library/workspaceAssetBridge';
import { registerSourceSelectionPort } from '@/features/library/sourceSelectionPort';
import type { BatchMetadataPatch } from '@/features/library/assetMutationService';
import type {
  BatchUploadProgress,
  GiteeConfig,
  GitHubConfig,
  AssetEditData,
  AssetItem,
  AssetUploadData,
  MultiAssetUploadData,
} from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';
import { create } from 'zustand';

interface AssetState {
  assets: AssetItem[];
  /** 当前范围匹配总数；根视图截断时大于 assets.length */
  libraryTotal: number;
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
  loadAssets: (options?: LibraryListScope) => Promise<void>;
  uploadAsset: (uploadData: AssetUploadData) => Promise<AssetItem | null>;
  uploadMultipleAssets: (
    uploadData: MultiAssetUploadData,
  ) => Promise<AssetItem[]>;
  deleteAsset: (assetId: string, fileName: string) => Promise<void>;
  deleteMultipleAssets: (
    assetIds: string[],
    fileNames: string[],
  ) => Promise<void>;
  updateAsset: (editData: AssetEditData) => Promise<boolean>;
  batchUpdateMetadata: (
    assetIds: string[],
    patch: BatchMetadataPatch,
  ) => Promise<{ updated: number; failed: number }>;
  addAsset: (asset: AssetItem) => void;
  removeAsset: (assetId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setBatchUploadProgress: (progress: BatchUploadProgress | null) => void;
}

export const useAssetStore = create<AssetState>((set, get) => {
  const initialSession = resolveInitialProviderSession();

  return {
    assets: [],
    libraryTotal: 0,
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

    loadAssets: async (options?: LibraryListScope) => {
      if (shouldSkipRemoteListLoad()) {
        return;
      }

      if (isLocalListMode()) {
        await refreshLocalAssetList(set, options);
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
        const uniqueAssets = await loadRemoteAssetList(storageProvider);
        set({
          assets: uniqueAssets,
          libraryTotal: uniqueAssets.length,
          loading: false,
        });
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : '加载图片失败';
        set({
          error: errorMsg,
          loading: false,
        });
      }
    },

    uploadAsset: async (uploadData: AssetUploadData) =>
      uploadAsset(
        uploadData,
        () => ({
          assets: get().assets,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    uploadMultipleAssets: async (uploadData: MultiAssetUploadData) =>
      uploadMultipleAssets(
        uploadData,
        () => ({
          assets: get().assets,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    deleteAsset: async (assetId: string, fileName: string) =>
      deleteAsset(
        assetId,
        fileName,
        () => ({
          assets: get().assets,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    deleteMultipleAssets: async (assetIds: string[], fileNames: string[]) =>
      deleteMultipleAssets(
        assetIds,
        fileNames,
        () => ({
          assets: get().assets,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    updateAsset: async (editData: AssetEditData) =>
      updateAsset(
        editData,
        () => ({
          assets: get().assets,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    batchUpdateMetadata: async (assetIds, patch) =>
      batchUpdateAssetMetadata(
        assetIds,
        patch,
        () => ({
          assets: get().assets,
          storageProvider: get().storageProvider,
          storageType: get().storageType,
        }),
        set,
      ),

    addAsset: (asset: AssetItem) => {
      set(state => ({
        assets: state.assets.some(img => img.id === asset.id)
          ? state.assets.map(img => (img.id === asset.id ? image : img))
          : [...state.assets, image],
      }));
    },

    removeAsset: (assetId: string) => {
      set(state => ({
        assets: state.assets.filter(img => img.id !== assetId),
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

registerLibraryAssetReset(() => {
  useAssetStore.setState({
    assets: [],
    libraryTotal: 0,
    loading: false,
    error: null,
  });
});

registerSourceSelectionPort({
  getStorageType: () => useAssetStore.getState().storageType,
  getGitHubConfig: () => useAssetStore.getState().githubConfig,
  getGiteeConfig: () => useAssetStore.getState().giteeConfig,
  getStorageProvider: () => useAssetStore.getState().storageProvider,
  setStorageType: type => useAssetStore.setState({ storageType: type }),
  setGitHubConfig: config => useAssetStore.getState().setGitHubConfig(config),
  setGiteeConfig: config => useAssetStore.getState().setGiteeConfig(config),
  clearGitHubConfig: () => useAssetStore.getState().clearGitHubConfig(),
  clearGiteeConfig: () => useAssetStore.getState().clearGiteeConfig(),
  loadAssets: () => useAssetStore.getState().loadAssets(),
  initializeStorageIfNeeded: () => {
    const { storageProvider, initializeStorage } = useAssetStore.getState();
    if (!storageProvider) {
      initializeStorage();
    }
  },
});
