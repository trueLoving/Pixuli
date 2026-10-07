import { describe, expect, it } from 'vitest';
import { matchesListPathPrefix } from '../listFilter';

describe('matchesListPathPrefix', () => {
  it('allows all paths when prefix is empty', () => {
    expect(matchesListPathPrefix('images/a.jpg', undefined, true)).toBe(true);
    expect(matchesListPathPrefix('images/trip/b.jpg', '', false)).toBe(true);
  });

  it('filters by prefix and shallow', () => {
    expect(matchesListPathPrefix('images/a.jpg', 'images', true)).toBe(true);
    expect(matchesListPathPrefix('images/trip/b.jpg', 'images', true)).toBe(
      false,
    );
    expect(matchesListPathPrefix('images/trip/b.jpg', 'images', false)).toBe(
      true,
    );
    expect(matchesListPathPrefix('other/a.jpg', 'images', true)).toBe(false);
  });
});
