import { beforeAll, describe, expect, it } from 'vitest';
import {
  filterAssetsByKind,
  filterAssetsByKinds,
  getAssetKind,
} from '../assetKind';
import { startPluginRuntime } from '@/plugins/runtime';

describe('getAssetKind', () => {
  beforeAll(() => {
    startPluginRuntime();
  });

  it('classifies pdf via kind-pdf plugin when registered', () => {
    expect(getAssetKind({ name: 'a.pdf', type: '' })).toBe('pdf');
    expect(getAssetKind({ name: 'a.bin', type: 'application/pdf' })).toBe(
      'pdf',
    );
  });

  it('classifies video via kind-video plugin when registered', () => {
    expect(getAssetKind({ name: 'clip.mp4', type: '' })).toBe('video');
    expect(getAssetKind({ name: 'clip', type: 'video/webm' })).toBe('video');
  });

  it('defaults unknown files to other', () => {
    expect(
      getAssetKind({ name: 'data.bin', type: 'application/octet-stream' }),
    ).toBe('other');
  });

  it('classifies markdown via kind-markdown plugin when registered', () => {
    expect(getAssetKind({ name: 'readme.md', type: '' })).toBe('markdown');
    expect(getAssetKind({ name: 'guide.markdown', type: '' })).toBe('markdown');
    expect(getAssetKind({ name: 'doc.bin', type: 'text/markdown' })).toBe(
      'markdown',
    );
  });

  it('classifies plain text via kind-text plugin when registered', () => {
    expect(getAssetKind({ name: 'notes.txt', type: '' })).toBe('text');
    expect(getAssetKind({ name: 'log.bin', type: 'text/plain' })).toBe('text');
  });

  it('classifies images by mime or extension', () => {
    expect(getAssetKind({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(
      'image',
    );
  });
});

describe('filterAssetsByKind', () => {
  beforeAll(() => {
    startPluginRuntime();
  });

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
