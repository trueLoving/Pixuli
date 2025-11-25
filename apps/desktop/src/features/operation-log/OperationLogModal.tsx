import { LogActionType, LogStatus, LogFilter } from '@/services/types';
import { useLogStore } from '@/stores/logStore';
import { showError, showSuccess } from '@packages/ui/src';
import {
  Calendar,
  Download,
  Filter,
  Search,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { operationLogLocales } from './locales';

interface OperationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OperationLogModal: React.FC<OperationLogModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t: i18nT, getCurrentLanguage } = useI18n();
  const currentLang = getCurrentLanguage();
  const locales =
    operationLogLocales[currentLang as keyof typeof operationLogLocales] ||
    operationLogLocales['zh-CN'];
  const t = (key: string) => locales[key as keyof typeof locales] || key;

  const {
    logs,
    statistics,
    loading,
    filter,
    loadLogs,
    setFilter,
    clearFilter,
    clearLogs,
    exportToFile,
    refreshStatistics,
  } = useLogStore();

  const [showFilter, setShowFilter] = useState(false);
  const [localFilter, setLocalFilter] = useState<LogFilter>({
    action: undefined,
    status: undefined,
    keyword: '',
    startTime: undefined,
    endTime: undefined,
  });

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      refreshStatistics();
    }
  }, [isOpen, loadLogs, refreshStatistics]);

  const handleApplyFilter = useCallback(() => {
    setFilter(localFilter);
    setShowFilter(false);
  }, [localFilter, setFilter]);

  const handleResetFilter = useCallback(() => {
    const emptyFilter: LogFilter = {
      action: undefined,
      status: undefined,
      keyword: '',
      startTime: undefined,
      endTime: undefined,
    };
    setLocalFilter(emptyFilter);
    clearFilter();
    setShowFilter(false);
  }, [clearFilter]);

  const handleExport = useCallback(
    async (format: 'json' | 'csv') => {
      try {
        await exportToFile(format, { filter: filter || undefined });
        showSuccess(t('exportSuccess'));
      } catch (error) {
        showError(t('exportFailed'));
        console.error('Export failed:', error);
      }
    },
    [exportToFile, filter, t]
  );

  const handleClearLogs = useCallback(
    async (type: 'all' | 'before' | 'action') => {
      if (!confirm(t('confirmClearMessage'))) {
        return;
      }

      try {
        let removedCount = 0;
        if (type === 'all') {
          removedCount = await clearLogs();
        } else if (type === 'before') {
          const beforeDate = prompt(t('clearBefore') + ' (YYYY-MM-DD):');
          if (beforeDate) {
            const timestamp = new Date(beforeDate).getTime();
            removedCount = await clearLogs({ beforeTimestamp: timestamp });
          }
        } else if (type === 'action') {
          const action = prompt(t('clearByAction') + ' (action type):');
          if (
            action &&
            Object.values(LogActionType).includes(action as LogActionType)
          ) {
            removedCount = await clearLogs({ action: action as LogActionType });
          }
        }

        if (removedCount > 0) {
          showSuccess(`${t('clearSuccess')}: ${removedCount} ${t('logs')}`);
          loadLogs();
          refreshStatistics();
        }
      } catch (error) {
        showError(t('clearFailed'));
        console.error('Clear logs failed:', error);
      }
    },
    [clearLogs, loadLogs, refreshStatistics, t]
  );

  const getActionLabel = (action: LogActionType): string => {
    const actionMap: Record<LogActionType, string> = {
      [LogActionType.UPLOAD]: t('upload'),
      [LogActionType.DELETE]: t('delete'),
      [LogActionType.EDIT]: t('edit'),
      [LogActionType.COMPRESS]: t('compress'),
      [LogActionType.CONVERT]: t('convert'),
      [LogActionType.ANALYZE]: t('analyze'),
      [LogActionType.CONFIG_CHANGE]: t('configChange'),
      [LogActionType.BATCH_UPLOAD]: t('batchUpload'),
      [LogActionType.BATCH_DELETE]: t('batchDelete'),
    };
    return actionMap[action] || action;
  };

  const getStatusIcon = (status: LogStatus) => {
    switch (status) {
      case LogStatus.SUCCESS:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case LogStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case LogStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(
      currentLang === 'zh-CN' ? 'zh-CN' : 'en-US'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="p-2 hover:bg-gray-100 rounded"
              title={t('filter')}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleExport('json')}
              className="p-2 hover:bg-gray-100 rounded"
              title={t('exportJSON')}
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleClearLogs('all')}
              className="p-2 hover:bg-gray-100 rounded text-red-600"
              title={t('clearAll')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="p-4 border-b bg-gray-50">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.total}</div>
                <div className="text-sm text-gray-600">{t('total')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {statistics.todayCount}
                </div>
                <div className="text-sm text-gray-600">{t('today')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {statistics.successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">{t('successRate')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.byStatus[LogStatus.SUCCESS] || 0}
                </div>
                <div className="text-sm text-gray-600">{t('success')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showFilter && (
          <div className="p-4 border-b bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('action')}
                </label>
                <select
                  value={localFilter.action || ''}
                  onChange={e =>
                    setLocalFilter({
                      ...localFilter,
                      action: e.target.value
                        ? (e.target.value as LogActionType)
                        : undefined,
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">{t('allActions')}</option>
                  {Object.values(LogActionType).map(action => (
                    <option key={action} value={action}>
                      {getActionLabel(action)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('status')}
                </label>
                <select
                  value={localFilter.status || ''}
                  onChange={e =>
                    setLocalFilter({
                      ...localFilter,
                      status: e.target.value
                        ? (e.target.value as LogStatus)
                        : undefined,
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">{t('allStatus')}</option>
                  {Object.values(LogStatus).map(status => (
                    <option key={status} value={status}>
                      {status === LogStatus.SUCCESS
                        ? t('success')
                        : status === LogStatus.FAILED
                          ? t('failed')
                          : t('pending')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('keyword')}
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={localFilter.keyword || ''}
                    onChange={e =>
                      setLocalFilter({
                        ...localFilter,
                        keyword: e.target.value,
                      })
                    }
                    placeholder={t('keyword')}
                    className="w-full pl-8 p-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleResetFilter}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  {t('reset')}
                </button>
                <button
                  onClick={handleApplyFilter}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t('apply')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logs List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">{t('noLogs')}</div>
            </div>
          ) : (
            <div className="p-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">{t('time')}</th>
                    <th className="p-2 text-left">{t('action')}</th>
                    <th className="p-2 text-left">{t('status')}</th>
                    <th className="p-2 text-left">{t('imageName')}</th>
                    <th className="p-2 text-left">{t('duration')}</th>
                    <th className="p-2 text-left">{t('error')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{formatTime(log.timestamp)}</td>
                      <td className="p-2">{getActionLabel(log.action)}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(log.status)}
                          <span>
                            {log.status === LogStatus.SUCCESS
                              ? t('success')
                              : log.status === LogStatus.FAILED
                                ? t('failed')
                                : t('pending')}
                          </span>
                        </div>
                      </td>
                      <td className="p-2">{log.imageName || '-'}</td>
                      <td className="p-2">
                        {log.duration ? `${log.duration}ms` : '-'}
                      </td>
                      <td className="p-2 text-red-600">{log.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationLogModal;
