import { WORKSPACE_PATHS } from './paths';
import type {
  SyncConflict,
  SyncPushOperation,
  WorkspaceAdapter,
} from './types';
import { decodeJson, encodeJson, nowIso } from './utils';

const SYNC_SCHEMA_VERSION = 2;

export interface LocalFolderSyncStamp {
  revision: string | null;
  /** 协商后待进夹再拉 */
  dirty?: boolean;
}

export interface BindingSyncStateRecord {
  cursor: string | null;
  lastSyncAt: string | null;
  /** 上次成功协商的远端 sync-tree revision */
  treeRevision: string | null;
  folders: Record<string, LocalFolderSyncStamp>;
}

export interface SyncStateFile {
  schemaVersion: number;
  bindings: Record<string, BindingSyncStateRecord>;
}

function emptyBindingState(): BindingSyncStateRecord {
  return {
    cursor: null,
    lastSyncAt: null,
    treeRevision: null,
    folders: {},
  };
}

function normalizeBindingState(
  raw: Partial<BindingSyncStateRecord> | undefined,
): BindingSyncStateRecord {
  return {
    cursor: raw?.cursor ?? null,
    lastSyncAt: raw?.lastSyncAt ?? null,
    treeRevision: raw?.treeRevision ?? null,
    folders: raw?.folders ?? {},
  };
}

export interface SyncConflictsFile {
  schemaVersion: number;
  conflicts: SyncConflict[];
}

export type QueuedPushOperation = SyncPushOperation & {
  bindingId?: string;
  enqueuedAt: string;
};

export async function readSyncState(
  adapter: WorkspaceAdapter,
): Promise<SyncStateFile> {
  if (!(await adapter.exists(WORKSPACE_PATHS.syncState))) {
    return { schemaVersion: SYNC_SCHEMA_VERSION, bindings: {} };
  }
  const raw = await adapter.readFile(WORKSPACE_PATHS.syncState);
  const parsed = decodeJson<SyncStateFile>(raw);
  const bindings: Record<string, BindingSyncStateRecord> = {};
  for (const [id, record] of Object.entries(parsed.bindings ?? {})) {
    bindings[id] = normalizeBindingState(record);
  }
  return {
    schemaVersion: SYNC_SCHEMA_VERSION,
    bindings,
  };
}

export async function writeSyncState(
  adapter: WorkspaceAdapter,
  state: SyncStateFile,
): Promise<void> {
  await adapter.writeFile(
    WORKSPACE_PATHS.syncState,
    encodeJson({ ...state, schemaVersion: SYNC_SCHEMA_VERSION }),
  );
}

export async function getBindingSyncState(
  adapter: WorkspaceAdapter,
  bindingId: string,
): Promise<BindingSyncStateRecord> {
  const state = await readSyncState(adapter);
  return normalizeBindingState(state.bindings[bindingId]);
}

export async function updateBindingSyncState(
  adapter: WorkspaceAdapter,
  bindingId: string,
  patch: Partial<BindingSyncStateRecord>,
): Promise<void> {
  const state = await readSyncState(adapter);
  const current = normalizeBindingState(state.bindings[bindingId]);
  state.bindings[bindingId] = {
    ...current,
    ...patch,
    folders: patch.folders ?? current.folders,
  };
  await writeSyncState(adapter, state);
}

export async function markFoldersDirty(
  adapter: WorkspaceAdapter,
  bindingId: string,
  folderKeys: string[],
  treeRevision?: string | null,
): Promise<void> {
  const state = await readSyncState(adapter);
  const current = normalizeBindingState(state.bindings[bindingId]);
  const folders = { ...current.folders };
  for (const key of folderKeys) {
    const prev = folders[key] ?? { revision: null };
    folders[key] = { ...prev, dirty: true };
  }
  state.bindings[bindingId] = {
    ...current,
    treeRevision:
      treeRevision === undefined ? current.treeRevision : treeRevision,
    folders,
  };
  await writeSyncState(adapter, state);
}

export async function clearFolderDirty(
  adapter: WorkspaceAdapter,
  bindingId: string,
  folderKey: string,
  revision: string,
): Promise<void> {
  const state = await readSyncState(adapter);
  const current = normalizeBindingState(state.bindings[bindingId]);
  state.bindings[bindingId] = {
    ...current,
    folders: {
      ...current.folders,
      [folderKey]: { revision, dirty: false },
    },
  };
  await writeSyncState(adapter, state);
}

export { emptyBindingState };

export async function readPushQueue(
  adapter: WorkspaceAdapter,
): Promise<QueuedPushOperation[]> {
  if (!(await adapter.exists(WORKSPACE_PATHS.syncQueue))) {
    return [];
  }
  const raw = await adapter.readFile(WORKSPACE_PATHS.syncQueue);
  const text = new TextDecoder().decode(raw);
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as QueuedPushOperation);
}

export async function appendPushQueue(
  adapter: WorkspaceAdapter,
  op: SyncPushOperation,
  bindingId?: string,
): Promise<void> {
  const existing = await readPushQueue(adapter);
  const entry: QueuedPushOperation = {
    ...op,
    bindingId,
    enqueuedAt: nowIso(),
  };
  existing.push(entry);
  await writePushQueue(adapter, existing);
}

export async function writePushQueue(
  adapter: WorkspaceAdapter,
  queue: QueuedPushOperation[],
): Promise<void> {
  const lines = queue.map(entry => JSON.stringify(entry)).join('\n');
  const payload = lines.length > 0 ? `${lines}\n` : '';
  await adapter.writeFile(
    WORKSPACE_PATHS.syncQueue,
    new TextEncoder().encode(payload),
  );
}

export async function readConflicts(
  adapter: WorkspaceAdapter,
): Promise<SyncConflict[]> {
  if (!(await adapter.exists(WORKSPACE_PATHS.syncConflicts))) {
    return [];
  }
  const raw = await adapter.readFile(WORKSPACE_PATHS.syncConflicts);
  const parsed = decodeJson<SyncConflictsFile>(raw);
  return parsed.conflicts ?? [];
}

export async function appendConflict(
  adapter: WorkspaceAdapter,
  conflict: SyncConflict,
): Promise<void> {
  const conflicts = await readConflicts(adapter);
  conflicts.push(conflict);
  await adapter.writeFile(
    WORKSPACE_PATHS.syncConflicts,
    encodeJson({ schemaVersion: SYNC_SCHEMA_VERSION, conflicts }),
  );
}
