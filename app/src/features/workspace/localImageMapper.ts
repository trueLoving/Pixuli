import type { ImageItem, LinkKind } from '@pixuli/core/types';
import type { LocalImageIndexEntry } from '@pixuli/core/vault';
import {
  getWorkspaceAdapter,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';

const previewUrlCache = new Map<string, string>();

export function clearLocalPreviewCache(): void {
  for (const url of previewUrlCache.values()) {
    URL.revokeObjectURL(url);
  }
  previewUrlCache.clear();
}

/** 仅保留 keepPaths 中的预览，释放其余 blob URL（文件夹切换时用） */
export function pruneLocalPreviewCache(keepPaths: Iterable<string>): void {
  const keep = new Set(keepPaths);
  for (const [path, url] of previewUrlCache) {
    if (keep.has(path)) continue;
    URL.revokeObjectURL(url);
    previewUrlCache.delete(path);
  }
}

export async function resolveLocalPreviewUrl(
  relativePath: string,
  mimeType: string,
): Promise<string> {
  const cached = previewUrlCache.get(relativePath);
  if (cached) {
    return cached;
  }
  if (!isWorkspaceAvailable()) {
    throw new Error('workspace unavailable');
  }
  const bytes = await getWorkspaceAdapter().readFile(relativePath);
  const blob = new Blob([Uint8Array.from(bytes)], {
    type: mimeType || 'image/jpeg',
  });
  const url = URL.createObjectURL(blob);
  previewUrlCache.set(relativePath, url);
  return url;
}

export function localEntryToImageItem(
  entry: LocalImageIndexEntry,
  previewUrl: string,
  publicUrl?: string,
): ImageItem {
  const linkKind: LinkKind | undefined = publicUrl ? 'remote-raw' : 'local';
  return {
    id: entry.id,
    name: entry.name,
    url: previewUrl,
    githubUrl: publicUrl ?? '',
    publicUrl,
    localPath: entry.relativePath,
    linkKind,
    syncState: entry.syncState,
    size: entry.size,
    width: entry.width,
    height: entry.height,
    type: entry.mimeType,
    tags: entry.tags,
    description: entry.description,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    captureMetadata: entry.captureMetadata,
  };
}

export type MapEntriesOptions = {
  /**
   * true：不立刻读盘建 blob（默认）。缩略/预览在可见时再 resolveLocalPreviewUrl。
   * false：兼容旧行为，立即为每条创建预览 URL。
   */
  deferPreview?: boolean;
};

export async function mapEntriesToImageItems(
  entries: LocalImageIndexEntry[],
  provider?: { getRawUrl: (path: string) => string } | null,
  options?: MapEntriesOptions,
): Promise<ImageItem[]> {
  const deferPreview = options?.deferPreview !== false;
  const items: ImageItem[] = [];
  for (const entry of entries) {
    const previewUrl = deferPreview
      ? ''
      : await resolveLocalPreviewUrl(entry.relativePath, entry.mimeType);
    const publicUrl =
      entry.remotePath && provider
        ? provider.getRawUrl(entry.remotePath)
        : undefined;
    items.push(localEntryToImageItem(entry, previewUrl, publicUrl));
  }
  return items;
}
