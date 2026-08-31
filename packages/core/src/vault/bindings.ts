import type { StorageProviderConfig } from '../plugins/types';
import type { StoredSourceEntry } from '../plugins/types';
import type { WorkspaceBinding } from './types';
import { normalizeConfigRoot } from './syncPath';

/** 将 M3 sourceStore 条目映射为工作区 binding（REF-607 P4 · D3 configRoot） */
export function storedSourceToWorkspaceBinding(
  source: StoredSourceEntry,
): WorkspaceBinding {
  const configRoot = normalizeConfigRoot(
    typeof source.config.path === 'string' ? source.config.path : '',
  );
  return {
    id: source.id,
    label: source.label,
    pluginId: source.pluginId,
    configRoot,
    config: source.config,
  };
}

export function storedSourcesToWorkspaceBindings(
  sources: StoredSourceEntry[],
): WorkspaceBinding[] {
  return sources.map(storedSourceToWorkspaceBinding);
}
