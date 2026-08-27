import type { AssetKind, ImageItem } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';

export type SizeCompare = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export interface LibraryQuery {
  /** 裸词与 name: 合并后的文件名子串（全部需匹配，AND） */
  nameTerms: string[];
  /** kind: 条件；多项为 OR（任一匹配即可） */
  kinds: AssetKind[];
  /** size: 条件；多项为 AND */
  sizeRules: Array<{ op: SizeCompare; bytes: number }>;
}

const KIND_VALUES = new Set<AssetKind>(['image', 'video', 'pdf', 'other']);

const UNIT_BYTES: Record<string, number> = {
  b: 1,
  kb: 1024,
  k: 1024,
  mb: 1024 * 1024,
  m: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
  g: 1024 * 1024 * 1024,
};

/** 按空白分词，保留引号内短语 */
export function tokenizeLibraryQuery(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    const token = match[1] ?? match[2] ?? match[3] ?? '';
    if (token.length > 0) tokens.push(token);
  }
  return tokens;
}

export function parseSizeValue(raw: string): number | null {
  const m = raw
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:\.\d+)?)\s*(b|kb|k|mb|m|gb|g)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0) return null;
  const unit = m[2] || 'b';
  return Math.round(n * (UNIT_BYTES[unit] ?? 1));
}

function parseSizeToken(
  value: string,
): { op: SizeCompare; bytes: number } | null {
  const trimmed = value.trim();
  const m = trimmed.match(/^(>=|<=|>|<|=)?\s*(.+)$/);
  if (!m) return null;
  const opToken = m[1] || '=';
  const bytes = parseSizeValue(m[2]);
  if (bytes === null) return null;
  const op: SizeCompare =
    opToken === '>'
      ? 'gt'
      : opToken === '>='
        ? 'gte'
        : opToken === '<'
          ? 'lt'
          : opToken === '<='
            ? 'lte'
            : 'eq';
  return { op, bytes };
}

function parseKindValue(value: string): AssetKind | null {
  const v = value.trim().toLowerCase();
  if (KIND_VALUES.has(v as AssetKind)) return v as AssetKind;
  // 中文别名
  if (v === '图片' || v === '图像') return 'image';
  if (v === '视频') return 'video';
  if (v === 'pdf') return 'pdf';
  if (v === '其它' || v === '其他') return 'other';
  return null;
}

/**
 * 解析资源库查询语法（Anki 风格子集）。
 * - 裸词 / name:xxx → 文件名包含
 * - kind:image|video|pdf|other → 类型
 * - size:>1mb / size:<=500kb → 大小
 * 多个条件默认 AND；多个 kind 为 OR。
 */
export function parseLibraryQuery(input: string): LibraryQuery {
  const query: LibraryQuery = {
    nameTerms: [],
    kinds: [],
    sizeRules: [],
  };

  for (const token of tokenizeLibraryQuery(input)) {
    const colon = token.indexOf(':');
    if (colon <= 0) {
      query.nameTerms.push(token);
      continue;
    }

    const key = token.slice(0, colon).toLowerCase();
    const value = token.slice(colon + 1);
    if (!value) continue;

    if (key === 'name' || key === 'filename') {
      query.nameTerms.push(value);
      continue;
    }

    if (key === 'kind' || key === 'type') {
      const kind = parseKindValue(value);
      if (kind && !query.kinds.includes(kind)) {
        query.kinds.push(kind);
      }
      continue;
    }

    if (key === 'size') {
      const rule = parseSizeToken(value);
      if (rule) query.sizeRules.push(rule);
      continue;
    }

    // 未知 key:value 当作文件名子串，避免静默丢弃用户输入
    query.nameTerms.push(token);
  }

  return query;
}

function matchSize(
  size: number,
  rule: { op: SizeCompare; bytes: number },
): boolean {
  switch (rule.op) {
    case 'gt':
      return size > rule.bytes;
    case 'gte':
      return size >= rule.bytes;
    case 'lt':
      return size < rule.bytes;
    case 'lte':
      return size <= rule.bytes;
    case 'eq':
    default:
      return size === rule.bytes;
  }
}

export function matchesLibraryQuery(
  item: Pick<ImageItem, 'name' | 'type' | 'size'>,
  query: LibraryQuery,
): boolean {
  for (const term of query.nameTerms) {
    if (!item.name.toLowerCase().includes(term.toLowerCase())) {
      return false;
    }
  }

  if (query.kinds.length > 0) {
    const kind = getAssetKind(item);
    if (!query.kinds.includes(kind)) return false;
  }

  for (const rule of query.sizeRules) {
    if (!matchSize(item.size ?? 0, rule)) return false;
  }

  return true;
}

export function filterByLibraryQuery<
  T extends Pick<ImageItem, 'name' | 'type' | 'size'>,
>(items: T[], input: string): T[] {
  const trimmed = input.trim();
  if (!trimmed) return items;
  const query = parseLibraryQuery(trimmed);
  if (
    query.nameTerms.length === 0 &&
    query.kinds.length === 0 &&
    query.sizeRules.length === 0
  ) {
    return items;
  }
  return items.filter(item => matchesLibraryQuery(item, query));
}
