import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import {
  EXPLORER_WIDTH_MAX,
  EXPLORER_WIDTH_MIN,
  usePanelResize,
} from '@/hooks/usePanelResize';
import { useImageStore } from '@/features/library/imageStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import {
  buildWorkspaceFolderTree,
  folderNodeLabel,
  type WorkspaceFolderNode,
} from './folderTree';
import './WorkspaceFolderTree.css';

/** 新建子文件夹的父路径：根（全部）→ 工作区顶层；否则用当前选中目录 */
export function resolveNewFolderParent(selectedOrMenuPath: string): string {
  const path = selectedOrMenuPath.trim();
  if (!path || path === '__root__') {
    return '';
  }
  return path.replace(/\/+$/, '');
}

/** 资源管理器展示的本机位置：真实路径优先，虚拟存储用可读说明 */
export function formatWorkspaceLocation(
  rootPath: string | null,
  displayName: string | null,
  t: (key: string) => string,
): string | null {
  if (!rootPath) {
    return null;
  }
  if (rootPath.startsWith('mobile://')) {
    return t('workspace.mobileStorage');
  }
  if (rootPath.startsWith('opfs://')) {
    return t('workspace.webStorage');
  }
  if (rootPath.startsWith('fsa://')) {
    const name = displayName?.trim();
    return name
      ? `${t('workspace.fsaStorage')} · ${name}`
      : t('workspace.fsaStorage');
  }
  return rootPath;
}

interface TreeRowProps {
  node: WorkspaceFolderNode;
  depth: number;
  selectedPath: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onContextMenu: (path: string, event: React.MouseEvent) => void;
  allLabel: string;
}

const TreeRow: React.FC<TreeRowProps> = ({
  node,
  depth,
  selectedPath,
  expandedPaths,
  onToggle,
  onSelect,
  onContextMenu,
  allLabel,
}) => {
  const hasChildren = node.children.length > 0;
  const expandKey = node.path || '__root__';
  const isExpanded = expandedPaths.has(expandKey);
  const isSelected = selectedPath === node.path;
  const label = folderNodeLabel(node, allLabel);

  return (
    <>
      <div
        className={`workspace-tree-row ${isSelected ? 'workspace-tree-row--active' : ''}`}
        style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
        onContextMenu={event => {
          event.preventDefault();
          onContextMenu(node.path, event);
        }}
      >
        <button
          type="button"
          className="workspace-tree-row-main"
          onClick={() => onSelect(node.path)}
        >
          {hasChildren ? (
            <span
              className="workspace-tree-toggle"
              onClick={event => {
                event.stopPropagation();
                onToggle(expandKey);
              }}
              role="presentation"
            >
              {isExpanded ? (
                <ChevronDown size={14} aria-hidden />
              ) : (
                <ChevronRight size={14} aria-hidden />
              )}
            </span>
          ) : (
            <span className="workspace-tree-toggle workspace-tree-toggle--placeholder" />
          )}
          {isSelected ? (
            <FolderOpen size={16} className="workspace-tree-icon" aria-hidden />
          ) : (
            <Folder size={16} className="workspace-tree-icon" aria-hidden />
          )}
          <span className="workspace-tree-label">{label}</span>
          <span className="workspace-tree-count">{node.imageCount}</span>
        </button>
      </div>
      {hasChildren && isExpanded
        ? node.children.map(child => (
            <TreeRow
              key={child.path || 'root-child'}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              allLabel={allLabel}
            />
          ))
        : null}
    </>
  );
};

export const WorkspaceFolderTree: React.FC<{ overlay?: boolean }> = ({
  overlay = false,
}) => {
  const { t } = useI18n();
  const images = useImageStore(state => state.images);
  const displayName = useWorkspaceStore(state => state.displayName);
  const rootPath = useWorkspaceStore(state => state.rootPath);
  const localFolders = useWorkspaceStore(state => state.localFolders);
  const createLocalFolder = useWorkspaceStore(state => state.createLocalFolder);
  const renameLocalFolder = useWorkspaceStore(state => state.renameLocalFolder);
  const deleteLocalFolder = useWorkspaceStore(state => state.deleteLocalFolder);
  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const setSelectedFolderPath = useUIStore(
    state => state.setSelectedFolderPath,
  );
  const setWorkspaceExplorerOpen = useUIStore(
    state => state.setWorkspaceExplorerOpen,
  );
  const explorerWidth = useUIStore(state => state.workspaceExplorerWidth);
  const setWorkspaceExplorerWidth = useUIStore(
    state => state.setWorkspaceExplorerWidth,
  );
  const openWorkspaceModal = useUIStore(state => state.openWorkspaceModal);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(['__root__', 'images']),
  );
  const [menu, setMenu] = useState<{
    path: string;
    x: number;
    y: number;
  } | null>(null);

  const resizeHandlers = usePanelResize({
    width: explorerWidth,
    min: EXPLORER_WIDTH_MIN,
    max: EXPLORER_WIDTH_MAX,
    edge: 'right',
    onWidthChange: setWorkspaceExplorerWidth,
  });

  const tree = useMemo(() => {
    const paths = images
      .map(image => image.localPath)
      .filter((path): path is string => Boolean(path));
    return buildWorkspaceFolderTree(paths, localFolders);
  }, [images, localFolders]);

  const toggleExpanded = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelect = (path: string) => {
    setSelectedFolderPath(path);
    setMenu(null);
    if (overlay) {
      setWorkspaceExplorerOpen(false);
    }
  };

  const handleFolderContextMenu = (path: string, event: React.MouseEvent) => {
    setSelectedFolderPath(path);
    setMenu({ path, x: event.clientX, y: event.clientY });
  };

  const parentForNew = (path: string) => resolveNewFolderParent(path);

  const handleCreate = async (parentPath: string) => {
    setMenu(null);
    const name = window.prompt(t('workspace.newFolderPrompt'));
    if (!name?.trim()) return;
    const safe = name.trim().replace(/[/\\]/g, '_');
    const parent = parentForNew(parentPath);
    const target = parent ? `${parent}/${safe}` : safe;
    await createLocalFolder(target);
    setExpandedPaths(prev => {
      const next = new Set(prev);
      next.add(parent || '__root__');
      return next;
    });
    setSelectedFolderPath(target);
  };

  const handleRename = async (path: string) => {
    setMenu(null);
    if (!path) return;
    const currentName = path.split('/').pop() || path;
    const name = window.prompt(t('workspace.renameFolderPrompt'), currentName);
    if (!name?.trim() || name.trim() === currentName) return;
    const safe = name.trim().replace(/[/\\]/g, '_');
    const parent = path.includes('/')
      ? path.slice(0, path.lastIndexOf('/'))
      : '';
    const next = parent ? `${parent}/${safe}` : safe;
    await renameLocalFolder(path, next);
    if (
      selectedFolderPath === path ||
      selectedFolderPath.startsWith(`${path}/`)
    ) {
      setSelectedFolderPath(
        selectedFolderPath === path
          ? next
          : `${next}/${selectedFolderPath.slice(path.length + 1)}`,
      );
    }
  };

  const handleDelete = async (path: string) => {
    setMenu(null);
    if (!path) return;
    const count = images.filter(image => {
      const local = image.localPath;
      return local === path || (local?.startsWith(`${path}/`) ?? false);
    }).length;
    const message = t('image.library.confirmDeleteFolder')
      .replace('{name}', path.split('/').pop() || path)
      .replace('{count}', String(count));
    if (!confirm(message)) return;
    await deleteLocalFolder(path);
    if (
      selectedFolderPath === path ||
      selectedFolderPath.startsWith(`${path}/`)
    ) {
      const parent = path.includes('/')
        ? path.slice(0, path.lastIndexOf('/'))
        : '';
      setSelectedFolderPath(parent);
    }
  };

  const workspaceLocation = formatWorkspaceLocation(rootPath, displayName, t);

  return (
    <aside
      className={`workspace-explorer ${overlay ? 'workspace-explorer--overlay' : ''}`}
      style={overlay ? undefined : { width: explorerWidth }}
      aria-modal={overlay || undefined}
    >
      <div className="workspace-explorer-header">
        <div className="workspace-explorer-header-text">
          <h2 className="workspace-explorer-title">
            {displayName || t('workspace.unnamed')}
          </h2>
          <p className="workspace-explorer-subtitle">
            {t('workspace.explorer')}
          </p>
          {workspaceLocation ? (
            <p className="workspace-explorer-path" title={workspaceLocation}>
              <span className="workspace-explorer-path-label">
                {t('workspace.localPath')}
              </span>
              {workspaceLocation}
            </p>
          ) : null}
        </div>
        {overlay ? (
          <div className="workspace-explorer-header-actions">
            <button
              type="button"
              className="workspace-explorer-close"
              aria-label={t('workspace.closeExplorer')}
              onClick={() => setWorkspaceExplorerOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="workspace-explorer-tree" role="tree">
        <TreeRow
          node={tree}
          depth={0}
          selectedPath={selectedFolderPath}
          expandedPaths={expandedPaths}
          onToggle={toggleExpanded}
          onSelect={handleSelect}
          onContextMenu={handleFolderContextMenu}
          allLabel={t('workspace.allImages')}
        />
      </div>

      <div className="workspace-explorer-footer">
        <button
          type="button"
          className="workspace-explorer-manage-btn"
          onClick={() => openWorkspaceModal()}
        >
          {t('workspace.manageExplorer')}
        </button>
      </div>

      {!overlay ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t('workspace.resizeExplorer')}
          tabIndex={0}
          className="workspace-explorer-resize"
          onPointerDown={resizeHandlers.onPointerDown}
        />
      ) : null}

      {menu ? (
        <>
          <button
            type="button"
            className="workspace-tree-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setMenu(null)}
          />
          <div
            className="workspace-tree-menu"
            style={{ left: menu.x, top: menu.y }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleCreate(menu.path)}
            >
              <FolderPlus size={14} aria-hidden />
              {t('workspace.newSubfolder')}
            </button>
            {menu.path ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleRename(menu.path)}
              >
                <Pencil size={14} aria-hidden />
                {t('workspace.renameFolder')}
              </button>
            ) : null}
            {menu.path ? (
              <button
                type="button"
                role="menuitem"
                className="workspace-tree-menu-danger"
                onClick={() => void handleDelete(menu.path)}
              >
                <Trash2 size={14} aria-hidden />
                {t('workspace.deleteFolder')}
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </aside>
  );
};
