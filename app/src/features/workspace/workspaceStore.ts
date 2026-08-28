import {
  createConfiguredStorageProvider,
  type StoragePluginId,
} from '@/storage/createProvider';
import { useSourceStore } from '@/features/settings/sourceStore';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import type { ImageItem, ImageUploadData } from '@pixuli/core/types';
import {
  createLocalVault,
  createSyncEngine,
  guessMimeType,
  providerSupportsSync,
  storedSourcesToWorkspaceBindings,
  type LocalVault,
  type SyncEngine,
  type SyncEngineBinding,
  type SyncStatusSummary,
  type WorkspaceMode,
} from '@pixuli/core/vault';
import { getUploadFileName } from '@pixuli/core/types';
import { create } from 'zustand';
import {
  clearLocalPreviewCache,
  mapEntriesToImageItems,
} from '@/features/workspace/localImageMapper';
import {
  getWorkspaceAdapter,
  isMobileWorkspaceActive,
  isWebWorkspaceActive,
  isWorkspaceAvailable,
  resetWorkspaceAdapter,
} from '@/platforms/workspacePlatform';
import { isMobileWorkspaceAdapter } from '@/platforms/mobile/workspaceAdapter';
import { isWebWorkspaceAdapter } from '@/platforms/web/workspaceAdapter';
import {
  deleteFsaDirectoryHandle,
  parseFsaRootPath,
} from '@/platforms/web/fsaWorkspaceFs';
import {
  hydrateAccessPolicy,
  resetAccessPolicy,
} from '@/features/access/accessPolicyStore';
import {
  buildSyncResultOutcome,
  type SyncRunOutcome,
} from '@/features/workspace/syncOutcome';
import {
  notifyWorkspaceCleared,
  registerWorkspaceLibraryPort,
} from '@/features/library/workspaceImageBridge';

const WORKSPACE_STORAGE_KEY = 'pixuli.workspace.v1';
const WORKSPACE_MODE_KEY = 'pixuli.workspaceMode.v1';

interface WorkspacePersist {
  rootPath: string;
  workspaceId: string;
  folderLabel?: string;
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
  syncOutcome: SyncRunOutcome | null;
  isLocalActive: () => boolean;
  needsWorkspaceSetup: () => boolean;
  initialize: () => Promise<void>;
  pickWorkspace: (options?: {
    pullAfter?: boolean;
    backend?: 'opfs' | 'fsa';
  }) => Promise<boolean>;
  clearWorkspace: () => Promise<void>;
  resumeLocalWorkspace: () => Promise<boolean>;
  syncBindingsFromSources: () => Promise<void>;
  /** quiet：添加/写入时静默刷新，避免锁住资源库壳层（§5.1） */
  refreshLocalImages: (options?: { quiet?: boolean }) => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  scanWorkspace: () => Promise<void>;
  importLocalImage: (uploadData: ImageUploadData) => Promise<ImageItem | null>;
  updateLocalMetadata: (
    relativePath: string,
    patch: { name?: string; tags?: string[]; description?: string },
  ) => Promise<void>;
  pushPendingToRemote: () => Promise<SyncRunOutcome>;
  pullFromRemote: () => Promise<SyncRunOutcome>;
  runSync: (direction?: 'push' | 'pull' | 'both') => Promise<SyncRunOutcome>;
  softDeleteLocal: (relativePath: string) => Promise<void>;
  localFolders: string[];
  refreshLocalFolders: () => Promise<void>;
  createLocalFolder: (relativeDir: string) => Promise<void>;
  renameLocalFolder: (fromDir: string, toDir: string) => Promise<void>;
  deleteLocalFolder: (relativeDir: string) => Promise<number>;
  moveLocalFile: (relativePath: string, targetDir: string) => Promise<void>;
  clearError: () => void;
}

let vaultInstance: LocalVault | null = null;
let syncEngineInstance: SyncEngine | null = null;

function getAdapter() {
  return getWorkspaceAdapter();
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
      getBindings: resolveSyncBindings,
      readFileBytes: relativePath => getAdapter().readFile(relativePath),
    });
  }
  return syncEngineInstance;
}

function resetSyncEngineOnly(): void {
  syncEngineInstance = null;
}

function resetWorkspaceRuntime(): void {
  clearLocalPreviewCache();
  vaultInstance = null;
  syncEngineInstance = null;
  resetWorkspaceAdapter();
}

function saveModePref(mode: Exclude<WorkspaceMode, 'unset'>): void {
  try {
    localStorage.setItem(WORKSPACE_MODE_KEY, mode);
  } catch {
    // ignore
  }
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

function savePersistedWorkspace(
  rootPath: string,
  workspaceId: string,
  folderLabel?: string,
): void {
  try {
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ rootPath, workspaceId, folderLabel }),
    );
  } catch {
    // ignore
  }
}

function clearPersistedWorkspace(): void {
  try {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    localStorage.removeItem(WORKSPACE_MODE_KEY);
  } catch {
    // ignore
  }
}

async function cleanupFsaWorkspaceRoot(rootPath: string | null): Promise<void> {
  if (!rootPath) {
    return;
  }
  const workspaceId = parseFsaRootPath(rootPath);
  if (!workspaceId) {
    return;
  }
  try {
    await deleteFsaDirectoryHandle(workspaceId);
  } catch {
    // ignore stale handle cleanup errors
  }
}

async function pickAdapterRoot(
  adapter: ReturnType<typeof getWorkspaceAdapter>,
  backend?: 'opfs' | 'fsa',
): Promise<boolean> {
  if (backend === 'fsa' && isWebWorkspaceAdapter(adapter)) {
    return adapter.pickFsaRoot();
  }
  return adapter.pickRoot();
}

function readFolderLabel(
  adapter: ReturnType<typeof getWorkspaceAdapter>,
): string | null {
  if (isWebWorkspaceAdapter(adapter) || isMobileWorkspaceAdapter(adapter)) {
    return adapter.getFolderLabel();
  }
  return null;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_');
}

async function openVaultWithRoot(rootPath: string): Promise<LocalVault> {
  const adapter = getAdapter();
  if ('setRootPath' in adapter && typeof adapter.setRootPath === 'function') {
    adapter.setRootPath(rootPath);
  }
  if (window.workspaceAPI) {
    await window.workspaceAPI.setRoot(rootPath);
  }
  const vault = getVault();
  await vault.open();
  await hydrateAccessPolicy(vault.adapter);
  return vault;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  mode: 'unset',
  rootPath: null,
  displayName: null,
  localImages: [],
  localFolders: [],
  loading: false,
  pushing: false,
  syncing: false,
  syncStatus: null,
  error: null,
  syncMessage: null,
  syncOutcome: null,

  isLocalActive: () => {
    return isWorkspaceAvailable() && get().mode === 'local';
  },

  needsWorkspaceSetup: () => {
    return isWorkspaceAvailable() && get().mode === 'unset';
  },

  initialize: async () => {
    if (!isWorkspaceAvailable()) {
      set({
        mode: 'unset',
        error: isWebWorkspaceActive()
          ? '当前浏览器不支持本地工作区（需 OPFS 或文件夹访问 API）'
          : isMobileWorkspaceActive()
            ? '当前设备无法初始化本地工作区'
            : null,
      });
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
      const folderLabel =
        persisted.folderLabel ?? readFolderLabel(getAdapter()) ?? undefined;
      savePersistedWorkspace(
        persisted.rootPath,
        config.workspaceId,
        folderLabel,
      );
      saveModePref('local');
      set({
        mode: 'local',
        rootPath: persisted.rootPath,
        displayName: folderLabel ?? config.displayName,
        loading: false,
      });
      await get().syncBindingsFromSources();
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

  resumeLocalWorkspace: async () => {
    if (!isWorkspaceAvailable()) {
      return false;
    }
    const persisted = loadPersistedWorkspace();
    if (!persisted?.rootPath) {
      set({ mode: 'unset' });
      return false;
    }

    set({ loading: true, error: null });
    try {
      resetWorkspaceRuntime();
      const vault = await openVaultWithRoot(persisted.rootPath);
      const config = vault.getConfig();
      const folderLabel =
        persisted.folderLabel ?? readFolderLabel(getAdapter()) ?? undefined;
      saveModePref('local');
      set({
        mode: 'local',
        rootPath: persisted.rootPath,
        displayName: folderLabel ?? config.displayName,
        loading: false,
        syncMessage: null,
        syncOutcome: null,
      });
      await get().syncBindingsFromSources();
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      return true;
    } catch (error) {
      set({
        mode: 'unset',
        loading: false,
        error: error instanceof Error ? error.message : '恢复本地工作区失败',
      });
      return false;
    }
  },

  syncBindingsFromSources: async () => {
    if (get().mode !== 'local') {
      return;
    }
    const sources = useSourceStore.getState().sources;
    await getVault().upsertBindings(storedSourcesToWorkspaceBindings(sources), {
      replace: true,
    });
    resetSyncEngineOnly();
  },

  pickWorkspace: async (options?: {
    pullAfter?: boolean;
    backend?: 'opfs' | 'fsa';
  }) => {
    if (!isWorkspaceAvailable()) {
      return false;
    }

    const previousRootPath = get().rootPath;
    const previousDisplayName = get().displayName;
    const hadLocal = get().mode === 'local' && Boolean(previousRootPath);

    set({ loading: true, error: null });
    try {
      resetWorkspaceRuntime();
      const adapter = getAdapter();
      const picked = await pickAdapterRoot(adapter, options?.backend);
      if (!picked || !adapter.getRootPath()) {
        if (hadLocal && previousRootPath) {
          await openVaultWithRoot(previousRootPath);
          set({
            mode: 'local',
            rootPath: previousRootPath,
            displayName: previousDisplayName,
            loading: false,
          });
          await get().refreshLocalImages();
          await get().refreshSyncStatus();
        } else {
          set({ loading: false });
        }
        return false;
      }

      const rootPath = adapter.getRootPath()!;
      const folderLabel = readFolderLabel(adapter) ?? undefined;
      const vault = await openVaultWithRoot(rootPath);
      const config = vault.getConfig();
      savePersistedWorkspace(rootPath, config.workspaceId, folderLabel);
      saveModePref('local');

      if (previousRootPath && previousRootPath !== rootPath) {
        await cleanupFsaWorkspaceRoot(previousRootPath);
      }

      set({
        mode: 'local',
        rootPath,
        displayName: folderLabel ?? config.displayName,
        loading: false,
        syncMessage: null,
        syncOutcome: null,
      });
      await get().syncBindingsFromSources();
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      if (options?.pullAfter) {
        await get().pullFromRemote();
      }
      return true;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '选择工作区失败',
      });
      return false;
    }
  },

  clearWorkspace: async () => {
    const { rootPath } = get();
    await cleanupFsaWorkspaceRoot(rootPath);
    clearPersistedWorkspace();
    resetWorkspaceRuntime();
    resetAccessPolicy();
    set({
      mode: 'unset',
      rootPath: null,
      displayName: null,
      localImages: [],
      localFolders: [],
      loading: false,
      pushing: false,
      syncing: false,
      syncStatus: null,
      error: null,
      syncMessage: null,
      syncOutcome: null,
    });
    notifyWorkspaceCleared();
  },

  refreshLocalImages: async options => {
    if (get().mode !== 'local') {
      return;
    }

    const quiet = options?.quiet === true;
    if (!quiet) {
      set({ loading: true, error: null });
    }
    try {
      const vault = getVault();
      const entries = await vault.list();
      const provider = resolveSelectedProvider();
      const images = await mapEntriesToImageItems(entries, provider);
      const localFolders = await vault.listFolders();
      set({ localImages: images, localFolders, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '加载本地图片失败',
      });
    }
  },

  refreshLocalFolders: async () => {
    if (get().mode !== 'local') {
      return;
    }
    try {
      const localFolders = await getVault().listFolders();
      set({ localFolders });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载文件夹失败',
      });
    }
  },

  createLocalFolder: async relativeDir => {
    if (get().mode !== 'local') {
      return;
    }
    set({ loading: true, error: null });
    try {
      await getVault().createFolder(relativeDir);
      await get().refreshLocalFolders();
      set({ loading: false, syncMessage: '已新建文件夹（仅本机）' });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '新建文件夹失败',
      });
    }
  },

  renameLocalFolder: async (fromDir, toDir) => {
    if (get().mode !== 'local') {
      return;
    }
    set({ loading: true, error: null });
    try {
      const moved = await getVault().renameFolder(fromDir, toDir);
      for (let i = 0; i < moved; i += 1) {
        // enqueue is per-file; refresh will show pending. Queue metadata/uploads for moved paths via scan of pending-push
      }
      const entries = await getVault().list();
      for (const entry of entries) {
        if (
          entry.syncState === 'pending-push' &&
          (entry.relativePath === toDir ||
            entry.relativePath.startsWith(`${toDir}/`))
        ) {
          await getSyncEngine().enqueuePush({
            type: 'upload',
            relativePath: entry.relativePath,
          });
        }
      }
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      set({ loading: false, syncMessage: '已重命名文件夹（仅本机）' });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '重命名文件夹失败',
      });
    }
  },

  deleteLocalFolder: async relativeDir => {
    if (get().mode !== 'local') {
      return 0;
    }
    set({ loading: true, error: null });
    try {
      const count = await getVault().deleteFolder(relativeDir);
      const deleted = await getVault().list({ includeDeleted: true });
      for (const entry of deleted) {
        if (
          entry.deletedAt &&
          (entry.relativePath === relativeDir ||
            entry.relativePath.startsWith(`${relativeDir}/`))
        ) {
          await getSyncEngine().enqueuePush({
            type: 'delete',
            relativePath: entry.relativePath,
          });
        }
      }
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      set({ loading: false, syncMessage: '已删除文件夹（仅本机）' });
      return count;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '删除文件夹失败',
      });
      return 0;
    }
  },

  moveLocalFile: async (relativePath, targetDir) => {
    if (get().mode !== 'local') {
      return;
    }
    set({ loading: true, error: null });
    try {
      const entry = await getVault().moveFile(relativePath, targetDir);
      await getSyncEngine().enqueuePush({
        type: 'upload',
        relativePath: entry.relativePath,
      });
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      set({ loading: false, syncMessage: '已移动文件（仅本机）' });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '移动文件失败',
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
      return null;
    }

    // 添加不锁壳层：不置 loading，列表静默刷新（§5.1）
    set({ error: null });
    try {
      const fileName = sanitizeFileName(
        getUploadFileName(uploadData.file, uploadData.name),
      );
      const { useUIStore } = await import('@/stores/uiStore');
      const selectedFolderPath = useUIStore.getState().selectedFolderPath;
      const fromForm = uploadData.targetFolder?.replace(/\/+$/, '');
      const fromTree =
        selectedFolderPath && selectedFolderPath !== '__root__'
          ? selectedFolderPath
          : '';
      const targetDir = fromForm || fromTree || 'images';
      const targetPath = `${targetDir.replace(/\/+$/, '')}/${Date.now()}-${fileName}`;
      const vault = getVault();
      const mimeType =
        typeof uploadData.file === 'string'
          ? guessMimeType(fileName)
          : uploadData.file.type || guessMimeType(fileName);
      let width = 0;
      let height = 0;
      if (mimeType.startsWith('image/')) {
        try {
          const platform = new DefaultPlatformAdapter();
          const dimensions = await platform.getImageDimensions(uploadData.file);
          width = dimensions.width;
          height = dimensions.height;
        } catch {
          width = 0;
          height = 0;
        }
      }

      await vault.importFile(uploadData.file, targetPath, {
        name: uploadData.name ?? fileName,
        tags: uploadData.tags ?? [],
        description: uploadData.description,
        mimeType,
        width,
        height,
        syncState: 'local-only',
        createdAt: uploadData.captureMetadata?.takenAt,
        captureMetadata: uploadData.captureMetadata,
      });

      await getSyncEngine().enqueuePush({
        type: 'upload',
        relativePath: targetPath,
      });

      await get().refreshLocalImages({ quiet: true });
      await get().refreshSyncStatus();
      set({ syncMessage: '已保存到本地工作区' });
      return (
        get().localImages.find(image => image.localPath === targetPath) ?? null
      );
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '保存到本地工作区失败',
      });
      throw error;
    }
  },

  updateLocalMetadata: async (relativePath, patch) => {
    if (get().mode !== 'local') {
      return;
    }
    set({ loading: true, error: null });
    try {
      await getVault().updateMetadata(relativePath, patch);
      await getSyncEngine().enqueuePush({
        type: 'metadata',
        relativePath,
      });
      await get().refreshLocalImages();
      await get().refreshSyncStatus();
      set({ loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '更新元数据失败',
      });
      throw error;
    }
  },

  pushPendingToRemote: async () => {
    return get().runSync('push');
  },

  pullFromRemote: async () => {
    return get().runSync('pull');
  },

  runSync: async (direction = 'both'): Promise<SyncRunOutcome> => {
    if (get().mode !== 'local') {
      const outcome: SyncRunOutcome = {
        kind: 'error',
        parts: [{ key: 'workspace.syncNeedsLocal' }],
      };
      set({ error: null, syncOutcome: outcome, syncMessage: null });
      return outcome;
    }

    if (resolveSelectedProvider() === null) {
      const outcome: SyncRunOutcome = {
        kind: 'error',
        parts: [{ key: 'workspace.syncNeedsRemote' }],
      };
      set({ error: null, syncOutcome: outcome, syncMessage: null });
      return outcome;
    }

    if (direction === 'push') {
      const entries = await getVault().list({ includeDeleted: true });
      const hasPushable =
        entries.some(entry => !entry.deletedAt) ||
        entries.some(
          entry =>
            entry.deletedAt &&
            (entry.remotePath || entry.syncState === 'pending-push'),
        );
      const status = await getSyncEngine().getStatus();
      if (!hasPushable && status.pendingPush === 0) {
        const outcome: SyncRunOutcome = {
          kind: 'info',
          parts: [{ key: 'workspace.syncNothingToPush' }],
        };
        set({ syncOutcome: outcome, syncMessage: null, error: null });
        return outcome;
      }
    }

    set({
      syncing: true,
      pushing: direction === 'push' || direction === 'both',
      error: null,
      syncMessage: null,
      syncOutcome: null,
    });

    try {
      const result = await getSyncEngine().run({ direction });
      await get().refreshLocalImages();
      await get().refreshSyncStatus();

      if (result.errors.length > 0) {
        const outcome: SyncRunOutcome = {
          kind: 'error',
          parts: [{ key: 'workspace.syncFailed' }],
          rawMessage: result.errors.map(item => item.message).join('；'),
        };
        set({
          syncing: false,
          pushing: false,
          error: outcome.rawMessage ?? null,
          syncOutcome: outcome,
        });
        return outcome;
      }

      const outcome = buildSyncResultOutcome(result);
      set({
        syncing: false,
        pushing: false,
        syncOutcome: outcome,
        error: null,
      });
      return outcome;
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : undefined;
      const outcome: SyncRunOutcome = {
        kind: 'error',
        parts: [{ key: 'workspace.syncFailed' }],
        rawMessage,
      };
      set({
        syncing: false,
        pushing: false,
        error: rawMessage ?? null,
        syncOutcome: outcome,
      });
      return outcome;
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

  clearError: () => set({ error: null, syncOutcome: null }),
}));

registerWorkspaceLibraryPort({
  isLocalActive: () => useWorkspaceStore.getState().isLocalActive(),
  refreshLocalImages: options =>
    useWorkspaceStore.getState().refreshLocalImages(options),
  getLocalImages: () => useWorkspaceStore.getState().localImages,
  importLocalImage: uploadData =>
    useWorkspaceStore.getState().importLocalImage(uploadData),
  softDeleteLocal: relativePath =>
    useWorkspaceStore.getState().softDeleteLocal(relativePath),
  moveLocalFile: (relativePath, targetDir) =>
    useWorkspaceStore.getState().moveLocalFile(relativePath, targetDir),
  updateLocalMetadata: (relativePath, patch) =>
    useWorkspaceStore.getState().updateLocalMetadata(relativePath, patch),
});

function resolveSyncBindings(): SyncEngineBinding[] {
  if (vaultInstance && useWorkspaceStore.getState().mode === 'local') {
    const config = vaultInstance.getConfig();
    const bindingDefs =
      config.bindings.length > 0
        ? config.bindings
        : storedSourcesToWorkspaceBindings(useSourceStore.getState().sources);

    const bindings: SyncEngineBinding[] = [];
    for (const binding of bindingDefs) {
      try {
        const provider = createConfiguredStorageProvider(
          binding.pluginId as StoragePluginId,
          binding.config as never,
        );
        if (providerSupportsSync(provider)) {
          bindings.push({ bindingId: binding.id, provider });
        }
      } catch {
        // skip invalid binding
      }
    }
    return bindings;
  }

  const source = resolveSelectedSource();
  const provider = resolveSelectedProvider();
  if (!source || !provider || !providerSupportsSync(provider)) {
    return [];
  }
  return [{ bindingId: source.id, provider }];
}

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
