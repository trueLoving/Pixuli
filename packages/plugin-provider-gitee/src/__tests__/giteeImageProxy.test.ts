import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseGiteeProxyRequest,
  fetchGiteeImage,
  ProxyError,
} from '../proxy/giteeImageProxy';

describe('giteeImageProxy (REF-313)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parseGiteeProxyRequest 应解析路径与保留查询串', () => {
    const { giteePath, queryString } = parseGiteeProxyRequest(
      '/api/gitee-proxy/sakura0922/Media/raw/main/images/a.png?foo=1',
    );
    expect(giteePath).toBe('sakura0922/Media/raw/main/images/a.png');
    expect(queryString).toBe('foo=1');
  });

  it('fetchGiteeImage 空路径应抛 ProxyError 400', async () => {
    await expect(fetchGiteeImage('')).rejects.toBeInstanceOf(ProxyError);
  });

  it('fetchGiteeImage 应请求 gitee.com 并跟随重定向', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    const res = await fetchGiteeImage(
      'sakura0922/Media/raw/main/images/test.png',
    );
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://gitee.com/sakura0922/Media/raw/main/images/test.png',
      expect.objectContaining({
        redirect: 'follow',
        headers: expect.objectContaining({
          Referer: 'https://gitee.com/',
        }),
      }),
    );
  });
});
