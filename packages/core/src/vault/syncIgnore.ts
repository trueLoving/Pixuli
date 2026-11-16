import type { WorkspaceAdapter } from './types';
import { WORKSPACE_PATHS } from './paths';
import { decodeJson, encodeJson } from './utils';

export const SYNC_IGNORE_SCHEMA_VERSION = 1;

export interface SyncIgnoreFile {
  schemaVersion: number;
  patterns: string[];
}

/** 规范化用户输入的忽略规则（去空、去重、统一斜杠） */
export function normalizeSyncIgnorePatterns(patterns: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of patterns) {
    const pattern = raw.replace(/\\/g, '/').trim();
    if (!pattern || pattern.startsWith('#') || seen.has(pattern)) {
      continue;
    }
    seen.add(pattern);
    result.push(pattern);
  }
  return result;
}

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

/**
 * gitignore 子集：`*` / `**` / 精确相对路径。
 * 路径相对于工作区根；不做 `!` 取反。
 */
export function patternToRegExp(pattern: string): RegExp {
  const normalized = pattern.replace(/\\/g, '/').replace(/^\/+/, '');
  let source = '';
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    if (char === '*' && normalized[i + 1] === '*') {
      if (normalized[i + 2] === '/') {
        source += '(?:.*/)?';
        i += 2;
      } else {
        source += '.*';
        i += 1;
      }
      continue;
    }
    if (char === '*') {
      source += '[^/]*';
      continue;
    }
    if (char === '?') {
      source += '[^/]';
      continue;
    }
    source += escapeRegexLiteral(char);
  }
  return new RegExp(`^${source}$`);
}

export function matchesSyncIgnore(
  relativePath: string,
  patterns: string[],
): boolean {
  if (patterns.length === 0) {
    return false;
  }
  const path = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const base = path.includes('/')
    ? path.slice(path.lastIndexOf('/') + 1)
    : path;
  for (const pattern of patterns) {
    const normalized = pattern.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized) continue;
    const regex = patternToRegExp(normalized);
    if (regex.test(path) || regex.test(base)) {
      return true;
    }
    // `dir/` 形式：匹配该目录前缀下的所有路径
    if (normalized.endsWith('/') && path.startsWith(normalized)) {
      return true;
    }
  }
  return false;
}

export function countSyncIgnoreMatches(
  paths: string[],
  patterns: string[],
): number {
  if (patterns.length === 0) {
    return 0;
  }
  return paths.reduce(
    (count, path) => count + (matchesSyncIgnore(path, patterns) ? 1 : 0),
    0,
  );
}

export async function readSyncIgnorePatterns(
  adapter: WorkspaceAdapter,
): Promise<string[]> {
  try {
    const raw = await adapter.readFile(WORKSPACE_PATHS.syncIgnore);
    const parsed = decodeJson<SyncIgnoreFile>(raw);
    if (!parsed || !Array.isArray(parsed.patterns)) {
      return [];
    }
    return normalizeSyncIgnorePatterns(parsed.patterns);
  } catch {
    return [];
  }
}

export async function writeSyncIgnorePatterns(
  adapter: WorkspaceAdapter,
  patterns: string[],
): Promise<string[]> {
  const normalized = normalizeSyncIgnorePatterns(patterns);
  const payload: SyncIgnoreFile = {
    schemaVersion: SYNC_IGNORE_SCHEMA_VERSION,
    patterns: normalized,
  };
  await adapter.writeFile(WORKSPACE_PATHS.syncIgnore, encodeJson(payload));
  return normalized;
}
