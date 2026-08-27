import { describe, expect, it } from 'vitest';
import { nextSelectedIds, pruneSelectedIds } from '../librarySelection';

const visible = ['a', 'b', 'c', 'd'];

describe('pruneSelectedIds', () => {
  it('drops ids that are no longer visible', () => {
    expect(pruneSelectedIds(['a', 'z', 'c'], ['a', 'b', 'c'])).toEqual([
      'a',
      'c',
    ]);
  });

  it('returns the same array when nothing changed', () => {
    const selected = ['a', 'c'];
    expect(pruneSelectedIds(selected, visible)).toBe(selected);
  });
});

describe('nextSelectedIds', () => {
  it('replaces selection on a plain click', () => {
    expect(
      nextSelectedIds({
        visibleIds: visible,
        selectedIds: ['a'],
        clickedId: 'c',
        additive: false,
        range: false,
        anchorId: 'a',
        multiMode: false,
      }),
    ).toEqual({ selectedIds: ['c'], anchorId: 'c' });
  });

  it('toggles with additive click', () => {
    expect(
      nextSelectedIds({
        visibleIds: visible,
        selectedIds: ['a'],
        clickedId: 'c',
        additive: true,
        range: false,
        anchorId: 'a',
        multiMode: false,
      }).selectedIds,
    ).toEqual(['a', 'c']);
  });

  it('selects a range from the anchor', () => {
    expect(
      nextSelectedIds({
        visibleIds: visible,
        selectedIds: ['b'],
        clickedId: 'd',
        additive: false,
        range: true,
        anchorId: 'b',
        multiMode: false,
      }).selectedIds,
    ).toEqual(['b', 'c', 'd']);
  });

  it('toggles in multi-select mode without modifier keys', () => {
    expect(
      nextSelectedIds({
        visibleIds: visible,
        selectedIds: ['a'],
        clickedId: 'c',
        additive: false,
        range: false,
        anchorId: 'a',
        multiMode: true,
      }).selectedIds,
    ).toEqual(['a', 'c']);
  });
});
