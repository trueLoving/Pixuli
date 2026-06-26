import { describe, expect, it } from 'vitest';
import {
  buildImageCaptureMetadata,
  buildProviderSidecarPayload,
} from '../imageCaptureMetadata';

describe('imageCaptureMetadata', () => {
  it('buildImageCaptureMetadata prefers takenAt over file mtime', () => {
    const meta = buildImageCaptureMetadata({
      source: 'camera',
      fileName: 'photo.jpg',
      takenAt: '2024-01-02T03:04:05.000Z',
      fileLastModified: Date.parse('2025-01-01T00:00:00.000Z'),
      exif: { make: 'Test', model: 'Cam' },
      location: { latitude: 31.2, longitude: 121.5 },
    });

    expect(meta.takenAt).toBe('2024-01-02T03:04:05.000Z');
    expect(meta.exif?.make).toBe('Test');
    expect(meta.location?.latitude).toBe(31.2);
  });

  it('buildProviderSidecarPayload includes capture when present', () => {
    const capture = buildImageCaptureMetadata({
      source: 'gallery',
      fileName: 'a.jpg',
    });
    const payload = buildProviderSidecarPayload({
      id: '1',
      name: 'a.jpg',
      url: 'https://example.com/a.jpg',
      githubUrl: 'https://example.com/a.jpg',
      size: 100,
      width: 10,
      height: 10,
      type: 'image/jpeg',
      tags: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      captureMetadata: capture,
    });

    expect(payload.capture).toEqual(capture);
  });
});
