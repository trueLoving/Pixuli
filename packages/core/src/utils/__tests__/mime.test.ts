import { describe, expect, it } from 'vitest';
import { guessMimeType, isRasterImagePath, isSyncableAssetName } from '../mime';

describe('mime helpers', () => {
  it('guessMimeType covers media and docs', () => {
    expect(guessMimeType('a.png')).toBe('image/png');
    expect(guessMimeType('notes.pdf')).toBe('application/pdf');
    expect(guessMimeType('clip.mp4')).toBe('video/mp4');
    expect(guessMimeType('readme.md')).toBe('text/markdown');
    expect(guessMimeType('notes.txt')).toBe('text/plain');
    expect(guessMimeType('file.bin')).toBe('application/octet-stream');
  });

  it('isRasterImagePath is image-only', () => {
    expect(isRasterImagePath('images/a.jpg')).toBe(true);
    expect(isRasterImagePath('doc.pdf')).toBe(false);
  });

  it('isSyncableAssetName includes markdown and text', () => {
    expect(isSyncableAssetName('a.jpg')).toBe(true);
    expect(isSyncableAssetName('a.md')).toBe(true);
    expect(isSyncableAssetName('a.txt')).toBe(true);
    expect(isSyncableAssetName('a.bin')).toBe(false);
  });
});
