import { useEscapeKey } from '@/ui';
import { showError, showSuccess } from '@/ui/feedback/toast';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { copyTextToClipboard } from '@/utils/clipboard';
import { resolveRemoteCopyUrl } from '@/hooks/useImageCopyUrl';
import { listStoragePluginManifests } from '@/storage/registry';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import { Shield, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  formatConnectionLocation,
  getAccessCapabilities,
  hasPublishableRemoteUrl,
  isRemoteTierEnabled,
  resolveAccessHint,
  type RemoteAccessTier,
} from './accessCapabilities';
import {
  getPublishedAccess,
  isAssetPublished,
  listPublishedAccess,
  markAssetPublished,
  revokeAssetPublish,
} from './accessPolicyStore';
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
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const images = useImageStore(state => state.images);
  const accessTargetImageId = useUIStore(state => state.accessTargetImageId);
  const openConnectionsModal = useUIStore(state => state.openConnectionsModal);
  const openSyncDirectionModal = useUIStore(
    state => state.openSyncDirectionModal,
  );

  const [channelId, setChannelId] = useState<string>('');
  const [remoteTier, setRemoteTier] = useState<RemoteAccessTier>('none');
  const [policyTick, setPolicyTick] = useState(0);

  const image = useMemo(
    () => images.find(item => item.id === accessTargetImageId) ?? null,
    [images, accessTargetImageId],
  );
  const channel = sources.find(source => source.id === channelId);
  const hasConnection = sources.length > 0;
  const manifests = listStoragePluginManifests();
  const manifest = manifests.find(item => item.id === channel?.pluginId);
  const flags = getAccessCapabilities(manifest);
  const hint = resolveAccessHint({ hasConnection, flags });
  const published =
    image && channel ? isAssetPublished(image.id, channel.id) : false;
  const publishedRows = useMemo(() => {
    if (!isOpen) return [];
    return listPublishedAccess().map(row => {
      const asset = images.find(item => item.id === row.imageId);
      const source = sources.find(item => item.id === row.sourceId);
      return {
        ...row,
        name: asset?.name ?? row.imageId,
        location: source ? formatConnectionLocation(source) : row.sourceId,
      };
    });
  }, [images, isOpen, policyTick, sources]);

  useEffect(() => {
    if (!isOpen) return;
    const initialChannel = selectedSourceId ?? sources[0]?.id ?? '';
    setChannelId(initialChannel);
  }, [isOpen, selectedSourceId, sources]);

  useEffect(() => {
    if (!isOpen || !image || !channelId) {
      setRemoteTier('none');
      return;
    }
    const record = getPublishedAccess(image.id);
    setRemoteTier(record?.sourceId === channelId ? 'public' : 'none');
  }, [isOpen, image, channelId]);

  useEscapeKey(() => {
    if (isOpen) onClose();
  }, isOpen);

  if (!isOpen) return null;

  const title = image
    ? t('access.titleWithName').replace('{name}', image.name)
    : t('access.title');

  const selectTier = (tier: RemoteAccessTier) => {
    if (!isRemoteTierEnabled(tier, flags, hasConnection)) {
      return;
    }
    setRemoteTier(tier);
  };

  const handleGenerate = async () => {
    if (remoteTier !== 'public') {
      showError(t('access.cannotCopyUnpublished'));
      return;
    }
    if (!isRemoteTierEnabled('public', flags, hasConnection)) {
      showError(t('access.cannotCopyUnsupported'));
      return;
    }
    if (!image) {
      showError(t('access.needSelectAsset'));
      return;
    }
    if (!channel) {
      showError(t('access.hintNeedConnectionReason'));
      return;
    }
    if (!hasPublishableRemoteUrl(image)) {
      const confirmed = window.confirm(t('access.confirmSyncThenPublish'));
      if (confirmed) {
        onClose();
        openSyncDirectionModal();
      }
      return;
    }
    markAssetPublished(image.id, channel.id);
    setPolicyTick(value => value + 1);
    await copyTextToClipboard(resolveRemoteCopyUrl(image));
    showSuccess(t('access.copiedPublicUrl'));
  };

  const handleRevoke = () => {
    if (!image) {
      showError(t('access.needSelectAsset'));
      return;
    }
    revokeAssetPublish(image.id);
    setRemoteTier('none');
    setPolicyTick(value => value + 1);
    showSuccess(t('access.revoked'));
  };

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
            <h2 id="access-modal-title">{title}</h2>
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
              <input
                type="radio"
                name="access-local-private"
                checked={remoteTier === 'none'}
                onChange={() => setRemoteTier('none')}
              />
              <span>{t('access.localPrivate')}</span>
            </label>
          </section>

          <section className="access-modal-section">
            <div className="access-modal-remote-head">
              <h3>{t('access.remoteTitle')}</h3>
              {hasConnection ? (
                <label className="access-modal-channel">
                  <span>{t('access.channel')}</span>
                  <select
                    value={channelId}
                    onChange={event => setChannelId(event.target.value)}
                  >
                    {sources.map(source => (
                      <option key={source.id} value={source.id}>
                        {source.pluginId} · {formatConnectionLocation(source)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {(
              [
                ['none', t('access.remoteNone')],
                ['share', t('access.remoteShare')],
                ['public', t('access.remotePublic')],
                ['timed', t('access.remoteTimed')],
              ] as const
            ).map(([tier, label]) => {
              const enabled = isRemoteTierEnabled(tier, flags, hasConnection);
              return (
                <label
                  key={tier}
                  className={`access-modal-option ${enabled ? '' : 'access-modal-option--disabled'}`}
                >
                  <input
                    type="radio"
                    name="access-remote-tier"
                    checked={remoteTier === tier}
                    disabled={!enabled}
                    onChange={() => selectTier(tier)}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </section>

          {publishedRows.length > 0 ? (
            <section className="access-modal-section">
              <h3>{t('access.overviewTitle')}</h3>
              <ul className="access-modal-overview">
                {publishedRows.map(row => (
                  <li key={`${row.imageId}-${row.sourceId}`}>
                    <button
                      type="button"
                      className="access-modal-overview-item"
                      onClick={() => {
                        useUIStore.getState().openAccessModal(row.imageId);
                        setChannelId(row.sourceId);
                      }}
                    >
                      <span>{row.name}</span>
                      <span>{row.location}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <aside className="access-modal-hint" role="note">
            <strong>{t(hint.titleKey)}</strong>
            <p>{t(hint.reasonKey)}</p>
            <p>{t(hint.alternativeKey)}</p>
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
          ) : (
            <>
              <button
                type="button"
                className="access-modal-primary"
                onClick={() => {
                  void handleGenerate();
                }}
              >
                {t('access.generateCopy')}
              </button>
              {published ? (
                <button
                  type="button"
                  className="access-modal-secondary"
                  onClick={handleRevoke}
                >
                  {t('access.revoke')}
                </button>
              ) : null}
            </>
          )}
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
