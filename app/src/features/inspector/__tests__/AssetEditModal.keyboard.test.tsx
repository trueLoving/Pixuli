import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssetItem } from '@pixuli/core/types';

vi.mock('@/ui/feedback/toast', () => ({
  showLoading: vi.fn(() => 'toast'),
  updateLoadingToSuccess: vi.fn(),
  updateLoadingToError: vi.fn(),
}));

vi.mock('@/features/library/AssetThumb', () => ({
  AssetThumb: () => <span data-testid="thumb" />,
}));

import AssetEditModal from '../AssetEditModal';

const asset: AssetItem = {
  id: 'a1',
  name: 'photo.jpg',
  url: '',
  type: 'image/jpeg',
  size: 10,
  width: 1,
  height: 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  description: '',
  tags: [],
};

describe('AssetEditModal keyboard scene', () => {
  it('focuses name field when opened', async () => {
    render(
      <AssetEditModal
        asset={asset}
        isOpen
        onClose={vi.fn()}
        onUpdateAsset={vi.fn()}
        t={key => key}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/image\.edit\.imageName/)).toHaveFocus();
    });
  });

  it('closes on Escape', () => {
    const onCancel = vi.fn();
    render(
      <AssetEditModal
        asset={asset}
        isOpen
        onClose={vi.fn()}
        onCancel={onCancel}
        onUpdateAsset={vi.fn()}
        t={key => key}
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('saves with Enter from the name field', async () => {
    const onUpdateAsset = vi.fn().mockResolvedValue(undefined);
    render(
      <AssetEditModal
        asset={asset}
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onUpdateAsset={onUpdateAsset}
        t={key => key}
      />,
    );

    const name = await screen.findByLabelText(/image\.edit\.imageName/);
    await waitFor(() => {
      expect(name).toHaveFocus();
    });
    fireEvent.keyDown(name, { key: 'Enter' });

    await waitFor(() => {
      expect(onUpdateAsset).toHaveBeenCalled();
    });
  });

  it('saves with Ctrl+Enter', async () => {
    const onUpdateAsset = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    render(
      <AssetEditModal
        asset={asset}
        isOpen
        onClose={vi.fn()}
        onSuccess={onSuccess}
        onUpdateAsset={onUpdateAsset}
        t={key => key}
      />,
    );

    fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(onUpdateAsset).toHaveBeenCalled();
    });
  });

  it('cycles focus backward with Shift+Tab', async () => {
    render(
      <AssetEditModal
        asset={asset}
        isOpen
        onClose={vi.fn()}
        onUpdateAsset={vi.fn()}
        t={key => key}
      />,
    );

    const name = await screen.findByLabelText(/image\.edit\.imageName/);
    await waitFor(() => {
      expect(name).toHaveFocus();
    });

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toHaveAttribute(
      'aria-label',
      'common.close',
    );
  });

  it('cycles focus forward with Tab from last control', async () => {
    render(
      <AssetEditModal
        asset={asset}
        isOpen
        onClose={vi.fn()}
        onUpdateAsset={vi.fn()}
        t={key => key}
      />,
    );

    const save = await screen.findByRole('button', {
      name: /image\.edit\.saveChanges/,
    });
    save.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toHaveAttribute(
      'aria-label',
      'common.close',
    );
  });
});
