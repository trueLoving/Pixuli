import type { VersionInfo } from '@pixuli/ui';
import { Calendar, Code, GitBranch, Hash, Info, Package } from 'lucide-react';
import React, { useState } from 'react';

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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();

  const formatVersion = (version: string) => version.replace(/[\^~]/, '');

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
              ? 'bg-blue-100 text-blue-800'
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
              ? 'bg-blue-100 text-blue-800'
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
              ? 'bg-blue-100 text-blue-800'
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

      <p className="text-xs text-gray-400">
        {t('version.footer.generated')}: {formatDate(versionInfo.buildTime)}
      </p>
    </div>
  );
};
