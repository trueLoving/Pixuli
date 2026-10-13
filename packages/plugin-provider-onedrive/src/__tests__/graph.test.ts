import { describe, expect, it, vi } from 'vitest';
import {
  createOneDriveAuthRequest,
  exchangeOneDriveAuthCode,
  pollOneDriveDeviceCode,
  startOneDriveDeviceCode,
} from '../graph';

function jsonResponse(status: number, data: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

describe('OneDrive device code', () => {
  it('starts a device code flow', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse(200, {
        device_code: 'device',
        user_code: 'ABCD',
        verification_uri: 'https://microsoft.com/devicelogin',
        expires_in: 900,
        interval: 5,
        message: 'open the page',
      }),
    );

    const started = await startOneDriveDeviceCode('client', fetchFn);
    expect(started.userCode).toBe('ABCD');
    expect(started.deviceCode).toBe('device');
    const calls = fetchFn.mock.calls as unknown as Array<
      [RequestInfo | URL, RequestInit?]
    >;
    const body = String(calls[0]?.[1]?.body);
    expect(body).toContain('client_id=client');
    expect(body).toContain('Files.ReadWrite');
  });

  it('returns pending while the user has not finished', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse(400, { error: 'authorization_pending' }),
    );
    const result = await pollOneDriveDeviceCode('client', 'device', fetchFn);
    expect(result).toEqual({ status: 'pending', slowDown: false });
  });

  it('returns tokens when authorization completes', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse(200, {
        access_token: 'access',
        refresh_token: 'refresh',
        expires_in: 3600,
      }),
    );
    const result = await pollOneDriveDeviceCode('client', 'device', fetchFn);
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.tokens.accessToken).toBe('access');
      expect(result.tokens.refreshToken).toBe('refresh');
    }
  });
});

describe('OneDrive authorization code', () => {
  it('builds a PKCE login URL', async () => {
    const request = await createOneDriveAuthRequest({
      clientId: 'client-1',
      redirectUri: 'http://localhost:5500/onedrive/callback',
    });
    const url = new URL(request.url);
    expect(url.origin + url.pathname).toBe(
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    );
    expect(url.searchParams.get('client_id')).toBe('client-1');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:5500/onedrive/callback',
    );
    expect(url.searchParams.get('state')).toBe(request.state);
    expect(request.verifier.length).toBeGreaterThan(10);
  });

  it('exchanges the authorization code for tokens', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse(200, {
        access_token: 'access',
        refresh_token: 'refresh',
        expires_in: 3600,
      }),
    );
    const tokens = await exchangeOneDriveAuthCode(
      {
        clientId: 'client-1',
        code: 'auth-code',
        verifier: 'verifier',
        redirectUri: 'http://localhost:5500/onedrive/callback',
      },
      fetchFn,
    );
    expect(tokens.accessToken).toBe('access');
    const body = String(
      (fetchFn.mock.calls as unknown as Array<[string, RequestInit]>)[0]?.[1]
        ?.body,
    );
    expect(body).toContain('grant_type=authorization_code');
    expect(body).toContain('code=auth-code');
    expect(body).toContain('code_verifier=verifier');
  });
});
