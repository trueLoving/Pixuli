import { showError, showSuccess } from '@/ui/feedback/toast';
import { copyTextToClipboard } from '@/utils/clipboard';
import { resolveRemoteCopyUrl } from '@/features/library/useImageCopyUrl';
import { isPublishChannel } from '@/features/source-type/connectionPurpose';
import { listStoragePluginManifests } from '@/storage/registry';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useUIStore } from '@/stores/uiStore';
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
import { CapabilityChips } from '@/features/source-type/CapabilityChips';
import { UPCOMING_CONNECTORS } from '@/features/source-type/upcomingConnectors';
import './AccessModal.css';

interface SettingsAccessPanelProps {
  t: (key: string) => string;
}

export const SettingsAccessPanel: React.FC<SettingsAccessPanelProps> = ({
  t,
}) => {
  const sources = useSourceStore(state => state.sources);
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const images = useImageStore(state => state.images);
  const accessTargetImageId = useUIStore(state => state.accessTargetImageId);
  const accessTargetImageIds = useUIStore(state => state.accessTargetImageIds);
  const openSettingsModalForAddSource = useUIStore(
    state => state.openSettingsModalForAddSource,
  );
  const closeSettingsModal = useUIStore(state => state.closeSettingsModal);
  const closePublishDrawer = useUIStore(state => state.closePublishDrawer);
  const openAccessModal = useUIStore(state => state.openAccessModal);
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
  const batchImages = useMemo(() => {
    const ids =
      accessTargetImageIds.length > 0
        ? accessTargetImageIds
        : accessTargetImageId
          ? [accessTargetImageId]
          : [];
    return ids
      .map(id => images.find(item => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [accessTargetImageId, accessTargetImageIds, images]);
  const publishSources = useMemo(() => {
    const allowed = sources.filter(isPublishChannel);
    return allowed.length > 0 ? allowed : sources;
  }, [sources]);
  const channel = publishSources.find(source => source.id === channelId);
  const hasConnection = publishSources.length > 0;
  const manifests = listStoragePluginManifests();
  const manifest = manifests.find(item => item.id === channel?.pluginId);
  const flags = getAccessCapabilities(manifest);
  const hint = resolveAccessHint({ hasConnection, flags });
  const published =
    image && channel ? isAssetPublished(image.id, channel.id) : false;
  const publishedRows = useMemo(
    () =>
      listPublishedAccess().map(row => {
        const asset = images.find(item => item.id === row.imageId);
        const source = sources.find(item => item.id === row.sourceId);
        return {
          ...row,
          name: asset?.name ?? row.imageId,
          location: source ? formatConnectionLocation(source) : row.sourceId,
        };
      }),
    [images, policyTick, sources],
  );

  useEffect(() => {
    const initialChannel = selectedSourceId ?? publishSources[0]?.id ?? '';
    setChannelId(initialChannel);
  }, [selectedSourceId, publishSources]);

  useEffect(() => {
    if (!image || !channelId) {
      setRemoteTier('none');
      return;
    }
    const record = getPublishedAccess(image.id);
    setRemoteTier(record?.sourceId === channelId ? 'public' : 'none');
  }, [image, channelId]);

  const title =
    batchImages.length > 1
      ? t('access.titleBatch').replace('{count}', String(batchImages.length))
      : image
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
    if (!image && batchImages.length === 0) {
      showError(t('access.needSelectAsset'));
      return;
    }
    if (!channel) {
      showError(t('access.hintNeedConnectionReason'));
      return;
    }
    const targets = batchImages.length > 0 ? batchImages : image ? [image] : [];
    const unpublished = targets.filter(item => !hasPublishableRemoteUrl(item));
    if (unpublished.length > 0) {
      const confirmed = window.confirm(t('access.confirmSyncThenPublish'));
      if (confirmed) {
        closeSettingsModal();
        closePublishDrawer();
        openSyncDirectionModal();
      }
      return;
    }
    for (const item of targets) {
      markAssetPublished(item.id, channel.id);
    }
    setPolicyTick(value => value + 1);
    await copyTextToClipboard(resolveRemoteCopyUrl(targets[0]));
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
    <div className="settings-access-panel">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>

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
          <span
            className="access-modal-option-mark access-modal-option-mark--local"
            aria-hidden
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
                {publishSources.map(source => (
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
              <span
                className={`access-modal-option-mark access-modal-option-mark--${tier}`}
                aria-hidden
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
                    openAccessModal(row.imageId);
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

      <section className="access-modal-section">
        <h3>{t('access.upcomingPublishTitle')}</h3>
        <p className="access-modal-locked">{t('access.upcomingPublishHint')}</p>
        <ul className="access-upcoming-list">
          {UPCOMING_CONNECTORS.map(item => (
            <li key={item.id} className="access-upcoming-item">
              <div className="access-upcoming-item-head">
                <span>{item.name}</span>
                <span className="access-upcoming-badge">
                  {t('settings.comingSoon')}
                </span>
              </div>
              <CapabilityChips capabilities={item.capabilities} t={t} muted />
            </li>
          ))}
        </ul>
      </section>

      <div className="settings-access-actions">
        {!hasConnection ? (
          <button
            type="button"
            className="access-modal-primary"
            onClick={() => openSettingsModalForAddSource()}
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
      </div>
    </div>
  );
};
