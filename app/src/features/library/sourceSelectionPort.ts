import type {
  StorageProvider,
  StorageProviderConfig,
} from '@pixuli/core/plugins';
import type { StoragePluginId } from '@/storage/createProvider';

/** settings ↔ library：源选中与仓库配置同步（避免 settings 直接依赖 assetStore） */
export interface SourceSelectionPort {
  getStorageType(): StoragePluginId | null;
  getStorageConfig(): StorageProviderConfig | null;
  getStorageProvider(): StorageProvider | null;
  setStorageType(type: StoragePluginId): void;
  /** 激活指定插件并写入配置（取代 setGitHub/setGitee） */
  setActiveStorage(pluginId: string, config: StorageProviderConfig): void;
  clearActiveStorage(): void;
  loadAssets(): Promise<void>;
  initializeStorageIfNeeded(): void;
}

const inactivePort: SourceSelectionPort = {
  getStorageType: () => null,
  getStorageConfig: () => null,
  getStorageProvider: () => null,
  setStorageType: () => undefined,
  setActiveStorage: () => undefined,
  clearActiveStorage: () => undefined,
  loadAssets: async () => undefined,
  initializeStorageIfNeeded: () => undefined,
};

let sourceSelectionPort: SourceSelectionPort | null = null;

export function registerSourceSelectionPort(port: SourceSelectionPort): void {
  sourceSelectionPort = port;
}

export function getSourceSelectionPort(): SourceSelectionPort {
  return sourceSelectionPort ?? inactivePort;
}
