import { FolderInput, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import './AssetLibraryBatchEditModal.css';

export interface AssetLibraryBatchMoveModalProps {
  isOpen: boolean;
  selectedCount: number;
  folders: string[];
  t: (key: string) => string;
  onClose: () => void;
  onSubmit: (targetDir: string) => Promise<void>;
}

export const AssetLibraryBatchMoveModal: React.FC<
  AssetLibraryBatchMoveModalProps
> = ({ isOpen, selectedCount, folders, t, onClose, onSubmit }) => {
  const [targetDir, setTargetDir] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTargetDir('');
    setBusy(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const options = ['', ...folders.filter(folder => folder.length > 0)];

  return (
    <div className="asset-library-batch-edit-overlay" role="presentation">
      <div
        className="asset-library-batch-edit-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-move-title"
      >
        <div className="asset-library-batch-edit-header">
          <h2 id="batch-move-title" className="asset-library-batch-edit-title">
            {t('image.library.batchMoveTitle')}
          </h2>
          <button
            type="button"
            className="asset-library-batch-edit-close"
            onClick={onClose}
            aria-label={t('common.cancel')}
          >
            <X size={18} />
          </button>
        </div>
        <p className="asset-library-batch-edit-scope">
          {t('image.library.batchMoveScope').replace(
            '{count}',
            String(selectedCount),
          )}
        </p>
        <form
          className="asset-library-batch-edit-form"
          onSubmit={event => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            void onSubmit(targetDir).finally(() => setBusy(false));
          }}
        >
          <div className="asset-library-batch-edit-field">
            <label htmlFor="batch-move-folder">
              {t('image.library.batchMoveFolder')}
            </label>
            <select
              id="batch-move-folder"
              value={targetDir}
              onChange={event => setTargetDir(event.target.value)}
            >
              {options.map(folder => (
                <option key={folder || 'root'} value={folder}>
                  {folder || t('image.library.batchMoveRoot')}
                </option>
              ))}
            </select>
          </div>
          <div className="asset-library-batch-edit-actions">
            <button type="button" onClick={onClose} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={busy || selectedCount === 0}>
              <FolderInput size={16} aria-hidden />
              {t('image.library.batchMoveConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
