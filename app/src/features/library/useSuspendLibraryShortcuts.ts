import { useEffect } from 'react';
import {
  resumeLibraryShortcuts,
  suspendLibraryShortcuts,
} from './libraryShortcutGate';

/** 阻塞层打开时暂停库级 ↑↓ / E / S 等快捷键 */
export function useSuspendLibraryShortcuts(blocked: boolean): void {
  useEffect(() => {
    if (!blocked) return;
    suspendLibraryShortcuts();
    return () => resumeLibraryShortcuts();
  }, [blocked]);
}
