import type { AssetKind, AssetItem } from '@pixuli/core/types';
import { kindRegistry } from '@/plugins/registries';
import { startPluginRuntime } from '@/plugins/runtime';

export type AssetKindFilter = 'all' | AssetKind;

export type { AssetKind };

/**
 * 解析资源类型：优先 Kind 插件 `matchHandler`；
 * 未命中时为 other（image / video / 文档类均由插件声明）。
 */
export function getAssetKind(
  item: Pick<AssetItem, 'name' | 'type'>,
): AssetKind {
  startPluginRuntime();
  const handler = kindRegistry.matchHandler({
    name: item.name || '',
    mimeType: item.type,
  });
  if (handler) {
    return handler.manifest.kind;
  }
  return 'other';
}

export function filterAssetsByKind<T extends Pick<AssetItem, 'name' | 'type'>>(
  items: T[],
  kind: AssetKindFilter,
): T[] {
  if (kind === 'all') return items;
  return items.filter(item => getAssetKind(item) === kind);
}

export function filterAssetsByKinds<T extends Pick<AssetItem, 'name' | 'type'>>(
  items: T[],
  kinds: AssetKind[],
): T[] {
  if (kinds.length === 0) return items;
  const allowed = new Set(kinds);
  return items.filter(item => allowed.has(getAssetKind(item)));
}
