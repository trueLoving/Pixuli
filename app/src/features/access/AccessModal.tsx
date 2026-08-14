import { useEscapeKey } from '@/ui';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { useSourceStore } from '@/stores/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import { Shield, X } from 'lucide-react';
import React from 'react';
import './AccessModal.css';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export const AccessModal: React.FC<AccessModalProps> = ({
  isOpen,
  onClose,
  t,
}) => {
  const isMobile = useMobileViewport();
  const sources = useSourceStore(state => state.sources);
  const openConnectionsModal = useUIStore(state => state.openConnectionsModal);
  const hasConnection = sources.length > 0;

  useEscapeKey(() => {
    if (isOpen) onClose();
  }, isOpen);

  if (!isOpen) return null;

  return (
    <div
      className={`access-modal-overlay ${isMobile ? 'access-modal-overlay--full' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-modal-title"
      onClick={onClose}
    >
      <div
        className={`access-modal ${isMobile ? 'access-modal--full' : ''}`}
        onClick={event => event.stopPropagation()}
      >
        <header className="access-modal-header">
          <div className="access-modal-heading">
            <Shield size={20} aria-hidden />
            <h2 id="access-modal-title">{t('access.title')}</h2>
          </div>
          <button
            type="button"
            className="access-modal-close"
            onClick={onClose}
            aria-label={t('access.close')}
          >
            <X size={20} />
          </button>
        </header>

        <div className="access-modal-body">
          <section className="access-modal-section">
            <h3>{t('access.localTitle')}</h3>
            <p className="access-modal-locked">{t('access.localAlways')}</p>
            <label className="access-modal-option">
              <input type="radio" checked readOnly />
              <span>{t('access.localPrivate')}</span>
            </label>
          </section>

          <section className="access-modal-section">
            <h3>{t('access.remoteTitle')}</h3>
            <label className="access-modal-option">
              <input type="radio" checked readOnly />
              <span>{t('access.remoteNone')}</span>
            </label>
            <label className="access-modal-option access-modal-option--disabled">
              <input type="radio" disabled />
              <span>{t('access.remoteShare')}</span>
            </label>
            <label
              className={`access-modal-option ${hasConnection ? '' : 'access-modal-option--disabled'}`}
            >
              <input type="radio" disabled />
              <span>{t('access.remotePublic')}</span>
            </label>
          </section>

          <aside className="access-modal-hint" role="note">
            {hasConnection
              ? t('access.hintShareUnsupported')
              : t('access.hintNeedConnection')}
          </aside>
        </div>

        <footer className="access-modal-footer">
          {!hasConnection ? (
            <button
              type="button"
              className="access-modal-primary"
              onClick={() => {
                onClose();
                openConnectionsModal({ addSource: true });
              }}
            >
              {t('access.addConnection')}
            </button>
          ) : null}
          <button
            type="button"
            className="access-modal-secondary"
            onClick={onClose}
          >
            {t('access.close')}
          </button>
        </footer>
      </div>
    </div>
  );
};
