import { ensureMobilePluginsRoot, MOBILE_PLUGINS_DIR } from './mobilePluginsFs';

export type MobilePluginUninstallResult = {
  ok: boolean;
  pluginId?: string;
  error?: string;
};

function pluginDirName(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

/**
 * Mobile 卸载：删除 Directory.Data/plugins/<pluginId>/。
 * 目录不存在视为成功。
 */
export async function uninstallMobilePlugin(
  pluginId: string,
): Promise<MobilePluginUninstallResult> {
  const id = pluginId.trim();
  if (!id) {
    return { ok: false, error: 'pluginId required' };
  }

  try {
    await ensureMobilePluginsRoot();
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const destRoot = `${MOBILE_PLUGINS_DIR}/${pluginDirName(id)}`;
    try {
      await Filesystem.rmdir({
        path: destRoot,
        directory: Directory.Data,
        recursive: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // 不存在时部分实现会抛错，视为已卸载
      if (!/does not exist|not found|no such file/i.test(message)) {
        throw error;
      }
    }
    return { ok: true, pluginId: id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, pluginId: id, error: message };
  }
}
