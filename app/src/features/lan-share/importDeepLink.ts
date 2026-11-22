/**
 * 局域网转移包 → 本机 Pixuli 深链。
 *
 * 优先结构化参数（避免 Android 把嵌套 query 拆坏）：
 *   pixuli://import-transfer?h=<host>&p=<port>&id=<ticket>&t=<token>&s=replace&sync=1
 * 兼容旧式：
 *   pixuli://import-transfer?src=<urlencoded ticket http url>
 */

import {
  isTransferImportStrategy,
  type TransferImportStrategy,
} from './importStrategy';

export const PIXULI_URL_SCHEME = 'pixuli';
export const IMPORT_TRANSFER_PATH = 'import-transfer';

export interface ImportTransferDeepLinkOptions {
  /** 导入策略；一键同步默认 replace */
  strategy?: TransferImportStrategy;
  /** 目标文件夹（空 = 工作区根） */
  targetFolder?: string;
  /** 标记为「全库同步」会话，UI 用更明确文案 */
  librarySync?: boolean;
}

export interface ParsedImportTransferDeepLink {
  sourceUrl: string;
  strategy?: TransferImportStrategy;
  targetFolder?: string;
  librarySync?: boolean;
}

export function buildImportTransferDeepLink(
  ticketHttpUrl: string,
  options: ImportTransferDeepLinkOptions = {},
): string {
  try {
    const ticket = new URL(ticketHttpUrl);
    const id = ticket.searchParams.get('id') || '';
    const token = ticket.searchParams.get('token') || '';
    if (ticket.hostname && id && token) {
      const params = new URLSearchParams();
      params.set('h', ticket.hostname);
      if (ticket.port) params.set('p', ticket.port);
      params.set('id', id);
      params.set('t', token);
      if (options.strategy) params.set('s', options.strategy);
      if (options.targetFolder) params.set('f', options.targetFolder);
      if (options.librarySync) params.set('sync', '1');
      return `${PIXULI_URL_SCHEME}://${IMPORT_TRANSFER_PATH}?${params.toString()}`;
    }
  } catch {
    // fall through
  }
  const src = encodeURIComponent(ticketHttpUrl);
  const params = new URLSearchParams();
  params.set('src', src);
  if (options.strategy) params.set('s', options.strategy);
  if (options.targetFolder) params.set('f', options.targetFolder);
  if (options.librarySync) params.set('sync', '1');
  return `${PIXULI_URL_SCHEME}://${IMPORT_TRANSFER_PATH}?${params.toString()}`;
}

export function buildExportTicketHttpUrl(
  origin: string,
  ticketId: string,
  token: string,
): string {
  const base = origin.replace(/\/+$/, '');
  const url = new URL(`${base}/api/export/ticket`);
  url.searchParams.set('id', ticketId);
  url.searchParams.set('token', token);
  return url.toString();
}

function buildTicketUrlFromParts(
  host: string,
  port: string | null,
  id: string,
  token: string,
): string {
  const portPart = port ? `:${port}` : '';
  const url = new URL(`http://${host}${portPart}/api/export/ticket`);
  url.searchParams.set('id', id);
  url.searchParams.set('token', token);
  return url.toString();
}

function decodeMaybe(value: string): string {
  let current = value.trim();
  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

function readDeepLinkOptions(
  url: URL,
): Pick<
  ParsedImportTransferDeepLink,
  'strategy' | 'targetFolder' | 'librarySync'
> {
  const strategyRaw = url.searchParams.get('s')?.trim();
  const strategy =
    strategyRaw && isTransferImportStrategy(strategyRaw)
      ? strategyRaw
      : undefined;
  const folderRaw = url.searchParams.get('f');
  const targetFolder =
    folderRaw == null ? undefined : folderRaw.replace(/^\/+|\/+$/g, '');
  const librarySync = url.searchParams.get('sync') === '1';
  return { strategy, targetFolder, librarySync };
}

export function parseImportTransferDeepLink(
  raw: string,
): ParsedImportTransferDeepLink | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== `${PIXULI_URL_SCHEME}:`) return null;
  const host = url.hostname || url.host;
  const path =
    (host === IMPORT_TRANSFER_PATH ? IMPORT_TRANSFER_PATH : '') ||
    url.pathname.replace(/^\/+/, '');
  if (host !== IMPORT_TRANSFER_PATH && path !== IMPORT_TRANSFER_PATH) {
    return null;
  }

  const options = readDeepLinkOptions(url);
  const lanHost = url.searchParams.get('h')?.trim();
  const ticketId = url.searchParams.get('id')?.trim();
  const token =
    url.searchParams.get('t')?.trim() || url.searchParams.get('token')?.trim();
  if (lanHost && ticketId && token) {
    return {
      sourceUrl: buildTicketUrlFromParts(
        lanHost,
        url.searchParams.get('p'),
        ticketId,
        token,
      ),
      ...options,
    };
  }

  const src = url.searchParams.get('src');
  if (!src?.trim()) return null;
  let decoded = decodeMaybe(src);
  // Android 偶尔把嵌套 ?id=&token= 拆到外层
  if (/^https?:\/\//i.test(decoded) && !/[?&]token=/i.test(decoded) && token) {
    const join = decoded.includes('?') ? '&' : '?';
    decoded = `${decoded}${join}token=${encodeURIComponent(token)}`;
  }
  if (!/^https?:\/\//i.test(decoded)) return null;
  return { sourceUrl: decoded, ...options };
}

export function isLanHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      return false;
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}
