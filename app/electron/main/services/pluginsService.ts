import { parseDiskPluginManifest } from '@pixuli/core/plugin-runtime';
import { app, dialog, ipcMain, protocol } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCHEME = 'pixuli-plugin';

function pluginDirName(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

export function getPluginsRoot(): string {
  return path.join(app.getPath('userData'), 'plugins');
}

function ensurePluginsRoot(): string {
  const root = getPluginsRoot();
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  return root;
}

function resolveUnderPluginsRoot(relativePath: string): string {
  const root = path.resolve(ensurePluginsRoot());
  const normalized = relativePath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  const resolved = path.resolve(root, normalized);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Invalid plugin path: ${relativePath}`);
  }
  return resolved;
}

/** 须在 app.ready 之前调用 */
export function registerPluginProtocolScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

function mimeForPluginFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mjs' || ext === '.js' || ext === '.cjs') {
    return 'text/javascript; charset=utf-8';
  }
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.wasm') return 'application/wasm';
  return 'application/octet-stream';
}

/** app.ready 之后注册自定义协议（资源读取；ESM 以 IPC+Blob 加载更稳） */
export function registerPluginProtocolHandler(): void {
  ensurePluginsRoot();
  protocol.handle(SCHEME, request => {
    try {
      const url = new URL(request.url);
      // pixuli-plugin://local/<rel-under-plugins-root>
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const abs = resolveUnderPluginsRoot(rel);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
        return new Response('Not Found', { status: 404 });
      }
      const body = fs.readFileSync(abs);
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': mimeForPluginFile(abs),
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(message, { status: 400 });
    }
  });
}

/** IPC 可在 ready 前注册 */
export function registerPluginHandlers(): void {
  ipcMain.handle('plugins:getRoot', () => ({
    rootPath: ensurePluginsRoot(),
  }));

  /** 读取 plugins 根下相对路径文本（供渲染进程 Blob ESM import） */
  ipcMain.handle('plugins:readText', (_event, relativePath: string) => {
    if (typeof relativePath !== 'string' || !relativePath.trim()) {
      throw new Error('relativePath required');
    }
    const abs = resolveUnderPluginsRoot(relativePath);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      throw new Error(`plugin file not found: ${relativePath}`);
    }
    return { text: fs.readFileSync(abs, 'utf8') };
  });

  ipcMain.handle('plugins:discover', () => {
    const root = ensurePluginsRoot();
    const entries = fs.readdirSync(root, { withFileTypes: true });
    const plugins: Array<{
      directory: string;
      manifestPath: string;
      mainRelative: string;
      importUrl: string;
      manifestJson: string;
    }> = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const directory = path.join(root, entry.name);
      const manifestPath = path.join(directory, 'manifest.json');
      if (!fs.existsSync(manifestPath)) continue;
      let manifestJson: string;
      try {
        manifestJson = fs.readFileSync(manifestPath, 'utf8');
        const parsed = JSON.parse(manifestJson) as { main?: string };
        if (typeof parsed.main !== 'string' || !parsed.main.trim()) continue;
        const mainRelative = path.posix.join(
          entry.name,
          parsed.main.replace(/\\/g, '/'),
        );
        plugins.push({
          directory,
          manifestPath,
          mainRelative,
          importUrl: `${SCHEME}://local/${mainRelative
            .split('/')
            .map(encodeURIComponent)
            .join('/')}`,
          manifestJson,
        });
      } catch {
        continue;
      }
    }
    return { rootPath: root, plugins };
  });

  /**
   * 离线安装：用户选择含 manifest.json 的插件目录，复制到 userData/plugins。
   * 同 id 已存在则覆盖文件（需由渲染进程决定是否已 register）。
   */
  ipcMain.handle('plugins:installFromDirectory', async () => {
    const picked = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择插件目录（含 manifest.json）',
    });
    if (picked.canceled || picked.filePaths.length === 0) {
      return { ok: false, canceled: true as const };
    }

    const sourceDir = picked.filePaths[0]!;
    const manifestPath = path.join(sourceDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return {
        ok: false,
        canceled: false as const,
        error: 'manifest.json not found in selected directory',
      };
    }

    try {
      const manifestJson = fs.readFileSync(manifestPath, 'utf8');
      const manifest = parseDiskPluginManifest(JSON.parse(manifestJson));
      const mainAbs = path.join(sourceDir, manifest.main);
      if (!fs.existsSync(mainAbs) || !fs.statSync(mainAbs).isFile()) {
        return {
          ok: false,
          canceled: false as const,
          error: `main entry not found: ${manifest.main}`,
        };
      }

      const root = ensurePluginsRoot();
      const destDir = path.join(root, pluginDirName(manifest.id));
      fs.rmSync(destDir, { recursive: true, force: true });
      fs.cpSync(sourceDir, destDir, { recursive: true });

      return {
        ok: true,
        canceled: false as const,
        pluginId: manifest.id,
        directory: destDir,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, canceled: false as const, error: message };
    }
  });

  /**
   * 卸载：删除 userData/plugins/<safeId>/。
   * 目录名与安装时 pluginDirName(id) 一致；若目录不存在视为已卸载成功。
   */
  ipcMain.handle('plugins:uninstall', (_event, pluginId: string) => {
    if (typeof pluginId !== 'string' || !pluginId.trim()) {
      return { ok: false, error: 'pluginId required' };
    }
    try {
      const root = ensurePluginsRoot();
      const destDir = path.join(root, pluginDirName(pluginId.trim()));
      if (destDir !== root && !destDir.startsWith(`${root}${path.sep}`)) {
        return { ok: false, error: `Invalid plugin path for id: ${pluginId}` };
      }
      if (fs.existsSync(destDir)) {
        if (!fs.statSync(destDir).isDirectory()) {
          return {
            ok: false,
            error: `plugin path is not a directory: ${destDir}`,
          };
        }
        fs.rmSync(destDir, { recursive: true, force: true });
      }
      return { ok: true, pluginId: pluginId.trim() };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message };
    }
  });
}
