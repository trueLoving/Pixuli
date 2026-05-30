/**
 * GitHub/Gitee 存储与日志拦截仍在本包实现（M3 将迁至 provider 包）。
 * 其余能力请直接使用 `@pixuli/core` / `@pixuli/ui`。
 *
 * @deprecated 应用请改用 `@pixuli/core`、`@pixuli/ui` 及 `pixuli-common/services` 子路径；完整 barrel 入口 `pixuli-common` 将移除。
 */
export { GiteeStorageService } from './giteeStorageService';
export { GitHubStorageService } from './githubStorageService';
export {
  DefaultPlatformAdapter,
  type PlatformAdapter,
} from '@pixuli/core/platform';
export { logInterceptorService } from './logInterceptorService';
export type { LogEntry, LogLevel } from './logInterceptorService';
/** @deprecated 请改用 `@pixuli/core/operation-log` */
export {
  OperationLogService,
  type IOperationLogStorage,
  type OperationLogServiceOptions,
} from '@pixuli/core/operation-log';

// 图片处理（Web/Desktop 纯 Web 实现，依赖 Canvas；移动端勿用）
/** @deprecated 请改用 `@pixuli/ui/services/imageProcessor` */
export {
  WebImageProcessorService,
  webImageProcessorService,
  type OutputMimeType,
} from '@pixuli/ui/services/imageProcessor';
