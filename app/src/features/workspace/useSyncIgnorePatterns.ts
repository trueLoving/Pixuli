import { useCallback, useEffect, useState } from 'react';
import {
  isPathSyncIgnored,
  loadSyncIgnorePatterns,
  SYNC_IGNORE_CHANGED_EVENT,
} from '@/features/workspace/syncIgnoreUi';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';

export function useSyncIgnorePatterns() {
  const isLocalActive = useWorkspaceStore(state => state.isLocalActive);
  const localActive = isLocalActive();
  const [patterns, setPatterns] = useState<string[]>([]);

  const reload = useCallback(async () => {
    if (!localActive) {
      setPatterns([]);
      return;
    }
    try {
      setPatterns(await loadSyncIgnorePatterns());
    } catch {
      setPatterns([]);
    }
  }, [localActive]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onChange = () => {
      void reload();
    };
    window.addEventListener(SYNC_IGNORE_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(SYNC_IGNORE_CHANGED_EVENT, onChange);
    };
  }, [reload]);

  return {
    patterns,
    localActive,
    reload,
    isIgnored: (relativePath: string | undefined) =>
      isPathSyncIgnored(relativePath, patterns),
  };
}
