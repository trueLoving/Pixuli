import { describe, expect, it } from 'vitest';
import { shouldResetOnFolderChange } from '../folderScopeReset';

describe('shouldResetOnFolderChange (P1-3)', () => {
  it('does not reset on first observation', () => {
    expect(shouldResetOnFolderChange(null, 'photos')).toBe(false);
  });

  it('resets when the folder path changes', () => {
    expect(shouldResetOnFolderChange('photos', 'docs')).toBe(true);
    expect(shouldResetOnFolderChange('photos', '')).toBe(true);
  });

  it('does not reset when the path is unchanged', () => {
    expect(shouldResetOnFolderChange('photos', 'photos')).toBe(false);
  });
});
