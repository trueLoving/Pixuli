import { Cloud, Globe, HardDrive } from 'lucide-react';
import React, { RefObject } from 'react';
import type { ImageItem, SortField, SortOrder } from '@pixuli/core/types';
import { formatFileSize } from '@pixuli/core/utils';
import { isAssetPublished, hasPublishableRemoteUrl } from './publishContract';
import { AssetThumb } from './AssetThumb';
import { kindLabel, sortIndicator } from './assetLibraryUtils';

export interface AssetLibraryTableProps {
  visibleFiles: ImageItem[];
  tableWindow: {
    start: number;
    end: number;
    offsetTop: number;
    offsetBottom: number;
  };
  sortField: SortField;
  sortOrder: SortOrder;
  selectedIds: string[];
  sourceId?: string;
  tableWrapRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  onSort: (field: SortField) => void;
  onScroll: (scrollTop: number) => void;
  onSelect: (
    fileId: string,
    additive: boolean,
    range: boolean,
    enterMulti?: boolean,
  ) => void;
  onContextMenu: (event: React.MouseEvent, file: ImageItem) => void;
  onTouchPointerDown: (fileId: string) => void;
  onTouchPointerEnd: () => void;
  longPressFiredRef: RefObject<boolean>;
}

export const AssetLibraryTable: React.FC<AssetLibraryTableProps> = ({
  visibleFiles,
  tableWindow,
  sortField,
  sortOrder,
  selectedIds,
  sourceId,
  tableWrapRef,
  t,
  onSort,
  onScroll,
  onSelect,
  onContextMenu,
  onTouchPointerDown,
  onTouchPointerEnd,
  longPressFiredRef,
}) => (
  <div
    className="asset-library-table-wrap"
    ref={tableWrapRef}
    onScroll={event => onScroll(event.currentTarget.scrollTop)}
  >
    <table className="asset-library-table">
      <thead>
        <tr>
          <th>
            <button type="button" onClick={() => onSort('name')}>
              {t('image.library.colName')}
              {sortIndicator(sortField === 'name', sortOrder)}
            </button>
          </th>
          <th className="asset-library-col-type">
            {t('image.library.colType')}
          </th>
          <th className="asset-library-col-size">
            <button type="button" onClick={() => onSort('size')}>
              {t('image.library.colSize')}
              {sortIndicator(sortField === 'size', sortOrder)}
            </button>
          </th>
          <th className="asset-library-col-date">
            <button type="button" onClick={() => onSort('createdAt')}>
              {t('image.library.colDate')}
              {sortIndicator(sortField === 'createdAt', sortOrder)}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {tableWindow.offsetTop > 0 ? (
          <tr aria-hidden className="asset-library-spacer">
            <td
              colSpan={4}
              style={{
                height: tableWindow.offsetTop,
                padding: 0,
                border: 0,
              }}
            />
          </tr>
        ) : null}
        {visibleFiles.map(file => {
          const selected = selectedIds.includes(file.id);
          const published = Boolean(
            sourceId && isAssetPublished(file.id, sourceId),
          );
          const synced =
            file.linkKind === 'remote-raw' || hasPublishableRemoteUrl(file);
          return (
            <tr
              key={file.id}
              data-file-id={file.id}
              className={`asset-library-row ${selected ? 'asset-library-row--selected' : ''}`}
              aria-selected={selected}
              onClick={event => {
                if (longPressFiredRef.current) {
                  longPressFiredRef.current = false;
                  return;
                }
                onSelect(
                  file.id,
                  event.metaKey || event.ctrlKey,
                  event.shiftKey,
                );
              }}
              onContextMenu={event => onContextMenu(event, file)}
              onPointerDown={event => {
                if (event.pointerType !== 'touch') return;
                onTouchPointerDown(file.id);
              }}
              onPointerUp={onTouchPointerEnd}
              onPointerCancel={onTouchPointerEnd}
              onPointerMove={onTouchPointerEnd}
            >
              <td>
                <div className="asset-library-name-cell">
                  <AssetThumb item={file} />
                  <span className="asset-library-name-text" title={file.name}>
                    {file.name}
                  </span>
                  <span className="asset-library-badges">
                    <span
                      className="asset-library-badge asset-library-badge--local"
                      title={t('image.library.badgeLocal')}
                    >
                      <HardDrive size={10} aria-hidden />
                    </span>
                    <span
                      className={`asset-library-badge ${synced ? 'asset-library-badge--synced' : 'asset-library-badge--local-only'}`}
                      title={
                        synced
                          ? t('image.inspector.syncRemote')
                          : t('image.inspector.syncLocal')
                      }
                    >
                      <Cloud size={10} aria-hidden />
                    </span>
                    {published ? (
                      <span
                        className="asset-library-badge asset-library-badge--public"
                        title={t('image.inspector.accessPublic')}
                      >
                        <Globe size={10} aria-hidden />
                      </span>
                    ) : null}
                  </span>
                </div>
              </td>
              <td className="asset-library-col-type">{kindLabel(file, t)}</td>
              <td className="asset-library-col-size">
                {file.size > 0 ? formatFileSize(file.size) : '—'}
              </td>
              <td className="asset-library-col-date">
                {file.createdAt
                  ? new Date(file.createdAt).toLocaleString()
                  : '—'}
              </td>
            </tr>
          );
        })}
        {tableWindow.offsetBottom > 0 ? (
          <tr aria-hidden className="asset-library-spacer">
            <td
              colSpan={4}
              style={{
                height: tableWindow.offsetBottom,
                padding: 0,
                border: 0,
              }}
            />
          </tr>
        ) : null}
      </tbody>
    </table>
  </div>
);
