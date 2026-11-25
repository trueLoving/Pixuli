import { app, ipcMain, protocol, net } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const SCHEME = 'pixuli-plugin';

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

/** app.ready 之后注册自定义协议（ESM import 用） */
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
      return net.fetch(pathToFileURL(abs).href);
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
}
