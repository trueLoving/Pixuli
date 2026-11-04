import { describe, expect, it } from 'vitest';
import {
  convertedFileName,
  croppedFileName,
  cropOutputMime,
  parentDirOfRelativePath,
  uniqueRelativePath,
} from '../imageConvertTarget';

describe('imageConvertTarget', () => {
  it('names the new file from the source and the target format', () => {
    expect(convertedFileName('cover.PNG', 'image/webp')).toBe('cover.webp');
    expect(convertedFileName('notes', 'image/jpeg')).toBe('notes.jpg');
  });

  it('names a crop beside the original without changing jpeg or png', () => {
    expect(croppedFileName('cover.PNG')).toBe('cover-crop.png');
    expect(croppedFileName('notes.gif')).toBe('notes-crop.png');
    expect(croppedFileName('photo.jpg', 'image/webp')).toBe('photo-crop.webp');
    expect(cropOutputMime('a.webp', 'image/webp')).toBe('image/webp');
    expect(cropOutputMime('a.gif')).toBe('image/png');
  });

  it('keeps the converted file in the source folder', () => {
    expect(parentDirOfRelativePath('images/trip/a.jpg')).toBe('images/trip');
    expect(parentDirOfRelativePath('a.jpg')).toBe('');
  });

  it('does not overwrite a path that already exists', () => {
    const taken = new Set(['images/cover.png']);
    expect(uniqueRelativePath('images', 'cover.png', taken)).toBe(
      'images/cover-2.png',
    );
    expect(uniqueRelativePath('images', 'cover.webp', taken)).toBe(
      'images/cover.webp',
    );
  });
});
