import { Command, RefreshCw, Zap } from 'lucide-react';
import React from 'react';
import { useKeyboardCategories } from '@/hooks/useKeyboardCategories';

interface SettingsKeyboardPanelProps {
  t: (key: string) => string;
}

function formatShortcut(shortcut: {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}) {
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('Cmd');
  parts.push(shortcut.key);
  return parts.join(' + ');
}

export const SettingsKeyboardPanel: React.FC<SettingsKeyboardPanelProps> = ({
  t,
}) => {
  const categories = useKeyboardCategories(t);

  const getCategoryIcon = (name: string) => {
    if (name === t('keyboard.categories.general')) {
      return <Command size={16} className="text-blue-600" />;
    }
    if (name === t('keyboard.categories.browsing')) {
      return <RefreshCw size={16} className="text-blue-600" />;
    }
    return <Zap size={16} className="text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('keyboard.title')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{t('keyboard.subtitle')}</p>
      </div>

      {categories.map(category => (
        <section key={category.name}>
          <div className="mb-3 flex items-center gap-2">
            {getCategoryIcon(category.name)}
            <h4 className="text-sm font-medium text-gray-900">
              {category.name}
            </h4>
          </div>
          <div className="space-y-2">
            {category.shortcuts.map((shortcut, index) => (
              <div
                key={`${category.name}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="text-gray-700">{shortcut.description}</span>
                <kbd className="rounded border border-gray-300 bg-white px-2 py-0.5 font-mono text-xs text-gray-800">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
        <h4 className="text-sm font-medium text-gray-900">
          {t('keyboard.usageTips.title')}
        </h4>
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          <li>{t('keyboard.usageTips.tip1')}</li>
          <li>{t('keyboard.usageTips.tip2')}</li>
          <li>{t('keyboard.usageTips.tip3')}</li>
          <li>{t('keyboard.usageTips.tip4')}</li>
        </ul>
      </section>
    </div>
  );
};
