import type { ImageItem } from '@pixuli/core/types';

export type AssetKindFilter = 'all' | 'image' | 'video' | 'pdf';

export type AssetKind = Exclude<AssetKindFilter, 'all'>;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return name.slice(dot + 1).toLowerCase();
}

export function getAssetKind(
  item: Pick<ImageItem, 'name' | 'type'>,
): AssetKind {
  const mime = (item.type || '').toLowerCase();
  const ext = extensionOf(item.name || '');

  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (
    mime.startsWith('video/') ||
    ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)
  ) {
    return 'video';
  }
  return 'image';
}

export function filterAssetsByKind<T extends Pick<ImageItem, 'name' | 'type'>>(
  items: T[],
  kind: AssetKindFilter,
): T[] {
  if (kind === 'all') return items;
  return items.filter(item => getAssetKind(item) === kind);
}
