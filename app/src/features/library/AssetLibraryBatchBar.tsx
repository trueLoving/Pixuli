import { RefreshCw, Trash2, Wand2 } from 'lucide-react';
import React from 'react';

export interface AssetLibraryBatchBarProps {
  selectedCount: number;
  allImagesSelected: boolean;
  t: (key: string) => string;
  onBatchDownload: () => void;
  onSync?: () => void;
  onOpenAccess?: () => void;
  onSendCompress?: () => void;
  onSendConvert?: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
  canDelete: boolean;
}

export const AssetLibraryBatchBar: React.FC<AssetLibraryBatchBarProps> = ({
  selectedCount,
  allImagesSelected,
  t,
  onBatchDownload,
  onSync,
  onOpenAccess,
  onSendCompress,
  onSendConvert,
  onBatchDelete,
  onClearSelection,
  canDelete,
}) => (
  <div className="asset-library-batch" role="toolbar">
    <span className="asset-library-batch-count">
      {t('image.library.selectedCount').replace(
        '{count}',
        String(selectedCount),
      )}
    </span>
    <button
      type="button"
      className="asset-library-chrome-btn"
      onClick={onBatchDownload}
    >
      {t('image.library.batchDownload')}
    </button>
    <button
      type="button"
      className="asset-library-chrome-btn"
      onClick={onSync}
      disabled={!onSync}
    >
      <RefreshCw size={16} aria-hidden />
      {t('image.toolbar.sync')}
    </button>
    <button
      type="button"
      className="asset-library-chrome-btn"
      onClick={onOpenAccess}
      disabled={!onOpenAccess}
    >
      {t('image.toolbar.access')}
    </button>
    <button
      type="button"
      className="asset-library-chrome-btn"
      disabled={!allImagesSelected || !onSendCompress}
      title={allImagesSelected ? undefined : t('image.inspector.toolImageOnly')}
      onClick={() => {
        if (!allImagesSelected) return;
        onSendCompress?.();
      }}
    >
      {t('image.inspector.sendCompress')}
    </button>
    <button
      type="button"
      className="asset-library-chrome-btn"
      disabled={!allImagesSelected || !onSendConvert}
      title={allImagesSelected ? undefined : t('image.inspector.toolImageOnly')}
      onClick={() => {
        if (!allImagesSelected) return;
        onSendConvert?.();
      }}
    >
      <Wand2 size={16} aria-hidden />
      {t('image.inspector.sendConvert')}
    </button>
    <button
      type="button"
      className="asset-library-chrome-btn asset-library-batch-delete"
      onClick={() => void onBatchDelete()}
      disabled={!canDelete}
    >
      <Trash2 size={16} aria-hidden />
      {t('image.library.deleteSelected')}
    </button>
    <button
      type="button"
      className="asset-library-chrome-btn"
      onClick={onClearSelection}
    >
      {t('image.library.clearSelection')}
    </button>
  </div>
);
