import { useEscapeKey } from '@/ui';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { SettingsSyncPanel } from '@/features/settings/SettingsSyncPanel';
import { Plug, X } from 'lucide-react';
import React from 'react';
import './ConnectionsModal.css';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export const ConnectionsModal: React.FC<ConnectionsModalProps> = ({
  isOpen,
  onClose,
  t,
}) => {
  const isMobile = useMobileViewport();

  useEscapeKey(() => {
    if (isOpen) onClose();
  }, isOpen);

  if (!isOpen) return null;

  return (
    <div
      className={`connections-modal-overlay ${isMobile ? 'connections-modal-overlay--full' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connections-modal-title"
      onClick={onClose}
    >
      <div
        className={`connections-modal ${isMobile ? 'connections-modal--full' : ''}`}
        onClick={event => event.stopPropagation()}
      >
        <header className="connections-modal-header">
          <div className="connections-modal-heading">
            <Plug size={20} aria-hidden />
            <h2 id="connections-modal-title">{t('connections.title')}</h2>
          </div>
          <button
            type="button"
            className="connections-modal-close"
            onClick={onClose}
            aria-label={t('connections.close')}
          >
            <X size={20} />
          </button>
        </header>

        <div className="connections-modal-body">
          <SettingsSyncPanel t={t} />
        </div>

        <footer className="connections-modal-footer">
          <button
            type="button"
            className="connections-modal-done"
            onClick={onClose}
          >
            {t('connections.close')}
          </button>
        </footer>
      </div>
    </div>
  );
};
