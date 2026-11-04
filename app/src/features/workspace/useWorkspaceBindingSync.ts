import { useEffect, useRef } from 'react';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';

/**
 * 本地工作区激活时，将 sourceStore 变更同步至 vault bindings（REF-607 P4）。
 * 工作区刚变为 local 时也要同步一次，避免「先配远端、后建空工作区」时 vault
 * bindings 仍为空导致 pull 找不到 binding。
 */
export function useWorkspaceBindingSync() {
  const sources = useSourceStore(state => state.sources);
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const syncBindingsFromSources = useWorkspaceStore(
    state => state.syncBindingsFromSources,
  );
  const serialized = JSON.stringify(sources);
  const prevSerializedRef = useRef<string | null>(null);
  const wasLocalRef = useRef(false);

  useEffect(() => {
    if (!isWorkspaceAvailable() || !localActive) {
      wasLocalRef.current = false;
      prevSerializedRef.current = serialized;
      return;
    }

    const becameLocal = !wasLocalRef.current;
    wasLocalRef.current = true;
    const sourcesChanged = prevSerializedRef.current !== serialized;
    prevSerializedRef.current = serialized;

    if (becameLocal || sourcesChanged) {
      void syncBindingsFromSources();
    }
  }, [serialized, localActive, syncBindingsFromSources]);
}
