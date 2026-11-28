import { Puzzle, FolderInput, Trash2 } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { showError, showSuccess } from '@/ui/feedback/toast';
import {
  canInstallOfflinePlugins,
  canUninstallOfflinePlugins,
  installOfflinePlugin,
  listManagedPluginsForPlatform,
  originLabelKey,
  setPluginEnabled,
  uninstallOfflinePlugin,
  type ManagedPluginRow,
} from '@/plugins/pluginManagement';

export function SettingsPluginsPanel({ t }: { t: (key: string) => string }) {
  const [rows, setRows] = useState<ManagedPluginRow[]>(() =>
    listManagedPluginsForPlatform(),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const allowInstall = canInstallOfflinePlugins();
  const allowUninstall = canUninstallOfflinePlugins();
  const useDesktopPicker = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.pluginsAPI?.installFromDirectory === 'function',
    [],
  );

  const refresh = useCallback(() => {
    setRows(listManagedPluginsForPlatform());
  }, []);

  const handleToggle = async (row: ManagedPluginRow, enabled: boolean) => {
    setBusyId(row.id);
    try {
      await setPluginEnabled(row.id, enabled);
      refresh();
      showSuccess(
        enabled
          ? t('settings.plugins.enabledToast').replace('{name}', row.name)
          : t('settings.plugins.disabledToast').replace('{name}', row.name),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(t('settings.plugins.toggleFailed').replace('{error}', message));
    } finally {
      setBusyId(null);
    }
  };

  const runInstall = async (mobileFiles?: File[]) => {
    setInstalling(true);
    try {
      const result = await installOfflinePlugin({ mobileFiles });
      if (result.canceled) return;
      if (!result.ok) {
        showError(
          t('settings.plugins.installFailed').replace(
            '{error}',
            result.error ?? 'unknown',
          ),
        );
        return;
      }
      refresh();
      showSuccess(
        t('settings.plugins.installSuccess').replace(
          '{id}',
          result.pluginId ?? '',
        ),
      );
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (row: ManagedPluginRow) => {
    if (row.origin !== 'external') return;
    const confirmed = window.confirm(
      t('settings.plugins.uninstallConfirm').replace('{name}', row.name),
    );
    if (!confirmed) return;

    setBusyId(row.id);
    try {
      const result = await uninstallOfflinePlugin(row.id);
      if (!result.ok) {
        showError(
          t('settings.plugins.uninstallFailed').replace(
            '{error}',
            result.error ?? 'unknown',
          ),
        );
        return;
      }
      refresh();
      showSuccess(
        t('settings.plugins.uninstallSuccess').replace('{name}', row.name),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          {t('settings.plugins.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {allowInstall
            ? t('settings.plugins.hintDesktopMobile')
            : t('settings.plugins.hintWeb')}
        </p>
      </div>

      {allowInstall ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-600">
            {t('settings.plugins.installHint')}
          </p>
          <button
            type="button"
            disabled={installing}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            onClick={() => {
              if (useDesktopPicker) {
                void runInstall();
                return;
              }
              folderInputRef.current?.click();
            }}
          >
            <FolderInput size={16} aria-hidden />
            {installing
              ? t('settings.plugins.installing')
              : t('settings.plugins.installFromFolder')}
          </button>
          {!useDesktopPicker ? (
            <input
              ref={folderInputRef}
              type="file"
              className="hidden"
              multiple
              {...{ webkitdirectory: '', directory: '' }}
              onChange={event => {
                const list = event.target.files
                  ? Array.from(event.target.files)
                  : [];
                event.target.value = '';
                void runInstall(list);
              }}
            />
          ) : null}
        </div>
      ) : null}

      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-sm text-gray-500">
            {t('settings.plugins.empty')}
          </li>
        ) : (
          rows.map(row => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                <Puzzle size={18} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {row.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {row.id} · v{row.version} · {t(originLabelKey(row.origin))}
                  {row.capabilities.length > 0
                    ? ` · ${row.capabilities.join(', ')}`
                    : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {allowUninstall && row.origin === 'external' ? (
                  <button
                    type="button"
                    disabled={busyId === row.id || installing}
                    className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    onClick={() => {
                      void handleUninstall(row);
                    }}
                  >
                    <Trash2 size={14} aria-hidden />
                    {t('settings.plugins.uninstall')}
                  </button>
                ) : null}
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <span className="sr-only">
                    {t('settings.plugins.toggleLabel').replace(
                      '{name}',
                      row.name,
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[color:var(--pix-violet)] focus:ring-[color:var(--pix-violet)]"
                    checked={row.enabled}
                    disabled={busyId === row.id}
                    onChange={event => {
                      void handleToggle(row, event.target.checked);
                    }}
                  />
                </label>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
