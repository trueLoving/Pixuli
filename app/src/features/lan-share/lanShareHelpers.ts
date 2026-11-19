/**
 * 局域网只读共享：纯函数（路径安全、隐藏规则、鉴权、MIME）。
 * Electron main 与 Vitest 共用，勿依赖 DOM / UI。
 */

export const LAN_SHARE_DEFAULT_PORT = 17890;
export const LAN_SHARE_HIDDEN_SEGMENTS = new Set(['.pixuli', '.git']);

export function normalizeRelativePath(input: string): string {
  return input.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

/** 相对路径任一段落在隐藏集合中则不可列/不可读 */
export function isHiddenRelativePath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  if (!normalized) return false;
  return normalized
    .split('/')
    .some(segment => LAN_SHARE_HIDDEN_SEGMENTS.has(segment));
}

/**
 * 将请求路径解析为工作区相对路径；越界或隐藏则返回 null。
 */
export function sanitizeShareRelativePath(
  rawPath: string | null | undefined,
): string | null {
  if (rawPath == null || rawPath === '' || rawPath === '/') return '';
  let decoded = rawPath;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  const normalized = normalizeRelativePath(decoded);
  if (normalized.split('/').some(part => part === '..' || part === '.')) {
    // 含 .. 的交给 resolve 再拦；此处先拒绝明显穿越写法
    if (normalized.split('/').includes('..')) return null;
  }
  if (isHiddenRelativePath(normalized)) return null;
  return normalized;
}

export function extractShareToken(
  url: URL,
  authorizationHeader: string | undefined,
): string | null {
  const fromQuery = url.searchParams.get('token');
  if (fromQuery) return fromQuery.trim() || null;
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  return match?.[1]?.trim() || null;
}

export function isShareTokenValid(
  expected: string,
  provided: string | null,
): boolean {
  if (!expected) return false;
  return provided === expected;
}

export function guessMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm'))
    return 'text/html; charset=utf-8';
  if (lower.endsWith('.css')) return 'text/css; charset=utf-8';
  if (lower.endsWith('.js') || lower.endsWith('.mjs'))
    return 'text/javascript; charset=utf-8';
  if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
  if (lower.endsWith('.md') || lower.endsWith('.markdown'))
    return 'text/markdown; charset=utf-8';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  return 'application/octet-stream';
}

export function createShareToken(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

export function buildShareUrls(
  port: number,
  token: string,
  addresses: string[],
): string[] {
  return addresses.map(
    ip => `http://${ip}:${port}/?token=${encodeURIComponent(token)}`,
  );
}
