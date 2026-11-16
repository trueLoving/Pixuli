import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceMigrationWizard } from '@/features/workspace/WorkspaceMigrationWizard';
import { WorkspaceSetupPanel } from '@/features/workspace/WorkspaceSetupPanel';
import { useI18n } from '@/i18n/useI18n';
import { ROUTES } from '@/router/routes';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import { BrandPixelMark } from '@/ui/brand/BrandPixelMark';
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
      <div className="workspace-welcome-atmosphere" aria-hidden />
      <div className="workspace-welcome-shell">
        <header className="workspace-welcome-brand">
          <BrandPixelMark
            variant="welcome"
            size={112}
            className="workspace-welcome-mark"
          />
          <p className="workspace-welcome-name">Pixuli</p>
          <h1 className="workspace-welcome-title">
            {t('workspace.welcomeTitle')}
          </h1>
          <p className="workspace-welcome-subtitle">
            {t('workspace.welcomeSubtitle')}
          </p>
        </header>

        <section
          className="workspace-welcome-action"
          aria-label={t('workspace.welcomeTitle')}
        >
          {showMigration ? (
            <WorkspaceMigrationWizard embedded onComplete={handleOpened} />
          ) : (
            <WorkspaceSetupPanel onOpened={handleOpened} />
          )}
        </section>

        <footer className="workspace-welcome-footer">
          <button
            type="button"
            className="workspace-welcome-secondary-link"
            onClick={() => openSettingsModal('sync')}
          >
            {t('workspace.welcomeOpenConnections')}
          </button>
        </footer>
      </div>
    </div>
  );
};
