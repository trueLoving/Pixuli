import type { StorageProviderConfig } from '../plugins/types';
import type { StoredSourceEntry } from '../plugins/types';
import type { WorkspaceBinding } from './types';

function normalizePathPrefix(config: StorageProviderConfig): string {
  const raw = config.path;
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.replace(/^\/+/, '').replace(/\/+$/, '') || 'images';
  }
  return 'images';
}

/** 将 M3 sourceStore 条目映射为工作区 binding（REF-607 P4） */
export function storedSourceToWorkspaceBinding(
  source: StoredSourceEntry,
): WorkspaceBinding {
  const prefix = normalizePathPrefix(source.config);
  return {
    id: source.id,
    label: source.label,
    pluginId: source.pluginId,
    remotePathPrefix: prefix,
    localPathPrefix: prefix,
    config: source.config,
  };
}

export function storedSourcesToWorkspaceBindings(
  sources: StoredSourceEntry[],
): WorkspaceBinding[] {
  return sources.map(storedSourceToWorkspaceBinding);
}
