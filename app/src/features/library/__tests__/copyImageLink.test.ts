import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ImageItem } from '@pixuli/core/types';
import { copyImagePublicLinks, resolveCopyLinkFailure } from '../copyImageLink';

vi.mock('@/utils/clipboard', () => ({
  copyTextToClipboard: vi.fn(async () => undefined),
}));

function makeImage(
  partial: Partial<ImageItem> & Pick<ImageItem, 'id'>,
): ImageItem {
  return {
    id: partial.id,
    name: partial.name ?? 'a.png',
    url: partial.url ?? 'blob:local',
    size: partial.size ?? 1,
    width: partial.width ?? 1,
    height: partial.height ?? 1,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
    ...partial,
  };
}

describe('resolveCopyLinkFailure / copyImagePublicLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('needSelect when empty', () => {
    expect(resolveCopyLinkFailure([])).toEqual({
      ok: false,
      reasonKey: 'image.copyLink.needSelect',
    });
  });

  it('needConnection when no remote and not copyable', () => {
    const local = makeImage({
      id: '1',
      localPath: 'a.png',
      syncState: 'local-only',
    });
    expect(
      resolveCopyLinkFailure([local], { hasRemoteConnection: false }),
    ).toEqual({
      ok: false,
      reasonKey: 'image.copyLink.needConnection',
    });
  });

  it('needSync with offerSync when connected but local-only', () => {
    const local = makeImage({
      id: '1',
      localPath: 'a.png',
      syncState: 'local-only',
    });
    expect(
      resolveCopyLinkFailure([local], { hasRemoteConnection: true }),
    ).toEqual({
      ok: false,
      reasonKey: 'image.copyLink.needSync',
      offerSync: true,
    });
  });

  it('success marks privateRepo when repo is private', async () => {
    const synced = makeImage({
      id: '1',
      syncState: 'synced',
      publicUrl: 'https://raw.githubusercontent.com/o/r/main/a.png',
      linkKind: 'remote-raw',
    });
    const result = await copyImagePublicLinks([synced], {
      hasRemoteConnection: true,
      repoPrivate: true,
    });
    expect(result).toEqual({
      ok: true,
      count: 1,
      privateRepo: true,
    });
  });

  it('success without private note for public repo', async () => {
    const synced = makeImage({
      id: '1',
      syncState: 'synced',
      publicUrl: 'https://raw.githubusercontent.com/o/r/main/a.png',
    });
    const result = await copyImagePublicLinks([synced], {
      hasRemoteConnection: true,
      repoPrivate: false,
    });
    expect(result).toEqual({ ok: true, count: 1 });
  });
});
