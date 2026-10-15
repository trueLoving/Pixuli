export const GRAPH_ROOT = 'https://graph.microsoft.com/v1.0';
export const ONEDRIVE_AUTHORIZE_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
export const ONEDRIVE_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token';
export const ONEDRIVE_DEVICE_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/devicecode';
export const ONEDRIVE_SCOPE = 'Files.ReadWrite offline_access User.Read';
export const ONEDRIVE_SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024;

export interface OneDriveDeviceCodeStart {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
  message: string;
}

export interface OneDriveTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export type OneDrivePollResult =
  | { status: 'pending'; slowDown: boolean }
  | { status: 'ok'; tokens: OneDriveTokenSet }
  | { status: 'error'; message: string };

type FetchFn = typeof fetch;

export function driveItemUrl(
  drivePath: string,
  action?: 'children' | 'content' | 'delta' | 'createUploadSession',
): string {
  const encoded = drivePath
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');
  if (!encoded) {
    if (action === 'children') return `${GRAPH_ROOT}/me/drive/root/children`;
    if (action === 'delta') return `${GRAPH_ROOT}/me/drive/root/delta`;
    if (action === 'content') return `${GRAPH_ROOT}/me/drive/root/content`;
    if (action === 'createUploadSession') {
      return `${GRAPH_ROOT}/me/drive/root/createUploadSession`;
    }
    return `${GRAPH_ROOT}/me/drive/root`;
  }
  const base = `${GRAPH_ROOT}/me/drive/root:/${encoded}`;
  if (!action) return base;
  return `${base}:/${action}`;
}

function tokenSetFromPayload(data: {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
}): OneDriveTokenSet {
  if (typeof data.access_token !== 'string' || !data.access_token) {
    throw new Error('OneDrive 未返回访问令牌');
  }
  const expiresIn =
    typeof data.expires_in === 'number' ? data.expires_in : 3600;
  return {
    accessToken: data.access_token,
    refreshToken:
      typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

export async function startOneDriveDeviceCode(
  clientId: string,
  fetchFn: FetchFn = globalThis.fetch,
): Promise<OneDriveDeviceCodeStart> {
  const response = await fetchFn(ONEDRIVE_DEVICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      scope: ONEDRIVE_SCOPE,
    }),
  });
  const data = (await response.json().catch(() => null)) as {
    error?: string;
    error_description?: string;
    device_code?: string;
    user_code?: string;
    verification_uri?: string;
    expires_in?: number;
    interval?: number;
    message?: string;
  } | null;
  if (!response.ok || !data?.device_code || !data.user_code) {
    throw new Error(
      data?.error_description ||
        data?.error ||
        `无法开始设备码授权 (${response.status})`,
    );
  }
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri:
      data.verification_uri || 'https://microsoft.com/devicelogin',
    expiresIn: data.expires_in ?? 900,
    interval: data.interval ?? 5,
    message: data.message ?? '',
  };
}

export async function pollOneDriveDeviceCode(
  clientId: string,
  deviceCode: string,
  fetchFn: FetchFn = globalThis.fetch,
): Promise<OneDrivePollResult> {
  const response = await fetchFn(ONEDRIVE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: clientId,
      device_code: deviceCode,
    }),
  });
  const data = (await response.json().catch(() => null)) as {
    error?: string;
    error_description?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  } | null;
  if (data?.error === 'authorization_pending') {
    return { status: 'pending', slowDown: false };
  }
  if (data?.error === 'slow_down') {
    return { status: 'pending', slowDown: true };
  }
  if (!response.ok || !data?.access_token) {
    return {
      status: 'error',
      message:
        data?.error_description ||
        data?.error ||
        `OneDrive 授权失败 (${response.status})`,
    };
  }
  return { status: 'ok', tokens: tokenSetFromPayload(data) };
}

export async function refreshOneDriveToken(
  clientId: string,
  refreshToken: string,
  fetchFn: FetchFn = globalThis.fetch,
): Promise<OneDriveTokenSet> {
  const response = await fetchFn(ONEDRIVE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
      scope: ONEDRIVE_SCOPE,
    }),
  });
  const data = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  } | null;
  if (!response.ok || !data?.access_token) {
    throw new Error(
      data?.error_description ||
        data?.error ||
        `OneDrive 刷新令牌失败 (${response.status})`,
    );
  }
  return tokenSetFromPayload(data);
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function randomBase64Url(size: number): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return base64Url(new Uint8Array(digest));
}

export interface OneDriveAuthRequest {
  url: string;
  verifier: string;
  state: string;
}

/** PKCE 授权码链接。用户打开后在 Microsoft 登录，再回到 redirectUri。 */
export async function createOneDriveAuthRequest(input: {
  clientId: string;
  redirectUri: string;
}): Promise<OneDriveAuthRequest> {
  const verifier = randomBase64Url(32);
  const state = randomBase64Url(16);
  const challenge = await sha256Base64Url(verifier);
  const params = new URLSearchParams({
    client_id: input.clientId,
    response_type: 'code',
    redirect_uri: input.redirectUri,
    response_mode: 'query',
    scope: ONEDRIVE_SCOPE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    prompt: 'select_account',
  });
  return {
    url: `${ONEDRIVE_AUTHORIZE_URL}?${params.toString()}`,
    verifier,
    state,
  };
}

export async function exchangeOneDriveAuthCode(
  input: {
    clientId: string;
    code: string;
    verifier: string;
    redirectUri: string;
  },
  fetchFn: FetchFn = globalThis.fetch,
): Promise<OneDriveTokenSet> {
  const response = await fetchFn(ONEDRIVE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: input.clientId,
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
      code_verifier: input.verifier,
      scope: ONEDRIVE_SCOPE,
    }),
  });
  const data = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;
  if (!response.ok || !data?.access_token) {
    throw new Error(
      data?.error_description ||
        data?.error ||
        `OneDrive 授权码交换失败 (${response.status})`,
    );
  }
  return tokenSetFromPayload(data);
}

export async function validateOneDriveAccessToken(
  accessToken: string,
  fetchFn: FetchFn = globalThis.fetch,
): Promise<{ ok: boolean; login?: string; message?: string }> {
  const response = await fetchFn(`${GRAPH_ROOT}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    return { ok: false, message: `令牌无效 (${response.status})` };
  }
  const data = (await response.json().catch(() => null)) as {
    displayName?: string;
    userPrincipalName?: string;
  } | null;
  return {
    ok: true,
    login: data?.displayName || data?.userPrincipalName,
  };
}
