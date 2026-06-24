import { useEffect, useRef } from 'react';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { useSourceStore } from '@/stores/sourceStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

/**
 * 本地工作区激活时，将 sourceStore 变更同步至 vault bindings（REF-607 P4）。
 */
export function useWorkspaceBindingSync() {
  const sources = useSourceStore(state => state.sources);
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const syncBindingsFromSources = useWorkspaceStore(
    state => state.syncBindingsFromSources,
  );
  const serialized = JSON.stringify(sources);
  const prevSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isWorkspaceAvailable() || !localActive) {
      prevSerializedRef.current = serialized;
      return;
    }

    if (prevSerializedRef.current === null) {
      prevSerializedRef.current = serialized;
      return;
    }

    if (prevSerializedRef.current === serialized) {
      return;
    }

    prevSerializedRef.current = serialized;
    void syncBindingsFromSources();
  }, [serialized, localActive, syncBindingsFromSources]);
}
