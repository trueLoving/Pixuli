import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateDisplayDimensions } from '../dimensions';
import { compressImage } from '../compressImage';

describe('calculateDisplayDimensions', () => {
  it('keeps aspect ratio when only width is limited', () => {
    const result = calculateDisplayDimensions(200, 100, 100, undefined, true);
    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });

  it('keeps aspect ratio when only height is limited', () => {
    const result = calculateDisplayDimensions(200, 100, undefined, 50, true);
    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });

  it('picks the smaller scale when both edges are limited', () => {
    const result = calculateDisplayDimensions(200, 100, 50, 50, true);
    expect(result.width).toBe(50);
    expect(result.height).toBe(25);
  });

  it('returns original size when unconstrained', () => {
    const result = calculateDisplayDimensions(200, 100);
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
  });
});

describe('compressImage', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('compresses via canvas', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const mockImage = {
      width: 200,
      height: 200,
      naturalWidth: 200,
      naturalHeight: 200,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };

    vi.spyOn(window, 'Image').mockImplementation(() => mockImage as never);

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
      })),
      toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
        callback(new Blob(['compressed'], { type: 'image/jpeg' }));
      }),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as never;
      return document.createElement(tag);
    });

    const promise = compressImage(file, {
      quality: 0.8,
      maxWidth: 100,
      maxHeight: 100,
    });

    setTimeout(() => {
      mockImage.onload?.();
    }, 0);

    const result = await promise;
    expect(result.compressedFile).toBeInstanceOf(File);
    expect(result.originalSize).toBe(file.size);
    expect(result.compressedDimensions.width).toBe(100);
    expect(result.compressedDimensions.height).toBe(100);
  });

  it('skips compress when file is under minSizeToCompress', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const mockImage = {
      width: 100,
      height: 100,
      naturalWidth: 100,
      naturalHeight: 100,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };

    vi.spyOn(window, 'Image').mockImplementation(() => mockImage as never);

    const promise = compressImage(file, {
      minSizeToCompress: 10000,
    });

    setTimeout(() => {
      mockImage.onload?.();
    }, 0);

    const result = await promise;
    expect(result.compressedFile).toBe(file);
    expect(result.compressionRatio).toBe(0);
  });
});
