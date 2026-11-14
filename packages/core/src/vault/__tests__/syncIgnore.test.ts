import { describe, expect, it } from 'vitest';
import { createLocalVault } from '../localVault';
import { MemoryWorkspaceAdapter } from '../memoryAdapter';
import {
  countSyncIgnoreMatches,
  matchesSyncIgnore,
  normalizeSyncIgnorePatterns,
  readSyncIgnorePatterns,
  writeSyncIgnorePatterns,
} from '../syncIgnore';
import { intentFromEntry } from '../syncApply';
import { WORKSPACE_PATHS } from '../paths';
import type { LocalAssetIndexEntry } from '../types';

function entry(
  relativePath: string,
  patch?: Partial<LocalAssetIndexEntry>,
): LocalAssetIndexEntry {
  return {
    id: relativePath,
    relativePath,
    name: relativePath.split('/').pop() || relativePath,
    size: 1,
    width: 0,
    height: 0,
    mimeType: 'application/octet-stream',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    syncState: 'local-only',
    ...patch,
  };
}

describe('syncIgnore', () => {
  it('normalizes patterns', () => {
    expect(
      normalizeSyncIgnorePatterns([
        ' *.psd ',
        'private/**',
        'private/**',
        '',
        '# comment',
      ]),
    ).toEqual(['*.psd', 'private/**']);
  });

  it('matches basename globs and path prefixes', () => {
    expect(matchesSyncIgnore('images/a.psd', ['*.psd'])).toBe(true);
    expect(matchesSyncIgnore('images/a.jpg', ['*.psd'])).toBe(false);
    expect(matchesSyncIgnore('private/secret.md', ['private/**'])).toBe(true);
    expect(matchesSyncIgnore('notes/draft.md', ['notes/draft.md'])).toBe(true);
    expect(matchesSyncIgnore('notes/other.md', ['notes/draft.md'])).toBe(false);
    expect(matchesSyncIgnore('tmp/a.jpg', ['tmp/'])).toBe(true);
  });

  it('counts matches', () => {
    expect(
      countSyncIgnoreMatches(
        ['a.psd', 'b.jpg', 'private/x.md'],
        ['*.psd', 'private/**'],
      ),
    ).toBe(2);
  });

  it('reads and writes sync-ignore.json under .pixuli', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();

    expect(await readSyncIgnorePatterns(adapter)).toEqual([]);
    await writeSyncIgnorePatterns(adapter, ['*.psd', 'private/**']);
    expect(await readSyncIgnorePatterns(adapter)).toEqual([
      '*.psd',
      'private/**',
    ]);
    expect(await adapter.exists(WORKSPACE_PATHS.syncIgnore)).toBe(true);
  });

  it('intentFromEntry skips ignored paths', () => {
    const ignored = entry('private/secret.jpg');
    expect(
      intentFromEntry(ignored, true, 'b1', {
        ignorePatterns: ['private/**'],
      }),
    ).toBeNull();
    expect(
      intentFromEntry(entry('images/a.jpg'), true, 'b1', {
        ignorePatterns: ['private/**'],
      }),
    ).toBe('upload');
  });
});
