import type { AssetItem, SortOrder } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';

export function kindLabel(item: AssetItem, t: (key: string) => string): string {
  const kind = getAssetKind(item);
  if (kind === 'video') return t('image.kind.video');
  if (kind === 'pdf') return t('image.kind.pdf');
  if (kind === 'markdown') return t('image.kind.markdown');
  if (kind === 'text') return t('image.kind.text');
  if (kind === 'other') return t('image.kind.other');
  return t('image.kind.image');
}

export function sortIndicator(active: boolean, order: SortOrder): string {
  if (!active) return '';
  return order === 'asc' ? ' ↑' : ' ↓';
}
