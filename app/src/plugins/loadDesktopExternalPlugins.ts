import {
  parseDiskPluginManifest,
  type PluginLoadResult,
  type PluginRuntime,
} from '@pixuli/core/plugin-runtime';
import { isDesktop } from '@/platforms/platform';
import {
  loadDiscoveredExternalPlugins,
  type DiscoveredExternalPlugin,
} from './externalLoader';

/**
 * Desktop：经 preload discover + pixuli-plugin: URL 动态 import。
 * Web / Mobile 直接跳过（Mobile 见 `loadMobileExternalPlugins`）。
 */
export async function loadDesktopExternalPlugins(
  runtime: PluginRuntime,
): Promise<PluginLoadResult[]> {
  if (!isDesktop()) return [];
  if (typeof window === 'undefined' || !window.pluginsAPI?.discover) {
    return [];
  }

  const { plugins } = await window.pluginsAPI.discover();
  const discovered: DiscoveredExternalPlugin[] = [];

  for (const entry of plugins) {
    try {
      const manifest = parseDiskPluginManifest(JSON.parse(entry.manifestJson));
      discovered.push({
        manifest,
        directory: entry.directory,
        mainPath: entry.mainRelative,
        importUrl: entry.importUrl,
      });
    } catch {
      // skip invalid manifests
    }
  }

  return loadDiscoveredExternalPlugins(
    runtime,
    discovered,
    url => import(/* @vite-ignore */ url),
  );
}
