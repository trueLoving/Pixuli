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
  type ImageUploadData,
  type MultiImageUploadData,
  type VersionInfo,
} from '@packages/common/src';
import React from 'react';
import { SourceTypeMenu } from '../features';
import { useKeyboardCategories } from '../hooks/useKeyboardCategories';
import { useRouteSync } from '../hooks/useRouteSync';
import { useI18n } from '../i18n/useI18n';
import { useImageStore } from '../stores/imageStore';
import { useSourceStore } from '../stores/sourceStore';
import { useUIStore } from '../stores/uiStore';
import { getPlatform } from '../utils/platform';
import { AppMain } from './AppMain';
import { Sidebar } from './Sidebar';

// 声明全局版本信息
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
  // Header 相关 props
  onLoadImages: () => Promise<void>;
  onUploadImage: (data: ImageUploadData) => Promise<void>;
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<void>;
  // 配置相关 props（用于弹窗）
  onSaveConfig: (config: any) => void;
  onClearConfig: () => void;
  onSelectSourceType: (type: 'github' | 'gitee') => void;
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
  const { getSourceById } = useSourceStore();
  const { isDemoMode } = useDemoMode();
  const platform = getPlatform();

  // 路由同步：根据路由路径自动同步 activeMenu 和 browseMode
  useRouteSync();

  // UI Store 状态
  const {
    showConfigModal,
    showSourceTypeMenu,
    showKeyboardHelp,
    showVersionInfo,
    editingSourceId,
    closeConfigModal,
    closeSourceTypeMenu,
    closeKeyboardHelp,
    closeVersionInfo,
  } = useUIStore();

  // 键盘快捷键分类
  const keyboardCategories = useKeyboardCategories(t);

  // 获取正在编辑的源
  const selectedSource = editingSourceId
    ? getSourceById(editingSourceId)
    : null;

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{
        backgroundColor: 'var(--app-theme-background-primary, #ffffff)',
      }}
    >
      {/* 左侧：侧边栏菜单 */}
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

      {/* 右侧：主内容区域 */}
      <AppMain
        hasConfig={hasConfig}
        onLoadImages={onLoadImages}
        onUploadImage={onUploadImage}
        onUploadMultipleImages={onUploadMultipleImages}
      >
        {children}
      </AppMain>

      {/* 弹窗组件统一管理 */}

      {/* 仓库类型选择菜单 */}
      <SourceTypeMenu
        isOpen={showSourceTypeMenu}
        onClose={closeSourceTypeMenu}
        onSelect={onSelectSourceType}
        t={t}
      />

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        isOpen={showConfigModal && storageType !== 'gitee'}
        onClose={closeConfigModal}
        githubConfig={
          isDemoMode
            ? null
            : editingSourceId &&
                selectedSource &&
                selectedSource.type === 'github'
              ? {
                  owner: selectedSource.owner,
                  repo: selectedSource.repo,
                  branch: selectedSource.branch,
                  token: selectedSource.token,
                  path: selectedSource.path,
                }
              : githubConfig
        }
        onSaveConfig={onSaveConfig}
        onClearConfig={onClearConfig}
        t={t}
      />

      {/* Gitee 配置模态框 */}
      <GiteeConfigModal
        isOpen={showConfigModal && storageType === 'gitee'}
        onClose={closeConfigModal}
        giteeConfig={
          isDemoMode
            ? null
            : editingSourceId &&
                selectedSource &&
                selectedSource.type === 'gitee'
              ? {
                  owner: selectedSource.owner,
                  repo: selectedSource.repo,
                  branch: selectedSource.branch,
                  token: selectedSource.token,
                  path: selectedSource.path,
                }
              : giteeConfig
        }
        onSaveConfig={onSaveConfig}
        onClearConfig={onClearConfig}
        platform={platform}
        t={t}
      />

      {/* 键盘快捷键帮助模态框 */}
      <KeyboardHelpModal
        isOpen={showKeyboardHelp}
        onClose={closeKeyboardHelp}
        categories={keyboardCategories}
        t={t}
      />

      {/* 版本信息模态框 */}
      <VersionInfoModal
        isOpen={showVersionInfo}
        onClose={closeVersionInfo}
        t={t}
        versionInfo={__VERSION_INFO__}
      />

      {/* 全局组件统一管理 */}
      <Toaster />

      {/* 全屏 Loading - 数据请求时显示 */}
      <FullScreenLoading
        visible={loading}
        text={loading ? t('app.loadingImages') : undefined}
      />
    </div>
  );
};
