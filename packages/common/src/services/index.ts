export { GiteeStorageService } from './giteeStorageService';
export { GitHubStorageService } from './githubStorageService';
export { DefaultPlatformAdapter } from './platformAdapter';
export type { PlatformAdapter } from './platformAdapter';
export { logInterceptorService } from './logInterceptorService';
export type { LogEntry, LogLevel } from './logInterceptorService';
export { OperationLogService } from './operationLog';
export type {
  IOperationLogStorage,
  OperationLogServiceOptions,
} from './operationLog';

// 图片处理（Web/Desktop 纯 Web 实现，依赖 Canvas；移动端勿用）
export {
  WebImageProcessorService,
  webImageProcessorService,
  type OutputMimeType,
} from './imageProcessor';
