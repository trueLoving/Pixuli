/**
 * @pixuli/ui/native — React Native 共享 UI
 */
export * from '../layout/empty-state/native';
export type { EmptyStateProps } from '../layout/empty-state/common/types';

export * from '../features/version-info/native';
export type { VersionInfoModalProps } from '../features/version-info/native/types';

export {
  DemoNative,
  useDemoMode,
  getDemoGitHubConfig,
  getDemoGiteeConfig,
  isEnvConfigured,
} from '../dev/demo/native';
export type { DemoConfig, DemoProps } from '../dev/demo/common/types';
