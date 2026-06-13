import {
  createConfiguredStorageProvider,
  type StoragePluginId,
} from '@/storage/createProvider';
import { useSourceStore } from '@/stores/sourceStore';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import type { ImageItem, ImageUploadData } from '@pixuli/core/types';
import {
  createLocalVault,
  type LocalVault,
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
  error: string | null;
  syncMessage: string | null;
  isLocalActive: () => boolean;
  initialize: () => Promise<void>;
  pickWorkspace: () => Promise<boolean>;
  refreshLocalImages: () => Promise<void>;
  importLocalImage: (uploadData: ImageUploadData) => Promise<void>;
  pushPendingToRemote: () => Promise<void>;
  softDeleteLocal: (relativePath: string) => Promise<void>;
  clearError: () => void;
}

let vaultInstance: LocalVault | null = null;
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
      clearLocalPreviewCache();
      vaultInstance = null;
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

      await get().refreshLocalImages();
      set({ loading: false, syncMessage: '已保存到本地工作区' });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '保存到本地工作区失败',
      });
    }
  },

  pushPendingToRemote: async () => {
    if (get().mode !== 'local') {
      set({ error: '请先选择本地工作区' });
      return;
    }

    const provider = resolveSelectedProvider();
    if (!provider) {
      set({ error: '请先添加并选择 GitHub/Gitee 远端源' });
      return;
    }

    set({ pushing: true, error: null, syncMessage: null });
    try {
      const vault = getVault();
      const entries = await vault.list();
      const pending = entries.filter(
        e => e.syncState === 'local-only' || e.syncState === 'pending-push',
      );

      if (pending.length === 0) {
        set({ pushing: false, syncMessage: '没有待推送的本地图片' });
        return;
      }

      let pushed = 0;
      const source = resolveSelectedSource();
      for (const entry of pending) {
        const bytes = await getAdapter().readFile(entry.relativePath);
        const file = new File([Uint8Array.from(bytes)], entry.name, {
          type: entry.mimeType,
        });

        await provider.uploadImage({
          file,
          name: entry.name,
          tags: entry.tags,
          description: entry.description,
        });

        await vault.updateSyncMeta(entry.relativePath, {
          syncState: 'synced',
          remotePath: entry.name,
          bindingId: source?.id,
        });
        pushed += 1;
      }

      await get().refreshLocalImages();
      set({
        pushing: false,
        syncMessage: `已推送 ${pushed} 张图片到远端`,
      });
    } catch (error) {
      set({
        pushing: false,
        error: error instanceof Error ? error.message : '推送到远端失败',
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
      await get().refreshLocalImages();
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
