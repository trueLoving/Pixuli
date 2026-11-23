import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const KindPdfDocumentView = vi.fn((props: { emptyLabel?: string }) => (
  <div data-testid="kind-pdf">{props.emptyLabel ?? 'ok'}</div>
));

vi.mock('@pixuli/kind-pdf/ui', () => ({
  PdfDocumentView: (props: { emptyLabel?: string }) =>
    KindPdfDocumentView(props),
}));

vi.mock('@/platforms/workspacePlatform', () => ({
  getWorkspaceAdapter: () => ({
    readFile: vi.fn(),
  }),
  isWorkspaceAvailable: () => true,
}));

import { PdfDocumentView } from '../PdfDocumentView';

describe('PdfDocumentView (app wrapper)', () => {
  it('injects workspace adapters into kind-pdf UI', () => {
    render(
      <PdfDocumentView src={null} emptyLabel="empty" variant="inspector" />,
    );
    expect(screen.getByTestId('kind-pdf')).toHaveTextContent('empty');
    expect(KindPdfDocumentView).toHaveBeenCalledWith(
      expect.objectContaining({
        emptyLabel: 'empty',
        readFile: expect.any(Function),
        isLocalAvailable: expect.any(Function),
      }),
    );
  });
});
