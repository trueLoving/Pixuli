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

// ==================== 性能监控导出 ====================
export * from './performance';

// ==================== 工具函数导出 ====================
export * from './utils';

// ==================== Hooks 导出 ====================
export * from './hooks';

// ==================== 组件导出 ====================
// 图片相关组件
export * from './components/image/image-preview-modal/web';
export * from './components/image/image-browser/web';
export * from './components/image/image-upload/web';
export * from './components/image/photo-wall/web';
export * from './components/image/gallery-3d/web';
export * from './components/image/timeline/web';
// 布局组件
export * from './components/layout/sidebar/web';
export * from './components/layout/header/web';
export * from './components/layout/empty-state/web';
// 配置相关组件
export * from './components/config/github-config/web';
export * from './components/config/gitee-config/web';
// UI 组件
export { Search } from './components/ui/search/web';
export type { SearchProps, SearchVariant } from './components/ui/search/web';
export * from './components/ui/toaster/web';
export * from './components/ui/refresh-button/web';
export * from './components/ui/upload-button/web';
export * from './components/ui/keyboard-help/web';
export * from './components/ui/language-switcher/web';
export * from './components/ui/fullscreen-loading/web';
export * from './components/ui/action-button/web';
// 功能组件
export * from './components/features/slide-show/web';
export * from './components/features/browse-mode-switcher/web';
export * from './components/features/version-info/web';
// 开发工具
export * from './components/dev/demo/web';
export * from './components/dev/devtools/web';
// ==================== 语言包导出 ====================
export * from './locales';
