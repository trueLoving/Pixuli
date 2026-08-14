import { getLogService } from '@/services/logService';
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
  loadLogs: (options?: LogQueryOptions) => Promise<void>;
  addLog: (
    action: LogActionType,
    status: LogStatus,
    options?: {
      imageId?: string;
      imageName?: string;
      details?: Record<string, unknown>;
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

const getService = () => getLogService();

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  statistics: null,
  loading: false,
  error: null,
  filter: null,

  loadLogs: async (options?: LogQueryOptions) => {
    set({ loading: true, error: null });
    try {
      const logService = getService();
      await logService.ensureLoaded();
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
      const logService = getService();
      logService.log(action, status, options);
      const { filter } = get();
      if (filter) {
        void get().loadLogs({ filter });
      } else {
        const newLog = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
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
    void get().loadLogs({ filter });
  },

  clearFilter: () => {
    set({ filter: null });
    void get().loadLogs();
  },

  refreshStatistics: () => {
    try {
      const statistics = getService().getStatistics();
      set({ statistics });
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    }
  },

  clearLogs: async options => {
    set({ loading: true, error: null });
    try {
      const removedCount = getService().clearLogs(options);
      await get().loadLogs();
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
    return getService().exportToJSON(options);
  },

  exportToCSV: options => {
    return getService().exportToCSV(options);
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

// 初始化时加载日志和统计信息（异步）
if (typeof window !== 'undefined') {
  void useLogStore.getState().loadLogs();
}
