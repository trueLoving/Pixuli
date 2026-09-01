import type { VersionInfo } from '@/features/settings/version-info';
import { resolveSourceDisplay } from '@pixuli/core/sources';
import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import React, { Suspense, lazy, useMemo } from 'react';
import { FullScreenLoading, Toaster } from '@/ui';
import { useI18n } from '@/i18n/useI18n';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import { getPlatform, WebBrowserChrome } from '@/platforms';
import { exportJsonFile } from '@/features/settings/exportJsonFile';
import {
  configFieldsKey,
  resolveModalRepoConfig,
} from '@/features/settings/resolveModalRepoConfig';
import { useSourceSelection } from '@/features/library/useSourceSelection';

const GitHubConfigModal = lazy(() =>
  import('@/features/settings/github-config/GitHubConfigModal').then(m => ({
    default: m.default,
  })),
);
const GiteeConfigModal = lazy(() =>
  import('@/features/settings/gitee-config/GiteeConfigModal').then(m => ({
    default: m.default,
  })),
);
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
  onSaveConfig: AppMainLayoutModalsConfigProps['onSaveConfig'];
  onClearConfig: AppMainLayoutModalsConfigProps['onClearConfig'];
  versionInfo: VersionInfo;
}

interface AppMainLayoutModalsConfigProps {
  onSaveConfig: (
    config: {
      owner: string;
      repo: string;
      branch: string;
      token: string;
      path: string;
      name?: string;
    },
    editingSourceId: string | null,
  ) => void;
  onClearConfig: (editingSourceId: string | null) => void;
}

const ModalFallback = () => null;

export const MainLayoutModals: React.FC<MainLayoutModalsProps> = ({
  showGlobalLoading,
  onSaveConfig,
  onClearConfig,
  versionInfo,
}) => {
  const { t } = useI18n();
  const { storageType, githubConfig, giteeConfig } = useSourceSelection();
  const sources = useSourceStore(state => state.sources);
  const platform = getPlatform();

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
      ? resolveSourceDisplay(editingSourcePluginId).legacyType
      : editingSource
        ? resolveSourceDisplay(editingSource.pluginId).legacyType
        : storageType;

  const modalResolveOptions = {
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
    <>
      <Suspense fallback={<ModalFallback />}>
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

export type { AppMainLayoutModalsConfigProps };
