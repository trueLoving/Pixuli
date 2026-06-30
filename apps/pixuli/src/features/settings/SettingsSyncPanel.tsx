import type { SidebarSource } from '@pixuli/ui';
import { Edit, Github, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SourceTypePicker } from '@/features/source-type-menu/SourceTypePicker';
import { useSourceManagement } from '@/hooks/useSourceManagement';
import { listStoragePluginManifests } from '@/storage/registry';
import { useUIStore } from '@/stores/uiStore';
import {
  useSyncPreferencesStore,
  type SyncDefaultDirection,
} from '@/stores/syncPreferencesStore';

interface SettingsSyncPanelProps {
  t: (key: string) => string;
}

const DIRECTION_OPTIONS: SyncDefaultDirection[] = ['both', 'push', 'pull'];

const directionLabelKey: Record<SyncDefaultDirection, string> = {
  both: 'settings.directionBoth',
  push: 'settings.directionPush',
  pull: 'settings.directionPull',
};

function renderSourceTypeIcon(type: SidebarSource['type']) {
  if (type === 'github') {
    return <Github size={14} className="shrink-0 text-gray-700" />;
  }
  return (
    <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-red-500 text-[9px] font-bold text-white">
      码
    </span>
  );
}

export const SettingsSyncPanel: React.FC<SettingsSyncPanelProps> = ({ t }) => {
  const [addingSource, setAddingSource] = useState(false);
  const defaultDirection = useSyncPreferencesStore(
    state => state.defaultDirection,
  );
  const setDefaultDirection = useSyncPreferencesStore(
    state => state.setDefaultDirection,
  );
  const beginNewSource = useUIStore(state => state.beginNewSource);
  const settingsSyncAddOpen = useUIStore(state => state.settingsSyncAddOpen);
  const clearSettingsSyncAddOpen = useUIStore(
    state => state.clearSettingsSyncAddOpen,
  );
  const openConfigModalForEdit = useUIStore(
    state => state.openConfigModalForEdit,
  );
  const {
    sidebarSources,
    selectedSource,
    handleSourceSelect,
    handleEditSource,
    handleDeleteSource,
  } = useSourceManagement();

  const manifests = listStoragePluginManifests();
  const activeSyncSourceId = selectedSource?.id ?? null;

  useEffect(() => {
    if (settingsSyncAddOpen) {
      setAddingSource(true);
      clearSettingsSyncAddOpen();
    }
  }, [settingsSyncAddOpen, clearSettingsSyncAddOpen]);

  const handleEdit = (sourceId: string) => {
    const id = handleEditSource(sourceId);
    if (id) {
      openConfigModalForEdit(id);
    }
  };

  const handleSelectSourceType = (pluginId: string) => {
    setAddingSource(false);
    beginNewSource(pluginId);
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.syncStrategyTitle')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t('settings.syncStrategyHint')}
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">{t('settings.defaultDirection')}</legend>
          {DIRECTION_OPTIONS.map(option => (
            <label
              key={option}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                defaultDirection === option
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="sync-default-direction"
                className="mt-0.5"
                checked={defaultDirection === option}
                onChange={() => setDefaultDirection(option)}
              />
              <span className="text-gray-800">
                {t(directionLabelKey[option])}
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t('settings.sourcesTitle')}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {t('settings.singleSyncHint')}
            </p>
          </div>
          {!addingSource ? (
            <button
              type="button"
              onClick={() => setAddingSource(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <Plus size={16} />
              {t('settings.addRemote')}
            </button>
          ) : null}
        </div>

        {addingSource ? (
          <div className="mt-4">
            <SourceTypePicker
              manifests={manifests}
              onSelect={handleSelectSourceType}
              onCancel={() => setAddingSource(false)}
              t={t}
            />
          </div>
        ) : null}

        {!addingSource && sidebarSources.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            {t('settings.sourcesEmpty')}
          </p>
        ) : sidebarSources.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {t('settings.tableName')}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {t('settings.tableRepo')}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {t('settings.tableSyncTarget')}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {t('settings.tableActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sidebarSources.map((source: SidebarSource) => {
                  const unavailable = source.available === false;
                  const isSyncTarget =
                    !unavailable && activeSyncSourceId === source.id;
                  return (
                    <tr
                      key={source.id}
                      className={isSyncTarget ? 'bg-blue-50/60' : undefined}
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          {renderSourceTypeIcon(source.type)}
                          <span className="truncate font-medium text-gray-900">
                            {source.name}
                          </span>
                          {unavailable && (
                            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                              {t('sidebar.pluginUnavailable')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="font-mono text-xs">
                          {source.owner}/{source.repo}
                        </span>
                        {source.path ? (
                          <span className="mt-0.5 block text-xs text-gray-400">
                            {source.path}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {isSyncTarget ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {t('settings.currentSyncTarget')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={unavailable}
                            onClick={() => handleSourceSelect(source.id)}
                            className="text-xs text-blue-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                          >
                            {t('settings.setSyncTarget')}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={unavailable}
                            onClick={() => handleEdit(source.id)}
                            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                            title={t('sidebar.editSource')}
                            aria-label={t('sidebar.editSource')}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSource(source.id, t)}
                            className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title={t('sidebar.deleteSource')}
                            aria-label={t('sidebar.deleteSource')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
};
