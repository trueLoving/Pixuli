import { WORKSPACE_PATHS } from './paths';
import type {
  SyncConflict,
  SyncPushOperation,
  WorkspaceAdapter,
} from './types';
import { decodeJson, encodeJson, nowIso } from './utils';

const SYNC_SCHEMA_VERSION = 1;

export interface BindingSyncStateRecord {
  cursor: string | null;
  lastSyncAt: string | null;
}

export interface SyncStateFile {
  schemaVersion: number;
  bindings: Record<string, BindingSyncStateRecord>;
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
  return {
    schemaVersion: SYNC_SCHEMA_VERSION,
    bindings: parsed.bindings ?? {},
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
  return (
    state.bindings[bindingId] ?? {
      cursor: null,
      lastSyncAt: null,
    }
  );
}

export async function updateBindingSyncState(
  adapter: WorkspaceAdapter,
  bindingId: string,
  patch: Partial<BindingSyncStateRecord>,
): Promise<void> {
  const state = await readSyncState(adapter);
  const current = state.bindings[bindingId] ?? {
    cursor: null,
    lastSyncAt: null,
  };
  state.bindings[bindingId] = { ...current, ...patch };
  await writeSyncState(adapter, state);
}

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
