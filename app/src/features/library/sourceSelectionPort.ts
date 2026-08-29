import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';
import type { StoragePluginId } from '@/storage/createProvider';

/** settings ↔ library：源选中与仓库配置同步（避免 settings 直接依赖 imageStore） */
export interface SourceSelectionPort {
  getStorageType(): StoragePluginId | null;
  getGitHubConfig(): GitHubConfig | null;
  getGiteeConfig(): GiteeConfig | null;
  getStorageProvider(): StorageProvider | null;
  setStorageType(type: StoragePluginId): void;
  setGitHubConfig(config: GitHubConfig): void;
  setGiteeConfig(config: GiteeConfig): void;
  clearGitHubConfig(): void;
  clearGiteeConfig(): void;
  loadImages(): Promise<void>;
  initializeStorageIfNeeded(): void;
}

const inactivePort: SourceSelectionPort = {
  getStorageType: () => null,
  getGitHubConfig: () => null,
  getGiteeConfig: () => null,
  getStorageProvider: () => null,
  setStorageType: () => undefined,
  setGitHubConfig: () => undefined,
  setGiteeConfig: () => undefined,
  clearGitHubConfig: () => undefined,
  clearGiteeConfig: () => undefined,
  loadImages: async () => undefined,
  initializeStorageIfNeeded: () => undefined,
};

let sourceSelectionPort: SourceSelectionPort | null = null;

export function registerSourceSelectionPort(port: SourceSelectionPort): void {
  sourceSelectionPort = port;
}

export function getSourceSelectionPort(): SourceSelectionPort {
  return sourceSelectionPort ?? inactivePort;
}
