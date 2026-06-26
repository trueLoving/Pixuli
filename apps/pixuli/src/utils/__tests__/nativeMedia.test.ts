import { afterEach, describe, expect, it, vi } from 'vitest';

const getPhoto = vi.fn();
const pickImages = vi.fn();
const share = vi.fn();
const writeFile = vi.fn();
const getUri = vi.fn();

vi.mock('../platform', () => ({
  isNativeMobile: vi.fn(() => false),
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto, pickImages },
  CameraResultType: { Uri: 'uri' },
  CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS' },
}));

vi.mock('@capacitor/share', () => ({
  Share: { share },
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile, getUri },
  Directory: { Cache: 'CACHE' },
}));

import { isNativeMobile } from '../platform';
import {
  pickImageFromCamera,
  pickImagesFromGallery,
  shareImageFile,
} from '../nativeMedia';

describe('nativeMedia', () => {
  afterEach(() => {
    vi.mocked(isNativeMobile).mockReturnValue(false);
    vi.clearAllMocks();
  });

  it('returns empty arrays on non-native platforms', async () => {
    expect(await pickImageFromCamera()).toEqual([]);
    expect(await pickImagesFromGallery()).toEqual([]);
    expect(getPhoto).not.toHaveBeenCalled();
  });

  it('picks a single image from camera on native', async () => {
    vi.mocked(isNativeMobile).mockReturnValue(true);
    getPhoto.mockResolvedValue({
      webPath: 'capacitor://localhost/photo.jpg',
      path: '/cache/photo.jpg',
      format: 'jpeg',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['x'], { type: 'image/jpeg' })),
      }),
    );

    const picks = await pickImageFromCamera();

    expect(getPhoto).toHaveBeenCalled();
    expect(picks).toHaveLength(1);
    expect(picks[0].file.name).toBe('photo.jpg');
    expect(picks[0].captureMetadata.source).toBe('camera');
    expect(picks[0].captureMetadata.localPath).toBe('/cache/photo.jpg');
  });

  it('shares via navigator.share on web when available', async () => {
    const navShare = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share: navShare });

    await shareImageFile('test.png', 'https://example.com/a.png');

    expect(navShare).toHaveBeenCalledWith({
      title: 'test.png',
      url: 'https://example.com/a.png',
    });
  });

  it('writes cache file and opens native share sheet', async () => {
    vi.mocked(isNativeMobile).mockReturnValue(true);
    writeFile.mockResolvedValue(undefined);
    getUri.mockResolvedValue({ uri: 'content://cache/x' });
    share.mockResolvedValue(undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['img'], { type: 'image/png' })),
      }),
    );

    await shareImageFile('pic.png', 'https://example.com/pic.png');

    expect(writeFile).toHaveBeenCalled();
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'pic.png',
        files: ['content://cache/x'],
      }),
    );
  });
});
