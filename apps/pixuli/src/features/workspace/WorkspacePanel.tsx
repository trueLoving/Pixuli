import React from 'react';
import {
  DownloadCloud,
  FolderOpen,
  FolderSync,
  RefreshCw,
  ScanSearch,
  UploadCloud,
} from 'lucide-react';
import {
  isFileSystemAccessSupported,
  isOpfsSupported,
  isWebWorkspaceActive,
} from '@/platforms/workspacePlatform';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useI18n } from '@/i18n/useI18n';

import { WorkspaceSourceSection } from './WorkspaceSourceSection';

function formatSyncTime(
  iso: string | null | undefined,
  t: (key: string) => string,
) {
  if (!iso) {
    return t('workspace.syncNever');
  }
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export const WorkspaceSetupPanel: React.FC = () => {
  const { t } = useI18n();
  const { pickWorkspace, loading, error } = useWorkspaceStore();
  const loadImages = useImageStore(state => state.loadImages);
  const isWebWorkspace = isWebWorkspaceActive();
  const canPickFolder = isWebWorkspace && isFileSystemAccessSupported();
  const canCreateOpfs = isWebWorkspace && isOpfsSupported();

  const handlePick = async (backend: 'opfs' | 'fsa') => {
    const ok = await pickWorkspace({ backend });
    if (ok) {
      await loadImages();
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-lg mx-auto rounded-xl border border-dashed border-blue-300 bg-blue-50/60 p-8 text-center">
        <FolderOpen className="mx-auto mb-4 text-blue-600" size={40} />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('workspace.setupTitle')}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {isWebWorkspace
            ? t('workspace.setupHintWebLocal')
            : t('workspace.setupHint')}
        </p>
        <div className="flex flex-col gap-3">
          {canPickFolder && (
            <button
              type="button"
              onClick={() => void handlePick('fsa')}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <FolderSync size={16} />
              {loading ? t('workspace.picking') : t('workspace.connectFolder')}
            </button>
          )}
          {canCreateOpfs && (
            <button
              type="button"
              onClick={() => void handlePick('opfs')}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${
                canPickFolder
                  ? 'border border-blue-300 bg-white text-blue-800 hover:bg-blue-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FolderOpen size={16} />
              {loading
                ? t('workspace.picking')
                : t('workspace.createWorkspace')}
            </button>
          )}
          {!isWebWorkspace && (
            <button
              type="button"
              onClick={() => void handlePick('opfs')}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <FolderOpen size={16} />
              {loading ? t('workspace.picking') : t('workspace.pickFolder')}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export const WorkspaceToolbar: React.FC = () => {
  const { t } = useI18n();
  const {
    displayName,
    rootPath,
    pushing,
    syncing,
    syncStatus,
    syncMessage,
    error,
    loading,
    pushPendingToRemote,
    pullFromRemote,
    runSync,
    scanWorkspace,
    pickWorkspace,
    clearWorkspace,
    clearError,
  } = useWorkspaceStore();
  const loadImages = useImageStore(state => state.loadImages);
  const sources = useSourceStore(state => state.sources);
  const hasRemote = sources.length > 0;
  const busy = pushing || syncing || loading;
  const isWebWorkspace = isWebWorkspaceActive();
  const canPickFolder = isWebWorkspace && isFileSystemAccessSupported();
  const canCreateOpfs = isWebWorkspace && isOpfsSupported();

  const handleSwitchWorkspace = async (backend: 'opfs' | 'fsa') => {
    const ok = await pickWorkspace({ backend });
    if (ok) {
      await loadImages();
    }
  };

  const handleClearWorkspace = () => {
    if (!window.confirm(t('workspace.clearConfirm'))) {
      return;
    }
    void clearWorkspace().then(() => loadImages());
  };

  return (
    <div className="workspace-toolbar mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {t('workspace.current')}: {displayName || t('workspace.unnamed')}
          </p>
          {rootPath?.startsWith('fsa://') && (
            <p className="text-xs text-gray-500">{t('workspace.fsaStorage')}</p>
          )}
          {rootPath?.startsWith('opfs://') && (
            <p className="text-xs text-gray-500">{t('workspace.webStorage')}</p>
          )}
          {rootPath &&
            !rootPath.startsWith('opfs://') &&
            !rootPath.startsWith('fsa://') && (
              <p className="text-xs text-gray-500 truncate" title={rootPath}>
                {rootPath}
              </p>
            )}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-gray-700 border border-gray-200">
              {t('workspace.lastSync')}:{' '}
              {formatSyncTime(syncStatus?.lastSyncAt, t)}
            </span>
            {(syncStatus?.pendingPush ?? 0) > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {t('workspace.pendingPush', {
                  count: syncStatus?.pendingPush ?? 0,
                })}
              </span>
            )}
            {(syncStatus?.conflicts ?? 0) > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                {t('workspace.conflicts', {
                  count: syncStatus?.conflicts ?? 0,
                })}
              </span>
            )}
          </div>
        </div>
        <div className="workspace-toolbar-actions flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void scanWorkspace()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
          >
            <ScanSearch size={16} />
            {t('workspace.scan')}
          </button>
          <button
            type="button"
            onClick={() => void pullFromRemote()}
            disabled={busy || !hasRemote}
            title={hasRemote ? undefined : t('workspace.pullNeedsRemote')}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadCloud size={16} />
            {syncing ? t('workspace.pulling') : t('workspace.pullManual')}
          </button>
          <button
            type="button"
            onClick={() => void pushPendingToRemote()}
            disabled={busy || !hasRemote}
            title={hasRemote ? undefined : t('workspace.pushNeedsRemote')}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadCloud size={16} />
            {pushing ? t('workspace.pushing') : t('workspace.pushManual')}
          </button>
          <button
            type="button"
            onClick={() => void runSync('both')}
            disabled={busy || !hasRemote}
            title={hasRemote ? undefined : t('workspace.syncNeedsRemote')}
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} />
            {syncing ? t('workspace.syncing') : t('workspace.syncBoth')}
          </button>
        </div>
      </div>
      {syncMessage && (
        <p className="mt-2 text-xs text-green-700">{syncMessage}</p>
      )}
      {error && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-red-600">{error}</p>
          <button
            type="button"
            className="text-xs text-red-700 hover:underline"
            onClick={clearError}
          >
            {t('workspace.dismiss')}
          </button>
        </div>
      )}
      {!hasRemote && (
        <p className="mt-2 text-xs text-amber-700">
          {t('workspace.pushNeedsRemote')}
        </p>
      )}

      <div className="mt-3 border-t border-gray-200 pt-3">
        <p className="text-xs font-medium text-gray-700 mb-2">
          {t('workspace.manageTitle')}
        </p>
        <div className="workspace-toolbar-actions flex flex-wrap gap-2">
          {canPickFolder && (
            <button
              type="button"
              onClick={() => void handleSwitchWorkspace('fsa')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
            >
              <FolderSync size={16} />
              {loading ? t('workspace.picking') : t('workspace.switchFolder')}
            </button>
          )}
          {canCreateOpfs && (
            <button
              type="button"
              onClick={() => void handleSwitchWorkspace('opfs')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
            >
              <FolderOpen size={16} />
              {loading ? t('workspace.picking') : t('workspace.switchOpfs')}
            </button>
          )}
          {!isWebWorkspace && (
            <button
              type="button"
              onClick={() => void handleSwitchWorkspace('opfs')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
            >
              <FolderOpen size={16} />
              {loading ? t('workspace.picking') : t('workspace.switchFolder')}
            </button>
          )}
          <button
            type="button"
            onClick={handleClearWorkspace}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {t('workspace.clearWorkspace')}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {t('workspace.manageHint')}
        </p>
      </div>

      <WorkspaceSourceSection showDivider />
    </div>
  );
};
