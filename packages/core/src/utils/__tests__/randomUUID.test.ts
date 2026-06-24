import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from '../randomUUID';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('randomUUID', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a v4-shaped id', () => {
    expect(randomUUID()).toMatch(UUID_RE);
  });

  it('falls back when crypto.randomUUID is missing', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = i;
        }
        return arr;
      },
    });
    expect(randomUUID()).toMatch(UUID_RE);
  });
});
