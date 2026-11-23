/** @vitest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const openPdfDocument = vi.fn();

vi.mock('../../pdfEngine', () => ({
  openPdfDocument: (...args: unknown[]) => openPdfDocument(...args),
}));

import { PdfDocumentView } from '../PdfDocumentView';

function mockPage() {
  return {
    getViewport: ({ scale }: { scale: number }) => ({
      width: 100 * scale,
      height: 140 * scale,
    }),
    render: () => ({
      promise: Promise.resolve(),
      cancel: vi.fn(),
    }),
  };
}

function mockDoc(numPages = 2) {
  return {
    numPages,
    getPage: vi.fn(async () => mockPage()),
    destroy: vi.fn(async () => undefined),
  };
}

describe('PdfDocumentView', () => {
  afterEach(() => {
    openPdfDocument.mockReset();
    vi.restoreAllMocks();
  });

  it('renders first page for inspector variant', async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () =>
        ({
          canvas: document.createElement('canvas'),
        }) as unknown as CanvasRenderingContext2D,
    );
    const doc = mockDoc(3);
    openPdfDocument.mockResolvedValue(doc);

    render(
      <PdfDocumentView
        src="blob:http://localhost/doc"
        localPath="notes.pdf"
        variant="inspector"
        loadingLabel="loading"
        errorLabel="failed"
        pageLabel={(page, total) => `${page}/${total}`}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector('.pdf-document-view-canvas')).toBeTruthy();
    });
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(doc.getPage).toHaveBeenCalledWith(1);
  });

  it('shows error when load fails', async () => {
    openPdfDocument.mockRejectedValue(new Error('boom'));

    render(
      <PdfDocumentView
        src="https://example.com/missing.pdf"
        variant="modal"
        loadingLabel="loading"
        errorLabel="failed"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('failed');
    });
  });
});
