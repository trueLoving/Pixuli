import { describe, expect, it } from 'vitest';
import { importDirForSelectedFolder } from '../workspaceLocalFs';

describe('importDirForSelectedFolder', () => {
  it('uses workspace root for empty path and __root__', () => {
    expect(importDirForSelectedFolder('')).toBe('');
    expect(importDirForSelectedFolder('__root__')).toBe('');
  });

  it('uses the currently selected folder', () => {
    expect(importDirForSelectedFolder('photos/2024/')).toBe('photos/2024');
    expect(importDirForSelectedFolder('images')).toBe('images');
  });
});
