import React, { useState } from 'react';
import { Cloud, FolderOpen } from 'lucide-react';
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
  const { pickWorkspace, setRemoteOnlyMode, loading, error } =
    useWorkspaceStore();
  const loadImages = useImageStore(state => state.loadImages);
  const [pullAfter, setPullAfter] = useState(false);

  const finish = async () => {
    await loadImages();
    onComplete?.();
  };

  const handlePickLocal = async () => {
    const ok = await pickWorkspace({ pullAfter });
    if (ok) {
      await finish();
    }
  };

  const handleRemoteOnly = async () => {
    setRemoteOnlyMode();
    await finish();
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-lg mx-auto rounded-xl border border-blue-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('workspace.migrationTitle')}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {t('workspace.migrationHint', { count: sourceCount })}
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <FolderOpen className="mt-0.5 shrink-0 text-blue-600" size={22} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('workspace.migrationLocalTitle')}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {t('workspace.migrationLocalHint')}
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
                <button
                  type="button"
                  onClick={() => void handlePickLocal()}
                  disabled={loading}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <FolderOpen size={16} />
                  {loading
                    ? t('workspace.picking')
                    : t('workspace.migrationPickFolder')}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <Cloud className="mt-0.5 shrink-0 text-gray-600" size={22} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('workspace.migrationRemoteTitle')}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {t('workspace.migrationRemoteHint')}
                </p>
                <button
                  type="button"
                  onClick={() => void handleRemoteOnly()}
                  disabled={loading}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                >
                  <Cloud size={16} />
                  {t('workspace.migrationRemoteOnly')}
                </button>
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
