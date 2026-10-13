import type { ConnectionPurpose } from '@/features/source-type/connectionPurpose';
import {
  createOneDriveAuthRequest,
  exchangeOneDriveAuthCode,
  type OneDriveTokenSet,
} from '@pixuli/provider-onedrive';

export const ONEDRIVE_CALLBACK_PATH = '/onedrive/callback';
const STORAGE_KEY = 'pixuli.onedrive.oauth';

export interface OneDriveOAuthPending {
  verifier: string;
  state: string;
  redirectUri: string;
  purpose: ConnectionPurpose;
  editSourceId: string | null;
  clientId: string;
}

export function oneDriveRedirectUri(): string {
  return `${window.location.origin}${ONEDRIVE_CALLBACK_PATH}`;
}

export function readOneDriveClientId(): string {
  const value = import.meta.env.VITE_ONEDRIVE_CLIENT_ID;
  return typeof value === 'string' ? value.trim() : '';
}

export async function beginOneDriveLogin(input: {
  clientId: string;
  redirectUri: string;
  purpose: ConnectionPurpose;
  editSourceId?: string | null;
}): Promise<string> {
  const request = await createOneDriveAuthRequest({
    clientId: input.clientId,
    redirectUri: input.redirectUri,
  });
  const pending: OneDriveOAuthPending = {
    verifier: request.verifier,
    state: request.state,
    redirectUri: input.redirectUri,
    purpose: input.purpose,
    editSourceId: input.editSourceId ?? null,
    clientId: input.clientId,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  return request.url;
}

export type OneDriveLoginResult =
  | {
      ok: true;
      tokens: OneDriveTokenSet;
      clientId: string;
      purpose: ConnectionPurpose;
      editSourceId: string | null;
    }
  | { ok: false; message: string };

let inflight: Promise<OneDriveLoginResult> | null = null;

export function finishOneDriveRedirect(
  search: string,
): Promise<OneDriveLoginResult> {
  if (!inflight) {
    inflight = finishOnce(search).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function finishOnce(search: string): Promise<OneDriveLoginResult> {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const oauthError = params.get('error_description') || params.get('error');
  if (oauthError) {
    sessionStorage.removeItem(STORAGE_KEY);
    return { ok: false, message: oauthError };
  }
  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) {
    return { ok: false, message: '登录回调里没有授权码' };
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!raw) {
    return { ok: false, message: '登录状态已失效，请重新打开 OneDrive 登录' };
  }
  let pending: OneDriveOAuthPending;
  try {
    pending = JSON.parse(raw) as OneDriveOAuthPending;
  } catch {
    return { ok: false, message: '登录状态已失效，请重新打开 OneDrive 登录' };
  }
  if (pending.state !== state) {
    return { ok: false, message: '登录状态不匹配，请重新打开 OneDrive 登录' };
  }
  try {
    const tokens = await exchangeOneDriveAuthCode({
      clientId: pending.clientId,
      code,
      verifier: pending.verifier,
      redirectUri: pending.redirectUri,
    });
    return {
      ok: true,
      tokens,
      clientId: pending.clientId,
      purpose: pending.purpose,
      editSourceId: pending.editSourceId,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : '无法换取访问令牌',
    };
  }
}
