import {
  createConfiguredStorageProvider,
  type StoragePluginId,
} from '@/storage/createProvider';
import { useSourceStore } from '@/stores/sourceStore';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import type { ImageItem, ImageUploadData } from '@pixuli/core/types';
import {
  createLocalVault,
  createSyncEngine,
  providerSupportsSync,
  type LocalVault,
  type SyncEngine,
  type SyncStatusSummary,
  type WorkspaceMode,
} from '@pixuli/core/vault';
import { getUploadFileName } from '@pixuli/core/types';
import { create } from 'zustand';
import {
  clearLocalPreviewCache,
  mapEntriesToImageItems,
} from '../features/workspace/localImageMapper';
import {
  createDesktopWorkspaceAdapter,
  DesktopWorkspaceAdapter,
  isDesktopWorkspaceAvailable,
} from '../platforms/desktop/workspaceAdapter';

const WORKSPACE_STORAGE_KEY = 'pixuli.workspace.v1';

interface WorkspacePersist {
  rootPath: string;
  workspaceId: string;
}

interface WorkspaceState {
  mode: WorkspaceMode;
  rootPath: string | null;
  displayName: string | null;
  localImages: ImageItem[];
  loading: boolean;
  pushing: boolean;
  syncing: boolean;
  syncStatus: SyncStatusSummary | null;
  error: string | null;
  syncMessage: string | null;
  isLocalActive: () => boolean;
  initialize: () => Promise<void>;
  pickWorkspace: () => Promise<boolean>;
  refreshLocalImages: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  scanWorkspace: () => Promise<void>;
  importLocalImage: (uploadData: ImageUploadData) => Promise<void>;
  pushPendingToRemote: () => Promise<void>;
  pullFromRemote: () => Promise<void>;
  runSync: (direction?: 'push' | 'pull' | 'both') => Promise<void>;
  softDeleteLocal: (relativePath: string) => Promise<void>;
  clearError: () => void;
}

let vaultInstance: LocalVault | null = null;
let syncEngineInstance: SyncEngine | null = null;
let adapterInstance: DesktopWorkspaceAdapter | null = null;

function getAdapter(): DesktopWorkspaceAdapter {
  if (!adapterInstance) {
    adapterInstance = createDesktopWorkspaceAdapter();
  }
  return adapterInstance;
}

function getVault(): LocalVault {
  if (!vaultInstance) {
    vaultInstance = createLocalVault(getAdapter());
  }
  return vaultInstance;
}

function getSyncEngine(): SyncEngine {
  if (!syncEngineInstance) {
    syncEngineInstance = createSyncEngine({
      vault: getVault(),
      getBindings: () => {
        const source = resolveSelectedSource();
        const provider = resolveSelectedProvider();
        if (!source || !provider || !providerSupportsSync(provider)) {
          return [];
        }
        return [{ bindingId: source.id, provider }];
      },
      readFileBytes: relativePath => getAdapter().readFile(relativePath),
    });
  }
  return syncEngineInstance;
}

function resetWorkspaceRuntime(): void {
  clearLocalPreviewCache();
  vaultInstance = null;
  syncEngineInstance = null;
}

function loadPersistedWorkspace(): WorkspacePersist | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspacePersist;
    if (parsed?.rootPath) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function savePersistedWorkspace(rootPath: string, workspaceId: string): void {
  try {
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ rootPath, workspaceId }),
    );
  } catch {
    // ignore
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_');
}

async function openVaultWithRoot(rootPath: string): Promise<LocalVault> {
  const adapter = getAdapter();
  adapter.setRootPath(rootPath);
  if (window.workspaceAPI) {
    await window.workspaceAPI.setRoot(rootPath);
  }
  const vault = getVault();
  await vault.open();
  return vault;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  mode: 'unset',
  rootPath: null,
  displayName: null,
  localImages: [],
  loading: false,
  pushing: false,
  syncing: false,
  syncStatus: null,
  error: null,
  syncMessage: null,

  isLocalActive: () => {
    return isDesktopWorkspaceAvailable() && get().mode === 'local';
  },

  initialize: async () => {
    if (!isDesktopWorkspaceAvailable()) {
      set({ mode: 'remote-only' });
      return;
    }

    const persisted = loadPersistedWorkspace();
    if (!persisted?.rootPath) {
      set({ mode: 'unset' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const vault = await openVaultWithRoot(persisted.rootPath);
      const config = vault.getConfig();
      savePersistedWorkspace(persisted.rootPath, config.workspaceId);
      set({
        mode: 'local',
        rootPath: persisted.rootPath,
        displayName: config.displayName,
        loading: false,
      });
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
    } catch (error) {
      set({
        mode: 'unset',
        loading: false,
        error: error instanceof Error ? error.message : '工作区初始化失败',
      });
    }
  },

  pickWorkspace: async () => {
    if (!isDesktopWorkspaceAvailable()) {
      return false;
    }

    set({ loading: true, error: null });
    try {
      resetWorkspaceRuntime();
      const adapter = getAdapter();
      const picked = await adapter.pickRoot();
      if (!picked || !adapter.getRootPath()) {
        set({ loading: false });
        return false;
      }

      const rootPath = adapter.getRootPath()!;
      const vault = await openVaultWithRoot(rootPath);
      const config = vault.getConfig();
      savePersistedWorkspace(rootPath, config.workspaceId);

      set({
        mode: 'local',
        rootPath,
        displayName: config.displayName,
        loading: false,
        syncMessage: null,
      });
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      return true;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '选择工作区失败',
      });
      return false;
    }
  },

  refreshLocalImages: async () => {
    if (get().mode !== 'local') {
      return;
    }

    set({ loading: true, error: null });
    try {
      const vault = getVault();
      const entries = await vault.list();
      const provider = resolveSelectedProvider();
      const images = await mapEntriesToImageItems(entries, provider);
      set({ localImages: images, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '加载本地图片失败',
      });
    }
  },

  refreshSyncStatus: async () => {
    if (get().mode !== 'local') {
      return;
    }
    try {
      const status = await getSyncEngine().getStatus();
      set({ syncStatus: status });
    } catch {
      // ignore status refresh errors
    }
  },

  scanWorkspace: async () => {
    if (get().mode !== 'local') {
      return;
    }
    set({ loading: true, error: null });
    try {
      const added = await getVault().scan();
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      set({
        loading: false,
        syncMessage:
          added > 0 ? `扫描完成，新增 ${added} 张图片` : '扫描完成，索引已更新',
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '扫描工作区失败',
      });
    }
  },

  importLocalImage: async uploadData => {
    if (get().mode !== 'local') {
      set({ error: '请先选择本地工作区' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const fileName = sanitizeFileName(
        getUploadFileName(uploadData.file, uploadData.name),
      );
      const targetPath = `images/${Date.now()}-${fileName}`;
      const platform = new DefaultPlatformAdapter();
      const dimensions = await platform.getImageDimensions(uploadData.file);

      const vault = getVault();
      await vault.importFile(uploadData.file, targetPath, {
        name: uploadData.name ?? fileName,
        tags: uploadData.tags ?? [],
        description: uploadData.description,
        width: dimensions.width,
        height: dimensions.height,
        syncState: 'local-only',
      });

      await getSyncEngine().enqueuePush({
        type: 'upload',
        relativePath: targetPath,
      });

      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      set({ loading: false, syncMessage: '已保存到本地工作区' });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '保存到本地工作区失败',
      });
    }
  },

  pushPendingToRemote: async () => {
    await get().runSync('push');
  },

  pullFromRemote: async () => {
    await get().runSync('pull');
  },

  runSync: async (direction = 'both') => {
    if (get().mode !== 'local') {
      set({ error: '请先选择本地工作区' });
      return;
    }

    if (resolveSelectedProvider() === null) {
      set({ error: '请先添加并选择 GitHub/Gitee 远端源' });
      return;
    }

    if (direction === 'push') {
      const entries = await getVault().list();
      const hasPending = entries.some(
        entry =>
          !entry.deletedAt &&
          (entry.syncState === 'local-only' ||
            entry.syncState === 'pending-push'),
      );
      const status = await getSyncEngine().getStatus();
      if (!hasPending && status.pendingPush === 0) {
        set({ syncMessage: '没有待推送的本地图片' });
        return;
      }
    }

    set({
      syncing: true,
      pushing: direction === 'push' || direction === 'both',
      error: null,
      syncMessage: null,
    });

    try {
      const result = await getSyncEngine().run({ direction });
      await get().refreshLocalImages();
      await get().refreshSyncStatus();

      if (result.errors.length > 0) {
        set({
          syncing: false,
          pushing: false,
          error: result.errors.map(item => item.message).join('；'),
        });
        return;
      }

      const messages: string[] = [];
      if (result.pushed > 0) {
        messages.push(`已推送 ${result.pushed} 项`);
      }
      if (result.pulled > 0) {
        messages.push(`已拉取 ${result.pulled} 项`);
      }
      if (result.conflicts.length > 0) {
        messages.push(`${result.conflicts.length} 项冲突需手动处理`);
      }
      if (messages.length === 0) {
        messages.push('同步完成，无变更');
      }

      set({
        syncing: false,
        pushing: false,
        syncMessage: messages.join('；'),
      });
    } catch (error) {
      set({
        syncing: false,
        pushing: false,
        error: error instanceof Error ? error.message : '同步失败',
      });
    }
  },

  softDeleteLocal: async relativePath => {
    if (get().mode !== 'local') {
      return;
    }
    set({ loading: true, error: null });
    try {
      await getVault().softDelete(relativePath);
      await getSyncEngine().enqueuePush({
        type: 'delete',
        relativePath,
      });
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      set({ loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '删除失败',
      });
    }
  },

  clearError: () => set({ error: null }),
}));

function resolveSelectedSource() {
  const { selectedSourceId, sources, getSourceById } =
    useSourceStore.getState();
  if (selectedSourceId) {
    return getSourceById(selectedSourceId) ?? null;
  }
  return sources[0] ?? null;
}

function resolveSelectedProvider() {
  const source = resolveSelectedSource();
  if (!source) {
    return null;
  }
  try {
    return createConfiguredStorageProvider(
      source.pluginId as StoragePluginId,
      source.config as never,
    );
  } catch {
    return null;
  }
}
