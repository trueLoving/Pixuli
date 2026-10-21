import { Github, Plus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { SidebarSourceContextMenu } from '@/layouts/sidebar/SidebarSourceContextMenu';
import type { SidebarSource } from '@/features/settings/sidebarSourceTypes';

export interface SidebarSourceSectionProps {
  sources: SidebarSource[];
  selectedSourceId: string | null;
  onSourceSelect: (id: string) => void;
  onAddSource: () => void;
  onSourceEdit?: (id: string) => void;
  onSourceDelete?: (id: string) => void;
  onSourceOpenInWindow?: (id: string) => void;
  translate: (key: string) => string;
  variant: 'expanded' | 'collapsed';
}

function useSourceContextMenu(
  onSourceEdit?: (id: string) => void,
  onSourceDelete?: (id: string) => void,
) {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    sourceId: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const closeContextMenu = () => setContextMenu(null);

  const handleContextMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    sourceId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      sourceId,
    });
  };

  const handleEdit = (sourceId: string) => {
    onSourceEdit?.(sourceId);
    closeContextMenu();
  };

  const handleDelete = (sourceId: string) => {
    onSourceDelete?.(sourceId);
    closeContextMenu();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        closeContextMenu();
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu?.visible]);

  return {
    contextMenu,
    contextMenuRef,
    handleContextMenu,
    handleEdit,
    handleDelete,
    closeContextMenu,
  };
}

export const SidebarSourceSection: React.FC<SidebarSourceSectionProps> = ({
  sources,
  selectedSourceId,
  onSourceSelect,
  onAddSource,
  onSourceEdit,
  onSourceDelete,
  onSourceOpenInWindow,
  translate,
  variant,
}) => {
  const {
    contextMenu,
    contextMenuRef,
    handleContextMenu,
    handleEdit,
    handleDelete,
  } = useSourceContextMenu(onSourceEdit, onSourceDelete);

  if (variant === 'collapsed') {
    if (sources.length === 0) {
      return null;
    }
    return (
      <>
        <div className="sidebar-collapsed-sources">
          {sources.slice(0, 3).map(source => (
            <button
              key={source.id}
              className={`sidebar-collapsed-source-item ${
                selectedSourceId === source.id ? 'active' : ''
              }`}
              onClick={() => onSourceSelect(source.id)}
              onContextMenu={event => handleContextMenu(event, source.id)}
              title={`${source.name}\n${source.owner}/${source.repo}`}
            >
              {source.type === 'github' ? (
                <Github size={26} />
              ) : (
                <div className="gitee-icon-small">码</div>
              )}
              <span className="sidebar-collapsed-tooltip">{source.name}</span>
            </button>
          ))}
          {sources.length > 3 && (
            <div
              className="sidebar-collapsed-more"
              title={`还有 ${sources.length - 3} 个源`}
            >
              <Plus size={16} />
              <span className="sidebar-collapsed-tooltip">
                {translate('sidebar.sources')} (+{sources.length - 3})
              </span>
            </div>
          )}
        </div>
        <SidebarSourceContextMenu
          contextMenu={contextMenu}
          contextMenuRef={contextMenuRef}
          translate={translate}
          onOpenInWindow={onSourceOpenInWindow}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </>
    );
  }

  return (
    <>
      <div className="sidebar-section sidebar-sources">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">
            {translate('sidebar.sources')}
          </span>
          <button
            onClick={onAddSource}
            className="sidebar-add-source-btn"
            title={translate('sidebar.addSource')}
          >
            <Plus size={16} />
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="sidebar-empty-state">
            <div className="sidebar-empty-icon">
              <Plus size={24} className="text-gray-400" />
            </div>
            <p className="sidebar-empty-text">
              {translate('sidebar.emptyState.text')}
            </p>
            <button onClick={onAddSource} className="sidebar-add-button">
              <Plus size={16} />
              {translate('sidebar.emptyState.addSource')}
            </button>
          </div>
        ) : (
          <div className="sidebar-source-list">
            {sources.map(source => {
              const unavailable = source.available === false;
              return (
                <button
                  key={source.id}
                  type="button"
                  className={`sidebar-source-item ${
                    selectedSourceId === source.id ? 'active' : ''
                  } ${unavailable ? 'sidebar-source-item--unavailable' : ''}`}
                  onClick={() => {
                    if (!unavailable) {
                      onSourceSelect(source.id);
                    }
                  }}
                  onContextMenu={event => handleContextMenu(event, source.id)}
                  title={
                    unavailable
                      ? translate('sidebar.pluginUnavailable')
                      : `${source.owner}/${source.repo}`
                  }
                  disabled={unavailable}
                >
                  <div className="sidebar-source-icon">
                    {source.type === 'github' ? (
                      <Github size={16} />
                    ) : (
                      <div className="gitee-icon">码</div>
                    )}
                  </div>
                  <div className="sidebar-source-info">
                    <div className="sidebar-source-name">{source.name}</div>
                    <div className="sidebar-source-path">
                      {unavailable
                        ? translate('sidebar.pluginUnavailable')
                        : `${source.owner}/${source.repo}`}
                    </div>
                  </div>
                  {source.active && !unavailable && (
                    <div className="sidebar-source-active-dot" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <SidebarSourceContextMenu
        contextMenu={contextMenu}
        contextMenuRef={contextMenuRef}
        translate={translate}
        onOpenInWindow={onSourceOpenInWindow}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
};
