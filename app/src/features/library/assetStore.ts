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
  clearPersistedActiveSession,
  createStorageProvider,
  persistActiveSession,
  resolveInitialProviderSession,
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
  AssetEditData,
  AssetItem,
  AssetUploadData,
  MultiAssetUploadData,
} from '@pixuli/core/types';
import type {
  StorageProvider,
  StorageProviderConfig,
} from '@pixuli/core/plugins';
import { create } from 'zustand';
import { storagePluginLabel } from '@/storage/createProvider';

interface AssetState {
  assets: AssetItem[];
  /** 当前范围匹配总数；根视图截断时大于 assets.length */
  libraryTotal: number;
  loading: boolean;
  error: string | null;
  /** 当前激活插件配置（单一会话，不再 github/gitee 双轨） */
  storageConfig: StorageProviderConfig | null;
  storageProvider: StorageProvider | null;
  storageType: StoragePluginId | null;
  batchUploadProgress: BatchUploadProgress | null;

  // Actions
  setActiveStorage: (pluginId: string, config: StorageProviderConfig) => void;
  clearActiveStorage: () => void;
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
    storageConfig: initialSession.storageConfig,
    storageProvider: initialSession.storageProvider,
    storageType: initialSession.storageType,
    batchUploadProgress: null,

    setActiveStorage: (pluginId, config) => {
      set({
        storageType: pluginId,
        storageConfig: config,
      });
      persistActiveSession(pluginId, config);
      get().initializeStorage();
      useLogStore
        .getState()
        .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
          details: { type: pluginId, action: 'set' },
        });
    },

    clearActiveStorage: () => {
      set({
        storageConfig: null,
        storageProvider: null,
        storageType: null,
      });
      clearPersistedActiveSession();
      useLogStore
        .getState()
        .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
          details: { action: 'clear' },
        });
    },

    initializeStorage: () => {
      const { storageConfig, storageType } = get();
      if (!storageType || !storageConfig) {
        return;
      }
      try {
        set({
          storageProvider: createStorageProvider(storageType, storageConfig),
        });
      } catch (error) {
        console.error('Failed to initialize storage provider:', error);
        set({
          error: `初始化${storagePluginLabel(storageType)}存储服务失败`,
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
          ? state.assets.map(img => (img.id === asset.id ? asset : img))
          : [...state.assets, asset],
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
  getStorageConfig: () => useAssetStore.getState().storageConfig,
  getStorageProvider: () => useAssetStore.getState().storageProvider,
  setStorageType: type => useAssetStore.setState({ storageType: type }),
  setActiveStorage: (pluginId, config) =>
    useAssetStore.getState().setActiveStorage(pluginId, config),
  clearActiveStorage: () => useAssetStore.getState().clearActiveStorage(),
  loadAssets: () => useAssetStore.getState().loadAssets(),
  initializeStorageIfNeeded: () => {
    const { storageProvider, initializeStorage } = useAssetStore.getState();
    if (!storageProvider) {
      initializeStorage();
    }
  },
});
