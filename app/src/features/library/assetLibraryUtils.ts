import type { ImageItem, SortOrder } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';

export const ASSET_LIBRARY_LONG_PRESS_MS = 480;

export function kindLabel(item: ImageItem, t: (key: string) => string): string {
  const kind = getAssetKind(item);
  if (kind === 'video') return t('image.kind.video');
  if (kind === 'pdf') return t('image.kind.pdf');
  if (kind === 'other') return t('image.kind.other');
  return t('image.kind.image');
}

export function sortIndicator(active: boolean, order: SortOrder): string {
  if (!active) return '';
  return order === 'asc' ? ' ↑' : ' ↓';
}
