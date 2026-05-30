/**
 * React Native 可用的 services（不含 Web Canvas 图片处理）。
 *
 * @deprecated 类型与操作日志请用 `@pixuli/core`；存储服务暂保留本路径，M3 迁至 provider 包。
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
