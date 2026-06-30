import { ExternalLink } from 'lucide-react';
import React from 'react';
import { PIXULI_DOCS_URL } from './settingsTypes';

interface SettingsDocsPanelProps {
  t: (key: string) => string;
}

export const SettingsDocsPanel: React.FC<SettingsDocsPanelProps> = ({ t }) => {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.docsTitle')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{t('settings.docsHint')}</p>
      </div>
      <a
        href={PIXULI_DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
      >
        <ExternalLink size={16} />
        {t('settings.docsOpenLink')}
      </a>
    </div>
  );
};
