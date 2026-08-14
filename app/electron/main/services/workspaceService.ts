import { dialog, ipcMain } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';

function resolveSafePath(root: string, relativePath: string): string {
  const normalized = relativePath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  const resolved = path.resolve(root, normalized);
  const rootResolved = path.resolve(root);
  if (
    resolved !== rootResolved &&
    !resolved.startsWith(`${rootResolved}${path.sep}`)
  ) {
    throw new Error(`Invalid workspace path: ${relativePath}`);
  }
  return resolved;
}

function listRelativeFiles(
  root: string,
  relativeDir: string,
  recursive: boolean,
): string[] {
  const absDir = resolveSafePath(root, relativeDir);
  if (!fs.existsSync(absDir)) {
    return [];
  }

  const results: string[] = [];
  const walk = (currentAbs: string, currentRel: string) => {
    const entries = fs.readdirSync(currentAbs, { withFileTypes: true });
    for (const entry of entries) {
      const rel = currentRel ? `${currentRel}/${entry.name}` : entry.name;
      const abs = path.join(currentAbs, entry.name);
      if (entry.isDirectory()) {
        if (recursive) {
          walk(abs, rel);
        } else {
          results.push(rel.replace(/\\/g, '/'));
        }
      } else if (entry.isFile()) {
        results.push(rel.replace(/\\/g, '/'));
      }
    }
  };

  const stat = fs.statSync(absDir);
  if (stat.isDirectory()) {
    walk(absDir, relativeDir.replace(/\\/g, '/').replace(/\/$/, ''));
  }
  return results.sort();
}

let workspaceRoot: string | null = null;

export function registerWorkspaceHandlers() {
  ipcMain.handle('workspace:getRoot', () => ({
    rootPath: workspaceRoot,
  }));

  ipcMain.handle('workspace:pickRoot', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: '选择 Pixuli 本地工作区',
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, rootPath: null as string | null };
    }
    workspaceRoot = result.filePaths[0];
    return { ok: true, rootPath: workspaceRoot };
  });

  ipcMain.handle('workspace:setRoot', (_event, rootPath: string) => {
    if (!rootPath || !fs.existsSync(rootPath)) {
      return { ok: false };
    }
    workspaceRoot = rootPath;
    return { ok: true, rootPath: workspaceRoot };
  });

  ipcMain.handle('workspace:readFile', (_event, relativePath: string) => {
    if (!workspaceRoot) {
      throw new Error('Workspace root is not set');
    }
    const abs = resolveSafePath(workspaceRoot, relativePath);
    const buffer = fs.readFileSync(abs);
    return Uint8Array.from(buffer);
  });

  ipcMain.handle(
    'workspace:writeFile',
    (_event, relativePath: string, data: Uint8Array) => {
      if (!workspaceRoot) {
        throw new Error('Workspace root is not set');
      }
      const abs = resolveSafePath(workspaceRoot, relativePath);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, Buffer.from(data));
      return { ok: true };
    },
  );

  ipcMain.handle('workspace:deleteFile', (_event, relativePath: string) => {
    if (!workspaceRoot) {
      throw new Error('Workspace root is not set');
    }
    const abs = resolveSafePath(workspaceRoot, relativePath);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
    }
    return { ok: true };
  });

  ipcMain.handle(
    'workspace:listFiles',
    (_event, relativeDir: string, recursive?: boolean) => {
      if (!workspaceRoot) {
        throw new Error('Workspace root is not set');
      }
      return listRelativeFiles(workspaceRoot, relativeDir, recursive ?? false);
    },
  );

  ipcMain.handle('workspace:exists', (_event, relativePath: string) => {
    if (!workspaceRoot) {
      return false;
    }
    try {
      const abs = resolveSafePath(workspaceRoot, relativePath);
      return fs.existsSync(abs);
    } catch {
      return false;
    }
  });
}
