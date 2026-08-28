import type { ImageItem } from '@pixuli/core/types';

/** access 域内发布记录（library/inspector 只读） */
export type PublishedAccessInfo = {
  sourceId: string;
  tier: 'public';
};

export interface PublishReadPort {
  isAssetPublished(imageId: string, sourceId: string): boolean;
  getPublishedAccess(imageId: string): PublishedAccessInfo | null;
  hasPublishableRemoteUrl(image: {
    publicUrl?: string;
    githubUrl?: string;
    linkKind?: string;
  }): boolean;
}

/** 远端公网链接优先（同步后 publicUrl / githubUrl） */
export function resolveRemoteCopyUrl(image: ImageItem): string {
  return image.publicUrl || image.githubUrl || image.url;
}

function defaultHasPublishableRemoteUrl(image: {
  publicUrl?: string;
  githubUrl?: string;
}): boolean {
  const url = image.publicUrl || image.githubUrl || '';
  return url.length > 0 && !url.startsWith('blob:');
}

const inactivePort: PublishReadPort = {
  isAssetPublished: () => false,
  getPublishedAccess: () => null,
  hasPublishableRemoteUrl: defaultHasPublishableRemoteUrl,
};

let publishPort: PublishReadPort | null = null;

export function registerPublishReadPort(port: PublishReadPort): void {
  publishPort = port;
}

function getPort(): PublishReadPort {
  return publishPort ?? inactivePort;
}

export function isAssetPublished(imageId: string, sourceId: string): boolean {
  return getPort().isAssetPublished(imageId, sourceId);
}

export function getPublishedAccess(
  imageId: string,
): PublishedAccessInfo | null {
  return getPort().getPublishedAccess(imageId);
}

export function hasPublishableRemoteUrl(image: {
  publicUrl?: string;
  githubUrl?: string;
  linkKind?: string;
}): boolean {
  return getPort().hasPublishableRemoteUrl(image);
}
