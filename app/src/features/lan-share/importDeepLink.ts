/**
 * 局域网转移包 → 本机 Pixuli 深链。
 * pixuli://import-transfer?src=<urlencoded ticket http url>
 */

export const PIXULI_URL_SCHEME = 'pixuli';
export const IMPORT_TRANSFER_PATH = 'import-transfer';

export function buildImportTransferDeepLink(ticketHttpUrl: string): string {
  const src = encodeURIComponent(ticketHttpUrl);
  return `${PIXULI_URL_SCHEME}://${IMPORT_TRANSFER_PATH}?src=${src}`;
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

export function parseImportTransferDeepLink(
  raw: string,
): { sourceUrl: string } | null {
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
  // Electron / 部分平台会把 path 放在 pathname：pixuli://import-transfer?...
  const path =
    (host === IMPORT_TRANSFER_PATH ? IMPORT_TRANSFER_PATH : '') ||
    url.pathname.replace(/^\/+/, '');
  if (host !== IMPORT_TRANSFER_PATH && path !== IMPORT_TRANSFER_PATH) {
    return null;
  }
  const src = url.searchParams.get('src');
  if (!src?.trim()) return null;
  let decoded = src.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // keep raw
  }
  if (!/^https?:\/\//i.test(decoded)) return null;
  return { sourceUrl: decoded };
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
