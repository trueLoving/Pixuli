import { describe, expect, it } from 'vitest';
import {
  formatMobileRootPath,
  normalizeRelativePath,
  parseMobileRootPath,
} from '../mobileWorkspaceFs';

describe('mobileWorkspaceFs paths (REF-607 P6)', () => {
  it('formats and parses mobile root paths', () => {
    const id = 'abc-123';
    const root = formatMobileRootPath(id);
    expect(root).toBe('mobile://abc-123');
    expect(parseMobileRootPath(root)).toBe(id);
    expect(parseMobileRootPath('opfs://x')).toBeNull();
    expect(parseMobileRootPath('mobile://')).toBeNull();
  });

  it('normalizes relative paths', () => {
    expect(normalizeRelativePath('/images/a.jpg')).toBe('images/a.jpg');
    expect(normalizeRelativePath('images\\b.jpg')).toBe('images/b.jpg');
  });
});
