import { X } from 'lucide-react';
import React, { useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useUIStore } from '@/stores/uiStore';
import { CompressToolPanel } from './compress';
import { ConvertToolPanel } from './convert';
import './UtilityToolOverlay.css';

export const UtilityToolOverlay: React.FC = () => {
  const { t } = useI18n();
  const currentUtilityTool = useUIStore(state => state.currentUtilityTool);
  const setCurrentUtilityTool = useUIStore(
    state => state.setCurrentUtilityTool,
  );
  const setActiveMenu = useUIStore(state => state.setActiveMenu);

  const close = useCallback(() => {
    setCurrentUtilityTool(null);
    setActiveMenu('library');
  }, [setActiveMenu, setCurrentUtilityTool]);

  if (!currentUtilityTool) {
    return null;
  }

  const title =
    currentUtilityTool === 'compress'
      ? t('tools.compress.title')
      : t('tools.convert.title');

  return (
    <div
      className="utility-tool-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="utility-tool-overlay__header">
        <h2 className="utility-tool-overlay__title">{title}</h2>
        <button
          type="button"
          className="utility-tool-overlay__close"
          onClick={close}
          aria-label={t('common.close')}
        >
          <X size={20} aria-hidden />
        </button>
      </div>
      <div className="utility-tool-overlay__body">
        {currentUtilityTool === 'compress' ? (
          <CompressToolPanel />
        ) : (
          <ConvertToolPanel />
        )}
      </div>
    </div>
  );
};
