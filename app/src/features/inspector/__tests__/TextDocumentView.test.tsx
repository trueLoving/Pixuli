import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const readFile = vi.fn();
const isWorkspaceAvailable = vi.fn(() => false);

vi.mock('@/platforms/workspacePlatform', () => ({
  getWorkspaceAdapter: () => ({ readFile }),
  isWorkspaceAvailable: () => isWorkspaceAvailable(),
}));

import { TextDocumentView } from '../TextDocumentView';

describe('TextDocumentView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    readFile.mockReset();
    isWorkspaceAvailable.mockReset();
    isWorkspaceAvailable.mockReturnValue(false);
  });

  it('reads local workspace text without fetch', async () => {
    isWorkspaceAvailable.mockReturnValue(true);
    readFile.mockResolvedValue(new TextEncoder().encode('hello\nworld'));

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      <TextDocumentView
        src="blob:http://localhost/ignored"
        localPath="notes.txt"
        variant="modal"
        loadingLabel="loading"
        errorLabel="failed"
      />,
    );

    await waitFor(() => {
      expect(
        document.querySelector('.text-document-view-body'),
      ).toHaveTextContent('hello world');
    });
    expect(readFile).toHaveBeenCalledWith('notes.txt');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows error when remote fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    render(
      <TextDocumentView
        src="https://example.com/missing.txt"
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
