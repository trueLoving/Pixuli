import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const readFile = vi.fn();
const isWorkspaceAvailable = vi.fn(() => false);

vi.mock('@/platforms/workspacePlatform', () => ({
  getWorkspaceAdapter: () => ({ readFile }),
  isWorkspaceAvailable: () => isWorkspaceAvailable(),
}));

import { MarkdownDocumentView } from '../MarkdownDocumentView';

describe('MarkdownDocumentView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    readFile.mockReset();
    isWorkspaceAvailable.mockReset();
    isWorkspaceAvailable.mockReturnValue(false);
  });

  it('reads local workspace file without fetch', async () => {
    isWorkspaceAvailable.mockReturnValue(true);
    readFile.mockResolvedValue(new TextEncoder().encode('# Local\n\nBody'));

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MarkdownDocumentView
        src="blob:http://localhost/ignored"
        localPath="docs/readme.md"
        variant="modal"
        loadingLabel="loading"
        errorLabel="failed"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Local',
      );
    });
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(readFile).toHaveBeenCalledWith('docs/readme.md');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders fetched markdown content for remote urls', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '# Hello\n\nWorld',
      }),
    );

    render(
      <MarkdownDocumentView
        src="https://example.com/readme.md"
        variant="modal"
        loadingLabel="loading"
        errorLabel="failed"
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('loading');
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Hello',
      );
    });
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    render(
      <MarkdownDocumentView
        src="https://example.com/missing.md"
        variant="inspector"
        loadingLabel="loading"
        errorLabel="failed"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('failed');
    });
  });
});
