/**
 * @fileoverview Web/Desktop 平台专用导出文件
 * 此文件用于 Web 和 Desktop 应用的统一导出入口
 * React Native 应用请使用 index.native.ts
 */

// ==================== 类型导出 ====================
export * from './types/image';
export * from './types/github';
export * from './types/gitee';

// ==================== Services 导出 ====================
export * from './services';

// ==================== 组件类型导出 ====================
export type {
  ViewMode,
  SortField,
  SortOrder,
  FilterOptions,
} from './components/image-browser';
export type { BrowseMode } from './components/browse-mode-switcher';
export type { ImageSearchProps } from './components/image-search/ImageSearch';
export type {
  Language,
  LanguageSwitcherProps,
} from './components/language-switcher/web/LanguageSwitcher.web';
export type { EmptyStateProps } from './components/empty-state/common/types';
export type { FullScreenLoadingProps } from './components/fullscreen-loading/web/FullScreenLoading.web';
export type { SidebarView, SidebarFilter } from './components/sidebar';
export type { VersionInfo } from './components/version-info/web/types';
export type {
  PlayMode,
  TransitionEffect,
  SlideShowConfig,
  SlideShowPlayerState,
} from './components/slide-show/web';
export type { DemoConfig, DemoProps } from './components/demo/common/types';

// ==================== 工具函数导出 ====================
export * from './utils';

// ==================== Hooks 导出 ====================
export * from './hooks';

// ==================== 组件导出 ====================

// 图片浏览相关组件
export {
  ImageBrowser,
  ImageGrid,
  ImageList,
  ImageFilter,
  ImageSorter,
  ImagePreviewModal,
  ImageUrlModal,
  ImageEditModal,
} from './components/image-browser';

// 图片上传组件
export { default as ImageUpload } from './components/image-upload/ImageUpload';

// 搜索组件
export { default as ImageSearch } from './components/image-search/ImageSearch';
export { default as SearchBar } from './components/search/SearchBar';

// 浏览模式相关组件
export {
  SlideShowPlayer,
  SlideShowSettings,
} from './components/slide-show/web';
export { PhotoWall } from './components/photo-wall';
export { Gallery3D } from './components/gallery-3d';
export { BrowseModeSwitcher } from './components/browse-mode-switcher';

// 布局组件
export { default as Sidebar } from './components/sidebar/Sidebar';
export { default as Header } from './components/header/Header';
export { default as HeaderSearch } from './components/header-search';
export { default as EmptyState } from './components/empty-state/web/EmptyState.web';

// 配置相关组件
export { default as GitHubConfigModal } from './components/github-config/web/GitHubConfigModal.web';
export { default as GiteeConfigModal } from './components/gitee-config/web/GiteeConfigModal.web';

// 功能组件
export { default as Toaster } from './components/toaster/web/Toaster.web';
export { default as RefreshButton } from './components/refresh-button/web/RefreshButton.web';
export { default as UploadButton } from './components/upload-button/web/UploadButton.web';
export { default as KeyboardHelpModal } from './components/keyboard-help/web/KeyboardHelpModal.web';
export { default as LanguageSwitcher } from './components/language-switcher/web/LanguageSwitcher.web';
export { default as VersionInfoModal } from './components/version-info/web/VersionInfoModal.web';
export { default as FullScreenLoading } from './components/fullscreen-loading/web/FullScreenLoading.web';

// Demo 组件（Web 版本）
export {
  default as Demo,
  useDemoMode,
  downloadDemoGitHubConfig,
  downloadDemoGiteeConfig,
  importConfigFromFile,
  isDemoEnvironment,
  setDemoMode,
  getDemoGitHubConfig,
  getDemoGiteeConfig,
  isEnvConfigured,
} from './components/demo/web/Demo.web';
export { default as DemoIcon } from './components/demo/web/DemoIcon.web';

// ==================== 语言包导出 ====================
export { defaultTranslate, deepMerge, zhCN, enUS } from './locales';
