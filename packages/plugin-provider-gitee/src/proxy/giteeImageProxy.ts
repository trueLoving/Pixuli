import type { IncomingMessage, ServerResponse } from 'node:http';
import { GITEE_PROXY_PATH } from './constants.js';

const GITEE_REQUEST_HEADERS: Record<string, string> = {
  Referer: 'https://gitee.com/',
  Origin: 'https://gitee.com',
  'User-Agent': 'Pixuli-Web/1.0',
};

type ProxyResponse = ServerResponse & {
  status?(code: number): ProxyResponse;
  send?(body: unknown): void;
};

export function parseGiteeProxyRequest(requestUrl: string): {
  giteePath: string;
  queryString: string;
} {
  const [pathname, search = ''] = requestUrl.split('?');
  const escaped = GITEE_PROXY_PATH.replace(/\//g, '\\/');
  const match = pathname.match(new RegExp(`${escaped}\\/?(.*)$`));
  const giteePath = match?.[1] ? decodeURIComponent(match[1]) : '';
  const params = new URLSearchParams(search);
  params.delete('path');
  const queryString = params.toString();
  return { giteePath, queryString };
}

export async function fetchGiteeImage(
  giteePath: string,
  queryString = '',
  method = 'GET',
): Promise<Response> {
  if (!giteePath) {
    throw new ProxyError(400, 'Invalid path: gitee path is required');
  }

  const giteeUrl = `https://gitee.com/${giteePath}${
    queryString ? `?${queryString}` : ''
  }`;

  return fetch(giteeUrl, {
    method,
    redirect: 'follow',
    headers: GITEE_REQUEST_HEADERS,
  });
}

export class ProxyError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function setResponseStatus(res: ProxyResponse, status: number): void {
  if (typeof res.status === 'function') {
    res.status(status);
  } else {
    res.statusCode = status;
  }
}

function endResponse(res: ProxyResponse, body?: unknown): void {
  if (typeof res.send === 'function') {
    res.send(body);
  } else {
    res.end(body);
  }
}

function setCorsHeaders(res: ProxyResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

export async function handleGiteeImageProxy(
  req: IncomingMessage,
  res: ProxyResponse,
): Promise<void> {
  const method = req.method || 'GET';

  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    setResponseStatus(res, 405);
    res.setHeader('Content-Type', 'application/json');
    endResponse(res, JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (method === 'OPTIONS') {
    setResponseStatus(res, 200);
    setCorsHeaders(res);
    endResponse(res);
    return;
  }

  try {
    const requestUrl = req.url || '';
    let { giteePath, queryString } = parseGiteeProxyRequest(requestUrl);

    if (!giteePath && req.url) {
      try {
        const host = req.headers.host || 'localhost';
        const parsed = new URL(requestUrl, `http://${host}`);
        const pathParam = parsed.searchParams.get('path');
        if (pathParam) {
          giteePath = pathParam;
          parsed.searchParams.delete('path');
          queryString = parsed.searchParams.toString();
        }
      } catch {
        // ignore
      }
    }

    const upstream = await fetchGiteeImage(giteePath, queryString, method);

    if (!upstream.ok) {
      setResponseStatus(res, upstream.status);
      res.setHeader('Content-Type', 'application/json');
      endResponse(
        res,
        JSON.stringify({
          error: `Failed to fetch: ${upstream.status} ${upstream.statusText}`,
        }),
      );
      return;
    }

    const contentType =
      upstream.headers.get('content-type') || 'application/octet-stream';

    setResponseStatus(res, 200);
    setCorsHeaders(res);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    if (method === 'HEAD') {
      endResponse(res);
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    endResponse(res, buffer);
  } catch (error) {
    const status = error instanceof ProxyError ? error.status : 500;
    setResponseStatus(res, status);
    res.setHeader('Content-Type', 'application/json');
    endResponse(
      res,
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    );
  }
}

export function createGiteeProxyMiddleware(): (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => void {
  return (req, res, next) => {
    if (!req.url?.startsWith(GITEE_PROXY_PATH)) {
      next();
      return;
    }
    handleGiteeImageProxy(req, res).catch((err: unknown) => {
      console.error('[gitee-proxy]', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  };
}
