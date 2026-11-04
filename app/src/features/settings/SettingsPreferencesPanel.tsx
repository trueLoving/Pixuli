import React from 'react';
import { SettingsAppearancePanel } from './SettingsAppearancePanel';
import { SettingsLanguagePanel } from './SettingsLanguagePanel';

export function SettingsPreferencesPanel({
  t,
}: {
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-8">
      <SettingsLanguagePanel t={t} />
      <SettingsAppearancePanel t={t} />
    </div>
  );
}
