import { FolderOpen, FolderSync } from 'lucide-react';
import React from 'react';
import { useI18n } from '@/i18n/useI18n';
import {
  isFileSystemAccessSupported,
  isMobileWorkspaceActive,
  isOpfsSupported,
  isWebWorkspaceActive,
} from '@/platforms/workspacePlatform';
import { useImageStore } from '@/features/library/imageStore';
import { WorkspaceReconnectCard } from '@/features/workspace/WorkspaceReconnectCard';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import './workspace-setup.css';

export interface WorkspaceSetupPanelProps {
  onOpened?: () => void;
  className?: string;
}

function formatSetupError(
  error: string | null,
  t: (key: string) => string,
): string | null {
  if (!error) return null;
  if (error.startsWith('workspace.')) {
    return t(error);
  }
  return error;
}

export const WorkspaceSetupPanel: React.FC<WorkspaceSetupPanelProps> = ({
  onOpened,
  className = '',
}) => {
  const { t } = useI18n();
  const { pickWorkspace, loading, error, reconnect } = useWorkspaceStore();
  const loadImages = useImageStore(state => state.loadImages);
  const isWebWorkspace = isWebWorkspaceActive();
  const isMobileWorkspace = isMobileWorkspaceActive();
  const canPickFolder = isWebWorkspace && isFileSystemAccessSupported();
  const canCreateOpfs = isWebWorkspace && isOpfsSupported();
  const displayError = reconnect ? null : formatSetupError(error, t);

  const handlePick = async (backend?: 'opfs' | 'fsa') => {
    const ok = await pickWorkspace(backend ? { backend } : undefined);
    if (ok) {
      await loadImages();
      onOpened?.();
    }
  };

  return (
    <div className={`workspace-setup-panel ${className}`.trim()}>
      {reconnect ? (
        <WorkspaceReconnectCard
          onReconnected={onOpened}
          className="workspace-setup-reconnect"
        />
      ) : null}
      <p className="workspace-setup-panel-hint">
        {reconnect
          ? t('workspace.reconnectOrPickOther')
          : isMobileWorkspace
            ? t('workspace.setupHintMobile')
            : isWebWorkspace
              ? t('workspace.setupHintWebLocal')
              : t('workspace.setupHint')}
      </p>
      <div className="workspace-setup-panel-actions">
        {isMobileWorkspace && (
          <button
            type="button"
            onClick={() => void handlePick()}
            disabled={loading}
            className="workspace-setup-primary-btn"
          >
            <FolderOpen size={16} aria-hidden />
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
            className="workspace-setup-primary-btn"
          >
            <FolderSync size={16} aria-hidden />
            {loading ? t('workspace.picking') : t('workspace.connectFolder')}
          </button>
        )}
        {canCreateOpfs && (
          <button
            type="button"
            onClick={() => void handlePick('opfs')}
            disabled={loading}
            className={
              canPickFolder
                ? 'workspace-setup-secondary-btn'
                : 'workspace-setup-primary-btn'
            }
          >
            <FolderOpen size={16} aria-hidden />
            {loading ? t('workspace.picking') : t('workspace.createWorkspace')}
          </button>
        )}
        {!isWebWorkspace && !isMobileWorkspace && (
          <button
            type="button"
            onClick={() => void handlePick()}
            disabled={loading}
            className="workspace-setup-primary-btn"
          >
            <FolderOpen size={16} aria-hidden />
            {loading ? t('workspace.picking') : t('workspace.pickFolder')}
          </button>
        )}
      </div>
      {displayError ? (
        <p className="workspace-setup-error" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
};
