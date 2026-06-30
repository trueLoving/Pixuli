import {
  getManifestDescription,
  isKnownBuiltinPluginId,
  type StoragePluginManifest,
} from '@pixuli/core/plugins';
import { Github, X } from 'lucide-react';
import React from 'react';

interface SourceTypePickerProps {
  manifests: StoragePluginManifest[];
  onSelect: (pluginId: string) => void;
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

function hoverClassForPlugin(pluginId: string): string {
  if (pluginId === 'gitee') {
    return 'hover:border-red-400 hover:bg-red-50';
  }
  return 'hover:border-blue-400 hover:bg-blue-50';
}

export const SourceTypePicker: React.FC<SourceTypePickerProps> = ({
  manifests,
  onSelect,
  onCancel,
  t,
}) => {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">
          {t('sidebar.selectSourceType')}
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
      {manifests.length === 0 ? (
        <p className="text-sm text-gray-500">{t('sidebar.noStoragePlugins')}</p>
      ) : (
        <div className="space-y-2">
          {manifests.map(manifest => (
            <button
              key={manifest.id}
              type="button"
              onClick={() => {
                if (!isKnownBuiltinPluginId(manifest.id)) {
                  return;
                }
                onSelect(manifest.id);
              }}
              disabled={!isKnownBuiltinPluginId(manifest.id)}
              className={`flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${hoverClassForPlugin(manifest.id)}`}
            >
              <PluginTypeIcon pluginId={manifest.id} name={manifest.name} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900">
                  {manifest.name}
                </div>
                <div className="text-xs text-gray-500">
                  {getManifestDescription(manifest, t)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
