import { CloudDownload, CloudUpload, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useEscapeKey } from '@/ui';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/features/library/imageStore';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { runSyncWithFeedback } from './syncFeedback';
import { formatSyncTargetLabel } from './syncTargetLabel';

export type SyncDirectionChoice = 'pull' | 'push';

/**
 * 点击「同步」后选择方向：远端→本地 / 本地→远端。
 * 仓库用设置里的当前同步目标，这里只说明，不切换。
 */
export const SyncDirectionModal: React.FC = () => {
  const { t } = useI18n();
  const isOpen = useUIStore(state => state.showSyncDirectionModal);
  const close = useUIStore(state => state.closeSyncDirectionModal);
  const syncing = useWorkspaceStore(state => state.syncing);
  const pendingPush = useWorkspaceStore(
    state => state.syncStatus?.pendingPush ?? 0,
  );
  const loadImages = useImageStore(state => state.loadImages);
  const sources = useSourceStore(state => state.sources);
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const [running, setRunning] = useState(false);
  const [activeDirection, setActiveDirection] =
    useState<SyncDirectionChoice | null>(null);
  const preferPush = pendingPush > 0;
  const activeSource = selectedSourceId
    ? sources.find(item => item.id === selectedSourceId)
    : sources[0];
  const targetLabel = formatSyncTargetLabel(
    activeSource,
    t('settings.noSyncTarget'),
  );

  useEscapeKey(() => {
    if (isOpen && !running && !syncing) close();
  }, isOpen);

  if (!isOpen) return null;

  const busy = running || syncing;
  const loadingLabel =
    activeDirection === 'pull'
      ? t('workspace.pulling')
      : activeDirection === 'push'
        ? t('workspace.pushing')
        : t('workspace.syncing');

  const handleChoose = async (direction: SyncDirectionChoice) => {
    if (busy) return;
    setRunning(true);
    setActiveDirection(direction);
    try {
      await runSyncWithFeedback(direction, t);
      await loadImages();
      close();
    } finally {
      setRunning(false);
      setActiveDirection(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-direction-title"
      onClick={() => {
        if (!busy) close();
      }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={event => event.stopPropagation()}
      >
        {busy ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2
              size={32}
              className="animate-spin pix-icon-accent"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-gray-800">
              {loadingLabel}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2
            id="sync-direction-title"
            className="text-lg font-semibold text-gray-900"
          >
            {t('workspace.syncChooseTitle')}
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40"
            aria-label={t('settings.close')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          <p className="text-sm text-gray-500">
            {preferPush
              ? t('workspace.syncChooseHintPending', { count: pendingPush })
              : t('workspace.syncChooseHint')}
          </p>
          <p className="text-sm text-gray-800">
            {t('workspace.syncTo', { target: targetLabel })}
          </p>

          {(preferPush
            ? (['push', 'pull'] as const)
            : (['pull', 'push'] as const)
          ).map(direction => {
            const isPush = direction === 'push';
            return (
              <button
                key={direction}
                type="button"
                disabled={busy}
                onClick={() => void handleChoose(direction)}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors pix-hover-card disabled:opacity-50 ${
                  preferPush && isPush
                    ? 'border-[var(--pix-violet,#7c6cf0)] bg-[var(--pix-violet-soft,#ede9fe)]/40'
                    : 'border-gray-200'
                }`}
              >
                {isPush ? (
                  <CloudUpload
                    size={22}
                    className="mt-0.5 shrink-0 pix-icon-accent"
                    aria-hidden
                  />
                ) : (
                  <CloudDownload
                    size={22}
                    className="mt-0.5 shrink-0 pix-icon-accent"
                    aria-hidden
                  />
                )}
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    {isPush
                      ? t('workspace.syncPushOption')
                      : t('workspace.syncPullOption')}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {isPush
                      ? t('workspace.syncPushHint')
                      : t('workspace.syncPullHint')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
