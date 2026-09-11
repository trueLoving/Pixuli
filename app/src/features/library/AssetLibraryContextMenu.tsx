import type { ImageItem } from '@pixuli/core/types';
import React from 'react';
import { getCopyablePublicUrl } from './copyLink';

export interface AssetLibraryContextMenuProps {
  menu: { x: number; y: number; file: ImageItem };
  t: (key: string) => string;
  onClose: () => void;
  onCopyLink?: (image: ImageItem) => void;
  onSync?: () => void;
  onDeleteImage?: (id: string, name: string) => Promise<void>;
  hasRemoteConnection?: boolean;
}

export const AssetLibraryContextMenu: React.FC<
  AssetLibraryContextMenuProps
> = ({
  menu,
  t,
  onClose,
  onCopyLink,
  onSync,
  onDeleteImage,
  hasRemoteConnection,
}) => {
  const canCopy = getCopyablePublicUrl(menu.file) !== null;
  const copyTitle = canCopy
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
          disabled={!canCopy}
          title={copyTitle}
          onClick={() => {
            if (!canCopy) return;
            onCopyLink?.(menu.file);
            onClose();
          }}
        >
          {t('image.actions.copyUrl')}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onSync?.();
            onClose();
          }}
        >
          {t('image.toolbar.sync')}
        </button>
        <button
          type="button"
          role="menuitem"
          className="asset-library-menu-danger"
          onClick={() => {
            const file = menu.file;
            onClose();
            if (
              onDeleteImage &&
              confirm(
                `${t('image.grid.confirmDelete')} "${file.name}"？${t('image.grid.confirmDeleteLocalHint')}`,
              )
            ) {
              void onDeleteImage(file.id, file.name);
            }
          }}
        >
          {t('image.actions.delete')}
        </button>
      </div>
    </>
  );
};
