import { describe, expect, it } from 'vitest';
import { importDirForSelectedFolder } from '../workspaceLocalFs';

describe('importDirForSelectedFolder', () => {
  it('falls back to images when the library is showing everything', () => {
    expect(importDirForSelectedFolder('')).toBe('images');
    expect(importDirForSelectedFolder('__root__')).toBe('images');
  });

  it('uses the currently selected folder', () => {
    expect(importDirForSelectedFolder('photos/2024/')).toBe('photos/2024');
    expect(importDirForSelectedFolder('images')).toBe('images');
  });
});
