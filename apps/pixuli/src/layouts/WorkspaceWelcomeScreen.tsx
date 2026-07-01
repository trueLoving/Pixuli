import { FolderTree, Settings } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceMigrationWizard } from '@/features/workspace/WorkspaceMigrationWizard';
import { WorkspaceSetupPanel } from '@/features/workspace/WorkspaceSetupPanel';
import { useI18n } from '@/i18n/useI18n';
import { ROUTES } from '@/router/routes';
import { useSourceStore } from '@/stores/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import './WorkspaceWelcomeScreen.css';

export const WorkspaceWelcomeScreen: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const sourceCount = useSourceStore(state => state.sources.length);
  const openSettingsModal = useUIStore(state => state.openSettingsModal);
  const showMigration = sourceCount > 0;

  const handleOpened = () => {
    navigate(ROUTES.PHOTOS, { replace: true });
  };

  return (
    <div className="workspace-welcome">
      <div className="workspace-welcome-card">
        <div className="workspace-welcome-brand">
          <FolderTree size={40} strokeWidth={1.5} aria-hidden />
          <h1 className="workspace-welcome-title">
            {t('workspace.welcomeTitle')}
          </h1>
          <p className="workspace-welcome-subtitle">
            {t('workspace.welcomeSubtitle')}
          </p>
        </div>

        {showMigration ? (
          <WorkspaceMigrationWizard embedded onComplete={handleOpened} />
        ) : (
          <WorkspaceSetupPanel onOpened={handleOpened} />
        )}

        <div className="workspace-welcome-footer">
          <button
            type="button"
            className="workspace-welcome-settings-btn"
            onClick={() => openSettingsModal('sync')}
          >
            <Settings size={16} aria-hidden />
            {t('workspace.welcomeOpenSettings')}
          </button>
        </div>
      </div>
    </div>
  );
};
