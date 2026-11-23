import { afterEach, describe, expect, it, vi } from 'vitest';

const getDocument = vi.fn();

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (...args: unknown[]) => getDocument(...args),
}));

import { __resetPdfjsForTests, openPdfDocument } from '../pdfEngine';

describe('openPdfDocument', () => {
  afterEach(() => {
    getDocument.mockReset();
    __resetPdfjsForTests();
  });

  it('reads local bytes when readFile is provided', async () => {
    const readFile = vi.fn(async () => new Uint8Array([1, 2, 3, 4]));
    const doc = { numPages: 1 };
    getDocument.mockReturnValue({ promise: Promise.resolve(doc) });

    const result = await openPdfDocument({
      localPath: 'docs/a.pdf',
      src: 'blob:ignored',
      readFile,
      isLocalAvailable: () => true,
    });

    expect(result).toBe(doc);
    expect(readFile).toHaveBeenCalledWith('docs/a.pdf');
    expect(getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(ArrayBuffer),
        isEvalSupported: false,
      }),
    );
  });

  it('falls back to url when local unavailable', async () => {
    const doc = { numPages: 2 };
    getDocument.mockReturnValue({ promise: Promise.resolve(doc) });

    const result = await openPdfDocument({
      localPath: null,
      src: 'https://example.com/a.pdf',
    });

    expect(result).toBe(doc);
    expect(getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/a.pdf',
        withCredentials: false,
      }),
    );
  });

  it('throws when neither local path nor src is available', async () => {
    await expect(
      openPdfDocument({ localPath: null, src: null }),
    ).rejects.toThrow('no pdf source');
  });
});
