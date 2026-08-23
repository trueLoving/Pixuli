import { afterEach, describe, expect, it } from 'vitest';
import {
  clearAssetThumbnailCache,
  resolveAssetThumbnail,
} from '../assetThumbnail';

describe('resolveAssetThumbnail', () => {
  afterEach(() => {
    clearAssetThumbnailCache();
  });

  it('returns image url directly for image assets', async () => {
    await expect(
      resolveAssetThumbnail({
        id: '1',
        url: 'https://example.com/a.jpg',
        name: 'a.jpg',
        type: 'image/jpeg',
      }),
    ).resolves.toBe('https://example.com/a.jpg');
  });

  it('returns null for other file kinds', async () => {
    await expect(
      resolveAssetThumbnail({
        id: '2',
        url: 'https://example.com/a.txt',
        name: 'a.txt',
        type: 'text/plain',
      }),
    ).resolves.toBeNull();
  });

  it('returns null when video url is empty', async () => {
    await expect(
      resolveAssetThumbnail({
        id: 'v1',
        url: '',
        name: 'clip.mp4',
        type: 'video/mp4',
      }),
    ).resolves.toBeNull();
  });
});
