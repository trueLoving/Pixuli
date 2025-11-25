/**
 * 国际化语言包重新设计，拆分语言包，
 * 1.基础的翻译包放在 packages/ui/src/locales 目录下，作为公共语言包，其他语言包继承自该语言包。
 * 2.组件的翻译包放在 packages/ui/src/components 目录下。
 * 3.应用的翻译包交给应用层自己实现（区分方式则是看在哪里使用）
 * 组件测试框架添加，编写 components 下面的组件测试
 */
// 类型导出
export * from './types/image';
export * from './types/github';
export * from './types/gitee';

// Services 导出
export {
  GiteeStorageService,
  DefaultPlatformAdapter,
} from './services/giteeStorageService';
export type { PlatformAdapter } from './services/giteeStorageService';
export { GitHubStorageService } from './services/githubStorageService';

// 类型导出
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

// 语言包导出
export { defaultTranslate, deepMerge, zhCN, enUS } from './locales';
