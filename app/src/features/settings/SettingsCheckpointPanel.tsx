import type { SyncCheckpointMeta } from '@pixuli/core/vault';
import { History, Loader2, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useImageStore } from '@/features/library/imageStore';
import { runRestoreCheckpointWithFeedback } from '@/features/workspace/syncFeedback';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { useI18n } from '@/i18n/useI18n';
import { showSuccess } from '@/ui/feedback/toast';

interface SettingsCheckpointPanelProps {
  t: (key: string, params?: Record<string, string | number>) => string;
}

function formatCheckpointTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const SettingsCheckpointPanel: React.FC<
  SettingsCheckpointPanelProps
> = ({ t }) => {
  const { getCurrentLanguage } = useI18n();
  const mode = useWorkspaceStore(state => state.mode);
  const syncing = useWorkspaceStore(state => state.syncing);
  const getLatestCheckpointMeta = useWorkspaceStore(
    state => state.getLatestCheckpointMeta,
  );
  const clearCheckpoint = useWorkspaceStore(state => state.clearCheckpoint);
  const loadImages = useImageStore(state => state.loadImages);
  const [meta, setMeta] = useState<SyncCheckpointMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [busy, setBusy] = useState(false);

  const refreshMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      setMeta(await getLatestCheckpointMeta());
    } finally {
      setLoadingMeta(false);
    }
  }, [getLatestCheckpointMeta]);

  useEffect(() => {
    void refreshMeta();
  }, [refreshMeta]);

  if (mode !== 'local') {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.checkpoint.title')}
        </h3>
        <p className="text-sm text-gray-500">
          {t('settings.checkpoint.needsLocal')}
        </p>
      </div>
    );
  }

  const handleRestore = async () => {
    if (busy || syncing || !meta) return;
    if (!window.confirm(t('settings.checkpoint.restoreConfirm'))) return;
    setBusy(true);
    try {
      await runRestoreCheckpointWithFeedback(t);
      await loadImages();
      await refreshMeta();
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    if (busy || syncing || !meta) return;
    if (!window.confirm(t('settings.checkpoint.clearConfirm'))) return;
    setBusy(true);
    try {
      await clearCheckpoint();
      showSuccess(t('settings.checkpoint.clearDone'));
      await refreshMeta();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.checkpoint.title')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t('settings.checkpoint.hint')}
        </p>
      </div>

      {loadingMeta ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          {t('settings.checkpoint.loading')}
        </div>
      ) : !meta ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          {t('settings.checkpoint.empty')}
        </p>
      ) : (
        <div className="rounded-lg border border-gray-200 px-4 py-3">
          <div className="flex items-start gap-3">
            <History
              size={20}
              className="mt-0.5 shrink-0 pix-icon-accent"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {t('settings.checkpoint.latestLabel')}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t('settings.checkpoint.latestMeta', {
                  time: formatCheckpointTime(
                    meta.createdAt,
                    getCurrentLanguage(),
                  ),
                  files: meta.fileCount,
                  folders: meta.folderCount,
                })}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || syncing}
              onClick={() => void handleRestore()}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 sm:min-h-0 sm:py-1.5"
            >
              {busy || syncing ? (
                <Loader2 size={14} className="animate-spin" aria-hidden />
              ) : null}
              {t('settings.checkpoint.restore')}
            </button>
            <button
              type="button"
              disabled={busy || syncing}
              onClick={() => void handleClear()}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:min-h-0 sm:py-1.5"
            >
              <Trash2 size={14} aria-hidden />
              {t('settings.checkpoint.clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
