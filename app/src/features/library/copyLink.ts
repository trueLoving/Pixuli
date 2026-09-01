import type { ImageItem } from '@pixuli/core/types';

/** 远端公网链接优先（同步后 publicUrl / githubUrl） */
export function resolveRemoteCopyUrl(image: ImageItem): string {
  return image.publicUrl || image.githubUrl || image.url;
}

export function hasPublishableRemoteUrl(image: {
  publicUrl?: string;
  githubUrl?: string;
  linkKind?: string;
  localPath?: string;
}): boolean {
  const url = image.publicUrl || image.githubUrl || '';
  return url.length > 0 && !url.startsWith('blob:');
}

export function getCopyablePublicUrl(image: ImageItem): string | null {
  if (!hasPublishableRemoteUrl(image)) {
    return null;
  }
  const url = resolveRemoteCopyUrl(image);
  if (!url || url.startsWith('blob:')) {
    return null;
  }
  return url;
}

export function isAssetSynced(image: {
  linkKind?: string;
  publicUrl?: string;
  githubUrl?: string;
}): boolean {
  return image.linkKind === 'remote-raw' || hasPublishableRemoteUrl(image);
}

export function collectCopyablePublicUrls(images: ImageItem[]): string[] {
  const urls: string[] = [];
  for (const image of images) {
    const url = getCopyablePublicUrl(image);
    if (url) {
      urls.push(url);
    }
  }
  return urls;
}
