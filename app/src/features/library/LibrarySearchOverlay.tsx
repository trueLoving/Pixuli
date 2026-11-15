import { Search } from '@/ui';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { requestClearLibrarySearch } from './librarySearchEvents';
import type { LibrarySearchConfig } from './librarySearchTypes';
import './LibrarySearchOverlay.css';

export interface LibrarySearchOverlayProps {
  open: boolean;
  /** 再次打开时递增，用于重新聚焦并全选 */
  focusNonce?: number;
  search: LibrarySearchConfig;
  hasConfig: boolean;
  t: (key: string) => string;
  onClose: () => void;
}

export const LibrarySearchOverlay: React.FC<LibrarySearchOverlayProps> = ({
  open,
  focusNonce = 0,
  search,
  hasConfig,
  t,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      const input = panelRef.current?.querySelector('input');
      if (!(input instanceof HTMLInputElement)) return;
      input.focus();
      input.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, focusNonce]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      // 浮层内输入框聚焦时全局快捷键会被跳过，这里补上清除
      if (
        event.key.toLowerCase() === 'k' &&
        event.shiftKey &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        requestClearLibrarySearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="library-search-overlay" role="presentation">
      <button
        type="button"
        className="library-search-overlay-backdrop"
        aria-label={t('image.actions.dismissMenu')}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="library-search-overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('image.grid.searchImages')}
      >
        <Search
          variant="header"
          className="library-search-overlay-search search-wrapper--expanded"
          searchQuery={search.searchQuery}
          draftQuery={search.draftQuery}
          onDraftChange={search.onDraftChange}
          onCommitSearch={query => {
            search.onCommitSearch(query);
            onClose();
          }}
          onSearchChange={search.onSearchChange}
          hasConfig={hasConfig}
          showHistory
          history={search.history}
          onSelectHistory={query => {
            search.onSelectHistory?.(query);
            onClose();
          }}
          onDeleteHistory={search.onDeleteHistory}
          onClearHistory={search.onClearHistory}
          t={t}
        />
      </div>
    </div>,
    document.body,
  );
};
