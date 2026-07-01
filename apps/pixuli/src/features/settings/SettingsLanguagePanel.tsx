import { Check } from 'lucide-react';
import React from 'react';
import { useI18n } from '@/i18n/useI18n';

interface SettingsLanguagePanelProps {
  t: (key: string) => string;
}

export const SettingsLanguagePanel: React.FC<SettingsLanguagePanelProps> = ({
  t,
}) => {
  const { changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const currentLanguage = getCurrentLanguage();
  const languages = getAvailableLanguages();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          {t('settings.menuLanguage')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{t('language.current')}</p>
      </div>
      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
        {languages.map(lang => {
          const active = lang.code === currentLanguage;
          return (
            <li key={lang.code}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                  active
                    ? 'bg-blue-50 font-medium text-blue-700'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
                onClick={() => changeLanguage(lang.code)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg" aria-hidden>
                    {lang.flag}
                  </span>
                  <span>{lang.name}</span>
                </span>
                {active ? (
                  <Check size={18} className="shrink-0 text-blue-600" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
