import type { KindIngestSource, KindPluginManifest } from './types';

/** 合并已注册 Kind 的 ingest.accept；无任何 ingest 时返回 `undefined`（禁止选文件） */
export function mergeKindIngestAccept(
  manifests: readonly KindPluginManifest[],
): Record<string, string[]> | undefined {
  const merged: Record<string, string[]> = {};
  let hasAny = false;

  for (const manifest of manifests) {
    const accept = manifest.ingest?.accept;
    if (!accept) continue;
    hasAny = true;
    for (const [mime, extensions] of Object.entries(accept)) {
      const bucket = new Set(merged[mime] ?? []);
      for (const ext of extensions) {
        bucket.add(ext);
      }
      merged[mime] = [...bucket];
    }
  }

  return hasAny ? merged : undefined;
}

/** 已注册 Kind 声明的采集入口并集（至少含 file，若存在任一 ingest） */
export function collectPreferredIngestSources(
  manifests: readonly KindPluginManifest[],
): KindIngestSource[] {
  const sources = new Set<KindIngestSource>();
  let hasIngest = false;

  for (const manifest of manifests) {
    if (!manifest.ingest) continue;
    hasIngest = true;
    const preferred = manifest.ingest.preferredSources ?? ['file'];
    for (const source of preferred) {
      sources.add(source);
    }
  }

  if (hasIngest) {
    sources.add('file');
  }

  return [...sources];
}

/** 将 merge 后的 accept 转为 `<input accept>` 字符串 */
export function ingestAcceptToInputAttr(
  accept: Record<string, string[]> | undefined,
): string {
  if (!accept) return '';
  const parts: string[] = [];
  for (const [mime, extensions] of Object.entries(accept)) {
    parts.push(mime);
    parts.push(...extensions);
  }
  return parts.join(',');
}

/**
 * 从 accept 推导可读扩展名列表（如 `JPG · PNG · PDF`），供上传文案展示。
 * 去点、大写、去重、排序。
 */
export function formatIngestAcceptTypeLabels(
  accept: Record<string, string[]> | undefined,
): string[] {
  if (!accept) return [];
  const labels = new Set<string>();
  for (const extensions of Object.values(accept)) {
    for (const ext of extensions) {
      const normalized = ext.replace(/^\./, '').trim().toUpperCase();
      if (normalized) labels.add(normalized);
    }
  }
  return [...labels].sort((a, b) => a.localeCompare(b));
}

/** `JPG · PNG · PDF`；无类型时返回空串 */
export function formatIngestAcceptTypesLabel(
  accept: Record<string, string[]> | undefined,
  separator = ' · ',
): string {
  return formatIngestAcceptTypeLabels(accept).join(separator);
}
