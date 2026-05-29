export { GiteeStorageService } from './giteeStorageService';
export { GitHubStorageService } from './githubStorageService';
export {
  DefaultPlatformAdapter,
  type PlatformAdapter,
} from '@pixuli/core/platform';
export { logInterceptorService } from './logInterceptorService';
export type { LogEntry, LogLevel } from './logInterceptorService';
export {
  OperationLogService,
  type IOperationLogStorage,
  type OperationLogServiceOptions,
} from '@pixuli/core/operation-log';

// 图片处理（Web/Desktop 纯 Web 实现，依赖 Canvas；移动端勿用）
export {
  WebImageProcessorService,
  webImageProcessorService,
  type OutputMimeType,
} from './imageProcessor';
