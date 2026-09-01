import { Cloud } from 'lucide-react';
import React, { RefObject } from 'react';
import type { ImageItem, SortField, SortOrder } from '@pixuli/core/types';
import { formatFileSize } from '@pixuli/core/utils';
import { isAssetSynced } from './copyLink';
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
  multiSelectMode?: boolean;
  allVisibleSelected?: boolean;
  onToggleSelectAll?: () => void;
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
  multiSelectMode = false,
  allVisibleSelected = false,
  onToggleSelectAll,
  tableWrapRef,
  t,
  onSort,
  onScroll,
  onSelect,
  onContextMenu,
  onTouchPointerDown,
  onTouchPointerEnd,
  longPressFiredRef,
}) => {
  const colSpan = multiSelectMode ? 5 : 4;

  return (
    <div
      className={`asset-library-table-wrap${multiSelectMode ? ' asset-library-table-wrap--multi' : ''}`}
      ref={tableWrapRef}
      onScroll={event => onScroll(event.currentTarget.scrollTop)}
    >
      <table className="asset-library-table">
        <thead>
          <tr>
            {multiSelectMode ? (
              <th className="asset-library-col-check">
                <input
                  type="checkbox"
                  className="asset-library-row-check"
                  checked={allVisibleSelected}
                  onChange={onToggleSelectAll}
                  aria-label={t('image.library.selectAll')}
                />
              </th>
            ) : null}
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
                colSpan={colSpan}
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
            const synced = isAssetSynced(file);
            return (
              <tr
                key={file.id}
                data-file-id={file.id}
                className={`asset-library-row ${selected ? 'asset-library-row--selected' : ''}${multiSelectMode ? ' asset-library-row--multi' : ''}`}
                aria-selected={selected}
                onClick={event => {
                  if (longPressFiredRef.current) {
                    longPressFiredRef.current = false;
                    return;
                  }
                  onSelect(
                    file.id,
                    event.metaKey || event.ctrlKey || multiSelectMode,
                    event.shiftKey,
                    multiSelectMode,
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
                {multiSelectMode ? (
                  <td className="asset-library-col-check">
                    <input
                      type="checkbox"
                      className="asset-library-row-check"
                      checked={selected}
                      readOnly
                      tabIndex={-1}
                      aria-hidden
                    />
                  </td>
                ) : null}
                <td>
                  <div className="asset-library-name-cell">
                    <AssetThumb item={file} />
                    <span className="asset-library-name-text" title={file.name}>
                      {file.name}
                    </span>
                    <span className="asset-library-badges">
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
                colSpan={colSpan}
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
};
