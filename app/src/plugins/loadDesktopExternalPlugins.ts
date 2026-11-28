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
import { importPluginModuleFromSource } from './importPluginModuleFromSource';

/**
 * Desktop：经 preload discover；入口源码经 IPC 读取后 Blob ESM import
 *（与 Mobile 一致，避免 pixuli-plugin: 动态 import 的 MIME/CORS 问题）。
 * Web / Mobile 直接跳过（Mobile 见 `loadMobileExternalPlugins`）。
 */
export async function loadDesktopExternalPlugins(
  runtime: PluginRuntime,
): Promise<PluginLoadResult[]> {
  if (!isDesktop()) return [];
  if (typeof window === 'undefined' || !window.pluginsAPI?.discover) {
    return [];
  }

  const api = window.pluginsAPI;
  const { plugins } = await api.discover();
  const discovered: DiscoveredExternalPlugin[] = [];

  for (const entry of plugins) {
    try {
      const manifest = parseDiskPluginManifest(JSON.parse(entry.manifestJson));
      discovered.push({
        manifest,
        directory: entry.directory,
        mainPath: entry.mainRelative,
        // importModule 约定接收 mainRelative（plugins 根下相对路径）
        importUrl: entry.mainRelative,
      });
    } catch {
      // skip invalid manifests
    }
  }

  return loadDiscoveredExternalPlugins(
    runtime,
    discovered,
    async mainRelative => {
      if (typeof api.readText === 'function') {
        const { text } = await api.readText(mainRelative);
        return importPluginModuleFromSource(text);
      }
      // 旧 preload 回退：尝试自定义协议（需正确 Content-Type）
      const importUrl = `pixuli-plugin://local/${mainRelative
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`;
      return import(/* @vite-ignore */ importUrl);
    },
  );
}
