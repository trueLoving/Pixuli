// 操作日志类型定义

export enum LogActionType {
  UPLOAD = 'upload', // 上传
  DELETE = 'delete', // 删除
  EDIT = 'edit', // 编辑
  COMPRESS = 'compress', // 压缩
  CONVERT = 'convert', // 转换
  ANALYZE = 'analyze', // AI分析
  CONFIG_CHANGE = 'config_change', // 配置变更
  BATCH_UPLOAD = 'batch_upload', // 批量上传
  BATCH_DELETE = 'batch_delete', // 批量删除
}

export enum LogStatus {
  SUCCESS = 'success', // 成功
  FAILED = 'failed', // 失败
  PENDING = 'pending', // 进行中
}

export interface OperationLog {
  id: string; // 日志ID
  action: LogActionType; // 操作类型
  status: LogStatus; // 操作状态
  timestamp: number; // 时间戳（毫秒）
  userId?: string; // 用户ID（可选）
  imageId?: string; // 图片ID（如果相关）
  imageName?: string; // 图片名称
  details?: Record<string, any>; // 详细信息
  error?: string; // 错误信息（如果失败）
  duration?: number; // 操作耗时（毫秒）
}

export interface LogFilter {
  action?: LogActionType | LogActionType[]; // 操作类型过滤
  status?: LogStatus | LogStatus[]; // 状态过滤
  startTime?: number; // 开始时间
  endTime?: number; // 结束时间
  imageId?: string; // 图片ID过滤
  keyword?: string; // 关键词搜索（搜索图片名称、错误信息等）
}

export interface LogQueryOptions {
  filter?: LogFilter; // 过滤条件
  limit?: number; // 返回数量限制
  offset?: number; // 偏移量
  sortBy?: 'timestamp' | 'action' | 'status'; // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序顺序
}

export interface LogStatistics {
  total: number; // 总日志数
  byAction: Record<LogActionType, number>; // 按操作类型统计
  byStatus: Record<LogStatus, number>; // 按状态统计
  todayCount: number; // 今日日志数
  successRate: number; // 成功率
}
