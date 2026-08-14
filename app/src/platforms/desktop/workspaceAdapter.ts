import type { WorkspaceAdapter } from '@pixuli/core/vault';

function assertWorkspaceAPI(): WorkspaceAPI {
  if (typeof window === 'undefined' || !window.workspaceAPI) {
    throw new Error('workspaceAPI is only available in Electron Desktop');
  }
  return window.workspaceAPI;
}

export class DesktopWorkspaceAdapter implements WorkspaceAdapter {
  readonly kind = 'desktop' as const;
  private rootPath: string | null = null;

  isReady(): boolean {
    return Boolean(this.rootPath);
  }

  getRootPath(): string | null {
    return this.rootPath;
  }

  setRootPath(rootPath: string | null): void {
    this.rootPath = rootPath;
  }

  async pickRoot(): Promise<boolean> {
    const api = assertWorkspaceAPI();
    const result = await api.pickRoot();
    if (result.ok && result.rootPath) {
      this.rootPath = result.rootPath;
      return true;
    }
    return false;
  }

  async readFile(relativePath: string): Promise<Uint8Array> {
    return assertWorkspaceAPI().readFile(relativePath);
  }

  async writeFile(relativePath: string, data: Uint8Array): Promise<void> {
    await assertWorkspaceAPI().writeFile(relativePath, data);
  }

  async deleteFile(relativePath: string): Promise<void> {
    await assertWorkspaceAPI().deleteFile(relativePath);
  }

  async listFiles(
    relativeDir: string,
    options?: { recursive?: boolean },
  ): Promise<string[]> {
    return assertWorkspaceAPI().listFiles(
      relativeDir,
      options?.recursive ?? false,
    );
  }

  async exists(relativePath: string): Promise<boolean> {
    return assertWorkspaceAPI().exists(relativePath);
  }
}

export function createDesktopWorkspaceAdapter(): DesktopWorkspaceAdapter {
  return new DesktopWorkspaceAdapter();
}

export function isDesktopWorkspaceAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.workspaceAPI);
}
