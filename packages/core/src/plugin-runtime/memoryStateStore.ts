import type { PluginStateRecord, PluginStateStore } from './types';

/** 内存态；缺省未写入的 id 视为 enabled（由 Runtime 在 register 时补全） */
export class MemoryPluginStateStore implements PluginStateStore {
  private readonly records = new Map<string, PluginStateRecord>();

  get(id: string): PluginStateRecord | undefined {
    return this.records.get(id);
  }

  list(): PluginStateRecord[] {
    return [...this.records.values()];
  }

  set(record: PluginStateRecord): void {
    this.records.set(record.id, { ...record });
  }

  delete(id: string): void {
    this.records.delete(id);
  }
}
