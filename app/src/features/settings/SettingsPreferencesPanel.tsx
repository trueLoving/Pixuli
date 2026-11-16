import { Keyboard } from 'lucide-react';
import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { SettingsAppearancePanel } from './SettingsAppearancePanel';
import { SettingsLanguagePanel } from './SettingsLanguagePanel';

export function SettingsPreferencesPanel({
  t,
}: {
  t: (key: string) => string;
}) {
  const openKeyboardHelp = useUIStore(state => state.openKeyboardHelp);

  return (
    <div className="space-y-8">
      <SettingsLanguagePanel t={t} />
      <SettingsAppearancePanel t={t} />
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {t('settings.keyboardTitle')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('settings.keyboardHint')}
          </p>
        </div>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50"
          onClick={() => openKeyboardHelp()}
        >
          <span className="inline-flex items-center gap-2.5">
            <Keyboard size={18} className="text-gray-500" aria-hidden />
            {t('settings.keyboardViewShortcuts')}
          </span>
          <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-500">
            F5
          </kbd>
        </button>
      </div>
    </div>
  );
}
