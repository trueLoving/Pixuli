import type { WorkspaceAdapter } from '@pixuli/core/vault';
import {
  createDesktopWorkspaceAdapter,
  isDesktopWorkspaceAvailable,
} from './desktop/workspaceAdapter';
import {
  createWebWorkspaceAdapter,
  isWebWorkspaceAvailable,
} from './web/workspaceAdapter';

let adapterInstance: WorkspaceAdapter | null = null;

export function isWorkspaceAvailable(): boolean {
  return isDesktopWorkspaceAvailable() || isWebWorkspaceAvailable();
}

export function getWorkspaceAdapter(): WorkspaceAdapter {
  if (!adapterInstance) {
    if (isDesktopWorkspaceAvailable()) {
      adapterInstance = createDesktopWorkspaceAdapter();
    } else if (isWebWorkspaceAvailable()) {
      adapterInstance = createWebWorkspaceAdapter();
    } else {
      throw new Error('No workspace adapter available on this platform');
    }
  }
  return adapterInstance;
}

export function resetWorkspaceAdapter(): void {
  adapterInstance = null;
}

export function isWebWorkspaceActive(): boolean {
  return isWebWorkspaceAvailable() && !isDesktopWorkspaceAvailable();
}

export {
  isFileSystemAccessSupported,
  isOpfsSupported,
} from './web/workspaceAdapter';
