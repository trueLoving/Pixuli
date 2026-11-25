import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { AssetItem } from '@pixuli/core/types';
import { KindPreviewHost } from '../KindPreviewHost';
import { DefaultUiContributionRegistry } from '@/plugins/uiRegistry';

const downloadAssetOnPlatform = vi.fn().mockResolvedValue('web');

vi.mock('@/platforms/openAsset', () => ({
  downloadAssetOnPlatform: (...args: unknown[]) =>
    downloadAssetOnPlatform(...args),
  downloadAssetLabelKey: () => 'image.inspector.download',
  isOpenCancelled: () => false,
}));

vi.mock('@/platforms/platform', () => ({
  getPlatform: () => 'web',
}));

vi.mock('@/ui/feedback/toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock('@/plugins/uiRegistry', async () => {
  const actual = await vi.importActual<typeof import('@/plugins/uiRegistry')>(
    '@/plugins/uiRegistry',
  );
  const registry = new actual.DefaultUiContributionRegistry();
  // 仅注册 other 降级，不注册 pdf，模拟插件未贡献预览
  const { contributeBuiltinKindUi } = await import(
    '@/plugins/contributeBuiltinKindUi'
  );
  contributeBuiltinKindUi(registry);
  return {
    ...actual,
    uiRegistry: registry,
  };
});

vi.mock('@/plugins/registries', () => ({
  kindRegistry: {
    matchHandler: () => undefined,
  },
  storageRegistry: {
    listManifests: () => [],
  },
}));

vi.mock('@/plugins/runtime', () => ({
  startPluginRuntime: () => [],
}));

const pdfAsset = {
  id: '1',
  name: 'notes.pdf',
  type: 'application/pdf',
  url: 'https://example.com/notes.pdf',
  localPath: null,
} as unknown as AssetItem;

describe('KindPreviewHost fallback', () => {
  it('falls back to download preview when no kind UI matches', () => {
    render(
      <KindPreviewHost
        asset={pdfAsset}
        src={pdfAsset.url}
        variant="modal"
        t={key => key}
      />,
    );

    expect(screen.getByText('notes.pdf')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'image.inspector.download' }),
    );
    expect(downloadAssetOnPlatform).toHaveBeenCalledWith(
      'web',
      expect.objectContaining({
        name: 'notes.pdf',
        url: 'https://example.com/notes.pdf',
      }),
    );
  });
});
