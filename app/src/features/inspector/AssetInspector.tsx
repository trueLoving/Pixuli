import { useEscapeKey } from '@/ui';
import {
  showError,
  showInfo,
  showLoading,
  showSuccess,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '@/ui/feedback/toast';
import ImageEditModal from '@/ui/image/image-browser/web/ImageEditModal';
import { ImagePreviewModal } from '@/ui/image/image-preview-modal/web';
import { hasPublishableRemoteUrl } from '@/features/access/accessCapabilities';
import { getPublishedAccess } from '@/features/access/accessPolicyStore';
import { resolveRemoteCopyUrl } from '@/hooks/useImageCopyUrl';
import { useSourceStore } from '@/stores/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import type { ImageEditData, ImageItem } from '@pixuli/core/types';
import { formatFileSize } from '@pixuli/core/utils';
import { getAssetKind } from '@/utils/assetKind';
import {
  Edit,
  Link,
  type LucideIcon,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  INSPECTOR_WIDTH_MAX,
  INSPECTOR_WIDTH_MIN,
  usePanelResize,
} from '@/hooks/usePanelResize';
import './AssetInspector.css';

interface CompactAction {
  id: string;
  label: string;
  title?: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

function InspectorActionGrid({
  actions,
  danger,
}: {
  actions: CompactAction[];
  danger?: CompactAction | null;
}) {
  const DangerIcon = danger?.icon;
  return (
    <div className="asset-inspector-actions-block">
      <div className="asset-inspector-action-grid" role="group">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              className="asset-inspector-action-btn"
              title={action.title ?? action.label}
              aria-label={action.title ?? action.label}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              <Icon size={18} aria-hidden />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
      {danger && DangerIcon ? (
        <button
          type="button"
          className="asset-inspector-action-danger"
          title={danger.title ?? danger.label}
          aria-label={danger.title ?? danger.label}
          disabled={danger.disabled}
          onClick={danger.onClick}
        >
          <DangerIcon size={16} aria-hidden />
          <span>{danger.label}</span>
        </button>
      ) : null}
    </div>
  );
}

interface AssetInspectorProps {
  image: ImageItem | null;
  selectedImages?: ImageItem[];
  images: ImageItem[];
  onClose: () => void;
  onDeleteImage?: (id: string, name: string) => Promise<void>;
  onDeleteMultipleImages?: (ids: string[], names: string[]) => Promise<void>;
  onUpdateImage?: (data: ImageEditData) => Promise<void>;
  onCopyUrl?: (url: string, type: 'url' | 'githubUrl') => Promise<void>;
  onShareImage?: (image: ImageItem) => Promise<void>;
  onSync?: () => void;
  onSendCompress?: () => void;
  onSendConvert?: () => void;
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

  if (kind === 'other') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--file">
        <a
          className="asset-inspector-open-external"
          href={image.url}
          download={image.name}
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
  onShareImage,
  onSync,
  onSendCompress,
  onSendConvert,
  getImageDimensionsFromUrl,
  t,
  variant = 'dock',
}) => {
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const sources = useSourceStore(state => state.sources);

  const [showEdit, setShowEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(image);

  useEffect(() => {
    setPreviewImage(
      image ?? (selectedImages.length === 1 ? selectedImages[0] : null),
    );
  }, [image, selectedImages]);

  const isSheet = variant === 'sheet';
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetDragRef = useRef<{ y: number; moved: boolean } | null>(null);
  const inspectorWidth = useUIStore(state => state.inspectorWidth);
  const setInspectorWidth = useUIStore(state => state.setInspectorWidth);

  const resizeHandlers = usePanelResize({
    width: inspectorWidth,
    min: INSPECTOR_WIDTH_MIN,
    max: INSPECTOR_WIDTH_MAX,
    edge: 'left',
    onWidthChange: setInspectorWidth,
  });

  useEffect(() => {
    if (!isSheet) setSheetExpanded(false);
  }, [isSheet]);

  const onSheetHandlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    sheetDragRef.current = { y: event.clientY, moved: false };
  };
  const onSheetHandlePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const start = sheetDragRef.current;
    if (!start) return;
    if (Math.abs(event.clientY - start.y) > 8) start.moved = true;
  };
  const onSheetHandlePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const start = sheetDragRef.current;
    sheetDragRef.current = null;
    if (!start) return;
    const delta = event.clientY - start.y;
    if (delta < -48) {
      setSheetExpanded(true);
      return;
    }
    if (delta > 48) {
      if (sheetExpanded) setSheetExpanded(false);
      else onClose();
      return;
    }
    if (!start.moved) setSheetExpanded(value => !value);
  };

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
  /** 单选时以 props.image 为准，缺省则回退 selectedImages[0] */
  const activeImage =
    image ?? (selectedImages.length === 1 ? selectedImages[0] : null);
  const published = Boolean(
    activeImage &&
      sourceId &&
      getPublishedAccess(activeImage.id)?.sourceId === sourceId,
  );
  const previewIndex = previewImage
    ? images.findIndex(item => item.id === previewImage.id)
    : -1;

  const kind = activeImage ? getAssetKind(activeImage) : 'image';
  const dimensions =
    activeImage && activeImage.width > 0 && activeImage.height > 0
      ? `${activeImage.width} × ${activeImage.height}`
      : t('image.grid.dimensionsUnknown');

  const handleCopy = useCallback(async () => {
    if (!activeImage) return;
    try {
      const url = resolveRemoteCopyUrl(activeImage);
      if (onCopyUrl) {
        await onCopyUrl(url, 'url');
      }
      showSuccess(
        `${t('image.grid.imageUrlCopied')}${t('image.grid.copiedToClipboard')}`,
      );
    } catch {
      showError(t('image.grid.copyFailed'));
    }
  }, [activeImage, onCopyUrl, t]);

  const handleDelete = useCallback(async () => {
    if (!activeImage || !onDeleteImage) return;
    if (
      !confirm(
        `${t('image.grid.confirmDelete')} "${activeImage.name}"？${t('image.grid.confirmDeleteLocalHint')}`,
      )
    ) {
      return;
    }
    const loadingToast = showLoading(
      `${t('image.grid.deleting')} "${activeImage.name}"...`,
    );
    try {
      await onDeleteImage(activeImage.id, activeImage.name);
      updateLoadingToSuccess(
        String(loadingToast),
        `${t('image.grid.deleteSuccess')} "${activeImage.name}" ${t('image.grid.deleted')}`,
      );
      onClose();
    } catch (error) {
      updateLoadingToError(
        String(loadingToast),
        `${t('image.grid.deleteFailed')} "${activeImage.name}" ${t('image.grid.failed')}: ${error instanceof Error ? error.message : t('common.unknownError')}`,
      );
    }
  }, [activeImage, onClose, onDeleteImage, t]);

  const handleShare = useCallback(async () => {
    if (!activeImage || !onShareImage) return;
    try {
      await onShareImage(activeImage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      if (/cancel|abort|dismiss|user/i.test(message)) return;
      showError(`${t('image.grid.shareFailed')}: ${message}`);
    }
  }, [activeImage, onShareImage, t]);

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

  const singleActions = useMemo((): {
    grid: CompactAction[];
    danger: CompactAction | null;
  } => {
    if (!activeImage) return { grid: [], danger: null };
    const grid: CompactAction[] = [];

    if (onUpdateImage) {
      grid.push({
        id: 'edit',
        label: t('image.inspector.actionEdit'),
        title: t('image.actions.edit'),
        icon: Edit,
        onClick: () => {
          setShowEdit(true);
          showInfo(`${t('image.grid.editing')} "${activeImage.name}"`);
        },
      });
    }
    grid.push({
      id: 'copy',
      label: t('image.inspector.actionCopy'),
      title: t('image.actions.copyUrl'),
      icon: Link,
      onClick: () => {
        void handleCopy();
      },
    });
    if (onShareImage) {
      grid.push({
        id: 'share',
        label: t('image.inspector.actionShare'),
        title: t('image.actions.share'),
        icon: Share2,
        onClick: () => {
          void handleShare();
        },
      });
    }
    grid.push({
      id: 'compress',
      label: t('image.inspector.actionCompress'),
      title:
        kind === 'image'
          ? t('image.inspector.sendCompress')
          : t('image.inspector.toolImageOnly'),
      icon: SlidersHorizontal,
      disabled: kind !== 'image' || !onSendCompress,
      onClick: () => {
        if (kind !== 'image') return;
        onSendCompress?.();
      },
    });
    grid.push({
      id: 'convert',
      label: t('image.inspector.actionConvert'),
      title:
        kind === 'image'
          ? t('image.inspector.sendConvert')
          : t('image.inspector.toolImageOnly'),
      icon: Wand2,
      disabled: kind !== 'image' || !onSendConvert,
      onClick: () => {
        if (kind !== 'image') return;
        onSendConvert?.();
      },
    });
    grid.push({
      id: 'ai',
      label: t('image.inspector.actionAi'),
      title:
        kind !== 'image'
          ? t('image.inspector.toolImageOnly')
          : t('image.inspector.aiNotConnected'),
      icon: Sparkles,
      disabled: true,
      onClick: () => undefined,
    });

    const danger: CompactAction | null = onDeleteImage
      ? {
          id: 'delete',
          label: t('image.inspector.actionDelete'),
          title: t('image.actions.delete'),
          icon: Trash2,
          onClick: () => {
            void handleDelete();
          },
        }
      : null;

    return { grid, danger };
  }, [
    activeImage,
    handleCopy,
    handleDelete,
    handleShare,
    kind,
    onDeleteImage,
    onSendCompress,
    onSendConvert,
    onShareImage,
    onUpdateImage,
    t,
  ]);

  const batchActions = useMemo((): {
    grid: CompactAction[];
    danger: CompactAction | null;
  } => {
    if (selectedImages.length < 2) return { grid: [], danger: null };
    const imageCount = selectedImages.filter(
      item => getAssetKind(item) === 'image',
    ).length;
    const compressTitle =
      imageCount === 0
        ? t('image.inspector.toolImageOnly')
        : imageCount < selectedImages.length
          ? `${t('image.inspector.sendCompress')} (${imageCount}/${selectedImages.length})`
          : t('image.inspector.sendCompress');
    const grid: CompactAction[] = [
      {
        id: 'sync',
        label: t('image.inspector.actionSync'),
        title: t('image.toolbar.sync'),
        icon: RefreshCw,
        disabled: !onSync,
        onClick: () => onSync?.(),
      },
      {
        id: 'compress',
        label: t('image.inspector.actionCompress'),
        title: compressTitle,
        icon: SlidersHorizontal,
        disabled: imageCount === 0 || !onSendCompress,
        onClick: () => onSendCompress?.(),
      },
      {
        id: 'convert',
        label: t('image.inspector.actionConvert'),
        title:
          imageCount === 0
            ? t('image.inspector.toolImageOnly')
            : t('image.inspector.sendConvert'),
        icon: Wand2,
        disabled: imageCount === 0 || !onSendConvert,
        onClick: () => onSendConvert?.(),
      },
    ];
    return {
      grid,
      danger: {
        id: 'delete',
        label: t('image.inspector.actionDelete'),
        title: t('image.library.deleteSelected'),
        icon: Trash2,
        onClick: () => {
          void handleBatchDelete();
        },
      },
    };
  }, [
    handleBatchDelete,
    onSendCompress,
    onSendConvert,
    onSync,
    selectedImages,
    t,
  ]);

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
      </>
    ) : null;

  const singleBody = activeImage ? (
    <>
      <section className="asset-inspector-section">
        <h3>{t('image.inspector.sectionContent')}</h3>
        <FileContent
          image={activeImage}
          onPreview={() => setShowPreview(true)}
          t={t}
        />
      </section>

      <section className="asset-inspector-section">
        <h3>{t('image.inspector.sectionInfo')}</h3>
        <dl className="asset-inspector-dl">
          <div>
            <dt>{t('image.inspector.name')}</dt>
            <dd title={activeImage.name}>{activeImage.name}</dd>
          </div>
          {kind === 'image' ? (
            <div>
              <dt>{t('image.inspector.dimensions')}</dt>
              <dd>{dimensions}</dd>
            </div>
          ) : null}
          <div>
            <dt>{t('image.inspector.size')}</dt>
            <dd>
              {activeImage.size > 0 ? formatFileSize(activeImage.size) : '—'}
            </dd>
          </div>
          <div>
            <dt>{t('image.inspector.date')}</dt>
            <dd>
              {activeImage.createdAt
                ? new Date(activeImage.createdAt).toLocaleString()
                : '—'}
            </dd>
          </div>
          <div>
            <dt>{t('image.inspector.folder')}</dt>
            <dd>{folderLabel(activeImage.localPath)}</dd>
          </div>
          <div>
            <dt>{t('image.inspector.sync')}</dt>
            <dd>
              {activeImage.linkKind === 'remote-raw' ||
              hasPublishableRemoteUrl(activeImage)
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
          {(activeImage.tags?.length ?? 0) > 0 ? (
            <div>
              <dt>{t('image.inspector.tags')}</dt>
              <dd>{(activeImage.tags ?? []).join('、')}</dd>
            </div>
          ) : null}
          {activeImage.description ? (
            <div>
              <dt>{t('image.inspector.description')}</dt>
              <dd>{activeImage.description}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </>
  ) : selectedFolderPath ? (
    <section className="asset-inspector-section">
      <h3>{t('image.inspector.folderSummaryTitle')}</h3>
      <dl className="asset-inspector-dl">
        <div>
          <dt>{t('image.inspector.folderPath')}</dt>
          <dd>{selectedFolderPath}</dd>
        </div>
        <div>
          <dt>{t('image.inspector.folder')}</dt>
          <dd>
            {t('image.inspector.folderFileCount').replace(
              '{count}',
              String(
                images.filter(item => {
                  const path = item.localPath;
                  if (!path) return false;
                  const prefix = `${selectedFolderPath}/`;
                  if (!path.startsWith(prefix)) return false;
                  const rest = path.slice(prefix.length);
                  return rest.length > 0 && !rest.includes('/');
                }).length,
              ),
            )}
          </dd>
        </div>
      </dl>
    </section>
  ) : (
    <p className="asset-inspector-empty">{t('image.inspector.empty')}</p>
  );

  const body = batchBody ?? singleBody;
  const actions =
    selectedImages.length >= 2
      ? batchActions
      : activeImage
        ? singleActions
        : null;

  const panel = (
    <aside
      className={`asset-inspector ${isSheet ? 'asset-inspector--sheet' : 'asset-inspector--dock'}${isSheet && sheetExpanded ? ' is-expanded' : ''}`}
      style={isSheet ? undefined : { width: inspectorWidth }}
      aria-label={t('image.inspector.title')}
    >
      {!isSheet ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t('image.inspector.resize')}
          tabIndex={0}
          className="asset-inspector-resize"
          onPointerDown={resizeHandlers.onPointerDown}
        />
      ) : null}
      <header className="asset-inspector-header">
        {isSheet ? (
          <button
            type="button"
            className="asset-inspector-handle"
            aria-label={
              sheetExpanded
                ? t('image.inspector.collapseSheet')
                : t('image.inspector.expandSheet')
            }
            aria-expanded={sheetExpanded}
            onPointerDown={onSheetHandlePointerDown}
            onPointerMove={onSheetHandlePointerMove}
            onPointerUp={onSheetHandlePointerUp}
          >
            <span className="asset-inspector-handle-bar" />
          </button>
        ) : null}
        <div className="asset-inspector-header-row">
          <h2>
            {selectedImages.length >= 2
              ? t('image.library.selectedCount').replace(
                  '{count}',
                  String(selectedImages.length),
                )
              : t('image.inspector.title')}
          </h2>
          <button
            type="button"
            className="asset-inspector-close"
            onClick={onClose}
            aria-label={t('image.inspector.close')}
          >
            <X size={18} />
          </button>
        </div>
      </header>
      <div className="asset-inspector-body">{body}</div>
      {actions && (actions.grid.length > 0 || actions.danger) ? (
        <footer className="asset-inspector-actions-footer">
          <h3 className="asset-inspector-actions-title">
            {t('image.inspector.sectionActions')}
          </h3>
          <InspectorActionGrid actions={actions.grid} danger={actions.danger} />
        </footer>
      ) : null}
    </aside>
  );

  return (
    <>
      {isSheet ? (
        <div className="asset-inspector-overlay">
          <button
            type="button"
            className="asset-inspector-backdrop"
            aria-label={t('image.inspector.close')}
            onClick={onClose}
          />
          {panel}
        </div>
      ) : (
        panel
      )}

      {activeImage && onUpdateImage ? (
        <ImageEditModal
          image={activeImage}
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
          t={t}
        />
      ) : null}
    </>
  );
};
