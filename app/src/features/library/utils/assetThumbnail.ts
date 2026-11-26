import type { AssetItem } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';

const CACHE_LIMIT = 120;
const MAX_CONCURRENT = 3;

type CacheKey = string;

const resultCache = new Map<CacheKey, string | null>();
const inflight = new Map<CacheKey, Promise<string | null>>();
let activeJobs = 0;
const waitQueue: Array<() => void> = [];

function cacheKey(
  item: Pick<AssetItem, 'id' | 'url' | 'name' | 'type'>,
): CacheKey {
  return `${getAssetKind(item)}:${item.url || item.id}`;
}

function remember(key: CacheKey, value: string | null): string | null {
  if (resultCache.has(key)) resultCache.delete(key);
  resultCache.set(key, value);
  while (resultCache.size > CACHE_LIMIT) {
    const oldest = resultCache.keys().next().value;
    if (oldest === undefined) break;
    resultCache.delete(oldest);
  }
  return value;
}

async function withConcurrency<T>(task: () => Promise<T>): Promise<T> {
  if (activeJobs >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => {
      waitQueue.push(resolve);
    });
  }
  activeJobs += 1;
  try {
    return await task();
  } finally {
    activeJobs -= 1;
    const next = waitQueue.shift();
    next?.();
  }
}

/**
 * 列表缩略图：经 UI 槽位 `resolveThumbnail`；失败返回 null，由 UI 回退类型图标。
 */
export function resolveAssetThumbnail(
  item: Pick<AssetItem, 'id' | 'url' | 'name' | 'type'>,
): Promise<string | null> {
  const kind = getAssetKind(item);
  const key = cacheKey(item);
  if (resultCache.has(key)) {
    return Promise.resolve(resultCache.get(key) ?? null);
  }
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = withConcurrency(async () => {
    const { uiRegistry } = await import('@/plugins/uiRegistry');
    const { startPluginRuntime } = await import('@/plugins/runtime');
    startPluginRuntime();
    const contribution = uiRegistry.resolveThumbnail({
      name: item.name,
      mimeType: item.type,
      kind,
    });
    if (!contribution) return remember(key, null);
    if (!item.url) return remember(key, null);
    const thumb = await contribution.capture(item.url);
    return remember(key, thumb);
  }).finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, job);
  return job;
}

/** 测试用：清空缩略图缓存 */
export function clearAssetThumbnailCache(): void {
  resultCache.clear();
  inflight.clear();
}
