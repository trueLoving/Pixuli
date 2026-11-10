import type { VersionInfo } from '@/features/settings/version-info';
import React, { Suspense, lazy } from 'react';
import { FullScreenLoading, Toaster } from '@/ui';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
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
  // 欢迎页选夹时强制不渲染设置/工作区弹窗，避免系统对话框背后残留
  const suppressOverlays = useWorkspaceStore(
    state => state.loading && state.mode === 'unset',
  );
  const settingsOpen = showSettingsModal && !suppressOverlays;
  const workspaceOpen = showWorkspaceModal && !suppressOverlays;

  return (
    <>
      <Suspense fallback={<ModalFallback />}>
        <SettingsModal
          isOpen={settingsOpen}
          onClose={closeSettingsModal}
          t={t}
          versionInfo={versionInfo}
        />

        <WorkspaceModal
          isOpen={workspaceOpen}
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
