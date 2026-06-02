import type { StorageProviderConfig } from '../plugins/types';
import type { StoredSourceEntry } from '../plugins/types';
import { pickRepoConfig } from './importExportHelpers';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function inferPluginId(raw: Record<string, unknown>): string | null {
  if (typeof raw.pluginId === 'string' && raw.pluginId.length > 0) {
    return raw.pluginId;
  }
  if (raw.type === 'github' || raw.type === 'gitee') {
    return raw.type;
  }
  return null;
}

function inferLabel(
  raw: Record<string, unknown>,
  config: StorageProviderConfig,
): string {
  if (typeof raw.label === 'string' && raw.label.length > 0) {
    return raw.label;
  }
  if (typeof raw.name === 'string' && raw.name.length > 0) {
    return raw.name;
  }
  const owner = config.owner;
  const repo = config.repo;
  if (typeof owner === 'string' && typeof repo === 'string') {
    return `${owner}/${repo}`;
  }
  return '未命名源';
}

/**
 * 将磁盘上的单条源（新格式或旧扁平格式）规范为 StoredSourceEntry。
 */
export function normalizeStoredSourceEntry(
  raw: unknown,
): StoredSourceEntry | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id.length === 0) {
    return null;
  }

  const pluginId = inferPluginId(raw);
  if (!pluginId) {
    return null;
  }

  let config: StorageProviderConfig | null = null;
  if (isRecord(raw.config)) {
    config = pickRepoConfig(raw.config);
  }
  if (!config) {
    config = pickRepoConfig(raw);
  }
  if (!config) {
    return null;
  }

  const createdAt =
    typeof raw.createdAt === 'number' ? raw.createdAt : Date.now();
  const updatedAt =
    typeof raw.updatedAt === 'number' ? raw.updatedAt : createdAt;

  return {
    id: raw.id,
    label: inferLabel(raw, config),
    pluginId,
    config,
    createdAt,
    updatedAt,
  };
}

export function normalizeStoredSources(data: unknown): StoredSourceEntry[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const result: StoredSourceEntry[] = [];
  for (const item of data) {
    const entry = normalizeStoredSourceEntry(item);
    if (entry) {
      result.push(entry);
    }
  }
  return result;
}

export type CreateStoredSourceInput = {
  pluginId: string;
  label: string;
  config: StorageProviderConfig;
};

export function createStoredSourceEntry(
  input: CreateStoredSourceInput,
  id?: string,
): StoredSourceEntry {
  const now = Date.now();
  return {
    id: id ?? Math.random().toString(36).slice(2, 10),
    label: input.label,
    pluginId: input.pluginId,
    config: { ...input.config },
    createdAt: now,
    updatedAt: now,
  };
}

export function mergeStoredSourceUpdate(
  entry: StoredSourceEntry,
  patch: Partial<{
    label: string;
    pluginId: string;
    config: StorageProviderConfig | Partial<StorageProviderConfig>;
  }>,
): StoredSourceEntry {
  const next: StoredSourceEntry = {
    ...entry,
    updatedAt: Date.now(),
  };
  if (patch.label !== undefined) {
    next.label = patch.label;
  }
  if (patch.pluginId !== undefined) {
    next.pluginId = patch.pluginId;
  }
  if (patch.config !== undefined) {
    next.config = { ...entry.config, ...patch.config };
  }
  return next;
}

/** 从持久化条目读取仓库连接字段（供 imageStore / UI 使用） */
export function getRepoConfigFromSource(entry: StoredSourceEntry): {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
} {
  const c = entry.config;
  const defaultBranch = entry.pluginId === 'gitee' ? 'master' : 'main';
  return {
    owner: String(c.owner ?? ''),
    repo: String(c.repo ?? ''),
    branch: String(c.branch ?? defaultBranch),
    token: String(c.token ?? ''),
    path: String(c.path ?? 'images'),
  };
}

export function pluginIdToLegacyType(pluginId: string): 'github' | 'gitee' {
  return pluginId === 'gitee' ? 'gitee' : 'github';
}
