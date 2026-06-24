import type { WorkspaceAdapter } from '@pixuli/core/vault';
import {
  createDesktopWorkspaceAdapter,
  isDesktopWorkspaceAvailable,
} from './desktop/workspaceAdapter';
import {
  createMobileWorkspaceAdapter,
  isMobileWorkspaceAvailable,
} from './mobile/workspaceAdapter';
import {
  createWebWorkspaceAdapter,
  isWebWorkspaceAvailable,
} from './web/workspaceAdapter';

let adapterInstance: WorkspaceAdapter | null = null;

export function isWorkspaceAvailable(): boolean {
  return (
    isDesktopWorkspaceAvailable() ||
    isMobileWorkspaceAvailable() ||
    isWebWorkspaceAvailable()
  );
}

export function getWorkspaceAdapter(): WorkspaceAdapter {
  if (!adapterInstance) {
    if (isDesktopWorkspaceAvailable()) {
      adapterInstance = createDesktopWorkspaceAdapter();
    } else if (isMobileWorkspaceAvailable()) {
      adapterInstance = createMobileWorkspaceAdapter();
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
  return (
    isWebWorkspaceAvailable() &&
    !isDesktopWorkspaceAvailable() &&
    !isMobileWorkspaceAvailable()
  );
}

export function isMobileWorkspaceActive(): boolean {
  return isMobileWorkspaceAvailable() && !isDesktopWorkspaceAvailable();
}

export {
  isFileSystemAccessSupported,
  isOpfsSupported,
} from './web/workspaceAdapter';
export { isMobileWorkspaceAdapter } from './mobile/workspaceAdapter';
