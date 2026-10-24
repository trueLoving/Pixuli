import { Check } from 'lucide-react';
import React from 'react';
import { useThemeStore } from '@/features/theme/themeStore';
import type { ThemePreference } from '@/features/theme/theme';

interface SettingsAppearancePanelProps {
  t: (key: string) => string;
}

const OPTIONS: Array<{ id: ThemePreference; labelKey: string }> = [
  { id: 'system', labelKey: 'settings.appearanceSystem' },
  { id: 'light', labelKey: 'settings.appearanceLight' },
  { id: 'dark', labelKey: 'settings.appearanceDark' },
];

export const SettingsAppearancePanel: React.FC<
  SettingsAppearancePanelProps
> = ({ t }) => {
  const preference = useThemeStore(state => state.preference);
  const setPreference = useThemeStore(state => state.setPreference);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          {t('settings.appearanceTitle')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('settings.appearanceHint')}
        </p>
      </div>
      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
        {OPTIONS.map(option => {
          const active = option.id === preference;
          return (
            <li key={option.id}>
              <button
                type="button"
                className={`flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                  active
                    ? 'pix-nav-active font-medium'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
                onClick={() => setPreference(option.id)}
              >
                <span>{t(option.labelKey)}</span>
                {active ? (
                  <Check size={18} className="shrink-0 pix-icon-brand" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
