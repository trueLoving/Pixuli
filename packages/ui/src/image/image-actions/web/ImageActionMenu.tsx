import { MoreHorizontal } from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';
import { IMAGE_ACTION_DEFINITIONS } from '../common/definitions';
import type {
  ImageActionHandlers,
  ImageActionId,
  ImageActionMenuProps,
} from '../common/types';
import './ImageActionMenu.css';

function resolveActions(
  actions: ImageActionId[],
  handlers: ImageActionHandlers,
): ImageActionId[] {
  return actions.filter(id => typeof handlers[id] === 'function');
}

function labeledTone(
  id: ImageActionId,
  index: number,
): 'primary' | 'secondary' | 'neutral' | 'danger' {
  if (id === 'delete') return 'danger';
  if (id === 'copyUrl') return 'primary';
  if (id === 'openUrl' || id === 'share') return 'secondary';
  return index === 0 ? 'primary' : 'neutral';
}

const ImageActionMenu: React.FC<ImageActionMenuProps> = ({
  variant,
  actions,
  handlers,
  t,
  className = '',
  open = false,
  onOpenChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const availableActions = useMemo(
    () => resolveActions(actions, handlers),
    [actions, handlers],
  );

  useEffect(() => {
    if (variant !== 'dropdown' || !open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onOpenChange?.(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange?.(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [variant, open, onOpenChange]);

  if (availableActions.length === 0) {
    return null;
  }

  const runAction = (id: ImageActionId) => {
    void handlers[id]?.();
    onOpenChange?.(false);
  };

  if (variant === 'icon-bar') {
    return (
      <div
        className={`image-action-menu image-action-menu--icon-bar ${className}`.trim()}
      >
        {availableActions.map(id => {
          const def = IMAGE_ACTION_DEFINITIONS[id];
          const Icon = def.icon;
          return (
            <button
              key={id}
              type="button"
              className={`image-action-menu__icon-button image-action-button ${def.danger ? 'image-action-menu__icon-button--danger image-action-button--danger' : ''}`.trim()}
              title={t(def.labelKey)}
              aria-label={t(def.labelKey)}
              onClick={() => runAction(id)}
            >
              <Icon
                className="image-action-menu__icon image-action-icon"
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'labeled-bar') {
    return (
      <div
        className={`image-action-menu image-action-menu--labeled-bar ${className}`.trim()}
      >
        {availableActions.map((id, index) => {
          const def = IMAGE_ACTION_DEFINITIONS[id];
          const Icon = def.icon;
          const tone = labeledTone(id, index);
          return (
            <button
              key={id}
              type="button"
              className={`image-action-menu__labeled-button image-action-menu__labeled-button--${tone}`.trim()}
              onClick={() => runAction(id)}
            >
              <Icon
                className="image-action-menu__icon image-action-menu__icon--sm"
                aria-hidden
              />
              <span>{t(def.labelKey)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`image-action-menu image-action-menu--dropdown ${className}`.trim()}
      ref={panelRef}
    >
      <button
        type="button"
        className="image-action-menu__trigger"
        title={t('image.actions.more')}
        aria-label={t('image.actions.more')}
        aria-expanded={open}
        onClick={() => onOpenChange?.(!open)}
      >
        <MoreHorizontal className="image-action-menu__icon" aria-hidden />
      </button>
      {open ? (
        <div className="image-action-menu__panel" role="menu">
          {availableActions.map(id => {
            const def = IMAGE_ACTION_DEFINITIONS[id];
            const Icon = def.icon;
            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                className={`image-action-menu__item ${def.danger ? 'image-action-menu__item--danger' : ''}`.trim()}
                onClick={() => runAction(id)}
              >
                <Icon className="image-action-menu__icon" aria-hidden />
                <span>{t(def.labelKey)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default ImageActionMenu;
