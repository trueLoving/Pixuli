import type { AssetItem, AssetSyncState } from '@pixuli/core/types';

/** 远端公网链接优先（同步后 publicUrl / githubUrl） */
export function resolveRemoteCopyUrl(asset: AssetItem): string {
  return asset.publicUrl || asset.githubUrl || asset.url;
}

export function hasPublishableRemoteUrl(asset: {
  publicUrl?: string;
  githubUrl?: string;
  linkKind?: string;
  localPath?: string;
}): boolean {
  const url = asset.publicUrl || asset.githubUrl || '';
  return url.length > 0 && !url.startsWith('blob:');
}

export function getCopyablePublicUrl(asset: AssetItem): string | null {
  if (!isAssetSynced(asset)) {
    return null;
  }
  if (!hasPublishableRemoteUrl(asset)) {
    return null;
  }
  const url = resolveRemoteCopyUrl(asset);
  if (!url || url.startsWith('blob:')) {
    return null;
  }
  return url;
}

export function isAssetSynced(asset: {
  linkKind?: string;
  publicUrl?: string;
  githubUrl?: string;
  syncState?: AssetSyncState;
}): boolean {
  if (asset.syncState) {
    return asset.syncState === 'synced';
  }
  return asset.linkKind === 'remote-raw' || hasPublishableRemoteUrl(asset);
}

export function collectCopyablePublicUrls(assets: AssetItem[]): string[] {
  const urls: string[] = [];
  for (const asset of assets) {
    const url = getCopyablePublicUrl(asset);
    if (url) {
      urls.push(url);
    }
  }
  return urls;
}
