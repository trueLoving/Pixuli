import type { SidebarSource } from '@pixuli/ui';
import { Edit, Github, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/i18n/useI18n';
import { useSourceManagement } from '@/hooks/useSourceManagement';
import { useUIStore } from '@/stores/uiStore';

interface SourceContextMenu {
  x: number;
  y: number;
  sourceId: string;
}

export const WorkspaceSourceSection: React.FC<{
  showDivider?: boolean;
}> = ({ showDivider = true }) => {
  const { t } = useI18n();
  const {
    sidebarSources,
    handleSourceSelect,
    handleEditSource,
    handleDeleteSource,
  } = useSourceManagement();
  const addSource = useUIStore(state => state.addSource);
  const openConfigModalForEdit = useUIStore(
    state => state.openConfigModalForEdit,
  );
  const [contextMenu, setContextMenu] = useState<SourceContextMenu | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [contextMenu]);

  const openContextMenu = (event: React.MouseEvent, sourceId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, sourceId });
  };

  const handleEdit = (sourceId: string) => {
    const id = handleEditSource(sourceId);
    if (id) {
      openConfigModalForEdit(id);
    }
    setContextMenu(null);
  };

  const handleDelete = (sourceId: string) => {
    handleDeleteSource(sourceId, t);
    setContextMenu(null);
  };

  const renderSourceIcon = (source: SidebarSource) => {
    if (source.type === 'github') {
      return <Github size={14} className="shrink-0" />;
    }
    return (
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-red-500 text-[9px] font-bold text-white">
        码
      </span>
    );
  };

  return (
    <div
      className={`workspace-source-section${showDivider ? ' mt-3 border-t border-gray-200 pt-3' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-gray-700">
          {t('sidebar.sources')}
        </span>
        <button
          type="button"
          onClick={addSource}
          className="workspace-source-add-btn inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
          title={t('sidebar.addSource')}
        >
          <Plus size={14} />
          {t('sidebar.addSource')}
        </button>
      </div>

      {sidebarSources.length === 0 ? (
        <p className="text-xs text-gray-500">{t('sidebar.emptyState.text')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sidebarSources.map((source: SidebarSource) => {
            const unavailable = source.available === false;
            const active = source.active && !unavailable;
            return (
              <div key={source.id} className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={unavailable}
                  onClick={() => {
                    if (!unavailable) {
                      handleSourceSelect(source.id);
                    }
                  }}
                  onContextMenu={event => openContextMenu(event, source.id)}
                  title={
                    unavailable
                      ? t('sidebar.pluginUnavailable')
                      : `${source.owner}/${source.repo}`
                  }
                  className={`workspace-source-chip inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors ${
                    active
                      ? 'border-blue-400 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                  } ${unavailable ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {renderSourceIcon(source)}
                  <span className="min-w-0 truncate font-medium">
                    {source.name}
                  </span>
                  <span className="hidden sm:inline truncate text-gray-500">
                    {unavailable
                      ? t('sidebar.pluginUnavailable')
                      : `${source.owner}/${source.repo}`}
                  </span>
                </button>
                <button
                  type="button"
                  className="workspace-source-menu-btn rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  title={t('sidebar.editSource')}
                  onClick={event => openContextMenu(event, source.id)}
                  aria-label={t('sidebar.editSource')}
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {contextMenu &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[999999] min-w-[10rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
              onClick={() => handleEdit(contextMenu.sourceId)}
            >
              <Edit size={14} />
              {t('sidebar.editSource')}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => handleDelete(contextMenu.sourceId)}
            >
              <Trash2 size={14} />
              {t('sidebar.deleteSource')}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};
