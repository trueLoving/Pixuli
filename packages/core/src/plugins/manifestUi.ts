import type {
  StorageCapabilities,
  StoragePluginManifest,
  StoragePluginRegistry,
} from './types';

/** 给 UI 展示的能力芯片；只读 manifest.capabilities，禁止按 pluginId 写死。 */
export type ManifestCapabilityFlag =
  | 'sync'
  | 'publicUrl'
  | 'shareLink'
  | 'timedAccess'
  | 'largeFile';

export function listCapabilityFlags(
  source: StoragePluginManifest | StorageCapabilities,
): ManifestCapabilityFlag[] {
  const caps = 'capabilities' in source ? source.capabilities : source;
  const flags: ManifestCapabilityFlag[] = [];
  if (caps.sync) flags.push('sync');
  if (caps.publicUrl) flags.push('publicUrl');
  if (caps.shareLink) flags.push('shareLink');
  if (caps.timedAccess) flags.push('timedAccess');
  if (typeof caps.maxUploadBytes === 'number') flags.push('largeFile');
  return flags;
}

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
