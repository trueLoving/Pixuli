import { RefreshCw } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceMigrationWizard } from '@/features/workspace/WorkspaceMigrationWizard';
import { WorkspaceSetupPanel } from '@/features/workspace/WorkspaceSetupPanel';
import { useI18n } from '@/i18n/useI18n';
import { ROUTES } from '@/router/routes';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import './WorkspaceWelcomeScreen.css';

export const WorkspaceWelcomeScreen: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const sourceCount = useSourceStore(state => state.sources.length);
  const openSettingsModal = useUIStore(state => state.openSettingsModal);
  const showMigration = sourceCount > 0;

  const handleOpened = () => {
    navigate(ROUTES.LIBRARY, { replace: true });
  };

  return (
    <div className="workspace-welcome">
      <div className="workspace-welcome-card">
        <div className="workspace-welcome-brand">
          <div className="workspace-welcome-mark">
            <img
              src="/icon.png"
              alt=""
              className="workspace-welcome-logo"
              width={72}
              height={72}
            />
            <span className="workspace-welcome-pedestal" aria-hidden />
          </div>
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
            <RefreshCw size={16} aria-hidden />
            {t('workspace.welcomeOpenConnections')}
          </button>
        </div>
      </div>
    </div>
  );
};
