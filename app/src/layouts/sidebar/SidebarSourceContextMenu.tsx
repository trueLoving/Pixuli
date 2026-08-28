import { Edit, ExternalLink, Trash2 } from 'lucide-react';
import React, { RefObject } from 'react';
import { createPortal } from 'react-dom';

export interface SidebarSourceContextMenuProps {
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    sourceId: string;
  } | null;
  contextMenuRef: RefObject<HTMLDivElement | null>;
  translate: (key: string) => string;
  onOpenInWindow?: (sourceId: string) => void;
  onEdit: (sourceId: string) => void;
  onDelete: (sourceId: string) => void;
}

export const SidebarSourceContextMenu: React.FC<
  SidebarSourceContextMenuProps
> = ({
  contextMenu,
  contextMenuRef,
  translate,
  onOpenInWindow,
  onEdit,
  onDelete,
}) => {
  if (!contextMenu?.visible) return null;

  const menuContent = (
    <div
      ref={contextMenuRef}
      className="sidebar-context-menu"
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        zIndex: 999999,
      }}
    >
      {onOpenInWindow ? (
        <button
          className="sidebar-context-menu-item"
          onClick={() => onOpenInWindow(contextMenu.sourceId)}
        >
          <ExternalLink size={16} />
          <span>{translate('sidebar.openInWindow')}</span>
        </button>
      ) : null}
      <button
        className="sidebar-context-menu-item"
        onClick={() => onEdit(contextMenu.sourceId)}
      >
        <Edit size={16} />
        <span>{translate('sidebar.editSource')}</span>
      </button>
      <button
        className="sidebar-context-menu-item sidebar-context-menu-item-danger"
        onClick={() => onDelete(contextMenu.sourceId)}
      >
        <Trash2 size={16} />
        <span>{translate('sidebar.deleteSource')}</span>
      </button>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(menuContent, document.body)
    : null;
};

export function SidebarMobileOverlay({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose?: () => void;
}) {
  if (!mobileOpen || !onMobileClose) return null;

  const overlay = (
    <div
      className="sidebar-overlay"
      onClick={onMobileClose}
      aria-hidden="true"
    />
  );

  return typeof document !== 'undefined'
    ? createPortal(overlay, document.body)
    : null;
}
