import type {
  PluginLoadResult,
  PluginRuntime,
} from '@pixuli/core/plugin-runtime';
import { isNativeMobile } from '@/platforms/platform';
import {
  createMobilePluginsFs,
  ensureMobilePluginsRoot,
} from '@/platforms/mobile/mobilePluginsFs';
import { loadExternalPluginsFromDisk } from './externalLoader';
import { importPluginModuleFromSource } from './importPluginModuleFromSource';

/**
 * Mobile：扫描应用私有目录（Directory.Data 下 plugins 各子目录的 manifest.json），
 * 经 registerExternal + Blob ESM import 加载（对齐 Desktop 契约，无安装 UI）。
 * Web / Desktop 直接跳过。
 */
export async function loadMobileExternalPlugins(
  runtime: PluginRuntime,
): Promise<PluginLoadResult[]> {
  if (!isNativeMobile()) return [];

  try {
    const pluginsRoot = await ensureMobilePluginsRoot();
    const fs = createMobilePluginsFs();
    return await loadExternalPluginsFromDisk(
      runtime,
      pluginsRoot,
      fs,
      async importPath => {
        const source = await fs.readText(importPath);
        return importPluginModuleFromSource(source);
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[plugins] mobile external load failed:', message);
    return [];
  }
}
