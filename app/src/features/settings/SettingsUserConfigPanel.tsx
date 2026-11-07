import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import {
  exportUserConfig,
  importUserConfigText,
} from '@/features/settings/userConfigTransfer';
import { showError, showSuccess } from '@/ui/feedback/toast';

export function SettingsUserConfigPanel({ t }: { t: (key: string) => string }) {
  const [includeSources, setIncludeSources] = useState(false);

  const handleExport = async () => {
    const mode = await exportUserConfig({
      preferences: true,
      sources: includeSources,
    });
    if (mode === 'empty') {
      showError(t('settings.userConfig.exportEmpty'));
      return;
    }
    showSuccess(
      mode === 'clipboard'
        ? t('settings.userConfig.exportCopied')
        : t('settings.userConfig.exportDone'),
    );
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          showError(t('settings.userConfig.importFailed'));
          return;
        }
        const confirmKey = includeSources
          ? 'settings.userConfig.importConfirmWithSources'
          : 'settings.userConfig.importConfirm';
        if (!window.confirm(t(confirmKey))) {
          return;
        }
        const imported = importUserConfigText(reader.result, {
          preferences: true,
          sources: includeSources,
        });
        if (!imported) {
          showError(t('settings.userConfig.importFailed'));
          return;
        }
        if (
          !imported.appliedPreferences &&
          !imported.appliedSources &&
          imported.skippedBlocks.length > 0
        ) {
          showError(t('settings.userConfig.importSkippedOnly'));
          return;
        }
        const parts: string[] = [];
        if (imported.appliedPreferences) {
          parts.push(t('settings.userConfig.importPreferencesDone'));
        }
        if (imported.appliedSources) {
          parts.push(
            t('settings.userConfig.importSourcesDone').replace(
              '{count}',
              String(imported.sourceCount),
            ),
          );
        }
        if (imported.skippedBlocks.length > 0) {
          parts.push(t('settings.userConfig.importSkippedHint'));
        }
        showSuccess(parts.join(' · ') || t('settings.userConfig.exportDone'));
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.userConfig.title')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t('settings.userConfig.hint')}
        </p>
      </div>
      <label className="flex items-start gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={includeSources}
          onChange={event => setIncludeSources(event.target.checked)}
        />
        <span>{t('settings.userConfig.includeSources')}</span>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => {
            void handleExport();
          }}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:min-h-0 sm:py-1.5"
        >
          <Download size={16} aria-hidden />
          {t('settings.userConfig.export')}
        </button>
        <button
          type="button"
          onClick={handleImport}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:min-h-0 sm:py-1.5"
        >
          <Upload size={16} aria-hidden />
          {t('settings.userConfig.import')}
        </button>
      </div>
    </div>
  );
}
