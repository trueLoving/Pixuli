import React, { useState } from 'react';
import { FolderOpen, FolderSync } from 'lucide-react';
import {
  isFileSystemAccessSupported,
  isMobileWorkspaceActive,
  isOpfsSupported,
  isWebWorkspaceActive,
} from '@/platforms/workspacePlatform';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useI18n } from '@/i18n/useI18n';

interface WorkspaceMigrationWizardProps {
  onComplete?: () => void;
}

export const WorkspaceMigrationWizard: React.FC<
  WorkspaceMigrationWizardProps
> = ({ onComplete }) => {
  const { t } = useI18n();
  const sourceCount = useSourceStore(state => state.sources.length);
  const { pickWorkspace, loading, error } = useWorkspaceStore();
  const loadImages = useImageStore(state => state.loadImages);
  const [pullAfter, setPullAfter] = useState(false);
  const isWebWorkspace = isWebWorkspaceActive();
  const isMobileWorkspace = isMobileWorkspaceActive();
  const canPickFolder = isWebWorkspace && isFileSystemAccessSupported();
  const canCreateOpfs = isWebWorkspace && isOpfsSupported();

  const finish = async () => {
    await loadImages();
    onComplete?.();
  };

  const handlePickLocal = async (backend?: 'opfs' | 'fsa') => {
    const ok = await pickWorkspace(
      backend ? { pullAfter, backend } : { pullAfter },
    );
    if (ok) {
      await finish();
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-lg mx-auto rounded-xl border border-blue-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('workspace.migrationTitle')}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {isMobileWorkspace
            ? t('workspace.migrationHintMobile', { count: sourceCount })
            : isWebWorkspace
              ? t('workspace.migrationHintWebLocal', { count: sourceCount })
              : t('workspace.migrationHint', { count: sourceCount })}
        </p>

        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <FolderOpen className="mt-0.5 shrink-0 text-blue-600" size={22} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {isMobileWorkspace
                  ? t('workspace.migrationLocalTitleMobile')
                  : isWebWorkspace
                    ? t('workspace.migrationLocalTitleWeb')
                    : t('workspace.migrationLocalTitle')}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {isMobileWorkspace
                  ? t('workspace.migrationLocalHintMobile')
                  : isWebWorkspace
                    ? t('workspace.migrationLocalHintWeb')
                    : t('workspace.migrationLocalHint')}
              </p>
              <label className="mt-3 flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={pullAfter}
                  onChange={event => setPullAfter(event.target.checked)}
                  className="rounded border-gray-300"
                />
                {t('workspace.migrationPullAfter')}
              </label>
              <div className="mt-3 flex flex-col gap-2">
                {isMobileWorkspace && (
                  <button
                    type="button"
                    onClick={() => void handlePickLocal()}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
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
                    onClick={() => void handlePickLocal('fsa')}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <FolderSync size={16} />
                    {loading
                      ? t('workspace.picking')
                      : t('workspace.connectFolder')}
                  </button>
                )}
                {canCreateOpfs && (
                  <button
                    type="button"
                    onClick={() => void handlePickLocal('opfs')}
                    disabled={loading}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${
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
                    onClick={() => void handlePickLocal()}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <FolderOpen size={16} />
                    {loading
                      ? t('workspace.picking')
                      : t('workspace.migrationPickFolder')}
                  </button>
                )}
              </div>
            </div>
          </div>
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
