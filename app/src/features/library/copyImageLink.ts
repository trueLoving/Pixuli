import type { ImageItem } from '@pixuli/core/types';
import { copyTextToClipboard } from '@/utils/clipboard';
import { collectCopyablePublicUrls, getCopyablePublicUrl } from './copyLink';

export type CopyImageLinkOptions = {
  hasRemoteConnection?: boolean;
  /** 当前选中连接的仓库是否私有 */
  repoPrivate?: boolean;
};

export type CopyImageLinkResult =
  | { ok: true; count: number; privateRepo?: boolean }
  | {
      ok: false;
      reasonKey: string;
      /** 仅本地且已有连接时可引导跳转同步 */
      offerSync?: boolean;
    };

export function resolveCopyLinkFailure(
  images: ImageItem[],
  options?: CopyImageLinkOptions,
): CopyImageLinkResult {
  if (images.length === 0) {
    return { ok: false, reasonKey: 'image.copyLink.needSelect' };
  }
  const urls = collectCopyablePublicUrls(images);
  if (urls.length > 0) {
    return {
      ok: true,
      count: urls.length,
      ...(options?.repoPrivate ? { privateRepo: true } : {}),
    };
  }
  if (options?.hasRemoteConnection === false) {
    return { ok: false, reasonKey: 'image.copyLink.needConnection' };
  }
  const hasLocalOnly = images.some(
    item => item.localPath && !getCopyablePublicUrl(item),
  );
  if (hasLocalOnly) {
    return {
      ok: false,
      reasonKey: 'image.copyLink.needSync',
      offerSync: options?.hasRemoteConnection === true,
    };
  }
  return { ok: false, reasonKey: 'image.copyLink.unavailable' };
}

export async function copyImagePublicLinks(
  images: ImageItem[],
  options?: CopyImageLinkOptions,
): Promise<CopyImageLinkResult> {
  const check = resolveCopyLinkFailure(images, options);
  if (!check.ok) {
    return check;
  }
  const urls = collectCopyablePublicUrls(images);
  await copyTextToClipboard(urls.join('\n'));
  return {
    ok: true,
    count: urls.length,
    ...(check.privateRepo ? { privateRepo: true } : {}),
  };
}
