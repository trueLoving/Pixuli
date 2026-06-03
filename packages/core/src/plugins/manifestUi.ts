import type { StoragePluginManifest, StoragePluginRegistry } from './types';

export function isStoragePluginRegistered(
  registry: StoragePluginRegistry,
  pluginId: string,
): boolean {
  return registry.getManifest(pluginId) !== undefined;
}

export function getStoragePluginDisplayName(
  registry: StoragePluginRegistry,
  pluginId: string,
): string {
  return registry.getManifest(pluginId)?.name ?? pluginId;
}

/**
 * 添加源列表等场景的说明文案：优先 i18n `sidebar.{id}Description`，否则回退 manifest.name。
 */
export function getManifestDescription(
  manifest: StoragePluginManifest,
  translate?: (key: string) => string,
): string {
  const key = `sidebar.${manifest.id}Description`;
  if (translate) {
    const value = translate(key);
    if (value && value !== key) {
      return value;
    }
  }
  return manifest.name;
}

/** 已知内置插件 id，用于图标等 UI 分支（M3 P0 仅 github / gitee）。 */
export function isKnownBuiltinPluginId(
  pluginId: string,
): pluginId is 'github' | 'gitee' {
  return pluginId === 'github' || pluginId === 'gitee';
}
