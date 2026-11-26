import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getImageDimensions,
  getImageDimensionsFromUrl,
  getImageInfo,
  isImageFile,
} from '../dimensions';

describe('image dimensions helpers', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isImageFile checks mime', () => {
    expect(isImageFile(new File([''], 'a.jpg', { type: 'image/jpeg' }))).toBe(
      true,
    );
    expect(isImageFile(new File([''], 'a.txt', { type: 'text/plain' }))).toBe(
      false,
    );
  });

  it('getImageDimensions reads natural size', async () => {
    const mockImage = {
      width: 100,
      height: 200,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };
    vi.spyOn(window, 'Image').mockImplementation(() => mockImage as never);

    const promise = getImageDimensions(
      new File([''], 'a.jpg', { type: 'image/jpeg' }),
    );
    setTimeout(() => mockImage.onload?.(), 0);
    await expect(promise).resolves.toEqual({ width: 100, height: 200 });
  });

  it('getImageInfo reports orientation', async () => {
    const mockImage = {
      width: 200,
      height: 100,
      naturalWidth: 200,
      naturalHeight: 100,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };
    vi.spyOn(window, 'Image').mockImplementation(() => mockImage as never);

    const promise = getImageInfo(
      new File([''], 'a.jpg', { type: 'image/jpeg' }),
    );
    setTimeout(() => mockImage.onload?.(), 0);
    await expect(promise).resolves.toMatchObject({ orientation: 'landscape' });
  });

  it('getImageDimensionsFromUrl sets cors', async () => {
    const mockImage = {
      naturalWidth: 100,
      naturalHeight: 200,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
      crossOrigin: '',
    };
    vi.spyOn(window, 'Image').mockImplementation(() => mockImage as never);

    const promise = getImageDimensionsFromUrl('https://example.com/a.jpg');
    setTimeout(() => mockImage.onload?.(), 0);
    const result = await promise;
    expect(result).toEqual({ width: 100, height: 200 });
    expect(mockImage.crossOrigin).toBe('anonymous');
  });
});
