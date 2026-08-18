import { useEscapeKey } from '@/ui';
import {
  showError,
  showInfo,
  showLoading,
  showSuccess,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '@/ui/feedback/toast';
import {
  ImageActionMenu,
  type ImageActionHandlers,
  type ImageActionId,
} from '@/ui/image/image-actions/web';
import ImageEditModal from '@/ui/image/image-browser/web/ImageEditModal';
import { ImagePreviewModal } from '@/ui/image/image-preview-modal/web';
import { hasPublishableRemoteUrl } from '@/features/access/accessCapabilities';
import { getPublishedAccess } from '@/features/access/accessPolicyStore';
import { resolveRemoteCopyUrl } from '@/hooks/useImageCopyUrl';
import { ROUTES } from '@/router/routes';
import { useSourceStore } from '@/stores/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import type { ImageEditData, ImageItem } from '@pixuli/core/types';
import { formatFileSize } from '@pixuli/core/utils';
import { getAssetKind } from '@/utils/assetKind';
import { Shield, SlidersHorizontal, Wand2, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AssetInspector.css';

const INSPECTOR_ACTIONS: ImageActionId[] = [
  'preview',
  'edit',
  'copyUrl',
  'openUrl',
  'share',
  'delete',
];

interface AssetInspectorProps {
  image: ImageItem | null;
  selectedImages?: ImageItem[];
  images: ImageItem[];
  onClose: () => void;
  onDeleteImage?: (id: string, name: string) => Promise<void>;
  onDeleteMultipleImages?: (ids: string[], names: string[]) => Promise<void>;
  onUpdateImage?: (data: ImageEditData) => Promise<void>;
  onCopyUrl?: (url: string, type: 'url' | 'githubUrl') => Promise<void>;
  onCopyRemoteAccess?: (image: ImageItem) => boolean;
  onShareImage?: (image: ImageItem) => Promise<void>;
  onSync?: () => void;
  getImageDimensionsFromUrl?: (
    url: string,
  ) => Promise<{ width: number; height: number }>;
  t: (key: string) => string;
  variant?: 'dock' | 'sheet';
}

function FileContent({
  image,
  onPreview,
  t,
}: {
  image: ImageItem;
  onPreview: () => void;
  t: (key: string) => string;
}) {
  const kind = getAssetKind(image);

  if (kind === 'video') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--media">
        <video src={image.url} controls playsInline preload="metadata">
          {t('image.inspector.openExternal')}
        </video>
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--media">
        <iframe title={image.name} src={image.url} />
        <a
          className="asset-inspector-open-external"
          href={image.url}
          target="_blank"
          rel="noreferrer"
        >
          {t('image.inspector.openExternal')}
        </a>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="asset-inspector-preview"
      onClick={onPreview}
      aria-label={t('image.inspector.previewHint')}
    >
      <img src={image.url} alt={image.name} />
    </button>
  );
}

function folderLabel(path?: string): string {
  if (!path) return '—';
  const parts = path.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 1) return '/';
  return parts.slice(0, -1).join('/');
}

export const AssetInspector: React.FC<AssetInspectorProps> = ({
  image,
  selectedImages = [],
  images,
  onClose,
  onDeleteImage,
  onDeleteMultipleImages,
  onUpdateImage,
  onCopyUrl,
  onCopyRemoteAccess,
  onShareImage,
  onSync,
  getImageDimensionsFromUrl,
  t,
  variant = 'dock',
}) => {
  const navigate = useNavigate();
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const sources = useSourceStore(state => state.sources);
  const openAccessModal = useUIStore(state => state.openAccessModal);
  const setCurrentUtilityTool = useUIStore(
    state => state.setCurrentUtilityTool,
  );
  const setCurrentView = useUIStore(state => state.setCurrentView);
  const setActiveMenu = useUIStore(state => state.setActiveMenu);

  const [showEdit, setShowEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(image);

  useEffect(() => {
    setPreviewImage(image);
  }, [image]);

  const isSheet = variant === 'sheet';

  useEscapeKey(
    () => {
      if (showPreview) {
        setShowPreview(false);
        return;
      }
      if (showEdit) {
        setShowEdit(false);
        return;
      }
      if (isSheet) onClose();
    },
    Boolean(
      (image || selectedImages.length > 0) &&
        (isSheet || showPreview || showEdit),
    ),
  );

  const sourceId = selectedSourceId ?? sources[0]?.id;
  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const published = Boolean(
    image && sourceId && getPublishedAccess(image.id)?.sourceId === sourceId,
  );
  const previewIndex = previewImage
    ? images.findIndex(item => item.id === previewImage.id)
    : -1;

  const kind = image ? getAssetKind(image) : 'image';
  const dimensions =
    image && image.width > 0 && image.height > 0
      ? `${image.width} × ${image.height}`
      : t('image.grid.dimensionsUnknown');

  const handleCopy = useCallback(async () => {
    if (!image) return;
    if (onCopyRemoteAccess && onCopyRemoteAccess(image) === false) {
      return;
    }
    try {
      const url = resolveRemoteCopyUrl(image);
      if (onCopyUrl) {
        await onCopyUrl(url, 'url');
      }
      showSuccess(
        `${t('image.grid.imageUrlCopied')}${t('image.grid.copiedToClipboard')}`,
      );
    } catch {
      showError(t('image.grid.copyFailed'));
    }
  }, [image, onCopyRemoteAccess, onCopyUrl, t]);

  const handleDelete = useCallback(async () => {
    if (!image || !onDeleteImage) return;
    if (
      !confirm(
        `${t('image.grid.confirmDelete')} "${image.name}" ${t('common.confirm')}？`,
      )
    ) {
      return;
    }
    const loadingToast = showLoading(
      `${t('image.grid.deleting')} "${image.name}"...`,
    );
    try {
      await onDeleteImage(image.id, image.name);
      updateLoadingToSuccess(
        String(loadingToast),
        `${t('image.grid.deleteSuccess')} "${image.name}" ${t('image.grid.deleted')}`,
      );
      onClose();
    } catch (error) {
      updateLoadingToError(
        String(loadingToast),
        `${t('image.grid.deleteFailed')} "${image.name}" ${t('image.grid.failed')}: ${error instanceof Error ? error.message : t('common.unknownError')}`,
      );
    }
  }, [image, onClose, onDeleteImage, t]);

  const handleShare = useCallback(async () => {
    if (!image || !onShareImage) return;
    try {
      await onShareImage(image);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      if (/cancel|abort|dismiss|user/i.test(message)) return;
      showError(`${t('image.grid.shareFailed')}: ${message}`);
    }
  }, [image, onShareImage, t]);

  const openTool = useCallback(
    (tool: 'compress' | 'convert') => {
      setCurrentUtilityTool(tool);
      setCurrentView('photos');
      setActiveMenu(tool);
      navigate(tool === 'compress' ? ROUTES.COMPRESS : ROUTES.CONVERT);
    },
    [navigate, setActiveMenu, setCurrentUtilityTool, setCurrentView],
  );

  const handlers = useMemo<ImageActionHandlers>(() => {
    if (!image) return {};
    const url = resolveRemoteCopyUrl(image);
    const next: ImageActionHandlers = {
      preview: kind === 'image' ? () => setShowPreview(true) : undefined,
      edit: onUpdateImage
        ? () => {
            setShowEdit(true);
            showInfo(`${t('image.grid.editing')} "${image.name}"`);
          }
        : undefined,
      copyUrl: () => {
        void handleCopy();
      },
      openUrl: () => {
        window.open(url, '_blank');
      },
      delete: onDeleteImage
        ? () => {
            void handleDelete();
          }
        : undefined,
    };
    if (onShareImage) {
      next.share = () => {
        void handleShare();
      };
    }
    return next;
  }, [
    handleCopy,
    handleDelete,
    handleShare,
    image,
    kind,
    onDeleteImage,
    onShareImage,
    onUpdateImage,
    t,
  ]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedImages.length === 0) return;
    if (
      !confirm(
        t('image.library.confirmDeleteN').replace(
          '{count}',
          String(selectedImages.length),
        ),
      )
    ) {
      return;
    }
    if (selectedImages.length === 1 && onDeleteImage) {
      await onDeleteImage(selectedImages[0].id, selectedImages[0].name);
    } else if (onDeleteMultipleImages) {
      await onDeleteMultipleImages(
        selectedImages.map(item => item.id),
        selectedImages.map(item => item.name),
      );
    }
    onClose();
  }, [onClose, onDeleteImage, onDeleteMultipleImages, selectedImages, t]);

  const allSelectedImages = selectedImages.every(
    item => getAssetKind(item) === 'image',
  );

  const batchBody =
    selectedImages.length >= 2 ? (
      <>
        <p className="asset-inspector-batch-lead">
          {t('image.library.selectedCount').replace(
            '{count}',
            String(selectedImages.length),
          )}
        </p>
        <p className="asset-inspector-batch-scope">
          {t('image.library.batchScope')}
          {': '}
          {!selectedFolderPath || selectedFolderPath === '__root__'
            ? t('workspace.allImages')
            : selectedFolderPath}
        </p>
        <ul className="asset-inspector-batch-list">
          {selectedImages.slice(0, 8).map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
          {selectedImages.length > 8 ? <li>…</li> : null}
        </ul>
        <section className="asset-inspector-section">
          <h3>{t('image.inspector.sectionActions')}</h3>
          <div className="asset-inspector-extra">
            <button
              type="button"
              className="asset-inspector-extra-btn"
              onClick={onSync}
              disabled={!onSync}
            >
              {t('image.toolbar.sync')}
            </button>
            <button
              type="button"
              className="asset-inspector-extra-btn"
              disabled
              title={t('image.library.batchAccessDisabled')}
            >
              {t('image.inspector.openAccess')}
            </button>
            <button
              type="button"
              className="asset-inspector-extra-btn"
              disabled={!allSelectedImages}
              title={
                allSelectedImages
                  ? undefined
                  : t('image.inspector.toolImageOnly')
              }
              onClick={() => openTool('compress')}
            >
              {t('image.inspector.sendCompress')}
            </button>
            <button
              type="button"
              className="asset-inspector-extra-btn"
              disabled={!allSelectedImages}
              title={
                allSelectedImages
                  ? undefined
                  : t('image.inspector.toolImageOnly')
              }
              onClick={() => openTool('convert')}
            >
              {t('image.inspector.sendConvert')}
            </button>
            <button
              type="button"
              className="asset-inspector-extra-btn"
              onClick={() => {
                void handleBatchDelete();
              }}
            >
              {t('image.library.deleteSelected')}
            </button>
          </div>
        </section>
      </>
    ) : null;

  const body =
    batchBody ??
    (image ? (
      <>
        <section className="asset-inspector-section">
          <h3>{t('image.inspector.sectionContent')}</h3>
          <FileContent
            image={image}
            onPreview={() => setShowPreview(true)}
            t={t}
          />
        </section>

        <section className="asset-inspector-section">
          <h3>{t('image.inspector.sectionInfo')}</h3>
          <dl className="asset-inspector-dl">
            <div>
              <dt>{t('image.inspector.name')}</dt>
              <dd title={image.name}>{image.name}</dd>
            </div>
            {kind === 'image' ? (
              <div>
                <dt>{t('image.inspector.dimensions')}</dt>
                <dd>{dimensions}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t('image.inspector.size')}</dt>
              <dd>{image.size > 0 ? formatFileSize(image.size) : '—'}</dd>
            </div>
            <div>
              <dt>{t('image.inspector.date')}</dt>
              <dd>
                {image.createdAt
                  ? new Date(image.createdAt).toLocaleString()
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>{t('image.inspector.folder')}</dt>
              <dd>{folderLabel(image.localPath)}</dd>
            </div>
            <div>
              <dt>{t('image.inspector.sync')}</dt>
              <dd>
                {image.linkKind === 'remote-raw' ||
                hasPublishableRemoteUrl(image)
                  ? t('image.inspector.syncRemote')
                  : t('image.inspector.syncLocal')}
              </dd>
            </div>
            <div>
              <dt>{t('image.inspector.access')}</dt>
              <dd>
                {published
                  ? t('image.inspector.accessPublic')
                  : t('image.inspector.accessLocalOnly')}
              </dd>
            </div>
            {image.tags.length > 0 ? (
              <div>
                <dt>{t('image.inspector.tags')}</dt>
                <dd>{image.tags.join('、')}</dd>
              </div>
            ) : null}
            {image.description ? (
              <div>
                <dt>{t('image.inspector.description')}</dt>
                <dd>{image.description}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="asset-inspector-section">
          <h3>{t('image.inspector.sectionActions')}</h3>
          <ImageActionMenu
            variant="labeled-bar"
            actions={INSPECTOR_ACTIONS}
            handlers={handlers}
            t={t}
            className="asset-inspector-actions"
          />
          <div className="asset-inspector-extra">
            <button
              type="button"
              className="asset-inspector-extra-btn"
              onClick={() => openAccessModal(image.id)}
            >
              <Shield size={16} aria-hidden />
              {t('image.inspector.openAccess')}
            </button>
            <button
              type="button"
              className="asset-inspector-extra-btn"
              disabled={kind !== 'image'}
              title={
                kind === 'image'
                  ? undefined
                  : t('image.inspector.toolImageOnly')
              }
              onClick={() => openTool('compress')}
            >
              <SlidersHorizontal size={16} aria-hidden />
              {t('image.inspector.sendCompress')}
            </button>
            <button
              type="button"
              className="asset-inspector-extra-btn"
              disabled={kind !== 'image'}
              title={
                kind === 'image'
                  ? undefined
                  : t('image.inspector.toolImageOnly')
              }
              onClick={() => openTool('convert')}
            >
              <Wand2 size={16} aria-hidden />
              {t('image.inspector.sendConvert')}
            </button>
          </div>
        </section>
      </>
    ) : (
      <p className="asset-inspector-empty">{t('image.inspector.empty')}</p>
    ));

  const panel = (
    <aside
      className={`asset-inspector ${isSheet ? 'asset-inspector--sheet' : 'asset-inspector--dock'}`}
      aria-label={t('image.inspector.title')}
    >
      <header className="asset-inspector-header">
        <h2>
          {selectedImages.length >= 2
            ? t('image.library.selectedCount').replace(
                '{count}',
                String(selectedImages.length),
              )
            : t('image.inspector.title')}
        </h2>
        {isSheet || image || selectedImages.length > 0 ? (
          <button
            type="button"
            className="asset-inspector-close"
            onClick={onClose}
            aria-label={t('image.inspector.close')}
          >
            <X size={18} />
          </button>
        ) : (
          <span />
        )}
      </header>
      <div className="asset-inspector-body">{body}</div>
    </aside>
  );

  return (
    <>
      {isSheet && (image || selectedImages.length > 0) ? (
        <div className="asset-inspector-overlay">
          <button
            type="button"
            className="asset-inspector-backdrop"
            aria-label={t('image.inspector.close')}
            onClick={onClose}
          />
          {panel}
        </div>
      ) : isSheet ? null : (
        panel
      )}

      {image && onUpdateImage ? (
        <ImageEditModal
          image={image}
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          onUpdateImage={onUpdateImage}
          onSuccess={() => setShowEdit(false)}
          onCancel={() => setShowEdit(false)}
          getImageDimensionsFromUrl={getImageDimensionsFromUrl}
          t={t}
        />
      ) : null}

      {previewImage ? (
        <ImagePreviewModal
          image={previewImage}
          images={images}
          currentIndex={previewIndex < 0 ? 0 : previewIndex}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onNavigate={index => {
            const next = images[index];
            if (next) setPreviewImage(next);
          }}
          formatFileSize={formatFileSize}
          onCopyUrl={async (url, type) => {
            if (
              previewImage &&
              onCopyRemoteAccess &&
              onCopyRemoteAccess(previewImage) === false
            ) {
              return;
            }
            if (onCopyUrl) await onCopyUrl(url, type);
          }}
          onShareImage={onShareImage}
          onOpenUrl={url => window.open(url, '_blank')}
          onEdit={
            onUpdateImage
              ? () => {
                  setShowPreview(false);
                  setShowEdit(true);
                }
              : undefined
          }
          onDelete={
            onDeleteImage
              ? () => {
                  setShowPreview(false);
                  void handleDelete();
                }
              : undefined
          }
          t={t}
        />
      ) : null}
    </>
  );
};
