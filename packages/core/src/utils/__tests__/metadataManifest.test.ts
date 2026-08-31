import { describe, expect, it } from 'vitest';
import {
  createEmptyManifest,
  getDirManifestRelativePath,
  getManifestEntry,
  parseMetadataManifest,
  upsertManifestEntry,
} from '../metadataManifest';

describe('metadataManifest', () => {
  it('resolves manifest path per directory', () => {
    expect(getDirManifestRelativePath('')).toBe('.metadata/manifest.json');
    expect(getDirManifestRelativePath('images')).toBe(
      'images/.metadata/manifest.json',
    );
    expect(getDirManifestRelativePath('images/trip')).toBe(
      'images/trip/.metadata/manifest.json',
    );
  });

  it('upserts file entries in manifest', () => {
    const manifest = createEmptyManifest();
    const next = upsertManifestEntry(manifest, '1.png', {
      name: '1.png',
      tags: ['a'],
      updatedAt: '2026-08-31T00:00:00.000Z',
    });
    expect(getManifestEntry(next, '1.png')?.tags).toEqual(['a']);
  });

  it('parses manifest json', () => {
    const parsed = parseMetadataManifest({
      version: 1,
      files: {
        'a.jpg': { name: 'a.jpg', tags: [], updatedAt: '2026-08-31' },
      },
    });
    expect(parsed?.files['a.jpg']?.name).toBe('a.jpg');
  });
});
