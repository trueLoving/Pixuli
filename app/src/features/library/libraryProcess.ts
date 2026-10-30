import { getAssetKind } from '@/features/library/utils/assetKind';
import type { ImageItem } from '@pixuli/core/types';

/** 处理弹窗里的一种操作。文件类型决定有哪些操作。 */
export type LibraryProcessMode = 'crop' | 'convert';

const MODE_ORDER: LibraryProcessMode[] = ['crop', 'convert'];

export function libraryProcessModes(
  kind: ReturnType<typeof getAssetKind>,
): readonly LibraryProcessMode[] {
  if (kind === 'image') return MODE_ORDER;
  return [];
}

export function libraryProcessModesForItems(
  items: ImageItem[],
): LibraryProcessMode[] {
  return MODE_ORDER.filter(mode =>
    items.some(item => libraryProcessModes(getAssetKind(item)).includes(mode)),
  );
}
