/** 与 docs/02-system-design/02-performance.md 阈值对齐（REF-603） */

/** 超过该数量：提示已启用虚拟列表与缩略限流 */
export const LIBRARY_SCALE_LARGE = 500;

/** 超过该数量：建议缩小文件夹范围 */
export const LIBRARY_SCALE_HUGE = 5000;

export type LibraryScaleLevel = 'normal' | 'large' | 'huge';

export function getLibraryScaleLevel(count: number): LibraryScaleLevel {
  if (count > LIBRARY_SCALE_HUGE) {
    return 'huge';
  }
  if (count > LIBRARY_SCALE_LARGE) {
    return 'large';
  }
  return 'normal';
}

/** 状态栏 / 横幅用 i18n key；normal 时不展示 */
export function getLibraryScaleTipKey(count: number): string | null {
  const level = getLibraryScaleLevel(count);
  if (level === 'huge') {
    return 'image.library.scaleTipHuge';
  }
  if (level === 'large') {
    return 'image.library.scaleTipLarge';
  }
  return null;
}
