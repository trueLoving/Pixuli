// 类型导出
export * from './types/image';
export * from './types/github';
export * from './types/gitee';

// Services 导出
export { GiteeStorageService } from './services/giteeStorageService';
export { GitHubStorageService } from './services/githubStorageService';
export { DefaultPlatformAdapter } from './services/platformAdapter';
export type { PlatformAdapter } from './services/platformAdapter';

// 组件类型导出
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
} from './components/language-switcher/LanguageSwitcher';

// 工具函数导出
export * from './utils/toast';
export * from './utils/fileSizeUtils';
export * from './utils/filterUtils';
export * from './utils/imageUtils';
export * from './utils/keyboardShortcuts';
export * from './utils/sortUtils';

// Hooks 导出
export * from './hooks';

// 组件导出
export { default as GitHubConfigModal } from './components/github-config/GitHubConfigModal';
export { default as GiteeConfigModal } from './components/gitee-config/GiteeConfigModal';
export { default as KeyboardHelpModal } from './components/keyboard-help/KeyboardHelpModal';
export { default as ImageUpload } from './components/image-upload/ImageUpload';
export { default as ImageSearch } from './components/image-search/ImageSearch';
export { default as Toaster } from './components/toaster/Toaster';
export { default as LanguageSwitcher } from './components/language-switcher/LanguageSwitcher';
export { default as VersionInfoModal } from './components/version-info/VersionInfoModal';
export type { VersionInfo } from './components/version-info';
export { versionInfoLocales } from './components/version-info/locales';
export { sidebarLocales } from './components/sidebar/locales';
export { headerLocales } from './components/header/locales';
export { emptyStateLocales } from './components/empty-state/locales';
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
export {
  SlideShowPlayer,
  SlideShowSettings,
  slideShowLocales,
} from './components/slide-show';
export type {
  PlayMode,
  TransitionEffect,
  SlideShowConfig,
  SlideShowPlayerState,
} from './components/slide-show';
export { PhotoWall } from './components/photo-wall';
export { Gallery3D } from './components/gallery-3d';
export { BrowseModeSwitcher } from './components/browse-mode-switcher';
export { default as Sidebar } from './components/sidebar/Sidebar';
export type { SidebarView, SidebarFilter } from './components/sidebar';
export { default as Header } from './components/header/Header';
// EmptyState 组件 - Web 版本
export { default as EmptyState } from './components/empty-state/web/EmptyState.web';
export type { EmptyStateProps } from './components/empty-state/common/types';
export { default as SearchBar } from './components/search/SearchBar';
export { FullScreenLoading } from './components/fullscreen-loading';
export type { FullScreenLoadingProps } from './components/fullscreen-loading';
// Demo 组件 - Web 版本
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
export type { DemoConfig, DemoProps } from './components/demo/common/types';
export { demoLocales } from './components/demo/locales';

// 语言包导出
export { defaultTranslate, deepMerge, zhCN, enUS } from './locales';
