import type {
  PluginLoadResult,
  PluginRuntime,
} from '@pixuli/core/plugin-runtime';
import { loadDesktopExternalPlugins } from './loadDesktopExternalPlugins';
import { loadMobileExternalPlugins } from './loadMobileExternalPlugins';

/**
 * 按端加载用户安装（external）插件。
 * Desktop：userData/plugins + pixuli-plugin:；Mobile：Directory.Data/plugins + Blob import。
 * Web：两者皆跳过（D2.9）。
 */
export async function loadExternalPlugins(
  runtime: PluginRuntime,
): Promise<PluginLoadResult[]> {
  const desktop = await loadDesktopExternalPlugins(runtime);
  const mobile = await loadMobileExternalPlugins(runtime);
  return [...desktop, ...mobile];
}
