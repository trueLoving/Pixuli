import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  buildWorkspaceFolderTree,
  folderNodeLabel,
  type WorkspaceFolderNode,
} from '@/utils/workspaceFolderTree';
import './WorkspaceFolderTree.css';

interface TreeRowProps {
  node: WorkspaceFolderNode;
  depth: number;
  selectedPath: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  allLabel: string;
}

const TreeRow: React.FC<TreeRowProps> = ({
  node,
  depth,
  selectedPath,
  expandedPaths,
  onToggle,
  onSelect,
  allLabel,
}) => {
  const hasChildren = node.children.length > 0;
  const expandKey = node.path || '__root__';
  const isExpanded = expandedPaths.has(expandKey);
  const isSelected = selectedPath === node.path;
  const label = folderNodeLabel(node, allLabel);

  return (
    <>
      <button
        type="button"
        className={`workspace-tree-row ${isSelected ? 'workspace-tree-row--active' : ''}`}
        style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
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
              allLabel={allLabel}
            />
          ))
        : null}
    </>
  );
};

export const WorkspaceFolderTree: React.FC = () => {
  const { t } = useI18n();
  const images = useImageStore(state => state.images);
  const displayName = useWorkspaceStore(state => state.displayName);
  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const setSelectedFolderPath = useUIStore(
    state => state.setSelectedFolderPath,
  );
  const openWorkspaceModal = useUIStore(state => state.openWorkspaceModal);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(['__root__', 'images']),
  );

  const tree = useMemo(() => {
    const paths = images
      .map(image => image.localPath)
      .filter((path): path is string => Boolean(path));
    return buildWorkspaceFolderTree(paths);
  }, [images]);

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

  return (
    <aside className="workspace-explorer">
      <div className="workspace-explorer-header">
        <h2 className="workspace-explorer-title">
          {displayName || t('workspace.unnamed')}
        </h2>
        <p className="workspace-explorer-subtitle">{t('workspace.explorer')}</p>
      </div>

      <div className="workspace-explorer-tree" role="tree">
        <TreeRow
          node={tree}
          depth={0}
          selectedPath={selectedFolderPath}
          expandedPaths={expandedPaths}
          onToggle={toggleExpanded}
          onSelect={setSelectedFolderPath}
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
    </aside>
  );
};
