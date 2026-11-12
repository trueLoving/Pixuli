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
  buildBatchSelectionActions,
  buildSingleSelectionActions,
} from '@/features/library/selectionActions';
import AssetEditModal from './AssetEditModal';
import AssetPreviewModal from './AssetPreviewModal';
import {
  AssetInspectorBatchBody,
  AssetInspectorFolderSummary,
  AssetInspectorSingleBody,
} from './AssetInspectorBodies';
import { InspectorActionGrid } from './InspectorActionGrid';
import type { MetadataReviewSession } from './inspectorTypes';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getCopyablePublicUrl } from '@/features/library/copyLink';
import { useUIStore } from '@/stores/uiStore';
import type { AssetEditData, AssetItem } from '@pixuli/core/types';
import { formatFileSize } from '@pixuli/core/utils';
import { getAssetKind } from '@/features/library/utils/assetKind';
import {
  INSPECTOR_WIDTH_MAX,
  INSPECTOR_WIDTH_MIN,
  usePanelResize,
} from '@/hooks/usePanelResize';
import './AssetInspector.css';

export type { MetadataReviewSession } from './inspectorTypes';

interface AssetInspectorProps {
  asset: AssetItem | null;
  selectedAssets?: AssetItem[];
  assets: AssetItem[];
  onClose: () => void;
  onDeleteAsset?: (id: string, name: string) => Promise<void>;
  onDeleteMultipleAssets?: (ids: string[], names: string[]) => Promise<void>;
  onUpdateAsset?: (data: AssetEditData) => Promise<void>;
  onCopyUrl?: (url: string, type: 'url' | 'githubUrl') => Promise<void>;
  onShareAsset?: (asset: AssetItem) => Promise<void>;
  onSync?: () => void;
  onSendConvert?: () => void;
  onBatchEdit?: () => void;
  onBatchDownload?: () => void;
  onCopyLinks?: () => void;
  /** 单文件复制链接（走 Workbench 统一三态反馈） */
  onCopyActiveLink?: () => void;
  hasRemoteConnection?: boolean;
  /** 批摘要列表点击 → 单文件 */
  onSelectAsset?: (id: string) => void;
  enableFolderMove?: boolean;
  folderOptions?: string[];
  /** 添加后逐张完善 */
  metadataReview?: MetadataReviewSession | null;
  getImageDimensionsFromUrl?: (
    url: string,
  ) => Promise<{ width: number; height: number }>;
  t: (key: string) => string;
  variant?: 'dock' | 'sheet';
  /** 桌面双击 / Enter 打开预览 */
  openPreviewRequest?: { id: string; nonce: number } | null;
  /** 本地工作区里按文件类型打开处理弹窗 */
  convertInLibrary?: boolean;
}

export const AssetInspector: React.FC<AssetInspectorProps> = ({
  asset,
  selectedAssets = [],
  assets,
  onClose,
  onDeleteAsset,
  onDeleteMultipleAssets,
  onUpdateAsset,
  onCopyUrl,
  onShareAsset,
  onSync,
  onSendConvert,
  onBatchEdit,
  onBatchDownload,
  onCopyLinks,
  onCopyActiveLink,
  hasRemoteConnection,
  onSelectAsset,
  enableFolderMove = false,
  folderOptions = [],
  metadataReview = null,
  getImageDimensionsFromUrl,
  t,
  variant = 'dock',
  openPreviewRequest = null,
  convertInLibrary = false,
}) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(asset);

  useEffect(() => {
    setPreviewAsset(
      asset ?? (selectedAssets.length === 1 ? selectedAssets[0] : null),
    );
  }, [asset, selectedAssets]);

  const seenPreviewNonce = useRef(0);
  useEffect(() => {
    const nonce = openPreviewRequest?.nonce ?? 0;
    if (nonce <= 0 || nonce === seenPreviewNonce.current) return;
    const current =
      asset ?? (selectedAssets.length === 1 ? selectedAssets[0] : null);
    if (current?.id !== openPreviewRequest?.id) return;
    seenPreviewNonce.current = nonce;
    setShowPreview(true);
  }, [asset, openPreviewRequest, selectedAssets]);

  useEffect(() => {
    if (!metadataReview || !onUpdateAsset) {
      return;
    }
    if (metadataReview.openEditNonce <= 0) {
      return;
    }
    setShowEdit(true);
  }, [metadataReview?.openEditNonce, onUpdateAsset]);

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
      (asset || selectedAssets.length > 0) &&
        (isSheet || showPreview || showEdit),
    ),
  );

  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  /** 单选时以 props.asset 为准，缺省则回退 selectedAssets[0] */
  const activeAsset =
    asset ?? (selectedAssets.length === 1 ? selectedAssets[0] : null);
  const previewIndex = previewAsset
    ? assets.findIndex(item => item.id === previewAsset.id)
    : -1;

  const kind = activeAsset ? getAssetKind(activeAsset) : 'image';
  const dimensions =
    activeAsset && activeAsset.width > 0 && activeAsset.height > 0
      ? `${activeAsset.width} × ${activeAsset.height}`
      : t('image.grid.dimensionsUnknown');

  const handleCopy = useCallback(async () => {
    if (!activeAsset) return;
    if (onCopyActiveLink) {
      onCopyActiveLink();
      return;
    }
    const url = getCopyablePublicUrl(activeAsset);
    if (!url) {
      showError(t('image.copyLink.needSync'));
      return;
    }
    try {
      if (onCopyUrl) {
        await onCopyUrl(url, 'url');
      } else {
        const { copyTextToClipboard } = await import('@/utils/clipboard');
        await copyTextToClipboard(url);
      }
      showSuccess(
        `${t('image.grid.imageUrlCopied')}${t('image.grid.copiedToClipboard')}`,
      );
    } catch {
      showError(t('image.grid.copyFailed'));
    }
  }, [activeAsset, onCopyActiveLink, onCopyUrl, t]);

  const handleDelete = useCallback(async () => {
    if (!activeAsset || !onDeleteAsset) return;
    if (
      !confirm(
        `${t('image.grid.confirmDelete')} "${activeAsset.name}"？${t('image.grid.confirmDeleteLocalHint')}`,
      )
    ) {
      return;
    }
    const loadingToast = showLoading(
      `${t('image.grid.deleting')} "${activeAsset.name}"...`,
    );
    try {
      await onDeleteAsset(activeAsset.id, activeAsset.name);
      updateLoadingToSuccess(
        String(loadingToast),
        `${t('image.grid.deleteSuccess')} "${activeAsset.name}" ${t('image.grid.deleted')}`,
      );
      onClose();
    } catch (error) {
      updateLoadingToError(
        String(loadingToast),
        `${t('image.grid.deleteFailed')} "${activeAsset.name}" ${t('image.grid.failed')}: ${error instanceof Error ? error.message : t('common.unknownError')}`,
      );
    }
  }, [activeAsset, onClose, onDeleteAsset, t]);

  const handleShare = useCallback(async () => {
    if (!activeAsset || !onShareAsset) return;
    try {
      await onShareAsset(activeAsset);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      if (/cancel|abort|dismiss|user/i.test(message)) return;
      showError(`${t('image.grid.shareFailed')}: ${message}`);
    }
  }, [activeAsset, onShareAsset, t]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedAssets.length === 0) return;
    if (
      !confirm(
        t('image.library.confirmDeleteN').replace(
          '{count}',
          String(selectedAssets.length),
        ),
      )
    ) {
      return;
    }
    if (selectedAssets.length === 1 && onDeleteAsset) {
      await onDeleteAsset(selectedAssets[0].id, selectedAssets[0].name);
    } else if (onDeleteMultipleAssets) {
      await onDeleteMultipleAssets(
        selectedAssets.map(item => item.id),
        selectedAssets.map(item => item.name),
      );
    }
    onClose();
  }, [onClose, onDeleteAsset, onDeleteMultipleAssets, selectedAssets, t]);

  const singleActions = useMemo(
    () =>
      buildSingleSelectionActions(
        kind,
        t,
        {
          onEdit: onUpdateAsset
            ? () => {
                setShowEdit(true);
                if (activeAsset) {
                  showInfo(`${t('image.grid.editing')} "${activeAsset.name}"`);
                }
              }
            : undefined,
          onCopy: () => {
            void handleCopy();
          },
          onShare: onShareAsset
            ? () => {
                void handleShare();
              }
            : undefined,
          onSendConvert,
          onDelete: () => {
            void handleDelete();
          },
        },
        {
          canEdit: Boolean(onUpdateAsset),
          canShare: Boolean(onShareAsset),
          canDelete: Boolean(onDeleteAsset),
          canCopy: Boolean(activeAsset && getCopyablePublicUrl(activeAsset)),
          copyDisabledTitle:
            hasRemoteConnection === false
              ? t('image.copyLink.needConnection')
              : t('image.copyLink.needSync'),
          convertInLibrary,
        },
      ),
    [
      activeAsset,
      convertInLibrary,
      handleCopy,
      handleDelete,
      handleShare,
      hasRemoteConnection,
      kind,
      onDeleteAsset,
      onSendConvert,
      onShareAsset,
      onUpdateAsset,
      t,
    ],
  );

  const batchActions = useMemo(
    () =>
      buildBatchSelectionActions(
        selectedAssets,
        t,
        {
          onBatchEdit,
          onBatchDownload,
          onSync,
          onCopyLinks,
          onSendConvert,
          onBatchDelete: () => {
            void handleBatchDelete();
          },
        },
        { hasRemoteConnection, convertInLibrary },
      ),
    [
      convertInLibrary,
      handleBatchDelete,
      hasRemoteConnection,
      onBatchDownload,
      onBatchEdit,
      onCopyLinks,
      onSendConvert,
      onSync,
      selectedAssets,
      t,
    ],
  );

  const batchBody =
    selectedAssets.length >= 2 ? (
      <AssetInspectorBatchBody
        selectedAssets={selectedAssets}
        selectedFolderPath={selectedFolderPath}
        onSelectAsset={onSelectAsset}
        t={t}
      />
    ) : null;

  const singleBody = activeAsset ? (
    <AssetInspectorSingleBody
      activeAsset={activeAsset}
      dimensions={dimensions}
      t={t}
    />
  ) : selectedFolderPath ? (
    <AssetInspectorFolderSummary
      selectedFolderPath={selectedFolderPath}
      assets={assets}
      t={t}
    />
  ) : (
    <p className="asset-inspector-empty">{t('image.inspector.empty')}</p>
  );

  const body = batchBody ?? singleBody;
  const actions =
    selectedAssets.length >= 2
      ? batchActions
      : activeAsset
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
            {selectedAssets.length >= 2
              ? t('image.library.selectedCount').replace(
                  '{count}',
                  String(selectedAssets.length),
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
        {metadataReview && metadataReview.ids.length > 0 ? (
          <div className="asset-inspector-review" role="group">
            <div className="asset-inspector-review-text">
              <p className="asset-inspector-review-title">
                {t('image.inspector.reviewTitle')}
              </p>
              <p className="asset-inspector-review-progress">
                {t('image.inspector.reviewProgress')
                  .replace('{current}', String(metadataReview.index + 1))
                  .replace('{total}', String(metadataReview.ids.length))}
              </p>
              <p className="asset-inspector-review-hint">
                {t('image.inspector.reviewHint')}
              </p>
            </div>
            <div className="asset-inspector-review-actions">
              <button
                type="button"
                className="asset-inspector-review-btn"
                onClick={metadataReview.onPrev}
                disabled={metadataReview.index <= 0}
                aria-label={t('image.inspector.reviewPrev')}
                title={t('image.inspector.reviewPrev')}
              >
                <ChevronLeft size={16} aria-hidden />
              </button>
              <button
                type="button"
                className="asset-inspector-review-btn"
                onClick={metadataReview.onNext}
                disabled={metadataReview.index >= metadataReview.ids.length - 1}
                aria-label={t('image.inspector.reviewNext')}
                title={t('image.inspector.reviewNext')}
              >
                <ChevronRight size={16} aria-hidden />
              </button>
              <button
                type="button"
                className="asset-inspector-review-done"
                onClick={metadataReview.onDone}
              >
                {t('image.inspector.reviewDone')}
              </button>
            </div>
          </div>
        ) : null}
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

      {activeAsset && onUpdateAsset ? (
        <AssetEditModal
          asset={activeAsset}
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          onUpdateAsset={onUpdateAsset}
          onSuccess={() => setShowEdit(false)}
          onCancel={() => setShowEdit(false)}
          enableFolderMove={enableFolderMove}
          folderOptions={folderOptions}
          getImageDimensionsFromUrl={getImageDimensionsFromUrl}
          t={t}
        />
      ) : null}

      {previewAsset ? (
        <AssetPreviewModal
          asset={previewAsset}
          assets={assets}
          currentIndex={previewIndex < 0 ? 0 : previewIndex}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onNavigate={index => {
            const next = assets[index];
            if (next) setPreviewAsset(next);
          }}
          formatFileSize={formatFileSize}
          t={t}
        />
      ) : null}
    </>
  );
};
