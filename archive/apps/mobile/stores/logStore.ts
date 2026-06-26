import * as Sharing from 'expo-sharing';
// 使用 legacy API 以保持与项目中其他模块一致（cacheDirectory/documentDirectory/writeAsStringAsync）
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FileSystem = require('expo-file-system/legacy');
import { getLogService } from '@/services/logService';
import {
  OperationLog,
  LogActionType,
  LogStatus,
  LogQueryOptions,
  LogStatistics,
} from '@/types/log';
import { create } from 'zustand';

const getService = () => getLogService();

interface LogState {
  logs: OperationLog[];
  statistics: LogStatistics | null;
  loading: boolean;
  error: string | null;
  filter: LogQueryOptions['filter'] | null;

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
      getService().log(action, status, options);
      const { filter } = get();
      if (filter) {
        void get().loadLogs({ filter });
      } else {
        const newLog: OperationLog = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          action,
          status,
          timestamp: Date.now(),
          ...options,
        };
        set(state => ({ logs: [newLog, ...state.logs] }));
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
      set({ statistics: getService().getStatistics() });
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    }
  },

  clearLogs: async options => {
    set({ loading: true, error: null });
    try {
      const removed = getService().clearLogs(options);
      await get().loadLogs();
      set({ loading: false });
      return removed;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '清理日志失败',
        loading: false,
      });
      return 0;
    }
  },

  exportToJSON: options => getService().exportToJSON(options),
  exportToCSV: options => getService().exportToCSV(options),

  exportToFile: async (format, options) => {
    const content =
      format === 'json'
        ? get().exportToJSON(options)
        : get().exportToCSV(options);
    const ext = format === 'json' ? 'json' : 'csv';
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const fileName = `pixuli-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
    const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!dir) throw new Error('No writable directory');
    const fileUri = `${dir}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: 'utf8',
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error('Sharing is not available on this device');
    }
    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: fileName,
    });
  },
}));
