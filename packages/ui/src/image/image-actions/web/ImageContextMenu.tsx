import React, { useEffect } from 'react';
import { IMAGE_ACTION_DEFINITIONS } from '../common/definitions';
import type { ImageContextMenuState } from '../common/types';
import './ImageActionMenu.css';

export interface ImageContextMenuProps {
  menu: ImageContextMenuState | null;
  onClose: () => void;
  t: (key: string) => string;
}

const ImageContextMenu: React.FC<ImageContextMenuProps> = ({
  menu,
  onClose,
  t,
}) => {
  useEffect(() => {
    if (!menu) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menu, onClose]);

  if (!menu) return null;

  const items = menu.actions.filter(
    id => typeof menu.handlers[id] === 'function',
  );
  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[59] cursor-default border-0 bg-transparent p-0"
        aria-label={t('image.actions.dismissMenu')}
        onClick={onClose}
      />
      <div
        className="image-context-menu"
        style={{ left: menu.x, top: menu.y }}
        role="menu"
      >
        {items.map(id => {
          const def = IMAGE_ACTION_DEFINITIONS[id];
          const Icon = def.icon;
          return (
            <button
              key={id}
              type="button"
              role="menuitem"
              className={`image-action-menu__item ${def.danger ? 'image-action-menu__item--danger' : ''}`.trim()}
              onClick={() => {
                void menu.handlers[id]?.();
                onClose();
              }}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{t(def.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default ImageContextMenu;
