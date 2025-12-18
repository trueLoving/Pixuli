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
// 图片预览组件
export * from './components/image-preview-modal/web';
// 图片浏览相关组件
export * from './components/image-browser/web';
// 图片上传组件
export * from './components/image-upload/web';
// 搜索组件
export { Search } from './components/search/web';
export type { SearchProps, SearchVariant } from './components/search/web';
// 浏览模式相关组件
export * from './components/slide-show/web';
export * from './components/timeline/web';
export * from './components/browse-mode-switcher/web';
// 布局组件
export * from './components/sidebar/web';
export * from './components/header/web';
export * from './components/empty-state/web';
// 配置相关组件
export * from './components/github-config/web';
export * from './components/gitee-config/web';
// 功能组件
export * from './components/toaster/web';
export * from './components/refresh-button/web';
export * from './components/upload-button/web';
export * from './components/keyboard-help/web';
export * from './components/language-switcher/web';
export * from './components/version-info/web';
export * from './components/fullscreen-loading/web';
// Demo 组件
export * from './components/demo/web';
// DevTools 组件
export * from './components/devtools/web';
// ==================== 语言包导出 ====================
export * from './locales';
