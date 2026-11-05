import type { VersionInfo } from '@/features/settings/version-info';
import React, { Suspense, lazy } from 'react';
import { FullScreenLoading, Toaster } from '@/ui';
import { useI18n } from '@/i18n/useI18n';
import { useUIStore } from '@/stores/uiStore';
import { WebBrowserChrome } from '@/platforms';

const SettingsModal = lazy(() =>
  import('@/features/settings/SettingsModal').then(m => ({
    default: m.SettingsModal,
  })),
);
const WorkspaceModal = lazy(() =>
  import('@/features/workspace/WorkspaceModal').then(m => ({
    default: m.WorkspaceModal,
  })),
);
const SyncDirectionModal = lazy(() =>
  import('@/features/workspace/SyncDirectionModal').then(m => ({
    default: m.SyncDirectionModal,
  })),
);

interface MainLayoutModalsProps {
  showGlobalLoading: boolean;
  versionInfo: VersionInfo;
}

const ModalFallback = () => null;

export const MainLayoutModals: React.FC<MainLayoutModalsProps> = ({
  showGlobalLoading,
  versionInfo,
}) => {
  const { t } = useI18n();

  const {
    showSettingsModal,
    showWorkspaceModal,
    closeSettingsModal,
    closeWorkspaceModal,
  } = useUIStore();

  return (
    <>
      <Suspense fallback={<ModalFallback />}>
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={closeSettingsModal}
          t={t}
          versionInfo={versionInfo}
        />

        <WorkspaceModal
          isOpen={showWorkspaceModal}
          onClose={closeWorkspaceModal}
          t={t}
        />

        <SyncDirectionModal />
      </Suspense>

      <Toaster />

      <FullScreenLoading
        visible={showGlobalLoading}
        text={showGlobalLoading ? t('app.loadingResources') : undefined}
      />

      <WebBrowserChrome />
    </>
  );
};
