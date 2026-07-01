import { FolderOpen, FolderSync } from 'lucide-react';
import React from 'react';
import { useI18n } from '@/i18n/useI18n';
import {
  isFileSystemAccessSupported,
  isMobileWorkspaceActive,
  isOpfsSupported,
  isWebWorkspaceActive,
} from '@/platforms/workspacePlatform';
import { useImageStore } from '@/stores/imageStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import './workspace-setup.css';

export interface WorkspaceSetupPanelProps {
  onOpened?: () => void;
  className?: string;
}

export const WorkspaceSetupPanel: React.FC<WorkspaceSetupPanelProps> = ({
  onOpened,
  className = '',
}) => {
  const { t } = useI18n();
  const { pickWorkspace, loading, error } = useWorkspaceStore();
  const loadImages = useImageStore(state => state.loadImages);
  const isWebWorkspace = isWebWorkspaceActive();
  const isMobileWorkspace = isMobileWorkspaceActive();
  const canPickFolder = isWebWorkspace && isFileSystemAccessSupported();
  const canCreateOpfs = isWebWorkspace && isOpfsSupported();

  const handlePick = async (backend?: 'opfs' | 'fsa') => {
    const ok = await pickWorkspace(backend ? { backend } : undefined);
    if (ok) {
      await loadImages();
      onOpened?.();
    }
  };

  return (
    <div className={`workspace-setup-panel ${className}`.trim()}>
      <p className="workspace-setup-panel-hint">
        {isMobileWorkspace
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
      {error ? (
        <p className="workspace-setup-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
