import { FolderSync } from 'lucide-react';
import React from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/features/library/imageStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';

interface WorkspaceReconnectCardProps {
  onReconnected?: () => void;
  className?: string;
}

function resolveWorkspaceError(
  error: string | null,
  t: (key: string) => string,
): string | null {
  if (!error) return null;
  if (error.startsWith('workspace.')) {
    return t(error);
  }
  if (/permission|denied/i.test(error)) {
    return t('workspace.reconnectPermissionError');
  }
  if (/handle not found|pick the folder again/i.test(error)) {
    return t('workspace.reconnectMissingHandleError');
  }
  return error;
}

/** Web FSA：引导用户在手势下重新授权或重选已保存文件夹 */
export const WorkspaceReconnectCard: React.FC<WorkspaceReconnectCardProps> = ({
  onReconnected,
  className = '',
}) => {
  const { t } = useI18n();
  const reconnect = useWorkspaceStore(state => state.reconnect);
  const loading = useWorkspaceStore(state => state.loading);
  const error = useWorkspaceStore(state => state.error);
  const reconnectWorkspace = useWorkspaceStore(
    state => state.reconnectWorkspace,
  );
  const loadImages = useImageStore(state => state.loadImages);

  if (!reconnect) {
    return null;
  }

  const folderName = reconnect.folderLabel?.trim() || t('workspace.unnamed');
  const hintKey =
    reconnect.reason === 'missing_handle'
      ? 'workspace.reconnectMissingHandleHint'
      : 'workspace.reconnectPermissionHint';
  const displayError = resolveWorkspaceError(error, t);

  const handleReconnect = async () => {
    const ok = await reconnectWorkspace();
    if (ok) {
      await loadImages();
      onReconnected?.();
    }
  };

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 ${className}`.trim()}
      role="status"
    >
      <p className="text-sm font-medium text-amber-950">
        {t('workspace.reconnectTitle')}
      </p>
      <p className="mt-1 text-xs text-amber-900/90">
        {t(hintKey, { name: folderName })}
      </p>
      <button
        type="button"
        onClick={() => void handleReconnect()}
        disabled={loading}
        className="mt-3 inline-flex items-center justify-center gap-2 pix-btn-primary px-3 py-1.5 text-sm disabled:opacity-60"
      >
        <FolderSync size={16} aria-hidden />
        {loading ? t('workspace.picking') : t('workspace.reconnectAction')}
      </button>
      {displayError ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
};
