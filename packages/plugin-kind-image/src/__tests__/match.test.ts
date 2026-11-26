import { describe, expect, it } from 'vitest';
import { matchImageKind } from '../match';

describe('matchImageKind', () => {
  it('matches by mime', () => {
    expect(matchImageKind({ name: 'a.bin', mimeType: 'image/png' })).toBe(true);
  });

  it('matches by extension', () => {
    expect(matchImageKind({ name: 'photo.JPG' })).toBe(true);
    expect(matchImageKind({ name: 'icon.svg' })).toBe(true);
  });

  it('rejects non-images', () => {
    expect(matchImageKind({ name: 'doc.pdf' })).toBe(false);
    expect(matchImageKind({ name: 'clip.mp4', mimeType: 'video/mp4' })).toBe(
      false,
    );
  });
});
