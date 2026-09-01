import React from 'react';
import type { ImageItem } from '@pixuli/core/types';
import { formatFileSize } from '@pixuli/core/utils';
import { isAssetSynced } from '@/features/library/copyLink';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { AssetInspectorFilePreview } from './AssetInspectorFilePreview';
import { folderLabel } from './inspectorUtils';

export function AssetInspectorBatchBody({
  selectedImages,
  selectedFolderPath,
  onSelectImage,
  t,
}: {
  selectedImages: ImageItem[];
  selectedFolderPath?: string;
  onSelectImage?: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
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
      <p className="asset-inspector-batch-hint">
        {t('image.library.batchFocusHint')}
      </p>
      <ul className="asset-inspector-batch-list">
        {selectedImages.slice(0, 12).map(item => (
          <li key={item.id}>
            {onSelectImage ? (
              <button
                type="button"
                className="asset-inspector-batch-item-btn"
                onClick={() => onSelectImage(item.id)}
              >
                {item.name}
              </button>
            ) : (
              item.name
            )}
          </li>
        ))}
        {selectedImages.length > 12 ? <li>…</li> : null}
      </ul>
    </>
  );
}

export function AssetInspectorSingleBody({
  activeImage,
  dimensions,
  onPreview,
  t,
}: {
  activeImage: ImageItem;
  dimensions: string;
  onPreview: () => void;
  t: (key: string) => string;
}) {
  const kind = getAssetKind(activeImage);

  return (
    <>
      <section className="asset-inspector-section">
        <h3>{t('image.inspector.sectionContent')}</h3>
        <AssetInspectorFilePreview
          image={activeImage}
          onPreview={onPreview}
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
              {isAssetSynced(activeImage)
                ? t('image.inspector.syncRemote')
                : t('image.inspector.syncLocal')}
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
  );
}

export function AssetInspectorFolderSummary({
  selectedFolderPath,
  images,
  t,
}: {
  selectedFolderPath: string;
  images: ImageItem[];
  t: (key: string) => string;
}) {
  return (
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
  );
}
