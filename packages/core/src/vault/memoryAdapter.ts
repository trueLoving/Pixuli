import type { WorkspaceAdapter, WorkspaceAdapterKind } from './types';
import { randomUUID } from '../utils/randomUUID';

/**
 * 内存工作区适配器，供单测与 P1 契约验证；不依赖真实 FS。
 */
export class MemoryWorkspaceAdapter implements WorkspaceAdapter {
  readonly kind: WorkspaceAdapterKind;
  private root: string | null = null;
  private readonly files = new Map<string, Uint8Array>();

  constructor(kind: WorkspaceAdapterKind = 'web') {
    this.kind = kind;
  }

  isReady(): boolean {
    return this.root !== null;
  }

  getRootPath(): string | null {
    return this.root;
  }

  async pickRoot(): Promise<boolean> {
    this.root = `memory://${randomUUID()}`;
    return true;
  }

  async readFile(relativePath: string): Promise<Uint8Array> {
    const normalized = normalizeRelativePath(relativePath);
    const data = this.files.get(normalized);
    if (!data) {
      throw new Error(`File not found: ${normalized}`);
    }
    return data;
  }

  async writeFile(relativePath: string, data: Uint8Array): Promise<void> {
    this.files.set(normalizeRelativePath(relativePath), data);
  }

  async deleteFile(relativePath: string): Promise<void> {
    this.files.delete(normalizeRelativePath(relativePath));
  }

  async listFiles(
    relativeDir: string,
    options?: { recursive?: boolean },
  ): Promise<string[]> {
    const prefix = normalizeDirPrefix(relativeDir);
    const paths = new Set<string>();

    for (const key of this.files.keys()) {
      if (!key.startsWith(prefix)) {
        continue;
      }
      const rest = key.slice(prefix.length);
      if (!rest) {
        continue;
      }
      if (options?.recursive) {
        paths.add(key);
        continue;
      }
      const segment = rest.split('/').filter(Boolean)[0];
      if (segment) {
        paths.add(prefix ? `${prefix}${segment}` : segment);
      }
    }

    return [...paths].sort();
  }

  async exists(relativePath: string): Promise<boolean> {
    return this.files.has(normalizeRelativePath(relativePath));
  }

  /** 测试辅助：直接写入文件 */
  seedFile(relativePath: string, data: Uint8Array): void {
    this.files.set(normalizeRelativePath(relativePath), data);
  }

  /** 测试辅助：列出全部路径 */
  listAllPaths(): string[] {
    return [...this.files.keys()].sort();
  }
}

function normalizeRelativePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\\/g, '/');
}

function normalizeDirPrefix(dir: string): string {
  const normalized = normalizeRelativePath(dir);
  if (!normalized) {
    return '';
  }
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}
