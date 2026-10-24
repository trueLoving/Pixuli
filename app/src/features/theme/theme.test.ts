import { describe, expect, it } from 'vitest';
import { resolveDark } from './theme';

describe('resolveDark', () => {
  it('follows the system only when preference is system', () => {
    expect(resolveDark('system', true)).toBe(true);
    expect(resolveDark('system', false)).toBe(false);
    expect(resolveDark('dark', false)).toBe(true);
    expect(resolveDark('light', true)).toBe(false);
  });
});
