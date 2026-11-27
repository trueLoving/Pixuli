import { describe, expect, it } from 'vitest';
import {
  filterFilesAcceptedByRegisteredKinds,
  getAvailableIngestSources,
  getRegisteredKindIngestAccept,
  getRegisteredKindIngestTypesLabel,
  getRegisteredPreferredIngestSources,
} from '../kindIngestAccept';
import { resolveAvailableIngestSources } from '../platformIngestCapabilities';

describe('kindIngestAccept (app)', () => {
  it('merges builtin kind ingest accept', () => {
    const accept = getRegisteredKindIngestAccept();
    expect(accept).toBeDefined();
    expect(accept?.['image/*']).toEqual(
      expect.arrayContaining(['.jpg', '.png', '.webp']),
    );
    expect(accept?.['application/pdf']).toEqual(['.pdf']);
    expect(accept?.['video/*']).toEqual(
      expect.arrayContaining(['.mp4', '.webm']),
    );
  });

  it('formats type labels from kind accept', () => {
    const label = getRegisteredKindIngestTypesLabel();
    expect(label).toContain('JPG');
    expect(label).toContain('PDF');
    expect(label).toContain('MP4');
  });

  it('collects preferred sources including camera from image kind', () => {
    const sources = getRegisteredPreferredIngestSources();
    expect(sources).toEqual(
      expect.arrayContaining(['file', 'gallery', 'camera']),
    );
  });

  it('available sources are preferred ∩ platform (no camera on non-mobile)', () => {
    const available = getAvailableIngestSources();
    expect(available).toContain('file');
    // vitest / jsdom 非 Capacitor native → 不应露出 camera
    expect(available).not.toContain('camera');
    expect(available).not.toContain('gallery');
  });

  it('resolveAvailableIngestSources intersects', () => {
    expect(
      resolveAvailableIngestSources(['file', 'gallery', 'camera']),
    ).toEqual(['file']);
  });

  it('filters files by kind match', () => {
    const { accepted, rejected } = filterFilesAcceptedByRegisteredKinds([
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['x'], 'notes.bin', { type: 'application/octet-stream' }),
      new File(['x'], 'doc.pdf', { type: 'application/pdf' }),
    ]);
    expect(accepted.map(file => file.name).sort()).toEqual([
      'a.jpg',
      'doc.pdf',
    ]);
    expect(rejected.map(file => file.name)).toEqual(['notes.bin']);
  });
});
