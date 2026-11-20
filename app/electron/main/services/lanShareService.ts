import { ipcMain } from 'electron';
import * as fs from 'node:fs';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import { strToU8, zipSync } from 'fflate';
import {
  basenameRelative,
  getManifestRelativePath,
  parseMetadataManifest,
} from '@pixuli/core/utils';
import { WORKSPACE_PATHS } from '@pixuli/core/vault';
import {
  buildShareUrls,
  createShareToken,
  extractShareToken,
  guessMimeType,
  isShareTokenValid,
  LAN_SHARE_DEFAULT_PORT,
  sanitizeShareRelativePath,
} from '../../../src/features/lan-share/lanShareHelpers';
import {
  collectVaultShareFilePaths,
  listVaultShareDirectory,
  vaultDisplayNameForPath,
  type VaultShareIndexEntry,
} from '../../../src/features/lan-share/lanShareVaultView';
import {
  buildTransferManifest,
  buildTransferZipFilename,
  TRANSFER_MANIFEST_NAME,
} from '../../../src/features/lan-share/transferPackage';
import { renderLanShareBrowserPage } from './lanShareBrowserPage';
import { getWorkspaceRoot } from './workspaceService';

export interface LanShareStatus {
  running: boolean;
  port: number | null;
  token: string | null;
  urls: string[];
  rootPath: string | null;
  readOnly: true;
}

interface DirEntry {
  name: string;
  kind: 'dir' | 'file';
  relativePath: string;
  size?: number;
  mimeType?: string;
}

interface VaultShareSnapshot {
  entries: VaultShareIndexEntry[];
  folders: string[];
}

let server: Server | null = null;
let activePort: number | null = null;
let activeToken: string | null = null;

const EXPORT_TICKET_TTL_MS = 15 * 60 * 1000;
const exportTickets = new Map<string, { paths: string[]; expiresAt: number }>();

function pruneExportTickets(): void {
  const now = Date.now();
  for (const [id, ticket] of exportTickets) {
    if (ticket.expiresAt <= now) exportTickets.delete(id);
  }
}

function createExportTicket(paths: string[]): string {
  pruneExportTickets();
  const id = `${createShareToken()}${createShareToken()}`;
  exportTickets.set(id, {
    paths: [...paths],
    expiresAt: Date.now() + EXPORT_TICKET_TTL_MS,
  });
  return id;
}

function getExportTicketPaths(id: string): string[] | null {
  pruneExportTickets();
  const ticket = exportTickets.get(id);
  if (!ticket) return null;
  return ticket.paths;
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Disposition, X-Pixuli-Import-Ticket',
  );
}

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

function listLanAddresses(): string[] {
  const nets = os.networkInterfaces();
  const result: string[] = [];
  for (const entries of Object.values(nets)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      result.push(entry.address);
    }
  }
  return result.sort();
}

function getStatus(): LanShareStatus {
  const token = activeToken;
  const port = activePort;
  const urls =
    server && port != null && token
      ? buildShareUrls(port, token, listLanAddresses())
      : [];
  return {
    running: Boolean(server),
    port,
    token,
    urls,
    rootPath: getWorkspaceRoot(),
    readOnly: true,
  };
}

function readJsonFileIfExists(absPath: string): unknown | null {
  if (!fs.existsSync(absPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(absPath, 'utf8')) as unknown;
  } catch {
    return null;
  }
}

/** 读 Vault 快照：与 Desktop 同一套 index / folders */
function readVaultShareSnapshot(root: string): VaultShareSnapshot {
  const indexRaw = readJsonFileIfExists(
    resolveSafePath(root, WORKSPACE_PATHS.index),
  ) as { entries?: unknown } | null;
  const foldersRaw = readJsonFileIfExists(
    resolveSafePath(root, WORKSPACE_PATHS.folders),
  ) as { folders?: unknown } | null;

  const entries: VaultShareIndexEntry[] = [];
  if (Array.isArray(indexRaw?.entries)) {
    for (const item of indexRaw.entries) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      if (
        typeof record.relativePath !== 'string' ||
        !record.relativePath.trim()
      ) {
        continue;
      }
      entries.push({
        relativePath: record.relativePath.replace(/\\/g, '/'),
        name:
          typeof record.name === 'string' && record.name.trim()
            ? record.name
            : basenameRelative(record.relativePath),
        size: typeof record.size === 'number' ? record.size : undefined,
        mimeType:
          typeof record.mimeType === 'string' ? record.mimeType : undefined,
        deletedAt:
          typeof record.deletedAt === 'string' ? record.deletedAt : undefined,
      });
    }
  }

  const folders = Array.isArray(foldersRaw?.folders)
    ? foldersRaw.folders.filter(
        (folder): folder is string =>
          typeof folder === 'string' && Boolean(folder.trim()),
      )
    : [];

  return { entries, folders };
}

function listDirectory(root: string, relativeDir: string): DirEntry[] {
  const snapshot = readVaultShareSnapshot(root);
  return listVaultShareDirectory(
    snapshot.entries,
    snapshot.folders,
    relativeDir,
  );
}

function readDiskManifestEntry(
  root: string,
  relativeFilePath: string,
): {
  name: string;
  description?: string;
  tags?: string[];
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
  createdAt?: string;
  updatedAt?: string;
} {
  const fileName = basenameRelative(relativeFilePath);
  const fallback = {
    name: fileName,
    mimeType: guessMimeType(fileName),
  };
  try {
    const manifestRel = getManifestRelativePath(relativeFilePath);
    const abs = resolveSafePath(root, manifestRel);
    if (!fs.existsSync(abs)) return fallback;
    const raw = JSON.parse(fs.readFileSync(abs, 'utf8')) as unknown;
    const manifest = parseMetadataManifest(raw);
    const entry = manifest?.files?.[fileName];
    if (!entry) return fallback;
    return {
      name: entry.name || fileName,
      description: entry.description,
      tags: entry.tags,
      width: entry.width,
      height: entry.height,
      size: entry.size,
      mimeType: entry.type || guessMimeType(fileName),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  } catch {
    return fallback;
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  setCorsHeaders(res);
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function sendText(
  res: ServerResponse,
  status: number,
  body: string,
  contentType = 'text/plain; charset=utf-8',
): void {
  setCorsHeaders(res);
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendZip(
  res: ServerResponse,
  zip: Uint8Array,
  filename: string,
  ticketId?: string,
): void {
  setCorsHeaders(res);
  const headers: Record<string, string | number> = {
    'Content-Type': 'application/zip',
    'Content-Length': zip.byteLength,
    'Cache-Control': 'no-store',
    'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  };
  if (ticketId) {
    headers['X-Pixuli-Import-Ticket'] = ticketId;
  }
  res.writeHead(200, headers);
  res.end(Buffer.from(zip));
}

function requireAuth(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): boolean {
  if (!activeToken) {
    sendText(res, 503, 'Share is not active');
    return false;
  }
  const provided = extractShareToken(url, req.headers.authorization);
  if (!isShareTokenValid(activeToken, provided)) {
    sendText(
      res,
      401,
      'Unauthorized — open the link with token from Pixuli Desktop',
    );
    return false;
  }
  return true;
}

async function readRequestJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return null;
  return JSON.parse(raw) as unknown;
}

/** 将勾选的文件/文件夹展开为 Vault 索引中的文件相对路径 */
function collectExportFilePaths(
  root: string,
  relativePaths: string[],
): string[] {
  const snapshot = readVaultShareSnapshot(root);
  return collectVaultShareFilePaths(
    snapshot.entries,
    snapshot.folders,
    relativePaths,
  ).filter(rel => {
    try {
      const abs = resolveSafePath(root, rel);
      return fs.existsSync(abs) && fs.statSync(abs).isFile();
    } catch {
      return false;
    }
  });
}

function buildExportZip(
  root: string,
  relativePaths: string[],
): { zip: Uint8Array; filename: string; packed: number } {
  const snapshot = readVaultShareSnapshot(root);
  const filePaths = collectExportFilePaths(root, relativePaths);
  const itemInputs: Parameters<typeof buildTransferManifest>[0] = [];

  for (const rel of filePaths) {
    let abs: string;
    try {
      abs = resolveSafePath(root, rel);
    } catch {
      continue;
    }
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    const meta = readDiskManifestEntry(root, rel);
    const size = fs.statSync(abs).size;
    const vaultName = vaultDisplayNameForPath(snapshot.entries, rel);
    itemInputs.push({
      relativePath: rel,
      name: vaultName || meta.name || basenameRelative(rel),
      mimeType: meta.mimeType,
      description: meta.description,
      tags: meta.tags,
      width: meta.width,
      height: meta.height,
      size: meta.size ?? size,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
    });
  }

  if (itemInputs.length === 0) {
    throw new Error('No exportable files');
  }

  const manifest = buildTransferManifest(itemInputs);
  const archive: Record<string, Uint8Array> = {
    [TRANSFER_MANIFEST_NAME]: strToU8(`${JSON.stringify(manifest, null, 2)}\n`),
  };
  for (const item of manifest.items) {
    const abs = resolveSafePath(root, item.relativePath);
    archive[item.archivePath] = new Uint8Array(fs.readFileSync(abs));
  }

  return {
    zip: zipSync(archive),
    filename: buildTransferZipFilename(manifest.itemCount),
    packed: manifest.itemCount,
  };
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  void (async () => {
    try {
      const host =
        req.headers.host || `127.0.0.1:${activePort ?? LAN_SHARE_DEFAULT_PORT}`;
      const url = new URL(req.url || '/', `http://${host}`);

      if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(204);
        res.end();
        return;
      }

      if (url.pathname === '/api/health') {
        sendJson(res, 200, {
          ok: true,
          readOnly: true,
          running: Boolean(server),
        });
        return;
      }

      if (!requireAuth(req, res, url)) return;

      const root = getWorkspaceRoot();
      if (!root) {
        sendText(res, 503, 'Workspace root is not set');
        return;
      }

      if (url.pathname === '/api/export/ticket' && req.method === 'GET') {
        const ticketId = (url.searchParams.get('id') || '').trim();
        if (!ticketId) {
          sendText(res, 400, 'ticket id required');
          return;
        }
        const paths = getExportTicketPaths(ticketId);
        if (!paths) {
          sendText(res, 404, 'ticket expired or not found');
          return;
        }
        try {
          const { zip, filename } = buildExportZip(root, paths);
          sendZip(res, zip, filename, ticketId);
        } catch (error) {
          sendText(
            res,
            400,
            error instanceof Error ? error.message : 'export failed',
          );
        }
        return;
      }

      if (url.pathname === '/api/export' && req.method === 'POST') {
        const body = (await readRequestJson(req)) as {
          paths?: unknown;
        } | null;
        const paths = Array.isArray(body?.paths)
          ? body.paths.filter((p): p is string => typeof p === 'string')
          : [];
        if (paths.length === 0) {
          sendText(res, 400, 'paths required');
          return;
        }
        try {
          const { zip, filename } = buildExportZip(root, paths);
          const ticketId = createExportTicket(paths);
          sendZip(res, zip, filename, ticketId);
        } catch (error) {
          sendText(
            res,
            400,
            error instanceof Error ? error.message : 'export failed',
          );
        }
        return;
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendText(res, 405, 'Method Not Allowed');
        return;
      }

      if (url.pathname === '/api/status') {
        sendJson(res, 200, {
          readOnly: true,
          rootName: path.basename(root),
          path: sanitizeShareRelativePath(url.searchParams.get('path')) ?? '',
        });
        return;
      }

      if (url.pathname === '/api/list') {
        const rel = sanitizeShareRelativePath(url.searchParams.get('path'));
        if (rel == null) {
          sendJson(res, 400, { error: 'Invalid path' });
          return;
        }
        let entries = listDirectory(root, rel);
        const q = (url.searchParams.get('q') || '').trim().toLowerCase();
        if (q) {
          entries = entries.filter(e => e.name.toLowerCase().includes(q));
        }
        sendJson(res, 200, { path: rel, entries });
        return;
      }

      if (url.pathname === '/' || url.pathname === '/browse') {
        sendText(
          res,
          200,
          renderLanShareBrowserPage(),
          'text/html; charset=utf-8',
        );
        return;
      }

      if (url.pathname === '/file') {
        const rel = sanitizeShareRelativePath(url.searchParams.get('path'));
        if (rel == null || rel === '') {
          sendText(res, 400, 'Invalid path');
          return;
        }
        let abs: string;
        try {
          abs = resolveSafePath(root, rel);
        } catch {
          sendText(res, 400, 'Invalid path');
          return;
        }
        if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
          sendText(res, 404, 'Not found');
          return;
        }
        const data = fs.readFileSync(abs);
        const mime = guessMimeType(path.basename(abs));
        res.writeHead(200, {
          'Content-Type': mime,
          'Content-Length': data.length,
          'Cache-Control': 'no-store',
          'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(path.basename(abs))}`,
        });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        res.end(data);
        return;
      }

      sendText(res, 404, 'Not found');
    } catch (error) {
      sendText(
        res,
        500,
        error instanceof Error ? error.message : 'Internal error',
      );
    }
  })();
}

function listenOnPort(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const next = createServer(handleRequest);
    const onError = (error: NodeJS.ErrnoException) => {
      next.off('listening', onListening);
      next.close();
      reject(error);
    };
    const onListening = () => {
      next.off('error', onError);
      server = next;
      activePort = port;
      resolve(port);
    };
    next.once('error', onError);
    next.once('listening', onListening);
    next.listen(port, '0.0.0.0');
  });
}

async function startServer(preferredPort?: number): Promise<LanShareStatus> {
  if (server) {
    return getStatus();
  }
  const root = getWorkspaceRoot();
  if (!root) {
    throw new Error('Workspace root is not set');
  }

  activeToken = createShareToken();
  const startPort = preferredPort || LAN_SHARE_DEFAULT_PORT;
  let lastError: unknown;
  for (let offset = 0; offset < 20; offset += 1) {
    const port = startPort + offset;
    try {
      await listenOnPort(port);
      return getStatus();
    } catch (error) {
      lastError = error;
    }
  }
  activeToken = null;
  activePort = null;
  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to bind LAN share port');
}

async function stopServer(): Promise<LanShareStatus> {
  if (!server) {
    activePort = null;
    activeToken = null;
    exportTickets.clear();
    return getStatus();
  }
  const current = server;
  server = null;
  await new Promise<void>(resolve => {
    current.close(() => resolve());
  });
  activePort = null;
  activeToken = null;
  exportTickets.clear();
  return getStatus();
}

export async function stopLanShareIfRunning(): Promise<void> {
  await stopServer();
}

export function registerLanShareHandlers(): void {
  ipcMain.handle('lanShare:getStatus', () => getStatus());

  ipcMain.handle('lanShare:start', async (_event, preferredPort?: number) => {
    try {
      const status = await startServer(preferredPort);
      return { ok: true as const, status };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'start failed',
        status: getStatus(),
      };
    }
  });

  ipcMain.handle('lanShare:stop', async () => {
    const status = await stopServer();
    return { ok: true as const, status };
  });

  ipcMain.handle('lanShare:rotateToken', async () => {
    if (!server) {
      return { ok: false as const, status: getStatus() };
    }
    activeToken = createShareToken();
    return { ok: true as const, status: getStatus() };
  });
}
