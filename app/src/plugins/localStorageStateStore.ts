import type {
  PluginStateRecord,
  PluginStateStore,
} from '@pixuli/core/plugin-runtime';

export const PLUGIN_RUNTIME_STATE_KEY = 'pixuli.plugin-runtime.v1';

function readAll(key: string): Map<string, PluginStateRecord> {
  const map = new Map<string, PluginStateRecord>();
  if (typeof localStorage === 'undefined') return map;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return map;
    const parsed = JSON.parse(raw) as PluginStateRecord[];
    if (!Array.isArray(parsed)) return map;
    for (const row of parsed) {
      if (
        row &&
        typeof row.id === 'string' &&
        typeof row.enabled === 'boolean' &&
        (row.origin === 'builtin' || row.origin === 'external') &&
        typeof row.version === 'string'
      ) {
        map.set(row.id, row);
      }
    }
  } catch {
    /* ignore corrupt */
  }
  return map;
}

function writeAll(key: string, map: Map<string, PluginStateRecord>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify([...map.values()]));
  } catch {
    /* quota / private mode */
  }
}

/** 浏览器 / Electron renderer 持久化；无 localStorage 时退化为内存 */
export class LocalStoragePluginStateStore implements PluginStateStore {
  private readonly key: string;
  private readonly records: Map<string, PluginStateRecord>;

  constructor(key = PLUGIN_RUNTIME_STATE_KEY) {
    this.key = key;
    this.records = readAll(key);
  }

  get(id: string): PluginStateRecord | undefined {
    return this.records.get(id);
  }

  list(): PluginStateRecord[] {
    return [...this.records.values()];
  }

  set(record: PluginStateRecord): void {
    this.records.set(record.id, { ...record });
    writeAll(this.key, this.records);
  }

  delete(id: string): void {
    if (!this.records.delete(id)) return;
    writeAll(this.key, this.records);
  }
}
