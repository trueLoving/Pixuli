/**
 * @fileoverview React Native 平台专用导出文件
 * 此文件用于 React Native 移动应用的统一导出入口
 * Web/Desktop 应用请使用 index.ts
 *
 * 注意：此文件仅导出 React Native 环境可用的组件和工具
 * Web 专用组件（如 Sidebar、Header 等）不会在此文件中导出
 */

// ==================== 类型导出 ====================
export * from './types/image';
export * from './types/github';
export * from './types/gitee';

// ==================== React Native 专用组件导出 ====================
// EmptyState 组件（React Native 版本）
export { default as EmptyState } from './components/empty-state/native/EmptyState.native';
export type { EmptyStateProps } from './components/empty-state/common/types';

// Demo 组件（React Native 版本）
export {
  default as DemoNative,
  useDemoMode,
  getDemoGitHubConfig,
  getDemoGiteeConfig,
  isEnvConfigured,
} from './components/demo/native/Demo.native';
export type { DemoConfig, DemoProps } from './components/demo/common/types';

// VersionInfoModal 组件（React Native 版本）
export { default as VersionInfoModal } from './components/version-info/native/VersionInfoModal.native';
export type { VersionInfoModalProps } from './components/version-info/native/types';

// ==================== 语言包导出 ====================
export { defaultTranslate, deepMerge, zhCN, enUS } from './locales';
