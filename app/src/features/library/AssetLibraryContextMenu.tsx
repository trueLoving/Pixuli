import type { AssetItem } from '@pixuli/core/types';
import React from 'react';
import { getCopyablePublicUrl } from './copyLink';

export interface AssetLibraryContextMenuProps {
  menu: { x: number; y: number; file: AssetItem };
  t: (key: string) => string;
  onClose: () => void;
  onCopyLink?: (asset: AssetItem) => void;
  onMoveAsset?: (asset: AssetItem) => void;
  onDeleteAsset?: (id: string, name: string) => Promise<void>;
  hasRemoteConnection?: boolean;
}

export const AssetLibraryContextMenu: React.FC<
  AssetLibraryContextMenuProps
> = ({
  menu,
  t,
  onClose,
  onCopyLink,
  onMoveAsset,
  onDeleteAsset,
  hasRemoteConnection,
}) => {
  const copyTitle =
    getCopyablePublicUrl(menu.file) !== null
      ? t('image.actions.copyUrl')
      : hasRemoteConnection === false
        ? t('image.copyLink.needConnection')
        : t('image.copyLink.needSync');

  return (
    <>
      <button
        type="button"
        className="asset-library-menu-backdrop"
        aria-label={t('image.actions.dismissMenu')}
        onClick={onClose}
      />
      <div
        className="asset-library-menu"
        style={{
          left: Math.min(menu.x, window.innerWidth - 176),
          top: Math.min(menu.y, window.innerHeight - 148),
        }}
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          title={copyTitle}
          onClick={() => {
            // 无公网链时仍触发回调，由上层 toast「去连接 / 去同步」
            onCopyLink?.(menu.file);
            onClose();
          }}
        >
          {t('image.actions.copyUrl')}
        </button>
        {onMoveAsset ? (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onMoveAsset(menu.file);
              onClose();
            }}
          >
            {t('image.library.moveTo')}
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className="asset-library-menu-danger"
          onClick={() => {
            const file = menu.file;
            onClose();
            if (
              onDeleteAsset &&
              confirm(
                `${t('image.grid.confirmDelete')} "${file.name}"？${t('image.grid.confirmDeleteLocalHint')}`,
              )
            ) {
              void onDeleteAsset(file.id, file.name);
            }
          }}
        >
          {t('image.actions.delete')}
        </button>
      </div>
    </>
  );
};
