import type { ImageItem, LinkKind } from '@pixuli/core/types';
import type { LocalImageIndexEntry } from '@pixuli/core/vault';

const previewUrlCache = new Map<string, string>();

export function clearLocalPreviewCache(): void {
  for (const url of previewUrlCache.values()) {
    URL.revokeObjectURL(url);
  }
  previewUrlCache.clear();
}

export async function resolveLocalPreviewUrl(
  relativePath: string,
  mimeType: string,
): Promise<string> {
  const cached = previewUrlCache.get(relativePath);
  if (cached) {
    return cached;
  }
  if (!window.workspaceAPI) {
    throw new Error('workspaceAPI unavailable');
  }
  const bytes = await window.workspaceAPI.readFile(relativePath);
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
    size: entry.size,
    width: entry.width,
    height: entry.height,
    type: entry.mimeType,
    tags: entry.tags,
    description: entry.description,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export async function mapEntriesToImageItems(
  entries: LocalImageIndexEntry[],
  provider?: { getRawUrl: (path: string) => string } | null,
): Promise<ImageItem[]> {
  const items: ImageItem[] = [];
  for (const entry of entries) {
    const previewUrl = await resolveLocalPreviewUrl(
      entry.relativePath,
      entry.mimeType,
    );
    const publicUrl =
      entry.remotePath && provider
        ? provider.getRawUrl(entry.remotePath)
        : undefined;
    items.push(localEntryToImageItem(entry, previewUrl, publicUrl));
  }
  return items;
}
