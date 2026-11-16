/**
 * 主布局组件
 * 包含侧边栏、主内容区域和所有弹窗组件
 */

import type { AppMainLayoutProps } from '@/hooks/useAppOrchestration';
import type { VersionInfo } from '@/features/settings/version-info';
import React, { useEffect } from 'react';
import { useRouteSync } from '@/hooks/useRouteSync';
import { useI18n } from '@/i18n/useI18n';
import { useSourceSelection } from '@/features/library/useSourceSelection';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { useUIStore } from '@/stores/uiStore';
import { MainLayoutModals } from './MainLayoutModals';
import { AppMain } from './AppMain';
import { AppSidebar } from './AppSidebar';
import { WorkspaceShell } from './WorkspaceShell';
import { WorkspaceWelcomeScreen } from './WorkspaceWelcomeScreen';

declare const __VERSION_INFO__: VersionInfo;

interface MainLayoutProps extends AppMainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  sidebarSources,
  selectedSourceId,
  onSourceSelect,
  onSourceEdit,
  onSourceDelete,
  hasConfig,
  onAddSource,
}) => {
  const { t } = useI18n();
  const { loading } = useSourceSelection();
  const workspaceMode = useWorkspaceStore(state => state.mode);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const needsWorkspaceSetup = useWorkspaceStore(
    state => state.needsWorkspaceSetup,
  );
  const localActive = isWorkspaceAvailable() && workspaceMode === 'local';
  const workspacePlatform = isWorkspaceAvailable();
  const showGlobalLoading = localActive ? workspaceLoading : loading;

  useRouteSync();

  // 含选文件夹过程中的 loading：勿切到侧栏布局，否则系统选夹对话框背后会闪出设置/资源库
  const awaitingWorkspaceSetup = workspacePlatform && needsWorkspaceSetup();

  // 欢迎页阶段不应叠着工作区设置/管理工作区弹窗
  useEffect(() => {
    if (!awaitingWorkspaceSetup) return;
    const ui = useUIStore.getState();
    if (ui.showSettingsModal) ui.closeSettingsModal();
    if (ui.showWorkspaceModal) ui.closeWorkspaceModal();
  }, [awaitingWorkspaceSetup]);

  const modals = (
    <MainLayoutModals
      showGlobalLoading={showGlobalLoading}
      versionInfo={__VERSION_INFO__}
    />
  );

  if (awaitingWorkspaceSetup) {
    return (
      <div
        className="flex overflow-hidden min-h-0 h-screen max-h-screen flex-col"
        style={{
          height: '100dvh',
          maxHeight: '100dvh',
          backgroundColor: 'var(--app-theme-background-primary, #ffffff)',
        }}
      >
        <WorkspaceWelcomeScreen />
        {modals}
      </div>
    );
  }

  if (workspacePlatform && localActive) {
    return (
      <div
        className="flex overflow-hidden min-h-0 h-screen max-h-screen"
        style={{
          height: '100dvh',
          maxHeight: '100dvh',
          backgroundColor: 'var(--app-theme-background-primary, #ffffff)',
        }}
      >
        <WorkspaceShell t={t}>{children}</WorkspaceShell>
        {modals}
      </div>
    );
  }

  return (
    <div
      className="flex overflow-hidden min-h-0 h-screen max-h-screen"
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        backgroundColor: 'var(--app-theme-background-primary, #ffffff)',
      }}
    >
      <AppSidebar
        sidebarSources={sidebarSources}
        selectedSourceId={selectedSourceId}
        onSourceSelect={onSourceSelect}
        onSourceEdit={onSourceEdit}
        onSourceDelete={onSourceDelete}
        hasConfig={hasConfig}
        onAddSource={onAddSource}
        t={t}
      />

      <AppMain>{children}</AppMain>

      {modals}
    </div>
  );
};
