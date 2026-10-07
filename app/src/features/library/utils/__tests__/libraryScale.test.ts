import { describe, expect, it } from 'vitest';
import {
  getLibraryScaleLevel,
  getLibraryScaleTipKey,
  LIBRARY_SCALE_HUGE,
  LIBRARY_SCALE_LARGE,
} from '../libraryScale';

describe('libraryScale', () => {
  it('classifies normal / large / huge by thresholds', () => {
    expect(getLibraryScaleLevel(0)).toBe('normal');
    expect(getLibraryScaleLevel(LIBRARY_SCALE_LARGE)).toBe('normal');
    expect(getLibraryScaleLevel(LIBRARY_SCALE_LARGE + 1)).toBe('large');
    expect(getLibraryScaleLevel(LIBRARY_SCALE_HUGE)).toBe('large');
    expect(getLibraryScaleLevel(LIBRARY_SCALE_HUGE + 1)).toBe('huge');
  });

  it('returns tip keys only above large threshold', () => {
    expect(getLibraryScaleTipKey(10)).toBeNull();
    expect(getLibraryScaleTipKey(LIBRARY_SCALE_LARGE + 1)).toBe(
      'image.library.scaleTipLarge',
    );
    expect(getLibraryScaleTipKey(LIBRARY_SCALE_HUGE + 1)).toBe(
      'image.library.scaleTipHuge',
    );
  });
});
