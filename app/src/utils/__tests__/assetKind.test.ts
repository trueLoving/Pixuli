import { describe, expect, it } from 'vitest';
import {
  filterAssetsByKind,
  filterAssetsByKinds,
  getAssetKind,
} from '../assetKind';

describe('getAssetKind', () => {
  it('classifies pdf by mime or extension', () => {
    expect(getAssetKind({ name: 'a.pdf', type: '' })).toBe('pdf');
    expect(getAssetKind({ name: 'a.bin', type: 'application/pdf' })).toBe(
      'pdf',
    );
  });

  it('classifies video by mime or extension', () => {
    expect(getAssetKind({ name: 'clip.mp4', type: '' })).toBe('video');
    expect(getAssetKind({ name: 'clip', type: 'video/webm' })).toBe('video');
  });

  it('defaults to image', () => {
    expect(getAssetKind({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(
      'image',
    );
  });
});

describe('filterAssetsByKind', () => {
  const items = [
    { name: 'a.jpg', type: 'image/jpeg' },
    { name: 'b.pdf', type: '' },
    { name: 'c.mp4', type: '' },
  ];

  it('returns all when kind is all', () => {
    expect(filterAssetsByKind(items, 'all')).toHaveLength(3);
  });

  it('filters by multiple kinds when list is non-empty', () => {
    expect(
      filterAssetsByKinds(items, ['pdf', 'video']).map(i => i.name),
    ).toEqual(['b.pdf', 'c.mp4']);
  });

  it('returns all when kinds is empty', () => {
    expect(filterAssetsByKinds(items, [])).toHaveLength(3);
  });
});
