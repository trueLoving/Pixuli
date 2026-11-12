import type { AssetKind, AssetItem } from '@pixuli/core/types';

export type AssetKindFilter = 'all' | AssetKind;

export type { AssetKind };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return name.slice(dot + 1).toLowerCase();
}

export function getAssetKind(
  item: Pick<AssetItem, 'name' | 'type'>,
): AssetKind {
  const mime = (item.type || '').toLowerCase();
  const ext = extensionOf(item.name || '');

  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (
    mime === 'text/markdown' ||
    mime === 'text/x-markdown' ||
    ext === 'md' ||
    ext === 'markdown'
  ) {
    return 'markdown';
  }
  if (mime === 'text/plain' || ext === 'txt') {
    return 'text';
  }
  if (
    mime.startsWith('video/') ||
    ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)
  ) {
    return 'video';
  }
  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
  ) {
    return 'image';
  }
  return 'other';
}

export function filterAssetsByKind<T extends Pick<AssetItem, 'name' | 'type'>>(
  items: T[],
  kind: AssetKindFilter,
): T[] {
  if (kind === 'all') return items;
  return items.filter(item => getAssetKind(item) === kind);
}

export function filterAssetsByKinds<T extends Pick<AssetItem, 'name' | 'type'>>(
  items: T[],
  kinds: AssetKind[],
): T[] {
  if (kinds.length === 0) return items;
  const allowed = new Set(kinds);
  return items.filter(item => allowed.has(getAssetKind(item)));
}
