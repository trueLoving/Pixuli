/**
 * 库级快捷键门闩：预览 / 编辑等阻塞层打开时暂停 ↑↓、E、S、Enter 等，
 * 避免与模态内快捷键叠层（Esc / ←→ 由模态自己处理）。
 */

export const LIBRARY_SHORTCUTS_GATE_EVENT = 'pixuli:library-shortcuts-gate';

let suspendCount = 0;

export function areLibraryShortcutsActive(): boolean {
  return suspendCount <= 0;
}

export function suspendLibraryShortcuts(): void {
  suspendCount += 1;
  notify();
}

export function resumeLibraryShortcuts(): void {
  suspendCount = Math.max(0, suspendCount - 1);
  notify();
}

function notify(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(LIBRARY_SHORTCUTS_GATE_EVENT, {
      detail: { active: areLibraryShortcutsActive() },
    }),
  );
}
