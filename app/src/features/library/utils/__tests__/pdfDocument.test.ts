import { afterEach, describe, expect, it, vi } from 'vitest';

const readFile = vi.fn();
const isWorkspaceAvailable = vi.fn(() => false);
const getDocument = vi.fn();

vi.mock('@/platforms/workspacePlatform', () => ({
  getWorkspaceAdapter: () => ({ readFile }),
  isWorkspaceAvailable: () => isWorkspaceAvailable(),
}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (...args: unknown[]) => getDocument(...args),
}));

import { loadPdfDocument } from '../pdfDocument';

describe('loadPdfDocument', () => {
  afterEach(() => {
    readFile.mockReset();
    isWorkspaceAvailable.mockReset();
    isWorkspaceAvailable.mockReturnValue(false);
    getDocument.mockReset();
  });

  it('reads local workspace bytes without url fetch', async () => {
    isWorkspaceAvailable.mockReturnValue(true);
    const bytes = new Uint8Array([1, 2, 3, 4]);
    readFile.mockResolvedValue(bytes);
    const doc = { numPages: 1 };
    getDocument.mockReturnValue({ promise: Promise.resolve(doc) });

    const result = await loadPdfDocument('docs/a.pdf', 'blob:ignored');

    expect(result).toBe(doc);
    expect(readFile).toHaveBeenCalledWith('docs/a.pdf');
    expect(getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(ArrayBuffer),
        isEvalSupported: false,
      }),
    );
  });

  it('falls back to url when workspace unavailable', async () => {
    const doc = { numPages: 2 };
    getDocument.mockReturnValue({ promise: Promise.resolve(doc) });

    const result = await loadPdfDocument(null, 'https://example.com/a.pdf');

    expect(result).toBe(doc);
    expect(getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/a.pdf',
        withCredentials: false,
      }),
    );
  });

  it('throws when neither local path nor src is available', async () => {
    await expect(loadPdfDocument(null, null)).rejects.toThrow('no pdf source');
  });
});
