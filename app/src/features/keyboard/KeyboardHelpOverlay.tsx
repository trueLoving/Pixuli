import { Keyboard, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { keyboardManager, SHORTCUT_CATEGORIES, useEscapeKey } from '@/ui';
import { useI18n } from '@/i18n/useI18n';
import { useUIStore } from '@/stores/uiStore';
import { buildShortcutHelpRows } from './formatShortcutLabel';
import './KeyboardHelpOverlay.css';

const CATEGORY_I18N: Record<string, string> = {
  [SHORTCUT_CATEGORIES.GENERAL]: 'keyboard.categories.general',
  [SHORTCUT_CATEGORIES.NAVIGATION]: 'keyboard.categories.navigation',
  [SHORTCUT_CATEGORIES.MODAL]: 'keyboard.categories.modal',
  [SHORTCUT_CATEGORIES.IMAGE_BROWSER]: 'keyboard.categories.browsing',
  [SHORTCUT_CATEGORIES.IMAGE_EDIT]: 'keyboard.categories.features',
  [SHORTCUT_CATEGORIES.SEARCH]: 'keyboard.categories.search',
  [SHORTCUT_CATEGORIES.HELP]: 'keyboard.categories.help',
};

const CATEGORY_ORDER = [
  SHORTCUT_CATEGORIES.GENERAL,
  SHORTCUT_CATEGORIES.NAVIGATION,
  SHORTCUT_CATEGORIES.SEARCH,
  SHORTCUT_CATEGORIES.IMAGE_BROWSER,
  SHORTCUT_CATEGORIES.IMAGE_EDIT,
  SHORTCUT_CATEGORIES.HELP,
  SHORTCUT_CATEGORIES.MODAL,
];

export const KeyboardHelpOverlay: React.FC = () => {
  const { t } = useI18n();
  const isOpen = useUIStore(state => state.showKeyboardHelp);
  const close = useUIStore(state => state.closeKeyboardHelp);
  const panelRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => {
    if (isOpen) close();
  }, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? panel).focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    const ipc = window.ipcRenderer;
    if (!ipc?.on) return;
    const handler = () => {
      useUIStore.getState().openKeyboardHelp();
    };
    ipc.on('open-keyboard-help', handler);
    return () => {
      ipc.off('open-keyboard-help', handler);
    };
  }, []);

  const sections = useMemo(() => {
    if (!isOpen) return [];
    const rows = buildShortcutHelpRows(
      keyboardManager.getCategories().flatMap(cat => cat.shortcuts),
    );
    const byCategory = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = byCategory.get(row.category) ?? [];
      list.push(row);
      byCategory.set(row.category, list);
    }
    const ordered = CATEGORY_ORDER.filter(id => byCategory.has(id));
    for (const id of byCategory.keys()) {
      if (!ordered.includes(id)) ordered.push(id);
    }
    return ordered.map(id => ({
      id,
      title: t(CATEGORY_I18N[id] ?? id),
      rows: byCategory.get(id) ?? [],
    }));
  }, [isOpen, t]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="keyboard-help-overlay" role="presentation">
      <button
        type="button"
        className="keyboard-help-overlay-backdrop"
        aria-label={t('image.actions.dismissMenu')}
        onClick={close}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="keyboard-help-overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
      >
        <header className="keyboard-help-header">
          <div className="keyboard-help-heading">
            <Keyboard
              size={20}
              className="keyboard-help-heading-icon"
              aria-hidden
            />
            <div>
              <h2 id="keyboard-help-title" className="keyboard-help-title">
                {t('keyboard.title')}
              </h2>
              <p className="keyboard-help-subtitle">{t('keyboard.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            className="keyboard-help-close"
            onClick={close}
            aria-label={t('common.close')}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="keyboard-help-body">
          {sections.map(section => (
            <section key={section.id} className="keyboard-help-section">
              <h3 className="keyboard-help-section-title">{section.title}</h3>
              <ul className="keyboard-help-list">
                {section.rows.map(row => (
                  <li
                    key={`${row.category}-${row.description}-${row.chord}`}
                    className="keyboard-help-row"
                  >
                    <span className="keyboard-help-desc">
                      {row.description}
                    </span>
                    <kbd className="keyboard-help-chord">{row.chord}</kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="keyboard-help-tips">
            <h3 className="keyboard-help-section-title">
              {t('keyboard.usageTips.title')}
            </h3>
            <ul className="keyboard-help-tips-list">
              <li>{t('keyboard.usageTips.tip1')}</li>
              <li>{t('keyboard.usageTips.tip2')}</li>
              <li>{t('keyboard.usageTips.tip3')}</li>
              <li>{t('keyboard.usageTips.tip4')}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
};
