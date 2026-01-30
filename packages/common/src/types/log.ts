/**
 * 操作日志类型定义 - 三端统一（Web / Desktop / Mobile）
 */

export enum LogActionType {
  UPLOAD = 'upload',
  DELETE = 'delete',
  EDIT = 'edit',
  COMPRESS = 'compress',
  CONVERT = 'convert',
  ANALYZE = 'analyze',
  CONFIG_CHANGE = 'config_change',
  BATCH_UPLOAD = 'batch_upload',
  BATCH_DELETE = 'batch_delete',
}

export enum LogStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

export interface OperationLog {
  id: string;
  action: LogActionType;
  status: LogStatus;
  timestamp: number;
  userId?: string;
  imageId?: string;
  imageName?: string;
  details?: Record<string, unknown>;
  error?: string;
  duration?: number;
}

export interface LogFilter {
  action?: LogActionType | LogActionType[];
  status?: LogStatus | LogStatus[];
  startTime?: number;
  endTime?: number;
  imageId?: string;
  keyword?: string;
}

export interface LogQueryOptions {
  filter?: LogFilter;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'action' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface LogStatistics {
  total: number;
  byAction: Record<LogActionType, number>;
  byStatus: Record<LogStatus, number>;
  todayCount: number;
  successRate: number;
}

export interface OperationLogAddOptions {
  imageId?: string;
  imageName?: string;
  details?: Record<string, unknown>;
  error?: string;
  duration?: number;
  userId?: string;
}

export interface OperationLogClearOptions {
  beforeTimestamp?: number;
  keepCount?: number;
  action?: LogActionType;
}
