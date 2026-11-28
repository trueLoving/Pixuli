import type {
  PluginOrigin,
  PluginStateRecord,
  RuntimePluginManifest,
} from '@pixuli/core/plugin-runtime';
import { isDesktop, isNativeMobile } from '@/platforms/platform';
import { installMobilePluginFromFiles } from '@/platforms/mobile/installMobilePluginFromFiles';
import { uninstallMobilePlugin } from '@/platforms/mobile/uninstallMobilePlugin';
import { loadExternalPlugins } from './loadExternalPlugins';
import { pluginRuntime } from './runtime';

export type ManagedPluginRow = PluginStateRecord & {
  name: string;
  capabilities: RuntimePluginManifest['capabilities'];
  loaded: boolean;
};

export type OfflineInstallResult = {
  ok: boolean;
  canceled?: boolean;
  pluginId?: string;
  error?: string;
};

export type OfflineUninstallResult = {
  ok: boolean;
  pluginId?: string;
  error?: string;
};

/** Web 仅管理 builtin；Desktop（pluginsAPI）/ Mobile 可离线安装 */
export function canInstallOfflinePlugins(): boolean {
  if (isNativeMobile()) return true;
  return (
    isDesktop() &&
    typeof window !== 'undefined' &&
    typeof window.pluginsAPI?.installFromDirectory === 'function'
  );
}

/** 与离线安装同平台；Desktop 另需 uninstall IPC */
export function canUninstallOfflinePlugins(): boolean {
  if (isNativeMobile()) return true;
  return (
    isDesktop() &&
    typeof window !== 'undefined' &&
    typeof window.pluginsAPI?.uninstall === 'function'
  );
}
export function listManagedPlugins(): ManagedPluginRow[] {
  const loaded = new Set(pluginRuntime.getLoadedIds());
  return pluginRuntime.listStates().map(state => {
    const manifest = pluginRuntime.getManifest(state.id);
    return {
      ...state,
      name: manifest?.name ?? state.id,
      capabilities: manifest?.capabilities ?? [],
      loaded: loaded.has(state.id),
    };
  });
}

export function listManagedPluginsForPlatform(): ManagedPluginRow[] {
  const rows = listManagedPlugins();
  // D2.9：Web 不管理 external；Desktop / Mobile 展示全部
  if (isDesktop() || isNativeMobile()) {
    return rows;
  }
  return rows.filter(row => row.origin === 'builtin');
}

export async function setPluginEnabled(
  id: string,
  enabled: boolean,
): Promise<void> {
  await pluginRuntime.setEnabled(id, enabled);
}

/**
 * Desktop：系统目录选择器安装；Mobile：传入 webkitdirectory 的 File 列表。
 * 安装后重新扫描 external 并 load 新插件。
 */
export async function installOfflinePlugin(options?: {
  mobileFiles?: File[];
}): Promise<OfflineInstallResult> {
  if (!canInstallOfflinePlugins()) {
    return { ok: false, error: 'offline install is not available on Web' };
  }

  let result: OfflineInstallResult;

  if (isNativeMobile()) {
    result = await installMobilePluginFromFiles(options?.mobileFiles ?? []);
  } else if (isDesktop() && window.pluginsAPI?.installFromDirectory) {
    result = await window.pluginsAPI.installFromDirectory();
  } else {
    return {
      ok: false,
      error: 'offline install is not available on this platform',
    };
  }

  if (!result.ok || !result.pluginId) {
    return result;
  }

  if (pluginRuntime.listStates().some(s => s.id === result.pluginId)) {
    // 已注册：文件已覆盖；若当前禁用则重新启用（代码热替换需重启）
    const state = pluginRuntime
      .listStates()
      .find(item => item.id === result.pluginId);
    if (state && !state.enabled) {
      try {
        await pluginRuntime.setEnabled(result.pluginId, true);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          ok: false,
          pluginId: result.pluginId,
          error: `files updated but reload failed: ${message}`,
        };
      }
    }
    return result;
  }

  const loadResults = await loadExternalPlugins(pluginRuntime);
  const loaded = loadResults.find(item => item.id === result.pluginId);
  if (loaded && !loaded.ok) {
    return {
      ok: false,
      pluginId: result.pluginId,
      error: loaded.error ?? 'failed to load installed plugin',
    };
  }
  if (!pluginRuntime.listStates().some(s => s.id === result.pluginId)) {
    return {
      ok: false,
      pluginId: result.pluginId,
      error: 'plugin files installed but not discovered; check manifest.main',
    };
  }

  return result;
}

/**
 * 卸载第三方插件：先删本机目录，再 Runtime.unregisterExternal。
 * builtin 不可卸载。
 */
export async function uninstallOfflinePlugin(
  pluginId: string,
): Promise<OfflineUninstallResult> {
  if (!canUninstallOfflinePlugins()) {
    return { ok: false, error: 'offline uninstall is not available on Web' };
  }

  const state = pluginRuntime.listStates().find(item => item.id === pluginId);
  if (!state) {
    return { ok: false, pluginId, error: `Unknown plugin: ${pluginId}` };
  }
  if (state.origin !== 'external') {
    return {
      ok: false,
      pluginId,
      error: `Cannot uninstall builtin plugin: ${pluginId}`,
    };
  }

  let disk: OfflineUninstallResult;
  if (isNativeMobile()) {
    disk = await uninstallMobilePlugin(pluginId);
  } else if (isDesktop() && window.pluginsAPI?.uninstall) {
    disk = await window.pluginsAPI.uninstall(pluginId);
  } else {
    return {
      ok: false,
      pluginId,
      error: 'offline uninstall is not available on this platform',
    };
  }

  if (!disk.ok) {
    return disk;
  }

  try {
    await pluginRuntime.unregisterExternal(pluginId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      pluginId,
      error: `files removed but runtime unregister failed: ${message}`,
    };
  }

  return { ok: true, pluginId };
}

export function originLabelKey(origin: PluginOrigin): string {
  return origin === 'builtin'
    ? 'settings.plugins.originBuiltin'
    : 'settings.plugins.originExternal';
}
