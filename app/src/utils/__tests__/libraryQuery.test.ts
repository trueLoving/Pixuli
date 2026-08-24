import { describe, expect, it } from 'vitest';
import {
  filterByLibraryQuery,
  parseLibraryQuery,
  parseSizeValue,
  tokenizeLibraryQuery,
} from '../libraryQuery';

describe('libraryQuery', () => {
  it('tokenizes quoted phrases and bare words', () => {
    expect(tokenizeLibraryQuery('foo "bar baz" kind:pdf')).toEqual([
      'foo',
      'bar baz',
      'kind:pdf',
    ]);
  });

  it('parses name, kind, and size terms', () => {
    const q = parseLibraryQuery('cover kind:image size:>1mb name:logo');
    expect(q.nameTerms).toEqual(['cover', 'logo']);
    expect(q.kinds).toEqual(['image']);
    expect(q.sizeRules).toEqual([{ op: 'gt', bytes: 1024 * 1024 }]);
  });

  it('parses size units', () => {
    expect(parseSizeValue('500kb')).toBe(500 * 1024);
    expect(parseSizeValue('1.5mb')).toBe(Math.round(1.5 * 1024 * 1024));
    expect(parseSizeValue('10')).toBe(10);
  });

  it('filters items by combined query', () => {
    const items = [
      { name: 'a.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 },
      { name: 'notes.pdf', type: 'application/pdf', size: 100 * 1024 },
      { name: 'clip.mp4', type: 'video/mp4', size: 8 * 1024 * 1024 },
    ];

    expect(filterByLibraryQuery(items, 'kind:pdf').map(i => i.name)).toEqual([
      'notes.pdf',
    ]);

    expect(
      filterByLibraryQuery(items, 'kind:image size:>1mb').map(i => i.name),
    ).toEqual(['a.jpg']);

    expect(filterByLibraryQuery(items, 'clip').map(i => i.name)).toEqual([
      'clip.mp4',
    ]);
  });

  it('treats multiple kinds as OR', () => {
    const items = [
      { name: 'a.jpg', type: 'image/jpeg', size: 10 },
      { name: 'b.pdf', type: 'application/pdf', size: 10 },
      { name: 'c.mp4', type: 'video/mp4', size: 10 },
    ];
    expect(
      filterByLibraryQuery(items, 'kind:image kind:pdf').map(i => i.name),
    ).toEqual(['a.jpg', 'b.pdf']);
  });
});
