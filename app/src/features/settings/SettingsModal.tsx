import { useEscapeKey } from '@/ui';
import type { VersionInfo } from '@/ui';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { SettingsAccessPanel } from '@/features/access/SettingsAccessPanel';
import {
  FolderOpen,
  Globe,
  Info,
  Keyboard,
  RefreshCw,
  ScrollText,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { SettingsKeyboardPanel } from './SettingsKeyboardPanel';
import { SettingsLanguagePanel } from './SettingsLanguagePanel';
import { SettingsOperationLogPanel } from './SettingsOperationLogPanel';
import { SettingsSyncPanel } from './SettingsSyncPanel';
import { SettingsVersionPanel } from './SettingsVersionPanel';
import { SettingsWorkspacePanel } from './SettingsWorkspacePanel';
import type { SettingsSection } from './settingsTypes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
  versionInfo: VersionInfo;
}

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
  {
    id: 'keyboard',
    labelKey: 'settings.menuKeyboard',
    icon: <Keyboard size={18} />,
  },
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
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  t,
  versionInfo,
}) => {
  const settingsSection = useUIStore(state => state.settingsSection);
  const isMobile = useMobileViewport();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>(settingsSection);

  useEffect(() => {
    if (isOpen) {
      setActiveSection(settingsSection);
    }
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
    {
      labelKey: 'settings.groupAccess',
      items: [
        {
          id: 'access',
          labelKey: 'settings.menuAccess',
          icon: <Shield size={18} />,
        },
      ],
    },
  ];

  const renderItem = (item: (typeof GENERAL_ITEMS)[number]) => (
    <button
      key={item.id}
      type="button"
      onClick={() => setActiveSection(item.id)}
      className={
        isMobile
          ? `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm ${
              activeSection === item.id
                ? 'bg-white font-medium pix-text-brand shadow-sm'
                : 'text-gray-700'
            }`
          : `flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
              activeSection === item.id
                ? 'border-r-2 border-[color:var(--pix-violet)] bg-white font-medium pix-text-brand'
                : 'text-gray-700 hover:bg-gray-100'
            }`
      }
    >
      {item.icon}
      {t(item.labelKey)}
    </button>
  );

  return (
    <div
      className={`fixed inset-0 z-[60] flex bg-black/40 ${
        isMobile ? 'items-stretch p-0' : 'items-center justify-center p-4'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
    >
      <div
        className={`flex w-full flex-col overflow-hidden bg-white shadow-xl ${
          isMobile
            ? 'h-full max-h-full max-w-none rounded-none'
            : 'h-[min(90vh,720px)] max-h-[min(90vh,720px)] max-w-4xl rounded-xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-gray-700" />
            <h2
              id="settings-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t('settings.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label={t('settings.close')}
          >
            <X size={20} />
          </button>
        </div>

        <div className={`flex min-h-0 flex-1 ${isMobile ? 'flex-col' : ''}`}>
          <nav
            className={
              isMobile
                ? 'flex shrink-0 gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-2 py-2'
                : 'w-48 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 py-3'
            }
            aria-label={t('settings.navLabel')}
          >
            {groups.map(group => (
              <div
                key={group.labelKey}
                className={isMobile ? 'flex shrink-0 items-center gap-1' : ''}
              >
                {isMobile ? null : (
                  <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 first:pt-0">
                    {t(group.labelKey)}
                  </p>
                )}
                {isMobile ? (
                  group.items.map(renderItem)
                ) : (
                  <div>{group.items.map(renderItem)}</div>
                )}
              </div>
            ))}
          </nav>

          <div
            className={`min-w-0 flex-1 px-6 py-5 ${
              activeSection === 'operationLog'
                ? 'flex flex-col overflow-hidden'
                : 'overflow-y-auto'
            }`}
          >
            {activeSection === 'workspace' && <SettingsWorkspacePanel t={t} />}
            {activeSection === 'operationLog' && <SettingsOperationLogPanel />}
            {activeSection === 'language' && <SettingsLanguagePanel t={t} />}
            {activeSection === 'keyboard' && <SettingsKeyboardPanel t={t} />}
            {activeSection === 'version' && (
              <SettingsVersionPanel t={t} versionInfo={versionInfo} />
            )}
            {activeSection === 'sync' && <SettingsSyncPanel t={t} />}
            {activeSection === 'access' && <SettingsAccessPanel t={t} />}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md pix-btn-primary px-4 py-2 text-sm"
          >
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
