import type { AssetItem, AssetUploadData } from '@pixuli/core/types';
import type { LibraryListScope } from '@/features/library/libraryListScope';

/** workspace → library：工作区变更时重置资源库列表 */
export type LibraryAssetReset = () => void;

/** library → workspace：本地工作区 CRUD 端口（避免 assetStore 直接依赖 workspaceStore） */
export interface WorkspaceLibraryPort {
  isLocalActive(): boolean;
  refreshLocalAssets(options?: LibraryListScope): Promise<void>;
  getLocalAssets(): AssetItem[];
  getScopedTotal(): number;
  importLocalAsset(uploadData: AssetUploadData): Promise<AssetItem | null>;
  softDeleteLocal(relativePath: string): Promise<void>;
  moveLocalFile(relativePath: string, targetDir: string): Promise<void>;
  updateLocalMetadata(
    relativePath: string,
    patch: {
      name: string;
      description?: string;
      tags?: string[];
    },
  ): Promise<void>;
}

const inactivePort: WorkspaceLibraryPort = {
  isLocalActive: () => false,
  refreshLocalAssets: async () => undefined,
  getLocalAssets: () => [],
  getScopedTotal: () => 0,
  importLocalAsset: async () => null,
  softDeleteLocal: async () => undefined,
  moveLocalFile: async () => undefined,
  updateLocalMetadata: async () => undefined,
};

let workspacePort: WorkspaceLibraryPort | null = null;
let resetLibraryAssets: LibraryAssetReset | null = null;

export function registerWorkspaceLibraryPort(port: WorkspaceLibraryPort): void {
  workspacePort = port;
}

export function getWorkspaceLibraryPort(): WorkspaceLibraryPort {
  return workspacePort ?? inactivePort;
}

export function registerLibraryAssetReset(reset: LibraryAssetReset): void {
  resetLibraryAssets = reset;
}

export function notifyWorkspaceCleared(): void {
  resetLibraryAssets?.();
}
