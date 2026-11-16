import {
  matchesSyncIgnore,
  readSyncIgnorePatterns,
  writeSyncIgnorePatterns,
} from '@pixuli/core/vault';
import { getWorkspaceVault } from '@/features/workspace/workspaceRuntime';

export const SYNC_IGNORE_CHANGED_EVENT = 'pixuli:sync-ignore-changed';

export function notifySyncIgnoreChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SYNC_IGNORE_CHANGED_EVENT));
}

export function isPathSyncIgnored(
  relativePath: string | undefined,
  patterns: string[],
): boolean {
  if (!relativePath) return false;
  return matchesSyncIgnore(relativePath, patterns);
}

export async function loadSyncIgnorePatterns(): Promise<string[]> {
  const vault = getWorkspaceVault();
  return readSyncIgnorePatterns(vault.adapter);
}

export async function excludePathFromSync(
  relativePath: string,
): Promise<string[]> {
  const vault = getWorkspaceVault();
  const current = await readSyncIgnorePatterns(vault.adapter);
  const next = await writeSyncIgnorePatterns(vault.adapter, [
    ...current,
    relativePath,
  ]);
  notifySyncIgnoreChanged();
  return next;
}
