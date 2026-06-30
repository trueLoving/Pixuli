import { FolderOpen, FolderSync, ScanSearch } from 'lucide-react';
import React from 'react';
import { useI18n } from '@/i18n/useI18n';
import {
  isFileSystemAccessSupported,
  isMobileWorkspaceActive,
  isOpfsSupported,
  isWebWorkspaceActive,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

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

export const WorkspaceManagePanel: React.FC = () => {
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
    scanWorkspace,
    pickWorkspace,
    clearWorkspace,
    clearError,
    isLocalActive,
  } = useWorkspaceStore();
  const loadImages = useImageStore(state => state.loadImages);
  const sources = useSourceStore(state => state.sources);
  const hasRemote = sources.length > 0;
  const busy = pushing || syncing || loading;
  const localActive = isLocalActive();
  const isWebWorkspace = isWebWorkspaceActive();
  const isMobileWorkspace = isMobileWorkspaceActive();
  const canPickFolder = isWebWorkspace && isFileSystemAccessSupported();
  const canCreateOpfs = isWebWorkspace && isOpfsSupported();

  if (!isWorkspaceAvailable()) {
    return (
      <p className="text-sm text-gray-500">
        {t('settings.workspaceUnavailable')}
      </p>
    );
  }

  const handlePick = async (backend?: 'opfs' | 'fsa') => {
    const ok = await pickWorkspace(backend ? { backend } : undefined);
    if (ok) {
      await loadImages();
    }
  };

  const handleSwitchWorkspace = async (backend?: 'opfs' | 'fsa') => {
    const ok = await pickWorkspace(backend ? { backend } : undefined);
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

  if (!localActive) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {t('workspace.setupTitle')}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {isMobileWorkspace
              ? t('workspace.setupHintMobile')
              : isWebWorkspace
                ? t('workspace.setupHintWebLocal')
                : t('workspace.setupHint')}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isMobileWorkspace && (
            <button
              type="button"
              onClick={() => void handlePick()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <FolderOpen size={16} />
              {loading
                ? t('workspace.picking')
                : t('workspace.createMobileWorkspace')}
            </button>
          )}
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
          {!isWebWorkspace && !isMobileWorkspace && (
            <button
              type="button"
              onClick={() => void handlePick()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <FolderOpen size={16} />
              {loading ? t('workspace.picking') : t('workspace.pickFolder')}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.workspaceCurrentTitle')}
        </h3>
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-medium text-gray-900">
            {displayName || t('workspace.unnamed')}
          </p>
          {rootPath?.startsWith('mobile://') && (
            <p className="mt-1 text-xs text-gray-500">
              {t('workspace.mobileStorage')}
            </p>
          )}
          {rootPath?.startsWith('fsa://') && (
            <p className="mt-1 text-xs text-gray-500">
              {t('workspace.fsaStorage')}
            </p>
          )}
          {rootPath?.startsWith('opfs://') && (
            <p className="mt-1 text-xs text-gray-500">
              {t('workspace.webStorage')}
            </p>
          )}
          {rootPath &&
            !rootPath.startsWith('opfs://') &&
            !rootPath.startsWith('fsa://') &&
            !rootPath.startsWith('mobile://') && (
              <p
                className="mt-1 truncate text-xs text-gray-500"
                title={rootPath}
              >
                {rootPath}
              </p>
            )}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700">
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
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void scanWorkspace()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
          >
            <ScanSearch size={16} />
            {t('workspace.scan')}
          </button>
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
            {t('settings.workspaceNoRemoteHint')}
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('workspace.manageTitle')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t('workspace.manageHint')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
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
          {isMobileWorkspace && (
            <button
              type="button"
              onClick={() => void handleSwitchWorkspace()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
            >
              <FolderOpen size={16} />
              {loading
                ? t('workspace.picking')
                : t('workspace.switchMobileWorkspace')}
            </button>
          )}
          {!isWebWorkspace && !isMobileWorkspace && (
            <button
              type="button"
              onClick={() => void handleSwitchWorkspace()}
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
      </section>
    </div>
  );
};
