import type { SidebarSource } from '@/ui';
import { Edit, Github, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SourceTypePicker } from '@/features/source-type/SourceTypePicker';
import { CapabilityChips } from '@/features/source-type/CapabilityChips';
import type { ConnectionPurpose } from '@/features/source-type/connectionPurpose';
import { useSourceManagement } from '@/hooks/useSourceManagement';
import { listStoragePluginManifests } from '@/storage/registry';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface SettingsSyncPanelProps {
  t: (key: string) => string;
}

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
  const syncStatus = useWorkspaceStore(state => state.syncStatus);

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

  const handleSelectSourceType = (
    pluginId: string,
    purpose: ConnectionPurpose,
  ) => {
    setAddingSource(false);
    beginNewSource(pluginId, purpose);
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t('settings.sourcesTitle')}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {t('settings.singleSyncHint')}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t('settings.syncOnClickHint')}
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
          <div className="mt-4 grid gap-3 sm:grid-cols-1">
            {sidebarSources.map((source: SidebarSource) => {
              const unavailable = source.available === false;
              const isSyncTarget =
                !unavailable && activeSyncSourceId === source.id;
              const health = syncStatus?.bindings[source.id];
              const lastSync = health?.lastSyncAt
                ? new Date(health.lastSyncAt).toLocaleString()
                : t('settings.healthNever');
              const pending = health?.pendingPush ?? 0;
              return (
                <article
                  key={source.id}
                  className={`rounded-lg border p-4 ${
                    isSyncTarget
                      ? 'border-[var(--pix-violet)] bg-[var(--pix-violet-soft)]'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {renderSourceTypeIcon(source.type)}
                        <h3 className="truncate text-sm font-semibold text-gray-900">
                          {source.name}
                        </h3>
                        {unavailable ? (
                          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                            {t('sidebar.pluginUnavailable')}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 font-mono text-xs text-gray-600">
                        {source.owner}/{source.repo}
                        {source.path ? ` · ${source.path}` : ''}
                      </p>
                      <div className="mt-2">
                        <CapabilityChips
                          manifest={manifests.find(
                            item => item.id === source.type,
                          )}
                          t={t}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-600">
                        {t('settings.healthLastSync')}: {lastSync}
                        {' · '}
                        {t('settings.healthPending')}: {pending}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
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
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {isSyncTarget ? (
                      <span className="inline-flex items-center rounded-full pix-badge-brand px-2 py-0.5 text-xs font-medium">
                        {t('settings.currentSyncTarget')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={() => handleSourceSelect(source.id)}
                        className="pix-link text-xs disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                      >
                        {t('settings.setSyncTarget')}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
};
