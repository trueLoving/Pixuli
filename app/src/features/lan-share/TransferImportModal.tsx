import { Archive, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEscapeKey } from '@/ui';
import { showError, showSuccess } from '@/ui/feedback/toast';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { useAssetStore } from '@/features/library/assetStore';
import { useUIStore } from '@/stores/uiStore';
import {
  importTransferPackageToFolder,
  parseTransferZipFile,
  type TransferImportPreview,
} from './importTransferPackage';
import {
  readRememberedImportFolder,
  rememberImportFolder,
  takePendingTransferSeedFile,
  useTransferImportStore,
} from './transferImportStore';
import './TransferImportModal.css';

interface TransferImportModalProps {
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const TransferImportModal: React.FC<TransferImportModalProps> = ({
  t,
}) => {
  const isOpen = useTransferImportStore(state => state.open);
  const sourceUrl = useTransferImportStore(state => state.sourceUrl);
  const requestId = useTransferImportStore(state => state.requestId);
  const closeImport = useTransferImportStore(state => state.closeImport);

  const localFolders = useWorkspaceStore(state => state.localFolders);
  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const loadAssets = useAssetStore(state => state.loadAssets);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<TransferImportPreview | null>(null);
  const [targetFolder, setTargetFolder] = useState('');
  const [busy, setBusy] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const folderOptions = useMemo(() => {
    const set = new Set<string>(['', ...localFolders]);
    if (selectedFolderPath) set.add(selectedFolderPath);
    const remembered = readRememberedImportFolder();
    if (remembered) set.add(remembered);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [localFolders, selectedFolderPath]);

  useEscapeKey(() => {
    if (isOpen && !busy) closeImport();
  }, isOpen);

  const handlePickFile = async (file: File) => {
    setParseError(null);
    setBusy(true);
    try {
      const next = await parseTransferZipFile(file);
      setPreview(next);
    } catch {
      setPreview(null);
      setParseError(t('settings.lanShare.importInvalid'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setPreview(null);
      setParseError(null);
      setBusy(false);
      setDragOver(false);
      return;
    }

    const remembered = readRememberedImportFolder();
    setTargetFolder(selectedFolderPath || remembered || '');

    const seed = takePendingTransferSeedFile();
    if (seed) {
      void handlePickFile(seed);
      return;
    }

    if (sourceUrl) {
      setBusy(true);
      void (async () => {
        try {
          const res = await fetch(sourceUrl);
          if (!res.ok) throw new Error('fetch failed');
          const blob = await res.blob();
          const file = new File([blob], 'pixuli-transfer.zip', {
            type: 'application/zip',
          });
          await handlePickFile(file);
        } catch {
          setParseError(t('settings.lanShare.importDeepLinkFetchFailed'));
          setBusy(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on each open request
  }, [isOpen, requestId, sourceUrl]);

  const handleImport = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const result = await importTransferPackageToFolder(preview, targetFolder);
      rememberImportFolder(targetFolder);
      await loadAssets();
      showSuccess(
        t('settings.lanShare.importDone', {
          imported: result.imported,
          skipped: result.skipped,
          failed: result.failed,
        }),
      );
      closeImport();
    } catch {
      showError(t('settings.lanShare.importFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="transfer-import-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-import-title"
      onClick={() => {
        if (!busy) closeImport();
      }}
    >
      <div
        className={
          dragOver
            ? 'transfer-import-panel transfer-import-panel--drag'
            : 'transfer-import-panel'
        }
        onClick={event => event.stopPropagation()}
        onDragEnter={event => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragOver={event => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={event => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragOver(false);
        }}
        onDrop={event => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files?.[0];
          if (file && /\.zip$/i.test(file.name)) {
            void handlePickFile(file);
          } else if (file) {
            setParseError(t('settings.lanShare.importInvalid'));
          }
        }}
      >
        <div className="transfer-import-header">
          <h2 id="transfer-import-title" className="transfer-import-title">
            <Archive size={18} aria-hidden />
            {t('settings.lanShare.importTitle')}
          </h2>
          <button
            type="button"
            className="transfer-import-close"
            onClick={closeImport}
            disabled={busy}
            aria-label={t('settings.close')}
          >
            <X size={18} />
          </button>
        </div>

        <p className="transfer-import-hint">
          {t('settings.lanShare.importHint')}
        </p>
        <p className="transfer-import-drop-hint">
          {t('settings.lanShare.importDropHint')}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          className="transfer-import-file-input"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void handlePickFile(file);
          }}
        />

        <button
          type="button"
          className="transfer-import-pick"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          {t('settings.lanShare.importPick')}
        </button>

        {parseError ? (
          <p className="transfer-import-error">{parseError}</p>
        ) : null}

        {preview ? (
          <div className="transfer-import-preview">
            <p className="transfer-import-count">
              {t('settings.lanShare.importCount', {
                count: preview.manifest.itemCount,
              })}
            </p>
            <ul className="transfer-import-list">
              {preview.manifest.items.slice(0, 8).map(item => (
                <li key={item.relativePath}>
                  <span className="transfer-import-item-name">{item.name}</span>
                  <span className="transfer-import-item-path">
                    {item.relativePath}
                  </span>
                </li>
              ))}
              {preview.manifest.itemCount > 8 ? (
                <li className="transfer-import-more">
                  {t('settings.lanShare.importMore', {
                    count: preview.manifest.itemCount - 8,
                  })}
                </li>
              ) : null}
            </ul>

            <label
              className="transfer-import-folder-label"
              htmlFor="transfer-target"
            >
              {t('settings.lanShare.importTarget')}
            </label>
            <select
              id="transfer-target"
              className="transfer-import-folder"
              value={targetFolder}
              disabled={busy}
              onChange={event => setTargetFolder(event.target.value)}
            >
              <option value="">{t('workspace.allImages')}</option>
              {folderOptions
                .filter(folder => folder)
                .map(folder => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
            </select>

            <button
              type="button"
              className="transfer-import-submit"
              disabled={busy}
              onClick={() => void handleImport()}
            >
              {busy
                ? t('settings.lanShare.importing')
                : t('settings.lanShare.importConfirm')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
