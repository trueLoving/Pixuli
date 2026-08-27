import { describe, expect, it } from 'vitest';
import { getVirtualWindow, LIBRARY_ROW_HEIGHT } from '../virtualWindow';

describe('getVirtualWindow', () => {
  it('returns empty window for no rows', () => {
    expect(
      getVirtualWindow({
        total: 0,
        scrollTop: 0,
        viewportHeight: 400,
        rowHeight: LIBRARY_ROW_HEIGHT,
      }),
    ).toEqual({ start: 0, end: 0, offsetTop: 0, offsetBottom: 0 });
  });

  it('windows a large list with overscan', () => {
    const win = getVirtualWindow({
      total: 1000,
      scrollTop: 440,
      viewportHeight: 440,
      rowHeight: 44,
      overscan: 2,
    });
    expect(win.start).toBe(8);
    expect(win.end).toBe(22);
    expect(win.offsetTop).toBe(8 * 44);
    expect(win.offsetBottom).toBe((1000 - 22) * 44);
  });
});
