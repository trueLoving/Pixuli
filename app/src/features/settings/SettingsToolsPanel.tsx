import { useUtilityToolsStore } from '@/features/tools/utilityToolsConfig';
import React from 'react';

interface SettingsToolsPanelProps {
  t: (key: string) => string;
}

export const SettingsToolsPanel: React.FC<SettingsToolsPanelProps> = ({
  t,
}) => {
  const enabled = useUtilityToolsStore(state => state.enabled);
  const setEnabled = useUtilityToolsStore(state => state.setEnabled);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.toolsCompressTitle')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t('settings.toolsCompressHint')}
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={enabled}
            onChange={event => setEnabled(event.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-gray-900">
              {t('settings.toolsCompressEnable')}
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              {enabled
                ? t('settings.toolsCompressOnDetail')
                : t('settings.toolsCompressOffDetail')}
            </span>
          </span>
        </label>
        <p className="mt-3 text-xs text-gray-500">
          {t('settings.toolsLocalOnlyNote')}
        </p>
      </section>
    </div>
  );
};
