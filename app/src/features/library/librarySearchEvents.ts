/** 打开资源库居中搜索浮层（Cmd/Ctrl+K、工具栏图标） */
export const OPEN_LIBRARY_SEARCH_EVENT = 'pixuli:openLibrarySearch';

/** 清除已生效的资源库查询（Cmd/Ctrl+Shift+K） */
export const CLEAR_LIBRARY_SEARCH_EVENT = 'pixuli:clearLibrarySearch';

export function requestOpenLibrarySearch(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_LIBRARY_SEARCH_EVENT));
}

export function requestClearLibrarySearch(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CLEAR_LIBRARY_SEARCH_EVENT));
}
