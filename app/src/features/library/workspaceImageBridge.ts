import type { ImageItem, ImageUploadData } from '@pixuli/core/types';

/** workspace → library：工作区变更时重置资源库列表 */
export type LibraryImageReset = () => void;

/** library → workspace：本地工作区 CRUD 端口（避免 imageStore 直接依赖 workspaceStore） */
export interface WorkspaceLibraryPort {
  isLocalActive(): boolean;
  refreshLocalImages(options?: { quiet?: boolean }): Promise<void>;
  getLocalImages(): ImageItem[];
  importLocalImage(uploadData: ImageUploadData): Promise<ImageItem | null>;
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
  refreshLocalImages: async () => undefined,
  getLocalImages: () => [],
  importLocalImage: async () => null,
  softDeleteLocal: async () => undefined,
  moveLocalFile: async () => undefined,
  updateLocalMetadata: async () => undefined,
};

let workspacePort: WorkspaceLibraryPort | null = null;
let resetLibraryImages: LibraryImageReset | null = null;

export function registerWorkspaceLibraryPort(port: WorkspaceLibraryPort): void {
  workspacePort = port;
}

export function getWorkspaceLibraryPort(): WorkspaceLibraryPort {
  return workspacePort ?? inactivePort;
}

export function registerLibraryImageReset(reset: LibraryImageReset): void {
  resetLibraryImages = reset;
}

export function notifyWorkspaceCleared(): void {
  resetLibraryImages?.();
}
