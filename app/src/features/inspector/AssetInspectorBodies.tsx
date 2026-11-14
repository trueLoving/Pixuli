import React from 'react';
import type { AssetItem } from '@pixuli/core/types';
import { formatFileSize } from '@pixuli/core/utils';
import { isAssetSynced } from '@/features/library/copyLink';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { AssetInspectorFilePreview } from './AssetInspectorFilePreview';
import { folderLabel } from './inspectorUtils';

export function AssetInspectorBatchBody({
  selectedAssets,
  selectedFolderPath,
  onSelectAsset,
  t,
}: {
  selectedAssets: AssetItem[];
  selectedFolderPath?: string;
  onSelectAsset?: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <>
      <p className="asset-inspector-batch-lead">
        {t('image.library.selectedCount').replace(
          '{count}',
          String(selectedAssets.length),
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
        {selectedAssets.slice(0, 12).map(item => (
          <li key={item.id}>
            {onSelectAsset ? (
              <button
                type="button"
                className="asset-inspector-batch-item-btn"
                onClick={() => onSelectAsset(item.id)}
              >
                {item.name}
              </button>
            ) : (
              item.name
            )}
          </li>
        ))}
        {selectedAssets.length > 12 ? <li>…</li> : null}
      </ul>
    </>
  );
}

export function AssetInspectorSingleBody({
  activeAsset,
  dimensions,
  t,
  syncIgnored = false,
  onExcludeFromSync,
}: {
  activeAsset: AssetItem;
  dimensions: string;
  t: (key: string) => string;
  syncIgnored?: boolean;
  onExcludeFromSync?: () => void;
}) {
  const kind = getAssetKind(activeAsset);

  return (
    <>
      <section className="asset-inspector-section">
        <h3>{t('image.inspector.sectionContent')}</h3>
        <AssetInspectorFilePreview asset={activeAsset} t={t} />
      </section>

      <section className="asset-inspector-section">
        <h3>{t('image.inspector.sectionInfo')}</h3>
        <dl className="asset-inspector-dl">
          <div>
            <dt>{t('image.inspector.name')}</dt>
            <dd title={activeAsset.name}>{activeAsset.name}</dd>
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
              {activeAsset.size > 0 ? formatFileSize(activeAsset.size) : '—'}
            </dd>
          </div>
          <div>
            <dt>{t('image.inspector.date')}</dt>
            <dd>
              {activeAsset.createdAt
                ? new Date(activeAsset.createdAt).toLocaleString()
                : '—'}
            </dd>
          </div>
          <div>
            <dt>{t('image.inspector.folder')}</dt>
            <dd>{folderLabel(activeAsset.localPath)}</dd>
          </div>
          <div>
            <dt>{t('image.inspector.sync')}</dt>
            <dd>
              {syncIgnored
                ? t('settings.syncIgnore.badge')
                : isAssetSynced(activeAsset)
                  ? t('image.inspector.syncRemote')
                  : t('image.inspector.syncLocal')}
            </dd>
          </div>
          {onExcludeFromSync && !syncIgnored && activeAsset.localPath ? (
            <div>
              <dt />
              <dd>
                <button
                  type="button"
                  className="asset-inspector-exclude-sync"
                  onClick={onExcludeFromSync}
                >
                  {t('settings.syncIgnore.excludeAction')}
                </button>
              </dd>
            </div>
          ) : null}
          {(activeAsset.tags?.length ?? 0) > 0 ? (
            <div>
              <dt>{t('image.inspector.tags')}</dt>
              <dd>{(activeAsset.tags ?? []).join('、')}</dd>
            </div>
          ) : null}
          {activeAsset.description ? (
            <div>
              <dt>{t('image.inspector.description')}</dt>
              <dd>{activeAsset.description}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </>
  );
}

export function AssetInspectorFolderSummary({
  selectedFolderPath,
  assets,
  t,
}: {
  selectedFolderPath: string;
  assets: AssetItem[];
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
                assets.filter(item => {
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
