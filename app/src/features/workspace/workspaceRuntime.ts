import {
  createConfiguredStorageProvider,
  type StoragePluginId,
} from '@/storage/createProvider';
import { useSourceStore } from '@/features/settings/sourceStore';
import {
  createLocalVault,
  createSyncEngine,
  providerSupportsSync,
  storedSourcesToWorkspaceBindings,
  type LocalVault,
  type SyncEngine,
  type SyncEngineBinding,
  type WorkspaceMode,
} from '@pixuli/core/vault';
import {
  getWorkspaceAdapter,
  resetWorkspaceAdapter,
} from '@/platforms/workspacePlatform';
import { clearLocalPreviewCache } from '@/features/workspace/localImageMapper';

let vaultInstance: LocalVault | null = null;
let syncEngineInstance: SyncEngine | null = null;
let readWorkspaceMode: () => WorkspaceMode = () => 'unset';

export function getWorkspaceVaultInstance(): LocalVault | null {
  return vaultInstance;
}

export function registerWorkspaceModeReader(reader: () => WorkspaceMode): void {
  readWorkspaceMode = reader;
}

function getAdapter() {
  return getWorkspaceAdapter();
}

export function getWorkspaceVault(): LocalVault {
  if (!vaultInstance) {
    vaultInstance = createLocalVault(getAdapter());
  }
  return vaultInstance;
}

function resolveSyncBindings(): SyncEngineBinding[] {
  if (vaultInstance && readWorkspaceMode() === 'local') {
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

export function resolveSelectedProvider() {
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

export function getWorkspaceSyncEngine(): SyncEngine {
  if (!syncEngineInstance) {
    syncEngineInstance = createSyncEngine({
      vault: getWorkspaceVault(),
      getBindings: resolveSyncBindings,
      readFileBytes: relativePath => getAdapter().readFile(relativePath),
    });
  }
  return syncEngineInstance;
}

export function resetWorkspaceSyncEngineOnly(): void {
  syncEngineInstance = null;
}

export function resetWorkspaceRuntime(): void {
  clearLocalPreviewCache();
  vaultInstance = null;
  syncEngineInstance = null;
  resetWorkspaceAdapter();
}
