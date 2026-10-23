import { useEscapeKey } from '@/ui';
import type { VersionInfo } from './version-info';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Globe,
  Info,
  RefreshCw,
  ScrollText,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { SettingsLanguagePanel } from './SettingsLanguagePanel';
import { SettingsOperationLogPanel } from './SettingsOperationLogPanel';
import { SettingsSyncPanel } from './SettingsSyncPanel';
import { SettingsToolsPanel } from './SettingsToolsPanel';
import { SettingsVersionPanel } from './SettingsVersionPanel';
import { SettingsWorkspacePanel } from './SettingsWorkspacePanel';
import type { SettingsSection } from './settingsTypes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
  versionInfo: VersionInfo;
}

/** 主路径打磨期暂隐设置 → 快捷键；代码与类型仍保留便于恢复 */
const HIDDEN_SETTINGS_SECTIONS = new Set<SettingsSection>(['keyboard']);

const GENERAL_ITEMS: Array<{
  id: SettingsSection;
  labelKey: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'workspace',
    labelKey: 'settings.menuWorkspace',
    icon: <FolderOpen size={18} />,
  },
  {
    id: 'language',
    labelKey: 'settings.menuLanguage',
    icon: <Globe size={18} />,
  },
  // keyboard：HIDDEN_SETTINGS_SECTIONS
  {
    id: 'operationLog',
    labelKey: 'settings.menuOperationLog',
    icon: <ScrollText size={18} />,
  },
  {
    id: 'version',
    labelKey: 'settings.menuVersion',
    icon: <Info size={18} />,
  },
  {
    id: 'tools',
    labelKey: 'settings.menuTools',
    icon: <SlidersHorizontal size={18} />,
  },
];

function resolveVisibleSection(section: SettingsSection): SettingsSection {
  return HIDDEN_SETTINGS_SECTIONS.has(section) ? 'workspace' : section;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  t,
  versionInfo,
}) => {
  const settingsSection = useUIStore(state => state.settingsSection);
  const isMobile = useMobileViewport();
  const [activeSection, setActiveSection] = useState<SettingsSection>(() =>
    resolveVisibleSection(settingsSection),
  );
  const [showMobileMenu, setShowMobileMenu] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const section = resolveVisibleSection(settingsSection);
    setActiveSection(section);
    setShowMobileMenu(section === 'workspace');
  }, [isOpen, settingsSection]);

  useEscapeKey(() => {
    if (isOpen) onClose();
  }, isOpen);

  if (!isOpen) return null;

  const groups: Array<{
    labelKey: string;
    items: Array<{
      id: SettingsSection;
      labelKey: string;
      icon: React.ReactNode;
    }>;
  }> = [
    { labelKey: 'settings.groupGeneral', items: GENERAL_ITEMS },
    {
      labelKey: 'settings.groupSync',
      items: [
        {
          id: 'sync',
          labelKey: 'settings.menuSync',
          icon: <RefreshCw size={18} />,
        },
      ],
    },
  ];

  const activeItem = groups
    .flatMap(group => group.items)
    .find(item => item.id === activeSection);
  const showingMobileDetail = isMobile && !showMobileMenu;
  const headerTitle =
    showingMobileDetail && activeItem
      ? t(activeItem.labelKey)
      : t('settings.title');

  const openSection = (id: SettingsSection) => {
    setActiveSection(id);
    if (isMobile) setShowMobileMenu(false);
  };

  const renderDesktopItem = (item: (typeof GENERAL_ITEMS)[number]) => (
    <button
      key={item.id}
      type="button"
      onClick={() => openSection(item.id)}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
        activeSection === item.id
          ? 'border-r-2 border-[color:var(--pix-violet)] bg-white font-medium pix-text-brand'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {item.icon}
      {t(item.labelKey)}
    </button>
  );

  const sectionBody = (
    <>
      {activeSection === 'workspace' && <SettingsWorkspacePanel />}
      {activeSection === 'operationLog' && <SettingsOperationLogPanel />}
      {activeSection === 'language' && <SettingsLanguagePanel t={t} />}
      {activeSection === 'version' && (
        <SettingsVersionPanel t={t} versionInfo={versionInfo} />
      )}
      {activeSection === 'sync' && <SettingsSyncPanel t={t} />}
      {activeSection === 'tools' && <SettingsToolsPanel t={t} />}
    </>
  );

  return (
    <div
      className={
        isMobile
          ? 'fixed inset-0 z-[60] flex bg-white'
          : 'fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4'
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={isMobile ? undefined : onClose}
    >
      <div
        className={
          isMobile
            ? 'flex h-full min-h-0 w-full flex-col bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
            : 'flex h-[min(90dvh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl'
        }
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 md:px-5 md:py-4">
          <div className="flex min-w-0 items-center gap-1">
            {showingMobileDetail ? (
              <button
                type="button"
                onClick={() => setShowMobileMenu(true)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
                aria-label={t('settings.back')}
              >
                <ChevronLeft size={22} />
              </button>
            ) : (
              <Settings
                size={20}
                className={`shrink-0 text-gray-700 ${isMobile ? 'ml-2' : ''}`}
              />
            )}
            <h2
              id="settings-modal-title"
              className="truncate text-lg font-semibold text-gray-900"
            >
              {headerTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label={t('settings.close')}
          >
            <X size={20} />
          </button>
        </div>

        {isMobile && showMobileMenu ? (
          <nav
            className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-4 py-4"
            aria-label={t('settings.navLabel')}
          >
            {groups.map(group => (
              <section key={group.labelKey} className="mb-5">
                <p className="px-1 pb-2 text-xs font-medium text-gray-500">
                  {t(group.labelKey)}
                </p>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {group.items.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openSection(item.id)}
                      className={`flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-900 ${
                        index > 0 ? 'border-t border-gray-100' : ''
                      }`}
                    >
                      <span className="text-gray-600">{item.icon}</span>
                      <span className="min-w-0 flex-1 font-medium">
                        {t(item.labelKey)}
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-gray-400"
                      />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        ) : (
          <div className="flex min-h-0 flex-1">
            {isMobile ? null : (
              <nav
                className="w-48 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 py-3"
                aria-label={t('settings.navLabel')}
              >
                {groups.map(group => (
                  <div key={group.labelKey}>
                    <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 first:pt-0">
                      {t(group.labelKey)}
                    </p>
                    <div>{group.items.map(renderDesktopItem)}</div>
                  </div>
                ))}
              </nav>
            )}

            <div
              className={`min-w-0 flex-1 ${isMobile ? 'px-4 py-4' : 'px-6 py-5'} ${
                activeSection === 'operationLog' && !isMobile
                  ? 'flex flex-col overflow-hidden'
                  : 'overflow-y-auto'
              }`}
            >
              {sectionBody}
            </div>
          </div>
        )}

        {isMobile ? null : (
          <div className="flex justify-end border-t border-gray-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md pix-btn-primary px-4 py-2 text-sm"
            >
              {t('settings.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
