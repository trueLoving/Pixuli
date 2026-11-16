import type { VersionInfo } from './version-info';
import { useLogStore } from '@/features/operation-log';
import { showError, showSuccess } from '@/ui/feedback/toast';
import {
  Calendar,
  Code,
  Download,
  GitBranch,
  Hash,
  Info,
  Package,
  ScrollText,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface SettingsVersionPanelProps {
  t: (key: string) => string;
  versionInfo: VersionInfo;
}

export const SettingsVersionPanel: React.FC<SettingsVersionPanelProps> = ({
  t,
  versionInfo,
}) => {
  const [activeTab, setActiveTab] = useState<
    'basic' | 'frameworks' | 'dependencies'
  >('basic');
  const {
    statistics,
    loading,
    loadLogs,
    refreshStatistics,
    exportToFile,
    clearLogs,
  } = useLogStore();

  useEffect(() => {
    void loadLogs();
    refreshStatistics();
  }, [loadLogs, refreshStatistics]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();

  const formatVersion = (version: string) => version.replace(/[\^~]/, '');

  const handleExport = useCallback(
    async (format: 'json' | 'csv') => {
      try {
        await exportToFile(format);
        showSuccess(t('version.operationLog.exportSuccess'));
      } catch (error) {
        console.error('Export failed:', error);
        showError(t('version.operationLog.exportFailed'));
      }
    },
    [exportToFile, t],
  );

  const handleClear = useCallback(async () => {
    if (!window.confirm(t('version.operationLog.confirmClear'))) {
      return;
    }
    try {
      await clearLogs();
      showSuccess(t('version.operationLog.clearSuccess'));
    } catch (error) {
      console.error('Clear logs failed:', error);
      showError(t('version.operationLog.clearFailed'));
    }
  }, [clearLogs, t]);

  const basicFields = [
    { icon: Package, label: t('version.basic.name'), value: versionInfo.name },
    {
      icon: Hash,
      label: t('version.basic.version'),
      value: versionInfo.version,
    },
    {
      icon: Calendar,
      label: t('version.basic.buildTime'),
      value: formatDate(versionInfo.buildTime),
    },
    {
      icon: GitBranch,
      label: t('version.basic.branch'),
      value: versionInfo.git.branch,
    },
    { icon: Hash, label: 'Commit', value: versionInfo.git.commit },
  ] as const;

  const totalLogs = statistics?.total ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('version.title')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{t('version.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
            activeTab === 'basic'
              ? 'pix-badge-brand'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package size={14} />
          {t('version.tabs.basic')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('frameworks')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
            activeTab === 'frameworks'
              ? 'pix-badge-brand'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Code size={14} />
          {t('version.tabs.frameworks')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dependencies')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
            activeTab === 'dependencies'
              ? 'pix-badge-brand'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package size={14} />
          {t('version.tabs.dependencies')}
        </button>
      </div>

      {activeTab === 'basic' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {basicFields.map(field => (
            <div
              key={field.label}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <field.icon size={14} />
                {field.label}
              </div>
              <p className="mt-1 break-all text-sm font-medium text-gray-900">
                {field.value}
              </p>
            </div>
          ))}
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 sm:col-span-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Info size={14} />
              {t('version.basic.description')}
            </div>
            <p className="mt-1 text-sm text-gray-800">
              {versionInfo.description}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'frameworks' && (
        <div className="space-y-2">
          {Object.entries(versionInfo.frameworks).map(([name, version]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <span className="font-medium text-gray-900">{name}</span>
              <span className="font-mono text-xs text-gray-600">
                {formatVersion(version as string)}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'dependencies' && (
        <div className="space-y-3">
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {Object.entries(versionInfo.dependencies).map(([name, version]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="text-gray-800">{name}</span>
                <span className="font-mono text-xs text-gray-500">
                  {formatVersion(version as string)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {t('version.dependencies.description')}
          </p>
        </div>
      )}

      <section className="space-y-3 rounded-lg border border-gray-200 px-3 py-3">
        <div className="flex items-start gap-2">
          <ScrollText
            size={16}
            className="mt-0.5 shrink-0 text-gray-500"
            aria-hidden
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-900">
              {t('version.operationLog.title')}
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              {t('version.operationLog.hint')}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              {t('version.operationLog.count').replace(
                '{{count}}',
                String(totalLogs),
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || totalLogs === 0}
            onClick={() => void handleExport('json')}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} aria-hidden />
            {t('version.operationLog.exportJSON')}
          </button>
          <button
            type="button"
            disabled={loading || totalLogs === 0}
            onClick={() => void handleExport('csv')}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} aria-hidden />
            {t('version.operationLog.exportCSV')}
          </button>
          <button
            type="button"
            disabled={loading || totalLogs === 0}
            onClick={() => void handleClear()}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} aria-hidden />
            {t('version.operationLog.clear')}
          </button>
        </div>
      </section>

      <p className="text-xs text-gray-400">
        {t('version.footer.generated')}: {formatDate(versionInfo.buildTime)}
      </p>
    </div>
  );
};
