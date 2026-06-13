/**
 * 主布局组件
 * 包含侧边栏、头部、主内容区域和所有弹窗组件
 */

import {
  FullScreenLoading,
  GiteeConfigModal,
  GitHubConfigModal,
  KeyboardHelpModal,
  Toaster,
  useDemoMode,
  VersionInfoModal,
} from '@pixuli/ui';
import type { VersionInfo } from '@pixuli/ui';
import { pluginIdToLegacyType } from '@pixuli/core/sources';
import type {
  GiteeConfig,
  GitHubConfig,
  ImageUploadData,
  MultiImageUploadData,
} from '@pixuli/core/types';
import React, { useMemo } from 'react';
import {
  OfflineIndicator,
  OperationLogModal,
  PWAInstallPrompt,
  SourceTypeMenu,
} from '../features';
import { useKeyboardCategories } from '../hooks/useKeyboardCategories';
import { useRouteSync } from '../hooks/useRouteSync';
import { useI18n } from '../i18n/useI18n';
import { useImageStore } from '../stores/imageStore';
import { useSourceStore } from '../stores/sourceStore';
import { useUIStore } from '../stores/uiStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { isDesktopWorkspaceAvailable } from '../platforms/desktop/workspaceAdapter';
import { listStoragePluginManifests } from '../storage/registry';
import { getPlatform, isNativeMobile } from '../utils/platform';
import {
  configFieldsKey,
  resolveModalRepoConfig,
} from '../utils/resolveModalRepoConfig';
import { AppMain } from './AppMain';
import { Sidebar } from './Sidebar';

// 声明构建时注入的全局变量
declare const __VERSION_INFO__: VersionInfo;
declare const __IS_WEB__: boolean;

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
  // Header 相关 props
  onLoadImages: () => Promise<void>;
  onUploadImage: (data: ImageUploadData) => Promise<void>;
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<void>;
  // 配置相关 props（用于弹窗）
  onSaveConfig: (config: any) => void;
  onClearConfig: () => void;
  onSelectSourceType: (pluginId: string) => void;
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
  onLoadImages,
  onUploadImage,
  onUploadMultipleImages,
  onSaveConfig,
  onClearConfig,
  onSelectSourceType,
}) => {
  const { t } = useI18n();
  const { loading, storageType, githubConfig, giteeConfig } = useImageStore();
  const workspaceMode = useWorkspaceStore(state => state.mode);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const localActive =
    isDesktopWorkspaceAvailable() && workspaceMode === 'local';
  const showGlobalLoading = localActive ? workspaceLoading : loading;
  const sources = useSourceStore(state => state.sources);
  const { isDemoMode } = useDemoMode();
  const platform = getPlatform();

  useRouteSync();

  const {
    showConfigModal,
    showSourceTypeMenu,
    showKeyboardHelp,
    showVersionInfo,
    showOperationLog,
    editingSourceId,
    editingSourcePluginId,
    editingSourceRepoConfig,
    closeConfigModal,
    closeSourceTypeMenu,
    closeKeyboardHelp,
    closeVersionInfo,
    closeOperationLog,
  } = useUIStore();

  const keyboardCategories = useKeyboardCategories(t);

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

      <AppMain
        hasConfig={hasConfig}
        onLoadImages={onLoadImages}
        onUploadImage={onUploadImage}
        onUploadMultipleImages={onUploadMultipleImages}
      >
        {children}
      </AppMain>

      <SourceTypeMenu
        isOpen={showSourceTypeMenu}
        manifests={listStoragePluginManifests()}
        onClose={closeSourceTypeMenu}
        onSelect={onSelectSourceType}
        t={t}
      />

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
        t={t}
      />

      <KeyboardHelpModal
        isOpen={showKeyboardHelp}
        onClose={closeKeyboardHelp}
        categories={keyboardCategories}
        t={t}
      />

      <VersionInfoModal
        isOpen={showVersionInfo}
        onClose={closeVersionInfo}
        t={t}
        versionInfo={__VERSION_INFO__}
      />

      <OperationLogModal
        isOpen={showOperationLog}
        onClose={closeOperationLog}
      />

      <Toaster />

      <FullScreenLoading
        visible={showGlobalLoading}
        text={showGlobalLoading ? t('app.loadingImages') : undefined}
      />

      {typeof __IS_WEB__ !== 'undefined' && __IS_WEB__ && !isNativeMobile() && (
        <>
          <OfflineIndicator />
          <PWAInstallPrompt />
        </>
      )}
    </div>
  );
};
