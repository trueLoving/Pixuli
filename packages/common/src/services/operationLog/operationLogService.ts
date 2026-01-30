/**
 * 操作日志服务 - 三端统一逻辑，通过存储适配器持久化
 */

import type {
  OperationLog,
  LogQueryOptions,
  LogFilter,
  LogStatistics,
  OperationLogAddOptions,
  OperationLogClearOptions,
} from '../../types/log';
import { LogActionType, LogStatus } from '../../types/log';
import type { IOperationLogStorage } from './operationLogStorage';

const DEFAULT_STORAGE_KEY = 'pixuli-operation-logs';
const DEFAULT_MAX_LOGS = 10000;

export interface OperationLogServiceOptions {
  storageKey?: string;
  maxLogs?: number;
}

export class OperationLogService {
  private logs: OperationLog[] = [];
  private loaded = false;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly storage: IOperationLogStorage,
    private readonly options: OperationLogServiceOptions = {},
  ) {
    this.options = {
      storageKey: options.storageKey ?? DEFAULT_STORAGE_KEY,
      maxLogs: options.maxLogs ?? DEFAULT_MAX_LOGS,
    };
  }

  private get storageKey(): string {
    return this.options.storageKey!;
  }

  private get maxLogs(): number {
    return this.options.maxLogs!;
  }

  /** 确保已从存储加载，query 前需调用（Web 可忽略，Mobile 必须） */
  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await this.loadFromStorage();
    this.loaded = true;
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await this.storage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as OperationLog[];
        this.logs = Array.isArray(parsed) ? parsed : [];
        this.logs = this.logs.map(log => ({
          ...log,
          timestamp:
            typeof log.timestamp === 'string'
              ? new Date(log.timestamp).getTime()
              : log.timestamp,
        }));
      } else {
        this.logs = [];
      }
    } catch (error) {
      console.error('Failed to load operation logs:', error);
      this.logs = [];
    }
  }

  private saveLogs(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.storage
        .setItem(this.storageKey, JSON.stringify(this.logs))
        .catch(err => console.error('Failed to save operation logs:', err));
    }, 500);
  }

  log(
    action: LogActionType,
    status: LogStatus,
    options?: OperationLogAddOptions,
  ): void {
    const logEntry: OperationLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
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

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    this.saveLogs();
  }

  query(options?: LogQueryOptions): OperationLog[] {
    let result = [...this.logs];

    if (options?.filter) {
      result = this.applyFilter(result, options.filter);
    }

    const sortBy = options?.sortBy ?? 'timestamp';
    const sortOrder = options?.sortOrder ?? 'desc';
    result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortBy) {
        case 'timestamp':
          aVal = a.timestamp;
          bVal = b.timestamp;
          break;
        case 'action':
          aVal = a.action;
          bVal = b.action;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const offset = options?.offset ?? 0;
    const limit = options?.limit;
    if (limit !== undefined) {
      result = result.slice(offset, offset + limit);
    }
    return result;
  }

  private applyFilter(logs: OperationLog[], filter: LogFilter): OperationLog[] {
    return logs.filter(log => {
      if (filter.action !== undefined) {
        const actions = Array.isArray(filter.action)
          ? filter.action
          : [filter.action];
        if (!actions.includes(log.action)) return false;
      }
      if (filter.status !== undefined) {
        const statuses = Array.isArray(filter.status)
          ? filter.status
          : [filter.status];
        if (!statuses.includes(log.status)) return false;
      }
      if (filter.startTime !== undefined && log.timestamp < filter.startTime)
        return false;
      if (filter.endTime !== undefined && log.timestamp > filter.endTime)
        return false;
      if (filter.imageId !== undefined && log.imageId !== filter.imageId)
        return false;
      if (filter.keyword !== undefined) {
        const keyword = filter.keyword.toLowerCase();
        const text = [
          log.imageName,
          log.error,
          log.details ? JSON.stringify(log.details) : '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
  }

  getStatistics(): LogStatistics {
    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    const todayLogs = this.logs.filter(log => log.timestamp >= todayStart);
    const successLogs = this.logs.filter(l => l.status === LogStatus.SUCCESS);
    const total = this.logs.length;
    const successRate =
      total > 0 ? Math.round((successLogs.length / total) * 10000) / 100 : 0;

    const byAction = {} as Record<LogActionType, number>;
    const byStatus = {} as Record<LogStatus, number>;
    Object.values(LogActionType).forEach(a => {
      byAction[a] = 0;
    });
    Object.values(LogStatus).forEach(s => {
      byStatus[s] = 0;
    });
    this.logs.forEach(log => {
      byAction[log.action] = (byAction[log.action] ?? 0) + 1;
      byStatus[log.status] = (byStatus[log.status] ?? 0) + 1;
    });

    return {
      total,
      byAction,
      byStatus,
      todayCount: todayLogs.length,
      successRate,
    };
  }

  clearLogs(options?: OperationLogClearOptions): number {
    let removed = 0;
    if (options?.beforeTimestamp !== undefined) {
      const before = this.logs.length;
      this.logs = this.logs.filter(
        l => l.timestamp >= options!.beforeTimestamp!,
      );
      removed = before - this.logs.length;
    } else if (options?.keepCount !== undefined) {
      const before = this.logs.length;
      this.logs = this.logs.slice(0, options.keepCount);
      removed = before - this.logs.length;
    } else if (options?.action !== undefined) {
      const before = this.logs.length;
      this.logs = this.logs.filter(l => l.action !== options!.action);
      removed = before - this.logs.length;
    } else {
      removed = this.logs.length;
      this.logs = [];
    }
    if (removed > 0) this.saveLogs();
    return removed;
  }

  exportToJSON(options?: LogQueryOptions): string {
    return JSON.stringify(this.query(options), null, 2);
  }

  exportToCSV(options?: LogQueryOptions): string {
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
      log.imageId ?? '',
      log.imageName ?? '',
      log.error ?? '',
      log.duration?.toString() ?? '',
      log.details ? JSON.stringify(log.details) : '',
    ]);
    return [headers, ...rows]
      .map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
  }

  getAllLogs(): OperationLog[] {
    return [...this.logs];
  }
}
