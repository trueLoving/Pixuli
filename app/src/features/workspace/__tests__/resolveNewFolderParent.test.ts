import { describe, expect, it } from 'vitest';
import { resolveNewFolderParent } from '../WorkspaceFolderTree';

describe('resolveNewFolderParent', () => {
  it('maps root / empty to workspace top-level', () => {
    expect(resolveNewFolderParent('')).toBe('');
    expect(resolveNewFolderParent('   ')).toBe('');
    expect(resolveNewFolderParent('__root__')).toBe('');
  });

  it('keeps the selected folder as parent', () => {
    expect(resolveNewFolderParent('111')).toBe('111');
    expect(resolveNewFolderParent('images')).toBe('images');
    expect(resolveNewFolderParent('images/trip/')).toBe('images/trip');
  });
});
