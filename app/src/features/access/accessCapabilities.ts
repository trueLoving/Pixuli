import type { StoragePluginManifest } from '@pixuli/core/plugins';
import type { StoredSourceEntry } from '@pixuli/core/sources';

export type RemoteAccessTier = 'none' | 'share' | 'public' | 'timed';

export interface AccessCapabilityFlags {
  publicUrl: boolean;
  shareLink: boolean;
  timedAccess: boolean;
}

export interface AccessHint {
  titleKey: string;
  reasonKey: string;
  alternativeKey: string;
}

export function getAccessCapabilities(
  manifest: StoragePluginManifest | undefined,
): AccessCapabilityFlags {
  return {
    publicUrl: Boolean(manifest?.capabilities.publicUrl),
    shareLink: Boolean(manifest?.capabilities.shareLink),
    timedAccess: Boolean(manifest?.capabilities.timedAccess),
  };
}

export function isRemoteTierEnabled(
  tier: RemoteAccessTier,
  flags: AccessCapabilityFlags,
  hasConnection: boolean,
): boolean {
  if (tier === 'none') return true;
  if (!hasConnection) return false;
  if (tier === 'public') return flags.publicUrl;
  if (tier === 'share') return flags.shareLink;
  return flags.timedAccess;
}

export function resolveAccessHint(input: {
  hasConnection: boolean;
  flags: AccessCapabilityFlags;
}): AccessHint {
  if (!input.hasConnection) {
    return {
      titleKey: 'access.hintNeedConnectionTitle',
      reasonKey: 'access.hintNeedConnectionReason',
      alternativeKey: 'access.hintNeedConnectionAlt',
    };
  }
  if (!input.flags.publicUrl) {
    return {
      titleKey: 'access.hintPublicTitle',
      reasonKey: 'access.hintPublicReason',
      alternativeKey: 'access.hintPublicAlt',
    };
  }
  if (!input.flags.shareLink) {
    return {
      titleKey: 'access.hintShareTitle',
      reasonKey: 'access.hintShareReason',
      alternativeKey: 'access.hintShareAlt',
    };
  }
  if (!input.flags.timedAccess) {
    return {
      titleKey: 'access.hintTimedTitle',
      reasonKey: 'access.hintTimedReason',
      alternativeKey: 'access.hintTimedAlt',
    };
  }
  return {
    titleKey: 'access.hintReadyTitle',
    reasonKey: 'access.hintReadyReason',
    alternativeKey: 'access.hintReadyAlt',
  };
}

export function formatConnectionLocation(source: StoredSourceEntry): string {
  const owner = source.config.owner;
  const repo = source.config.repo;
  if (typeof owner === 'string' && typeof repo === 'string') {
    return `${owner}/${repo}`;
  }
  return source.label;
}

export function hasPublishableRemoteUrl(image: {
  publicUrl?: string;
  githubUrl?: string;
}): boolean {
  const url = image.publicUrl || image.githubUrl || '';
  return url.length > 0 && !url.startsWith('blob:');
}
