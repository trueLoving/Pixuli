import type { SidebarSource } from '@/features/settings/sidebarSourceTypes';
import { Download, Edit, Github, Plus, Trash2, Upload } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CapabilityChips } from '@/features/source-type/CapabilityChips';
import { ConnectionWizard } from '@/features/settings/connection-wizard/ConnectionWizard';
import type { GitPatFieldValues } from '@/features/settings/git-connection/GitPatConnectionFields';
import { useSourceManagement } from '@/features/settings/useSourceManagement';
import { useSourceStore } from '@/features/settings/sourceStore';
import type { OneDriveFieldValues } from '@/features/settings/connection-wizard/OneDriveConnectionFields';
import { listStoragePluginManifests } from '@/storage/registry';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import {
  exportSettingsConfig,
  importSettingsConfigText,
} from '@/features/settings/settingsConfigTransfer';
import { showError, showSuccess } from '@/ui/feedback/toast';

interface SettingsSyncPanelProps {
  t: (key: string) => string;
}

function renderSourceTypeIcon(type: SidebarSource['type']) {
  if (type === 'github') {
    return <Github size={14} className="shrink-0 text-gray-700" />;
  }
  if (type === 'onedrive') {
    return (
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-sky-600 text-[9px] font-bold text-white">
        云
      </span>
    );
  }
  return (
    <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-red-500 text-[9px] font-bold text-white">
      码
    </span>
  );
}

export const SettingsSyncPanel: React.FC<SettingsSyncPanelProps> = ({ t }) => {
  const [addingSource, setAddingSource] = useState(false);
  const settingsSyncAddOpen = useUIStore(state => state.settingsSyncAddOpen);
  const settingsSyncPrefillPluginId = useUIStore(
    state => state.settingsSyncPrefillPluginId,
  );
  const clearSettingsSyncAddOpen = useUIStore(
    state => state.clearSettingsSyncAddOpen,
  );
  const openConfigModalForEdit = useUIStore(
    state => state.openConfigModalForEdit,
  );
  const closeConfigModal = useUIStore(state => state.closeConfigModal);
  const editingSourceId = useUIStore(state => state.editingSourceId);
  const editingSourcePluginId = useUIStore(
    state => state.editingSourcePluginId,
  );
  const editingSourceRepoConfig = useUIStore(
    state => state.editingSourceRepoConfig,
  );
  const {
    sidebarSources,
    selectedSource,
    handleSourceSelect,
    handleEditSource,
    handleDeleteSource,
  } = useSourceManagement();

  const sources = useSourceStore(state => state.sources);
  const manifests = listStoragePluginManifests();
  const activeSyncSourceId = selectedSource?.id ?? null;
  const syncStatus = useWorkspaceStore(state => state.syncStatus);

  const editingOneDrive = useMemo((): OneDriveFieldValues | null => {
    if (editingSourcePluginId !== 'onedrive' || !editingSourceId) return null;
    const source = sources.find(item => item.id === editingSourceId);
    if (!source) return null;
    const config = source.config;
    return {
      clientId: typeof config.clientId === 'string' ? config.clientId : '',
      accessToken:
        typeof config.accessToken === 'string' ? config.accessToken : '',
      refreshToken:
        typeof config.refreshToken === 'string' ? config.refreshToken : '',
      path: typeof config.path === 'string' ? config.path : 'Pixuli',
      ...(typeof config.expiresAt === 'number'
        ? { expiresAt: config.expiresAt }
        : {}),
    };
  }, [sources, editingSourceId, editingSourcePluginId]);

  const isGitEditing = Boolean(
    editingSourceId &&
      (editingSourcePluginId === 'github' ||
        editingSourcePluginId === 'gitee') &&
      editingSourceRepoConfig,
  );
  const isOneDriveEditing = Boolean(
    editingSourceId && editingSourcePluginId === 'onedrive',
  );
  const isEditing = isGitEditing || isOneDriveEditing;
  const wizardOpen = isEditing || addingSource;

  const editInitialValues = useMemo((): GitPatFieldValues | null => {
    if (!editingSourceRepoConfig) return null;
    return {
      owner: editingSourceRepoConfig.owner,
      repo: editingSourceRepoConfig.repo,
      branch: editingSourceRepoConfig.branch,
      token: editingSourceRepoConfig.token,
      path: editingSourceRepoConfig.path,
    };
  }, [editingSourceRepoConfig]);

  const [addPrefillPluginId, setAddPrefillPluginId] = useState<
    'github' | 'gitee' | null
  >(null);

  useEffect(() => {
    if (settingsSyncAddOpen) {
      closeConfigModal();
      setAddPrefillPluginId(settingsSyncPrefillPluginId);
      setAddingSource(true);
      clearSettingsSyncAddOpen();
    }
  }, [
    settingsSyncAddOpen,
    settingsSyncPrefillPluginId,
    clearSettingsSyncAddOpen,
    closeConfigModal,
  ]);

  useEffect(() => {
    if (isEditing) {
      setAddingSource(false);
    }
  }, [isEditing]);

  const handleEdit = (sourceId: string) => {
    const id = handleEditSource(sourceId);
    if (id) {
      setAddingSource(false);
      openConfigModalForEdit(id);
    }
  };

  const closeWizard = () => {
    setAddingSource(false);
    setAddPrefillPluginId(null);
    closeConfigModal();
  };

  const handleExportConfig = async () => {
    const mode = await exportSettingsConfig();
    if (mode === 'empty') {
      showError(t('settings.exportEmpty'));
      return;
    }
    showSuccess(
      mode === 'clipboard'
        ? t('settings.exportCopied')
        : t('settings.exportDone'),
    );
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          showError(t('settings.importFailed'));
          return;
        }
        if (!window.confirm(t('settings.importConfirm'))) {
          return;
        }
        const imported = importSettingsConfigText(reader.result);
        if (!imported) {
          showError(t('settings.importFailed'));
          return;
        }
        showSuccess(
          t('settings.importDone').replace('{count}', String(imported.count)),
        );
      };
      reader.readAsText(file);
    };
    input.click();
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
          {!wizardOpen ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleExportConfig();
                }}
                disabled={sources.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} />
                {t('settings.exportConfig')}
              </button>
              <button
                type="button"
                onClick={handleImportConfig}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Upload size={16} />
                {t('settings.importConfig')}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeConfigModal();
                  setAddPrefillPluginId(null);
                  setAddingSource(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Plus size={16} />
                {t('settings.addRemote')}
              </button>
            </div>
          ) : null}
        </div>

        {wizardOpen ? (
          <ConnectionWizard
            key={
              isEditing
                ? `edit:${editingSourceId}`
                : `add:${addPrefillPluginId ?? 'pick'}`
            }
            manifests={manifests}
            t={t}
            onCancel={closeWizard}
            onComplete={closeWizard}
            editSourceId={isEditing ? editingSourceId : null}
            initialPluginId={
              isEditing &&
              (editingSourcePluginId === 'github' ||
                editingSourcePluginId === 'gitee' ||
                editingSourcePluginId === 'onedrive')
                ? editingSourcePluginId
                : addPrefillPluginId
            }
            initialValues={isGitEditing ? editInitialValues : null}
            initialOneDrive={isOneDriveEditing ? editingOneDrive : null}
          />
        ) : null}

        {!wizardOpen && sidebarSources.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            {t('settings.sourcesEmpty')}
          </p>
        ) : sidebarSources.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-1">
            {sidebarSources.map((source: SidebarSource) => {
              const unavailable = source.available === false;
              const isEditingThis = Boolean(
                isEditing && editingSourceId === source.id,
              );
              const isSyncTarget =
                !unavailable && activeSyncSourceId === source.id;
              const highlighted = isEditing ? isEditingThis : isSyncTarget;
              const health = syncStatus?.bindings[source.id];
              const lastSync = health?.lastSyncAt
                ? new Date(health.lastSyncAt).toLocaleString()
                : t('settings.healthNever');
              const pending = health?.pendingPush ?? 0;
              return (
                <article
                  key={source.id}
                  aria-current={isEditingThis ? 'true' : undefined}
                  className={`rounded-lg border p-4 ${
                    highlighted
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
                        aria-pressed={isEditingThis}
                        className={`rounded-md p-1.5 disabled:cursor-not-allowed disabled:opacity-40 ${
                          isEditingThis
                            ? 'bg-[var(--pix-violet)] text-white'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                        }`}
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
                    {isEditingThis ? (
                      <span className="inline-flex items-center rounded-full bg-[var(--pix-violet)] px-2 py-0.5 text-xs font-medium text-white">
                        {t('settings.editingSource')}
                      </span>
                    ) : null}
                    {isSyncTarget ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          isEditing && !isEditingThis
                            ? 'border border-gray-300 bg-white text-gray-600'
                            : 'pix-badge-brand'
                        }`}
                      >
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
