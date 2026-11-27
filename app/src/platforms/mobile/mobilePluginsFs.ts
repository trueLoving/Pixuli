import type { ExternalLoaderFs } from '@/plugins/externalLoader';

/** Capacitor `Directory.Data` 下的用户插件根目录（对齐 Desktop `userData/plugins`） */
export const MOBILE_PLUGINS_DIR = 'plugins';

async function getFilesystem() {
  const { Filesystem, Directory, Encoding } = await import(
    '@capacitor/filesystem'
  );
  return { Filesystem, Directory, Encoding };
}

function normalizeRelativePath(path: string): string {
  return path.replace(/^[/\\]+/, '').replace(/\\/g, '/');
}

function joinPaths(...parts: string[]): string {
  return parts
    .map(part => normalizeRelativePath(part))
    .filter(Boolean)
    .join('/');
}

export async function ensureMobilePluginsRoot(): Promise<string> {
  const { Filesystem, Directory } = await getFilesystem();
  try {
    await Filesystem.mkdir({
      path: MOBILE_PLUGINS_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? '');
    if (!/already exists/i.test(message)) {
      throw error;
    }
  }
  return MOBILE_PLUGINS_DIR;
}

/**
 * 将 `Directory.Data` 相对路径适配为 `ExternalLoaderFs`。
 * `toImportUrl` 原样返回路径；由 Mobile Loader 读文本后再 Blob `import`。
 */
export function createMobilePluginsFs(): ExternalLoaderFs {
  return {
    join: (...parts) => joinPaths(...parts),
    toImportUrl: absolutePath => normalizeRelativePath(absolutePath),
    readdir: async dir => {
      const { Filesystem, Directory } = await getFilesystem();
      try {
        const result = await Filesystem.readdir({
          path: normalizeRelativePath(dir),
          directory: Directory.Data,
        });
        return (result.files ?? []).map(entry => entry.name);
      } catch {
        return [];
      }
    },
    isDirectory: async filePath => {
      const { Filesystem, Directory } = await getFilesystem();
      try {
        const stat = await Filesystem.stat({
          path: normalizeRelativePath(filePath),
          directory: Directory.Data,
        });
        return stat.type === 'directory';
      } catch {
        return false;
      }
    },
    readText: async filePath => {
      const { Filesystem, Directory, Encoding } = await getFilesystem();
      const result = await Filesystem.readFile({
        path: normalizeRelativePath(filePath),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return String(result.data);
    },
  };
}
