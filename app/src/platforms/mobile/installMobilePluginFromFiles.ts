import { parseDiskPluginManifest } from '@pixuli/core/plugin-runtime';
import {
  createMobilePluginsFs,
  ensureMobilePluginsRoot,
  MOBILE_PLUGINS_DIR,
} from './mobilePluginsFs';

export type MobilePluginInstallResult = {
  ok: boolean;
  canceled?: boolean;
  pluginId?: string;
  error?: string;
};

function pluginDirName(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function normalizeRelativePath(path: string): string {
  return path.replace(/^[/\\]+/, '').replace(/\\/g, '/');
}

/**
 * webkitdirectory 选中的文件 → 相对插件根的路径映射。
 * 若全部共享同一顶层目录名，则剥掉该前缀。
 */
export function mapDirectoryFilesToPluginPaths(
  files: File[],
): Map<string, File> {
  const entries = files
    .map(file => ({
      file,
      relative: normalizeRelativePath(file.webkitRelativePath || file.name),
    }))
    .filter(entry => entry.relative.length > 0);

  if (entries.length === 0) {
    return new Map();
  }

  const tops = new Set(
    entries.map(entry => entry.relative.split('/')[0]).filter(Boolean),
  );
  const stripTop =
    tops.size === 1 && entries.every(e => e.relative.includes('/'));

  const map = new Map<string, File>();
  for (const entry of entries) {
    const relative = stripTop
      ? entry.relative.slice(entry.relative.indexOf('/') + 1)
      : entry.relative;
    if (relative) {
      map.set(relative, entry.file);
    }
  }
  return map;
}

/**
 * Mobile 离线安装：将用户选择的目录文件写入 Directory.Data/plugins/<pluginId>/。
 */
export async function installMobilePluginFromFiles(
  files: File[],
): Promise<MobilePluginInstallResult> {
  if (files.length === 0) {
    return { ok: false, canceled: true };
  }

  const mapped = mapDirectoryFilesToPluginPaths(files);
  const manifestFile = mapped.get('manifest.json');
  if (!manifestFile) {
    return {
      ok: false,
      error: 'manifest.json not found in selected directory',
    };
  }

  try {
    const manifestJson = await manifestFile.text();
    const manifest = parseDiskPluginManifest(JSON.parse(manifestJson));
    if (!mapped.has(normalizeRelativePath(manifest.main))) {
      return {
        ok: false,
        error: `main entry not found: ${manifest.main}`,
      };
    }

    await ensureMobilePluginsRoot();
    const { Filesystem, Directory, Encoding } = await import(
      '@capacitor/filesystem'
    );
    const destRoot = `${MOBILE_PLUGINS_DIR}/${pluginDirName(manifest.id)}`;

    try {
      await Filesystem.rmdir({
        path: destRoot,
        directory: Directory.Data,
        recursive: true,
      });
    } catch {
      // 目标不存在时忽略
    }

    await Filesystem.mkdir({
      path: destRoot,
      directory: Directory.Data,
      recursive: true,
    });

    for (const [relative, file] of mapped) {
      const target = `${destRoot}/${normalizeRelativePath(relative)}`;
      const parent = target.slice(0, target.lastIndexOf('/'));
      if (parent && parent !== destRoot) {
        try {
          await Filesystem.mkdir({
            path: parent,
            directory: Directory.Data,
            recursive: true,
          });
        } catch {
          // already exists
        }
      }
      const text = await file.text();
      await Filesystem.writeFile({
        path: target,
        directory: Directory.Data,
        data: text,
        encoding: Encoding.UTF8,
      });
    }

    // 确保 FS 适配器可被后续 discover 使用
    createMobilePluginsFs();

    return { ok: true, pluginId: manifest.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}
