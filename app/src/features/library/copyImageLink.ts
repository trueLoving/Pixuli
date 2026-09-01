import type { ImageItem } from '@pixuli/core/types';
import { copyTextToClipboard } from '@/utils/clipboard';
import { collectCopyablePublicUrls, getCopyablePublicUrl } from './copyLink';

export type CopyImageLinkResult =
  | { ok: true; count: number }
  | { ok: false; reasonKey: string };

export function resolveCopyLinkFailure(
  images: ImageItem[],
): CopyImageLinkResult {
  if (images.length === 0) {
    return { ok: false, reasonKey: 'image.copyLink.needSelect' };
  }
  const urls = collectCopyablePublicUrls(images);
  if (urls.length > 0) {
    return { ok: true, count: urls.length };
  }
  const hasLocalOnly = images.some(
    item => item.localPath && !getCopyablePublicUrl(item),
  );
  if (hasLocalOnly) {
    return { ok: false, reasonKey: 'image.copyLink.needSync' };
  }
  return { ok: false, reasonKey: 'image.copyLink.unavailable' };
}

export async function copyImagePublicLinks(
  images: ImageItem[],
): Promise<CopyImageLinkResult> {
  const check = resolveCopyLinkFailure(images);
  if (!check.ok) {
    return check;
  }
  const urls = collectCopyablePublicUrls(images);
  await copyTextToClipboard(urls.join('\n'));
  return { ok: true, count: urls.length };
}
