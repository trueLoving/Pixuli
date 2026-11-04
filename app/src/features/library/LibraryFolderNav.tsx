import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { useUIStore } from '@/stores/uiStore';
import { ChevronLeft, Folder } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  libraryBreadcrumbSegments,
  parentLibraryFolderPath,
  type LibraryChildFolder,
} from './libraryNavigation';

interface LibraryFolderNavProps {
  currentPath: string;
  folders: LibraryChildFolder[];
  showFolders: boolean;
  solo: boolean;
  isMobile: boolean;
  canMutate: boolean;
  t: (key: string) => string;
  onOpenFolder: (path: string) => void;
  onHighlightFolder: (path: string | null) => void;
  highlightedPath: string | null;
}

export const LibraryFolderNav: React.FC<LibraryFolderNavProps> = ({
  currentPath,
  folders,
  showFolders,
  solo,
  isMobile,
  canMutate,
  t,
  onOpenFolder,
  onHighlightFolder,
  highlightedPath,
}) => {
  const indexPaths = useWorkspaceStore(state => state.indexPaths);
  const createLocalFolder = useWorkspaceStore(state => state.createLocalFolder);
  const renameLocalFolder = useWorkspaceStore(state => state.renameLocalFolder);
  const deleteLocalFolder = useWorkspaceStore(state => state.deleteLocalFolder);
  const setSelectedFolderPath = useUIStore(
    state => state.setSelectedFolderPath,
  );
  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const [pathOpen, setPathOpen] = useState(false);
  const [folderMenu, setFolderMenu] = useState<{
    path: string;
    sheet: boolean;
    x: number;
    y: number;
  } | null>(null);
  const longPressRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const longPressOriginRef = useRef<{ x: number; y: number } | null>(null);

  const rootLabel = t('image.library.rootFolder');
  const segments = libraryBreadcrumbSegments(currentPath, rootLabel);
  const current = segments[segments.length - 1] ?? segments[0];
  const parentPath = parentLibraryFolderPath(currentPath);

  const closeSheets = () => {
    setPathOpen(false);
    setFolderMenu(null);
  };

  useEffect(() => {
    const onClose = () => closeSheets();
    window.addEventListener('pixuli:closeLibrarySheets', onClose);
    return () =>
      window.removeEventListener('pixuli:closeLibrarySheets', onClose);
  }, []);

  useEffect(() => {
    if (!pathOpen && !folderMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSheets();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pathOpen, folderMenu]);

  const clearLongPress = () => {
    if (longPressRef.current != null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    longPressOriginRef.current = null;
  };

  const openFolderActions = (path: string, sheet: boolean, x = 0, y = 0) => {
    if (!canMutate || !path) return;
    setFolderMenu({ path, sheet, x, y });
  };

  const handleCreate = async (parent: string) => {
    setFolderMenu(null);
    const name = window.prompt(t('workspace.newFolderPrompt'));
    if (!name?.trim()) return;
    const safe = name.trim().replace(/[/\\]/g, '_');
    const target = parent ? `${parent}/${safe}` : safe;
    await createLocalFolder(target);
    setSelectedFolderPath(target);
  };

  const handleRename = async (path: string) => {
    setFolderMenu(null);
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
    setFolderMenu(null);
    const count = indexPaths.filter(
      local => local === path || local.startsWith(`${path}/`),
    ).length;
    const message = t('image.library.confirmDeleteFolder')
      .replace('{name}', path.split('/').pop() || path)
      .replace('{count}', String(count));
    if (!confirm(message)) return;
    await deleteLocalFolder(path);
    if (
      selectedFolderPath === path ||
      selectedFolderPath.startsWith(`${path}/`)
    ) {
      setSelectedFolderPath(parentLibraryFolderPath(path));
    }
  };

  return (
    <>
      <nav
        className="library-breadcrumb"
        aria-label={t('image.library.pathSheetTitle')}
      >
        {isMobile ? (
          <>
            <button
              type="button"
              className="library-back-btn"
              aria-label={t('image.library.backToParent')}
              disabled={!currentPath}
              onClick={() => onOpenFolder(parentPath)}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="library-crumb library-crumb--current"
              onClick={() => setPathOpen(true)}
            >
              {current?.name}
            </button>
          </>
        ) : (
          segments.map((segment, index) => {
            const isCurrent = index === segments.length - 1;
            return (
              <React.Fragment key={segment.path || 'root'}>
                {index > 0 ? (
                  <span className="library-crumb-sep" aria-hidden>
                    /
                  </span>
                ) : null}
                <button
                  type="button"
                  className={`library-crumb${isCurrent ? ' library-crumb--current' : ''}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => {
                    if (!isCurrent) onOpenFolder(segment.path);
                  }}
                >
                  {segment.name}
                </button>
              </React.Fragment>
            );
          })
        )}
      </nav>

      {showFolders ? (
        <div
          className={`library-folder-list${solo ? ' library-folder-list--solo' : ''}`}
        >
          {folders.map(folder => (
            <button
              key={folder.path}
              type="button"
              className={`library-folder-row${highlightedPath === folder.path ? ' library-folder-row--active' : ''}`}
              onClick={() => {
                if (longPressFiredRef.current) {
                  longPressFiredRef.current = false;
                  return;
                }
                if (isMobile) onOpenFolder(folder.path);
                else onHighlightFolder(folder.path);
              }}
              onDoubleClick={() => {
                if (!isMobile) onOpenFolder(folder.path);
              }}
              onKeyDown={event => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                onOpenFolder(folder.path);
              }}
              onContextMenu={event => {
                event.preventDefault();
                onHighlightFolder(folder.path);
                openFolderActions(
                  folder.path,
                  false,
                  event.clientX,
                  event.clientY,
                );
              }}
              onPointerDown={event => {
                if (event.pointerType !== 'touch') return;
                longPressFiredRef.current = false;
                clearLongPress();
                longPressOriginRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                };
                longPressRef.current = window.setTimeout(() => {
                  longPressFiredRef.current = true;
                  openFolderActions(folder.path, true);
                }, 480);
              }}
              onPointerUp={clearLongPress}
              onPointerCancel={clearLongPress}
              onPointerMove={event => {
                const origin = longPressOriginRef.current;
                if (!origin) return;
                const dx = event.clientX - origin.x;
                const dy = event.clientY - origin.y;
                if (dx * dx + dy * dy > 100) clearLongPress();
              }}
            >
              <Folder size={18} aria-hidden />
              <span className="library-folder-row-name">{folder.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      {pathOpen ? (
        <>
          <button
            type="button"
            className="library-sheet-backdrop"
            aria-label={t('image.actions.dismissMenu')}
            onClick={() => setPathOpen(false)}
          />
          <div
            className="library-path-sheet"
            role="dialog"
            aria-label={t('image.library.pathSheetTitle')}
          >
            {segments.map(segment => (
              <button
                key={segment.path || 'root'}
                type="button"
                className="library-sheet-action"
                aria-current={
                  segment.path === (current?.path ?? '') ? 'page' : undefined
                }
                onClick={() => {
                  setPathOpen(false);
                  onOpenFolder(segment.path);
                }}
              >
                {segment.name}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {folderMenu ? (
        <>
          <button
            type="button"
            className="library-sheet-backdrop"
            aria-label={t('image.actions.dismissMenu')}
            onClick={() => setFolderMenu(null)}
          />
          <div
            className={
              folderMenu.sheet
                ? 'library-folder-sheet'
                : 'asset-library-menu library-folder-menu'
            }
            style={
              folderMenu.sheet
                ? undefined
                : {
                    left: Math.min(folderMenu.x, window.innerWidth - 176),
                    top: Math.min(folderMenu.y, window.innerHeight - 160),
                  }
            }
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className="library-sheet-action"
              onClick={() => void handleRename(folderMenu.path)}
            >
              {t('workspace.renameFolder')}
            </button>
            <button
              type="button"
              role="menuitem"
              className="library-sheet-action"
              onClick={() => void handleCreate(folderMenu.path)}
            >
              {t('image.library.newSubfolder')}
            </button>
            <button
              type="button"
              role="menuitem"
              className="library-sheet-action asset-library-menu-danger"
              onClick={() => void handleDelete(folderMenu.path)}
            >
              {t('workspace.deleteFolder')}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
};
