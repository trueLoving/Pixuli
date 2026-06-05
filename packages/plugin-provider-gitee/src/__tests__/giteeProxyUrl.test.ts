import { describe, it, expect } from 'vitest';
import { getRealGiteeUrl } from '../proxy/url';

describe('getRealGiteeUrl', () => {
  it('应将相对代理 URL 转为 gitee.com', () => {
    expect(
      getRealGiteeUrl('/api/gitee-proxy/owner/repo/raw/main/images/a.png'),
    ).toBe('https://gitee.com/owner/repo/raw/main/images/a.png');
  });

  it('应将桌面本地代理 URL 转为 gitee.com', () => {
    expect(
      getRealGiteeUrl(
        'http://127.0.0.1:39281/api/gitee-proxy/owner/repo/raw/main/a.png',
      ),
    ).toBe('https://gitee.com/owner/repo/raw/main/a.png');
  });
});
