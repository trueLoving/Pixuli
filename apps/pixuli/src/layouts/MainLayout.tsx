/**
 * 主布局组件
 * 包含侧边栏、主内容区域和所有弹窗组件
 */

import {
  FullScreenLoading,
  GiteeConfigModal,
  GitHubConfigModal,
  Toaster,
  useDemoMode,
} from '@pixuli/ui';
import type { VersionInfo } from '@pixuli/ui';
import { pluginIdToLegacyType } from '@pixuli/core/sources';
import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import React, { useMemo } from 'react';
import { SettingsModal } from '../features/settings';
import { WorkspaceModal } from '@/features/workspace';
import { useRouteSync } from '../hooks/useRouteSync';
import { useI18n } from '../i18n/useI18n';
import { useImageStore } from '../stores/imageStore';
import { useSourceStore } from '../stores/sourceStore';
import { useUIStore } from '../stores/uiStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { isWorkspaceAvailable } from '../platforms/workspacePlatform';
import { exportJsonFile } from '../utils/exportJsonFile';
import { getPlatform, WebBrowserChrome } from '@/platforms';
import {
  configFieldsKey,
  resolveModalRepoConfig,
} from '../utils/resolveModalRepoConfig';
import { AppMain } from './AppMain';
import { Sidebar } from './Sidebar';
import { WorkspaceShell } from './WorkspaceShell';
import { WorkspaceWelcomeScreen } from './WorkspaceWelcomeScreen';

// 声明构建时注入的全局变量
declare const __VERSION_INFO__: VersionInfo;

interface MainLayoutProps {
  children: React.ReactNode;
  // Source 相关 props
  sidebarSources: any[];
  selectedSourceId: string | null;
  onSourceSelect: (sourceId: string) => void;
  onSourceEdit: (sourceId: string) => void;
  onSourceDelete: (sourceId: string) => void;
  hasConfig: boolean;
  onAddSource: () => void;
  // 配置相关 props（用于弹窗）
  onSaveConfig: (config: any) => void;
  onClearConfig: () => void;
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
  const { loading, storageType, githubConfig, giteeConfig } = useImageStore();
  const workspaceMode = useWorkspaceStore(state => state.mode);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const needsWorkspaceSetup = useWorkspaceStore(
    state => state.needsWorkspaceSetup,
  );
  const localActive = isWorkspaceAvailable() && workspaceMode === 'local';
  const workspacePlatform = isWorkspaceAvailable();
  const showGlobalLoading = localActive ? workspaceLoading : loading;
  const sources = useSourceStore(state => state.sources);
  const { isDemoMode } = useDemoMode();
  const platform = getPlatform();

  useRouteSync();

  const {
    showConfigModal,
    showSettingsModal,
    showWorkspaceModal,
    editingSourceId,
    editingSourcePluginId,
    editingSourceRepoConfig,
    closeConfigModal,
    closeSettingsModal,
    closeWorkspaceModal,
  } = useUIStore();

  const editingSource = useMemo(
    () =>
      editingSourceId
        ? (sources.find(s => s.id === editingSourceId) ?? null)
        : null,
    [sources, editingSourceId],
  );

  const configModalStorageType =
    editingSourceId && editingSourcePluginId
      ? pluginIdToLegacyType(editingSourcePluginId)
      : editingSource
        ? pluginIdToLegacyType(editingSource.pluginId)
        : storageType;

  const modalResolveOptions = {
    isDemoMode,
    editingSourceId,
    editingSourcePluginId,
    editingSourceRepoConfig,
    editingSource,
    fallbackGithub: githubConfig,
    fallbackGitee: giteeConfig,
  };

  const modalGitHubConfig = resolveModalRepoConfig(
    'github',
    modalResolveOptions,
  ) as GitHubConfig | null;

  const modalGiteeConfig = resolveModalRepoConfig(
    'gitee',
    modalResolveOptions,
  ) as GiteeConfig | null;

  const modalGitHubConfigKey = configFieldsKey(modalGitHubConfig);
  const modalGiteeConfigKey = configFieldsKey(modalGiteeConfig);

  const modals = (
    <>
      <GitHubConfigModal
        key={
          editingSourceId
            ? `github-edit-${editingSourceId}-${modalGitHubConfigKey}`
            : `github-new-${storageType ?? 'none'}`
        }
        isOpen={showConfigModal && configModalStorageType !== 'gitee'}
        onClose={closeConfigModal}
        githubConfig={modalGitHubConfig}
        onSaveConfig={onSaveConfig}
        onClearConfig={onClearConfig}
        platform={platform}
        exportJsonFile={exportJsonFile}
        t={t}
      />

      <GiteeConfigModal
        key={
          editingSourceId
            ? `gitee-edit-${editingSourceId}-${modalGiteeConfigKey}`
            : `gitee-new-${storageType ?? 'none'}`
        }
        isOpen={showConfigModal && configModalStorageType === 'gitee'}
        onClose={closeConfigModal}
        giteeConfig={modalGiteeConfig}
        onSaveConfig={onSaveConfig}
        onClearConfig={onClearConfig}
        platform={platform}
        exportJsonFile={exportJsonFile}
        t={t}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={closeSettingsModal}
        t={t}
        versionInfo={__VERSION_INFO__}
      />

      <WorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={closeWorkspaceModal}
        t={t}
      />

      <Toaster />

      <FullScreenLoading
        visible={showGlobalLoading}
        text={showGlobalLoading ? t('app.loadingImages') : undefined}
      />

      <WebBrowserChrome />
    </>
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
      <Sidebar
        sidebarSources={sidebarSources}
        selectedSourceId={selectedSourceId}
        onSourceSelect={onSourceSelect}
        onSourceEdit={onSourceEdit}
        onSourceDelete={onSourceDelete}
        hasConfig={hasConfig}
        onAddSource={onAddSource}
        t={t}
      />

      <AppMain legacyMobileMenu>{children}</AppMain>

      {modals}
    </div>
  );
};
