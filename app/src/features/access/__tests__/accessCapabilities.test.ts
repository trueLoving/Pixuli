import { describe, expect, it } from 'vitest';
import type { StoragePluginManifest } from '@pixuli/core/plugins';
import {
  getAccessCapabilities,
  hasPublishableRemoteUrl,
  isRemoteTierEnabled,
  resolveAccessHint,
} from '../accessCapabilities';

const giteeLike: StoragePluginManifest = {
  id: 'gitee',
  name: 'Gitee',
  version: '1.0.0',
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: true,
    sync: true,
    publicUrl: true,
  },
};

const noPublic: StoragePluginManifest = {
  id: 'drive',
  name: 'Drive',
  version: '1.0.0',
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: true,
    sync: true,
  },
};

describe('getAccessCapabilities', () => {
  it('reads flags from manifest without using pluginId', () => {
    expect(getAccessCapabilities(giteeLike)).toEqual({
      publicUrl: true,
      shareLink: false,
      timedAccess: false,
    });
  });
});

describe('isRemoteTierEnabled', () => {
  it('keeps none enabled even without a connection', () => {
    expect(
      isRemoteTierEnabled('none', getAccessCapabilities(giteeLike), false),
    ).toBe(true);
  });

  it('disables public when disconnected or capability missing', () => {
    const flags = getAccessCapabilities(giteeLike);
    expect(isRemoteTierEnabled('public', flags, false)).toBe(false);
    expect(
      isRemoteTierEnabled('public', getAccessCapabilities(noPublic), true),
    ).toBe(false);
    expect(isRemoteTierEnabled('public', flags, true)).toBe(true);
  });

  it('disables share and timed when capabilities are absent', () => {
    const flags = getAccessCapabilities(giteeLike);
    expect(isRemoteTierEnabled('share', flags, true)).toBe(false);
    expect(isRemoteTierEnabled('timed', flags, true)).toBe(false);
  });
});

describe('resolveAccessHint', () => {
  it('explains missing connection first', () => {
    expect(
      resolveAccessHint({
        hasConnection: false,
        flags: getAccessCapabilities(giteeLike),
      }).titleKey,
    ).toBe('access.hintNeedConnectionTitle');
  });

  it('explains missing publicUrl before shareLink', () => {
    expect(
      resolveAccessHint({
        hasConnection: true,
        flags: getAccessCapabilities(noPublic),
      }).titleKey,
    ).toBe('access.hintPublicTitle');
  });
});

describe('hasPublishableRemoteUrl', () => {
  it('rejects empty and blob preview urls', () => {
    expect(hasPublishableRemoteUrl({ publicUrl: 'blob:abc' })).toBe(false);
    expect(hasPublishableRemoteUrl({})).toBe(false);
    expect(
      hasPublishableRemoteUrl({
        publicUrl: 'https://gitee.com/raw/a.png',
      }),
    ).toBe(true);
  });
});
