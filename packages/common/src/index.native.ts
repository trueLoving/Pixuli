// React Native 专用导出文件
// 移动端应用应从此文件引入组件

// 类型导出
export * from './types/image';
export * from './types/github';
export * from './types/gitee';

// React Native 专用组件导出
export { default as EmptyState } from './components/empty-state/native/EmptyState.native';
export type { EmptyStateProps } from './components/empty-state/common/types';

export {
  default as DemoNative,
  useDemoMode,
  getDemoGitHubConfig,
  getDemoGiteeConfig,
  isEnvConfigured,
} from './components/demo/native/Demo.native';
export type { DemoConfig, DemoProps } from './components/demo/common/types';

// 语言包导出
export { defaultTranslate, deepMerge, zhCN, enUS } from './locales';
