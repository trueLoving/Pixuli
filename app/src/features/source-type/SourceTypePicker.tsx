import {
  getManifestDescription,
  type StoragePluginManifest,
} from '@pixuli/core/plugins';
import { Github, X } from 'lucide-react';
import React, { useState } from 'react';
import { CapabilityChips } from './CapabilityChips';
import type { ConnectionPurpose } from './connectionPurpose';
import { UPCOMING_CONNECTORS } from './upcomingConnectors';

interface SourceTypePickerProps {
  manifests: StoragePluginManifest[];
  onSelect: (pluginId: string, purpose: ConnectionPurpose) => void;
  onCancel?: () => void;
  t: (key: string) => string;
}

function PluginTypeIcon({
  pluginId,
  name,
}: {
  pluginId: string;
  name: string;
}) {
  if (pluginId === 'github') {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
        <Github size={20} className="text-white" />
      </div>
    );
  }
  if (pluginId === 'gitee') {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600">
        <span className="text-sm font-bold text-white">码</span>
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-500">
      <span className="text-sm font-semibold text-white">
        {name.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

const PURPOSE_OPTIONS: Array<{
  value: ConnectionPurpose;
  titleKey: string;
  hintKey: string;
}> = [
  {
    value: 'backup',
    titleKey: 'settings.purposeBackup',
    hintKey: 'settings.purposeBackupHint',
  },
  {
    value: 'defaultSync',
    titleKey: 'settings.purposeDefaultSync',
    hintKey: 'settings.purposeDefaultSyncHint',
  },
  {
    value: 'publishChannel',
    titleKey: 'settings.purposePublishChannel',
    hintKey: 'settings.purposePublishChannelHint',
  },
];

export const SourceTypePicker: React.FC<SourceTypePickerProps> = ({
  manifests,
  onSelect,
  onCancel,
  t,
}) => {
  const [pluginId, setPluginId] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<ConnectionPurpose>('defaultSync');
  const selected = manifests.find(item => item.id === pluginId);

  return (
    <div className="pix-panel-soft rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">
          {pluginId
            ? t('settings.wizardPurposeTitle')
            : t('sidebar.selectSourceType')}
        </p>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-gray-500 hover:bg-white hover:text-gray-800"
            aria-label={t('common.cancel')}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {pluginId && selected ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{selected.name}</p>
          <div className="space-y-2">
            {PURPOSE_OPTIONS.map(option => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <input
                  type="radio"
                  name="connection-purpose"
                  className="mt-1"
                  checked={purpose === option.value}
                  onChange={() => setPurpose(option.value)}
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    {t(option.titleKey)}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {t(option.hintKey)}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-white"
              onClick={() => setPluginId(null)}
            >
              {t('settings.wizardBack')}
            </button>
            <button
              type="button"
              className="rounded-md pix-btn-primary px-3 py-1.5 text-sm"
              onClick={() => onSelect(pluginId, purpose)}
            >
              {t('settings.wizardContinue')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {manifests.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t('sidebar.noStoragePlugins')}
            </p>
          ) : (
            manifests.map(manifest => (
              <button
                key={manifest.id}
                type="button"
                onClick={() => setPluginId(manifest.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors pix-hover-card"
              >
                <PluginTypeIcon pluginId={manifest.id} name={manifest.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {manifest.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getManifestDescription(manifest, t)}
                  </div>
                  <CapabilityChips manifest={manifest} t={t} />
                </div>
              </button>
            ))
          )}
          <p className="pt-2 text-xs font-medium text-gray-500">
            {t('settings.upcomingTitle')}
          </p>
          {UPCOMING_CONNECTORS.map(item => (
            <div
              key={item.id}
              className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 opacity-70"
            >
              <PluginTypeIcon pluginId={item.id} name={item.name} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-700">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500">
                  {t(`sidebar.${item.id}Description`)}
                </div>
                <CapabilityChips capabilities={item.capabilities} t={t} muted />
              </div>
              <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                {t('settings.comingSoon')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
