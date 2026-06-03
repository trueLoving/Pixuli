import {
  getManifestDescription,
  isKnownBuiltinPluginId,
  type StoragePluginManifest,
} from '@pixuli/core/plugins';
import { Github, X } from 'lucide-react';
import React from 'react';

interface SourceTypeMenuProps {
  isOpen: boolean;
  manifests: StoragePluginManifest[];
  onClose: () => void;
  onSelect: (pluginId: string) => void;
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
      <div className="flex-shrink-0 w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
        <Github size={24} className="text-white" />
      </div>
    );
  }
  if (pluginId === 'gitee') {
    return (
      <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition-colors">
        <span className="text-white font-bold text-sm">码</span>
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
      <span className="text-white font-semibold text-sm">
        {name.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

function hoverClassForPlugin(pluginId: string): string {
  if (pluginId === 'gitee') {
    return 'hover:border-red-500 hover:bg-red-50';
  }
  return 'hover:border-blue-500 hover:bg-blue-50';
}

export const SourceTypeMenu: React.FC<SourceTypeMenuProps> = ({
  isOpen,
  manifests,
  onClose,
  onSelect,
  t,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('sidebar.selectSourceType')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {manifests.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {t('sidebar.noStoragePlugins')}
            </p>
          ) : (
            manifests.map(manifest => (
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
                className={`w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${hoverClassForPlugin(manifest.id)}`}
              >
                <PluginTypeIcon pluginId={manifest.id} name={manifest.name} />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">
                    {manifest.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getManifestDescription(manifest, t)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
