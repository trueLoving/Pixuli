import { describe, expect, it } from 'vitest';
import {
  formatWorkspaceLocation,
  resolveNewFolderParent,
} from '../WorkspaceFolderTree';

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

describe('formatWorkspaceLocation', () => {
  const t = (key: string) => key;

  it('returns absolute filesystem paths as-is', () => {
    expect(formatWorkspaceLocation('/Users/me/Pictures/111', '111', t)).toBe(
      '/Users/me/Pictures/111',
    );
  });

  it('labels virtual storage backends', () => {
    expect(formatWorkspaceLocation('opfs://abc', null, t)).toBe(
      'workspace.webStorage',
    );
    expect(formatWorkspaceLocation('fsa://abc', '相册', t)).toBe(
      'workspace.fsaStorage · 相册',
    );
    expect(formatWorkspaceLocation('mobile://abc', null, t)).toBe(
      'workspace.mobileStorage',
    );
  });
});
