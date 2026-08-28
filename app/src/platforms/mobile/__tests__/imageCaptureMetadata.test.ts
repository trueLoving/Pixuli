import { describe, expect, it, vi } from 'vitest';
import {
  buildCaptureMetadataFromFile,
  mapCapacitorExif,
} from '../imageCaptureMetadata';

vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}));

describe('imageCaptureMetadata (pixuli)', () => {
  it('mapCapacitorExif maps GPS and camera fields', () => {
    const mapped = mapCapacitorExif({
      Make: 'Pixel',
      Model: '8',
      Orientation: 1,
      DateTimeOriginal: '2024:03:02 12:34:56',
      GPS: { latitude: 31.2, longitude: 121.5, altitude: 10 },
    });

    expect(mapped.exif?.make).toBe('Pixel');
    expect(mapped.location?.latitude).toBe(31.2);
    expect(mapped.takenAt).toBeTruthy();
  });

  it('buildCaptureMetadataFromFile falls back to file info when EXIF fails', async () => {
    const file = new File(['abc'], 'photo.jpg', {
      type: 'image/jpeg',
      lastModified: Date.parse('2025-02-01T08:00:00.000Z'),
    });

    const meta = await buildCaptureMetadataFromFile(file, {
      source: 'camera',
      localPath: '/cache/photo.jpg',
    });

    expect(meta.fileName).toBe('photo.jpg');
    expect(meta.localPath).toBe('/cache/photo.jpg');
    expect(meta.takenAt).toBe('2025-02-01T08:00:00.000Z');
    expect(meta.source).toBe('camera');
  });
});
