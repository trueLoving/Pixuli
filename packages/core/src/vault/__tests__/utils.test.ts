import { describe, expect, it } from 'vitest';
import {
  guessMimeType,
  isRasterImagePath,
  isIngestibleFilePath,
} from '../utils';

describe('guessMimeType', () => {
  it('maps media, docs and falls back to octet-stream', () => {
    expect(guessMimeType('a.png')).toBe('image/png');
    expect(guessMimeType('a.jpg')).toBe('image/jpeg');
    expect(guessMimeType('notes.pdf')).toBe('application/pdf');
    expect(guessMimeType('clip.mp4')).toBe('video/mp4');
    expect(guessMimeType('readme.md')).toBe('text/markdown');
    expect(guessMimeType('file.bin')).toBe('application/octet-stream');
  });
});

describe('ingestible paths', () => {
  it('treats only raster/vector image extensions as images', () => {
    expect(isRasterImagePath('images/a.jpg')).toBe(true);
    expect(isRasterImagePath('images/a.pdf')).toBe(false);
  });

  it('ingests non-dot files under the library', () => {
    expect(isIngestibleFilePath('images/a.pdf')).toBe(true);
    expect(isIngestibleFilePath('images/notes.txt')).toBe(true);
    expect(isIngestibleFilePath('images/.DS_Store')).toBe(false);
  });
});
