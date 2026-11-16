import type { AssetItem } from '@pixuli/core/types';
import { copyTextToClipboard } from '@/utils/clipboard';
import { collectCopyablePublicUrls, getCopyablePublicUrl } from './copyLink';

export type CopyAssetLinkOptions = {
  hasRemoteConnection?: boolean;
  /** 当前选中连接的仓库是否私有 */
  repoPrivate?: boolean;
};

export type CopyAssetLinkResult =
  | { ok: true; count: number; privateRepo?: boolean }
  | {
      ok: false;
      reasonKey: string;
      /** 仅本地且已有连接时可引导跳转同步 */
      offerSync?: boolean;
      /** 无远端连接时可引导去添加连接 */
      offerConnection?: boolean;
    };

export function resolveCopyLinkFailure(
  assets: AssetItem[],
  options?: CopyAssetLinkOptions,
): CopyAssetLinkResult {
  if (assets.length === 0) {
    return { ok: false, reasonKey: 'image.copyLink.needSelect' };
  }
  const urls = collectCopyablePublicUrls(assets);
  if (urls.length > 0) {
    return {
      ok: true,
      count: urls.length,
      ...(options?.repoPrivate ? { privateRepo: true } : {}),
    };
  }
  if (options?.hasRemoteConnection === false) {
    return {
      ok: false,
      reasonKey: 'image.copyLink.needConnection',
      offerConnection: true,
    };
  }
  const hasLocalOnly = assets.some(
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

export async function copyAssetPublicLinks(
  assets: AssetItem[],
  options?: CopyAssetLinkOptions,
): Promise<CopyAssetLinkResult> {
  const check = resolveCopyLinkFailure(assets, options);
  if (!check.ok) {
    return check;
  }
  const urls = collectCopyablePublicUrls(assets);
  await copyTextToClipboard(urls.join('\n'));
  return {
    ok: true,
    count: urls.length,
    ...(check.privateRepo ? { privateRepo: true } : {}),
  };
}
