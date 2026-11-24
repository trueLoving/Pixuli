import {
  clearActiveStorageSession,
  loadActiveStorageSession,
  saveActiveStorageSession,
  type ActiveStorageSession,
} from '@/features/settings/config/storageSession';
import {
  createConfiguredStorageProvider,
  type StoragePluginId,
} from '@/storage/createProvider';
import type {
  StorageProvider,
  StorageProviderConfig,
} from '@pixuli/core/plugins';

export type ProviderSessionState = {
  storageType: StoragePluginId | null;
  storageConfig: StorageProviderConfig | null;
  storageProvider: StorageProvider | null;
};

export function resolveInitialProviderSession(): ProviderSessionState {
  const session = loadActiveStorageSession();
  if (!session) {
    return {
      storageType: null,
      storageConfig: null,
      storageProvider: null,
    };
  }

  try {
    return {
      storageType: session.pluginId,
      storageConfig: session.config,
      storageProvider: createConfiguredStorageProvider(
        session.pluginId,
        session.config,
      ),
    };
  } catch (error) {
    console.error('Failed to restore storage session:', error);
    return {
      storageType: session.pluginId,
      storageConfig: session.config,
      storageProvider: null,
    };
  }
}

export function createStorageProvider(
  storageType: StoragePluginId,
  config: StorageProviderConfig,
): StorageProvider {
  return createConfiguredStorageProvider(storageType, config);
}

export function persistActiveSession(
  pluginId: string,
  config: StorageProviderConfig,
): void {
  saveActiveStorageSession({ pluginId, config });
}

export function clearPersistedActiveSession(): void {
  clearActiveStorageSession();
}

export function toActiveSession(
  pluginId: string | null,
  config: StorageProviderConfig | null,
): ActiveStorageSession | null {
  if (!pluginId || !config) return null;
  return { pluginId, config };
}
