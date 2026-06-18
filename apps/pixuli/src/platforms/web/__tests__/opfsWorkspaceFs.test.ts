import { describe, expect, it } from 'vitest';
import { formatFsaRootPath, parseFsaRootPath } from '../fsaWorkspaceFs';
import {
  formatOpfsRootPath,
  normalizeRelativePath,
  parseOpfsRootPath,
} from '../opfsWorkspaceFs';

describe('web workspace root paths', () => {
  it('formats and parses opfs root paths', () => {
    const id = 'abc-123';
    const root = formatOpfsRootPath(id);
    expect(root).toBe('opfs://abc-123');
    expect(parseOpfsRootPath(root)).toBe(id);
    expect(parseOpfsRootPath('/Users/foo')).toBeNull();
  });

  it('formats and parses fsa root paths', () => {
    const id = 'workspace-uuid';
    const root = formatFsaRootPath(id);
    expect(root).toBe('fsa://workspace-uuid');
    expect(parseFsaRootPath(root)).toBe(id);
    expect(parseFsaRootPath('opfs://x')).toBeNull();
  });

  it('normalizes relative paths', () => {
    expect(normalizeRelativePath('/images/a.jpg')).toBe('images/a.jpg');
    expect(normalizeRelativePath('images\\b.jpg')).toBe('images/b.jpg');
  });
});
