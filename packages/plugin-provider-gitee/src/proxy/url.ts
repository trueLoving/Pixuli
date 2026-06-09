import { GITEE_PROXY_PATH } from '@pixuli/provider-gitee/proxy/constants';

/**
 * 将代理 URL 转换为可在外部浏览器打开的 Gitee raw URL
 */
export function getRealGiteeUrl(url: string): string {
  const marker = GITEE_PROXY_PATH;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return `https://gitee.com${url.slice(idx + marker.length)}`;
  }
  return url;
}
