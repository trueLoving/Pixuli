import {
  OperationLog,
  LogActionType,
  LogStatus,
  LogQueryOptions,
  LogFilter,
  LogStatistics,
} from './types';

// 日志服务类
export class LogService {
  private static instance: LogService;
  private logs: OperationLog[] = [];
  private maxLogs: number = 10000; // 最大日志数量
  private readonly STORAGE_KEY = 'pixuli-operation-logs';

  private constructor() {
    this.loadLogs();
  }

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  // 记录日志
  public log(
    action: LogActionType,
    status: LogStatus,
    options?: {
      imageId?: string;
      imageName?: string;
      details?: Record<string, any>;
      error?: string;
      duration?: number;
      userId?: string;
    },
  ): void {
    const logEntry: OperationLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      status,
      timestamp: Date.now(),
      userId: options?.userId,
      imageId: options?.imageId,
      imageName: options?.imageName,
      details: options?.details,
      error: options?.error,
      duration: options?.duration,
    };

    this.logs.unshift(logEntry); // 新日志添加到开头

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // 异步保存到本地存储
    this.saveLogs();
  }

  // 查询日志
  public query(options?: LogQueryOptions): OperationLog[] {
    let result = [...this.logs];

    // 应用过滤条件
    if (options?.filter) {
      result = this.applyFilter(result, options.filter);
    }

    // 排序
    const sortBy = options?.sortBy || 'timestamp';
    const sortOrder = options?.sortOrder || 'desc';
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'action':
          aValue = a.action;
          bValue = b.action;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 分页
    const offset = options?.offset || 0;
    const limit = options?.limit;
    if (limit !== undefined) {
      result = result.slice(offset, offset + limit);
    }

    return result;
  }

  // 应用过滤条件
  private applyFilter(logs: OperationLog[], filter: LogFilter): OperationLog[] {
    return logs.filter(log => {
      // 操作类型过滤
      if (filter.action !== undefined) {
        const actions = Array.isArray(filter.action)
          ? filter.action
          : [filter.action];
        if (!actions.includes(log.action)) {
          return false;
        }
      }

      // 状态过滤
      if (filter.status !== undefined) {
        const statuses = Array.isArray(filter.status)
          ? filter.status
          : [filter.status];
        if (!statuses.includes(log.status)) {
          return false;
        }
      }

      // 时间范围过滤
      if (filter.startTime !== undefined && log.timestamp < filter.startTime) {
        return false;
      }
      if (filter.endTime !== undefined && log.timestamp > filter.endTime) {
        return false;
      }

      // 图片ID过滤
      if (filter.imageId !== undefined && log.imageId !== filter.imageId) {
        return false;
      }

      // 关键词搜索
      if (filter.keyword !== undefined) {
        const keyword = filter.keyword.toLowerCase();
        const searchableText = [
          log.imageName,
          log.error,
          log.details ? JSON.stringify(log.details) : '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(keyword)) {
          return false;
        }
      }

      return true;
    });
  }

  // 获取统计信息
  public getStatistics(): LogStatistics {
    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);

    const todayLogs = this.logs.filter(log => log.timestamp >= todayStart);
    const successLogs = this.logs.filter(
      log => log.status === LogStatus.SUCCESS,
    );
    const failedLogs = this.logs.filter(log => log.status === LogStatus.FAILED);

    const byAction: Record<LogActionType, number> = {} as Record<
      LogActionType,
      number
    >;
    const byStatus: Record<LogStatus, number> = {} as Record<LogStatus, number>;

    // 初始化统计对象
    Object.values(LogActionType).forEach(action => {
      byAction[action] = 0;
    });
    Object.values(LogStatus).forEach(status => {
      byStatus[status] = 0;
    });

    // 统计
    this.logs.forEach(log => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    });

    const total = this.logs.length;
    const successRate = total > 0 ? (successLogs.length / total) * 100 : 0;

    return {
      total,
      byAction,
      byStatus,
      todayCount: todayLogs.length,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  // 清理日志
  public clearLogs(options?: {
    beforeTimestamp?: number; // 清理指定时间之前的日志
    keepCount?: number; // 保留最新的N条日志
    action?: LogActionType; // 只清理指定类型的日志
  }): number {
    let removedCount = 0;

    if (options?.beforeTimestamp !== undefined) {
      const beforeCount = this.logs.length;
      this.logs = this.logs.filter(
        log => log.timestamp >= options.beforeTimestamp!,
      );
      removedCount = beforeCount - this.logs.length;
    } else if (options?.keepCount !== undefined) {
      const beforeCount = this.logs.length;
      this.logs = this.logs.slice(0, options.keepCount);
      removedCount = beforeCount - this.logs.length;
    } else if (options?.action !== undefined) {
      const beforeCount = this.logs.length;
      this.logs = this.logs.filter(log => log.action !== options.action);
      removedCount = beforeCount - this.logs.length;
    } else {
      // 清理所有日志
      removedCount = this.logs.length;
      this.logs = [];
    }

    if (removedCount > 0) {
      this.saveLogs();
    }

    return removedCount;
  }

  // 导出日志为JSON
  public exportToJSON(options?: LogQueryOptions): string {
    const logs = this.query(options);
    return JSON.stringify(logs, null, 2);
  }

  // 导出日志为CSV
  public exportToCSV(options?: LogQueryOptions): string {
    const logs = this.query(options);
    const headers = [
      'ID',
      '操作类型',
      '状态',
      '时间戳',
      '图片ID',
      '图片名称',
      '错误信息',
      '耗时(ms)',
      '详细信息',
    ];
    const rows = logs.map(log => [
      log.id,
      log.action,
      log.status,
      new Date(log.timestamp).toISOString(),
      log.imageId || '',
      log.imageName || '',
      log.error || '',
      log.duration?.toString() || '',
      log.details ? JSON.stringify(log.details) : '',
    ]);

    const csv = [headers, ...rows]
      .map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    return csv;
  }

  // 从本地存储加载日志
  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = Array.isArray(parsed) ? parsed : [];
        // 确保时间戳是数字类型
        this.logs = this.logs.map(log => ({
          ...log,
          timestamp:
            typeof log.timestamp === 'string'
              ? new Date(log.timestamp).getTime()
              : log.timestamp,
        }));
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      this.logs = [];
    }
  }

  // 保存日志到本地存储
  private saveLogs(): void {
    try {
      // 使用防抖，避免频繁写入
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(() => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
      }, 500);
    } catch (error) {
      console.error('Failed to save logs:', error);
      // 如果存储空间不足，清理旧日志
      if (
        error instanceof DOMException &&
        error.name === 'QuotaExceededError'
      ) {
        this.clearLogs({ keepCount: 5000 });
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
        } catch (retryError) {
          console.error('Failed to save logs after cleanup:', retryError);
        }
      }
    }
  }

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  // 获取所有日志（用于调试）
  public getAllLogs(): OperationLog[] {
    return [...this.logs];
  }
}
