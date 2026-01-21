import { LogService } from '@/services/logService';
import {
  OperationLog,
  LogActionType,
  LogStatus,
  LogQueryOptions,
  LogStatistics,
} from '@/types/log';
import { create } from 'zustand';

interface LogState {
  logs: OperationLog[];
  statistics: LogStatistics | null;
  loading: boolean;
  error: string | null;
  filter: LogQueryOptions['filter'] | null;

  // Actions
  loadLogs: (options?: LogQueryOptions) => void;
  addLog: (
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
  ) => void;
  setFilter: (filter: LogQueryOptions['filter']) => void;
  clearFilter: () => void;
  refreshStatistics: () => void;
  clearLogs: (options?: {
    beforeTimestamp?: number;
    keepCount?: number;
    action?: LogActionType;
  }) => Promise<number>;
  exportToJSON: (options?: LogQueryOptions) => string;
  exportToCSV: (options?: LogQueryOptions) => string;
  exportToFile: (
    format: 'json' | 'csv',
    options?: LogQueryOptions,
  ) => Promise<void>;
}

const logService = LogService.getInstance();

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  statistics: null,
  loading: false,
  error: null,
  filter: null,

  loadLogs: (options?: LogQueryOptions) => {
    set({ loading: true, error: null });
    try {
      const logs = logService.query(options);
      set({ logs, loading: false });
      get().refreshStatistics();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载日志失败',
        loading: false,
      });
    }
  },

  addLog: (action, status, options) => {
    try {
      logService.log(action, status, options);
      // 如果当前有过滤条件，重新加载日志
      const { filter } = get();
      if (filter) {
        get().loadLogs({ filter });
      } else {
        // 否则只添加新日志到列表开头
        const newLog = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          action,
          status,
          timestamp: Date.now(),
          ...options,
        } as OperationLog;
        set(state => ({
          logs: [newLog, ...state.logs],
        }));
      }
      get().refreshStatistics();
    } catch (error) {
      console.error('Failed to add log:', error);
    }
  },

  setFilter: filter => {
    set({ filter });
    get().loadLogs({ filter });
  },

  clearFilter: () => {
    set({ filter: null });
    get().loadLogs();
  },

  refreshStatistics: () => {
    try {
      const statistics = logService.getStatistics();
      set({ statistics });
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    }
  },

  clearLogs: async options => {
    set({ loading: true, error: null });
    try {
      const removedCount = logService.clearLogs(options);
      get().loadLogs();
      set({ loading: false });
      return removedCount;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '清理日志失败',
        loading: false,
      });
      return 0;
    }
  },

  exportToJSON: options => {
    return logService.exportToJSON(options);
  },

  exportToCSV: options => {
    return logService.exportToCSV(options);
  },

  exportToFile: async (format, options) => {
    try {
      const content =
        format === 'json'
          ? get().exportToJSON(options)
          : get().exportToCSV(options);
      const extension = format === 'json' ? 'json' : 'csv';
      const mimeType = format === 'json' ? 'application/json' : 'text/csv';

      // 使用浏览器下载文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `pixuli-logs-${timestamp}.${extension}`;

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
      throw error;
    }
  },
}));

// 初始化时加载日志和统计信息
if (typeof window !== 'undefined') {
  const store = useLogStore.getState();
  store.loadLogs();
  store.refreshStatistics();
}
