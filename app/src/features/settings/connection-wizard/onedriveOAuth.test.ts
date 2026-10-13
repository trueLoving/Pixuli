import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exchangeOneDriveAuthCode } from '@pixuli/provider-onedrive';
import { beginOneDriveLogin, finishOneDriveRedirect } from './onedriveOAuth';

vi.mock('@pixuli/provider-onedrive', () => ({
  createOneDriveAuthRequest: vi.fn(async () => ({
    url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=client-1',
    verifier: 'verifier-1',
    state: 'state-1',
  })),
  exchangeOneDriveAuthCode: vi.fn(async () => ({
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    expiresAt: 123,
  })),
}));

describe('onedrive OAuth redirect', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(exchangeOneDriveAuthCode).mockClear();
  });

  it('stores the verifier and later exchanges the callback code', async () => {
    const url = await beginOneDriveLogin({
      clientId: 'client-1',
      redirectUri: 'http://localhost:5500/onedrive/callback',
      purpose: 'defaultSync',
    });
    expect(url).toContain('client_id=client-1');

    const result = await finishOneDriveRedirect(
      '?code=auth-code&state=state-1',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tokens.accessToken).toBe('access-1');
      expect(result.clientId).toBe('client-1');
      expect(result.purpose).toBe('defaultSync');
    }
    expect(exchangeOneDriveAuthCode).toHaveBeenCalledWith({
      clientId: 'client-1',
      code: 'auth-code',
      verifier: 'verifier-1',
      redirectUri: 'http://localhost:5500/onedrive/callback',
    });
  });

  it('rejects a callback whose state does not match', async () => {
    await beginOneDriveLogin({
      clientId: 'client-1',
      redirectUri: 'http://localhost:5500/onedrive/callback',
      purpose: 'backup',
    });
    const result = await finishOneDriveRedirect('?code=auth-code&state=other');
    expect(result).toEqual({
      ok: false,
      message: '登录状态不匹配，请重新打开 OneDrive 登录',
    });
    expect(exchangeOneDriveAuthCode).not.toHaveBeenCalled();
  });
});
