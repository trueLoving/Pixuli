import { describe, expect, it } from 'vitest';
import {
  buildShareUrls,
  extractShareToken,
  isHiddenRelativePath,
  isShareTokenValid,
  sanitizeShareRelativePath,
} from '../lanShareHelpers';

describe('lanShareHelpers', () => {
  it('hides .pixuli and .git segments', () => {
    expect(isHiddenRelativePath('.pixuli/config.json')).toBe(true);
    expect(isHiddenRelativePath('a/.git/config')).toBe(true);
    expect(isHiddenRelativePath('photos/a.jpg')).toBe(false);
  });

  it('sanitizes relative paths and rejects traversal', () => {
    expect(sanitizeShareRelativePath('photos/a.jpg')).toBe('photos/a.jpg');
    expect(sanitizeShareRelativePath('/photos/a.jpg')).toBe('photos/a.jpg');
    expect(sanitizeShareRelativePath('../secret')).toBeNull();
    expect(sanitizeShareRelativePath('.pixuli/x')).toBeNull();
    expect(sanitizeShareRelativePath('')).toBe('');
  });

  it('reads token from query or Bearer header', () => {
    const url = new URL('http://192.168.1.2:17890/?token=ABC');
    expect(extractShareToken(url, undefined)).toBe('ABC');
    expect(extractShareToken(new URL('http://x/'), 'Bearer XYZ')).toBe('XYZ');
  });

  it('validates token strictly', () => {
    expect(isShareTokenValid('ABC', 'ABC')).toBe(true);
    expect(isShareTokenValid('ABC', 'abc')).toBe(false);
    expect(isShareTokenValid('ABC', null)).toBe(false);
  });

  it('builds share urls with token', () => {
    expect(buildShareUrls(17890, 'TOK', ['192.168.1.8'])).toEqual([
      'http://192.168.1.8:17890/?token=TOK',
    ]);
  });
});
