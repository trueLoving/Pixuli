/**
 * 主布局组件
 * 包含侧边栏、主内容区域和所有弹窗组件
 */

import type { AppMainLayoutProps } from '@/hooks/useAppOrchestration';
import type { VersionInfo } from '@/features/settings/version-info';
import React from 'react';
import { useRouteSync } from '@/hooks/useRouteSync';
import { useI18n } from '@/i18n/useI18n';
import { useSourceSelection } from '@/features/library/useSourceSelection';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
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
  onSaveConfig,
  onClearConfig,
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

  const modals = (
    <MainLayoutModals
      showGlobalLoading={showGlobalLoading}
      onSaveConfig={onSaveConfig}
      onClearConfig={onClearConfig}
      versionInfo={__VERSION_INFO__}
    />
  );

  if (workspacePlatform && needsWorkspaceSetup() && !workspaceLoading) {
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
