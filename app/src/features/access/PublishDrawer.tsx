import { SettingsAccessPanel } from '@/features/access/SettingsAccessPanel';
import { useI18n } from '@/i18n/useI18n';
import { useUIStore } from '@/stores/uiStore';
import { X } from 'lucide-react';
import React from 'react';
import './PublishDrawer.css';

/** 独立发布抽屉：与同步入口分离（04-asset-library-ui §八） */
export const PublishDrawer: React.FC = () => {
  const { t } = useI18n();
  const isOpen = useUIStore(state => state.showPublishDrawer);
  const closePublishDrawer = useUIStore(state => state.closePublishDrawer);

  if (!isOpen) return null;

  return (
    <div className="publish-drawer-root" role="dialog" aria-modal="true">
      <button
        type="button"
        className="publish-drawer-backdrop"
        aria-label={t('access.close')}
        onClick={() => closePublishDrawer()}
      />
      <aside className="publish-drawer-panel">
        <header className="publish-drawer-header">
          <div>
            <h2>{t('access.publishDrawerTitle')}</h2>
            <p>{t('access.publishDrawerHint')}</p>
          </div>
          <button
            type="button"
            className="publish-drawer-close"
            aria-label={t('access.close')}
            onClick={() => closePublishDrawer()}
          >
            <X size={20} />
          </button>
        </header>
        <div className="publish-drawer-body">
          <SettingsAccessPanel t={t} />
        </div>
      </aside>
    </div>
  );
};
