import type { WorkspaceAdapter } from '@pixuli/core/vault';
import { isNativeMobile } from '@/utils/platform';
import {
  formatFsaRootPath,
  fsaDeleteFile,
  fsaEnsureWorkspace,
  fsaExists,
  fsaListFiles,
  fsaReadFile,
  fsaWriteFile,
  isFileSystemAccessSupported,
  loadFsaDirectoryHandle,
  parseFsaRootPath,
  pickFsaDirectory,
  storeFsaDirectoryHandle,
  ensureFsaPermission,
} from './fsaWorkspaceFs';
import {
  formatOpfsRootPath,
  isOpfsSupported,
  opfsDeleteFile,
  opfsEnsureWorkspace,
  opfsExists,
  opfsListFiles,
  opfsReadFile,
  opfsWriteFile,
  parseOpfsRootPath,
} from './opfsWorkspaceFs';

type WebWorkspaceBackend = 'opfs' | 'fsa';

export class WebWorkspaceAdapter implements WorkspaceAdapter {
  readonly kind = 'web' as const;
  private backend: WebWorkspaceBackend | null = null;
  private rootPath: string | null = null;
  private workspaceId: string | null = null;
  private fsaHandle: FileSystemDirectoryHandle | null = null;
  private folderLabel: string | null = null;

  isReady(): boolean {
    return Boolean(this.workspaceId && this.backend);
  }

  getRootPath(): string | null {
    return this.rootPath;
  }

  getFolderLabel(): string | null {
    return this.folderLabel;
  }

  setRootPath(rootPath: string | null): void {
    this.rootPath = rootPath;
    this.fsaHandle = null;
    this.folderLabel = null;

    if (!rootPath) {
      this.workspaceId = null;
      this.backend = null;
      return;
    }

    const opfsId = parseOpfsRootPath(rootPath);
    if (opfsId) {
      this.backend = 'opfs';
      this.workspaceId = opfsId;
      return;
    }

    const fsaId = parseFsaRootPath(rootPath);
    if (fsaId) {
      this.backend = 'fsa';
      this.workspaceId = fsaId;
      return;
    }

    this.workspaceId = null;
    this.backend = null;
  }

  private requireWorkspaceId(): string {
    if (!this.workspaceId) {
      throw new Error('Web workspace is not initialized');
    }
    return this.workspaceId;
  }

  private async requireFsaHandle(): Promise<FileSystemDirectoryHandle> {
    if (this.fsaHandle) {
      return this.fsaHandle;
    }
    const id = this.requireWorkspaceId();
    const handle = await loadFsaDirectoryHandle(id);
    if (!handle) {
      throw new Error(
        'Connected folder handle not found; pick the folder again',
      );
    }
    const granted = await ensureFsaPermission(handle);
    if (!granted) {
      throw new Error('Folder permission denied');
    }
    this.fsaHandle = handle;
    this.folderLabel = handle.name;
    return handle;
  }

  /** OPFS 虚拟工作区 */
  async pickRoot(): Promise<boolean> {
    if (!isOpfsSupported()) {
      return false;
    }
    const id = crypto.randomUUID();
    await opfsEnsureWorkspace(id);
    this.backend = 'opfs';
    this.workspaceId = id;
    this.rootPath = formatOpfsRootPath(id);
    this.fsaHandle = null;
    this.folderLabel = null;
    return true;
  }

  /** File System Access API：连接本机真实文件夹 */
  async pickFsaRoot(): Promise<boolean> {
    const handle = await pickFsaDirectory();
    if (!handle) {
      return false;
    }
    const id = crypto.randomUUID();
    await storeFsaDirectoryHandle(id, handle);
    await fsaEnsureWorkspace(handle);
    this.backend = 'fsa';
    this.workspaceId = id;
    this.fsaHandle = handle;
    this.folderLabel = handle.name;
    this.rootPath = formatFsaRootPath(id);
    return true;
  }

  async readFile(relativePath: string): Promise<Uint8Array> {
    if (this.backend === 'fsa') {
      return fsaReadFile(await this.requireFsaHandle(), relativePath);
    }
    return opfsReadFile(this.requireWorkspaceId(), relativePath);
  }

  async writeFile(relativePath: string, data: Uint8Array): Promise<void> {
    if (this.backend === 'fsa') {
      await fsaWriteFile(await this.requireFsaHandle(), relativePath, data);
      return;
    }
    await opfsWriteFile(this.requireWorkspaceId(), relativePath, data);
  }

  async deleteFile(relativePath: string): Promise<void> {
    if (this.backend === 'fsa') {
      await fsaDeleteFile(await this.requireFsaHandle(), relativePath);
      return;
    }
    await opfsDeleteFile(this.requireWorkspaceId(), relativePath);
  }

  async listFiles(
    relativeDir: string,
    options?: { recursive?: boolean },
  ): Promise<string[]> {
    const recursive = options?.recursive ?? false;
    if (this.backend === 'fsa') {
      return fsaListFiles(
        await this.requireFsaHandle(),
        relativeDir,
        recursive,
      );
    }
    return opfsListFiles(this.requireWorkspaceId(), relativeDir, recursive);
  }

  async exists(relativePath: string): Promise<boolean> {
    if (this.backend === 'fsa') {
      return fsaExists(await this.requireFsaHandle(), relativePath);
    }
    return opfsExists(this.requireWorkspaceId(), relativePath);
  }
}

export function createWebWorkspaceAdapter(): WebWorkspaceAdapter {
  return new WebWorkspaceAdapter();
}

export function isWebWorkspaceAdapter(
  adapter: WorkspaceAdapter,
): adapter is WebWorkspaceAdapter {
  return adapter.kind === 'web';
}

export function isWebWorkspaceAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  if (typeof __IS_WEB__ !== 'undefined' && !__IS_WEB__) {
    return false;
  }
  if (typeof window.workspaceAPI !== 'undefined' && window.workspaceAPI) {
    return false;
  }
  if (isNativeMobile()) {
    return false;
  }
  return isOpfsSupported() || isFileSystemAccessSupported();
}

export { isFileSystemAccessSupported, isOpfsSupported };
