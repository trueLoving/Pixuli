import { useEscapeKey } from '@pixuli/ui';
import type { VersionInfo } from '@pixuli/ui';
import {
  BookOpen,
  FolderOpen,
  Globe,
  Info,
  Keyboard,
  RefreshCw,
  ScrollText,
  Settings,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { SettingsDocsPanel } from './SettingsDocsPanel';
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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  t,
  versionInfo,
}) => {
  const settingsSection = useUIStore(state => state.settingsSection);
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

  const menuItems: Array<{
    id: SettingsSection;
    labelKey: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'sync',
      labelKey: 'settings.menuSync',
      icon: <RefreshCw size={18} />,
    },
    ...(isWorkspaceAvailable()
      ? [
          {
            id: 'workspace' as const,
            labelKey: 'settings.menuWorkspace',
            icon: <FolderOpen size={18} />,
          },
        ]
      : []),
    {
      id: 'operationLog',
      labelKey: 'settings.menuOperationLog',
      icon: <ScrollText size={18} />,
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
      id: 'version',
      labelKey: 'settings.menuVersion',
      icon: <Info size={18} />,
    },
    {
      id: 'docs',
      labelKey: 'settings.menuDocs',
      icon: <BookOpen size={18} />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(90vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
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

        <div className="flex min-h-0 flex-1">
          <nav
            className="w-44 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 py-3"
            aria-label={t('settings.navLabel')}
          >
            {menuItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
                  activeSection === item.id
                    ? 'border-r-2 border-blue-600 bg-white font-medium text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {t(item.labelKey)}
              </button>
            ))}
          </nav>

          <div
            className={`min-w-0 flex-1 px-6 py-5 ${
              activeSection === 'operationLog'
                ? 'flex flex-col overflow-hidden'
                : 'overflow-y-auto'
            }`}
          >
            {activeSection === 'sync' && <SettingsSyncPanel t={t} />}
            {activeSection === 'workspace' && <SettingsWorkspacePanel t={t} />}
            {activeSection === 'operationLog' && <SettingsOperationLogPanel />}
            {activeSection === 'language' && <SettingsLanguagePanel t={t} />}
            {activeSection === 'keyboard' && <SettingsKeyboardPanel t={t} />}
            {activeSection === 'version' && (
              <SettingsVersionPanel t={t} versionInfo={versionInfo} />
            )}
            {activeSection === 'docs' && <SettingsDocsPanel t={t} />}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
