import { describe, expect, it } from 'vitest';
import {
  archivePathForRelative,
  buildTransferManifest,
  parseTransferManifest,
  resolveImportTargetPath,
  TRANSFER_FORMAT,
} from '../transferPackage';

describe('transferPackage', () => {
  it('builds and parses a manifest round-trip', () => {
    const manifest = buildTransferManifest(
      [
        {
          relativePath: 'notes/a.md',
          name: 'a.md',
          description: 'hello',
          tags: ['x'],
        },
      ],
      '2026-11-19T00:00:00.000Z',
    );
    expect(manifest.format).toBe(TRANSFER_FORMAT);
    expect(manifest.items[0].archivePath).toBe('files/notes/a.md');
    const parsed = parseTransferManifest(manifest);
    expect(parsed?.items).toHaveLength(1);
    expect(parsed?.items[0].description).toBe('hello');
  });

  it('rejects unknown format', () => {
    expect(
      parseTransferManifest({ format: 'other', version: 1, items: [] }),
    ).toBeNull();
  });

  it('resolves import target paths under a folder', () => {
    expect(archivePathForRelative('/photos/a.jpg')).toBe('files/photos/a.jpg');
    expect(resolveImportTargetPath('inbox', 'photos/a.jpg')).toBe(
      'inbox/photos/a.jpg',
    );
    expect(resolveImportTargetPath('', 'photos/a.jpg')).toBe('photos/a.jpg');
  });
});
