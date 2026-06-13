import React from 'react';
import { FolderOpen, UploadCloud } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useI18n } from '@/i18n/useI18n';

export const WorkspaceSetupPanel: React.FC = () => {
  const { t } = useI18n();
  const { pickWorkspace, loading, error } = useWorkspaceStore();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-lg mx-auto rounded-xl border border-dashed border-blue-300 bg-blue-50/60 p-8 text-center">
        <FolderOpen className="mx-auto mb-4 text-blue-600" size={40} />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('workspace.setupTitle')}
        </h2>
        <p className="text-sm text-gray-600 mb-6">{t('workspace.setupHint')}</p>
        <button
          type="button"
          onClick={() => void pickWorkspace()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <FolderOpen size={16} />
          {loading ? t('workspace.picking') : t('workspace.pickFolder')}
        </button>
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
    syncMessage,
    error,
    pushPendingToRemote,
    clearError,
  } = useWorkspaceStore();
  const sources = useSourceStore(state => state.sources);
  const hasRemote = sources.length > 0;

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {t('workspace.current')}: {displayName || t('workspace.unnamed')}
          </p>
          {rootPath && (
            <p className="text-xs text-gray-500 truncate" title={rootPath}>
              {rootPath}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void pushPendingToRemote()}
          disabled={pushing || !hasRemote}
          title={hasRemote ? undefined : t('workspace.pushNeedsRemote')}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadCloud size={16} />
          {pushing ? t('workspace.pushing') : t('workspace.pushManual')}
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
          {t('workspace.pushNeedsRemote')}
        </p>
      )}
    </div>
  );
};
