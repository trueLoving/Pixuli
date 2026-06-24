import type { WorkspaceAdapter } from '@pixuli/core/vault';
import { isNativeMobile } from '@/utils/platform';
import {
  formatMobileRootPath,
  mobileDeleteFile,
  mobileEnsureWorkspace,
  mobileExists,
  mobileListFiles,
  mobileReadFile,
  mobileWriteFile,
  parseMobileRootPath,
} from './mobileWorkspaceFs';

/**
 * Capacitor Android 工作区适配器（REF-607 P6 / #161）。
 * PoC：应用沙箱 Directory.Data；后续可接 SAF 目录授权（REF-510 #120）。
 */
export class MobileWorkspaceAdapter implements WorkspaceAdapter {
  readonly kind = 'mobile' as const;
  private rootPath: string | null = null;
  private workspaceId: string | null = null;
  private folderLabel: string | null = null;

  isReady(): boolean {
    return Boolean(this.workspaceId);
  }

  getRootPath(): string | null {
    return this.rootPath;
  }

  getFolderLabel(): string | null {
    return this.folderLabel;
  }

  setRootPath(rootPath: string | null): void {
    this.rootPath = rootPath;
    this.folderLabel = null;
    if (!rootPath) {
      this.workspaceId = null;
      return;
    }
    this.workspaceId = parseMobileRootPath(rootPath);
  }

  async pickRoot(): Promise<boolean> {
    const workspaceId = crypto.randomUUID();
    await mobileEnsureWorkspace(workspaceId);
    this.workspaceId = workspaceId;
    this.rootPath = formatMobileRootPath(workspaceId);
    this.folderLabel = null;
    return true;
  }

  private requireWorkspaceId(): string {
    if (!this.workspaceId) {
      throw new Error(
        'Mobile workspace is not initialized; call pickRoot() first',
      );
    }
    return this.workspaceId;
  }

  async readFile(relativePath: string): Promise<Uint8Array> {
    return mobileReadFile(this.requireWorkspaceId(), relativePath);
  }

  async writeFile(relativePath: string, data: Uint8Array): Promise<void> {
    await mobileWriteFile(this.requireWorkspaceId(), relativePath, data);
  }

  async deleteFile(relativePath: string): Promise<void> {
    await mobileDeleteFile(this.requireWorkspaceId(), relativePath);
  }

  async listFiles(
    relativeDir: string,
    options?: { recursive?: boolean },
  ): Promise<string[]> {
    return mobileListFiles(this.requireWorkspaceId(), relativeDir, options);
  }

  async exists(relativePath: string): Promise<boolean> {
    return mobileExists(this.requireWorkspaceId(), relativePath);
  }
}

export function createMobileWorkspaceAdapter(): MobileWorkspaceAdapter {
  return new MobileWorkspaceAdapter();
}

export function isMobileWorkspaceAdapter(
  adapter: WorkspaceAdapter,
): adapter is MobileWorkspaceAdapter {
  return adapter.kind === 'mobile';
}

export function isMobileWorkspaceAvailable(): boolean {
  return isNativeMobile();
}
